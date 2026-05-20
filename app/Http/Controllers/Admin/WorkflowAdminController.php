<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContractType;
use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use App\Models\CompanyGroup;
use App\Models\Region;
use App\Models\Company;
use App\Models\ContractStatus;
use App\Models\Workflow;
use App\Actions\Admin\WorkflowAction;
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
                $q->whereIn('contract_type', (array)$type);
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
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Alur Kerja (Workflows)', 'href' => route('admin.workflows'), 'icon' => 'GitBranch'],
                ['title' => 'Registrasi Alur Baru', 'href' => '#', 'description' => 'Mendefinisikan alur approval baru.'],
            ],
        ]);
    }

    public function edit(Workflow $workflow)
    {
        $workflow->load(['steps.approverRoles', 'steps.approverDepartments', 'steps.approverUsers', 'initiatorRolesData', 'initiatorDepartmentsData', 'initiatorUsersData']);
        
        $workflowData = $workflow->toArray();
        $workflowData['initiator_roles'] = $workflow->initiatorRolesData->pluck('role_name')->toArray();
        $workflowData['initiator_users'] = $workflow->initiatorUsersData->pluck('user_id')->toArray();
        $workflowData['initiator_departments'] = $workflow->initiatorDepartmentsData->pluck('department_id')->toArray();
        
        $workflowData['steps'] = $workflow->steps->map(function($s) {
            $sd = $s->toArray();
            $sd['role'] = $s->approverRoles->pluck('role_name')->toArray();
            $sd['user_ids'] = $s->approverUsers->pluck('user_id')->toArray();
            $sd['department_ids'] = $s->approverDepartments->pluck('department_id')->toArray();
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
            'steps.*.role' => 'nullable',
            'steps.*.description' => 'nullable|string',
            'steps.*.approver_type' => 'nullable|string',
            'steps.*.step_type' => 'nullable|string',
            'steps.*.step_category' => 'nullable|string',
            'steps.*.is_optional' => 'boolean',
            'steps.*.optional_label' => 'nullable|string',
            'steps.*.condition_expression' => 'nullable|string',
            'steps.*.phase' => 'nullable|string',
            'steps.*.uploader_type' => 'nullable|string',
            'steps.*.reject_target' => 'nullable|string',
            'steps.*.hierarchy_level' => 'nullable|integer',
            'steps.*.role_id' => 'nullable|string',
            'steps.*.user_ids' => 'nullable|array',
            'steps.*.department_ids' => 'nullable|array',
            'steps.*.status_id' => 'nullable|string',

            'steps.*.meta' => 'nullable|array',
            'steps.*.company_group_ids' => 'nullable|array',
            'steps.*.region_ids' => 'nullable|array',
            'steps.*.company_ids' => 'nullable|array',
        ]);

        try {
            $action->store($data);
            return redirect()->route('admin.workflows')->with('success', 'Workflow berhasil dibuat.');
        } catch (\Exception $e) {
            Log::error('Workflow Store Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
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
            'steps.*.role' => 'nullable',
            'steps.*.description' => 'nullable|string',
            'steps.*.approver_type' => 'nullable|string',
            'steps.*.step_type' => 'nullable|string',
            'steps.*.step_category' => 'nullable|string',
            'steps.*.is_optional' => 'boolean',
            'steps.*.optional_label' => 'nullable|string',
            'steps.*.condition_expression' => 'nullable|string',
            'steps.*.phase' => 'nullable|string',
            'steps.*.uploader_type' => 'nullable|string',
            'steps.*.reject_target' => 'nullable|string',
            'steps.*.hierarchy_level' => 'nullable|integer',
            'steps.*.role_id' => 'nullable|string',
            'steps.*.user_ids' => 'nullable|array',
            'steps.*.department_ids' => 'nullable|array',
            'steps.*.label' => 'nullable|string',
            'steps.*.actor_type' => 'nullable|string',
            'steps.*.allowed_actions' => 'nullable|array',
            'steps.*.is_mandatory' => 'nullable|boolean',
            'steps.*.status_id' => 'nullable|string',

            'steps.*.meta' => 'nullable|array',
            'steps.*.company_group_ids' => 'nullable|array',
            'steps.*.region_ids' => 'nullable|array',
            'steps.*.company_ids' => 'nullable|array',
        ]);

        try {
            $action->update($workflow, $data);
            return redirect()->route('admin.workflows')->with('success', 'Workflow berhasil diperbarui.');
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
            'steps.*.role' => 'nullable',
            'steps.*.description' => 'nullable|string',
            'steps.*.approver_type' => 'nullable|string',
            'steps.*.step_type' => 'nullable|string',
            'steps.*.step_category' => 'nullable|string',
            'steps.*.is_optional' => 'boolean',
            'steps.*.optional_label' => 'nullable|string',
            'steps.*.condition_expression' => 'nullable|string',
            'steps.*.phase' => 'nullable|string',
            'steps.*.uploader_type' => 'nullable|string',
            'steps.*.reject_target' => 'nullable|string',
            'steps.*.hierarchy_level' => 'nullable|integer',
            'steps.*.role_id' => 'nullable|string',
            'steps.*.user_ids' => 'nullable|array',
            'steps.*.department_ids' => 'nullable|array',
            'steps.*.status_id' => 'nullable|string',

            'steps.*.meta' => 'nullable|array',
        ]);

        $action->updateSteps($workflow, $data);

        return redirect()->route('admin.workflows')->with('success', 'Steps berhasil diperbarui.');
    }

    public function bulkDestroy(Request $request)
    {
        $ids = $request->input('ids', []);
        if (empty($ids)) return back();

        Workflow::whereIn('id', $ids)->delete();
        return back()->with('success', count($ids) . ' alur kerja berhasil dihapus.');
    }
}
