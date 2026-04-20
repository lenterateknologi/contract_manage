<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\WorkflowStep;
use App\Models\Workflow;
use App\Models\User;

class WorkflowStepSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::firstWhere('email', 'admin@example.com') ?? User::first();
        $adminId = $admin ? $admin->id : null;

        // Clear existing steps first (force delete to avoid unique constraint issues with soft deletes)
        WorkflowStep::withTrashed()->forceDelete();

        // Get all workflows
        $workflows = Workflow::all();
        $depts = \App\Models\Department::pluck('id', 'code')->all();

        // Get a specific user for demonstration (e.g., Legal Staff)
        // Note: User has 'role' column as string
        $legalStaff = User::where('role', 'Staff')
            ->whereHas('department', fn($q) => $q->where('code', 'LGL'))
            ->first();

        foreach ($workflows as $workflow) {
            $isTax = $workflow->is_tax_involved;
            
            $steps = [
                ['role' => 'Manager', 'step' => 1, 'description' => 'Direct Supervisor Review', 'dept_code' => null, 'cond' => 'initiator_is_staff'],
            ];

            $currentStep = 2;

            if ($isTax) {
                $steps[] = ['role' => 'Manager', 'step' => $currentStep++, 'description' => 'Tax Validation Review', 'dept_code' => 'TAX', 'cond' => null];
            }

            $steps[] = ['role' => 'Manager', 'step' => $currentStep++, 'description' => 'Management Operations Review', 'dept_code' => 'MGT', 'cond' => 'initiator_not_manager'];
            $steps[] = ['role' => 'Staff', 'step' => $currentStep++, 'description' => 'Legal Compliance & Document Verification', 'dept_code' => 'LGL', 'cond' => null, 'approver_type' => 'user', 'user_id' => $legalStaff ? $legalStaff->id : null];
            $steps[] = ['role' => 'Director', 'step' => $currentStep++, 'description' => 'Final Direksi Approval', 'dept_code' => 'MGT', 'cond' => null];

            foreach ($steps as $step) {
                $ws = WorkflowStep::create([
                    'workflow_id' => $workflow->id,
                    'role' => $step['role'],
                    'step' => $step['step'],
                    'approver_type' => $step['approver_type'] ?? 'role',
                    'department_id' => ($step['dept_code'] ?? null) ? ($depts[$step['dept_code']] ?? null) : null,
                    'description' => $step['description'],
                    'condition_expression' => $step['cond'] ?? null,
                    'step_type' => 'approval',
                    'is_active' => true,
                    'created_by' => $adminId,
                    'updated_by' => $adminId,
                ]);

                if (isset($step['user_id']) && $step['user_id']) {
                    $ws->users()->attach($step['user_id']);
                }
            }
        }
    }
}
