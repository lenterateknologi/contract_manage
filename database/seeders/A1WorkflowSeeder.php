<?php

namespace Database\Seeders;

use App\Models\ContractStatus;
use App\Models\ContractType;
use App\Models\Department;
use App\Models\Workflow;
use App\Models\WorkflowStep;
use App\Models\WorkflowStepDepartment;
use App\Models\WorkflowStepRole;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class A1WorkflowSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            // 0. CLEANUP ALL EXISTING WORKFLOW DATA
            WorkflowStepRole::query()->delete();
            WorkflowStepDepartment::query()->delete();
            DB::table('m_workflow_step_actions')->delete();
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
                'description' => 'Master Workflow for Contracts (15 Steps) - Latest Version',
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
                    'status' => 'draft',
                ],
                [
                    'step' => 2,
                    'name' => 'Review Atasan Inisiator',
                    'type' => 'APPROVAL',
                    'actor' => 'atasan',
                    'roles' => ['Manager'],
                    'reject_target' => 1,
                    'status' => 'in_review',
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
                    'condition' => 'contract.has_tax',
                ],
                [
                    'step' => 4,
                    'name' => 'Approval VP / Vice President',
                    'type' => 'APPROVAL',
                    'actor' => 'role',
                    'roles' => ['VP'],
                    'dept_id' => $mgmtDeptId,
                    'reject_target' => 1,
                    'status' => 'in_review',
                ],
                [
                    'step' => 5,
                    'name' => 'Approval CEO / Manajemen',
                    'type' => 'APPROVAL',
                    'actor' => 'role',
                    'roles' => ['CEO'],
                    'dept_id' => $mgmtDeptId,
                    'reject_target' => 1,
                    'status' => 'in_review',
                ],
                [
                    'step' => 6,
                    'name' => 'Verifikasi & Penugasan PIC',
                    'type' => 'DRAFTING',
                    'actor' => 'role',
                    'roles' => ['Manager'],
                    'dept_id' => $legalDeptId,
                    'reject_target' => 1,
                    'status' => 'in_review',
                ],
                [
                    'step' => 7,
                    'name' => 'Drafting Agreement',
                    'type' => 'DRAFTING',
                    'actor' => 'assigned_pic',
                    'roles' => ['Staff'],
                    'dept_id' => $legalDeptId,
                    'reject_target' => 6,
                    'status' => 'in_review',
                ],
                [
                    'step' => 8,
                    'name' => 'Review Draft (Internal)',
                    'type' => 'REVIEW',
                    'actor' => 'role',
                    'roles' => ['Manager'],
                    'dept_id' => $legalDeptId,
                    'reject_target' => 7,
                    'status' => 'in_review',
                ],
                [
                    'step' => 9,
                    'name' => 'Sirkulasi Draft (Inisiator)',
                    'type' => 'REVIEW',
                    'actor' => 'initiator',
                    'roles' => ['initiator'],
                    'reject_target' => 7,
                    'status' => 'in_review',
                ],
                [
                    'step' => 10,
                    'name' => 'Input No & Generate F2',
                    'type' => 'DRAFTING',
                    'actor' => 'assigned_pic',
                    'roles' => ['Staff'],
                    'dept_id' => $legalDeptId,
                    'reject_target' => 7,
                    'status' => 'in_review',
                ],
                [
                    'step' => 11,
                    'name' => 'Approval F2 (Legal Manager)',
                    'type' => 'APPROVAL',
                    'actor' => 'role',
                    'roles' => ['Manager'],
                    'dept_id' => $legalDeptId,
                    'reject_target' => 10,
                    'status' => 'in_review',
                ],
                [
                    'step' => 12,
                    'name' => 'Approval F2 (VP Legal)',
                    'type' => 'APPROVAL',
                    'actor' => 'role',
                    'roles' => ['Director'], // Fallback for VP
                    'dept_id' => $legalDeptId,
                    'reject_target' => 11,
                    'status' => 'in_review',
                ],
                [
                    'step' => 13,
                    'name' => 'Approval F2 (SPV Inisiator)',
                    'type' => 'APPROVAL',
                    'actor' => 'atasan',
                    'roles' => ['Manager'],
                    'reject_target' => 10,
                    'status' => 'in_review',
                ],
                [
                    'step' => 14,
                    'name' => 'Approval F2 (Manajemen)',
                    'type' => 'APPROVAL',
                    'actor' => 'role',
                    'roles' => ['CEO'],
                    'dept_id' => $mgmtDeptId,
                    'reject_target' => 10,
                    'status' => 'in_review',
                ],
                [
                    'step' => 15,
                    'name' => 'Closing & Arsip',
                    'type' => 'CLOSING',
                    'category' => 'closing',
                    'actor' => 'assigned_pic',
                    'roles' => ['Staff'],
                    'dept_id' => $legalDeptId,
                    'reject_target' => null,
                    'status' => 'archived',
                ],
            ];

            $masterActions = DB::table('m_master_actions')->pluck('id', 'code')->toArray();

            foreach ($steps as $s) {
                $actions = [];
                switch (strtoupper($s['type'])) {
                    case 'APPROVAL':
                        $actions = ['approve', 'reject', 'return'];

                        break;
                    case 'REVIEW':
                        $actions = ['review', 'return'];

                        break;
                    case 'UPLOAD':
                        $actions = ['upload', 'return'];

                        break;
                    case 'SIGNING':
                        $actions = ['sign', 'return'];

                        break;
                    case 'DRAFTING':
                        $actions = ($s['step'] === 1) ? ['approve'] : ['approve', 'assign'];

                        break;
                    case 'CLOSING':
                        $actions = ['approve'];

                        break;
                    default:
                        $actions = ['approve', 'reject'];

                        break;
                }

                $step = WorkflowStep::create([
                    'workflow_id' => $workflow->id,
                    'step' => $s['step'],
                    'step_category' => $s['category'] ?? null,
                    'approver_type' => $s['actor'],
                    'description' => $s['name'],
                    'condition_expression' => $s['condition'] ?? null,
                    'meta' => $s['meta'] ?? null,
                    'is_active' => true,
                ]);

                foreach ($actions as $actCode) {
                    $masterActionId = $masterActions[$actCode] ?? null;
                    if (! $masterActionId) {
                        $masterActionId = \Illuminate\Support\Str::uuid()->toString();
                        DB::table('m_master_actions')->insert([
                            'id' => $masterActionId,
                            'name' => ucfirst($actCode),
                            'code' => $actCode,
                            'is_active' => true,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                        $masterActions[$actCode] = $masterActionId;
                    }

                    DB::table('m_workflow_step_actions')->insert([
                        'id' => \Illuminate\Support\Str::uuid()->toString(),
                        'workflow_step_id' => $step->id,
                        'master_action_id' => $masterActionId,
                        'required_fields' => json_encode([]),
                        'autofilled_fields' => json_encode($actCode === 'approve' && ($s['category'] ?? null) === 'closing' ? ['closed_at'] : []),
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

            // --- A.2. Link actions transitions ---
            $dbSteps = WorkflowStep::where('workflow_id', $workflow->id)->orderBy('step')->get();
            $stepMap = $dbSteps->pluck('id', 'step')->toArray();

            foreach ($dbSteps as $dbStep) {
                $nextStepId = $stepMap[$dbStep->step + 1] ?? null;
                $firstStepId = $stepMap[1] ?? null;

                $stepActions = DB::table('m_workflow_step_actions')
                    ->where('workflow_step_id', $dbStep->id)
                    ->get();

                foreach ($stepActions as $sa) {
                    $masterAction = DB::table('m_master_actions')->where('id', $sa->master_action_id)->first();
                    if ($masterAction) {
                        if ($masterAction->code === 'approve') {
                            DB::table('m_workflow_step_actions')
                                ->where('id', $sa->id)
                                ->update(['next_step_id' => $nextStepId]);
                        } elseif ($masterAction->code === 'reject') {
                            DB::table('m_workflow_step_actions')
                                ->where('id', $sa->id)
                                ->update(['next_step_id' => $firstStepId]);
                        }
                    }
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
                    ],
                );
            }

            echo "A1 Workflow (16 Steps) seeded and mapped to all contract types.\n";
            echo "Workflow step actions seeded successfully.\n";
        });
    }
}
