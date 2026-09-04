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

class DynamicContractApprovalSeeder extends Seeder
{
    public function run(): void
    {
        $roleMap = Role::pluck('id', 'name')->toArray();
        $staffRoleId = $roleMap['Staff'] ?? null;
        $managerRoleId = $roleMap['Manager'] ?? null;
        $vpRoleId = $roleMap['VP'] ?? null;
        $astManagerRoleId = $roleMap['Ast Manager'] ?? null;
        $managerLegalRoleId = $roleMap['Manager Legal'] ?? null;
        $staffLegalRoleId = $roleMap['Staff Legal'] ?? null;

        $wf1Name = 'ALUR PERSETUJUAN KONTRAK DINAMIS (WF 1 - PERMOHONAN & PENUGASAN PIC)';
        $wf2Name = 'ALUR PROSES LEGAL & PENANDATANGANAN (WF 2 - REVIEW & SIGNING)';

        // Cleanup existing workflows if previously created
        $existingWfs = Workflow::whereIn('name', [
            $wf1Name,
            $wf2Name,
            'ALUR PERSETUJUAN KONTRAK DINAMIS (BERJENJANG & PAJAK)',
        ])->pluck('id')->toArray();

        if (!empty($existingWfs)) {
            WorkflowStepAuthority::whereIn('workflow_step_id', function ($q) use ($existingWfs) {
                $q->select('id')->from('m_workflow_steps')->whereIn('workflow_id', $existingWfs);
            })->delete();

            WorkflowStepAction::whereIn('workflow_step_id', function ($q) use ($existingWfs) {
                $q->select('id')->from('m_workflow_steps')->whereIn('workflow_id', $existingWfs);
            })->delete();

            WorkflowStep::whereIn('workflow_id', $existingWfs)->forceDelete();
            Workflow::whereIn('id', $existingWfs)->forceDelete();
        }

        $wf1Id = (string) Str::uuid();
        $wf2Id = (string) Str::uuid();

        // =========================================================================
        // WORKFLOW 2: PROSES LEGAL, REVIEW BERJENJANG & PENANDATANGANAN (WF 2)
        // Dibuat lebih awal agar UUID-nya dapat dihubungkan dari WF 1 Step 5
        // =========================================================================
        $wf2 = Workflow::create([
            'id' => $wf2Id,
            'name' => $wf2Name,
            'description' => 'Sub-alur fase 2: Kelengkapan data oleh PIC Legal, review Manager Legal, approval VP Legal, konfirmasi Inisiator & Manager Inisiator, serta penentuan pihak penandatanganan dan pengarsipan.',
            'initiator_type' => 'role',
            'workflow_type' => 'sub_workflow',
            'parent_workflow_id' => $wf1Id,
            'is_active' => true,
            'is_default' => false,
            'is_selectable' => false,
        ]);

        if ($staffLegalRoleId) {
            $wf2->initiatorAuthorities()->create([
                'role_id' => $staffLegalRoleId,
                'authority_type' => 'group',
            ]);
        }
        if ($managerLegalRoleId) {
            $wf2->initiatorAuthorities()->create([
                'role_id' => $managerLegalRoleId,
                'authority_type' => 'group',
            ]);
        }

        // WF 2 - Step 1: Pengisian Data Belum Lengkap oleh PIC Legal
        // Tombol: Setuju ("Kirim"), Tolak ("Kembalikan ke WF 1 Step 5 / Manager")
        $wf2_s1 = WorkflowStep::create([
            'workflow_id' => $wf2Id,
            'step' => 1,
            'phase' => 'f1_legal',
            'approver_type' => 'custom',
            'label' => 'Pengisian Data & Kelengkapan Berkas oleh PIC',
            'description' => 'PIC Legal yang telah ditunjuk melengkapi seluruh data klausul kontrak yang belum lengkap sebelum diajukan ke Manager Legal.',
            'meta' => ['target_status' => 'in_review'],
            'is_active' => true,
        ]);
        $wf2_s1->approverAuthorities()->create(['authority_type' => 'assigned_pic']);
        if ($staffLegalRoleId) {
            $wf2_s1->approverAuthorities()->create(['authority_type' => 'group', 'role_id' => $staffLegalRoleId]);
        }
        $wf2_s1->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Kirim ke Manager Legal',
            'target_status' => 'in_review',
            'is_active' => true,
        ]);
        $wf2_s1->actions()->create([
            'action_code' => WorkflowAction::REJECT,
            'alias' => 'Tolak & Kembalikan ke Manager (WF 1 Step 5)',
            'transition_config' => [
                'type' => 'cross_workflow',
                'workflow_id' => $wf1Id,
                'sequence' => 5,
            ],
            'is_active' => true,
        ]);

        // WF 2 - Step 2: Review Manager Legal
        // Tombol: Approve (Maju ke Step 3), Reject (Mundur ke Step 1 WF 2)
        $wf2_s2 = WorkflowStep::create([
            'workflow_id' => $wf2Id,
            'step' => 2,
            'phase' => 'f1_legal',
            'approver_type' => 'role',
            'label' => 'Review Dokumen oleh Manager Legal',
            'description' => 'Manager Legal memeriksa hasil telaah dan draf kontrak yang telah diisi oleh PIC.',
            'meta' => ['target_status' => 'in_review'],
            'is_active' => true,
        ]);
        if ($managerLegalRoleId) {
            $wf2_s2->approverAuthorities()->create(['authority_type' => 'group', 'role_id' => $managerLegalRoleId]);
        }
        if ($astManagerRoleId) {
            $wf2_s2->approverAuthorities()->create(['authority_type' => 'group', 'role_id' => $astManagerRoleId]);
        }
        $wf2_s2->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Setujui (Lanjut ke VP Legal)',
            'is_active' => true,
        ]);
        $wf2_s2->actions()->create([
            'action_code' => WorkflowAction::REJECT,
            'alias' => 'Revisi (Kembalikan ke PIC Legal)',
            'transition_config' => ['type' => 'relative', 'offset' => -1],
            'is_active' => true,
        ]);

        // WF 2 - Step 3: Approval VP Legal
        // Tombol: Approve (Maju ke Step 4), Reject (Mundur ke Step 1 WF 2)
        $wf2_s3 = WorkflowStep::create([
            'workflow_id' => $wf2Id,
            'step' => 3,
            'phase' => 'f1_legal',
            'approver_type' => 'role',
            'label' => 'Persetujuan VP Divisi Legal',
            'description' => 'Persetujuan tingkat Vice President (VP) untuk telaah aspek hukum kontrak.',
            'meta' => ['target_status' => 'in_review'],
            'is_active' => true,
        ]);
        if ($vpRoleId) {
            $wf2_s3->approverAuthorities()->create(['authority_type' => 'group', 'role_id' => $vpRoleId]);
        }
        $wf2_s3->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Setujui (Lanjut ke Review Inisiator)',
            'is_active' => true,
        ]);
        $wf2_s3->actions()->create([
            'action_code' => WorkflowAction::REJECT,
            'alias' => 'Tolak / Revisi ke PIC Legal',
            'transition_config' => ['type' => 'relative', 'offset' => -2],
            'is_active' => true,
        ]);

        // WF 2 - Step 4: Review Inisiator / Pembuat Pengajuan
        // Jika Inisiator setuju -> lanjut ke Step 5 (Approval Manager Inisiator)
        $wf2_s4 = WorkflowStep::create([
            'workflow_id' => $wf2Id,
            'step' => 4,
            'phase' => 'f2_review',
            'approver_type' => 'custom',
            'label' => 'Review & Konfirmasi Inisiator',
            'description' => 'Inisiator / Pembuat pengajuan memeriksa draf final kontrak sebelum meminta persetujuan Manager Inisiator.',
            'meta' => ['target_status' => 'in_review'],
            'is_active' => true,
        ]);
        $wf2_s4->approverAuthorities()->create(['authority_type' => 'initiator']);
        $wf2_s4->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Setujui (Lanjut ke Manager Inisiator)',
            'is_active' => true,
        ]);
        $wf2_s4->actions()->create([
            'action_code' => WorkflowAction::REJECT,
            'alias' => 'Minta Penyesuaian Klausul ke PIC',
            'transition_config' => ['type' => 'initial_step'],
            'is_active' => true,
        ]);

        // WF 2 - Step 5: Approval Manager Inisiator
        // Jika approve -> beralih kembali ke PIC Legal untuk penentuan penandatangan
        $wf2_s5 = WorkflowStep::create([
            'workflow_id' => $wf2Id,
            'step' => 5,
            'phase' => 'f2_review',
            'approver_type' => 'role',
            'label' => 'Persetujuan Manager Inisiator',
            'description' => 'Manager unit pemohon memberikan persetujuan final atas berkas kontrak sebelum ditandatangani.',
            'meta' => ['target_status' => 'in_review'],
            'is_active' => true,
        ]);
        if ($managerRoleId) {
            $wf2_s5->approverAuthorities()->create([
                'authority_type' => 'group',
                'role_id' => $managerRoleId,
                'department_use_initiator' => true,
            ]);
        }
        $wf2_s5->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Setujui & Teruskan ke PIC Penandatanganan',
            'is_active' => true,
        ]);
        $wf2_s5->actions()->create([
            'action_code' => WorkflowAction::REJECT,
            'alias' => 'Revisi (Kembali ke Inisiator)',
            'transition_config' => ['type' => 'relative', 'offset' => -1],
            'is_active' => true,
        ]);

        // WF 2 - Step 6: Penentuan Pihak Penandatangan (PIC & Inisiator)
        // PIC menentukan siapa yang tanda tangan (PIC / Inisiator / Keduanya)
        $wf2_s6 = WorkflowStep::create([
            'workflow_id' => $wf2Id,
            'step' => 6,
            'phase' => 'f2_review',
            'approver_type' => 'custom',
            'label' => 'Penentuan Pihak Tanda Tangan (PIC / Inisiator)',
            'description' => 'PIC Legal menentukan konfigurasi penandatangan (PIC dan/atau Inisiator). Setelah proses penandatanganan selesai, alur beralih ke PIC untuk arsip.',
            'meta' => ['target_status' => 'in_review'],
            'is_active' => true,
        ]);
        $wf2_s6->approverAuthorities()->create(['authority_type' => 'assigned_pic']);
        $wf2_s6->approverAuthorities()->create(['authority_type' => 'initiator']);
        $wf2_s6->actions()->create([
            'action_code' => WorkflowAction::SIGN,
            'alias' => 'Tanda Tangani & Lanjut ke PIC Arsip',
            'is_active' => true,
        ]);
        $wf2_s6->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Konfirmasi TTD Selesai (Lanjut Arsip)',
            'is_active' => true,
        ]);

        // WF 2 - Step 7: Verifikasi Akhir & Arsip Pengajuan (PIC Legal)
        $wf2_s7 = WorkflowStep::create([
            'workflow_id' => $wf2Id,
            'step' => 7,
            'phase' => 'f2_review',
            'approver_type' => 'custom',
            'label' => 'Arsipkan Pengajuan & Kontrak Selesai (PIC Legal)',
            'description' => 'PIC Legal memeriksa keabsahan seluruh tanda tangan dan mengarsipkan dokumen kontrak (status active/archived).',
            'meta' => [
                'target_status' => 'active',
                'is_archived' => true,
                'is_locked' => true,
            ],
            'is_active' => true,
        ]);
        $wf2_s7->approverAuthorities()->create(['authority_type' => 'assigned_pic']);
        if ($staffLegalRoleId) {
            $wf2_s7->approverAuthorities()->create(['authority_type' => 'group', 'role_id' => $staffLegalRoleId]);
        }
        $wf2_s7->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Arsipkan Pengajuan (Selesai)',
            'target_status' => 'active',
            'is_active' => true,
        ]);


        // =========================================================================
        // WORKFLOW 1: PERMOHONAN, APPROVAL BERJENJANG, PAJAK & PENUGASAN PIC (WF 1)
        // =========================================================================
        $wf1 = Workflow::create([
            'id' => $wf1Id,
            'name' => $wf1Name,
            'description' => 'Alur persetujuan permohonan kontrak dinamis: Draft inisiator, approval atasan, pajak kondisional, persetujuan manajemen threshold nilai, dan penunjukan PIC Legal yang menghubungkan ke Workflow 2.',
            'initiator_type' => 'role',
            'workflow_type' => 'main',
            'parent_workflow_id' => null,
            'is_active' => true,
            'is_default' => true,
            'is_selectable' => true,
        ]);

        if ($staffRoleId) {
            $wf1->initiatorAuthorities()->create([
                'role_id' => $staffRoleId,
                'authority_type' => 'group',
            ]);
        }
        if ($managerRoleId) {
            $wf1->initiatorAuthorities()->create([
                'role_id' => $managerRoleId,
                'authority_type' => 'group',
            ]);
        }

        // WF 1 - Step 1: Draft Inisiator
        $s1 = WorkflowStep::create([
            'workflow_id' => $wf1Id,
            'step' => 1,
            'phase' => 'f1_request',
            'approver_type' => 'custom',
            'label' => 'Pengajuan Draft & Kelengkapan Kontrak',
            'description' => 'Inisiator mengisi formulir draft kontrak, mengunggah berkas pendukung, atau membatalkan/menutup pengajuan.',
            'meta' => ['target_status' => 'draft'],
            'is_active' => true,
        ]);
        $s1->approverAuthorities()->create(['authority_type' => 'initiator']);
        $s1->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Ajukan Pengajuan',
            'target_status' => 'in_review',
            'is_active' => true,
        ]);
        $s1->actions()->create([
            'action_code' => WorkflowAction::REJECT,
            'alias' => 'Tutup Pengajuan',
            'target_status' => 'cancelled',
            'transition_config' => ['type' => 'cancel'],
            'is_active' => true,
        ]);

        // WF 1 - Step 2: Approval Manager Inisiator
        $s2 = WorkflowStep::create([
            'workflow_id' => $wf1Id,
            'step' => 2,
            'phase' => 'f1_request',
            'approver_type' => 'role',
            'label' => 'Persetujuan Manager Inisiator',
            'description' => 'Persetujuan awal oleh atasan / Manager unit kerja pemohon.',
            'meta' => ['target_status' => 'in_review'],
            'is_active' => true,
        ]);
        if ($managerRoleId) {
            $s2->approverAuthorities()->create([
                'authority_type' => 'group',
                'role_id' => $managerRoleId,
                'department_use_initiator' => true,
            ]);
        }
        if ($astManagerRoleId) {
            $s2->approverAuthorities()->create([
                'authority_type' => 'group',
                'role_id' => $astManagerRoleId,
                'department_use_initiator' => true,
            ]);
        }
        $s2->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Setujui Pengajuan',
            'is_active' => true,
        ]);
        $s2->actions()->create([
            'action_code' => WorkflowAction::REJECT,
            'alias' => 'Tolak / Kembalikan ke Inisiator',
            'transition_config' => ['type' => 'initial_step'],
            'is_active' => true,
        ]);

        // WF 1 - Step 3: Tim Pajak (Conditional Bypass)
        $s3 = WorkflowStep::create([
            'workflow_id' => $wf1Id,
            'step' => 3,
            'phase' => 'f1_request',
            'approver_type' => 'role',
            'label' => 'Persetujuan Tim Pajak (Tax Review)',
            'description' => 'Pemeriksaan kepatuhan perpajakan. Otomatis dilewati (bypass) jika kontrak tidak memiliki aspek perpajakan.',
            'condition_expression' => 'contract.is_tax_involved == true || meta.is_tax_involved == true || meta.has_tax == true',
            'meta' => [
                'target_status' => 'in_review',
                'bypass_when_false' => true,
                'skip_target_step' => 4,
            ],
            'is_active' => true,
        ]);
        if ($staffRoleId) {
            $s3->approverAuthorities()->create(['authority_type' => 'group', 'role_id' => $staffRoleId]);
        }
        if ($managerRoleId) {
            $s3->approverAuthorities()->create(['authority_type' => 'group', 'role_id' => $managerRoleId]);
        }
        $s3->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Setujui Pajak (Lanjut ke Manajemen)',
            'is_active' => true,
        ]);
        $s3->actions()->create([
            'action_code' => WorkflowAction::REJECT,
            'alias' => 'Revisi Pajak ke Inisiator',
            'transition_config' => ['type' => 'initial_step'],
            'is_active' => true,
        ]);

        // WF 1 - Step 4: Persetujuan Manajemen (Threshold Nilai)
        $s4 = WorkflowStep::create([
            'workflow_id' => $wf1Id,
            'step' => 4,
            'phase' => 'f1_request',
            'approver_type' => 'role',
            'label' => 'Persetujuan Manajemen (Manager / VP)',
            'description' => 'Persetujuan pimpinan manajemen. Nilai kontrak di atas Rp 500.000.000 membutuhkan persetujuan Vice President (VP).',
            'condition_expression' => 'contract.contract_value > 500000000 ? "role:VP" : "role:Manager"',
            'meta' => [
                'target_status' => 'in_review',
                'threshold_amount' => 500000000,
                'threshold_role' => 'VP',
            ],
            'is_active' => true,
        ]);
        if ($vpRoleId) {
            $s4->approverAuthorities()->create([
                'authority_type' => 'group',
                'role_id' => $vpRoleId,
            ]);
        }
        if ($managerRoleId) {
            $s4->approverAuthorities()->create([
                'authority_type' => 'group',
                'role_id' => $managerRoleId,
            ]);
        }
        $s4->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Setujui Kontrak (Lanjut Penunjukan PIC)',
            'is_active' => true,
        ]);
        $s4->actions()->create([
            'action_code' => WorkflowAction::REJECT,
            'alias' => 'Tolak / Kembalikan ke Draft Awal',
            'transition_config' => ['type' => 'initial_step'],
            'is_active' => true,
        ]);

        // WF 1 - Step 5: Penunjukan PIC Legal & Perpindahan ke Workflow 2
        // Manager menentukan PIC. Jika di-approve -> memindahkan ke WF 2 Step 1
        $s5 = WorkflowStep::create([
            'workflow_id' => $wf1Id,
            'step' => 5,
            'phase' => 'f1_legal',
            'approver_type' => 'role',
            'label' => 'Penunjukan PIC Legal (Manager Menentukan PIC)',
            'description' => 'Manager Legal menunjuk PIC Legal yang bertanggung jawab. Saat disetujui, alur berpindah ke Workflow 2 untuk proses pengisian data dan telaah lebih lanjut.',
            'meta' => ['target_status' => 'in_review'],
            'is_active' => true,
        ]);
        if ($managerLegalRoleId) {
            $s5->approverAuthorities()->create([
                'authority_type' => 'group',
                'role_id' => $managerLegalRoleId,
            ]);
        }
        $s5->actions()->create([
            'action_code' => WorkflowAction::ASSIGN,
            'alias' => 'Tunjuk PIC Legal',
            'is_active' => true,
        ]);
        $s5->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Setujui & Pindahkan ke Workflow 2 (PIC Legal)',
            'transition_config' => [
                'type' => 'cross_workflow',
                'workflow_id' => $wf2Id,
                'sequence' => 1,
            ],
            'is_active' => true,
        ]);
        $s5->actions()->create([
            'action_code' => WorkflowAction::REJECT,
            'alias' => 'Kembalikan ke Inisiator (WF 1 Step 1)',
            'transition_config' => ['type' => 'initial_step'],
            'is_active' => true,
        ]);
    }
}
