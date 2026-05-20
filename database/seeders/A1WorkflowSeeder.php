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

class A1WorkflowSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            // 0. CLEANUP ALL EXISTING WORKFLOW DATA
            WorkflowStepRole::query()->delete();
            WorkflowStepDepartment::query()->delete();
            WorkflowStep::withTrashed()->forceDelete();
            Workflow::withTrashed()->forceDelete();

            // 1. Get Status IDs
            $statuses = ContractStatus::pluck('id', 'code')->toArray();
            
            // 2. Get Department IDs
            $depts = Department::pluck('id', 'name')->toArray();
            $legalDeptId = $depts['Legal & Compliance'] ?? null;
            $mgmtDeptId = $depts['Management / Direksi'] ?? null;
            $taxDeptId = $depts['Tax'] ?? null;

            // --- A. A1 KONTRAK (Standard Workflow) ---
            $workflow = Workflow::create([
                'name' => 'A1 - Standard Contract Workflow',
                'description' => 'Master Workflow for Contracts (14 Steps) - Latest Version',
                'contract_type' => 'A1-CON',
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
                    'name' => 'Approval VP / Vice President',
                    'type' => 'APPROVAL',
                    'actor' => 'role',
                    'roles' => ['VP'],
                    'dept_id' => $mgmtDeptId,
                    'reject_target' => 1,
                    'status' => 'in_review'
                ],
                [
                    'step' => 5,
                    'name' => 'Approval CEO / Manajemen',
                    'type' => 'APPROVAL',
                    'actor' => 'role',
                    'roles' => ['CEO'],
                    'dept_id' => $mgmtDeptId,
                    'reject_target' => 1,
                    'status' => 'in_review'
                ],
                [
                    'step' => 6,
                    'name' => 'Verifikasi & Penugasan PIC',
                    'type' => 'DRAFTING',
                    'actor' => 'role',
                    'roles' => ['Manager'],
                    'dept_id' => $legalDeptId,
                    'reject_target' => 1,
                    'status' => 'in_review'
                ],
                [
                    'step' => 7,
                    'name' => 'Drafting Agreement',
                    'type' => 'DRAFTING',
                    'actor' => 'assigned_pic',
                    'roles' => ['Staff'],
                    'dept_id' => $legalDeptId,
                    'reject_target' => 6,
                    'status' => 'in_review'
                ],
                [
                    'step' => 8,
                    'name' => 'Review Draft (Internal)',
                    'type' => 'REVIEW',
                    'actor' => 'role',
                    'roles' => ['Manager'],
                    'dept_id' => $legalDeptId,
                    'reject_target' => 7,
                    'status' => 'in_review'
                ],
                [
                    'step' => 9,
                    'name' => 'Sirkulasi Draft (Inisiator)',
                    'type' => 'REVIEW',
                    'actor' => 'initiator',
                    'roles' => ['initiator'],
                    'reject_target' => 7,
                    'status' => 'in_review'
                ],
                [
                    'step' => 10,
                    'name' => 'Input No & Generate F2',
                    'type' => 'DRAFTING',
                    'actor' => 'assigned_pic',
                    'roles' => ['Staff'],
                    'dept_id' => $legalDeptId,
                    'reject_target' => 7,
                    'status' => 'in_review'
                ],
                [
                    'step' => 11,
                    'name' => 'Approval F2 (Legal Manager)',
                    'type' => 'APPROVAL',
                    'actor' => 'role',
                    'roles' => ['Manager'],
                    'dept_id' => $legalDeptId,
                    'reject_target' => 10,
                    'status' => 'in_review'
                ],
                [
                    'step' => 12,
                    'name' => 'Approval F2 (VP Legal)',
                    'type' => 'APPROVAL',
                    'actor' => 'role',
                    'roles' => ['Director'], // Fallback for VP
                    'dept_id' => $legalDeptId,
                    'reject_target' => 11,
                    'status' => 'in_review'
                ],
                [
                    'step' => 13,
                    'name' => 'Approval F2 (SPV Inisiator)',
                    'type' => 'APPROVAL',
                    'actor' => 'atasan',
                    'roles' => ['Manager'],
                    'reject_target' => 10,
                    'status' => 'in_review'
                ],
                [
                    'step' => 14,
                    'name' => 'Approval F2 (Manajemen)',
                    'type' => 'APPROVAL',
                    'actor' => 'role',
                    'roles' => ['CEO'],
                    'dept_id' => $mgmtDeptId,
                    'reject_target' => 10,
                    'status' => 'in_review'
                ],
                [
                    'step' => 15,
                    'name' => 'Penandatanganan (2 Pihak)',
                    'type' => 'SIGNING',
                    'actor' => 'assigned_pic',
                    'roles' => ['Staff'],
                    'dept_id' => $legalDeptId,
                    'reject_target' => 10,
                    'status' => 'locked',
                    'meta' => [
                        'signing_p1_type' => 'initiator',
                        'signing_p2_type' => 'director'
                    ]
                ],
                [
                    'step' => 16,
                    'name' => 'Closing & Arsip',
                    'type' => 'CLOSING',
                    'actor' => 'assigned_pic',
                    'roles' => ['Staff'],
                    'dept_id' => $legalDeptId,
                    'reject_target' => null,
                    'status' => 'archived'
                ],
            ];

            foreach ($steps as $s) {
                $step = WorkflowStep::create([
                    'workflow_id' => $workflow->id,
                    'step' => $s['step'],
                    'step_type' => $s['type'],
                    'step_category' => $s['category'] ?? null,
                    'approver_type' => $s['actor'],
                    'description' => $s['name'],
                    'reject_target' => $s['reject_target'],
                    'status_id' => $statuses[$s['status']] ?? null,
                    'condition_expression' => $s['condition'] ?? null,
                    'meta' => $s['meta'] ?? null,
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

            // --- B. Contract Types Mapping ---
            $contractTypes = [
                'A1-CON' => 'Standard A1 Contract',
                'PKS' => 'Perjanjian Kerja Sama (PKS)',
                'JASA' => 'Perjanjian Jasa',
                'PGB' => 'Perjanjian Pengadaan Barang',
                'SEWA' => 'Perjanjian Sewa',
                'LISENSI' => 'Perjanjian Lisensi',
                'DIST' => 'Perjanjian Distribusi',
                'OUTS' => 'Perjanjian Outsourcing',
                'JV' => 'Perjanjian Joint Venture',
                'NDA' => 'Perjanjian Kerahasiaan (NDA)',
                'ADD' => 'Addendum / Perpanjangan Kontrak',
                'INTERNAL' => 'Perjanjian Internal (Intercompany)',
                'CUSTOM' => 'Perjanjian Khusus (Custom)',
            ];

            foreach ($contractTypes as $code => $name) {
                ContractType::updateOrCreate(
                    ['code' => $code],
                    [
                        'name' => $name,
                        'workflow_id' => $workflow->id,
                        'is_active' => true,
                    ]
                );
            }

            echo "A1 Workflow (16 Steps) seeded and mapped to all contract types.\n";

            // 4. Map Allowed Actions for all steps
            $allSteps = WorkflowStep::where('workflow_id', $workflow->id)->get();
            foreach ($allSteps as $step) {
                $actions = [];
                switch (strtoupper($step->step_type)) {
                    case 'APPROVAL':
                        $actions = ['approve', 'reject', 'return'];
                        break;
                    case 'REVIEW':
                        $actions = ['review', 'return'];
                        break;
                    case 'UPLOAD':
                    case 'SIGNING':
                        $actions = ['upload', 'return'];
                        break;
                    case 'DRAFTING':
                        $actions = ($step->step === 1) ? ['approve'] : ['approve', 'assign'];
                        break;
                    case 'CLOSING':
                        $actions = ['approve'];
                        break;
                    default:
                        $actions = ['approve', 'reject'];
                        break;
                }
                $step->update(['allowed_actions' => $actions]);
            }
            echo "Workflow step actions seeded successfully.\n";
        });
    }
}
