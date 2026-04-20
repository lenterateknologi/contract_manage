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

        foreach ($workflows as $workflow) {
            $steps = [];
            
            if ($workflow->name === 'IT Procurement Workflow') {
                $steps = [
                    ['role' => 'Manager', 'step' => 1, 'description' => 'IT Department Review', 'dept_code' => 'ITC'],
                    ['role' => 'Manager', 'step' => 2, 'description' => 'Procurement Review', 'dept_code' => 'PRC'],
                    ['role' => 'Director', 'step' => 3, 'description' => 'Final Executive Approval', 'dept_code' => 'MGT'],
                ];
            } elseif ($workflow->name === 'Legal Compliance Workflow') {
                $steps = [
                    ['role' => 'Staff', 'step' => 1, 'description' => 'Initial Legal Review', 'dept_code' => 'LGL'],
                    ['role' => 'Manager', 'step' => 2, 'description' => 'Legal Manager Approval', 'dept_code' => 'LGL'],
                ];
            } elseif ($workflow->name === 'Purchasing Control Workflow') {
                $steps = [
                    ['role' => 'Staff', 'step' => 1, 'description' => 'Procurement Verification', 'dept_code' => 'PRC'],
                    ['role' => 'Manager', 'step' => 2, 'description' => 'Finance Approval', 'dept_code' => 'FIN'],
                    ['role' => 'Director', 'step' => 3, 'description' => 'Budget Director Release', 'dept_code' => 'MGT'],
                ];
            } else {
                // General Standard Workflow - Mapped to BRD: "Initiator to Direksi"
                $steps = [
                    ['role' => 'Manager', 'step' => 1, 'description' => 'Tax Validation Review', 'dept_code' => 'TAX', 'cond' => 'tax_required'],
                    ['role' => 'Manager', 'step' => 2, 'description' => 'Management Operations Review', 'dept_code' => 'MGT', 'cond' => 'initiator_not_manager'],
                    ['role' => 'Staff', 'step' => 3, 'description' => 'Legal Compliance & Document Verification', 'dept_code' => 'LGL', 'cond' => null],
                    ['role' => 'Director', 'step' => 4, 'description' => 'Final Direksi Approval', 'dept_code' => 'MGT', 'cond' => null],
                ];
            }

            foreach ($steps as $step) {
                WorkflowStep::create([
                    'workflow_id' => $workflow->id,
                    'role' => $step['role'],
                    'step' => $step['step'],
                    'approver_type' => 'role',
                    'department_id' => ($step['dept_code'] ?? null) ? ($depts[$step['dept_code']] ?? null) : null,
                    'description' => $step['description'],
                    'condition_expression' => $step['cond'] ?? null,
                    'step_type' => 'approval',
                    'is_active' => true,
                    'created_by' => $adminId,
                    'updated_by' => $adminId,
                ]);
            }
        }
    }
}
