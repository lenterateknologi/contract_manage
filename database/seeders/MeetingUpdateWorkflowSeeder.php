<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowStep;
use App\Models\WorkflowStepRole;
use App\Models\WorkflowStepDepartment;
use Illuminate\Database\Seeder;

class MeetingUpdateWorkflowSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstWhere('role', 'Admin') ?? User::first();
        $adminId = $admin ? $admin->id : null;
        $depts = Department::pluck('id', 'code')->all();
        
        $legalDeptId = $depts['LGL'] ?? $depts['LEGAL'] ?? null;
        $mgtDeptId = $depts['MGT'] ?? $depts['MANAGEMENT'] ?? null;

        // 1. Workflow F1 Contract (Review Pak Rendi)
        $wfF1Contract = Workflow::create([
            'name' => 'F1 Contract Workflow',
            'description' => 'Alur persetujuan F1 Contract dengan Review Pak Rendi',
            'contract_type' => 'Perjanjian',
            'is_active' => true,
            'initiator_type' => 'all',
            'created_by' => $adminId,
            'updated_by' => $adminId,
        ]);

        $this->seedSteps($wfF1Contract, [
            ['step' => 1, 'role' => 'Manager', 'description' => 'Review Atasan Langsung', 'step_type' => 'atasan', 'phase' => 'f1_request'],
            ['step' => 2, 'role' => 'Manager', 'description' => 'Review Pak Rendi', 'step_type' => 'review', 'phase' => 'f1_request'],
            ['step' => 3, 'role' => 'Manager', 'description' => 'Review Manajemen', 'step_type' => 'role', 'phase' => 'f1_request', 'department_id' => $mgtDeptId],
            ['step' => 4, 'role' => 'Manager', 'description' => 'Kelengkapan Dokumen (Legal Manager)', 'step_type' => 'review', 'phase' => 'f1_request', 'department_id' => $legalDeptId],
        ], $adminId);

        // 2. Workflow F1 Non-Contract (Review Ibu Nisa)
        $wfF1NonContract = Workflow::create([
            'name' => 'F1 Non-Contract Workflow',
            'description' => 'Alur persetujuan F1 Non-Contract dengan Review Ibu Nisa',
            'contract_type' => 'Non-Perjanjian',
            'is_active' => true,
            'initiator_type' => 'all',
            'created_by' => $adminId,
            'updated_by' => $adminId,
        ]);

        $this->seedSteps($wfF1NonContract, [
            ['step' => 1, 'role' => 'Manager', 'description' => 'Review Atasan Langsung', 'step_type' => 'atasan', 'phase' => 'f1_request'],
            ['step' => 2, 'role' => 'Manager', 'description' => 'Review Ibu Nisa', 'step_type' => 'review', 'phase' => 'f1_request'],
            ['step' => 3, 'role' => 'Manager', 'description' => 'Review Manajemen', 'step_type' => 'role', 'phase' => 'f1_request', 'department_id' => $mgtDeptId],
            ['step' => 4, 'role' => 'Manager', 'description' => 'Kelengkapan Dokumen (Legal Manager)', 'step_type' => 'review', 'phase' => 'f1_request', 'department_id' => $legalDeptId],
        ], $adminId);

        // 3. Workflow NDA (Record Only)
        $wfNDA = Workflow::create([
            'name' => 'NDA Workflow',
            'description' => 'Alur NDA (Record Only)',
            'contract_type' => 'NDA',
            'is_active' => true,
            'initiator_type' => 'all',
            'created_by' => $adminId,
            'updated_by' => $adminId,
        ]);

        // No steps needed for record only as per logic in Service, but we create the WF to map it.

        // 4. Update F2 Flow steps (logic will be handled in UI/Service based on step description)
        // We'll just create a sample F2 workflow with the new steps
        $wfF2 = Workflow::create([
            'name' => 'F2 Standard Workflow (Updated)',
            'description' => 'F2 dengan Input Crown No dan Penentuan TTD Digital',
            'contract_type' => 'F2',
            'is_active' => true,
            'initiator_type' => 'all',
            'created_by' => $adminId,
            'updated_by' => $adminId,
        ]);

        $this->seedSteps($wfF2, [
            ['step' => 1, 'role' => 'Staff', 'description' => 'Input Crown Number (Staff Legal)', 'step_type' => 'drafting', 'phase' => 'contract_creation', 'department_id' => $legalDeptId],
            ['step' => 2, 'role' => 'Manager', 'description' => 'Penentuan TTD Digital (PIC Legal)', 'step_type' => 'review', 'phase' => 'contract_creation', 'department_id' => $legalDeptId],
            ['step' => 3, 'role' => 'Manager', 'description' => 'Review Manager Legal', 'step_type' => 'review', 'phase' => 'contract_creation', 'department_id' => $legalDeptId],
        ], $adminId);
    }

    private function seedSteps($workflow, $steps, $adminId)
    {
        foreach ($steps as $data) {
            $ws = WorkflowStep::create([
                'workflow_id' => $workflow->id,
                'step' => $data['step'],
                'description' => $data['description'],
                'step_type' => $data['step_type'],
                'phase' => $data['phase'],
                'approver_type' => 'role',
                'is_active' => true,
                'created_by' => $adminId,
                'updated_by' => $adminId,
            ]);

            WorkflowStepRole::create([
                'workflow_step_id' => $ws->id,
                'role_name' => $data['role']
            ]);

            if (isset($data['department_id']) && $data['department_id']) {
                WorkflowStepDepartment::create([
                    'workflow_step_id' => $ws->id,
                    'department_id' => $data['department_id']
                ]);
            }
        }
    }
}
