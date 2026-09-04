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

class ContractFlowSeeder extends Seeder
{
    public function run(): void
    {
        $roleMap = Role::pluck('id', 'name')->toArray();
        $staffRoleId = $roleMap['Staff'] ?? null;
        $managerRoleId = $roleMap['Manager'] ?? null;
        $vpRoleId = $roleMap['VP'] ?? null;
        $astManagerRoleId = $roleMap['Ast Manager'] ?? null;
        $directorRoleId = $roleMap['Director'] ?? null;
        $astManagerLegalRoleId = $roleMap['Ast Manager Legal'] ?? null;
        $managerLegalRoleId = $roleMap['Manager Legal'] ?? null;
        $staffLegalRoleId = $roleMap['Staff Legal'] ?? null;

        // Cleanup existing workflows if previously created
        $workflowNames = [
            '[MASTER] ALUR PENGAJUAN & PENGELOLAAN KONTRAK',
            '[SUB-WF 1] PERMOHONAN & VERIFIKASI AWAL (WF PATH 1)',
            '[SUB-WF 2] PROSES LEGAL, DRAFT & SIGNING (WF PATH 2)',
        ];

        $existingWfIds = Workflow::whereIn('name', $workflowNames)->pluck('id')->toArray();

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

        // 1. Generate UUIDs
        $masterWfId = (string) Str::uuid();
        $subWf1Id = (string) Str::uuid();
        $subWf2Id = (string) Str::uuid();

        // =========================================================================
        // SUB-WORKFLOW 2: PROSES LEGAL, DRAFT & SIGNING (WF PATH 2)
        // Dibuat lebih dulu agar UUID dan Step 1 bisa dijadikan target link
        // =========================================================================
        $subWf2 = Workflow::create([
            'id' => $subWf2Id,
            'name' => '[SUB-WF 2] PROSES LEGAL, DRAFT & SIGNING (WF PATH 2)',
            'description' => 'Sub-alur penugasan staf legal, penyusunan & review draft kontrak, negosiasi inisiator/vendor, penomoran, pengesahan F2, serta eksekusi penandatanganan.',
            'initiator_type' => 'role',
            'workflow_type' => 'sub_workflow',
            'parent_workflow_id' => $masterWfId,
            'is_active' => true,
            'is_default' => false,
            'is_selectable' => false,
        ]);

        if ($managerLegalRoleId) {
            $subWf2->initiatorAuthorities()->create([
                'role_id' => $managerLegalRoleId,
                'authority_type' => 'group',
            ]);
        }

        // Sub 2 - Step 1: Menentukan Assignee / PIC Staf Legal (Manajer Legal)
        $s2_1 = WorkflowStep::create([
            'workflow_id' => $subWf2Id,
            'step' => 1,
            'phase' => 'f1_request',
            'approver_type' => 'role',
            'label' => 'Penunjukan Staf Legal (Assignee)',
            'description' => 'Manajer Legal melihat daftar antrean permohonan kontrak dan menunjuk Staf Legal sebagai drafter/reviewer.',
            'meta' => ['target_status' => 'in_review'],
            'is_active' => true,
        ]);
        if ($managerLegalRoleId) {
            $s2_1->approverAuthorities()->create(['authority_type' => 'group', 'role_id' => $managerLegalRoleId]);
        }
        if ($astManagerLegalRoleId) {
            $s2_1->approverAuthorities()->create(['authority_type' => 'group', 'role_id' => $astManagerLegalRoleId]);
        }
        $s2_1->actions()->create([
            'action_code' => WorkflowAction::ASSIGN,
            'alias' => 'Tugaskan Staf Legal',
            'is_active' => true,
        ]);
        $s2_1->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Lanjut ke Penyusunan Draft',
            'is_active' => true,
        ]);
        $s2_1->actions()->create([
            'action_code' => WorkflowAction::REJECT,
            'alias' => 'Kembalikan ke Sub-WF 1 (Inisiator)',
            'transition_config' => [
                'type' => 'cross_workflow',
                'workflow_id' => $subWf1Id,
                'sequence' => 1,
            ],
            'is_active' => true,
        ]);

        // Sub 2 - Step 2: Membuat / Mereview Draft Kontrak (Staf Legal)
        $s2_2 = WorkflowStep::create([
            'workflow_id' => $subWf2Id,
            'step' => 2,
            'phase' => 'f1_request',
            'approver_type' => 'role',
            'label' => 'Penyusunan & Penelaahan Draft Kontrak',
            'description' => 'Staf Legal menyusun klausul dan draft kontrak berdasarkan permohonan yang masuk.',
            'meta' => ['target_status' => 'in_review'],
            'is_active' => true,
        ]);
        if ($staffLegalRoleId) {
            $s2_2->approverAuthorities()->create(['authority_type' => 'group', 'role_id' => $staffLegalRoleId]);
        }
        $s2_2->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Kirim Draft ke Manajer Legal',
            'is_active' => true,
        ]);
        $s2_2->actions()->create([
            'action_code' => WorkflowAction::REJECT,
            'alias' => 'Kembalikan ke Penugasan',
            'transition_config' => ['type' => 'relative', 'offset' => -1],
            'is_active' => true,
        ]);

        // Sub 2 - Step 3: Review Draft oleh Manajer Legal
        $s2_3 = WorkflowStep::create([
            'workflow_id' => $subWf2Id,
            'step' => 3,
            'phase' => 'f1_request',
            'approver_type' => 'role',
            'label' => 'Review Draft oleh Manajer Legal',
            'description' => 'Pemeriksaan kualitas hukum dan klausul kontrak oleh Manajer Legal sebelum diajukan ke Inisiator/Vendor.',
            'meta' => ['target_status' => 'in_review'],
            'is_active' => true,
        ]);
        if ($managerLegalRoleId) {
            $s2_3->approverAuthorities()->create(['authority_type' => 'group', 'role_id' => $managerLegalRoleId]);
        }
        if ($astManagerLegalRoleId) {
            $s2_3->approverAuthorities()->create(['authority_type' => 'group', 'role_id' => $astManagerLegalRoleId]);
        }
        $s2_3->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Setujui Draft (Kirim ke Inisiator)',
            'is_active' => true,
        ]);
        $s2_3->actions()->create([
            'action_code' => WorkflowAction::REJECT,
            'alias' => 'Revisi Draft (Kembali ke Staf Legal)',
            'transition_config' => ['type' => 'relative', 'offset' => -1],
            'is_active' => true,
        ]);

        // Sub 2 - Step 4: Konfirmasi Draft oleh Inisiator & Negosiasi Vendor
        $s2_4 = WorkflowStep::create([
            'workflow_id' => $subWf2Id,
            'step' => 4,
            'phase' => 'f1_request',
            'approver_type' => 'custom',
            'label' => 'Review Inisiator & Negosiasi Vendor/Buyer',
            'description' => 'Inisiator mengomunikasikan draft dengan pihak vendor/buyer hingga mencapai kesepakatan final.',
            'meta' => ['target_status' => 'in_review'],
            'is_active' => true,
        ]);
        $s2_4->approverAuthorities()->create(['authority_type' => 'initiator']);
        $s2_4->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Draft Disepakati (Lanjut Penomoran)',
            'is_active' => true,
        ]);
        $s2_4->actions()->create([
            'action_code' => WorkflowAction::REJECT,
            'alias' => 'Butuh Penyesuaian Klausul (Kembali ke Staf Legal)',
            'transition_config' => ['type' => 'relative', 'offset' => -2],
            'is_active' => true,
        ]);

        // Sub 2 - Step 5: Input Nomor Kontrak & Konfigurasi F2 (Staf Legal)
        $s2_5 = WorkflowStep::create([
            'workflow_id' => $subWf2Id,
            'step' => 5,
            'phase' => 'f2_review',
            'approver_type' => 'role',
            'label' => 'Input Nomor Kontrak & Generate F2',
            'description' => 'Staf Legal menginput nomor kontrak resmi, menentukan approver, dan generate formulir F2.',
            'meta' => ['target_status' => 'in_review'],
            'is_active' => true,
        ]);
        if ($staffLegalRoleId) {
            $s2_5->approverAuthorities()->create(['authority_type' => 'group', 'role_id' => $staffLegalRoleId]);
        }
        $s2_5->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Terbitkan F2 & Ajukan Approval',
            'is_active' => true,
        ]);

        // Sub 2 - Step 6: Persetujuan Pengesahan Dokumen F2 (Manajer Legal, VP Legal & SPV/Manajemen)
        $s2_6 = WorkflowStep::create([
            'workflow_id' => $subWf2Id,
            'step' => 6,
            'phase' => 'f2_review',
            'approver_type' => 'role',
            'label' => 'Persetujuan Dokumen F2 (Legal & Manajemen)',
            'description' => 'Persetujuan resmi formulir pengesahan F2 oleh pimpinan Legal dan Manajemen.',
            'meta' => ['target_status' => 'in_review'],
            'is_active' => true,
        ]);
        if ($managerLegalRoleId) {
            $s2_6->approverAuthorities()->create(['authority_type' => 'group', 'role_id' => $managerLegalRoleId]);
        }
        if ($vpRoleId) {
            $s2_6->approverAuthorities()->create(['authority_type' => 'group', 'role_id' => $vpRoleId]);
        }
        $s2_6->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'F2 Disetujui (Lanjut Penandatanganan)',
            'is_active' => true,
        ]);
        $s2_6->actions()->create([
            'action_code' => WorkflowAction::REJECT,
            'alias' => 'Revisi F2 (Kembali ke Staf Legal)',
            'transition_config' => ['type' => 'relative', 'offset' => -1],
            'is_active' => true,
        ]);

        // Sub 2 - Step 7: Eksekusi Penandatanganan Kontrak (TTD Internal / Eksternal) & Closing
        $s2_7 = WorkflowStep::create([
            'workflow_id' => $subWf2Id,
            'step' => 7,
            'phase' => 'f2_review',
            'approver_type' => 'role',
            'label' => 'Penandatanganan Dokumen & Closing',
            'description' => 'Pengumpulan tanda tangan basah/digital dari Direksi Internal dan Vendor/Buyer, upload dokumen fully signed, dan closing.',
            'meta' => ['target_status' => 'active'],
            'is_active' => true,
        ]);
        if ($staffLegalRoleId) {
            $s2_7->approverAuthorities()->create(['authority_type' => 'group', 'role_id' => $staffLegalRoleId]);
        }
        if ($directorRoleId) {
            $s2_7->approverAuthorities()->create(['authority_type' => 'group', 'role_id' => $directorRoleId]);
        }
        $s2_7->actions()->create([
            'action_code' => WorkflowAction::SIGN,
            'alias' => 'Unggah Dokumen Fully Signed & Selesai',
            'is_active' => true,
        ]);


        // =========================================================================
        // SUB-WORKFLOW 1: PERMOHONAN & VERIFIKASI AWAL (WF PATH 1)
        // =========================================================================
        $subWf1 = Workflow::create([
            'id' => $subWf1Id,
            'name' => '[SUB-WF 1] PERMOHONAN & VERIFIKASI AWAL (WF PATH 1)',
            'description' => 'Sub-alur penyerahan formulir permohonan, verifikasi atasan inisiator, review pajak, persetujuan manajemen, dan verifikasi manajer legal.',
            'initiator_type' => 'role',
            'workflow_type' => 'sub_workflow',
            'parent_workflow_id' => $masterWfId,
            'is_active' => true,
            'is_default' => false,
            'is_selectable' => false,
        ]);

        if ($staffRoleId) {
            $subWf1->initiatorAuthorities()->create([
                'role_id' => $staffRoleId,
                'authority_type' => 'group',
            ]);
        }

        // Sub 1 - Step 1: Inisiasi Permohonan Kontrak (Initiator)
        $s1_1 = WorkflowStep::create([
            'workflow_id' => $subWf1Id,
            'step' => 1,
            'phase' => 'f1_request',
            'approver_type' => 'custom',
            'label' => 'Mengisi & Mengirim Formulir Permohonan',
            'description' => 'Inisiator mengisi formulir, mengunggah kelengkapan dokumen pendukung, dan memilih alur persetujuan.',
            'meta' => ['target_status' => 'draft'],
            'is_active' => true,
        ]);
        $s1_1->approverAuthorities()->create(['authority_type' => 'initiator']);
        $s1_1->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Kirim Formulir Permohonan',
            'is_active' => true,
        ]);

        // Sub 1 - Step 2: Persetujuan SPV / Atasan Inisiator (SPV Initiator)
        $s1_2 = WorkflowStep::create([
            'workflow_id' => $subWf1Id,
            'step' => 2,
            'phase' => 'f1_request',
            'approver_type' => 'role',
            'label' => 'Persetujuan SPV / Atasan Inisiator',
            'description' => 'Pemeriksaan substansi awal dan kelayakan permohonan kontrak oleh atasan inisiator.',
            'meta' => ['target_status' => 'in_review'],
            'is_active' => true,
        ]);
        if ($astManagerRoleId) {
            $s1_2->approverAuthorities()->create(['authority_type' => 'group', 'role_id' => $astManagerRoleId]);
        }
        if ($managerRoleId) {
            $s1_2->approverAuthorities()->create(['authority_type' => 'group', 'role_id' => $managerRoleId]);
        }
        $s1_2->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Setujui & Teruskan ke Tax',
            'is_active' => true,
        ]);
        $s1_2->actions()->create([
            'action_code' => WorkflowAction::REJECT,
            'alias' => 'Tolak / Revisi ke Inisiator',
            'transition_config' => ['type' => 'initial_step'],
            'is_active' => true,
        ]);

        // Sub 1 - Step 3: Telaah & Persetujuan Pajak (Tax)
        $s1_3 = WorkflowStep::create([
            'workflow_id' => $subWf1Id,
            'step' => 3,
            'phase' => 'f1_request',
            'approver_type' => 'role',
            'label' => 'Telaah & Evaluasi Pajak (Tax)',
            'description' => 'Pemeriksaan kepatuhan perpajakan (apabila ada aspek transaksi kena pajak).',
            'meta' => ['target_status' => 'in_review'],
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
            'alias' => 'Setujui Pajak (Lanjut ke Manajemen)',
            'is_active' => true,
        ]);
        $s1_3->actions()->create([
            'action_code' => WorkflowAction::REJECT,
            'alias' => 'Revisi Pajak ke Inisiator',
            'transition_config' => ['type' => 'initial_step'],
            'is_active' => true,
        ]);

        // Sub 1 - Step 4: Persetujuan Manajemen (Manajemen)
        $s1_4 = WorkflowStep::create([
            'workflow_id' => $subWf1Id,
            'step' => 4,
            'phase' => 'f1_request',
            'approver_type' => 'role',
            'label' => 'Persetujuan Manajemen Unit',
            'description' => 'Persetujuan tingkat manajemen unit kerja pemohon kontrak.',
            'meta' => ['target_status' => 'in_review'],
            'is_active' => true,
        ]);
        if ($managerRoleId) {
            $s1_4->approverAuthorities()->create(['authority_type' => 'group', 'role_id' => $managerRoleId]);
        }
        if ($vpRoleId) {
            $s1_4->approverAuthorities()->create(['authority_type' => 'group', 'role_id' => $vpRoleId]);
        }
        $s1_4->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Setujui (Lanjut ke Verifikasi Legal)',
            'is_active' => true,
        ]);
        $s1_4->actions()->create([
            'action_code' => WorkflowAction::REJECT,
            'alias' => 'Kembalikan untuk Revisi',
            'transition_config' => ['type' => 'initial_step'],
            'is_active' => true,
        ]);

        // Sub 1 - Step 5: Review Kelengkapan & Persyaratan Dokumen (Manajer Legal)
        $s1_5 = WorkflowStep::create([
            'workflow_id' => $subWf1Id,
            'step' => 5,
            'phase' => 'f1_request',
            'approver_type' => 'role',
            'label' => 'Review Kelengkapan Dokumen (Manajer Legal)',
            'description' => 'Verifikasi dokumen legal & administrasi. Jika lengkap, alur beralih ke Sub-WF 2 (Proses Legal).',
            'meta' => ['target_status' => 'in_review'],
            'is_active' => true,
        ]);
        if ($managerLegalRoleId) {
            $s1_5->approverAuthorities()->create(['authority_type' => 'group', 'role_id' => $managerLegalRoleId]);
        }
        if ($astManagerLegalRoleId) {
            $s1_5->approverAuthorities()->create(['authority_type' => 'group', 'role_id' => $astManagerLegalRoleId]);
        }

        // Cross-workflow connection ke Sub-WF 2 Step 1
        $s1_5->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Lengkap & Teruskan ke Sub-WF 2 (Proses Legal)',
            'transition_config' => [
                'type' => 'cross_workflow',
                'workflow_id' => $subWf2Id,
                'sequence' => 1,
            ],
            'is_active' => true,
        ]);
        $s1_5->actions()->create([
            'action_code' => WorkflowAction::REJECT,
            'alias' => 'Dokumen Belum Lengkap (Revisi)',
            'transition_config' => ['type' => 'initial_step'],
            'is_active' => true,
        ]);


        // =========================================================================
        // WORKFLOW UTAMA (MASTER ORCHESTRATOR - DENGAN STEP PENGHUBUNG)
        // =========================================================================
        $masterWf = Workflow::create([
            'id' => $masterWfId,
            'name' => '[MASTER] ALUR PENGAJUAN & PENGELOLAAN KONTRAK',
            'description' => 'Orchestrator utama yang menghubungkan seluruh siklus kontrak dari Permohonan (Sub-WF 1) hingga Proses Legal & Penandatanganan (Sub-WF 2).',
            'initiator_type' => 'role',
            'workflow_type' => 'main',
            'parent_workflow_id' => null,
            'is_active' => true,
            'is_default' => true,
            'is_selectable' => true,
        ]);

        if ($staffRoleId) {
            $masterWf->initiatorAuthorities()->create([
                'role_id' => $staffRoleId,
                'authority_type' => 'group',
            ]);
        }
        if ($managerRoleId) {
            $masterWf->initiatorAuthorities()->create([
                'role_id' => $managerRoleId,
                'authority_type' => 'group',
            ]);
        }

        // Master Step 1: Gerbang Transisi Menuju Sub-Workflow 2 (Proses Legal & Signing)
        $ms1 = WorkflowStep::create([
            'workflow_id' => $masterWfId,
            'step' => 1,
            'phase' => 'f1_legal',
            'approver_type' => 'role',
            'label' => 'Gerbang Transisi ke Sub-Workflow 2 (Proses Legal)',
            'description' => 'Step orkestrator master untuk mengakses dan mendelegasikan alur ke Sub-Workflow 2 (Penugasan Legal, Draft & Penandatanganan).',
            'meta' => ['target_status' => 'in_review'],
            'is_active' => true,
        ]);
        if ($managerLegalRoleId) {
            $ms1->approverAuthorities()->create(['authority_type' => 'group', 'role_id' => $managerLegalRoleId]);
        }
        $ms1->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Lanjut ke Sub-WF 2 (Proses Legal)',
            'transition_config' => [
                'type' => 'cross_workflow',
                'workflow_id' => $subWf2Id,
                'sequence' => 1,
            ],
            'is_active' => true,
        ]);
        $ms1->actions()->create([
            'action_code' => WorkflowAction::REJECT,
            'alias' => 'Kembalikan ke Sub-WF 1',
            'transition_config' => [
                'type' => 'cross_workflow',
                'workflow_id' => $subWf1Id,
                'sequence' => 1,
            ],
            'is_active' => true,
        ]);
    }
}
