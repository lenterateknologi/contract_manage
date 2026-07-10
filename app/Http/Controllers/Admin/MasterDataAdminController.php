<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CleanMasterDataRequest;
use App\Http\Requests\Admin\ImportMasterDataRequest;
use App\Models\AccessModule;
use App\Models\Company;
use App\Models\CompanyGroup;
use App\Models\Contract;
use App\Models\ContractStatus;
use App\Models\ContractType;
use App\Models\Department;
use App\Models\Division;
use App\Models\FormField;
use App\Models\FormTemplate;
use App\Models\Module;
use App\Models\ModuleGroup;
use App\Models\Region;
use App\Models\Role;
use App\Models\RoleModuleGroup;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowInitiatorAuthority;
use App\Models\WorkflowOrgScope;
use App\Models\WorkflowStep;
use App\Models\WorkflowStepAction;
use App\Models\WorkflowStepAuthority;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Inertia\Inertia;

class MasterDataAdminController extends Controller
{
    /**
     * Display the index view with statistics.
     */
    public function index()
    {
        return Inertia::render('admin/Index', [
            'currentView' => 'master-data-sync',
            'counts' => [
                'company_groups' => CompanyGroup::count(),
                'regions' => Region::count(),
                'companies' => Company::count(),
                'departments' => Department::count(),
                'divisions' => Division::count(),
                'contract_statuses' => ContractStatus::count(),
                'contract_types' => ContractType::count(),
                'workflows' => Workflow::count(),
                'contracts' => Contract::count(),
                'roles' => Role::count(),
                'modules' => Module::count(),
                'access_mappings' => AccessModule::count(),
                'navigation_mappings' => RoleModuleGroup::count(),
                'form_templates' => FormTemplate::count(),
                'form_fields' => FormField::count(),
                'users' => User::count(),
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
                        'id' => $g->id,
                        'code' => $g->code,
                        'name' => $g->name,
                        'description' => $g->description,
                        'is_active' => $g->is_active,
                        'deleted_at' => null,
                    ];
                })->toArray();
            }

            // 2. Regions
            if (! $requestedEntities || in_array('regions', $requestedEntities)) {
                $exportData['regions'] = Region::all()->map(function ($r) {
                    return [
                        'id' => $r->id,
                        'code' => $r->code,
                        'name' => $r->name,
                        'alias' => $r->alias,
                        'description' => $r->description,
                        'is_active' => $r->is_active,
                        'deleted_at' => null,
                        'id_portal_master' => $r->id_portal_master,
                    ];
                })->toArray();
            }

            // 3. Companies
            if (! $requestedEntities || in_array('companies', $requestedEntities)) {
                $exportData['companies'] = Company::with(['group', 'region'])->get()->map(function ($c) {
                    return [
                        'id' => $c->id,
                        'code' => $c->code,
                        'name' => $c->name,
                        'alias' => $c->alias,
                        'address' => $c->address,
                        'company_group_code' => $c->group->code ?? null,
                        'region_code' => $c->region->code ?? null,
                        'is_active' => $c->is_active,
                        'deleted_at' => null,
                    ];
                })->toArray();
            }

            // 4. Departments
            if (! $requestedEntities || in_array('departments', $requestedEntities)) {
                $exportData['departments'] = Department::with(['company'])->get()->map(function ($d) {
                    return [
                        'id' => $d->id,
                        'code' => $d->code,
                        'name' => $d->name,
                        'description' => $d->description,
                        'company_code' => $d->company->code ?? null,
                        'is_active' => $d->is_active,
                        'deleted_at' => null,
                    ];
                })->toArray();
            }

            // 4b. Divisions
            if (! $requestedEntities || in_array('divisions', $requestedEntities)) {
                $exportData['divisions'] = Division::with(['department'])->get()->map(function ($d) {
                    return [
                        'id' => $d->id,
                        'code' => $d->code,
                        'name' => $d->name,
                        'department_code' => $d->department->code ?? null,
                        'id_portal_master' => $d->id_portal_master,
                        'is_active' => $d->is_active,
                        'deleted_at' => null,
                    ];
                })->toArray();
            }

            // 5. Contract Statuses
            if (! $requestedEntities || in_array('contract_statuses', $requestedEntities)) {
                $exportData['contract_statuses'] = ContractStatus::all()->map(function ($s) {
                    return [
                        'id' => $s->id,
                        'code' => $s->code,
                        'label' => $s->label,
                        'color' => $s->color,
                        'bg_color' => $s->bg_color,
                        'icon' => $s->icon,
                        'description' => $s->description,
                        'is_active' => $s->is_active,
                        'deleted_at' => null,
                    ];
                })->toArray();
            }

            // 6. Workflows & Steps
            if (! $requestedEntities || in_array('workflows', $requestedEntities)) {
                $exportData['workflows'] = Workflow::all()->map(function ($w) {
                    return [
                        'id' => $w->id,
                        'contract_type_id' => $w->contract_type_id,
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
                        'deleted_at' => null,
                        'meta' => $s->meta,
                        'created_by' => $s->created_by,
                        'updated_by' => $s->updated_by,
                    ];
                })->toArray();

                $exportData['workflow_step_authorities'] = WorkflowStepAuthority::with(['user', 'department', 'division'])->get()->map(function ($a) {
                    return [
                        'id' => $a->id,
                        'workflow_step_id' => $a->workflow_step_id,
                        'role_id' => $a->role_id,
                        'department_id' => $a->department_id,
                        'division_id' => $a->division_id,
                        'user_id' => $a->user_id,
                        'user_email' => $a->user->email ?? null,
                    ];
                })->toArray();

                $exportData['workflow_initiator_authorities'] = WorkflowInitiatorAuthority::with(['user', 'department'])->get()->map(function ($a) {
                    return [
                        'id' => $a->id,
                        'workflow_id' => $a->workflow_id,
                        'role_id' => $a->role_id,
                        'department_id' => $a->department_id,
                        'division_id' => $a->division_id,
                        'user_id' => $a->user_id,
                        'user_email' => $a->user->email ?? null,
                    ];
                })->toArray();

                $exportData['workflow_org_scopes'] = WorkflowOrgScope::all()->map(function ($s) {
                    return [
                        'id' => $s->id,
                        'workflow_id' => $s->workflow_id,
                        'company_group_id' => $s->company_group_id,
                        'region_id' => $s->region_id,
                        'company_id' => $s->company_id,
                    ];
                })->toArray();

                $exportData['workflow_step_actions'] = WorkflowStepAction::all()->map(function ($a) {
                    return [
                        'id' => $a->id,
                        'workflow_step_id' => $a->workflow_step_id,

                        'action_code' => $a->action_code ? $a->action_code->value : null,
                        'next_step_id' => $a->next_step_id,
                        'next_workflow_id' => $a->next_workflow_id,
                        'next_workflow_step_id' => $a->next_workflow_step_id,
                        'required_fields' => $a->required_fields,
                        'autofilled_fields' => $a->autofilled_fields,
                        'signing_parties' => $a->signing_parties,
                        'assignee_config' => $a->assignee_config,
                        'alias' => $a->alias,
                        'description' => $a->description,
                        'is_active' => $a->is_active,
                        'deleted_at' => null,
                        'created_by' => $a->created_by,
                        'updated_by' => $a->updated_by,
                    ];
                })->toArray();
            }

