<?php

namespace Database\Seeders;

use App\Models\ContractType;
use App\Models\Workflow;
use App\Models\WorkflowStep;
use App\Models\WorkflowStepAction;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SubWorkflowSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            // 1. Create Sub-Workflow (Verification)
            $subWf = Workflow::create([
                'id' => Str::uuid(),
                'name' => 'VERIFIKASI PUSAT (SUB)',
                'description' => 'Proses verifikasi dokumen oleh tim pusat.',
                'contract_type_id' => null,
                'initiator_type' => 'all',
                'is_active' => true,
            ]);

            $subStep1 = WorkflowStep::create([
                'id' => Str::uuid(),
                'workflow_id' => $subWf->id,
                'step' => 1,
                'description' => 'Pengecekan Dokumen oleh Legal Staff',
                'approver_type' => 'role',
                'step_category' => 'review',
                'is_active' => true,
            ]);
            \App\Models\WorkflowStepRole::create([
                'workflow_step_id' => $subStep1->id,
                'role_name' => 'Staff',
            ]);

            $subStep2 = WorkflowStep::create([
                'id' => Str::uuid(),
                'workflow_id' => $subWf->id,
                'step' => 2,
                'description' => 'Validasi oleh Manajer Legal',
                'approver_type' => 'role',
                'step_category' => 'approval',
                'is_active' => true,
            ]);
            \App\Models\WorkflowStepRole::create([
                'workflow_step_id' => $subStep2->id,
                'role_name' => 'Manager',
            ]);

            // 2. Create Main Workflow
            $mainWf = Workflow::create([
                'id' => Str::uuid(),
                'name' => 'ALUR UTAMA DENGAN SUB-PROSES',
                'description' => 'Alur utama yang memiliki tahapan lompat ke sub-proses verifikasi.',
                'contract_type_id' => null,
                'initiator_type' => 'all',
                'is_active' => true,
            ]);

            $mainStep1 = WorkflowStep::create([
                'id' => Str::uuid(),
                'workflow_id' => $mainWf->id,
                'step' => 1,
                'description' => 'Drafting',
                'approver_type' => 'initiator',
                'step_category' => 'drafting',
                'is_active' => true,
            ]);

            $mainStep2 = WorkflowStep::create([
                'id' => Str::uuid(),
                'workflow_id' => $mainWf->id,
                'step' => 2,
                'description' => 'Review Unit Kerja',
                'approver_type' => 'role',
                'step_category' => 'approval',
                'is_active' => true,
            ]);
            \App\Models\WorkflowStepRole::create([
                'workflow_step_id' => $mainStep2->id,
                'role_name' => 'Manager',
            ]);

            $mainStep3 = WorkflowStep::create([
                'id' => Str::uuid(),
                'workflow_id' => $mainWf->id,
                'step' => 3,
                'description' => 'Persetujuan Direksi',
                'approver_type' => 'role',
                'step_category' => 'approval',
                'is_active' => true,
            ]);
            \App\Models\WorkflowStepRole::create([
                'workflow_step_id' => $mainStep3->id,
                'role_name' => 'Director',
            ]);

            // 3. Setup Actions

            // Sub-Workflow Actions
            WorkflowStepAction::create([
                'workflow_step_id' => $subStep1->id,
                'action_code' => 'approve',
                'next_step_id' => $subStep2->id,
                'alias' => 'Dokumen Sesuai',
            ]);

            WorkflowStepAction::create([
                'workflow_step_id' => $subStep2->id,
                'action_code' => 'approve',
                'next_workflow_id' => $mainWf->id,
                'next_workflow_step_id' => $mainStep3->id,
                'alias' => 'Selesai Verifikasi (Kembali ke Utama)',
            ]);

            // Main Workflow Actions
            WorkflowStepAction::create([
                'workflow_step_id' => $mainStep1->id,
                'action_code' => 'approve',
                'next_step_id' => $mainStep2->id,
                'alias' => 'Kirim Review',
            ]);

            WorkflowStepAction::create([
                'workflow_step_id' => $mainStep2->id,
                'action_code' => 'approve',
                'next_workflow_id' => $subWf->id,
                'next_workflow_step_id' => $subStep1->id,
                'alias' => 'Kirim ke Verifikasi Pusat (Jump)',
            ]);

            WorkflowStepAction::create([
                'workflow_step_id' => $mainStep3->id,
                'action_code' => 'approve',
                'next_step_id' => null, // Final
                'alias' => 'Setujui Akhir',
            ]);

            // Map to a specific Contract Type for testing
            $type = ContractType::where('code', 'PKS')->first();
            if ($type) {
                $mainWf->update(['contract_type_id' => $type->id]);
            }

            echo "Sub-Workflow Seeding completed.\n";
            echo 'Main Workflow ID: ' . $mainWf->id . "\n";
            echo 'Sub Workflow ID: ' . $subWf->id . "\n";
        });
    }
}
