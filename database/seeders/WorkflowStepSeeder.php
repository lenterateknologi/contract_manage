<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\WorkflowStep;
use App\Models\Workflow;
use App\Models\User;
use App\Models\Department;

class WorkflowStepSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::firstWhere('role', 'Admin') ?? User::first();
        $adminId = $admin ? $admin->id : null;

        // Clear existing steps first
        WorkflowStep::withTrashed()->forceDelete();

        // Get all workflows
        $workflows = Workflow::all();
        $depts = Department::pluck('id', 'code')->all();

        // Find specific roles/users for steps
        $legalDeptId = $depts['LGL'] ?? null;
        $mgtDeptId = $depts['MGT'] ?? null;

        foreach ($workflows as $workflow) {
            $steps = [
                // STEP 1: Manager Staff (Hanya jika pembuat adalah Staff)
                [
                    'role' => 'Manager',
                    'step' => 1,
                    'description' => 'Persetujuan Atasan Langsung (Internal Dept)',
                    'department_id' => null, // Dynamic: Resolves to Initiator's Dept Manager
                    'condition_expression' => 'initiator_is_staff',
                    'step_type' => 'approval'
                ],
                // STEP 2: Legal Drafting (Fase Drafting - Menghasilkan F2 & Memo)
                [
                    'role' => 'Staff',
                    'step' => 2,
                    'description' => 'Drafting: Pembuatan F2 & Perjanjian',
                    'department_id' => $legalDeptId,
                    'condition_expression' => null,
                    'step_type' => 'drafting'
                ],
                // STEP 3: Management (Director Approval)
                [
                    'role' => 'Director',
                    'step' => 3,
                    'description' => 'Persetujuan Direksi / Management',
                    'department_id' => $mgtDeptId,
                    'condition_expression' => null,
                    'step_type' => 'approval'
                ],
                // STEP 4: Legal Review (Post-Director)
                [
                    'role' => 'Staff',
                    'step' => 4,
                    'description' => 'Review Legal: Verifikasi Draft Pasca Direksi',
                    'department_id' => $legalDeptId,
                    'condition_expression' => null,
                    'step_type' => 'approval'
                ],
                // STEP 5: Manager Legal
                [
                    'role' => 'Manager',
                    'step' => 5,
                    'description' => 'Validasi Akhir Manager Legal',
                    'department_id' => $legalDeptId,
                    'condition_expression' => null,
                    'step_type' => 'approval'
                ],
                // STEP 6: Initiator Confirmation
                [
                    'role' => 'Initiator',
                    'step' => 6,
                    'description' => 'Konfirmasi Penandatangan oleh User',
                    'department_id' => null, // Special logic for "Initiator"
                    'condition_expression' => null,
                    'step_type' => 'approval'
                ],
                // STEP 7: Manager Initiator
                [
                    'role' => 'Manager',
                    'step' => 7,
                    'description' => 'Final Sign-off Atasan Initiator',
                    'department_id' => null, // Dynamic: Initiator's Manager
                    'condition_expression' => null,
                    'step_type' => 'approval'
                ],
                // STEP 8: Legal Archiving
                [
                    'role' => 'Staff',
                    'step' => 8,
                    'description' => 'Arsip & Penyelesaian Administrasi',
                    'department_id' => $legalDeptId,
                    'condition_expression' => null,
                    'step_type' => 'approval'
                ],
            ];

            foreach ($steps as $data) {
                WorkflowStep::create([
                    'workflow_id' => $workflow->id,
                    'role' => $data['role'],
                    'step' => $data['step'],
                    'approver_type' => 'role',
                    'department_id' => $data['department_id'],
                    'description' => $data['description'],
                    'condition_expression' => $data['condition_expression'],
                    'step_type' => $data['step_type'],
                    'is_active' => true,
                    'created_by' => $adminId,
                    'updated_by' => $adminId,
                ]);
            }
        }
    }
}