            // 7. Roles
            if (! $requestedEntities || in_array('roles', $requestedEntities)) {
                $exportData['roles'] = Role::all()->map(function ($r) {
                    return ['id' => $r->id, 'name' => $r->name, 'description' => $r->description];
                })->toArray();
            }

            // 8. Access Mappings
            if (! $requestedEntities || in_array('access_mappings', $requestedEntities)) {
                $exportData['access_mappings'] = AccessModule::with(['role', 'module', 'moduleGroup'])->get()->map(function ($am) {
                    return [
                        'role_name' => $am->role->name ?? null,
                        'module_identifier' => $am->module->identifier ?? null,
                        'module_group_name' => $am->moduleGroup->name ?? null,
                        'can_read' => $am->can_read,
                        'can_create' => $am->can_create,
                        'can_update' => $am->can_update,
                        'can_delete' => $am->can_delete,
                        'can_approve' => $am->can_approve,
                        'can_bulk_approve' => $am->can_bulk_approve,
                        'can_bulk_delete' => $am->can_bulk_delete,
                        'sequence' => $am->sequence,
                    ];
                })->toArray();
            }

            // 8b. Navigation Mappings
            if (! $requestedEntities || in_array('navigation_mappings', $requestedEntities)) {
                $exportData['role_navigation_mappings'] = RoleModuleGroup::with(['role', 'moduleGroup'])->get()->map(function ($rmg) {
                    $modules = AccessModule::where('role_id', $rmg->role_id)
                        ->where('module_group_id', $rmg->module_group_id)
                        ->where('can_read', true)
                        ->with('module')
                        ->orderBy('sequence')
                        ->get()
                        ->map(function ($am) {
                            return [
                                'module_identifier' => $am->module->identifier ?? null,
                                'sequence' => $am->sequence,
                            ];
                        })->filter(fn ($m) => ! is_null($m['module_identifier']))->values()->toArray();

                    return [
                        'role_name' => $rmg->role->name ?? null,
                        'module_group_name' => $rmg->moduleGroup->name ?? null,
                        'sequence' => $rmg->sequence,
                        'modules' => $modules,
                    ];
                })->toArray();
            }

            // 8c. Module Groups & Modules (Exported automatically for navigation or access mappings)
            if (! $requestedEntities || in_array('navigation_mappings', $requestedEntities) || in_array('access_mappings', $requestedEntities)) {
                $exportData['module_groups'] = ModuleGroup::all()->map(function ($mg) {
                    return [
                        'name' => $mg->name,
                        'icon' => $mg->icon,
                    ];
                })->toArray();

                $exportData['modules'] = Module::with(['moduleGroup'])->get()->map(function ($m) {
                    return [
                        'identifier' => $m->identifier,
                        'name' => $m->name,
                        'route' => $m->route,
                        'icon' => $m->icon,
                        'description' => $m->description,
                        'module_group_name' => $m->moduleGroup->name ?? null,
                        'showed_as_menu' => $m->showed_as_menu,
                    ];
                })->toArray();
            }

