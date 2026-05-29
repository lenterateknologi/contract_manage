<?php

namespace Database\Seeders;

use App\Models\ContractType;
use App\Models\Role;
use App\Models\Workflow;
use App\Models\WorkflowStep;
use App\Models\WorkflowStepRole;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TestWorkflowSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            // 1. Ensure Master Actions exist
            $actions = [
                'approve' => 'Approve',
                'reject' => 'Reject',
                'assign' => 'Assign',
                'upload' => 'Upload',
                'review' => 'Review',
                'return' => 'Return',
                'sign' => 'Sign',
            ];

            $actionIds = [];
            foreach ($actions as $code => $name) {
                $actionIds[$code] = $code; // Use action_code directly instead of master_action_id
            }

            // 2. Get Roles
            $roles = Role::pluck('id', 'name')->toArray();

            // 3. Create a Test Contract Type
            $testType = ContractType::updateOrCreate(
                ['code' => 'TEST-WF'],
                ['name' => 'Testing Workflow Type', 'is_active' => true],
            );

            // --- WORKFLOW 1: SIMPLE APPROVAL ---
            $wf1 = Workflow::create([
                'name' => 'WF-SIMPLE: Approve & Reject',
                'description' => 'Test simple approval flow',
                'contract_type_id' => $testType->id,
                'initiator_type' => 'all',
                'is_active' => true,
            ]);

            $s1_1 = WorkflowStep::create([
                'workflow_id' => $wf1->id,
                'step' => 1,
                'description' => 'Drafting',
                'approver_type' => 'initiator',
                'step_category' => 'drafting',
            ]);

            $s1_2 = WorkflowStep::create([
                'workflow_id' => $wf1->id,
                'step' => 2,
                'description' => 'Manager Approval',
                'approver_type' => 'role',
            ]);
            WorkflowStepRole::create(['workflow_step_id' => $s1_2->id, 'role_name' => 'Manager']);

            // Actions for Step 1
            $this->createAction($s1_1->id, $actionIds['approve'], $s1_2->id);

            // Actions for Step 2
            $this->createAction($s1_2->id, $actionIds['approve'], null); // End
            $this->createAction($s1_2->id, $actionIds['reject'], $s1_1->id); // Back to start

            // --- WORKFLOW 2: COMPLEX WITH RETURN ---
            $wf2 = Workflow::create([
                'name' => 'WF-COMPLEX: Return & VP',
                'description' => 'Test complex flow with return action',
                'contract_type_id' => $testType->id,
                'initiator_type' => 'all',
                'is_active' => true,
            ]);

            $s2_1 = WorkflowStep::create(['workflow_id' => $wf2->id, 'step' => 1, 'description' => 'Drafting', 'approver_type' => 'initiator', 'step_category' => 'drafting']);
            $s2_2 = WorkflowStep::create(['workflow_id' => $wf2->id, 'step' => 2, 'description' => 'Staff Review', 'approver_type' => 'role']);
            WorkflowStepRole::create(['workflow_step_id' => $s2_2->id, 'role_name' => 'Staff']);

            $s2_3 = WorkflowStep::create(['workflow_id' => $wf2->id, 'step' => 3, 'description' => 'VP Approval', 'approver_type' => 'role']);
            WorkflowStepRole::create(['workflow_step_id' => $s2_3->id, 'role_name' => 'VP']);

            $this->createAction($s2_1->id, $actionIds['approve'], $s2_2->id);

            $this->createAction($s2_2->id, $actionIds['approve'], $s2_3->id);
            $this->createAction($s2_2->id, $actionIds['return'], $s2_1->id);

            $this->createAction($s2_3->id, $actionIds['approve'], null);
            $this->createAction($s2_3->id, $actionIds['reject'], $s2_1->id);

            // --- WORKFLOW 3: ASSIGNMENT ---
            $wf3 = Workflow::create([
                'name' => 'WF-ASSIGN: PIC Assignment',
                'description' => 'Test assignment to PIC',
                'contract_type_id' => $testType->id,
                'initiator_type' => 'all',
                'is_active' => true,
            ]);

            $s3_1 = WorkflowStep::create(['workflow_id' => $wf3->id, 'step' => 1, 'description' => 'Drafting', 'approver_type' => 'initiator', 'step_category' => 'drafting']);
            $s3_2 = WorkflowStep::create(['workflow_id' => $wf3->id, 'step' => 2, 'description' => 'Legal Manager Assign PIC', 'approver_type' => 'role']);
            WorkflowStepRole::create(['workflow_step_id' => $s3_2->id, 'role_name' => 'Manager']); // Assuming Manager in Legal

            $s3_3 = WorkflowStep::create(['workflow_id' => $wf3->id, 'step' => 3, 'description' => 'PIC Legal Review', 'approver_type' => 'assigned_pic']);

            $this->createAction($s3_1->id, $actionIds['approve'], $s3_2->id);

            // Action Assign
            DB::table('m_workflow_step_actions')->insert([
                'id' => Str::uuid()->toString(),
                'workflow_step_id' => $s3_2->id,
                'action_code' => $actionIds['assign'],
                'next_step_id' => $s3_3->id,
                'assignee_config' => json_encode(['type' => 'assigned_pic']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->createAction($s3_3->id, $actionIds['approve'], null);
            $this->createAction($s3_3->id, $actionIds['reject'], $s3_1->id);

            // --- WORKFLOW 4: SIGNING ---
            $wf4 = Workflow::create([
                'name' => 'WF-SIGNING: Digital Signature',
                'description' => 'Test digital signature flow',
                'contract_type_id' => $testType->id,
                'initiator_type' => 'all',
                'is_active' => true,
            ]);

            $s4_1 = WorkflowStep::create(['workflow_id' => $wf4->id, 'step' => 1, 'description' => 'Drafting', 'approver_type' => 'initiator', 'step_category' => 'drafting']);
            $s4_2 = WorkflowStep::create(['workflow_id' => $wf4->id, 'step' => 2, 'description' => 'CEO Approval', 'approver_type' => 'role']);
            WorkflowStepRole::create(['workflow_step_id' => $s4_2->id, 'role_name' => 'CEO']);

            $s4_3 = WorkflowStep::create([
                'workflow_id' => $wf4->id,
                'step' => 3,
                'description' => 'Signing Phase',
                'approver_type' => 'role',
                'step_category' => 'signing',
            ]);
            // Signing step usually handled by Service based on metadata but needs a step entry

            $this->createAction($s4_1->id, $actionIds['approve'], $s4_2->id);
            $this->createAction($s4_2->id, $actionIds['approve'], $s4_3->id);

            // Action Sign for Step 3
            DB::table('m_workflow_step_actions')->insert([
                'id' => Str::uuid()->toString(),
                'workflow_step_id' => $s4_3->id,
                'action_code' => $actionIds['sign'],
                'next_step_id' => null, // Final
                'signing_parties' => json_encode(['initiator', 'pic']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 4. Create Sample Contracts for each workflow
            $user = \App\Models\User::first();
            if ($user) {
                $workflows = [$wf1, $wf2, $wf3, $wf4];
                foreach ($workflows as $index => $wf) {
                    \App\Models\Contract::create([
                        'title' => 'Sample Contract for ' . $wf->name,
                        'contract_no' => 'SAMPLE-WF-' . ($index + 1),
                        'contract_type_id' => $testType->id,
                        'workflow_id' => $wf->id,
                        'status' => 'draft',
                        'created_by' => $user->id,
                        'initiated_by_id' => $user->id,
                        'description' => 'Contract for testing ' . $wf->description,
                        'metadata' => [
                            'tax_required' => false,
                            'category' => 'contract',
                            'topic' => 'perjanjian',
                        ],
                    ]);
                }
            }

            echo "Test Workflows and Sample Contracts seeded successfully.\n";
        });
    }

    private function createAction($stepId, $actionCode, $nextStepId = null)
    {
        DB::table('m_workflow_step_actions')->insert([
            'id' => Str::uuid()->toString(),
            'workflow_step_id' => $stepId,
            'action_code' => $actionCode,
            'next_step_id' => $nextStepId,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
