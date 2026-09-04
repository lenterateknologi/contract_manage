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

class DynamicContractWorkflow2Seeder extends Seeder
{
    public function run(): void
    {
        $roleMap = Role::pluck('id', 'name')->toArray();
        $managerRoleId = $roleMap['Manager'] ?? null;
        $vpRoleId = $roleMap['VP'] ?? null;
        $astManagerRoleId = $roleMap['Ast Manager'] ?? null;
        $managerLegalRoleId = $roleMap['Manager Legal'] ?? null;
        $staffLegalRoleId = $roleMap['Staff Legal'] ?? null;

        $targetWf1Id = 'dcc0af6c-20a9-4bb8-8c3e-962f72d00be6';
        $wf1 = Workflow::find($targetWf1Id);

        if (! $wf1) {
            $this->command->error("Workflow 1 dengan ID {$targetWf1Id} tidak ditemukan!");
            return;
        }

        // 1. Update Workflow 1 menjadi tipe 'main'
        $wf1->update([
            'workflow_type' => 'main',
        ]);

        // 2. Siapkan Workflow 2
        $wf2Name = 'ALUR PROSES LEGAL & PENANDATANGANAN (FASE 2)';
        $existingWf2 = Workflow::where('name', $wf2Name)
            ->orWhere('parent_workflow_id', $targetWf1Id)
            ->first();

        if ($existingWf2) {
            $existingId = $existingWf2->id;
            WorkflowStepAuthority::whereIn('workflow_step_id', function ($q) use ($existingId) {
                $q->select('id')->from('m_workflow_steps')->where('workflow_id', $existingId);
            })->delete();

            WorkflowStepAction::whereIn('workflow_step_id', function ($q) use ($existingId) {
                $q->select('id')->from('m_workflow_steps')->where('workflow_id', $existingId);
            })->delete();

            WorkflowStep::where('workflow_id', $existingId)->forceDelete();
            $existingWf2->forceDelete();
        }

        $wf2Id = (string) Str::uuid();

        // 3. Buat Workflow 2
        $wf2 = Workflow::create([
            'id' => $wf2Id,
            'name' => $wf2Name,
            'description' => 'Lanjutan dari Alur Persetujuan Permohonan: Pengisian data belum lengkap oleh PIC, review Manager Legal, approval VP Legal, review Inisiator & Manager Inisiator, penentuan penandatanganan dan arsip.',
            'initiator_type' => 'role',
            'workflow_type' => 'sub_workflow',
            'parent_workflow_id' => $targetWf1Id,
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

        // =========================================================================
        // TAHAPAN WORKFLOW 2 (STEP 1 s/d STEP 7)
        // =========================================================================

        // Step 1: Pengisian Data Belum Lengkap oleh PIC Legal
        // Tombol: Setuju ("Kirim"), Tolak ("Kembalikan ke WF 1 Step 5")
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
                'workflow_id' => $targetWf1Id,
                'sequence' => 5,
            ],
            'is_active' => true,
        ]);