            // 8d. Form Templates & Fields
            if (! $requestedEntities || in_array('form_templates', $requestedEntities)) {
                $exportData['form_templates'] = FormTemplate::with('contractType')->get()->map(function ($ft) {
                    return [
                        'id' => $ft->id,
                        'name' => $ft->name,
                        'description' => $ft->description,
                        'contract_type_code' => $ft->contractType->code ?? null,
                        'document_type' => $ft->document_type,
                        'has_letterhead' => $ft->has_letterhead,
                        'letterhead_json' => $ft->letterhead_json,
                        'is_active' => $ft->is_active,
                        'deleted_at' => null,
                    ];
                })->toArray();

                $exportData['form_fields'] = FormField::all()->map(function ($ff) {
                    return [
                        'id' => $ff->id,
                        'form_template_id' => $ff->form_template_id,
                        'parent_id' => $ff->parent_id,
                        'label' => $ff->label,
                        'name' => $ff->name,
                        'type' => $ff->type,
                        'container_type' => $ff->container_type,
                        'placeholder' => $ff->placeholder,
                        'is_required' => $ff->is_required,
                        'use_rich_text' => $ff->use_rich_text,
                        'width' => $ff->width,
                        'options' => $ff->options,
                        'order' => $ff->order,
                        'validation_rules' => $ff->validation_rules,
                    ];
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

            // 10. Users
            if (! $requestedEntities || in_array('users', $requestedEntities)) {
                $exportData['users'] = User::with(['roleRelation', 'department', 'company', 'companyGroup'])->get()->map(function ($u) {
                    return [
                        'id' => $u->id,
                        'name' => $u->name,
                        'email' => $u->email,
                        'username' => $u->username,
                        'code' => $u->code,
                        'phone_number' => $u->phone_number,
                        'is_active' => $u->is_active,
                        'deleted_at' => null,
                        'is_employee' => $u->is_employee,
                        'role_name' => $u->roleRelation->name ?? null,
                        'department_name' => $u->department->name ?? null,
                        'company_code' => $u->company->code ?? null,
                        'company_group_code' => $u->companyGroup->code ?? null,
                    ];
                })->toArray();
            }

            $fileName = 'master_data_export_'.date('Ymd_His').'.json';

            return response()->streamDownload(function () use ($exportData) {
                echo json_encode($exportData, JSON_PRETTY_PRINT);
            }, $fileName, [
                'Content-Type' => 'application/json',
            ]);
        } catch (\Exception $e) {
            Log::error('Master Data Export Error: '.$e->getMessage());

            return back()->withErrors(['error' => 'Gagal mengekspor data master: '.$e->getMessage()]);
        }
    }

    /**
     * Parse and process import of master data array.
     */
    private function executeImport(array $data): array
    {
        $counts = [
            'company_groups' => 0,
            'regions' => 0,
            'companies' => 0,
            'departments' => 0,
            'divisions' => 0,
            'contract_statuses' => 0,
            'contract_types' => 0,
            'workflows' => 0,
            'workflow_steps' => 0,
            'workflow_step_authorities' => 0,
            'workflow_initiator_authorities' => 0,
            'workflow_org_scopes' => 0,
            'workflow_step_actions' => 0,
            'roles' => 0,
            'access_mappings' => 0,
            'role_navigation_mappings' => 0,
            'form_templates' => 0,
            'form_fields' => 0,
            'users' => 0,
        ];

        Model::unguard();
        $admin = Auth::id();

        // 0. Roles
        if (! empty($data['roles']) && is_array($data['roles'])) {
            foreach ($data['roles'] as $r) {
                try {
                    if (empty($r['name'])) {
                        continue;
                    }
                    Role::withTrashed()->updateOrCreate(
                        ! empty($r['id']) ? ['id' => $r['id']] : ['name' => $r['name']],
                        [
                            'name' => $r['name'],
                            'description' => $r['description'] ?? null,
                        ],
                    );
                    $counts['roles']++;
                } catch (\Exception $e) {
                    Log::warning('Gagal mengimpor Role '.($r['name'] ?? '').': '.$e->getMessage());
                }
            }
        }

        $roleMap = Role::pluck('id', 'name')->all();
        $roleIdMap = [];
        if (! empty($data['roles']) && is_array($data['roles'])) {
            foreach ($data['roles'] as $r) {
                if (! empty($r['id']) && ! empty($r['name'])) {
                    $roleIdMap[$r['id']] = $roleMap[$r['name']] ?? null;
                }
            }
        }

        $moduleMap = Module::pluck('id', 'identifier')->all();
        $moduleGroupMap = ModuleGroup::pluck('id', 'name')->all();

        // Import Module Groups if present in navigation_mappings
        if (! empty($data['module_groups']) && is_array($data['module_groups'])) {
            foreach ($data['module_groups'] as $mg) {
                try {
                    if (empty($mg['name'])) {
                        continue;
                    }
                    $existingGroup = ModuleGroup::withTrashed()->where('name', $mg['name'])->first();
                    if ($existingGroup) {
                        $existingGroup->update([
                            'icon' => $mg['icon'] ?? 'LayoutGrid',
                            'updated_by' => $admin,
                            'deleted_at' => null,
                        ]);
                    } else {
                        ModuleGroup::create([
                            'id' => $mg['id'] ?? (string) Str::uuid(),
                            'name' => $mg['name'],
                            'icon' => $mg['icon'] ?? 'LayoutGrid',
                            'deleted_at' => null,
                            'created_by' => $admin,
                            'updated_by' => $admin,
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::warning('Gagal mengimpor ModuleGroup '.($mg['name'] ?? '').': '.$e->getMessage());
                }
            }
            $moduleGroupMap = ModuleGroup::pluck('id', 'name')->all();
        }

        // Import Modules if present in navigation_mappings
        if (! empty($data['modules']) && is_array($data['modules'])) {
            foreach ($data['modules'] as $m) {
                try {
                    if (empty($m['identifier'])) {
                        continue;
                    }
                    $groupId = ! empty($m['module_group_name']) ? ($moduleGroupMap[$m['module_group_name']] ?? null) : null;
                    Module::withTrashed()->updateOrCreate(
                        ! empty($m['id']) ? ['id' => $m['id']] : ['identifier' => $m['identifier']],
                        [
                            'identifier' => $m['identifier'],
                            'name' => $m['name'],
                            'route' => $m['route'] ?? null,
                            'icon' => $m['icon'] ?? null,
                            'description' => $m['description'] ?? null,
                            'module_group_id' => $groupId,
                            'showed_as_menu' => $m['showed_as_menu'] ?? true,
                            'deleted_at' => null,
                            'created_by' => $admin,
                            'updated_by' => $admin,
                        ],
                    );
                } catch (\Exception $e) {
                    Log::warning('Gagal mengimpor Module '.($m['name'] ?? '').': '.$e->getMessage());
                }
            }
            $moduleMap = Module::pluck('id', 'identifier')->all();
        }

        // 1. Company Groups
        if (! empty($data['company_groups']) && is_array($data['company_groups'])) {
            foreach ($data['company_groups'] as $g) {
                try {
                    if (empty($g['code'])) {
                        continue;
                    }
                    CompanyGroup::withTrashed()->updateOrCreate(
                        ! empty($g['id']) ? ['id' => $g['id']] : ['code' => $g['code']],
                        [
                            'code' => $g['code'],
                            'name' => $g['name'] ?? $g['code'],
                            'description' => $g['description'] ?? null,
                            'is_active' => $g['is_active'] ?? true,
                            'deleted_at' => null,
                            'deleted_at' => null,
                            'created_by' => $admin,
                            'updated_by' => $admin,
                        ],
                    );
                    $counts['company_groups']++;
                } catch (\Exception $e) {
                    Log::warning('Gagal mengimpor CompanyGroup '.($g['code'] ?? '').': '.$e->getMessage());
                }
            }
        }

        $groupMap = CompanyGroup::pluck('id', 'code')->all();
        $companyGroupIdMap = [];
        if (! empty($data['company_groups']) && is_array($data['company_groups'])) {
            foreach ($data['company_groups'] as $g) {
                if (! empty($g['id']) && ! empty($g['code'])) {
                    $companyGroupIdMap[$g['id']] = $groupMap[$g['code']] ?? null;
                }
            }
        }

        // 2. Regions
        if (! empty($data['regions']) && is_array($data['regions'])) {
            foreach ($data['regions'] as $r) {
                try {
                    if (empty($r['code'])) {
                        continue;
                    }
                    Region::withTrashed()->updateOrCreate(
                        ! empty($r['id']) ? ['id' => $r['id']] : ['code' => $r['code']],
                        [
                            'code' => $r['code'],
                            'name' => $r['name'] ?? $r['code'],
                            'alias' => $r['alias'] ?? null,
                            'description' => $r['description'] ?? null,
                            'is_active' => $r['is_active'] ?? true,
                            'deleted_at' => null,
                            'id_portal_master' => $r['id_portal_master'] ?? null,
                            'deleted_at' => null,
                            'created_by' => $admin,
                            'updated_by' => $admin,
                        ],
                    );
                    $counts['regions']++;
                } catch (\Exception $e) {
                    Log::warning('Gagal mengimpor Region '.($r['code'] ?? '').': '.$e->getMessage());
                }
            }
        }

        $regionMap = Region::pluck('id', 'code')->all();
        $regionIdMap = [];
        if (! empty($data['regions']) && is_array($data['regions'])) {
            foreach ($data['regions'] as $r) {
                if (! empty($r['id']) && ! empty($r['code'])) {
                    $regionIdMap[$r['id']] = $regionMap[$r['code']] ?? null;
                }
            }
        }

        // 3. Companies
        if (! empty($data['companies']) && is_array($data['companies'])) {
            foreach ($data['companies'] as $c) {
                try {
                    if (empty($c['code'])) {
                        continue;
                    }
                    $groupId = ! empty($c['company_group_code']) ? ($groupMap[$c['company_group_code']] ?? null) : null;
                    $regionId = ! empty($c['region_code']) ? ($regionMap[$c['region_code']] ?? null) : null;

                    Company::withTrashed()->updateOrCreate(
                        ! empty($c['id']) ? ['id' => $c['id']] : ['code' => $c['code']],
                        [
                            'code' => $c['code'],
                            'name' => $c['name'] ?? $c['code'],
                            'alias' => $c['alias'] ?? null,
                            'address' => $c['address'] ?? null,
                            'company_group_id' => $groupId,
                            'region_id' => $regionId,
                            'is_active' => $c['is_active'] ?? true,
                            'deleted_at' => null,
                            'deleted_at' => null,
                            'created_by' => $admin,
                            'updated_by' => $admin,
                        ],
                    );
                    $counts['companies']++;
                } catch (\Exception $e) {
                    Log::warning('Gagal mengimpor Company '.($c['code'] ?? '').': '.$e->getMessage());
                }
            }
        }

        $companyMap = Company::pluck('id', 'code')->all();
        $companyIdMap = [];
        if (! empty($data['companies']) && is_array($data['companies'])) {
            foreach ($data['companies'] as $c) {
                if (! empty($c['id']) && ! empty($c['code'])) {
                    $companyIdMap[$c['id']] = $companyMap[$c['code']] ?? null;
                }
            }
        }

        // 4. Departments
        if (! empty($data['departments']) && is_array($data['departments'])) {
            foreach ($data['departments'] as $d) {
                try {
                    if (empty($d['code'])) {
                        continue;
                    }
                    $companyId = ! empty($d['company_code']) ? ($companyMap[$d['company_code']] ?? null) : null;

                    Department::withTrashed()->updateOrCreate(
                        ! empty($d['id']) ? ['id' => $d['id']] : ['code' => $d['code']],
                        [
                            'code' => $d['code'],
                            'name' => $d['name'] ?? $d['code'],
                            'description' => $d['description'] ?? null,
                            'company_id' => $companyId,
                            'is_active' => $d['is_active'] ?? true,
                            'deleted_at' => null,
                            'deleted_at' => null,
                            'created_by' => $admin,
                            'updated_by' => $admin,
                        ],
                    );
                    $counts['departments']++;
                } catch (\Exception $e) {
                    Log::warning('Gagal mengimpor Department '.($d['code'] ?? '').': '.$e->getMessage());
                }
            }
        }

        $deptMap = Department::pluck('id', 'code')->all();
        $departmentIdMap = [];
        if (! empty($data['departments']) && is_array($data['departments'])) {
            foreach ($data['departments'] as $d) {
                if (! empty($d['id']) && ! empty($d['code'])) {
                    $departmentIdMap[$d['id']] = $deptMap[$d['code']] ?? null;
                }
            }
        }

        // 4b. Divisions
        if (! empty($data['divisions']) && is_array($data['divisions'])) {
            foreach ($data['divisions'] as $d) {
                try {
                    if (empty($d['code']) && empty($d['name'])) {
                        continue;
                    }
                    $deptId = ! empty($d['department_code']) ? ($deptMap[$d['department_code']] ?? null) : null;

                    Division::withTrashed()->updateOrCreate(
                        ! empty($d['id']) ? ['id' => $d['id']] : ['code' => $d['code']],
                        [
                            'code' => $d['code'] ?? null,
                            'name' => $d['name'],
                            'department_id' => $deptId,
                            'id_portal_master' => $d['id_portal_master'] ?? null,
                            'is_active' => $d['is_active'] ?? true,
                            'deleted_at' => null,
                            'deleted_at' => null,
                            'deleted_at' => null,
                            'created_by' => $admin,
                            'updated_by' => $admin,
                        ],
                    );
                    $counts['divisions']++;
                } catch (\Exception $e) {
                    Log::warning('Gagal mengimpor Division '.($d['name'] ?? '').': '.$e->getMessage());
                }
            }
        }

        $divisionMap = Division::pluck('id', 'code')->all();
        $divisionIdMap = [];
        if (! empty($data['divisions']) && is_array($data['divisions'])) {
            foreach ($data['divisions'] as $d) {
                if (! empty($d['id']) && ! empty($d['code'])) {
                    $divisionIdMap[$d['id']] = $divisionMap[$d['code']] ?? null;
                }
            }
        }

        // 5. Contract Statuses
        if (! empty($data['contract_statuses']) && is_array($data['contract_statuses'])) {
            foreach ($data['contract_statuses'] as $s) {
                try {
                    if (empty($s['code'])) {
                        continue;
                    }
                    ContractStatus::withTrashed()->updateOrCreate(
                        ! empty($s['id']) ? ['id' => $s['id']] : ['code' => $s['code']],
                        [
                            'code' => $s['code'],
                            'label' => $s['label'] ?? $s['code'],
                            'color' => $s['color'] ?? null,
                            'bg_color' => $s['bg_color'] ?? null,
                            'icon' => $s['icon'] ?? null,
                            'description' => $s['description'] ?? null,
                            'is_active' => $s['is_active'] ?? true,
                            'deleted_at' => null,
                            'deleted_at' => null,
                            'created_by' => $admin,
                            'updated_by' => $admin,
                        ],
                    );
                    $counts['contract_statuses']++;
                } catch (\Exception $e) {
                    Log::warning('Gagal mengimpor ContractStatus '.($s['code'] ?? '').': '.$e->getMessage());
                }
            }
        }

        $statusMap = ContractStatus::pluck('id', 'code')->all();
        $contractStatusIdMap = [];
        if (! empty($data['contract_statuses']) && is_array($data['contract_statuses'])) {
            foreach ($data['contract_statuses'] as $s) {
                if (! empty($s['id']) && ! empty($s['code'])) {
                    $contractStatusIdMap[$s['id']] = $statusMap[$s['code']] ?? null;
                }
            }
        }

        // 6. Workflows
        $workflowIdMap = [];
        $workflowContractTypeUpdates = [];
        if (! empty($data['workflows']) && is_array($data['workflows'])) {
            foreach ($data['workflows'] as $w) {
                try {
                    if (empty($w['id'])) {
                        continue;
                    }

                    // Translate department_id
                    $w['department_id'] = ! empty($w['department_id']) ? ($departmentIdMap[$w['department_id']] ?? $w['department_id']) : null;

                    // Translate company_group_ids
                    if (! empty($w['company_group_ids'])) {
                        $oldIds = is_array($w['company_group_ids']) ? $w['company_group_ids'] : json_decode($w['company_group_ids'], true);
                        if (is_array($oldIds)) {
                            $newIds = array_map(fn ($id) => $companyGroupIdMap[$id] ?? $id, $oldIds);
                            $w['company_group_ids'] = json_encode($newIds);
                        }
                    }

                    // Translate region_ids
                    if (! empty($w['region_ids'])) {
                        $oldIds = is_array($w['region_ids']) ? $w['region_ids'] : json_decode($w['region_ids'], true);
                        if (is_array($oldIds)) {
                            $newIds = array_map(fn ($id) => $regionIdMap[$id] ?? $id, $oldIds);
                            $w['region_ids'] = json_encode($newIds);
                        }
                    }

                    // Translate company_ids
                    if (! empty($w['company_ids'])) {
                        $oldIds = is_array($w['company_ids']) ? $w['company_ids'] : json_decode($w['company_ids'], true);
                        if (is_array($oldIds)) {
                            $newIds = array_map(fn ($id) => $companyIdMap[$id] ?? $id, $oldIds);
                            $w['company_ids'] = json_encode($newIds);
                        }
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

                    $dbW = Workflow::withTrashed()->updateOrCreate(
                        ['id' => $w['id']],
                        [
                            'name' => $w['name'],
                            'description' => $w['description'] ?? null,
                            'is_default' => $w['is_default'] ?? false,
                            'is_template' => $w['is_template'] ?? false,
                            'is_tax_involved' => $w['is_tax_involved'] ?? false,
                            'initiator_type' => $w['initiator_type'] ?? 'all',
                            'sla_drafting_hours' => $w['sla_drafting_hours'] ?? 72,
                            'sla_total_hours' => $w['sla_total_hours'] ?? 240,
                            'sla_cutoff_hour' => $w['sla_cutoff_hour'] ?? 16,
                            'scope' => $w['scope'] ?? 'HO',
                            'workflow_category' => $w['workflow_category'] ?? 'unified',
                            'company_group_ids' => $w['company_group_ids'] ?? null,
                            'region_ids' => $w['region_ids'] ?? null,
                            'company_ids' => $w['company_ids'] ?? null,
                            'department_id' => $w['department_id'] ?? null,
                            // 'contract_type_id' => $w['contract_type_id'] ?? null, // deferred
                            'is_active' => $w['is_active'] ?? true,
                            'deleted_at' => null,
                            'deleted_at' => null,
                            'created_by' => $admin,
                            'updated_by' => $admin,
                        ],
                    );
                    $workflowIdMap[$w['id']] = $dbW->id;
                    if (! empty($w['contract_type_id'])) {
                        $workflowContractTypeUpdates[$w['id']] = $w['contract_type_id'];
                    }
                    $counts['workflows']++;
                } catch (\Exception $e) {
                    Log::warning('Gagal mengimpor Workflow '.($w['name'] ?? '').': '.$e->getMessage());
                }
            }
        }

        // 7. Workflow Initiator Authorities
        $userEmailMap = User::pluck('id', 'email')->all();
        if (! empty($data['workflow_initiator_authorities']) && is_array($data['workflow_initiator_authorities'])) {
            foreach ($data['workflow_initiator_authorities'] as $auth) {
                try {
                    if (empty($auth['id'])) {
                        continue;
                    }
                    $wfId = $workflowIdMap[$auth['workflow_id']] ?? $auth['workflow_id'];
                    $deptId = ! empty($auth['department_id']) ? ($departmentIdMap[$auth['department_id']] ?? $auth['department_id']) : null;
                    $newUserId = ! empty($auth['user_email']) ? ($userEmailMap[$auth['user_email']] ?? $auth['user_id']) : $auth['user_id'];

                    $model = WorkflowInitiatorAuthority::firstOrNew(['id' => $auth['id']]);
                    $model->forceFill([
                        'workflow_id' => $wfId,
                        'role_id' => $auth['role_id'] ?? null,
                        'department_id' => $deptId,
                        'division_id' => $auth['division_id'] ?? null,
                        'user_id' => $newUserId,
                    ])->save();
                    $counts['workflow_initiator_authorities']++;
                } catch (\Exception $e) {
                    Log::warning('Gagal mengimpor WorkflowInitiatorAuthority ID '.($auth['id'] ?? '').': '.$e->getMessage());
                }
            }
        }

        // 8. Workflow Org Scopes
        if (! empty($data['workflow_org_scopes']) && is_array($data['workflow_org_scopes'])) {
            foreach ($data['workflow_org_scopes'] as $scope) {
                try {
                    if (empty($scope['id'])) {
                        continue;
                    }
                    $wfId = $workflowIdMap[$scope['workflow_id']] ?? $scope['workflow_id'];
                    $groupId = ! empty($scope['company_group_id']) ? ($companyGroupIdMap[$scope['company_group_id']] ?? $scope['company_group_id']) : null;
                    $regId = ! empty($scope['region_id']) ? ($regionIdMap[$scope['region_id']] ?? $scope['region_id']) : null;
                    $compId = ! empty($scope['company_id']) ? ($companyIdMap[$scope['company_id']] ?? $scope['company_id']) : null;

                    $model = WorkflowOrgScope::firstOrNew(['id' => $scope['id']]);
                    $model->forceFill([
                        'workflow_id' => $wfId,
                        'company_group_id' => $groupId,
                        'region_id' => $regId,
                        'company_id' => $compId,
                    ])->save();
                    $counts['workflow_org_scopes']++;
                } catch (\Exception $e) {
                    Log::warning('Gagal mengimpor WorkflowOrgScope ID '.($scope['id'] ?? '').': '.$e->getMessage());
                }
            }
        }

        // 10. Workflow Steps
        $workflowStepIdMap = [];
        if (! empty($data['workflow_steps']) && is_array($data['workflow_steps'])) {
            foreach ($data['workflow_steps'] as $s) {
                try {
                    if (empty($s['id'])) {
                        continue;
                    }

                    $workflowId = $workflowIdMap[$s['workflow_id']] ?? $s['workflow_id'];
                    $roleId = ! empty($s['role_id']) ? ($roleIdMap[$s['role_id']] ?? $s['role_id']) : null;

                    if (! empty($s['company_group_ids'])) {
                        $oldIds = is_array($s['company_group_ids']) ? $s['company_group_ids'] : json_decode($s['company_group_ids'], true);
                        if (is_array($oldIds)) {
                            $newIds = array_map(fn ($id) => $companyGroupIdMap[$id] ?? $id, $oldIds);
                            $s['company_group_ids'] = json_encode($newIds);
                        }
                    }
                    if (! empty($s['region_ids'])) {
                        $oldIds = is_array($s['region_ids']) ? $s['region_ids'] : json_decode($s['region_ids'], true);
                        if (is_array($oldIds)) {
                            $newIds = array_map(fn ($id) => $regionIdMap[$id] ?? $id, $oldIds);
                            $s['region_ids'] = json_encode($newIds);
                        }
                    }
                    if (! empty($s['company_ids'])) {
                        $oldIds = is_array($s['company_ids']) ? $s['company_ids'] : json_decode($s['company_ids'], true);
                        if (is_array($oldIds)) {
                            $newIds = array_map(fn ($id) => $companyIdMap[$id] ?? $id, $oldIds);
                            $s['company_ids'] = json_encode($newIds);
                        }
                    }

                    $dbStep = WorkflowStep::withTrashed()->updateOrCreate(
                        ! empty($s['id']) ? ['id' => $s['id']] : [
                            'workflow_id' => $workflowId,
                            'step' => $s['step'],
                        ],
                        [
                            'id' => $s['id'],
                            'workflow_id' => $workflowId,
                            'step' => $s['step'],
                            'step_category' => $s['step_category'] ?? null,
                            'approver_type' => $s['approver_type'] ?? 'role',
                            'is_optional' => $s['is_optional'] ?? false,
                            'optional_label' => $s['optional_label'] ?? null,
                            'condition_expression' => $s['condition_expression'] ?? null,
                            'description' => $s['description'] ?? null,
                            'phase' => $s['phase'] ?? 'f1_request',
                            'uploader_type' => $s['uploader_type'] ?? null,
                            'hierarchy_level' => $s['hierarchy_level'] ?? null,
                            'role_id' => $roleId,
                            'company_group_ids' => $s['company_group_ids'] ?? null,
                            'region_ids' => $s['region_ids'] ?? null,
                            'company_ids' => $s['company_ids'] ?? null,
                            'label' => $s['label'] ?? null,
                            'allowed_actions' => $s['allowed_actions'] ?? null,
                            'is_mandatory' => $s['is_mandatory'] ?? true,
                            'is_active' => $s['is_active'] ?? true,
                            'deleted_at' => null,
                            'meta' => $s['meta'] ?? null,
                            'deleted_at' => null,
                            'created_by' => $admin,
                            'updated_by' => $admin,
                        ],
                    );
                    $workflowStepIdMap[$s['id']] = $dbStep->id;
                    $counts['workflow_steps']++;
                } catch (\Exception $e) {
                    Log::warning('Gagal mengimpor WorkflowStep ID '.($s['id'] ?? '').': '.$e->getMessage());
                }
            }
        }

        // 11. Workflow Step Authorities
        if (! empty($data['workflow_step_authorities']) && is_array($data['workflow_step_authorities'])) {
            foreach ($data['workflow_step_authorities'] as $auth) {
                try {
                    if (empty($auth['id'])) {
                        continue;
                    }
                    $stepId = $workflowStepIdMap[$auth['workflow_step_id']] ?? $auth['workflow_step_id'];
                    $deptId = ! empty($auth['department_id']) ? ($departmentIdMap[$auth['department_id']] ?? $auth['department_id']) : null;
                    $divId = ! empty($auth['division_id']) ? ($divisionIdMap[$auth['division_id']] ?? $auth['division_id']) : null;
                    $newUserId = ! empty($auth['user_email']) ? ($userEmailMap[$auth['user_email']] ?? $auth['user_id']) : $auth['user_id'];

                    $model = WorkflowStepAuthority::firstOrNew(['id' => $auth['id']]);
                    $model->forceFill([
                        'workflow_step_id' => $stepId,
                        'role_id' => $auth['role_id'] ?? null,
                        'department_id' => $deptId,
                        'division_id' => $divId,
                        'user_id' => $newUserId,
                    ])->save();
                    $counts['workflow_step_authorities']++;
                } catch (\Exception $e) {
                    Log::warning('Gagal mengimpor WorkflowStepAuthority ID '.($auth['id'] ?? '').': '.$e->getMessage());
                }
            }
        }

        // 14. Workflow Step Actions
        if (! empty($data['workflow_step_actions']) && is_array($data['workflow_step_actions'])) {
            foreach ($data['workflow_step_actions'] as $a) {
                try {
                    if (empty($a['id'])) {
                        continue;
                    }

                    $stepId = $workflowStepIdMap[$a['workflow_step_id']] ?? $a['workflow_step_id'];

                    $nextStepId = ! empty($a['next_step_id']) ? ($workflowStepIdMap[$a['next_step_id']] ?? $a['next_step_id']) : null;
                    $nextWorkflowId = ! empty($a['next_workflow_id']) ? ($workflowIdMap[$a['next_workflow_id']] ?? $a['next_workflow_id']) : null;
                    $nextWorkflowStepId = ! empty($a['next_workflow_step_id']) ? ($workflowStepIdMap[$a['next_workflow_step_id']] ?? $a['next_workflow_step_id']) : null;

                    $model = WorkflowStepAction::withTrashed()->firstOrNew(['id' => $a['id']]);
                    $model->deleted_at = null;
                    $model->forceFill([
                        'workflow_step_id' => $stepId,
                        'action_code' => $a['action_code'] ?? ($a['master_action_code'] ?? null),
                        'next_step_id' => $nextStepId,
                        'next_workflow_id' => $nextWorkflowId,
                        'next_workflow_step_id' => $nextWorkflowStepId,
                        'required_fields' => $a['required_fields'] ?? null,
                        'autofilled_fields' => $a['autofilled_fields'] ?? null,
                        'signing_parties' => $a['signing_parties'] ?? null,
                        'assignee_config' => $a['assignee_config'] ?? null,
                        'alias' => $a['alias'] ?? null,
                        'description' => $a['description'] ?? null,
                        'is_active' => $a['is_active'] ?? true,
                        'deleted_at' => null,
                        'deleted_at' => null,
                        'created_by' => $admin,
                        'updated_by' => $admin,
                    ])->save();
                    $counts['workflow_step_actions']++;
                } catch (\Exception $e) {
                    Log::warning('Gagal mengimpor WorkflowStepAction ID '.($a['id'] ?? '').': '.$e->getMessage());
                }
            }
        }

        // 14.5 Form Templates & Fields
        if (! empty($data['form_templates']) && is_array($data['form_templates'])) {
            $typeMap = ContractType::pluck('id', 'code')->all();
            foreach ($data['form_templates'] as $ft) {
                try {
                    if (empty($ft['id'])) {
                        continue;
                    }
                    $typeId = ! empty($ft['contract_type_code']) ? ($typeMap[$ft['contract_type_code']] ?? null) : null;

                    FormTemplate::withTrashed()->updateOrCreate(
                        ['id' => $ft['id']],
                        [
                            'name' => $ft['name'],
                            'description' => $ft['description'] ?? null,
                            'contract_type_id' => $typeId,
                            'document_type' => $ft['document_type'] ?? 'f1',
                            'has_letterhead' => $ft['has_letterhead'] ?? false,
                            'letterhead_json' => $ft['letterhead_json'] ?? null,
                            'is_active' => $ft['is_active'] ?? true,
                            'deleted_at' => null,
                            'deleted_at' => null,
                            'created_by' => $admin,
                            'updated_by' => $admin,
                        ],
                    );
                    $counts['form_templates']++;
                } catch (\Exception $e) {
                    Log::warning('Gagal mengimpor FormTemplate ID '.($ft['id'] ?? '').': '.$e->getMessage());
                }
            }
        }

        if (! empty($data['form_fields']) && is_array($data['form_fields'])) {
            foreach ($data['form_fields'] as $ff) {
                try {
                    if (empty($ff['id'])) {
                        continue;
                    }
                    FormField::withTrashed()->updateOrCreate(
                        ['id' => $ff['id']],
                        [
                            'form_template_id' => $ff['form_template_id'],
                            'parent_id' => $ff['parent_id'] ?? null,
                            'label' => $ff['label'] ?? '',
                            'name' => $ff['name'],
                            'type' => $ff['type'],
                            'container_type' => $ff['container_type'] ?? null,
                            'placeholder' => $ff['placeholder'] ?? null,
                            'is_required' => $ff['is_required'] ?? false,
                            'use_rich_text' => $ff['use_rich_text'] ?? false,
                            'width' => $ff['width'] ?? '100',
                            'options' => $ff['options'] ?? null,
                            'order' => $ff['order'] ?? 0,
                            'validation_rules' => $ff['validation_rules'] ?? null,
                        ],
                    );
                    $counts['form_fields']++;
                } catch (\Exception $e) {
                    Log::warning('Gagal mengimpor FormField ID '.($ff['id'] ?? '').': '.$e->getMessage());
                }
            }
        }

        // 15. Contract Types
        if (! empty($data['contract_types']) && is_array($data['contract_types'])) {
            $workflowMap = Workflow::pluck('id', 'name')->all();
            foreach ($data['contract_types'] as $t) {
                try {
                    if (empty($t['code'])) {
                        continue;
                    }
                    $workflowId = ! empty($t['workflow_name']) ? ($workflowMap[$t['workflow_name']] ?? null) : null;

                    ContractType::withTrashed()->updateOrCreate(
                        ! empty($t['id']) ? ['id' => $t['id']] : ['code' => $t['code']],
                        [
                            'code' => $t['code'],
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
                } catch (\Exception $e) {
                    Log::warning('Gagal mengimpor ContractType '.($t['code'] ?? '').': '.$e->getMessage());
                }
            }

            $typeMap = ContractType::pluck('id', 'code')->all();
            foreach ($data['contract_types'] as $t) {
                try {
                    if (empty($t['code']) || empty($t['parent_code'])) {
                        continue;
                    }
                    $parentId = $typeMap[$t['parent_code']] ?? null;
                    if ($parentId) {
                        ContractType::where('code', $t['code'])->update(['parent_id' => $parentId]);
                    }
                } catch (\Exception $e) {
                    Log::warning('Gagal mengupdate parent ContractType '.($t['code'] ?? '').': '.$e->getMessage());
                }
            }
        }

        // 16. Access Mappings
        if (! empty($data['access_mappings']) && is_array($data['access_mappings'])) {
            foreach ($data['access_mappings'] as $am) {
                try {
                    $roleId = $roleMap[$am['role_name']] ?? null;
                    $moduleId = $moduleMap[$am['module_identifier']] ?? null;

                    $groupId = null;
                    if (! empty($am['module_group_name'])) {
                        $groupId = $moduleGroupMap[$am['module_group_name']] ?? null;
                    } elseif (! empty($am['module_group_id'])) {
                        $groupId = $am['module_group_id'];
                    }

                    if ($roleId && $moduleId) {
                        AccessModule::withTrashed()->updateOrCreate(
                            ! empty($am['id']) ? ['id' => $am['id']] : ['role_id' => $roleId, 'module_id' => $moduleId],
                            [
                                'role_id' => $roleId,
                                'module_id' => $moduleId,
                                'can_read' => $am['can_read'] ?? false,
                                'can_create' => $am['can_create'] ?? false,
                                'can_update' => $am['can_update'] ?? false,
                                'can_delete' => $am['can_delete'] ?? false,
                                'can_approve' => $am['can_approve'] ?? false,
                                'can_bulk_approve' => $am['can_bulk_approve'] ?? false,
                                'can_bulk_delete' => $am['can_bulk_delete'] ?? false,
                                'module_group_id' => $groupId,
                                'sequence' => $am['sequence'] ?? null,
                            ],
                        );
                        $counts['access_mappings']++;
                    }
                } catch (\Exception $e) {
                    Log::warning('Gagal mengimpor AccessModule: '.$e->getMessage());
                }
            }
        }

        // 17. Role Navigation Mappings
        if (! empty($data['role_navigation_mappings']) && is_array($data['role_navigation_mappings'])) {
            foreach ($data['role_navigation_mappings'] as $rmg) {
                try {
                    $roleId = $roleMap[$rmg['role_name']] ?? null;
                    $groupId = $moduleGroupMap[$rmg['module_group_name']] ?? null;

                    if ($roleId && $groupId) {
                        RoleModuleGroup::updateOrCreate(
                            ! empty($rmg['id']) ? ['id' => $rmg['id']] : [
                                'role_id' => $roleId,
                                'module_group_id' => $groupId,
                            ],
                            [
                                'role_id' => $roleId,
                                'module_group_id' => $groupId,
                                'sequence' => $rmg['sequence'] ?? null,
                            ],
                        );

                        if (! empty($rmg['modules']) && is_array($rmg['modules'])) {
                            foreach ($rmg['modules'] as $m) {
                                $moduleId = $moduleMap[$m['module_identifier']] ?? null;
                                if ($moduleId) {
                                    AccessModule::withTrashed()->updateOrCreate(
                                        [
                                            'role_id' => $roleId,
                                            'module_id' => $moduleId,
                                        ],
                                        [
                                            'can_read' => true,
                                            'module_group_id' => $groupId,
                                            'sequence' => $m['sequence'] ?? null,
                                        ],
                                    );
                                }
                            }
                        }

                        $counts['role_navigation_mappings']++;
                    }
                } catch (\Exception $e) {
                    Log::warning('Gagal mengimpor RoleModuleGroup: '.$e->getMessage());
                }
            }
        }

        // 12. Users (Import from either standard json or user helpdesk.json)
        $usersData = null;
        if (! empty($data['users']) && is_array($data['users'])) {
            $usersData = $data['users'];
        } else {
            foreach ($data as $key => $val) {
                if (str_contains($key, 'select * from users') && is_array($val)) {
                    $usersData = $val;
                    break;
                }
            }
        }

        if (! empty($usersData) && is_array($usersData)) {
            $validDepartments = array_flip(DB::table('m_departments')->pluck('id')->toArray());
            $validRoles = array_flip(DB::table('m_roles')->pluck('id')->toArray());
            $defaultRole = Role::whereRaw('lower(name) = ?', ['staff'])->first();

            foreach ($usersData as $u) {
                try {
                    if (empty($u['name']) && empty($u['username']) && empty($u['email'])) {
                        continue;
                    }

                    // Skip system admin to prevent lockout/overwrite
                    if (($u['email'] ?? '') === 'admin@example.com' || ($u['username'] ?? '') === 'admin') {
                        continue;
                    }

                    $email = filter_var($u['email'] ?? '', FILTER_VALIDATE_EMAIL) ? $u['email'] : '-';
                    $password = $u['password'] ?? bcrypt('Karyawan123!');

                    $roleId = null;
                    if (! empty($u['role_name'])) {
                        $roleId = Role::whereRaw('lower(name) = ?', [strtolower($u['role_name'])])->value('id');
                    } elseif (! empty($u['role_id'])) {
                        $roleId = isset($validRoles[$u['role_id']]) ? $u['role_id'] : null;
                    }

                    if (! $roleId && $defaultRole) {
                        $roleId = $defaultRole->id;
                    }

                    $deptId = null;
                    if (! empty($u['department_name'])) {
                        $deptId = Department::whereRaw('lower(name) = ?', [strtolower($u['department_name'])])->value('id');
                    } elseif (! empty($u['department_id'])) {
                        $deptId = isset($validDepartments[$u['department_id']]) ? $u['department_id'] : null;
                    }

                    User::withTrashed()->updateOrCreate(
                        ! empty($u['id']) ? ['id' => $u['id']] : ['username' => $u['username']],
                        [
                            'username' => $u['username'] ?? null,
                            'code' => $u['code'] ?? null,
                            'name' => $u['name'] ?? null,
                            'email' => $email,
                            'password' => $password,
                            'phone_number' => $u['phone_number'] ?? null,
                            'company_id' => $u['company_id'] ?? null,
                            'company_group_id' => $u['company_group_id'] ?? null,
                            'department_id' => $deptId,
                            'division_id' => $u['division_id'] ?? null,
                            'region_id' => $u['region_id'] ?? null,
                            'role_id' => $roleId,
                            'is_active' => $u['is_active'] ?? true,
                            'deleted_at' => null,
                            'is_employee' => $u['is_employee'] ?? true,
                        ]
                    );
                    $counts['users']++;
                } catch (\Exception $e) {
                    Log::warning('Gagal mengimpor User '.($u['name'] ?? '').': '.$e->getMessage());
                }
            }
        }

        return $counts;
    }

    /**
     * Import master data from JSON.
     */
    public function import(ImportMasterDataRequest $request)
    {
        try {
            $content = file_get_contents($request->file('file')->getRealPath());
            $data = json_decode($content, true);

            if (! is_array($data)) {
                return back()->withErrors(['error' => 'Format file JSON tidak valid.']);
            }

            $counts = $this->executeImport($data);

            $successMsg = sprintf(
                'Data master berhasil diimpor: %d Group, %d Region, %d Company, %d Departemen, %d Status, %d Tipe Kontrak, %d Workflow, %d Form Template, %d Role, %d Mapping Akses, %d Mapping Navigasi, %d Pengguna.',
                $counts['company_groups'],
                $counts['regions'],
                $counts['companies'],
                $counts['departments'],
                $counts['contract_statuses'],
                $counts['contract_types'],
                $counts['workflows'],
                $counts['form_templates'],
                $counts['roles'],
                $counts['access_mappings'],
                $counts['role_navigation_mappings'],
                $counts['users'],
            );

            return redirect()->route('admin.master-data-sync')->with('success', $successMsg);
        } catch (\Exception $e) {
            Log::error('Master Data Import Error: '.$e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->withErrors(['error' => 'Gagal mengimpor data master: '.$e->getMessage()]);
        }
    }

    /**
     * Clean selected master and contract transactional data.
     */
    public function clean(CleanMasterDataRequest $request)
    {
        $entities = $request->validated()['entities'];

        try {
            DB::transaction(function () use ($entities) {
                $driver = DB::connection()->getDriverName();
                if ($driver === 'pgsql') {
                    DB::statement("SET LOCAL session_replication_role = 'replica';");
                }
                // 1. Transactional Contracts
                if (in_array('contracts', $entities)) {
                    if (Schema::hasTable('t_contracts') && Schema::hasColumn('t_contracts', 'parent_id')) {
                        DB::table('t_contracts')->update(['parent_id' => null]);
                    }
                    DB::table('t_approvals')->delete();
                    DB::table('t_attachments')->delete();
                    DB::table('t_form_submission_h')->delete();
                    DB::table('t_form_submissions')->delete();
                    DB::table('t_messages')->delete();
                    DB::table('t_contract_meta')->delete();
                    DB::table('t_contract_versions')->delete();
                    DB::table('t_contract_h')->delete();
                    DB::table('t_contracts')->delete();
                }

                // 2. Workflows
                if (in_array('workflows', $entities)) {
                    DB::table('m_workflow_step_actions')->delete();
                    DB::table('m_workflow_step_authorities')->delete();
                    DB::table('m_workflow_initiator_authorities')->delete();
                    DB::table('m_workflow_org_scopes')->delete();
                    DB::table('m_workflow_steps')->delete();
                    DB::table('m_workflows')->delete();
                }

                // 3. Contract Statuses
                if (in_array('contract_statuses', $entities)) {
                    DB::table('m_contract_statuses')->delete();
                }

                // 3.5 Form Templates & Fields
                if (in_array('form_templates', $entities) || in_array('form_fields', $entities)) {
                    DB::table('m_form_fields')->delete();
                    DB::table('m_form_templates')->delete();
                }

                // 4. Contract Types
                if (in_array('contract_types', $entities)) {
                    if (Schema::hasTable('m_contract_types') && Schema::hasColumn('m_contract_types', 'parent_id')) {
                        DB::table('m_contract_types')->update(['parent_id' => null]);
                    }
                    DB::table('m_contract_types')->delete();
                }

                // 5. Departments
                if (in_array('departments', $entities)) {
                    DB::table('m_departments')->delete();
                }

                // 5b. Divisions
                if (in_array('divisions', $entities)) {
                    if (Schema::hasTable('m_workflow_step_divisions')) {
                        DB::table('m_workflow_step_divisions')->delete();
                    }
                    DB::table('m_division')->delete();
                }

                // 6. Companies
                if (in_array('companies', $entities)) {
                    DB::table('m_companies')->delete();
                    if (Schema::hasTable('m_company')) {
                        DB::table('m_company')->delete();
                    }
                }

                // 7. Regions
                if (in_array('regions', $entities)) {
                    DB::table('m_regions')->delete();
                }

                // 8. Company Groups
                if (in_array('company_groups', $entities)) {
                    DB::table('m_company_groups')->delete();
                    if (Schema::hasTable('m_company_group')) {
                        DB::table('m_company_group')->delete();
                    }
                }

                // 9. Roles
                if (in_array('roles', $entities)) {
                    DB::table('m_roles')->delete();
                }

                // 10. Access Mappings
                if (in_array('access_mappings', $entities)) {
                    DB::table('m_access_modules')->delete();
                }

                // 11. Navigation Mappings
                if (in_array('navigation_mappings', $entities)) {
                    DB::table('m_role_module_groups')->delete();
                    DB::table('m_modules')->delete();
                    DB::table('m_module_groups')->delete();
                }

                // 12. Users
                if (in_array('users', $entities)) {
                    DB::table('m_users')->where('email', '!=', 'admin@example.com')->delete();
                }
            });

            return redirect()->route('admin.master-data-sync')->with('success', 'Entitas data terpilih berhasil dibersihkan.');
        } catch (\Exception $e) {
            Log::error('Gagal membersihkan data master: '.$e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()->route('admin.master-data-sync')->with('error', 'Gagal membersihkan data terpilih: '.$e->getMessage());
        }
    }
}
