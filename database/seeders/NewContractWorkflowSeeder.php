<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowStep;
use App\Models\WorkflowStepRole;
use App\Models\WorkflowStepDepartment;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class NewContractWorkflowSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Hapus semua data workflow lama secara permanen
        WorkflowStepRole::query()->delete();
        WorkflowStepDepartment::query()->delete();
        WorkflowStep::withTrashed()->forceDelete();
        Workflow::withTrashed()->forceDelete();

        $admin = User::firstWhere('role', 'Admin') ?? User::first();
        $adminId = $admin ? $admin->id : null;
        $depts = Department::pluck('id', 'code')->all();
        
        $legalDeptId = $depts['LGL'] ?? $depts['LEGAL'] ?? null;
        $mgtDeptId = $depts['MGT'] ?? $depts['MANAGEMENT'] ?? null;

        // 2. Buat Workflow Utama
        $workflow = Workflow::create([
            'name' => 'Standard Contract Workflow (v2)',
            'description' => 'Alur persetujuan kontrak standar: Staff > Manager > Legal > Management > Legal > Initiator > Management > Legal',
            'contract_type' => 'General',
            'is_default' => true,
            'is_active' => true,
            'is_template' => true,
            'initiator_type' => 'all', // Semua role bisa memulai
            'created_by' => $adminId,
            'updated_by' => $adminId,
        ]);

        // 3. Buat Langkah-langkah (Steps)
        $steps = [
            [
                'step' => 1,
                'role' => 'Manager',
                'description' => 'Manager Staff (Atasan Langsung)',
                'department_id' => null, // Dinamis berdasarkan departemen pembuat
                'step_type' => 'approval',
                'condition_expression' => 'initiator_is_staff',
            ],
            [
                'step' => 2,
                'role' => 'Staff',
                'description' => 'Legal (F2, Agreement, Lampiran Initiator)',
                'department_id' => $legalDeptId,
                'step_type' => 'drafting', // Fase pengisian F2
                'condition_expression' => null,
            ],
            [
                'step' => 3,
                'role' => 'Director',
                'description' => 'Management (Direksi)',
                'department_id' => $mgtDeptId,
                'step_type' => 'approval',
                'condition_expression' => null,
            ],
            [
                'step' => 4,
                'role' => 'Staff',
                'description' => 'Legal Review (Pasca Management)',
                'department_id' => $legalDeptId,
                'step_type' => 'approval',
                'condition_expression' => null,
            ],
            [
                'step' => 5,
                'role' => 'Manager',
                'description' => 'Manager Legal',
                'department_id' => $legalDeptId,
                'step_type' => 'approval',
                'condition_expression' => null,
            ],
            [
                'step' => 6,
                'role' => 'Initiator',
                'description' => 'Konfirmasi Initiator',
                'department_id' => null, // Khusus untuk user pemohon
                'step_type' => 'approval',
                'condition_expression' => null,
            ],
            [
                'step' => 7,
                'role' => 'Manager',
                'description' => 'Manager Initiator',
                'department_id' => null, // Dinamis berdasarkan departemen inisiator
                'step_type' => 'approval',
                'condition_expression' => null,
            ],
            [
                'step' => 8,
                'role' => 'Staff',
                'description' => 'Legal (Arsip & Administrasi)',
                'department_id' => $legalDeptId,
                'step_type' => 'approval',
                'condition_expression' => null,
            ],
        ];

        foreach ($steps as $data) {
            $ws = WorkflowStep::create([
                'workflow_id' => $workflow->id,
                'step' => $data['step'],
                'description' => $data['description'],
                'step_type' => $data['step_type'],
                'condition_expression' => $data['condition_expression'],
                'approver_type' => 'role',
                'is_active' => true,
                'created_by' => $adminId,
                'updated_by' => $adminId,
            ]);

            // Save Role
            WorkflowStepRole::create([
                'workflow_step_id' => $ws->id,
                'role_name' => $data['role']
            ]);

            // Save Department if specified
            if ($data['department_id']) {
                WorkflowStepDepartment::create([
                    'workflow_step_id' => $ws->id,
                    'department_id' => $data['department_id']
                ]);
            }
        }
        
        $this->command->info('Workflow baru berhasil disemai!');
    }
}
