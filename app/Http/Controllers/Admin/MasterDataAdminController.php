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
use App\Models\JobLevel;
use App\Models\JobLevelGroup;
use App\Models\JobTitle;
use App\Models\Module;
use App\Models\ModuleGroup;
use App\Models\Region;
use App\Models\Role;
use App\Models\RoleModuleGroup;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowInitiatorAuthority;
use App\Models\WorkflowStep;
use App\Models\WorkflowStepAction;
use App\Models\WorkflowStepAuthority;
use App\Services\MasterData\MasterDataImportService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Inertia\Inertia;
use OpenApi\Attributes as OA;

class MasterDataAdminController extends Controller
{
    public function __construct(
        protected MasterDataImportService $importService
    ) {}
    /**
     * Display the index view with statistics.
     */
    #[OA\Get(
        path: '/api/admin/master-data-sync',
        summary: 'Get master data sync dashboard with entity counts',
        tags: ['Admin - Master Data Sync'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Dashboard with entity counts'),
        ],
    )]
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
                'job_level_groups' => JobLevelGroup::count(),
                'job_levels' => JobLevel::count(),
                'job_titles' => JobTitle::count(),
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
    #[OA\Get(
        path: '/api/admin/master-data-sync/export',
        summary: 'Export selected master data entities to JSON',
        tags: ['Admin - Master Data Sync'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'entities',
                in: 'query',
                required: false,
                description: 'Comma-separated list of entities to export (e.g. company_groups,regions,workflows). Exports all if omitted.',
                schema: new OA\Schema(type: 'string'),
            ),
        ],
        responses: [
            new OA\Response(response: 200, description: 'JSON file download with master data'),
            new OA\Response(response: 500, description: 'Export failed'),
        ],
    )]
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
                        'is_active' => $w->is_active,
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
                        'authority_type' => $a->authority_type,
                        'is_additional' => $a->is_additional,
                        'additional_type' => $a->additional_type,
                        'workflow_step_action_id' => $a->workflow_step_action_id,
                        'target_step_id' => $a->target_step_id,
                        'company_group_id' => $a->company_group_id,
                        'region_id' => $a->region_id,
                        'role_use_initiator' => $a->role_use_initiator,
                        'department_use_initiator' => $a->department_use_initiator,
                        'division_use_initiator' => $a->division_use_initiator,
                        'company_group_use_initiator' => $a->company_group_use_initiator,
                        'region_use_initiator' => $a->region_use_initiator,
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
                        'authority_type' => $a->authority_type,
                        'company_group_id' => $a->company_group_id,
                        'region_id' => $a->region_id,
                        'role_use_initiator' => $a->role_use_initiator,
                        'department_use_initiator' => $a->department_use_initiator,
                        'division_use_initiator' => $a->division_use_initiator,
                        'company_group_use_initiator' => $a->company_group_use_initiator,
                        'region_use_initiator' => $a->region_use_initiator,
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
                        'transition_config' => $a->transition_config,
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
                        'code' => $t->code,
                        'name' => $t->name,
                        'parent_code' => $t->parent->code ?? null,
                        'workflow_name' => $t->workflow->name ?? null,
                        'features' => $t->features,
                        'description' => $t->description,
                        'level' => $t->level,
                        'f1_input_mechanism' => $t->f1_input_mechanism,
                        'f1_form_template_id' => $t->f1_form_template_id,
                        'f1_contract_template_id' => $t->f1_contract_template_id,
                        'f2_input_mechanism' => $t->f2_input_mechanism,
                        'f2_form_template_id' => $t->f2_form_template_id,
                        'f2_contract_template_id' => $t->f2_contract_template_id,
                        'contract_input_mechanism' => $t->contract_input_mechanism,
                        'contract_form_template_id' => $t->contract_form_template_id,
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
        return $this->importService->execute($data);
    }

    /**
     * Import master data from JSON.
     */
    #[OA\Post(
        path: '/api/admin/master-data-sync/import',
        summary: 'Import master data from a JSON file',
        tags: ['Admin - Master Data Sync'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: 'multipart/form-data',
                schema: new OA\Schema(
                    required: ['file'],
                    properties: [
                        new OA\Property(property: 'file', type: 'string', format: 'binary', description: 'JSON export file'),
                    ],
                ),
            ),
        ),
        responses: [
            new OA\Response(response: 302, description: 'Redirect with import summary on success'),
            new OA\Response(response: 422, description: 'Invalid JSON file'),
            new OA\Response(response: 500, description: 'Import failed'),
        ],
    )]
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
    #[OA\Post(
        path: '/api/admin/master-data-sync/clean',
        summary: 'Permanently delete selected master data entities',
        tags: ['Admin - Master Data Sync'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['entities'],
                properties: [
                    new OA\Property(
                        property: 'entities',
                        type: 'array',
                        items: new OA\Items(type: 'string'),
                        description: 'List of entity keys to clean (e.g. ["company_groups", "workflows"])',
                    ),
                ],
            ),
        ),
        responses: [
            new OA\Response(response: 200, description: 'Data cleaned successfully'),
            new OA\Response(response: 422, description: 'Invalid entity key'),
            new OA\Response(response: 500, description: 'Clean operation failed'),
        ],
    )]
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
                    DB::table('m_users')->delete();
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