        // Step 2: Review Dokumen oleh Manager Legal
        // Tombol: Approve (Maju ke Step 3), Reject (Mundur ke Step 1 WF 2)
        $wf2_s2 = WorkflowStep::create([
            'workflow_id' => $wf2Id,
            'step' => 2,
            'phase' => 'f1_legal',
            'approver_type' => 'role',
            'label' => 'Review Dokumen oleh Manager Legal',
            'description' => 'Manager Legal memeriksa draf dan kelengkapan kontrak yang diajukan oleh PIC Legal.',
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

        // Step 3: Persetujuan VP Divisi Legal
        // Tombol: Approve (Maju ke Step 4), Reject (Mundur ke Step 1 WF 2)
        $wf2_s3 = WorkflowStep::create([
            'workflow_id' => $wf2Id,
            'step' => 3,
            'phase' => 'f1_legal',
            'approver_type' => 'role',
            'label' => 'Persetujuan VP Divisi Legal',
            'description' => 'Persetujuan tingkat Vice President (VP) Divisi Legal.',
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

        // Step 4: Review & Konfirmasi Inisiator / Pembuat Pengajuan
        // Tombol: Approve (Maju ke Step 5), Reject (Mundur ke Step 1 WF 2)
        $wf2_s4 = WorkflowStep::create([
            'workflow_id' => $wf2Id,
            'step' => 4,
            'phase' => 'f2_review',
            'approver_type' => 'custom',
            'label' => 'Review & Konfirmasi Inisiator',
            'description' => 'Inisiator / Pembuat pengajuan memeriksa berkas final kontrak sebelum meminta persetujuan atasan.',
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

        // Step 5: Approval Manager Inisiator
        // Tombol: Approve (Maju ke Step 6), Reject (Mundur ke Step 4)
        $wf2_s5 = WorkflowStep::create([
            'workflow_id' => $wf2Id,
            'step' => 5,
            'phase' => 'f2_review',
            'approver_type' => 'role',
            'label' => 'Persetujuan Manager Inisiator',
            'description' => 'Manager unit pemohon memberikan persetujuan final atas berkas kontrak sebelum proses penandatanganan.',
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

        // Step 6: Penentuan Pihak Penandatangan (PIC dan/atau Inisiator)
        $wf2_s6 = WorkflowStep::create([
            'workflow_id' => $wf2Id,
            'step' => 6,
            'phase' => 'f2_review',
            'approver_type' => 'custom',
            'label' => 'Penentuan Pihak Tanda Tangan (PIC / Inisiator)',
            'description' => 'PIC Legal menentukan pihak yang menandatangani berkas (PIC dan/atau Inisiator). Setelah selesai, alur kembali ke PIC untuk proses pengarsipan.',
            'meta' => ['target_status' => 'in_review'],
            'is_active' => true,
        ]);
        $wf2_s6->approverAuthorities()->create(['authority_type' => 'assigned_pic']);
        $wf2_s6->approverAuthorities()->create(['authority_type' => 'initiator']);
        $wf2_s6->actions()->create([
            'action_code' => WorkflowAction::SIGN,
            'alias' => 'Tanda Tangani Dokumen',
            'is_active' => true,
        ]);
        $wf2_s6->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Konfirmasi TTD Selesai (Lanjut ke PIC Arsip)',
            'is_active' => true,
        ]);

        // Step 7: Verifikasi & Pengarsipan Pengajuan Selesai (PIC Legal)
        $wf2_s7 = WorkflowStep::create([
            'workflow_id' => $wf2Id,
            'step' => 7,
            'phase' => 'f2_review',
            'approver_type' => 'custom',
            'label' => 'Arsipkan Pengajuan & Kontrak Selesai (PIC Legal)',
            'description' => 'PIC Legal memvalidasi seluruh kelengkapan tanda tangan dan mengarsipkan pengajuan kontrak (status active/archived).',
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
        // 4. SIAPKAN SUB-WORKFLOW 3: KLARIFIKASI & APPROVAL TAMBAHAN INISIATOR
        // =========================================================================
        $wf3Name = 'SUB-WF: KLARIFIKASI & APPROVAL TAMBAHAN INISIATOR';
        $existingWf3 = Workflow::where('name', $wf3Name)->first();

        if ($existingWf3) {
            $existingId3 = $existingWf3->id;
            WorkflowStepAuthority::whereIn('workflow_step_id', function ($q) use ($existingId3) {
                $q->select('id')->from('m_workflow_steps')->where('workflow_id', $existingId3);
            })->delete();

            WorkflowStepAction::whereIn('workflow_step_id', function ($q) use ($existingId3) {
                $q->select('id')->from('m_workflow_steps')->where('workflow_id', $existingId3);
            })->delete();

            WorkflowStep::where('workflow_id', $existingId3)->forceDelete();
            $existingWf3->forceDelete();
        }

        $wf3Id = (string) Str::uuid();

        $wf3 = Workflow::create([
            'id' => $wf3Id,
            'name' => $wf3Name,
            'description' => 'Sub-Alur Penanganan Khusus: Klarifikasi berkas pengajuan atau penambahan persetujuan (ad-hoc) oleh inisiator sebelum kembali ke Penunjukan PIC Legal.',
            'initiator_type' => 'role',
            'workflow_type' => 'sub_workflow',
            'parent_workflow_id' => $targetWf1Id,
            'is_active' => true,
            'is_default' => false,
            'is_selectable' => false,
        ]);

        if ($managerLegalRoleId) {
            $wf3->initiatorAuthorities()->create([
                'role_id' => $managerLegalRoleId,
                'authority_type' => 'group',
            ]);
        }

        // --- Sub-WF Step 1: Klarifikasi & Perbaikan Pengajuan oleh Inisiator ---
        $wf3_s1 = WorkflowStep::create([
            'workflow_id' => $wf3Id,
            'step' => 1,
            'phase' => 'f1_legal',
            'approver_type' => 'custom',
            'label' => 'Klarifikasi & Perbaikan Dokumen oleh Inisiator',
            'description' => 'Inisiator memberikan klarifikasi atau melengkapi dokumen sesuai catatan Manager Legal, lalu mengirimkannya kembali ke Penunjukan PIC Legal.',
            'meta' => ['target_status' => 'in_review'],
            'is_active' => true,
        ]);
        $wf3_s1->approverAuthorities()->create([
            'authority_type' => 'initiator',
        ]);
        $wf3_s1->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Kirim Balik ke Penunjukan PIC (WF 1 Step 5)',
            'transition_config' => [
                'type' => 'cross_workflow',
                'workflow_id' => $targetWf1Id,
                'sequence' => 5,
            ],
            'is_active' => true,
        ]);
        $wf3_s1->actions()->create([
            'action_code' => WorkflowAction::REJECT,
            'alias' => 'Batalkan Pengajuan',
            'transition_config' => ['type' => 'cancel'],
            'is_active' => true,
        ]);

        // --- Sub-WF Step 2: Penambahan & Persetujuan Approver Tambahan (Ad-Hoc) ---
        $wf3_s2 = WorkflowStep::create([
            'workflow_id' => $wf3Id,
            'step' => 2,
            'phase' => 'f1_legal',
            'approver_type' => 'custom',
            'label' => 'Persetujuan Otoritas Tambahan (Ad-Hoc Approval)',
            'description' => 'Inisiator menentukan approver tambahan yang wajib menyetujui dokumen terlebih dahulu sebelum dikembalikan ke Penunjukan PIC Legal.',
            'meta' => ['target_status' => 'in_review'],
            'is_active' => true,
        ]);
        $wf3_s2->approverAuthorities()->create([
            'authority_type' => 'initiator',
        ]);
        $wf3_s2->actions()->create([
            'action_code' => WorkflowAction::ASSIGN,
            'alias' => 'Pilih Approver Tambahan',
            'is_active' => true,
        ]);
        $wf3_s2->actions()->create([
            'action_code' => WorkflowAction::APPROVE,
            'alias' => 'Setujui & Kembalikan ke Penunjukan PIC (WF 1 Step 5)',
            'transition_config' => [
                'type' => 'cross_workflow',
                'workflow_id' => $targetWf1Id,
                'sequence' => 5,
            ],
            'is_active' => true,
        ]);
        $wf3_s2->actions()->create([
            'action_code' => WorkflowAction::REJECT,
            'alias' => 'Tolak & Kembalikan ke Inisiator (Step 1)',
            'transition_config' => [
                'type' => 'relative',
                'offset' => -1,
            ],
            'is_active' => true,
        ]);

        // =========================================================================
        // 5. UPDATE STEP 5 PADA WORKFLOW 1 (dcc0af6c-20a9-4bb8-8c3e-962f72d00be6)
        // Tambahkan 2 aksi reject tambahan yang link ke Sub-WF 3 (Step 1 & Step 2)
        // =========================================================================
        $s5 = WorkflowStep::where('workflow_id', $targetWf1Id)->where('step', 5)->first();
        if ($s5) {
            $s5->update([
                'label' => 'Penunjukan PIC Legal (Manager Menentukan PIC)',
                'description' => 'Manager Legal menunjuk PIC Legal yang bertanggung jawab, meminta klarifikasi inisiator, atau meminta approval tambahan.',
                'meta' => ['target_status' => 'in_review'],
            ]);

            // Reset dan buat ulang actions step 5
            $s5->actions()->delete();
            $s5->approverAuthorities()->delete();

            if ($managerLegalRoleId) {
                $s5->approverAuthorities()->create([
                    'authority_type' => 'group',
                    'role_id' => $managerLegalRoleId,
                ]);
            }

            // 1. Tunjuk PIC
            $s5->actions()->create([
                'action_code' => WorkflowAction::ASSIGN,
                'alias' => 'Tunjuk PIC Legal',
                'is_active' => true,
            ]);

            // 2. Setujui & Pindah ke WF 2 Step 1
            $s5->actions()->create([
                'action_code' => WorkflowAction::APPROVE,
                'alias' => 'Setujui & Lanjut ke Workflow 2 (PIC Legal)',
                'transition_config' => [
                    'type' => 'cross_workflow',
                    'workflow_id' => $wf2Id,
                    'sequence' => 1,
                ],
                'is_active' => true,
            ]);

            // 3. Kembalikan ke Draft Awal
            $s5->actions()->create([
                'action_code' => WorkflowAction::REJECT,
                'alias' => 'Kembalikan ke Draft Awal (WF 1 Step 1)',
                'transition_config' => ['type' => 'initial_step'],
                'is_active' => true,
            ]);

            // 4. Minta Klarifikasi Inisiator (Sub-WF Step 1)
            $s5->actions()->create([
                'action_code' => WorkflowAction::REJECT,
                'alias' => 'Minta Klarifikasi Inisiator (Sub-WF Step 1)',
                'transition_config' => [
                    'type' => 'cross_workflow',
                    'workflow_id' => $wf3Id,
                    'sequence' => 1,
                ],
                'is_active' => true,
            ]);

            // 5. Minta Approval Tambahan Inisiator (Sub-WF Step 2)
            $s5->actions()->create([
                'action_code' => WorkflowAction::REJECT,
                'alias' => 'Minta Approval Tambahan (Sub-WF Step 2)',
                'transition_config' => [
                    'type' => 'cross_workflow',
                    'workflow_id' => $wf3Id,
                    'sequence' => 2,
                ],
                'is_active' => true,
            ]);
        }

        // =========================================================================
        // 5. SEEDING CUSTOM / DEFAULT ACTIONS DI WORKFLOW 1 (META)
        // =========================================================================
        $customActions = [
            [
                'id' => (string) Str::uuid(),
                'action_code' => 'assign',
                'name' => 'Tentukan PIC Legal',
                'alias' => 'Tentukan PIC Legal',
                'description' => 'Aksi default untuk menugaskan PIC Legal yang bertanggung jawab mengelola kontrak ini.',
                'is_active' => true,
                'scope' => 'all_steps',
                'step_ids' => [],
                'visibility_condition' => 'always',
                'unlocks_other_actions' => false,
                'authorities' => [
                    [
                        'authority_type' => 'group',
                        'role_id' => $managerLegalRoleId,
                    ],
                ],
            ],
            [
                'id' => (string) Str::uuid(),
                'action_code' => 'signature',
                'name' => 'Tentukan Penandatangan',
                'alias' => 'Tentukan Penandatangan',
                'description' => 'Aksi untuk menentukan pihak penandatangan kontrak (Pihak 1, Pihak 2, Penandatangan).',
                'is_active' => true,
                'scope' => 'all_steps',
                'step_ids' => [],
                'visibility_condition' => 'always',
                'unlocks_other_actions' => false,
                'authorities' => [
                    [
                        'actor_type' => 'initiator',
                        'authority_type' => 'group',
                    ],
                    [
                        'authority_type' => 'group',
                        'role_id' => $managerLegalRoleId,
                    ],
                    [
                        'authority_type' => 'group',
                        'role_id' => $staffLegalRoleId,
                    ],
                ],
            ],
            [
                'id' => (string) Str::uuid(),
                'action_code' => 'forward',
                'name' => 'Tambah Approval Tambahan (Ad-Hoc)',
                'alias' => 'Tambah Approval Tambahan (Ad-Hoc)',
                'description' => 'Aksi default untuk menambahkan approver tambahan di luar alur kerja standar jika diperlukan telaah khusus.',
                'is_active' => true,
                'scope' => 'all_steps',
                'step_ids' => [],
                'visibility_condition' => 'always',
                'unlocks_other_actions' => false,
                'authorities' => [
                    [
                        'actor_type' => 'initiator',
                        'authority_type' => 'group',
                    ],
                    [
                        'authority_type' => 'group',
                        'role_id' => $managerLegalRoleId,
                    ],
                    [
                        'authority_type' => 'group',
                        'role_id' => $vpRoleId,
                    ],
                ],
            ],
        ];

        $wf1Meta = $wf1->meta ?? [];
        $wf1Meta['custom_actions'] = $customActions;
        $wf1->update([
            'meta' => $wf1Meta,
        ]);
    }
}
