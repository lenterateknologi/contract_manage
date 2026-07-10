<?php

namespace App\Http\Controllers\Admin;

use App\Http\Actions\Workflow\DestroyWorkflowAction;
use App\Http\Actions\Workflow\DuplicateWorkflowAction;
use App\Http\Actions\Workflow\StoreWorkflowAction;
use App\Http\Actions\Workflow\UpdateWorkflowAction;
use App\Http\Actions\Workflow\UpdateWorkflowStepsAction;
use App\Http\Controllers\Controller;
use App\Http\Queries\Master\UserQuery;
use App\Http\Queries\Master\WorkflowQuery;
use App\Http\Requests\Workflow\ImportWorkflowRequest;
use App\Http\Requests\Workflow\StoreWorkflowRequest;
use App\Http\Requests\Workflow\UpdateWorkflowRequest;
use App\Http\Requests\Workflow\UpdateWorkflowStepsRequest;
use App\Models\Company;
use App\Models\CompanyGroup;
use App\Models\ContractStatus;
use App\Models\ContractType;
use App\Models\Department;
use App\Models\Division;
use App\Models\FormTemplate;
use App\Models\Region;
use App\Models\Role;
use App\Models\User;
use App\Models\Workflow;
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
        $query = $this->workflowQuery->list($request);

        return Inertia::render('admin/Index', [
            'currentView' => 'workflows',
            'workflows' => $query->orderBy('name')->paginate($request->input('per_page', 10))->withQueryString(),
            'contractTypes' => ContractType::all(),
            'departments' => Department::all(),
            'divisions' => Division::all(),
            'roles' => Role::all(),
            'users' => User::all(),
            'companyGroups' => CompanyGroup::all(),
            'regions' => Region::all(),
            'companies' => Company::all(),
            'contractStatuses' => ContractStatus::orderBy('label')->get(),
            'filters' => $request->only(['search', 'contract_type_id', 'company_group_id', 'region_id', 'company_id']),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Alur Kerja (Workflows)', 'href' => route('admin.workflows'), 'description' => 'Konfigurasi tahapan persetujuan.', 'icon' => 'GitBranch'],
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('workflows/form', [
            'workflow' => null,
            'contractTypes' => ContractType::all(),
            'departments' => Department::all(),
            'divisions' => Division::all(),
            'roles' => Role::all(),
            'users' => User::all(),
            'companyGroups' => CompanyGroup::all(),
            'regions' => Region::all(),
            'companies' => Company::all(),
            'contractStatuses' => ContractStatus::orderBy('label')->get(),
            'allWorkflows' => $this->workflowQuery->options()->get(),
            'formTemplates' => FormTemplate::select('id', 'name')->orderBy('name')->get(),
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
            $sd['role'] = $s->approverAuthorities->filter(fn ($a) => ! $a->use_initiator_property)->pluck('role.name')->filter()->values()->toArray();
            $sd['user_ids'] = $s->approverAuthorities->filter(fn ($a) => ! $a->use_initiator_property)->pluck('user_id')->filter()->values()->toArray();
            $sd['department_ids'] = $s->approverAuthorities->filter(fn ($a) => ! $a->use_initiator_property)->pluck('department_id')->filter()->values()->toArray();
            $sd['division_ids'] = $s->approverAuthorities->filter(fn ($a) => ! $a->use_initiator_property)->pluck('division_id')->filter()->values()->toArray();
            $sd['approver_authorities'] = $s->approverAuthorities->map(function ($a) {
                $arr = $a->toArray();
                if (in_array($a->authority_type, ['initiator', 'assigned_pic', 'creator'])) {
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

            $sd['actions'] = $s->actions->map(function ($action) {
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
                    'master_action_id' => $action->action_code ? $action->action_code->value : null,
                    'master_action_name' => $action->action_code ? $action->action_code->label() : ($action->alias ?: 'Action'),
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
                    'description' => $action->description,
                    'is_active' => $action->is_active,
                ];
            })->toArray();

            return $sd;
        });

        return Inertia::render('workflows/form', [
            'workflow' => $workflowData,
            'contractTypes' => ContractType::all(),
            'departments' => Department::all(),
            'divisions' => Division::all(),
            'roles' => Role::all(),
            'users' => User::all(),
            'companyGroups' => CompanyGroup::all(),
            'regions' => Region::all(),
            'companies' => Company::all(),
            'contractStatuses' => ContractStatus::orderBy('label')->get(),
            'allWorkflows' => $this->workflowQuery->options()->get(),
            'formTemplates' => FormTemplate::select('id', 'name')->orderBy('name')->get(),
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

            return redirect()->route('admin.workflows.steps', $workflow->id)->with('success', 'Workflow berhasil dibuat. Silakan konfigurasikan tahapan alur kerja.');
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
            Log::error('Workflow Update Error: '.$e->getMessage());

            return back()->withErrors(['error' => 'Gagal memperbarui alur kerja: '.$e->getMessage()]);
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

    public function steps(Workflow $workflow)
    {
        $workflow->load('steps');
        $roles = Role::orderBy('name')->get();
        $users = $this->userQuery->options()->get();

        return Inertia::render('workflows/Steps', [
            'workflow' => $workflow,
            'roles' => $roles,
            'users' => $users,
        ]);
    }

    public function updateSteps(UpdateWorkflowStepsRequest $request, Workflow $workflow, UpdateWorkflowStepsAction $action)
    {
        try {
            $action->execute($workflow, $request->validated());

            return back()->with('success', 'Tahapan alur kerja berhasil diperbarui.');
        } catch (\Exception $e) {
            Log::error('Workflow Steps Update Error: '.$e->getMessage());

            return back()->withErrors(['error' => 'Gagal memperbarui tahapan: '.$e->getMessage()]);
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
}
