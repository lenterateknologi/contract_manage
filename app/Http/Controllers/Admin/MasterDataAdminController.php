<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\CompanyGroup;
use App\Models\ContractStatus;
use App\Models\ContractType;
use App\Models\Department;
use App\Models\Region;
use App\Models\Workflow;
use App\Models\WorkflowInitiatorDepartment;
use App\Models\WorkflowInitiatorRole;
use App\Models\WorkflowInitiatorUser;
use App\Models\WorkflowStep;
use App\Models\WorkflowStepAction;
use App\Models\WorkflowStepDepartment;
use App\Models\WorkflowStepRole;
use App\Models\WorkflowStepUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class MasterDataAdminController extends Controller
{
    /**
     * Display the index view with statistics.
     */
    public function index()
    {
        return Inertia::render('admin/index', [
            'currentView' => 'master-data-sync',
            'counts' => [
                'company_groups' => CompanyGroup::count(),
                'regions' => Region::count(),
                'companies' => Company::count(),
                'departments' => Department::count(),
                'contract_statuses' => ContractStatus::count(),
                'contract_types' => ContractType::count(),
                'workflows' => Workflow::count(),
                'roles' => \App\Models\Role::count(),
                'modules' => \App\Models\Module::count(),
                'access_mappings' => \App\Models\AccessModule::count(),
            ],
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Ekspor Impor Master', 'href' => route('admin.master-data-sync'), 'icon' => 'RefreshCw'],
            ],
        ]);
    }

    /**
     * Export all master data to JSON format.
     */
    public function export(Request $request)
    {
        try {
            $requestedEntities = $request->query('entities') ? explode(',', $request->query('entities')) : null;

            $exportData = [];

            // 1. Company Groups
            if (! $requestedEntities || in_array('company_groups', $requestedEntities)) {
                $exportData['company_groups'] = CompanyGroup::all()->map(function ($g) {
                    return [
                        'code' => $g->code,
                        'name' => $g->name,
                        'description' => $g->description,
                        'is_active' => $g->is_active,
                    ];
                })->toArray();
            }

            // 2. Regions
            if (! $requestedEntities || in_array('regions', $requestedEntities)) {
                $exportData['regions'] = Region::all()->map(function ($r) {
                    return [
                        'code' => $r->code,
                        'name' => $r->name,
                        'alias' => $r->alias,
                        'description' => $r->description,
                        'is_active' => $r->is_active,
                        'id_portal_master' => $r->id_portal_master,
                    ];
                })->toArray();
            }

            // 3. Companies
            if (! $requestedEntities || in_array('companies', $requestedEntities)) {
                $exportData['companies'] = Company::with(['group', 'region'])->get()->map(function ($c) {
                    return [
                        'code' => $c->code,
                        'name' => $c->name,
                        'alias' => $c->alias,
                        'address' => $c->address,
                        'company_group_code' => $c->group->code ?? null,
                        'region_code' => $c->region->code ?? null,
                        'is_active' => $c->is_active,
                    ];
                })->toArray();
            }

            // 4. Departments
            if (! $requestedEntities || in_array('departments', $requestedEntities)) {
                $exportData['departments'] = Department::with(['company'])->get()->map(function ($d) {
                    return [
                        'code' => $d->code,
                        'name' => $d->name,
                        'description' => $d->description,
                        'company_code' => $d->company->code ?? null,
                        'is_active' => $d->is_active,
                    ];
                })->toArray();
            }


            // 5. Contract Statuses
            if (! $requestedEntities || in_array('contract_statuses', $requestedEntities)) {
                $exportData['contract_statuses'] = ContractStatus::all()->map(function ($s) {
                    return [
                        'code' => $s->code,
                        'label' => $s->label,
                        'color' => $s->color,
                        'bg_color' => $s->bg_color,
                        'icon' => $s->icon,
                        'description' => $s->description,
                        'is_active' => $s->is_active,
                        'display_mode' => $s->display_mode,
                        'allow_info_edit' => $s->allow_info_edit,
                        'allow_reference' => $s->allow_reference,
                    ];
                })->toArray();
            }



            // 6. Workflows & Steps
            if (! $requestedEntities || in_array('workflows', $requestedEntities)) {
                $exportData['workflows'] = Workflow::all()->map(function ($w) {
                    return [
                        'id' => $w->id,
                        'contract_type' => $w->contract_type,
                        'department_id' => $w->department_id,
                        'name' => $w->name,
                        'description' => $w->description,
                        'is_default' => $w->is_default,
                        'is_template' => $w->is_template,
                        'is_tax_involved' => $w->is_tax_involved,
                        'initiator_type' => $w->initiator_type,
                        'sla_drafting_hours' => $w->sla_drafting_hours,
                        'sla_total_hours' => $w->sla_total_hours,
                        'sla_cutoff_hour' => $w->sla_cutoff_hour,
                        'scope' => $w->scope,
                        'workflow_category' => $w->workflow_category,
                        'company_group_ids' => $w->company_group_ids,
                        'region_ids' => $w->region_ids,
                        'company_ids' => $w->company_ids,
                        'approver_roles' => $w->approver_roles,
                        'approver_departments' => $w->approver_departments,
                        'approver_users' => $w->approver_users,
                        'legal_roles' => $w->legal_roles,
                        'legal_departments' => $w->legal_departments,
                        'legal_users' => $w->legal_users,
                        'created_by' => $w->created_by,
                        'updated_by' => $w->updated_by,
                    ];
                })->toArray();

                $exportData['workflow_steps'] = WorkflowStep::all()->map(function ($s) {
                    return [
                        'id' => $s->id,
                        'workflow_id' => $s->workflow_id,
                        'approver_type' => $s->approver_type,
                        'step' => $s->step,
                        'step_category' => $s->step_category,
                        'is_optional' => $s->is_optional,
                        'optional_label' => $s->optional_label,
                        'condition_expression' => $s->condition_expression,
                        'description' => $s->description,
                        'phase' => $s->phase,
                        'uploader_type' => $s->uploader_type,
                        'hierarchy_level' => $s->hierarchy_level,
                        'role_id' => $s->role_id,
                        'company_group_ids' => $s->company_group_ids,
                        'region_ids' => $s->region_ids,
                        'company_ids' => $s->company_ids,
                        'label' => $s->label,
                        'allowed_actions' => $s->allowed_actions,
                        'is_mandatory' => $s->is_mandatory,
                        'is_active' => $s->is_active,
                        'meta' => $s->meta,
                        'created_by' => $s->created_by,
                        'updated_by' => $s->updated_by,
                    ];
                })->toArray();

                $exportData['workflow_step_departments'] = WorkflowStepDepartment::all()->map(function ($d) {
                    return ['id' => $d->id, 'workflow_step_id' => $d->workflow_step_id, 'department_id' => $d->department_id];
                })->toArray();

                $exportData['workflow_step_roles'] = WorkflowStepRole::all()->map(function ($r) {
                    return ['id' => $r->id, 'workflow_step_id' => $r->workflow_step_id, 'role_name' => $r->role_name];
                })->toArray();

                $exportData['workflow_step_users'] = WorkflowStepUser::all()->map(function ($u) {
                    return ['id' => $u->id, 'workflow_step_id' => $u->workflow_step_id, 'user_id' => $u->user_id];
                })->toArray();

                $exportData['workflow_initiator_departments'] = WorkflowInitiatorDepartment::all()->map(function ($d) {
                    return ['id' => $d->id, 'workflow_id' => $d->workflow_id, 'department_id' => $d->department_id];
                })->toArray();

                $exportData['workflow_initiator_roles'] = WorkflowInitiatorRole::all()->map(function ($r) {
                    return ['id' => $r->id, 'workflow_id' => $r->workflow_id, 'role_name' => $r->role_name];
                })->toArray();

                $exportData['workflow_initiator_users'] = WorkflowInitiatorUser::all()->map(function ($u) {
                    return ['id' => $u->id, 'workflow_id' => $u->workflow_id, 'user_id' => $u->user_id];
                })->toArray();

                $exportData['workflow_step_actions'] = WorkflowStepAction::all()->map(function ($a) {
                    return [
                        'id' => $a->id, 'workflow_step_id' => $a->workflow_step_id, 'master_action_id' => $a->master_action_id,
                        'next_step_id' => $a->next_step_id, 'next_workflow_id' => $a->next_workflow_id, 'next_workflow_step_id' => $a->next_workflow_step_id,
                        'required_fields' => $a->required_fields, 'autofilled_fields' => $a->autofilled_fields, 'signing_parties' => $a->signing_parties,
                        'assignee_config' => $a->assignee_config, 'alias' => $a->alias, 'description' => $a->description, 'is_active' => $a->is_active,
                        'created_by' => $a->created_by, 'updated_by' => $a->updated_by,
                    ];
                })->toArray();
            }

            // 7. Roles
            if (! $requestedEntities || in_array('roles', $requestedEntities)) {
                $exportData['roles'] = \App\Models\Role::all()->map(function ($r) {
                    return ['id' => $r->id, 'name' => $r->name, 'description' => $r->description];
                })->toArray();
            }

            // 8. Access Mappings
            if (! $requestedEntities || in_array('access_mappings', $requestedEntities)) {
                $exportData['access_mappings'] = \App\Models\AccessModule::with(['role', 'module'])->get()->map(function ($am) {
                    return [
                        'role_name' => $am->role->name ?? null, 'module_identifier' => $am->module->identifier ?? null,
                        'can_read' => $am->can_read, 'can_create' => $am->can_create, 'can_update' => $am->can_update,
                        'can_delete' => $am->can_delete, 'can_approve' => $am->can_approve, 'can_bulk_approve' => $am->can_bulk_approve,
                        'can_bulk_delete' => $am->can_bulk_delete, 'module_group_id' => $am->module_group_id,
                    ];
                })->toArray();

                $exportData['role_navigation_mappings'] = \App\Models\RoleModuleGroup::with(['role', 'moduleGroup'])->get()->map(function ($rmg) {
                    return ['role_name' => $rmg->role->name ?? null, 'module_group_name' => $rmg->moduleGroup->name ?? null];
                })->toArray();
            }

            // 9. Contract Types (Dependent on Workflows)
            if (! $requestedEntities || in_array('contract_types', $requestedEntities)) {
                $exportData['contract_types'] = ContractType::with(['workflow', 'parent'])->get()->map(function ($t) {
                    return [
                        'code' => $t->code, 'name' => $t->name, 'parent_code' => $t->parent->code ?? null, 'workflow_name' => $t->workflow->name ?? null,
                        'features' => $t->features, 'description' => $t->description, 'f1_input_mechanism' => $t->f1_input_mechanism,
                        'f1_form_template_id' => $t->f1_form_template_id, 'f1_contract_template_id' => $t->f1_contract_template_id,
                        'f2_input_mechanism' => $t->f2_input_mechanism, 'f2_form_template_id' => $t->f2_form_template_id, 'f2_contract_template_id' => $t->f2_contract_template_id,
                    ];
                })->toArray();
            }

            $fileName = 'master_data_export_' . date('Ymd_His') . '.json';

            return response()->streamDownload(function () use ($exportData) {
                echo json_encode($exportData, JSON_PRETTY_PRINT);
            }, $fileName, [
                'Content-Type' => 'application/json',
            ]);
        } catch (\Exception $e) {
            Log::error('Master Data Export Error: ' . $e->getMessage());

            return back()->withErrors(['error' => 'Gagal mengekspor data master: ' . $e->getMessage()]);
        }
    }

    /**
     * Import master data from JSON.
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|extensions:json',
        ]);

        try {
            $content = file_get_contents($request->file('file')->getRealPath());
            $data = json_decode($content, true);

            if (! is_array($data)) {
                return back()->withErrors(['error' => 'Format file JSON tidak valid.']);
            }

            $counts = [
                'company_groups' => 0,
                'regions' => 0,
                'companies' => 0,
                'departments' => 0,
                'contract_statuses' => 0,
                'contract_types' => 0,
                'workflows' => 0,
                'workflow_steps' => 0,
                'workflow_step_departments' => 0,
                'workflow_step_roles' => 0,
                'workflow_step_users' => 0,
                'workflow_initiator_departments' => 0,
                'workflow_initiator_roles' => 0,
                'workflow_initiator_users' => 0,
                'workflow_step_actions' => 0,
                'roles' => 0,
                'access_mappings' => 0,
                'role_navigation_mappings' => 0,
            ];

            DB::transaction(function () use ($data, &$counts) {
                \Illuminate\Database\Eloquent\Model::unguard();
                $admin = \Illuminate\Support\Facades\Auth::id();

                // 0. Roles
                if (! empty($data['roles']) && is_array($data['roles'])) {
                    foreach ($data['roles'] as $r) {
                        if (empty($r['name'])) {
                            continue;
                        }
                        \App\Models\Role::updateOrCreate(
                            ['name' => $r['name']],
                            ['description' => $r['description'] ?? null],
                        );
                        $counts['roles']++;
                    }
                }

                $roleMap = \App\Models\Role::pluck('id', 'name')->all();
                $moduleMap = \App\Models\Module::pluck('id', 'identifier')->all();
                $moduleGroupMap = \App\Models\ModuleGroup::pluck('id', 'name')->all();

                // 1. Company Groups
                if (! empty($data['company_groups']) && is_array($data['company_groups'])) {
                    foreach ($data['company_groups'] as $g) {
                        if (empty($g['code'])) {
                            continue;
                        }
                        CompanyGroup::updateOrCreate(
                            ['code' => $g['code']],
                            [
                                'name' => $g['name'] ?? $g['code'],
                                'description' => $g['description'] ?? null,
                                'is_active' => $g['is_active'] ?? true,
                                'created_by' => $admin,
                                'updated_by' => $admin,
                            ],
                        );
                        $counts['company_groups']++;
                    }
                }

                // 2. Regions
                if (! empty($data['regions']) && is_array($data['regions'])) {
                    foreach ($data['regions'] as $r) {
                        if (empty($r['code'])) {
                            continue;
                        }
                        Region::updateOrCreate(
                            ['code' => $r['code']],
                            [
                                'name' => $r['name'] ?? $r['code'],
                                'alias' => $r['alias'] ?? null,
                                'description' => $r['description'] ?? null,
                                'is_active' => $r['is_active'] ?? true,
                                'id_portal_master' => $r['id_portal_master'] ?? null,
                                'created_by' => $admin,
                                'updated_by' => $admin,
                            ],
                        );
                        $counts['regions']++;
                    }
                }

                $groupMap = CompanyGroup::pluck('id', 'code')->all();
                $regionMap = Region::pluck('id', 'code')->all();

                // 3. Companies
                if (! empty($data['companies']) && is_array($data['companies'])) {
                    foreach ($data['companies'] as $c) {
                        if (empty($c['code'])) {
                            continue;
                        }
                        $groupId = ! empty($c['company_group_code']) ? ($groupMap[$c['company_group_code']] ?? null) : null;
                        $regionId = ! empty($c['region_code']) ? ($regionMap[$c['region_code']] ?? null) : null;

                        Company::updateOrCreate(
                            ['code' => $c['code']],
                            [
                                'name' => $c['name'] ?? $c['code'],
                                'alias' => $c['alias'] ?? null,
                                'address' => $c['address'] ?? null,
                                'company_group_id' => $groupId,
                                'region_id' => $regionId,
                                'is_active' => $c['is_active'] ?? true,
                                'created_by' => $admin,
                                'updated_by' => $admin,
                            ],
                        );
                        $counts['companies']++;
                    }
                }

                $companyMap = Company::pluck('id', 'code')->all();

                // 4. Departments
                if (! empty($data['departments']) && is_array($data['departments'])) {
                    foreach ($data['departments'] as $d) {
                        if (empty($d['code'])) {
                            continue;
                        }
                        $companyId = ! empty($d['company_code']) ? ($companyMap[$d['company_code']] ?? null) : null;

                        Department::updateOrCreate(
                            ['code' => $d['code']],
                            [
                                'name' => $d['name'] ?? $d['code'],
                                'description' => $d['description'] ?? null,
                                'company_id' => $companyId,
                                'is_active' => $d['is_active'] ?? true,
                                'created_by' => $admin,
                                'updated_by' => $admin,
                            ],
                        );
                        $counts['departments']++;
                    }
                }

                // 5. Contract Statuses
                if (! empty($data['contract_statuses']) && is_array($data['contract_statuses'])) {
                    foreach ($data['contract_statuses'] as $s) {
                        if (empty($s['code'])) {
                            continue;
                        }
                        ContractStatus::updateOrCreate(
                            ['code' => $s['code']],
                            [
                                'label' => $s['label'] ?? $s['code'],
                                'color' => $s['color'] ?? null,
                                'bg_color' => $s['bg_color'] ?? null,
                                'icon' => $s['icon'] ?? null,
                                'description' => $s['description'] ?? null,
                                'is_active' => $s['is_active'] ?? true,
                                'display_mode' => $s['display_mode'] ?? 'badge',
                                'allow_info_edit' => $s['allow_info_edit'] ?? false,
                                'allow_reference' => $s['allow_reference'] ?? false,
                                'created_by' => $admin,
                                'updated_by' => $admin,
                            ],
                        );
                        $counts['contract_statuses']++;
                    }
                }

                // 6. Workflows
                if (! empty($data['workflows']) && is_array($data['workflows'])) {
                    foreach ($data['workflows'] as $w) {
                        if (empty($w['id'])) {
                            continue;
                        }

                        // Map old contract_type string to contract_type_id UUID
                        if (array_key_exists('contract_type', $w)) {
                            $contractTypeVal = $w['contract_type'];
                            unset($w['contract_type']);
                            if ($contractTypeVal) {
                                $w['contract_type_id'] = ContractType::where('code', $contractTypeVal)
                                    ->orWhere('name', $contractTypeVal)
                                    ->value('id');
                            } else {
                                $w['contract_type_id'] = null;
                            }
                        }

                        Workflow::updateOrCreate(
                            ['id' => $w['id']],
                            $w,
                        );
                        $counts['workflows']++;
                    }
                }

                // 7. Workflow Initiator Departments
                if (! empty($data['workflow_initiator_departments']) && is_array($data['workflow_initiator_departments'])) {
                    foreach ($data['workflow_initiator_departments'] as $d) {
                        if (empty($d['id'])) {
                            continue;
                        }
                        $model = WorkflowInitiatorDepartment::firstOrNew(['id' => $d['id']]);
                        $model->forceFill($d)->save();
                        $counts['workflow_initiator_departments']++;
                    }
                }

                // 8. Workflow Initiator Roles
                if (! empty($data['workflow_initiator_roles']) && is_array($data['workflow_initiator_roles'])) {
                    foreach ($data['workflow_initiator_roles'] as $r) {
                        if (empty($r['id'])) {
                            continue;
                        }
                        $model = WorkflowInitiatorRole::firstOrNew(['id' => $r['id']]);
                        $model->forceFill($r)->save();
                        $counts['workflow_initiator_roles']++;
                    }
                }

                // 9. Workflow Initiator Users
                if (! empty($data['workflow_initiator_users']) && is_array($data['workflow_initiator_users'])) {
                    foreach ($data['workflow_initiator_users'] as $u) {
                        if (empty($u['id'])) {
                            continue;
                        }
                        $model = WorkflowInitiatorUser::firstOrNew(['id' => $u['id']]);
                        $model->forceFill($u)->save();
                        $counts['workflow_initiator_users']++;
                    }
                }

                // 10. Workflow Steps
                if (! empty($data['workflow_steps']) && is_array($data['workflow_steps'])) {
                    foreach ($data['workflow_steps'] as $s) {
                        if (empty($s['id'])) {
                            continue;
                        }
                        $model = WorkflowStep::firstOrNew(['id' => $s['id']]);
                        $model->forceFill($s)->save();
                        $counts['workflow_steps']++;
                    }
                }

                // 11. Workflow Step Departments
                if (! empty($data['workflow_step_departments']) && is_array($data['workflow_step_departments'])) {
                    foreach ($data['workflow_step_departments'] as $d) {
                        if (empty($d['id'])) {
                            continue;
                        }
                        $model = WorkflowStepDepartment::firstOrNew(['id' => $d['id']]);
                        $model->forceFill($d)->save();
                        $counts['workflow_step_departments']++;
                    }
                }

                // 12. Workflow Step Roles
                if (! empty($data['workflow_step_roles']) && is_array($data['workflow_step_roles'])) {
                    foreach ($data['workflow_step_roles'] as $r) {
                        if (empty($r['id'])) {
                            continue;
                        }
                        $model = WorkflowStepRole::firstOrNew(['id' => $r['id']]);
                        $model->forceFill($r)->save();
                        $counts['workflow_step_roles']++;
                    }
                }

                // 13. Workflow Step Users
                if (! empty($data['workflow_step_users']) && is_array($data['workflow_step_users'])) {
                    foreach ($data['workflow_step_users'] as $u) {
                        if (empty($u['id'])) {
                            continue;
                        }
                        $model = WorkflowStepUser::firstOrNew(['id' => $u['id']]);
                        $model->forceFill($u)->save();
                        $counts['workflow_step_users']++;
                    }
                }

                // 14. Workflow Step Actions
                if (! empty($data['workflow_step_actions']) && is_array($data['workflow_step_actions'])) {
                    foreach ($data['workflow_step_actions'] as $a) {
                        if (empty($a['id'])) {
                            continue;
                        }
                        $model = WorkflowStepAction::firstOrNew(['id' => $a['id']]);
                        $model->forceFill($a)->save();
                        $counts['workflow_step_actions']++;
                    }
                }

                $workflowMap = Workflow::pluck('id', 'name')->all();

                // 15. Contract Types
                if (! empty($data['contract_types']) && is_array($data['contract_types'])) {
                    foreach ($data['contract_types'] as $t) {
                        if (empty($t['code'])) {
                            continue;
                        }
                        $workflowId = ! empty($t['workflow_name']) ? ($workflowMap[$t['workflow_name']] ?? null) : null;

                        ContractType::updateOrCreate(
                            ['code' => $t['code']],
                            [
                                'name' => $t['name'] ?? $t['code'],
                                'workflow_id' => $workflowId,
                                'features' => $t['features'] ?? null,
                                'description' => $t['description'] ?? null,
                                'f1_input_mechanism' => $t['f1_input_mechanism'] ?? 'form',
                                'f1_form_template_id' => $t['f1_form_template_id'] ?? null,
                                'f1_contract_template_id' => $t['f1_contract_template_id'] ?? null,
                                'f2_input_mechanism' => $t['f2_input_mechanism'] ?? 'form',
                                'f2_form_template_id' => $t['f2_form_template_id'] ?? null,
                                'f2_contract_template_id' => $t['f2_contract_template_id'] ?? null,
                            ],
                        );
                        $counts['contract_types']++;
                    }

                    $typeMap = ContractType::pluck('id', 'code')->all();
                    foreach ($data['contract_types'] as $t) {
                        if (empty($t['code']) || empty($t['parent_code'])) {
                            continue;
                        }
                        $parentId = $typeMap[$t['parent_code']] ?? null;
                        if ($parentId) {
                            ContractType::where('code', $t['code'])->update(['parent_id' => $parentId]);
                        }
                    }
                }

                // 16. Access Mappings
                if (! empty($data['access_mappings']) && is_array($data['access_mappings'])) {
                    foreach ($data['access_mappings'] as $am) {
                        $roleId = $roleMap[$am['role_name']] ?? null;
                        $moduleId = $moduleMap[$am['module_identifier']] ?? null;

                        if ($roleId && $moduleId) {
                            \App\Models\AccessModule::updateOrCreate(
                                ['role_id' => $roleId, 'module_id' => $moduleId],
                                [
                                    'can_read' => $am['can_read'] ?? false,
                                    'can_create' => $am['can_create'] ?? false,
                                    'can_update' => $am['can_update'] ?? false,
                                    'can_delete' => $am['can_delete'] ?? false,
                                    'can_approve' => $am['can_approve'] ?? false,
                                    'can_bulk_approve' => $am['can_bulk_approve'] ?? false,
                                    'can_bulk_delete' => $am['can_bulk_delete'] ?? false,
                                    'module_group_id' => $am['module_group_id'] ?? null,
                                ],
                            );
                            $counts['access_mappings']++;
                        }
                    }
                }

                // 17. Role Navigation Mappings
                if (! empty($data['role_navigation_mappings']) && is_array($data['role_navigation_mappings'])) {
                    foreach ($data['role_navigation_mappings'] as $rmg) {
                        $roleId = $roleMap[$rmg['role_name']] ?? null;
                        $groupId = $moduleGroupMap[$rmg['module_group_name']] ?? null;

                        if ($roleId && $groupId) {
                            \App\Models\RoleModuleGroup::firstOrCreate([
                                'role_id' => $roleId,
                                'module_group_id' => $groupId,
                            ]);
                            $counts['role_navigation_mappings']++;
                        }
                    }
                }

            });

            $successMsg = sprintf(
                'Data master berhasil diimpor: %d Group, %d Region, %d Company, %d Departemen, %d Status, %d Tipe Kontrak, %d Workflow, %d Role, %d Mapping Akses, %d Mapping Navigasi.',
                $counts['company_groups'],
                $counts['regions'],
                $counts['companies'],
                $counts['departments'],
                $counts['contract_statuses'],
                $counts['contract_types'],
                $counts['workflows'],
                $counts['roles'],
                $counts['access_mappings'],
                $counts['role_navigation_mappings'],
            );

            return redirect()->route('admin.master-data-sync')->with('success', $successMsg);
        } catch (\Exception $e) {
            Log::error('Master Data Import Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->withErrors(['error' => 'Gagal mengimpor data master: ' . $e->getMessage()]);
        }
    }
}
