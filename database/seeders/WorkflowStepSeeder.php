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

        // Clear existing steps first
        WorkflowStep::query()->delete();

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
                // General Standard Workflow - Fallback to workflow department (null here) or specific ones
                $steps = [
                    ['role' => 'Manager', 'step' => 1, 'description' => 'Department Head Approval', 'dept_code' => null],
                    ['role' => 'Manager', 'step' => 2, 'description' => 'General Management Review', 'dept_code' => 'MGT'],
                    ['role' => 'Director', 'step' => 3, 'description' => 'Board Approval', 'dept_code' => 'MGT'],
                ];
            }

            foreach ($steps as $step) {
                WorkflowStep::create([
                    'workflow_id' => $workflow->id,
                    'role' => $step['role'],
                    'step' => $step['step'],
                    'approver_type' => 'role',
                    'department_id' => $step['dept_code'] ? ($depts[$step['dept_code']] ?? null) : null,
                    'description' => $step['description'],
                    'condition_expression' => null,
                    'step_type' => 'approval',
                    'is_active' => true,
                    'created_by' => $adminId,
                    'updated_by' => $adminId,
                ]);
            }
        }
    }
}
