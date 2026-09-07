<?php

namespace Database\Seeders\Business;

use App\Enums\WorkflowAction;
use App\Models\ContractType;
use App\Models\Role;
use App\Models\Workflow;
use App\Models\WorkflowStep;
use App\Models\WorkflowStepAction;
use App\Models\WorkflowStepAuthority;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class TestingPicWorkflowSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Membuat alur pengujian penugasan PIC:
     * - Step 1: Pengajuan Inisiator (Approver: Initiator) -> Kirim Pengajuan (+1 ke Step 2).
     * - Step 2: Penugasan PIC Legal (Approver: Manager Legal / Manager) ->
     *           * Action 'assign' (Tugaskan PIC Legal) dengan transisi 'stay' (offset: 0, tanpa geser langkah & status).
     *           * Action 'approve' (Setujui & Lanjutkan ke PIC) (+1 ke Step 3).
     *           * Action 'reject' (Kembalikan ke Inisiator) (-1 ke Step 1).
     * - Step 3: Review Dokumen oleh PIC yang Ditugaskan (Approver: assigned_pic) ->
     *           * Action 'approve' (Selesai Review PIC) (+1 ke Step 4).
     *           * Action 'reject' (Kembalikan ke Manager Legal) (-1 ke Step 2).
     * - Step 4: Persetujuan Final Management (Approver: VP / Director) ->
     *           * Action 'approve' (Setujui Final & Selesai).
     *           * Action 'reject' (Tolak ke Awal).
     */
    public function run(): void
    {
        $roleMap = Role::pluck('id', 'name')->toArray();
        $managerLegalRoleId = $roleMap['Manager Legal'] ?? ($roleMap['Manager'] ?? null);
        $vpRoleId = $roleMap['VP'] ?? ($roleMap['Director'] ?? null);

        $wfName = 'Testing Workflow Penugasan PIC';
        $contractTypeCode = 'TEST-ASSIGN-PIC';
        $contractTypeName = 'Testing Penugasan PIC';

        // 1. Cleanup workflow lama jika ada
        $existingWfIds = Workflow::where('name', $wfName)->pluck('id')->toArray();
        if (! empty($existingWfIds)) {
            WorkflowStepAuthority::whereIn('workflow_step_id', function ($q) use ($existingWfIds) {
                $q->select('id')->from('m_workflow_steps')->whereIn('workflow_id', $existingWfIds);
            })->delete();

            WorkflowStepAction::whereIn('workflow_step_id', function ($q) use ($existingWfIds) {
                $q->select('id')->from('m_workflow_steps')->whereIn('workflow_id', $existingWfIds);
            })->delete();

            WorkflowStep::whereIn('workflow_id', $existingWfIds)->forceDelete();
            Workflow::whereIn('id', $existingWfIds)->forceDelete();
        }

        $wfId = (string) Str::uuid();

        // 2. Buat Tipe Kontrak untuk testing PIC
        $contractType = ContractType::updateOrCreate(
            ['code' => $contractTypeCode],
            [
                'name' => $contractTypeName,
                'description' => 'Tipe pengajuan kontrak untuk uji coba alur penugasan PIC (Person in Charge).',
                'is_active' => true,
                'f1_input_mechanism' => 'upload_manual',
                'f2_input_mechanism' => 'upload_manual',
                'contract_input_mechanism' => 'upload_manual',
            ]
        );

        // 3. Buat Workflow Utama
        $wf = Workflow::create([
            'id' => $wfId,
            'name' => $wfName,
            'description' => 'Alur kerja pengujian penugasan PIC: Step 2 menugaskan PIC (stay), Step 3 di-approve khusus oleh PIC yang ditugaskan.',
            'initiator_type' => 'all',
            'workflow_type' => 'main',
            'is_active' => true,
            'is_default' => false,
            'is_selectable' => true,
            'contract_type_id' => $contractType->id,
            'meta' => [
                'contract_type_ids' => [$contractType->id],
                'custom_actions' => [
                    [
                        'id' => 'action_assign_pic',
                        'action_code' => 'assign',
                        'name' => 'Tentukan / Ganti PIC',
                        'alias' => 'Tentukan / Ganti PIC',
                        'description' => 'Aksi global untuk menugaskan atau mengubah PIC (Person in Charge) penanggung jawab kontrak.',
                        'is_active' => true,
                        'scope' => 'all_steps',
                        'step_ids' => [],
                        'target_step_mode' => 'current_step',
                        'target_step_position' => 'at',
                        'visibility_condition' => 'always',
                        'unlocks_other_actions' => false,
                        'authorities' => [
                            ['authority_type' => 'custom', 'user_id' => 'initiator'],
                            ['authority_type' => 'role', 'role_id' => $managerLegalRoleId],
                        ],
                        'eligible_personnel' => [],
                    ],
                ],
            ],
        ]);

        $contractType->update(['workflow_id' => $wf->id]);

        // Step 1: Pengajuan Inisiator
        $step1 = WorkflowStep::create([
            'id' => (string) Str::uuid(),
            'workflow_id' => $wfId,
            'step' => 1,
            'phase' => 'f1_request',
            'approver_type' => 'initiator',
            'label' => 'Pengajuan Draft Inisiator',
            'description' => 'Inisiator melengkapi data pengajuan kontrak awal.',
            'meta' => ['target_status' => 'draft'],
            'is_mandatory' => true,
            'is_active' => true,
        ]);
        $step1->approverAuthorities()->create(['authority_type' => 'initiator']);
        $step1->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Kirim Pengajuan',
            'target_status' => 'in_review',
            'transition_config' => ['type' => 'relative', 'offset' => 1],
            'is_active' => true,
        ]);

        // Step 2: Penugasan PIC Legal
        $step2 = WorkflowStep::create([
            'id' => (string) Str::uuid(),
            'workflow_id' => $wfId,
            'step' => 2,
            'phase' => 'in_review',
            'approver_type' => 'role',
            'role_id' => $managerLegalRoleId,
            'label' => 'Penugasan PIC Legal',
            'description' => 'Manager Legal menunjuk staff PIC penanggung jawab review kontrak.',
            'meta' => ['target_status' => 'in_review'],
            'is_mandatory' => true,
            'is_active' => true,
        ]);
        if ($managerLegalRoleId) {
            $step2->approverAuthorities()->create([
                'authority_type' => 'role',
                'role_id' => $managerLegalRoleId,
            ]);
        }

        // Action 1 in Step 2: Tugaskan PIC (Stay on current step, no status change)
        $step2->actions()->create([
            'action_code' => WorkflowAction::ASSIGN,
            'alias' => 'Tugaskan PIC Legal',
            'description' => 'Menetapkan PIC penanggung jawab tanpa memindahkan tahapan alur.',
            'target_status' => null,
            'transition_config' => ['type' => 'relative', 'offset' => 0],
            'is_active' => true,
        ]);

        // Action 2 in Step 2: Setujui & Lanjutkan ke PIC
        $step2->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Setujui & Lanjutkan ke PIC',
            'target_status' => 'in_review',
            'transition_config' => ['type' => 'relative', 'offset' => 1],
            'is_active' => true,
        ]);

        // Action 3 in Step 2: Tolak ke Inisiator
        $step2->actions()->create([
            'action_code' => WorkflowAction::REJECT,
            'alias' => 'Kembalikan ke Inisiator',
            'target_status' => 'draft',
            'transition_config' => ['type' => 'relative', 'offset' => -1],
            'is_active' => true,
        ]);

        // Step 3: Review Dokumen oleh PIC yang Ditugaskan
        $step3 = WorkflowStep::create([
            'id' => (string) Str::uuid(),
            'workflow_id' => $wfId,
            'step' => 3,
            'phase' => 'in_review',
            'approver_type' => 'assigned_pic',
            'label' => 'Review Dokumen oleh PIC Ditugaskan',
            'description' => 'Pemeriksaan klausul dan kelengkapan dokumen oleh PIC yang telah ditunjuk.',
            'meta' => ['target_status' => 'in_review'],
            'is_mandatory' => true,
            'is_active' => true,
        ]);
        $step3->approverAuthorities()->create(['authority_type' => 'assigned_pic']);

        // Action 1 in Step 3: Selesai Review PIC
        $step3->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Selesai Review PIC',
            'target_status' => 'in_review',
            'transition_config' => ['type' => 'relative', 'offset' => 1],
            'is_active' => true,
        ]);

        // Action 2 in Step 3: Kembalikan ke Manager Legal
        $step3->actions()->create([
            'action_code' => WorkflowAction::REJECT,
            'alias' => 'Kembalikan ke Manager Legal',
            'target_status' => 'in_review',
            'transition_config' => ['type' => 'relative', 'offset' => -1],
            'is_active' => true,
        ]);

        // Step 4: Persetujuan Final Management
        $step4 = WorkflowStep::create([
            'id' => (string) Str::uuid(),
            'workflow_id' => $wfId,
            'step' => 4,
            'phase' => 'in_review',
            'approver_type' => 'role',
            'role_id' => $vpRoleId,
            'label' => 'Persetujuan Final Management',
            'description' => 'Persetujuan akhir sebelum kontrak difinalisasi atau diarsipkan.',
            'meta' => ['target_status' => 'approved'],
            'is_mandatory' => true,
            'is_active' => true,
        ]);
        if ($vpRoleId) {
            $step4->approverAuthorities()->create([
                'authority_type' => 'role',
                'role_id' => $vpRoleId,
            ]);
        }

        $step4->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Setujui Final Kontrak',
            'target_status' => 'approved',
            'transition_config' => ['type' => 'relative', 'offset' => 1],
            'is_active' => true,
        ]);

        $step4->actions()->create([
            'action_code' => WorkflowAction::REJECT,
            'alias' => 'Tolak Pengajuan',
            'target_status' => 'revision',
            'transition_config' => ['type' => 'initial_step'],
            'is_active' => true,
        ]);

        $this->command->info("Workflow testing PIC berhasil dibuat: {$wfName} (ID: {$wfId})");
    }
}
