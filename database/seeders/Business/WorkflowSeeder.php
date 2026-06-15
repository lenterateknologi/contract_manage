<?php

namespace Database\Seeders\Business;

use App\Models\ContractType;
use App\Models\Workflow;
use App\Models\WorkflowStep;
use App\Models\WorkflowStepRole;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class WorkflowSeeder extends Seeder
{
    public function run(): void
    {
        $workflow = Workflow::create([
            'name' => 'Alur Persetujuan Standar',
            'description' => 'Alur kerja default untuk seluruh jenis kontrak.',
            'initiator_type' => 'all',
            'is_active' => true,
            'is_default' => true,
        ]);

        $steps = [
            ['step' => 1, 'name' => 'Drafting & Review Inisiator', 'actor' => 'initiator', 'roles' => ['Staff'], 'status' => 'draft'],
            ['step' => 2, 'name' => 'Approval Manager Dept', 'actor' => 'role', 'roles' => ['Manager'], 'status' => 'in_review'],
            ['step' => 3, 'name' => 'Review Legal', 'actor' => 'role', 'roles' => ['Reviewer'], 'status' => 'in_review'],
            ['step' => 4, 'name' => 'Pengarsipan', 'actor' => 'role', 'roles' => ['Admin'], 'status' => 'archived'],
        ];

        $stepMap = [];
        foreach ($steps as $s) {
            $dbStep = WorkflowStep::create([
                'workflow_id' => $workflow->id,
                'step' => $s['step'],
                'approver_type' => $s['actor'],
                'description' => $s['name'],
                'meta' => ['target_status' => $s['status']],
                'is_active' => true,
            ]);
            $stepMap[$s['step']] = $dbStep->id;

            foreach ($s['roles'] as $roleName) {
                WorkflowStepRole::create(['workflow_step_id' => $dbStep->id, 'role_name' => $roleName]);
            }
        }

        // Add Actions & Transitions
        foreach ($stepMap as $seq => $id) {
            $nextId = $stepMap[$seq + 1] ?? null;
            $firstId = $stepMap[1];

            // Approve Action
            DB::table('m_workflow_step_actions')->insert([
                'id' => Str::uuid()->toString(),
                'workflow_step_id' => $id,
                'action_code' => 'approve',
                'next_step_id' => $nextId,
                'is_active' => true,
                'created_at' => now(),
            ]);

            // Reject Action (back to step 1)
            if ($seq > 1) {
                DB::table('m_workflow_step_actions')->insert([
                    'id' => Str::uuid()->toString(),
                    'workflow_step_id' => $id,
                    'action_code' => 'reject',
                    'next_step_id' => $firstId,
                    'is_active' => true,
                    'created_at' => now(),
                ]);
            }
        }

        // Link all contract types to this workflow
        ContractType::query()->update(['workflow_id' => $workflow->id]);
    }
}
