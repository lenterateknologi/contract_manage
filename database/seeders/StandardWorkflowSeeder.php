<?php

namespace Database\Seeders;

use App\Models\ContractType;
use App\Models\Department;
use App\Models\Workflow;
use App\Models\WorkflowStep;
use App\Models\WorkflowStepDepartment;
use App\Models\WorkflowStepRole;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StandardWorkflowSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            // 0. CLEANUP OLD DATA
            WorkflowStepRole::query()->delete();
            WorkflowStepDepartment::query()->delete();
            DB::table('m_workflow_step_actions')->delete();
            WorkflowStep::withTrashed()->forceDelete();
            Workflow::withTrashed()->forceDelete();

            // 1. Get Master Data
            $depts = Department::pluck('id', 'name')->toArray();
            $legalDeptId = $depts['Legal & Compliance'] ?? null;
            $mgmtDeptId = $depts['Management / Direksi'] ?? null;
            $taxDeptId = $depts['Tax'] ?? null;

            // 2. Create Main Workflow
            $workflow = Workflow::create([
                'name' => 'Standard Contract Lifecycle',
                'description' => 'Alur kerja standar kontrak dengan penomoran Base-1',
                'contract_type_id' => null, // Applies to all unless specified
                'initiator_type' => 'all',
                'is_active' => true,
                'is_default' => true,
            ]);

            $steps = [
                [
                    'step' => 1,
                    'name' => 'Pengisian & Kelengkapan',
                    'type' => 'DRAFTING',
                    'actor' => 'initiator',
                    'roles' => ['initiator'],
                    'status' => 'draft',
                ],
                [
                    'step' => 2,
                    'name' => 'Review Atasan Inisiator',
                    'type' => 'APPROVAL',
                    'actor' => 'atasan',
                    'roles' => ['Manager'],
                    'status' => 'in_review',
                ],
                [
                    'step' => 3,
                    'name' => 'Review Perpajakan',
                    'type' => 'APPROVAL',
                    'actor' => 'role',
                    'roles' => ['Manager', 'Staff'],
                    'dept_id' => $taxDeptId,
                    'status' => 'in_review',
                    'condition' => 'contract.has_tax',
                ],
                [
                    'step' => 4,
                    'name' => 'Verifikasi Legal Manager',
                    'type' => 'APPROVAL',
                    'actor' => 'role',
                    'roles' => ['Manager'],
                    'dept_id' => $legalDeptId,
                    'status' => 'in_review',
                ],
                [
                    'step' => 5,
                    'name' => 'Drafting Perjanjian',
                    'type' => 'DRAFTING',
                    'actor' => 'assigned_pic',
                    'roles' => ['Staff'],
                    'dept_id' => $legalDeptId,
                    'status' => 'in_review',
                ],
                [
                    'step' => 6,
                    'name' => 'Review Draft (Internal Legal)',
                    'type' => 'REVIEW',
                    'actor' => 'role',
                    'roles' => ['Manager'],
                    'dept_id' => $legalDeptId,
                    'status' => 'in_review',
                ],
                [
                    'step' => 7,
                    'name' => 'Sirkulasi & Negosiasi',
                    'type' => 'REVIEW',
                    'actor' => 'initiator',
                    'roles' => ['initiator'],
                    'status' => 'in_review',
                ],
                [
                    'step' => 8,
                    'name' => 'Finalisasi & Penomoran',
                    'type' => 'DRAFTING',
                    'actor' => 'assigned_pic',
                    'roles' => ['Staff'],
                    'dept_id' => $legalDeptId,
                    'status' => 'in_review',
                ],
                [
                    'step' => 9,
                    'name' => 'Approval Direksi',
                    'type' => 'APPROVAL',
                    'actor' => 'role',
                    'roles' => ['Director'],
                    'dept_id' => $legalDeptId,
                    'status' => 'in_review',
                ],
                [
                    'step' => 10,
                    'name' => 'Approval Manajemen Puncak',
                    'type' => 'APPROVAL',
                    'actor' => 'role',
                    'roles' => ['CEO'],
                    'dept_id' => $mgmtDeptId,
                    'status' => 'in_review',
                ],
                [
                    'step' => 11,
                    'name' => 'Proses Tanda Tangan',
                    'type' => 'SIGNING',
                    'category' => 'signing',
                    'actor' => 'assigned_pic',
                    'roles' => ['Staff'],
                    'dept_id' => $legalDeptId,
                    'status' => 'locked',
                ],
                [
                    'step' => 12,
                    'name' => 'Validasi Akhir & Pengarsipan',
                    'type' => 'CLOSING',
                    'category' => 'closing',
                    'actor' => 'assigned_pic',
                    'roles' => ['Staff'],
                    'dept_id' => $legalDeptId,
                    'status' => 'archived',
                ],
            ];

            foreach ($steps as $s) {
                $actions = match (strtoupper($s['type'])) {
                    'APPROVAL' => ['approve', 'reject', 'return'],
                    'REVIEW' => ['review', 'return'],
                    'SIGNING' => ['sign', 'return'],
                    'DRAFTING' => ($s['step'] === 1) ? ['approve'] : ['approve', 'assign'],
                    'CLOSING' => ['approve'],
                    default => ['approve', 'reject'],
                };

                $step = WorkflowStep::create([
                    'workflow_id' => $workflow->id,
                    'step' => $s['step'],
                    'step_category' => $s['category'] ?? null,
                    'approver_type' => $s['actor'],
                    'description' => $s['name'],
                    'condition_expression' => $s['condition'] ?? null,
                    'meta' => ['target_status' => $s['status']],
                    'is_active' => true,
                ]);

                foreach ($actions as $actCode) {
                    DB::table('m_workflow_step_actions')->insert([
                        'id' => Str::uuid()->toString(),
                        'workflow_step_id' => $step->id,
                        'action_code' => $actCode,
                        'signing_parties' => json_encode($actCode === 'sign' ? ['initiator', 'pic'] : []),
                        'assignee_config' => json_encode($actCode === 'assign' ? ['type' => 'assigned_pic'] : []),
                        'is_active' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                foreach ($s['roles'] as $roleName) {
                    WorkflowStepRole::create([
                        'workflow_step_id' => $step->id,
                        'role_name' => $roleName,
                    ]);
                }

                if (isset($s['dept_id'])) {
                    WorkflowStepDepartment::create([
                        'workflow_step_id' => $step->id,
                        'department_id' => $s['dept_id'],
                    ]);
                }
            }

            // Link Transitions (Auto-Next 1)
            $dbSteps = WorkflowStep::where('workflow_id', $workflow->id)->orderBy('step')->get();
            $stepMap = $dbSteps->pluck('id', 'step')->toArray();

            foreach ($dbSteps as $dbStep) {
                $nextStepId = $stepMap[$dbStep->step + 1] ?? null;
                $firstStepId = $stepMap[1] ?? null;

                DB::table('m_workflow_step_actions')
                    ->where('workflow_step_id', $dbStep->id)
                    ->where('action_code', 'approve')
                    ->update(['next_step_id' => $nextStepId]);

                DB::table('m_workflow_step_actions')
                    ->where('workflow_step_id', $dbStep->id)
                    ->where('action_code', 'reject')
                    ->update(['next_step_id' => $firstStepId]);
            }

            // Map all Contract Types to this new Workflow
            ContractType::query()->update(['workflow_id' => $workflow->id]);

            echo "Standard Workflow (Base-1) seeded successfully.\n";
        });
    }
}
