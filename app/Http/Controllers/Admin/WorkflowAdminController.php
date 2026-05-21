<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\WorkflowAction;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\CompanyGroup;
use App\Models\ContractStatus;
use App\Models\ContractType;
use App\Models\Department;
use App\Models\MasterAction;
use App\Models\Region;
use App\Models\Role;
use App\Models\User;
use App\Models\Workflow;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class WorkflowAdminController extends Controller
{
    public function index(Request $request)
    {
        $query = Workflow::with(['steps.approverRoles', 'steps.approverDepartments', 'steps.approverUsers', 'initiatorRolesData', 'initiatorDepartmentsData', 'initiatorUsersData'])
            ->when($request->search, function ($q, $search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('description', 'ilike', "%{$search}%");
            })
            ->when($request->contract_type, function ($q, $type) {
                $q->whereIn('contract_type', (array) $type);
            })
            ->when($request->company_group_id, function ($q, $id) {
                $q->whereJsonContains('company_group_ids', $id);
            })
            ->when($request->region_id, function ($q, $id) {
                $q->whereJsonContains('region_ids', $id);
            })
            ->when($request->company_id, function ($q, $id) {
                $q->whereJsonContains('company_ids', $id);
            });

        return Inertia::render('admin/index', [
            'currentView' => 'workflows',
            'workflows' => $query->orderBy('name')->paginate($request->input('per_page', 10))->withQueryString(),
            'contractTypes' => ContractType::all(),
            'departments' => Department::all(),
            'roles' => Role::all(),
            'users' => User::all(),
            'companyGroups' => CompanyGroup::all(),
            'regions' => Region::all(),
            'companies' => Company::all(),
            'contractStatuses' => ContractStatus::orderBy('label')->get(),
            'filters' => $request->only(['search', 'contract_type', 'company_group_id', 'region_id', 'company_id']),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Alur Kerja (Workflows)', 'href' => route('admin.workflows'), 'description' => 'Konfigurasi tahapan persetujuan.', 'icon' => 'GitBranch'],
            ],
        ]);
    }

    public function visualize()
    {
        return Inertia::render('admin/workflows/visualize', [
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Workflow', 'href' => route('admin.workflows'), 'icon' => 'GitBranch'],
                ['title' => 'Visualisasi Fullscreen', 'href' => '#', 'description' => 'Visualisasi alur workflow dalam layar penuh.', 'icon' => 'Layout'],
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/workflows/form', [
            'workflow' => null,
            'contractTypes' => ContractType::all(),
            'departments' => Department::all(),
            'roles' => Role::all(),
            'users' => User::all(),
            'companyGroups' => CompanyGroup::all(),
            'regions' => Region::all(),
            'companies' => Company::all(),
            'contractStatuses' => ContractStatus::orderBy('label')->get(),
            'masterActions' => MasterAction::where('is_active', true)->orderBy('name')->get(),
            'allWorkflows' => Workflow::with('steps')->orderBy('name')->get(),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Alur Kerja (Workflows)', 'href' => route('admin.workflows'), 'icon' => 'GitBranch'],
                ['title' => 'Registrasi Alur Baru', 'href' => '#', 'description' => 'Mendefinisikan alur approval baru.'],
            ],
        ]);
    }

    public function edit(Workflow $workflow)
    {
        $workflow->load(['steps.approverRoles', 'steps.approverDepartments', 'steps.approverUsers', 'steps.actions.masterAction', 'initiatorRolesData', 'initiatorDepartmentsData', 'initiatorUsersData']);

        $workflowData = $workflow->toArray();
        $workflowData['initiator_roles'] = $workflow->initiatorRolesData->pluck('role_name')->toArray();
        $workflowData['initiator_users'] = $workflow->initiatorUsersData->pluck('user_id')->toArray();
        $workflowData['initiator_departments'] = $workflow->initiatorDepartmentsData->pluck('department_id')->toArray();

        $workflowData['steps'] = $workflow->steps->map(function ($s) {
            $sd = $s->toArray();
            $sd['role'] = $s->approverRoles->pluck('role_name')->toArray();
            $sd['user_ids'] = $s->approverUsers->pluck('user_id')->toArray();
            $sd['department_ids'] = $s->approverDepartments->pluck('department_id')->toArray();
            $sd['actions'] = $s->actions->map(function ($action) {
                return [
                    'id' => $action->id,
                    'master_action_id' => $action->master_action_id,
                    'master_action_name' => $action->masterAction->name ?? '',
                    'master_action' => $action->masterAction,
                    'next_step_id' => $action->next_step_id,
                    'next_workflow_id' => $action->next_workflow_id,
                    'next_workflow_step_id' => $action->next_workflow_step_id,
                    'required_fields' => $action->required_fields ?? [],
                    'autofilled_fields' => $action->autofilled_fields ?? [],
                    'signing_parties' => $action->signing_parties ?? [],
                    'assignee_config' => $action->assignee_config ?? [],
                    'alias' => $action->alias,
                    'description' => $action->description,
                    'is_active' => $action->is_active,
                ];
            })->toArray();

            return $sd;
        });

        return Inertia::render('admin/workflows/form', [
            'workflow' => $workflowData,
            'contractTypes' => ContractType::all(),
            'departments' => Department::all(),
            'roles' => Role::all(),
            'users' => User::all(),
            'companyGroups' => CompanyGroup::all(),
            'regions' => Region::all(),
            'companies' => Company::all(),
            'contractStatuses' => ContractStatus::orderBy('label')->get(),
            'masterActions' => MasterAction::where('is_active', true)->orderBy('name')->get(),
            'allWorkflows' => Workflow::with('steps')->orderBy('name')->get(),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Alur Kerja (Workflows)', 'href' => route('admin.workflows'), 'icon' => 'GitBranch'],
                ['title' => 'Parameter Alur Kerja', 'href' => '#', 'description' => "Konfigurasi tahapan untuk {$workflow->name}."],
            ],
        ]);
    }

    public function store(Request $request, WorkflowAction $action)
    {
        Log::info('Incoming Workflow Store Request', $request->all());

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'contract_type' => 'required|string',
            'description' => 'nullable|string',
            'is_default' => 'boolean',
            'initiator_type' => 'nullable|string|in:all,role,user',
            'scope' => 'nullable|string',
            'workflow_category' => 'nullable|string',
            'company_group_ids' => 'nullable|array',
            'region_ids' => 'nullable|array',
            'company_ids' => 'nullable|array',
            'initiator_roles' => 'nullable|array',
            'initiator_users' => 'nullable|array',
            'initiator_departments' => 'nullable|array',
            'steps' => 'nullable|array',
            'steps.*.id' => 'nullable|string',
            'steps.*.label' => 'nullable|string',
            'steps.*.is_mandatory' => 'nullable|boolean',
            'steps.*.role' => 'nullable',
            'steps.*.description' => 'nullable|string',
            'steps.*.approver_type' => 'nullable|string',
            'steps.*.step_category' => 'nullable|string',
            'steps.*.is_optional' => 'boolean',
            'steps.*.optional_label' => 'nullable|string',
            'steps.*.condition_expression' => 'nullable|string',
            'steps.*.phase' => 'nullable|string',
            'steps.*.uploader_type' => 'nullable|string',
            'steps.*.hierarchy_level' => 'nullable|integer',
            'steps.*.role_id' => 'nullable|string',
            'steps.*.user_ids' => 'nullable|array',
            'steps.*.department_ids' => 'nullable|array',
            'steps.*.meta' => 'nullable|array',
            'steps.*.company_group_ids' => 'nullable|array',
            'steps.*.region_ids' => 'nullable|array',
            'steps.*.company_ids' => 'nullable|array',
            'steps.*.actions' => 'nullable|array',
            'steps.*.actions.*.id' => 'nullable|string',
            'steps.*.actions.*.master_action_id' => 'nullable|string',
            'steps.*.actions.*.master_action_name' => 'nullable|string',
            'steps.*.actions.*.next_step_id' => 'nullable|string',
            'steps.*.actions.*.next_workflow_id' => 'nullable|string',
            'steps.*.actions.*.next_workflow_step_id' => 'nullable|string',
            'steps.*.actions.*.required_fields' => 'nullable|array',
            'steps.*.actions.*.autofilled_fields' => 'nullable|array',
            'steps.*.actions.*.signing_parties' => 'nullable|array',
            'steps.*.actions.*.assignee_config' => 'nullable|array',
            'steps.*.actions.*.alias' => 'nullable|string',
            'steps.*.actions.*.description' => 'nullable|string',
            'steps.*.actions.*.is_active' => 'nullable|boolean',
        ]);

        try {
            $action->store($data);

            return redirect()->route('admin.workflows')->with('success', 'Workflow berhasil dibuat.');
        } catch (\Exception $e) {
            Log::error('Workflow Store Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->withErrors(['error' => 'Gagal menyimpan alur kerja: ' . $e->getMessage()]);
        }
    }

    public function update(Request $request, Workflow $workflow, WorkflowAction $action)
    {
        Log::info('Incoming Workflow Update Request', $request->all());

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'contract_type' => 'required|string',
            'description' => 'nullable|string',
            'is_default' => 'boolean',
            'initiator_type' => 'nullable|string|in:all,role,user',
            'scope' => 'nullable|string',
            'workflow_category' => 'nullable|string',
            'company_group_ids' => 'nullable|array',
            'region_ids' => 'nullable|array',
            'company_ids' => 'nullable|array',
            'initiator_roles' => 'nullable|array',
            'initiator_users' => 'nullable|array',
            'initiator_departments' => 'nullable|array',
            'steps' => 'nullable|array',
            'steps.*.id' => 'nullable|string',
            'steps.*.role' => 'nullable',
            'steps.*.description' => 'nullable|string',
            'steps.*.approver_type' => 'nullable|string',
            'steps.*.step_category' => 'nullable|string',
            'steps.*.is_optional' => 'boolean',
            'steps.*.optional_label' => 'nullable|string',
            'steps.*.condition_expression' => 'nullable|string',
            'steps.*.phase' => 'nullable|string',
            'steps.*.uploader_type' => 'nullable|string',
            'steps.*.hierarchy_level' => 'nullable|integer',
            'steps.*.role_id' => 'nullable|string',
            'steps.*.user_ids' => 'nullable|array',
            'steps.*.department_ids' => 'nullable|array',
            'steps.*.label' => 'nullable|string',
            'steps.*.allowed_actions' => 'nullable|array',
            'steps.*.is_mandatory' => 'nullable|boolean',
            'steps.*.meta' => 'nullable|array',
            'steps.*.company_group_ids' => 'nullable|array',
            'steps.*.region_ids' => 'nullable|array',
            'steps.*.company_ids' => 'nullable|array',
            'steps.*.actions' => 'nullable|array',
            'steps.*.actions.*.id' => 'nullable|string',
            'steps.*.actions.*.master_action_id' => 'nullable|string',
            'steps.*.actions.*.master_action_name' => 'nullable|string',
            'steps.*.actions.*.next_step_id' => 'nullable|string',
            'steps.*.actions.*.next_workflow_id' => 'nullable|string',
            'steps.*.actions.*.next_workflow_step_id' => 'nullable|string',
            'steps.*.actions.*.required_fields' => 'nullable|array',
            'steps.*.actions.*.autofilled_fields' => 'nullable|array',
            'steps.*.actions.*.signing_parties' => 'nullable|array',
            'steps.*.actions.*.assignee_config' => 'nullable|array',
            'steps.*.actions.*.alias' => 'nullable|string',
            'steps.*.actions.*.description' => 'nullable|string',
            'steps.*.actions.*.is_active' => 'nullable|boolean',
        ]);

        try {
            $action->update($workflow, $data);

            return redirect()->route('admin.workflows.edit', $workflow->id)->with('success', 'Workflow berhasil diperbarui.');
        } catch (\Exception $e) {
            Log::error('Workflow Update Error: ' . $e->getMessage());

            return back()->withErrors(['error' => 'Gagal memperbarui alur kerja: ' . $e->getMessage()]);
        }
    }

    public function destroy(Workflow $workflow, WorkflowAction $action)
    {
        $action->destroy($workflow);

        return redirect()->back();
    }

    public function steps(Workflow $workflow)
    {
        $workflow->load('steps');
        $roles = Role::orderBy('name')->get();
        $users = User::orderBy('name')->get();

        return Inertia::render('admin/workflow-steps', [
            'workflow' => $workflow,
            'roles' => $roles,
            'users' => $users,
        ]);
    }

    public function updateSteps(Request $request, Workflow $workflow, WorkflowAction $action)
    {
        $data = $request->validate([
            'steps' => 'nullable|array',
            'steps.*.id' => 'nullable|string',
            'steps.*.role' => 'nullable',
            'steps.*.description' => 'nullable|string',
            'steps.*.approver_type' => 'nullable|string',
            'steps.*.step_category' => 'nullable|string',
            'steps.*.is_optional' => 'boolean',
            'steps.*.optional_label' => 'nullable|string',
            'steps.*.condition_expression' => 'nullable|string',
            'steps.*.phase' => 'nullable|string',
            'steps.*.uploader_type' => 'nullable|string',
            'steps.*.hierarchy_level' => 'nullable|integer',
            'steps.*.role_id' => 'nullable|string',
            'steps.*.user_ids' => 'nullable|array',
            'steps.*.department_ids' => 'nullable|array',
            'steps.*.label' => 'nullable|string',
            'steps.*.is_mandatory' => 'nullable|boolean',
            'steps.*.meta' => 'nullable|array',
            'steps.*.company_group_ids' => 'nullable|array',
            'steps.*.region_ids' => 'nullable|array',
            'steps.*.company_ids' => 'nullable|array',
            'steps.*.actions' => 'nullable|array',
            'steps.*.actions.*.id' => 'nullable|string',
            'steps.*.actions.*.master_action_id' => 'nullable|string',
            'steps.*.actions.*.master_action_name' => 'nullable|string',
            'steps.*.actions.*.next_step_id' => 'nullable|string',
            'steps.*.actions.*.next_workflow_id' => 'nullable|string',
            'steps.*.actions.*.next_workflow_step_id' => 'nullable|string',
            'steps.*.actions.*.required_fields' => 'nullable|array',
            'steps.*.actions.*.autofilled_fields' => 'nullable|array',
            'steps.*.actions.*.signing_parties' => 'nullable|array',
            'steps.*.actions.*.assignee_config' => 'nullable|array',
            'steps.*.actions.*.alias' => 'nullable|string',
            'steps.*.actions.*.description' => 'nullable|string',
            'steps.*.actions.*.is_active' => 'nullable|boolean',
        ]);

        $action->updateSteps($workflow, $data);

        return redirect()->route('admin.workflows')->with('success', 'Steps berhasil diperbarui.');
    }

    public function bulkDestroy(Request $request)
    {
        $ids = $request->input('ids', []);
        if (empty($ids)) {
            return back();
        }

        Workflow::whereIn('id', $ids)->delete();

        return back()->with('success', count($ids) . ' alur kerja berhasil dihapus.');
    }

    public function updateMasterAction(Request $request, $id)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $masterAction = MasterAction::findOrFail($id);
        $code = strtolower(str_replace(' ', '_', trim($data['name'])));

        $masterAction->update([
            'name' => trim($data['name']),
            'code' => $code,
            'updated_by' => \Illuminate\Support\Facades\Auth::id(),
        ]);

        return back()->with('success', 'Master Aksi berhasil diperbarui.');
    }

    public function destroyMasterAction($id)
    {
        $masterAction = MasterAction::findOrFail($id);
        $masterAction->delete();

        return back()->with('success', 'Master Aksi berhasil dihapus.');
    }

    public function export(Request $request)
    {
        $ids = $request->input('ids');
        if (empty($ids)) {
            return back()->withErrors(['error' => 'Pilih alur kerja yang ingin diekspor.']);
        }

        $workflows = Workflow::with([
            'steps.approverRoles',
            'steps.approverDepartments.department',
            'steps.approverUsers.user',
            'steps.actions.masterAction',
            'initiatorRolesData',
            'initiatorDepartmentsData.department',
            'initiatorUsersData.user',
        ])->whereIn('id', (array) $ids)->get();

        $exportData = [];

        foreach ($workflows as $workflow) {
            $workflowData = collect($workflow->toArray())->only([
                'contract_type',
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
            ])->toArray();

            $workflowData['initiator_roles'] = $workflow->initiatorRolesData->pluck('role_name')->toArray();
            $workflowData['initiator_departments'] = $workflow->initiatorDepartmentsData->map(function ($item) {
                return $item->department->code ?? $item->department_id;
            })->filter()->values()->toArray();
            $workflowData['initiator_users'] = $workflow->initiatorUsersData->map(function ($item) {
                return $item->user->email ?? $item->user_id;
            })->filter()->values()->toArray();

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
                ])->toArray();

                $stepData['id'] = $stepIdMap[$step->id];
                $stepData['role'] = $step->approverRoles->pluck('role_name')->toArray();
                $stepData['department_ids'] = $step->approverDepartments->map(function ($item) {
                    return $item->department->code ?? $item->department_id;
                })->filter()->values()->toArray();
                $stepData['user_ids'] = $step->approverUsers->map(function ($item) {
                    return $item->user->email ?? $item->user_id;
                })->filter()->values()->toArray();

                $stepData['actions'] = $step->actions->map(function ($action) use ($stepIdMap) {
                    $actionData = collect($action->toArray())->only([
                        'required_fields',
                        'autofilled_fields',
                        'signing_parties',
                        'assignee_config',
                        'alias',
                        'description',
                        'is_active',
                        'next_workflow_id',
                        'next_workflow_step_id',
                    ])->toArray();

                    $actionData['master_action_name'] = $action->masterAction->name ?? null;
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

        $fileName = 'workflows_export_' . date('Ymd_His') . '.json';

        return response()->streamDownload(function () use ($exportData) {
            echo json_encode($exportData, JSON_PRETTY_PRINT);
        }, $fileName, [
            'Content-Type' => 'application/json',
        ]);
    }

    public function import(Request $request, WorkflowAction $action)
    {
        $request->validate([
            'file' => 'required|file|mimes:json',
        ]);

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
            \Illuminate\Support\Facades\DB::transaction(function () use ($data, $action, &$count) {
                foreach ($data as $workflowData) {
                    $originalName = $workflowData['name'] ?? 'Imported Workflow';
                    $name = $originalName;
                    $i = 1;
                    while (Workflow::where('name', $name)->exists()) {
                        $name = $originalName . " (Copy {$i})";
                        $i++;
                    }
                    $workflowData['name'] = $name;
                    $workflowData['is_default'] = false;

                    $action->store($workflowData);
                    $count++;
                }
            });

            return redirect()->route('admin.workflows')->with('success', "{$count} Alur Kerja berhasil diimpor.");
        } catch (\Exception $e) {
            Log::error('Workflow Import Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->withErrors(['error' => 'Gagal mengimpor alur kerja: ' . $e->getMessage()]);
        }
    }
}
