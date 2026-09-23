<?php

namespace App\Http\Controllers\Admin;

use App\Http\Actions\Workflow\DestroyWorkflowAction;
use App\Http\Actions\Workflow\DuplicateWorkflowAction;
use App\Http\Actions\Workflow\StoreWorkflowAction;
use App\Http\Actions\Workflow\UpdateWorkflowAction;
use App\Http\Controllers\Controller;
use App\Http\Queries\Master\UserQuery;
use App\Http\Queries\Master\WorkflowQuery;
use App\Http\Requests\Workflow\ImportWorkflowRequest;
use App\Http\Requests\Workflow\StoreWorkflowRequest;
use App\Http\Requests\Workflow\UpdateWorkflowRequest;
use App\Models\Company;
use App\Models\CompanyGroup;
use App\Models\ContractStatus;
use App\Models\ContractType;
use App\Models\Department;
use App\Models\Division;
use App\Models\FormTemplate;
use App\Models\Location;
use App\Models\OrganizationGroup;
use App\Models\Region;
use App\Models\Role;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowStepPreset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class WorkflowAdminController extends Controller
{
    public function __construct(
        protected WorkflowQuery $workflowQuery,
        protected UserQuery $userQuery,
    ) {}

    public function index(Request $request)
    {
        $filters = $request->only(['search', 'contract_type_id', 'workflow_type', 'is_default', 'is_selectable', 'is_active', 'per_page']);
        if (! array_key_exists('is_active', $filters)) {
            $filters['is_active'] = 'true';
        }
        if (! array_key_exists('is_selectable', $filters)) {
            $filters['is_selectable'] = 'true';
        }

        // 1. Preload contract types for fast hierarchy and name resolution
        $allTypes = ContractType::select('id', 'name', 'code', 'parent_id')->get()->keyBy('id');
        $rootMap = [];
        $getRoot = function ($id) use ($allTypes, &$getRoot, &$rootMap) {
            if (isset($rootMap[$id])) {
                return $rootMap[$id];
            }
            if (! isset($allTypes[$id])) {
                return null;
            }
            $item = $allTypes[$id];
            if (empty($item->parent_id)) {
                return $rootMap[$id] = $item->name;
            }

            return $rootMap[$id] = $getRoot($item->parent_id);
        };
        foreach ($allTypes as $id => $item) {
            $getRoot($id);
        }

        $query = $this->workflowQuery->list($request);
        $paginator = $query->orderBy('name')->paginate($request->input('per_page', 25))->withQueryString();

        // 2. Transform to clean lightweight DTO (instant page load)
        $paginator->getCollection()->transform(function ($wf) use ($allTypes, $rootMap) {
            // Resolve contract_type_name
            if (! empty($wf->contract_type_id)) {
                $typeName = $allTypes[$wf->contract_type_id]?->name ?? null;
            } else {
                $ids = $wf->contract_type_ids;
                if (! empty($ids)) {
                    $names = [];
                    foreach ($ids as $id) {
                        if (isset($allTypes[$id])) {
                            $names[] = $allTypes[$id]->name;
                        }
                    }
                    $typeName = ! empty($names) ? implode(', ', $names) : 'Global / Semua Tipe';
                } else {
                    $typeName = 'Global / Semua Tipe';
                }
            }

            // Resolve parent_contract_type_name
            $rootNames = [];
            if (! empty($wf->contract_type_id) && isset($rootMap[$wf->contract_type_id])) {
                $rootNames[] = $rootMap[$wf->contract_type_id];
            }
            foreach ($wf->contract_type_ids as $id) {
                if (isset($rootMap[$id])) {
                    $rootNames[] = $rootMap[$id];
                }
            }
            $rootNames = array_values(array_unique(array_filter($rootNames)));
            if (! empty($rootNames)) {
                $parentTypeName = implode(', ', $rootNames);
            } elseif ($wf->workflow_type === 'sub_workflow') {
                $parentTypeName = 'Sub-Workflow';
            } else {
                $parentTypeName = 'Global / Semua Tipe';
            }

            return [
                'id' => $wf->id,
                'name' => $wf->name,
                'description' => $wf->description,
                'workflow_type' => $wf->workflow_type,
                'is_default' => (bool) $wf->is_default,
                'is_selectable' => (bool) $wf->is_selectable,
                'is_active' => $wf->is_active !== false,
                'steps_count' => (int) $wf->steps_count,
                'contract_type_name' => $typeName,
                'parent_contract_type_name' => $parentTypeName,
                'initiator_summary' => $wf->initiator_summary,
            ];
        });

        return Inertia::render('admin/Index', [
            'currentView' => 'workflows',
            'workflows' => $paginator,
            'contractTypes' => $allTypes->values()->map(fn ($t) => ['id' => $t->id, 'name' => $t->name, 'code' => $t->code]),
            'filters' => $filters,
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Alur Kerja (Workflows)', 'href' => route('admin.workflows'), 'description' => 'Konfigurasi tahapan persetujuan.', 'icon' => 'GitBranch'],
            ],
        ]);
    }

    public function preview(Workflow $workflow)
    {
        $wf = $this->workflowQuery->findForEdit($workflow->id);

        $steps = $wf->steps->map(function ($s) {
            return [
                'id' => $s->id,
                'step' => $s->step,
                'label' => $s->label,
                'description' => $s->description,
                'approver_type' => $s->approver_type,
                'is_optional' => (bool) $s->is_optional,
                'approver_authorities' => $s->approverAuthorities->map(function ($a) {
                    return [
                        'id' => $a->id,
                        'authority_type' => $a->authority_type,
                        'role' => $a->role ? ['id' => $a->role->id, 'name' => $a->role->name] : null,
                        'department' => $a->department ? ['id' => $a->department->id, 'name' => $a->department->name] : null,
                        'division' => $a->division ? ['id' => $a->division->id, 'name' => $a->division->name] : null,
                        'user' => $a->user ? ['id' => $a->user->id, 'name' => $a->user->name] : null,
                    ];
                })->values()->all(),
                'actions' => $s->actions->map(function ($act) {
                    return [
                        'id' => $act->id,
                        'action_code' => is_object($act->action_code) ? $act->action_code->value : $act->action_code,
                        'alias' => $act->alias,
                    ];
                })->values()->all(),
            ];
        })->values()->all();

        return response()->json([
            'id' => $wf->id,
            'name' => $wf->name,
            'description' => $wf->description,
            'workflow_type' => $wf->workflow_type,
            'contract_type_name' => $wf->contractType?->name ?? 'Global / Semua Tipe',
            'initiator_summary' => $wf->initiator_summary,
            'steps' => $steps,
        ]);
    }

    public function create()
    {
        return Inertia::render('workflows/form', [
            'workflow' => null,
            'contractTypes' => ContractType::select('id', 'name', 'code', 'parent_id')->orderBy('name')->get(),
            'departments' => Department::select('id', 'name', 'code', 'idorg_group', 'org_group_name')->where('is_used', true)->orderBy('name')->get(),
            'divisions' => Division::select('id', 'name', 'code', 'department_id')->orderBy('name')->get(),
            'locations' => Location::select('id', 'name', 'code')->where('is_used', true)->orderBy('name')->get(),
            'roles' => Role::select('id', 'name')->orderBy('name')->get(),
            'users' => Inertia::defer(fn () => User::select('id', 'name', 'email', 'nik', 'username', 'role_id', 'department_id', 'division_id', 'company_id', 'company_name', 'org_name', 'location_id', 'idlocation', 'location_name', 'company_group_id', 'region_id', 'is_used')->with(['department:id,name,idorg_group,org_group_name', 'company:id,name,company_group_name,region_name', 'location:id,name,code'])->where('is_used', true)->orderBy('name')->get()),
            'companyGroups' => CompanyGroup::select('id', 'name')->where('is_used', true)->orderBy('name')->get(),
            'organizationGroups' => OrganizationGroup::select('id', 'name', 'code', 'idorg_group')->where('is_used', true)->orderBy('name')->get(),
            'regions' => Region::select('id', 'name')->where('is_used', true)->orderBy('name')->get(),
            'companies' => Company::select('id', 'name')->where('is_used', true)->orderBy('name')->get(),
            'contractStatuses' => ContractStatus::select('id', 'code', 'label', 'color', 'bg_color', 'icon')->orderBy('label')->get(),
            'allWorkflows' => $this->workflowQuery->options()->get(),
            'workflowTypes' => \App\Enums\WorkflowType::options(),
            'masterWorkflows' => Workflow::where('workflow_type', 'main')->select('id', 'name')->orderBy('name')->get(),
            'formTemplates' => FormTemplate::select('id', 'name')->orderBy('name')->get(),
            'stepPresets' => WorkflowStepPreset::select('id', 'name', 'step_data', 'created_at')->latest()->get(),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Alur Kerja (Workflows)', 'href' => route('admin.workflows'), 'icon' => 'GitBranch'],
                ['title' => 'Registrasi Alur Baru', 'href' => '#', 'description' => 'Mendefinisikan alur approval baru.'],
            ],
        ]);
    }

    public function edit(Workflow $workflow)
    {
        $workflow = $this->workflowQuery->findForEdit($workflow->id);

        $workflowData = $workflow->toArray();

        $workflowData['initiator_authorities'] = $workflow->initiatorAuthorities->toArray();

        $workflowData['steps'] = $workflow->steps->map(function ($s) {
            $sd = $s->toArray();
            $sd['role'] = $s->approverAuthorities->filter(fn ($a) => ! $a->role_use_initiator)->map(fn ($a) => $a->role?->name)->filter()->values()->toArray();
            $sd['user_ids'] = $s->approverAuthorities->pluck('user_id')->filter()->values()->toArray();
            $sd['department_ids'] = $s->approverAuthorities->filter(fn ($a) => ! $a->department_use_initiator)->pluck('department_id')->filter()->values()->toArray();
            $sd['division_ids'] = $s->approverAuthorities->filter(fn ($a) => ! $a->division_use_initiator)->pluck('division_id')->filter()->values()->toArray();
            $sd['approver_authorities'] = $s->approverAuthorities->map(function ($a) {
                $arr = $a->toArray();
                if (in_array($a->authority_type, ['initiator', 'assigned_pic', 'creator', 'adhoc_approvers', 'adhoc'])) {
                    $arr['authority_type'] = 'custom';
                    $arr['user_id'] = $a->authority_type;
                }

                return $arr;
            })->toArray();

            // Reconstruct approver_config if present, or initialize empty
            $config = $s->approver_config ?? [];
            if (! is_array($config)) {
                $config = [];
            }

            // Ensure items inside config are consistent with the arrays
            $config['roles'] = $config['roles'] ?? $sd['role'];
            $config['departments'] = $config['departments'] ?? $sd['department_ids'];
            $config['users'] = $config['users'] ?? $sd['user_ids'];

            $sd['approver_config'] = $config;

            $sd['actions'] = $s->actions->sortBy(fn ($action) => (int) data_get($action->transition_config, 'order', 999))->values()->map(function ($action) {
                // ponytail: Reconstruct sub-flex arrays from additionalAuthorities
                $addAuth = $action->additionalAuthorities->groupBy('additional_type');

                $signingParties = $action->signing_parties ?? [];
                if (isset($addAuth['signer'])) {
                    $signingParties['authorities'] = $addAuth['signer']->map->toArray()->toArray();
                }

                $assigneeConfig = $action->assignee_config ?? [];
                if (isset($addAuth['assignee'])) {
                    $assigneeConfig['authorities'] = $addAuth['assignee']->map->toArray()->toArray();
                }

                $reviewerConfig = [];
                if (isset($addAuth['reviewer'])) {
                    $reviewerConfig['authorities'] = $addAuth['reviewer']->map->toArray()->toArray();
                }

                return [
                    'id' => $action->id,
                    'action_code' => $action->action_code ? (is_object($action->action_code) ? $action->action_code->value : (string) $action->action_code) : null,
                    'code' => $action->action_code ? (is_object($action->action_code) ? $action->action_code->value : (string) $action->action_code) : null,
                    'master_action_id' => $action->action_code ? (is_object($action->action_code) ? $action->action_code->value : (string) $action->action_code) : null,
                    'master_action_name' => $action->action_code ? (is_object($action->action_code) ? $action->action_code->label() : ($action->alias ?: 'Action')) : ($action->alias ?: 'Action'),
                    'master_action' => null,
                    'next_step_id' => $action->next_step_id,
                    'next_workflow_id' => $action->next_workflow_id,
                    'next_workflow_step_id' => $action->next_workflow_step_id,
                    'required_fields' => $action->required_fields ?? [],
                    'autofilled_fields' => $action->autofilled_fields ?? [],
                    'signing_parties' => $signingParties,
                    'assignee_config' => $assigneeConfig,
                    'reviewer_config' => $reviewerConfig,
                    'transition_config' => $action->transition_config,
                    'alias' => $action->alias,
                    'target_status' => $action->target_status,
                    'description' => $action->description,
                    'is_active' => $action->is_active,
                    'is_visible' => $action->is_visible,
                ];
            })->toArray();

            return $sd;
        });

        return Inertia::render('workflows/form', [
            'workflow' => $workflowData,
            'contractTypes' => ContractType::select('id', 'name', 'code', 'parent_id')->orderBy('name')->get(),
            'departments' => Department::select('id', 'name', 'code', 'idorg_group', 'org_group_name')->where('is_used', true)->orderBy('name')->get(),
            'divisions' => Division::select('id', 'name', 'code', 'department_id')->orderBy('name')->get(),
            'locations' => Location::select('id', 'name', 'code')->where('is_used', true)->orderBy('name')->get(),
            'roles' => Role::select('id', 'name')->orderBy('name')->get(),
            'users' => Inertia::defer(fn () => User::select('id', 'name', 'email', 'nik', 'username', 'role_id', 'department_id', 'division_id', 'company_id', 'company_name', 'org_name', 'location_id', 'idlocation', 'location_name', 'company_group_id', 'region_id', 'is_used')->with(['department:id,name,idorg_group,org_group_name', 'company:id,name,company_group_name,region_name', 'location:id,name,code'])->where('is_used', true)->orderBy('name')->get()),
            'companyGroups' => CompanyGroup::select('id', 'name')->where('is_used', true)->orderBy('name')->get(),
            'organizationGroups' => OrganizationGroup::select('id', 'name', 'code', 'idorg_group')->where('is_used', true)->orderBy('name')->get(),
            'regions' => Region::select('id', 'name')->where('is_used', true)->orderBy('name')->get(),
            'companies' => Company::select('id', 'name')->where('is_used', true)->orderBy('name')->get(),
            'contractStatuses' => ContractStatus::select('id', 'code', 'label', 'color', 'bg_color', 'icon')->orderBy('label')->get(),
            'allWorkflows' => $this->workflowQuery->options()->get(),
            'workflowTypes' => \App\Enums\WorkflowType::options(),
            'masterWorkflows' => Workflow::where('workflow_type', 'main')->where('id', '!=', $workflow->id)->select('id', 'name')->orderBy('name')->get(),
            'formTemplates' => FormTemplate::select('id', 'name')->orderBy('name')->get(),
            'stepPresets' => WorkflowStepPreset::select('id', 'name', 'step_data', 'created_at')->latest()->get(),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Alur Kerja (Workflows)', 'href' => route('admin.workflows'), 'icon' => 'GitBranch'],
                ['title' => 'Parameter Alur Kerja', 'href' => '#', 'description' => "Konfigurasi tahapan untuk {$workflow->name}."],
            ],
        ]);
    }

    public function store(StoreWorkflowRequest $request, StoreWorkflowAction $action)
    {
        Log::info('Incoming Workflow Store Request', $request->all());

        try {
            $workflow = $action->execute($request->validated());

            return redirect()->route('admin.workflows.edit', $workflow->id)->with('success', 'Workflow berhasil dibuat. Silakan konfigurasikan alur kerja.');
        } catch (\Exception $e) {
            Log::error('Workflow Store Error: '.$e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->withErrors(['error' => 'Gagal menyimpan alur kerja: '.$e->getMessage()]);
        }
    }

    public function update(UpdateWorkflowRequest $request, Workflow $workflow, UpdateWorkflowAction $action)
    {
        Log::info('Incoming Workflow Update Request', $request->all());

        try {
            $action->execute($workflow, $request->validated());

            return back()->with('success', 'Workflow berhasil diperbarui.');
        } catch (\Exception $e) {
            Log::error('Workflow Update Error: '.$e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->withErrors(['error' => 'Gagal memperbarui alur kerja: '.$e->getMessage()]);
        }
    }

    public function toggleField(Request $request, Workflow $workflow)
    {
        $validated = $request->validate([
            'field' => 'required|string|in:is_default,is_selectable,is_active',
            'value' => 'required|boolean',
        ]);

        $field = $validated['field'];
        $value = (bool) $validated['value'];

        try {
            if ($field === 'is_default' && $value) {
                Workflow::where('id', '!=', $workflow->id)->update(['is_default' => false]);
            }

            $workflow->update([
                $field => $value,
            ]);

            return back()->with('success', 'Perubahan berhasil disimpan.');
        } catch (\Exception $e) {
            Log::error('Workflow Toggle Error: '.$e->getMessage());

            return back()->withErrors(['error' => 'Gagal memperbarui: '.$e->getMessage()]);
        }
    }

    public function destroy(Workflow $workflow, DestroyWorkflowAction $action)
    {
        $action->execute($workflow);

        return redirect()->back();
    }

    public function duplicate(Workflow $workflow, DuplicateWorkflowAction $action)
    {
        try {
            $newWorkflow = $action->execute($workflow);

            return redirect()->route('admin.workflows')->with('success', "Alur kerja '{$workflow->name}' berhasil diduplikasi sebagai '{$newWorkflow->name}'.");
        } catch (\Exception $e) {
            Log::error('Workflow Duplicate Error: '.$e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->withErrors(['error' => 'Gagal menduplikasi alur kerja: '.$e->getMessage()]);
        }
    }

    public function bulkDestroy(Request $request)
    {
        $ids = $request->input('ids', []);
        if (empty($ids)) {
            return back();
        }

        Workflow::whereIn('id', $ids)->delete();

        return back()->with('success', count($ids).' alur kerja berhasil dihapus.');
    }

    public function export(Request $request)
    {
        $ids = $request->input('ids');
        if (empty($ids)) {
            return back()->withErrors(['error' => 'Pilih alur kerja yang ingin diekspor.']);
        }

        $workflows = Workflow::with([
            'steps.approverAuthorities.department',
            'steps.approverAuthorities.user',
            'steps.actions',
            'initiatorAuthorities.department',
            'initiatorAuthorities.user',
        ])->whereIn('id', (array) $ids)->get();

        $exportData = [];

        foreach ($workflows as $workflow) {
            $workflowData = collect($workflow->toArray())->only([
                'contract_type_id',
                'department_id',
                'name',
                'description',
                'is_default',
                'is_template',
                'is_tax_involved',
                'initiator_type',
                'sla_drafting_hours',
                'sla_total_hours',
                'sla_cutoff_hour',
                'scope',
                'workflow_category',
                'company_group_ids',
                'region_ids',
                'company_ids',
                'approver_roles',
                'approver_departments',
                'approver_users',
                'legal_roles',
                'legal_departments',
                'legal_users',
                'meta',
            ])->toArray();

            $workflowData['initiator_roles'] = $workflow->initiatorAuthorities->pluck('role.name')->filter()->toArray();
            $workflowData['initiator_departments'] = $workflow->initiatorAuthorities->map(function ($item) {
                return $item->department->code ?? $item->department_id;
            })->filter()->values()->toArray();
            $workflowData['initiator_users'] = $workflow->initiatorAuthorities->map(function ($item) {
                return $item->user->email ?? $item->user_id;
            })->filter()->values()->toArray();
            $workflowData['initiator_divisions'] = $workflow->initiatorAuthorities->pluck('division_id')->filter()->toArray();

            $stepIdMap = [];
            foreach ($workflow->steps as $index => $step) {
                $stepIdMap[$step->id] = "step_{$index}";
            }

            $workflowData['steps'] = $workflow->steps->map(function ($step) use ($stepIdMap) {
                $stepData = collect($step->toArray())->only([
                    'approver_type',
                    'step_category',
                    'is_optional',
                    'optional_label',
                    'condition_expression',
                    'description',
                    'phase',
                    'uploader_type',
                    'hierarchy_level',
                    'role_id',
                    'company_group_ids',
                    'region_ids',
                    'company_ids',
                    'label',
                    'allowed_actions',
                    'is_mandatory',
                    'meta',
                    'filter_department',
                    'filter_company_group',
                    'filter_region',
                    'filter_company',
                ])->toArray();

                $stepData['id'] = $stepIdMap[$step->id];
                $stepData['role'] = $step->approverAuthorities->pluck('role.name')->filter()->toArray();
                $stepData['department_ids'] = $step->approverAuthorities->map(function ($item) {
                    return $item->department->code ?? $item->department_id;
                })->filter()->values()->toArray();
                $stepData['division_ids'] = $step->approverAuthorities->pluck('division_id')->filter()->toArray();
                $stepData['user_ids'] = $step->approverAuthorities->map(function ($item) {
                    return $item->user->email ?? $item->user_id;
                })->filter()->values()->toArray();

                $stepData['actions'] = $step->actions->map(function ($action) use ($stepIdMap) {
                    $actionData = collect($action->toArray())->only([
                        'required_fields',
                        'autofilled_fields',
                        'transition_config',
                        'signing_parties',
                        'assignee_config',
                        'alias',
                        'description',
                        'is_active',
                        'next_workflow_id',
                        'next_workflow_step_id',
                    ])->toArray();

                    $actionData['master_action_name'] = $action->action_code ? $action->action_code->label() : null;
                    if ($action->next_step_id && isset($stepIdMap[$action->next_step_id])) {
                        $actionData['next_step_id'] = $stepIdMap[$action->next_step_id];
                    } else {
                        $actionData['next_step_id'] = null;
                    }

                    return $actionData;
                })->toArray();

                return $stepData;
            })->toArray();

            $exportData[] = $workflowData;
        }

        $fileName = 'workflows_export_'.date('Ymd_His').'.json';

        return response()->streamDownload(function () use ($exportData) {
            echo json_encode($exportData, JSON_PRETTY_PRINT);
        }, $fileName, [
            'Content-Type' => 'application/json',
        ]);
    }

    public function import(ImportWorkflowRequest $request, StoreWorkflowAction $action)
    {
        try {
            $content = file_get_contents($request->file('file')->getRealPath());
            $data = json_decode($content, true);

            if (! is_array($data)) {
                return back()->withErrors(['error' => 'Format file JSON tidak valid.']);
            }

            // Normalise single object to array of objects
            if (isset($data['name']) && ! isset($data[0])) {
                $data = [$data];
            }

            $count = 0;
            DB::transaction(function () use ($data, $action, &$count) {
                foreach ($data as $workflowData) {
                    $originalName = $workflowData['name'] ?? 'Imported Workflow';
                    $name = $originalName;
                    $i = 1;
                    while (Workflow::where('name', $name)->exists()) {
                        $name = $originalName." (Copy {$i})";
                        $i++;
                    }
                    $workflowData['name'] = $name;
                    $workflowData['is_default'] = false;

                    $action->execute($workflowData);
                    $count++;
                }
            });

            return redirect()->route('admin.workflows')->with('success', "{$count} Alur Kerja berhasil diimpor.");
        } catch (\Exception $e) {
            Log::error('Workflow Import Error: '.$e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->withErrors(['error' => 'Gagal mengimpor alur kerja: '.$e->getMessage()]);
        }
    }

    public function storePreset(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'step_data' => 'required|array',
        ]);

        $preset = WorkflowStepPreset::create([
            'name' => $validated['name'],
            'step_data' => $validated['step_data'],
            'created_by_user_id' => auth()->id(),
        ]);

        return back()->with('success', "Preset '{$preset->name}' berhasil disimpan.");
    }

    public function updatePreset(Request $request, WorkflowStepPreset $preset)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'step_data' => 'nullable|array',
        ]);

        $updates = ['name' => $validated['name']];
        if (isset($validated['step_data'])) {
            $updates['step_data'] = $validated['step_data'];
        }

        $preset->update($updates);

        return back()->with('success', "Preset '{$preset->name}' berhasil diperbarui.");
    }

    public function destroyPreset(WorkflowStepPreset $preset)
    {
        $name = $preset->name;
        $preset->delete();

        return back()->with('success', "Preset '{$name}' berhasil dihapus.");
    }
}
