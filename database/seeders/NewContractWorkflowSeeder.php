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
        $taxDeptId = $depts['TAX'] ?? $depts['PERPAJAKAN'] ?? null;

        // 2. Buat Workflow Utama (Dengan Pajak)
        $workflowWithTax = Workflow::create([
            'name' => 'Standard Contract Workflow (v3) - Dengan Pajak',
            'description' => 'Alur persetujuan kontrak standar dinamis 11 langkah (Dengan Pajak)',
            'contract_type' => 'General',
            'is_default' => true,
            'is_active' => true,
            'is_template' => true,
            'is_tax_involved' => true,
            'initiator_type' => 'all',
            'created_by' => $adminId,
            'updated_by' => $adminId,
        ]);

        $stepsWithTax = [
            [
                'step' => 1,
                'role' => 'Manager',
                'description' => 'Review Atasan Langsung',
                'department_id' => null,
                'step_type' => 'atasan',
                'phase' => 'f1_request',
                'condition_expression' => null,
                'uploader_type' => null,
                'reject_target' => null,
            ],
            [
                'step' => 2,
                'role' => 'Manager',
                'description' => 'Review Perpajakan',
                'department_id' => $taxDeptId,
                'step_type' => 'role',
                'phase' => 'f1_request',
                'condition_expression' => 'contract.has_tax == true',
                'uploader_type' => null,
                'reject_target' => null,
            ],
            [
                'step' => 3,
                'role' => 'Manager',
                'description' => 'Review Manajemen (COO/VP)',
                'department_id' => $mgtDeptId,
                'step_type' => 'role',
                'phase' => 'f1_request',
                'condition_expression' => null,
                'uploader_type' => null,
                'reject_target' => null,
            ],
            [
                'step' => 4,
                'role' => 'Director',
                'description' => 'Review Direksi (CEO)',
                'department_id' => $mgtDeptId,
                'step_type' => 'role',
                'phase' => 'f1_request',
                'condition_expression' => null,
                'uploader_type' => null,
                'reject_target' => null,
            ],
            [
                'step' => 5,
                'role' => 'Manager',
                'description' => 'Kelengkapan Dokumen (Legal Manager)',
                'department_id' => $legalDeptId,
                'step_type' => 'review',
                'phase' => 'f1_request',
                'condition_expression' => null,
                'uploader_type' => null,
                'reject_target' => null,
            ],
            [
                'step' => 6,
                'role' => 'Manager',
                'description' => 'Assignee & Input No',
                'department_id' => $legalDeptId,
                'step_type' => 'drafting',
                'phase' => 'contract_creation',
                'condition_expression' => null,
                'uploader_type' => null,
                'reject_target' => null,
            ],
            [
                'step' => 7,
                'role' => 'Staff',
                'description' => 'Draft Kontrak & Upload Agreement',
                'department_id' => $legalDeptId,
                'step_type' => 'drafting',
                'phase' => 'contract_creation',
                'condition_expression' => null,
                'uploader_type' => null,
                'reject_target' => 'step_6',
            ],
            [
                'step' => 8,
                'role' => 'Manager',
                'description' => 'Review Kontrak (Manager Legal)',
                'department_id' => $legalDeptId,
                'step_type' => 'review',
                'phase' => 'contract_creation',
                'condition_expression' => null,
                'uploader_type' => null,
                'reject_target' => 'step_7',
            ],
            [
                'step' => 9,
                'role' => 'Manager',
                'description' => 'Review Kontrak (VP Legal)',
                'department_id' => $legalDeptId,
                'step_type' => 'review',
                'phase' => 'contract_creation',
                'condition_expression' => null,
                'uploader_type' => null,
                'reject_target' => 'step_8',
            ],
            [
                'step' => 10,
                'role' => 'Staff',
                'description' => 'Penentuan & Upload Dokumen TTD',
                'department_id' => $legalDeptId,
                'step_type' => 'upload_signed_doc',
                'phase' => 'contract_creation',
                'condition_expression' => null,
                'uploader_type' => 'staff',
                'reject_target' => 'step_7',
            ],
            [
                'step' => 11,
                'role' => 'Staff',
                'description' => 'Validasi Akhir & Closing',
                'department_id' => $legalDeptId,
                'step_type' => 'closing_check',
                'phase' => 'contract_creation',
                'condition_expression' => null,
                'uploader_type' => null,
                'reject_target' => null,
            ],
        ];

        // 2b. Buat Workflow Utama (Tanpa Pajak)
        $workflowNoTax = Workflow::create([
            'name' => 'Standard Contract Workflow (v3) - Tanpa Pajak',
            'description' => 'Alur persetujuan kontrak standar dinamis 10 langkah (Tanpa Pajak)',
            'contract_type' => 'General',
            'is_default' => true,
            'is_active' => true,
            'is_template' => true,
            'is_tax_involved' => false,
            'initiator_type' => 'all',
            'created_by' => $adminId,
            'updated_by' => $adminId,
        ]);

        $stepsNoTax = [
            [
                'step' => 1,
                'role' => 'Manager',
                'description' => 'Review Atasan Langsung',
                'department_id' => null,
                'step_type' => 'atasan',
                'phase' => 'f1_request',
                'condition_expression' => null,
                'uploader_type' => null,
                'reject_target' => null,
            ],
            [
                'step' => 2,
                'role' => 'Manager',
                'description' => 'Review Manajemen (COO/VP)',
                'department_id' => $mgtDeptId,
                'step_type' => 'role',
                'phase' => 'f1_request',
                'condition_expression' => null,
                'uploader_type' => null,
                'reject_target' => null,
            ],
            [
                'step' => 3,
                'role' => 'Director',
                'description' => 'Review Direksi (CEO)',
                'department_id' => $mgtDeptId,
                'step_type' => 'role',
                'phase' => 'f1_request',
                'condition_expression' => null,
                'uploader_type' => null,
                'reject_target' => null,
            ],
            [
                'step' => 4,
                'role' => 'Manager',
                'description' => 'Kelengkapan Dokumen (Legal Manager)',
                'department_id' => $legalDeptId,
                'step_type' => 'review',
                'phase' => 'f1_request',
                'condition_expression' => null,
                'uploader_type' => null,
                'reject_target' => null,
            ],
            [
                'step' => 5,
                'role' => 'Manager',
                'description' => 'Assignee & Input No',
                'department_id' => $legalDeptId,
                'step_type' => 'drafting',
                'phase' => 'contract_creation',
                'condition_expression' => null,
                'uploader_type' => null,
                'reject_target' => null,
            ],
            [
                'step' => 6,
                'role' => 'Staff',
                'description' => 'Draft Kontrak & Upload Agreement',
                'department_id' => $legalDeptId,
                'step_type' => 'drafting',
                'phase' => 'contract_creation',
                'condition_expression' => null,
                'uploader_type' => null,
                'reject_target' => 'step_5',
            ],
            [
                'step' => 7,
                'role' => 'Manager',
                'description' => 'Review Kontrak (Manager Legal)',
                'department_id' => $legalDeptId,
                'step_type' => 'review',
                'phase' => 'contract_creation',
                'condition_expression' => null,
                'uploader_type' => null,
                'reject_target' => 'step_6',
            ],
            [
                'step' => 8,
                'role' => 'Manager',
                'description' => 'Review Kontrak (VP Legal)',
                'department_id' => $legalDeptId,
                'step_type' => 'review',
                'phase' => 'contract_creation',
                'condition_expression' => null,
                'uploader_type' => null,
                'reject_target' => 'step_7',
            ],
            [
                'step' => 9,
                'role' => 'Staff',
                'description' => 'Penentuan & Upload Dokumen TTD',
                'department_id' => $legalDeptId,
                'step_type' => 'upload_signed_doc',
                'phase' => 'contract_creation',
                'condition_expression' => null,
                'uploader_type' => 'staff',
                'reject_target' => 'step_6',
            ],
            [
                'step' => 10,
                'role' => 'Staff',
                'description' => 'Validasi Akhir & Closing',
                'department_id' => $legalDeptId,
                'step_type' => 'closing_check',
                'phase' => 'contract_creation',
                'condition_expression' => null,
                'uploader_type' => null,
                'reject_target' => null,
            ],
        ];

        // Seed both
        $this->seedSteps($workflowWithTax, $stepsWithTax, $adminId);
        $this->seedSteps($workflowNoTax, $stepsNoTax, $adminId);

        $this->command->info('Workflow v3 berhasil disemai!');
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
                'condition_expression' => $data['condition_expression'],
                'uploader_type' => $data['uploader_type'],
                'reject_target' => $data['reject_target'],
                'approver_type' => 'role',
                'is_active' => true,
                'created_by' => $adminId,
                'updated_by' => $adminId,
            ]);

            // Save Role name
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
    }
}
