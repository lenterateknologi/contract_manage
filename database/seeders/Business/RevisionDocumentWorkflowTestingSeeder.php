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

class RevisionDocumentWorkflowTestingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Membuat alur:
     * 1. Sub-Workflow Revisi Dokumen:
     *    - Step 1: Submit Revisi (Inisiator mengunggah revisi, tombol Approve kembali ke Step 2 Workflow Utama).
     * 2. Workflow Utama Testing:
     *    - Step 1: Pengajuan Inisiator (Draft -> Kirim Pengajuan / Approve menuju Step 2).
     *    - Step 2: Review / Approval (Approver/Manager -> Tombol Approve untuk menyetujui, Tombol Tolak mengarahkan ke Sub-Workflow Revisi Step 1).
     * 3. Tipe Kontrak: Testing Revisi Dokumen (TEST-REV-DOC) dengan upload manual/digital.
     */
    public function run(): void
    {
        $roleMap = Role::pluck('id', 'name')->toArray();
        $managerRoleId = $roleMap['Manager'] ?? null;

        $mainWfName = 'Testing Workflow Revisi Dokumen (Utama)';
        $subWfName = 'Testing Sub-Workflow Revisi Dokumen';
        $contractTypeCode = 'TEST-REV-DOC';
        $contractTypeName = 'Testing Revisi Dokumen';

        // 1. Cleanup workflow lama jika ada
        $existingWfIds = Workflow::whereIn('name', [$mainWfName, $subWfName])->pluck('id')->toArray();
        if (!empty($existingWfIds)) {
            WorkflowStepAuthority::whereIn('workflow_step_id', function ($q) use ($existingWfIds) {
                $q->select('id')->from('m_workflow_steps')->whereIn('workflow_id', $existingWfIds);
            })->delete();

            WorkflowStepAction::whereIn('workflow_step_id', function ($q) use ($existingWfIds) {
                $q->select('id')->from('m_workflow_steps')->whereIn('workflow_id', $existingWfIds);
            })->delete();

            WorkflowStep::whereIn('workflow_id', $existingWfIds)->forceDelete();
            Workflow::whereIn('id', $existingWfIds)->forceDelete();
        }

        $mainWfId = (string) Str::uuid();
        $subWfId = (string) Str::uuid();

        // 2. Buat Sub-Workflow: Testing Sub-Workflow Revisi Dokumen
        $subWf = Workflow::create([
            'id' => $subWfId,
            'name' => $subWfName,
            'description' => 'Sub-workflow untuk proses perbaikan/revisi dokumen saat permohonan ditolak.',
            'initiator_type' => 'all',
            'workflow_type' => 'sub_workflow',
            'parent_workflow_id' => $mainWfId,
            'is_active' => true,
            'is_default' => false,
            'is_selectable' => false,
        ]);

        $subWfStep1 = WorkflowStep::create([
            'id' => (string) Str::uuid(),
            'workflow_id' => $subWfId,
            'step' => 1,
            'phase' => 'f1_request',
            'approver_type' => 'initiator',
            'label' => 'Submit Revisi Dokumen',
            'description' => 'Inisiator mengunggah dokumen hasil revisi dan mengirim ulang untuk di-review.',
            'meta' => ['target_status' => 'revision'],
            'is_mandatory' => true,
            'is_active' => true,
        ]);

        $subWfStep1->approverAuthorities()->create([
            'authority_type' => 'initiator',
        ]);

        // Action Approve pada Sub-Workflow Revisi mengembalikan kontrak ke Step 2 Workflow Utama
        $subWfStep1->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Kirim Hasil Revisi',
            'target_status' => 'in_review',
            'transition_config' => [
                'type' => 'cross_workflow',
                'workflow_id' => $mainWfId,
                'sequence' => 2,
            ],
            'is_active' => true,
        ]);

        // 3. Buat Workflow Utama: Testing Workflow Revisi Dokumen (Utama)
        $mainWf = Workflow::create([
            'id' => $mainWfId,
            'name' => $mainWfName,
            'description' => 'Workflow utama dengan tahapan Inisiasi -> Review & Approval.',
            'initiator_type' => 'all',
            'workflow_type' => 'main',
            'is_active' => true,
            'is_default' => false,
            'is_selectable' => true,
        ]);

        // Step 1: Pengajuan Inisiator
        $mainWfStep1 = WorkflowStep::create([
            'id' => (string) Str::uuid(),
            'workflow_id' => $mainWfId,
            'step' => 1,
            'phase' => 'f1_request',
            'approver_type' => 'initiator',
            'label' => 'Pengajuan Dokumen',
            'description' => 'Inisiator melengkapi data dan mengunggah dokumen awal.',
            'meta' => ['target_status' => 'draft'],
            'is_mandatory' => true,
            'is_active' => true,
        ]);

        $mainWfStep1->approverAuthorities()->create([
            'authority_type' => 'initiator',
        ]);

        $mainWfStep1->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Kirim Pengajuan',
            'target_status' => 'in_review',
            'is_active' => true,
        ]);

        // Step 2: Review & Approval (Bisa Menyetujui atau Menolak ke Sub-Workflow Revisi)
        $mainWfStep2 = WorkflowStep::create([
            'id' => (string) Str::uuid(),
            'workflow_id' => $mainWfId,
            'step' => 2,
            'phase' => 'f1_request',
            'approver_type' => $managerRoleId ? 'role' : 'initiator',
            'label' => 'Review & Approval Dokumen',
            'description' => 'Pemeriksaan dokumen kontrak. Approver dapat menyetujui atau menolak untuk meminta revisi.',
            'meta' => ['target_status' => 'in_review'],
            'is_mandatory' => true,
            'is_active' => true,
        ]);

        if ($managerRoleId) {
            $mainWfStep2->approverAuthorities()->create([
                'authority_type' => 'role',
                'role_id' => $managerRoleId,
            ]);
        } else {
            $mainWfStep2->approverAuthorities()->create([
                'authority_type' => 'initiator',
            ]);
        }

        // Action APPROVE pada Step 2: Setujui Dokumen (Final / Selesai)
        $mainWfStep2->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Setujui Dokumen',
            'target_status' => 'approved',
            'is_active' => true,
        ]);

        // Action REJECT pada Step 2: Tolak & Arahkan ke Sub-Workflow Revisi Dokumen Step 1
        $mainWfStep2->actions()->create([
            'action_code' => WorkflowAction::REJECT,
            'alias' => 'Minta Revisi Dokumen',
            'target_status' => 'revision',
            'transition_config' => [
                'type' => 'cross_workflow',
                'workflow_id' => $subWfId,
                'sequence' => 1,
            ],
            'is_active' => true,
        ]);

        // 4. Buat / Update Tipe Kontrak khusus Testing dengan mekanisme upload dokumen manual (digital)
        $contractType = ContractType::updateOrCreate(
            ['code' => $contractTypeCode],
            [
                'name' => $contractTypeName,
                'description' => 'Tipe kontrak untuk testing proses revisi dokumen via sub-workflow.',
                'workflow_id' => $mainWfId,
                'f1_input_mechanism' => 'digital',
                'f2_input_mechanism' => 'digital',
                'contract_input_mechanism' => 'digital',
                'is_active' => true,
            ]
        );

        // Update meta workflow utama
        $mainWf->update([
            'contract_type_id' => $contractType->id,
            'meta' => [
                'contract_type_ids' => [$contractType->id],
            ],
        ]);

        $this->command->info("Workflow & Sub-Workflow berhasil diupdate!");
        $this->command->line("- Tipe Kontrak: {$contractTypeName} ({$contractTypeCode})");
        $this->command->line("- Workflow Utama: {$mainWfName} (ID: {$mainWfId})");
        $this->command->line("    Step 1: Pengajuan Dokumen (Initiator -> Kirim Pengajuan)");
        $this->command->line("    Step 2: Review & Approval (Setujui | Tolak -> Sub-Workflow Revisi)");
        $this->command->line("- Sub-Workflow: {$subWfName} (ID: {$subWfId})");
        $this->command->line("    Step 1: Submit Revisi Dokumen (Inisiator -> Kirim Hasil Revisi -> Kembali ke Step 2)");
    }
}
