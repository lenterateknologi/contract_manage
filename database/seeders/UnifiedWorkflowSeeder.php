<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Workflow;
use App\Models\WorkflowStep;
use App\Models\WorkflowStepRole;
use App\Models\WorkflowStepDepartment;
use App\Models\ContractStatus;
use App\Models\Department;
use App\Models\ContractType;
use Illuminate\Support\Facades\DB;

class UnifiedWorkflowSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            // 1. Get Status IDs
            $statuses = ContractStatus::pluck('id', 'code')->toArray();
            
            // 2. Get Department IDs
            $depts = Department::pluck('id', 'name')->toArray();
            $legalDeptId = $depts['Legal & Compliance'] ?? null;
            $mgmtDeptId = $depts['Management / Direksi'] ?? null;
            $taxDeptId = $depts['Tax'] ?? null;

            // --- A. F1 KONTRAK (Master Workflow) ---
            $f1Workflow = Workflow::updateOrCreate(
                ['name' => 'F1 Contract Master'],
                [
                    'description' => 'Master Workflow for F1 Contract (13 Steps)',
                    'contract_type' => 'F1-CON',
                    'initiator_type' => 'all',
                    'is_active' => true,
                    'is_default' => true,
                ]
            );

            // Clear old steps for clean seed (use forceDelete to avoid unique constraint conflicts with soft deletes)
            $f1Workflow->steps()->forceDelete();

            $f1Steps = [
                [
                    'step' => 1,
                    'name' => 'Pengisian & Kelengkapan',
                    'type' => 'DRAFTING',
                    'actor' => 'initiator',
                    'roles' => ['initiator'],
                    'reject_target' => null,
                    'status' => 'draft'
                ],
                [
                    'step' => 2,
                    'name' => 'Review Atasan Inisiator',
                    'type' => 'APPROVAL',
                    'actor' => 'atasan',
                    'roles' => ['Manager'],
                    'reject_target' => 1,
                    'status' => 'in_review'
                ],
                [
                    'step' => 3,
                    'name' => 'Review Perpajakan',
                    'type' => 'APPROVAL',
                    'actor' => 'role',
                    'roles' => ['Manager', 'Staff'],
                    'dept_id' => $taxDeptId,
                    'reject_target' => 1,
                    'status' => 'in_review',
                    'condition' => 'contract.has_tax'
                ],
                [
                    'step' => 4,
                    'name' => 'Verifikasi & Penugasan PIC',
                    'type' => 'DRAFTING',
                    'actor' => 'role',
                    'roles' => ['Manager'],
                    'dept_id' => $legalDeptId,
                    'reject_target' => 1,
                    'status' => 'in_review'
                ],
                [
                    'step' => 5,
                    'name' => 'Drafting Agreement',
                    'type' => 'DRAFTING',
                    'actor' => 'assigned_pic',
                    'roles' => ['Staff'],
                    'dept_id' => $legalDeptId,
                    'reject_target' => 4,
                    'status' => 'in_review'
                ],
                [
                    'step' => 6,
                    'name' => 'Review Draft (Internal)',
                    'type' => 'REVIEW',
                    'actor' => 'role',
                    'roles' => ['Manager'],
                    'dept_id' => $legalDeptId,
                    'reject_target' => 5,
                    'status' => 'in_review'
                ],
                [
                    'step' => 7,
                    'name' => 'Sirkulasi Draft (Inisiator)',
                    'type' => 'REVIEW',
                    'actor' => 'initiator',
                    'roles' => ['initiator'],
                    'reject_target' => 5,
                    'status' => 'in_review'
                ],
                [
                    'step' => 8,
                    'name' => 'Input No & Generate F2',
                    'type' => 'DRAFTING',
                    'actor' => 'role',
                    'roles' => ['Staff'],
                    'dept_id' => $legalDeptId,
                    'reject_target' => 5,
                    'status' => 'in_review'
                ],
                [
                    'step' => 9,
                    'name' => 'Approval F2 (Legal Manager)',
                    'type' => 'APPROVAL',
                    'actor' => 'role',
                    'roles' => ['Manager'],
                    'dept_id' => $legalDeptId,
                    'reject_target' => 8,
                    'status' => 'in_review'
                ],
                [
                    'step' => 10,
                    'name' => 'Approval F2 (VP Legal)',
                    'type' => 'APPROVAL',
                    'actor' => 'role',
                    'roles' => ['Director'], // Fallback for VP
                    'dept_id' => $legalDeptId,
                    'reject_target' => 9,
                    'status' => 'in_review'
                ],
                [
                    'step' => 11,
                    'name' => 'Approval F2 (SPV Inisiator)',
                    'type' => 'APPROVAL',
                    'actor' => 'atasan',
                    'roles' => ['Manager'],
                    'reject_target' => 8,
                    'status' => 'in_review'
                ],
                [
                    'step' => 12,
                    'name' => 'Approval F2 (Manajemen)',
                    'type' => 'APPROVAL',
                    'actor' => 'role',
                    'roles' => ['Director'],
                    'dept_id' => $mgmtDeptId,
                    'reject_target' => 8,
                    'status' => 'in_review'
                ],
                [
                    'step' => 13,
                    'name' => 'Upload TTD & Penyelesaian',
                    'type' => 'UPLOAD',
                    'category' => 'joint_upload',
                    'actor' => 'role',
                    'roles' => ['Staff'],
                    'dept_id' => $legalDeptId,
                    'reject_target' => 8,
                    'status' => 'locked'
                ],
                [
                    'step' => 14,
                    'name' => 'Closing & Arsip',
                    'type' => 'CLOSING',
                    'actor' => 'role',
                    'roles' => ['Staff'],
                    'dept_id' => $legalDeptId,
                    'reject_target' => null,
                    'status' => 'archived'
                ],
            ];

            foreach ($f1Steps as $s) {
                $step = WorkflowStep::create([
                    'workflow_id' => $f1Workflow->id,
                    'step' => $s['step'],
                    'step_type' => $s['type'],
                    'step_category' => $s['category'] ?? null,
                    'approver_type' => $s['actor'],
                    'description' => $s['name'],
                    'reject_target' => $s['reject_target'],
                    'status_id' => $statuses[$s['status']] ?? null,
                    'condition_expression' => $s['condition'] ?? null,
                    'is_active' => true,
                ]);

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

            // --- B. F1 NON-CONTRACT (Corporate Workflow) ---
            $f1NonWorkflow = Workflow::updateOrCreate(
                ['name' => 'F1 Non-Contract Corporate'],
                [
                    'description' => 'Workflow for F1 Non-Contract (Corporate Action)',
                    'contract_type' => 'F1-NON',
                    'initiator_type' => 'restricted', // Logic handled in Service
                    'is_active' => true,
                    'is_default' => false,
                ]
            );
            $f1NonWorkflow->steps()->forceDelete();

            $f1NonSteps = [
                [1, 'Pengisian & Kelengkapan', 'DRAFTING', 'initiator', ['initiator'], null, 'draft'],
                [2, 'Review Atasan Langsung', 'APPROVAL', 'atasan', ['Manager'], 1, 'in_review'],
                [3, 'Review Direksi (Optional)', 'APPROVAL', 'role', ['Director'], 1, 'in_review'],
                [4, 'Verifikasi & Penugasan PIC', 'DRAFTING', 'role', ['Manager'], 1, 'in_review', $legalDeptId],
                [5, 'Upload TTD Manual', 'UPLOAD', 'assigned_pic', ['Staff'], 4, 'locked', $legalDeptId],
                [6, 'Closing & Arsip', 'CLOSING', 'role', ['Staff'], null, 'archived', $legalDeptId],
            ];

            foreach ($f1NonSteps as $sData) {
                $step = WorkflowStep::create([
                    'workflow_id' => $f1NonWorkflow->id,
                    'step' => $sData[0],
                    'step_type' => $sData[2],
                    'step_category' => $sData[8] ?? null,
                    'approver_type' => $sData[3],
                    'description' => $sData[1],
                    'reject_target' => $sData[5],
                    'status_id' => $statuses[$sData[6]] ?? null,
                    'is_active' => true,
                ]);

                foreach ($sData[4] as $roleName) {
                    WorkflowStepRole::create(['workflow_step_id' => $step->id, 'role_name' => $roleName]);
                }
                if (isset($sData[7])) {
                    WorkflowStepDepartment::create(['workflow_step_id' => $step->id, 'department_id' => $sData[7]]);
                }
            }

            // --- C. NDA TEMPLATE (Fast Track) ---
            $ndaWorkflow = Workflow::updateOrCreate(
                ['name' => 'NDA Fast Track'],
                [
                    'description' => 'Fast track workflow for NDA templates',
                    'contract_type' => 'NDA-TMP',
                    'initiator_type' => 'all',
                    'is_active' => true,
                    'is_default' => false,
                ]
            );
            $ndaWorkflow->steps()->forceDelete();

            $ndaSteps = [
                [1, 'Input & Upload NDA', 'DRAFTING', 'initiator', ['initiator'], null, 'draft'],
                [2, 'Closing & Arsip', 'CLOSING', 'role', ['Staff'], 1, 'archived', $legalDeptId],
            ];

            foreach ($ndaSteps as $sData) {
                $step = WorkflowStep::create([
                    'workflow_id' => $ndaWorkflow->id,
                    'step' => $sData[0],
                    'step_type' => $sData[2],
                    'approver_type' => $sData[3],
                    'description' => $sData[1],
                    'reject_target' => $sData[5],
                    'status_id' => $statuses[$sData[6]] ?? null,
                    'is_active' => true,
                ]);

                foreach ($sData[4] as $roleName) {
                    WorkflowStepRole::create(['workflow_step_id' => $step->id, 'role_name' => $roleName]);
                }
                if (isset($sData[7])) {
                    WorkflowStepDepartment::create(['workflow_step_id' => $step->id, 'department_id' => $sData[7]]);
                }
            }

            // --- D. Contract Types Mapping ---
            ContractType::updateOrCreate(
                ['code' => 'F1-CON'],
                [
                    'name' => 'F1 Contract',
                    'workflow_id' => $f1Workflow->id,
                    'features' => ['tax_optional' => true, 'is_master' => true]
                ]
            );
            ContractType::updateOrCreate(
                ['code' => 'F1-NON'],
                [
                    'name' => 'F1 Non-Contract',
                    'workflow_id' => $f1NonWorkflow->id,
                    'features' => ['restricted_initiator' => true, 'optional_review' => true]
                ]
            );
            ContractType::updateOrCreate(
                ['code' => 'NDA-TMP'],
                [
                    'name' => 'NDA Template',
                    'workflow_id' => $ndaWorkflow->id,
                    'features' => ['direct_archive' => true, 'vendor_required' => true]
                ]
            );

            // 4. Map legacy and existing types to the new unified workflows
            // F1 Contract (Standard)
            ContractType::whereIn('code', ['PKS', 'JASA', 'PGB', 'SEWA', 'LISENSI', 'DIST', 'OUTS', 'JV', 'KERJASAMA'])
                ->update(['workflow_id' => $f1Workflow->id]);

            // F1 Non-Contract (Corporate Action, etc.)
            ContractType::whereIn('code', ['ADD', 'INTERNAL', 'CUSTOM', 'CORP-ACT'])
                ->update(['workflow_id' => $f1NonWorkflow->id]);

            // NDA Fast Track
            ContractType::whereIn('code', ['NDA'])
                ->update(['workflow_id' => $ndaWorkflow->id]);

            echo "Workflow mapping completed for legacy types.\n";
        });
    }
}
