<?php

namespace Database\Seeders\Business;

use App\Enums\WorkflowAction;
use App\Models\Role;
use App\Models\Workflow;
use App\Models\WorkflowStep;
use App\Models\WorkflowStepAction;
use App\Models\WorkflowStepAuthority;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ModularNonContractWorkflowSeeder extends Seeder
{
    public function run(): void
    {
        $roleMap = Role::pluck('id', 'name')->toArray();
        $staffRoleId = $roleMap['Staff'] ?? null;
        $managerRoleId = $roleMap['Manager'] ?? null;
        $vpRoleId = $roleMap['VP'] ?? null;
        $astManagerLegalRoleId = $roleMap['Ast Manager Legal'] ?? null;
        $managerLegalRoleId = $roleMap['Manager Legal'] ?? null;
        $staffLegalRoleId = $roleMap['Staff Legal'] ?? null;

        // Cleanup existing modular workflows if previously created
        $existingWfIds = Workflow::whereIn('name', [
            '[MASTER] PENGAJUAN NON KONTRAK (ORCHESTRATOR)',
            '[SUB-WF 1] PENGAJUAN NON KONTRAK - INISIASI & APPROVAL',
            '[SUB-WF 2] PENGAJUAN NON KONTRAK - TELAAH & PENUGASAN LEGAL',
            '[SUB-WF 3] PENGAJUAN NON KONTRAK - FINALISASI & PENERBITAN F2',
        ])->pluck('id')->toArray();

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

        // 1. Generate IDs first
        $masterWfId = (string) Str::uuid();
        $subWf1Id = (string) Str::uuid();
        $subWf2Id = (string) Str::uuid();
        $subWf3Id = (string) Str::uuid();

        // ----------------------------------------------------
        // SUB-WORKFLOW 1: INISIASI & APPROVAL AWAL
        // ----------------------------------------------------
        $subWf1 = Workflow::create([
            'id' => $subWf1Id,
            'name' => '[SUB-WF 1] PENGAJUAN NON KONTRAK - INISIASI & APPROVAL',
            'description' => 'Sub-alur fase inisiasi draft pengajuan non-kontrak, persetujuan manager inisiator, dan tim pajak.',
            'initiator_type' => 'role',
            'workflow_type' => 'sub_workflow',
            'parent_workflow_id' => $masterWfId,
            'is_active' => true,
            'is_default' => false,
        ]);

        if ($staffRoleId) {
            $subWf1->initiatorAuthorities()->create([
                'role_id' => $staffRoleId,
                'authority_type' => 'group',
            ]);
        }

        // Sub 1 - Step 1: Melengkapi Draft
        $s1_1 = WorkflowStep::create([
            'workflow_id' => $subWf1Id,
            'step' => 1,
            'phase' => 'f1_request',
            'approver_type' => 'custom',
            'label' => 'Melengkapi Draft Pengajuan',
            'description' => 'Inisiator melengkapi informasi dasar formulir pengajuan non kontrak.',
            'meta' => ['target_status' => 'draft'],
            'is_active' => true,
        ]);
        $s1_1->approverAuthorities()->create(['authority_type' => 'initiator']);
        $s1_1->approverAuthorities()->create(['authority_type' => 'creator']);

        $s1_1->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Kirim Pengajuan',
            'is_active' => true,
        ]);

        // Sub 1 - Step 2: Approval Manager Initiator
        $s1_2 = WorkflowStep::create([
            'workflow_id' => $subWf1Id,
            'step' => 2,
            'phase' => 'f1_request',
            'approver_type' => 'role',
            'label' => 'Approval Manager Inisiator',
            'description' => 'Persetujuan berjenjang oleh Manager dari inisiator pengajuan.',
            'meta' => ['target_status' => 'pending'],
            'is_active' => true,
        ]);
        if ($managerRoleId) {
            $s1_2->approverAuthorities()->create([
                'authority_type' => 'group',
                'role_id' => $managerRoleId,
                'department_use_initiator' => true,
            ]);
        }
        $s1_2->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Setujui Pengajuan',
            'is_active' => true,
        ]);
        $s1_2->actions()->create([
            'action_code' => WorkflowAction::REJECT,
            'alias' => 'Tolak ke Inisiator',
            'transition_config' => ['type' => 'relative', 'offset' => -1],
            'is_active' => true,
        ]);

        // Sub 1 - Step 3: Approval Team Pajak (Transition -> Sub-Workflow 2)
        $s1_3 = WorkflowStep::create([
            'workflow_id' => $subWf1Id,
            'step' => 3,
            'phase' => 'f1_request',
            'approver_type' => 'role',
            'label' => 'Approval Team Pajak',
            'description' => 'Penelaahan aspek perpajakan atas pengajuan jika ada komponen pajak.',
            'meta' => [
                'target_status' => 'in_review',
                'condition_key' => 'contract.has_tax',
                'condition_operator' => 'truthy',
                'condition_value' => null,
            ],
            'is_active' => true,
        ]);
        if ($staffRoleId) {
            $s1_3->approverAuthorities()->create(['authority_type' => 'group', 'role_id' => $staffRoleId]);
        }
        if ($managerRoleId) {
            $s1_3->approverAuthorities()->create(['authority_type' => 'group', 'role_id' => $managerRoleId]);
        }
        $s1_3->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Setujui & Alihkan ke Legal (Sub-WF 2)',
            'transition_config' => [
                'type' => 'cross_workflow',
                'workflow_id' => $subWf2Id,
                'sequence' => 1,
            ],
            'is_active' => true,
        ]);
        $s1_3->actions()->create([
            'action_code' => WorkflowAction::REJECT,
            'alias' => 'Tolak ke Draft Awal',
            'transition_config' => ['type' => 'initial_step'],
            'is_active' => true,
        ]);


        // ----------------------------------------------------
        // SUB-WORKFLOW 2: TELAAH & PENUGASAN LEGAL
        // ----------------------------------------------------
        $subWf2 = Workflow::create([
            'id' => $subWf2Id,
            'name' => '[SUB-WF 2] PENGAJUAN NON KONTRAK - TELAAH & PENUGASAN LEGAL',
            'description' => 'Sub-alur penugasan personil legal, telaah hukum, dan review VP Legal.',
            'initiator_type' => 'role',
            'workflow_type' => 'sub_workflow',
            'parent_workflow_id' => $masterWfId,
            'is_active' => true,
            'is_default' => false,
        ]);

        // Sub 2 - Step 1: Penugasan PIC Legal
        $s2_1 = WorkflowStep::create([
            'workflow_id' => $subWf2Id,
            'step' => 1,
            'phase' => 'f1_request',
            'approver_type' => 'role',
            'label' => 'Penugasan PIC Legal',
            'description' => 'Pimpinan legal menunjuk Staff/PIC Legal yang bertanggung jawab menelaah berkas.',
            'meta' => ['target_status' => 'in_review'],
            'is_active' => true,
        ]);
        if ($astManagerLegalRoleId) {
            $s2_1->approverAuthorities()->create(['authority_type' => 'group', 'role_id' => $astManagerLegalRoleId]);
        }
        if ($managerLegalRoleId) {
            $s2_1->approverAuthorities()->create(['authority_type' => 'group', 'role_id' => $managerLegalRoleId]);
        }
        $s2_1->actions()->create([
            'action_code' => WorkflowAction::ASSIGN,
            'alias' => 'Tugaskan PIC & Lanjutkan',
            'is_active' => true,
        ]);
        $s2_1->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Setujui dan Lanjutkan',
            'is_active' => true,
        ]);
        $s2_1->actions()->create([
            'action_code' => WorkflowAction::REJECT,
            'alias' => 'Kembalikan ke Inisiator (Sub-WF 1)',
            'transition_config' => [
                'type' => 'cross_workflow',
                'workflow_id' => $subWf1Id,
                'sequence' => 1,
            ],
            'is_active' => true,
        ]);

        // Sub 2 - Step 2: Review VP Legal
        $s2_2 = WorkflowStep::create([
            'workflow_id' => $subWf2Id,
            'step' => 2,
            'phase' => 'f1_request',
            'approver_type' => 'role',
            'label' => 'Review VP Legal',
            'description' => 'Penelaahan strategis oleh Vice President Legal.',
            'meta' => ['target_status' => 'in_review'],
            'is_active' => true,
        ]);
        if ($vpRoleId) {
            $s2_2->approverAuthorities()->create(['authority_type' => 'group', 'role_id' => $vpRoleId]);
        }
        $s2_2->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Setujui Review VP',
            'is_active' => true,
        ]);
        $s2_2->actions()->create([
            'action_code' => WorkflowAction::REJECT,
            'alias' => 'Kembalikan ke Penugasan PIC',
            'transition_config' => ['type' => 'relative', 'offset' => -1],
            'is_active' => true,
        ]);

        // Sub 2 - Step 3: Review & Telaah PIC
        $s2_3 = WorkflowStep::create([
            'workflow_id' => $subWf2Id,
            'step' => 3,
            'phase' => 'f1_request',
            'approver_type' => 'custom',
            'label' => 'Review & Telaah PIC',
            'description' => 'Pemeriksaan klausul & substansi dokumen oleh PIC Legal tertunjuk.',
            'meta' => ['target_status' => 'in_review'],
            'is_active' => true,
        ]);
        $s2_3->approverAuthorities()->create(['authority_type' => 'assigned_pic']);
        $s2_3->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Setujui Telaah Hukum',
            'is_active' => true,
        ]);
        $s2_3->actions()->create([
            'action_code' => WorkflowAction::REJECT,
            'alias' => 'Revisi Penugasan',
            'transition_config' => ['type' => 'absolute', 'sequence' => 1],
            'is_active' => true,
        ]);

        // Sub 2 - Step 4: Review Manager PIC (Transition -> Sub-Workflow 3)
        $s2_4 = WorkflowStep::create([
            'workflow_id' => $subWf2Id,
            'step' => 4,
            'phase' => 'f1_request',
            'approver_type' => 'role',
            'label' => 'Review Manager PIC',
            'description' => 'Final review dari pimpinan divisi Legal sebelum dokumen diterbitkan.',
            'meta' => ['target_status' => 'in_review'],
            'is_active' => true,
        ]);
        if ($astManagerLegalRoleId) {
            $s2_4->approverAuthorities()->create(['authority_type' => 'group', 'role_id' => $astManagerLegalRoleId]);
        }
        if ($managerLegalRoleId) {
            $s2_4->approverAuthorities()->create(['authority_type' => 'group', 'role_id' => $managerLegalRoleId]);
        }
        $s2_4->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Setujui & Lanjut ke Finalisasi (Sub-WF 3)',
            'transition_config' => [
                'type' => 'cross_workflow',
                'workflow_id' => $subWf3Id,
                'sequence' => 1,
            ],
            'is_active' => true,
        ]);
        $s2_4->actions()->create([
            'action_code' => WorkflowAction::REJECT,
            'alias' => 'Kembalikan ke Telaah PIC',
            'transition_config' => ['type' => 'relative', 'offset' => -1],
            'is_active' => true,
        ]);


        // ----------------------------------------------------
        // SUB-WORKFLOW 3: FINALISASI & PENERBITAN F2
        // ----------------------------------------------------
        $subWf3 = Workflow::create([
            'id' => $subWf3Id,
            'name' => '[SUB-WF 3] PENGAJUAN NON KONTRAK - FINALISASI & PENERBITAN F2',
            'description' => 'Sub-alur pembuatan formulir F2, tanda tangan digital, review akhir inisiator, dan pengarsipan.',
            'initiator_type' => 'role',
            'workflow_type' => 'sub_workflow',
            'parent_workflow_id' => $masterWfId,
            'is_active' => true,
            'is_default' => false,
        ]);

        // Sub 3 - Step 1: Generate F2 & Tanda Tangan
        $s3_1 = WorkflowStep::create([
            'workflow_id' => $subWf3Id,
            'step' => 1,
            'phase' => 'f2_review',
            'approver_type' => 'custom',
            'label' => 'Generate Dokumen F2',
            'description' => 'PIC Legal menerbitkan lembar persetujuan formal (F2) dan melakukan tanda tangan.',
            'is_active' => true,
        ]);

        if ($staffLegalRoleId) {
            $s3_1->approverAuthorities()->create(['role_id' => $staffLegalRoleId, 'authority_type' => 'group']);
        }

        $s3_1->actions()->create([
            'action_code' => WorkflowAction::SIGNATURE,
            'alias' => 'Tanda Tangan Dokumen F2',
            'transition_config' => ['type' => 'relative', 'offset' => 0],
            'is_active' => true,
        ]);
        $s3_1->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Selesai Terbitkan F2 & Lanjut',
            'is_active' => true,
        ]);
        $s3_1->actions()->create([
            'action_code' => WorkflowAction::REJECT,
            'alias' => 'Kembalikan ke Telaah PIC Legal (Sub 2)',
            'transition_config' => ['type' => 'cross_workflow', 'workflow_id' => $subWf2Id, 'sequence' => 3],
            'is_active' => true,
        ]);

        // Sub 3 - Step 2: Review Inisiator
        $s3_2 = WorkflowStep::create([
            'workflow_id' => $subWf3Id,
            'step' => 2,
            'phase' => 'f2_review',
            'approver_type' => 'custom',
            'label' => 'Review Inisiator',
            'description' => 'Inisiator memeriksa kembali hasil akhir telaah dan dokumen yang disiapkan.',
            'is_active' => true,
        ]);

        if ($staffRoleId) {
            $s3_2->approverAuthorities()->create(['role_id' => $staffRoleId, 'authority_type' => 'group']);
        }

        $s3_2->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Persetujuan Inisiator & Lanjut',
            'is_active' => true,
        ]);
        $s3_2->actions()->create([
            'action_code' => WorkflowAction::REJECT,
            'alias' => 'Revisi Form F2',
            'transition_config' => ['type' => 'relative', 'offset' => -1],
            'is_active' => true,
        ]);

        // Sub 3 - Step 3: Review PIC Legal Akhir
        $s3_3 = WorkflowStep::create([
            'workflow_id' => $subWf3Id,
            'step' => 3,
            'phase' => 'f2_review',
            'approver_type' => 'custom',
            'label' => 'Review PIC Legal Akhir',
            'description' => 'Pemeriksaan integritas berkas sebelum pengarsipan sistem.',
            'is_active' => true,
        ]);

        if ($staffLegalRoleId) {
            $s3_3->approverAuthorities()->create(['role_id' => $staffLegalRoleId, 'authority_type' => 'group']);
        }

        $s3_3->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Verifikasi Final & Selesai',
            'is_active' => true,
        ]);
        $s3_3->actions()->create([
            'action_code' => WorkflowAction::REJECT,
            'alias' => 'Kembalikan ke Final Review Legal (Sub 2)',
            'transition_config' => ['type' => 'cross_workflow', 'workflow_id' => $subWf2Id, 'sequence' => 4],
            'is_active' => true,
        ]);

        // Sub 3 - Step 4: Selesai / Pengarsipan
        $s3_4 = WorkflowStep::create([
            'workflow_id' => $subWf3Id,
            'step' => 4,
            'phase' => 'f2_review',
            'approver_type' => 'custom',
            'label' => 'Selesai & Pengarsipan',
            'description' => 'Tahapan penutupan pengajuan dan penyimpanan arsip digital.',
            'is_active' => true,
        ]);


        // ----------------------------------------------------
        // 4. MASTER WORKFLOW: ORKESTRATOR (PENGHUBUNG SEMUA FLOW)
        // ----------------------------------------------------
        $masterWf = Workflow::create([
            'id' => $masterWfId,
            'name' => '[MASTER] PENGAJUAN NON KONTRAK (ORCHESTRATOR)',
            'description' => 'Alur Kerja Utama yang mengorkestrasikan ketiga sub-alur: (1) Inisiasi & Approval, (2) Telaah Legal, dan (3) Finalisasi F2.',
            'initiator_type' => 'all',
            'workflow_type' => 'main',
            'is_active' => true,
            'is_default' => false,
        ]);

        if ($staffRoleId) {
            $masterWf->initiatorAuthorities()->create(['role_id' => $staffRoleId, 'authority_type' => 'group']);
        }
        if ($managerRoleId) {
            $masterWf->initiatorAuthorities()->create(['role_id' => $managerRoleId, 'authority_type' => 'group']);
        }

        // Master Step 1: Fase Inisiasi
        $ms1 = WorkflowStep::create([
            'workflow_id' => $masterWfId,
            'step' => 1,
            'phase' => 'f1_request',
            'approver_type' => 'custom',
            'label' => 'Fase 1: Inisiasi & Persetujuan',
            'description' => 'Mengawali proses pengajuan dan menjalankan Sub-Workflow 1.',
            'meta' => ['target_status' => 'draft'],
            'is_active' => true,
        ]);
        $ms1->approverAuthorities()->create(['authority_type' => 'initiator']);
        $ms1->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Mulai Sub-Alur 1 (Inisiasi & Pajak)',
            'transition_config' => [
                'type' => 'cross_workflow',
                'workflow_id' => $subWf1Id,
                'sequence' => 1,
            ],
            'is_active' => true,
        ]);

        // Master Step 2: Fase Telaah Legal
        $ms2 = WorkflowStep::create([
            'workflow_id' => $masterWfId,
            'step' => 2,
            'phase' => 'f1_request',
            'approver_type' => 'role',
            'label' => 'Fase 2: Telaah & Penugasan Legal',
            'description' => 'Mengorkestrasikan tahap penelaahan hukum dan telaah tim legal.',
            'meta' => ['target_status' => 'in_review'],
            'is_active' => true,
        ]);
        if ($managerLegalRoleId) {
            $ms2->approverAuthorities()->create(['authority_type' => 'group', 'role_id' => $managerLegalRoleId]);
        }
        $ms2->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Mulai Sub-Alur 2 (Legal Review)',
            'transition_config' => [
                'type' => 'cross_workflow',
                'workflow_id' => $subWf2Id,
                'sequence' => 1,
            ],
            'is_active' => true,
        ]);
        $ms2->actions()->create([
            'action_code' => WorkflowAction::REJECT,
            'alias' => 'Kembalikan ke Sub-Alur 1',
            'transition_config' => [
                'type' => 'cross_workflow',
                'workflow_id' => $subWf1Id,
                'sequence' => 1,
            ],
            'is_active' => true,
        ]);

        // Master Step 3: Fase Finalisasi & Tanda Tangan
        $ms3 = WorkflowStep::create([
            'workflow_id' => $masterWfId,
            'step' => 3,
            'phase' => 'f2_review',
            'approver_type' => 'role',
            'label' => 'Fase 3: Finalisasi & Penerbitan F2',
            'description' => 'Mengorkestrasikan penerbitan lembar F2 dan tanda tangan digital.',
            'meta' => ['target_status' => 'in_review'],
            'is_active' => true,
        ]);
        if ($astManagerLegalRoleId) {
            $ms3->approverAuthorities()->create(['authority_type' => 'group', 'role_id' => $astManagerLegalRoleId]);
        }
        $ms3->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Mulai Sub-Alur 3 (F2 & Signing)',
            'transition_config' => [
                'type' => 'cross_workflow',
                'workflow_id' => $subWf3Id,
                'sequence' => 1,
            ],
            'is_active' => true,
        ]);
        $ms3->actions()->create([
            'action_code' => WorkflowAction::REJECT,
            'alias' => 'Kembalikan ke Sub-Alur 2',
            'transition_config' => [
                'type' => 'cross_workflow',
                'workflow_id' => $subWf2Id,
                'sequence' => 1,
            ],
            'is_active' => true,
        ]);

        // Master Step 4: Selesai & Arsip
        $ms4 = WorkflowStep::create([
            'workflow_id' => $masterWfId,
            'step' => 4,
            'phase' => 'f2_review',
            'approver_type' => 'role',
            'label' => 'Fase 4: Penyelesaian & Arsip',
            'description' => 'Seluruh rangkaian alur kerja selesai dan terarsip sempurna.',
            'meta' => ['target_status' => 'archived'],
            'is_active' => true,
        ]);
    }
}
