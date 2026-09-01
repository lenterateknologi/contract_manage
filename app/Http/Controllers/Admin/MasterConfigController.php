<?php

namespace App\Http\Controllers\Admin;

use App\Exports\DepartmentsWorkbookExport;
use App\Http\Controllers\Controller;
use App\Http\Queries\Master\OrganizationQuery;
use App\Http\Requests\Common\BulkDeleteRequest;
use App\Http\Requests\Common\ImportFileRequest;
use App\Http\Requests\ContractStatus\StoreContractStatusRequest;
use App\Http\Requests\ContractStatus\UpdateContractStatusRequest;
use App\Http\Requests\ContractType\StoreContractTypeRequest;
use App\Http\Requests\ContractType\UpdateContractTypeRequest;
use App\Http\Requests\Department\StoreDepartmentRequest;
use App\Http\Requests\Department\UpdateDepartmentRequest;
use App\Http\Requests\Module\StoreModuleGroupRequest;
use App\Http\Requests\Module\StoreModuleRequest;
use App\Http\Requests\Module\UpdateModuleGroupRequest;
use App\Http\Requests\Module\UpdateModuleRequest;
use App\Http\Requests\Role\ReorderRoleNavigationRequest;
use App\Http\Requests\Settings\UpdateNumberingFormatRequest;
use App\Imports\DepartmentsImport;
use App\Models\AccessModule;
use App\Models\ContractStatus;
use App\Models\ContractTemplate;
use App\Models\ContractType;
use App\Models\Department;
use App\Models\FormTemplate;
use App\Models\Module;
use App\Models\ModuleGroup;
use App\Models\NumberingFormat;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;

class MasterConfigController extends Controller
{
    public function __construct(
        protected OrganizationQuery $organizationQuery,
    ) {}

    // ─── Contract Types ───────────────────────────────────────────────────────

    public function contractTypes(Request $request): Response
    {
        $sortBy = $request->input('sort_by', 'name');
        $sortDir = $request->input('sort_dir', 'asc');

        // Whitelist columns to ensure query safety
        $allowedSortColumns = ['name', 'parent_id', 'description'];
        if (! in_array($sortBy, $allowedSortColumns)) {
            $sortBy = 'name';
        }
        if (! in_array($sortDir, ['asc', 'desc'])) {
            $sortDir = 'asc';
        }

        $query = $this->organizationQuery->contractTypes($request);

        return Inertia::render('admin/Index', [
            'currentView' => 'contract-types',
            'types' => $query->orderBy($sortBy, $sortDir)->paginate($request->input('per_page', 10))->withQueryString(),
            'formTemplates' => FormTemplate::where('is_active', true)->orderBy('name')->get(),
            'contractTemplates' => ContractTemplate::orderBy('name')->get(),
            'filters' => $request->only(['search', 'sort_by', 'sort_dir']),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Tipe Kontrak', 'href' => route('core.index', 'contract-types'), 'icon' => 'FileText'],
            ],
        ]);
    }

    public function createContractType()
    {
        return Inertia::render('contract-types/form', [
            'parentTypes' => ContractType::orderBy('name')->get(),
        ]);
    }

    public function editContractType(ContractType $type)
    {
        $type->load('children');

        return Inertia::render('contract-types/form', [
            'contractType' => $type,
            'parentTypes' => ContractType::where('id', '!=', $type->id)->orderBy('name')->get(),
        ]);
    }

    public function storeContractType(StoreContractTypeRequest $request)
    {
        ContractType::create($request->validated());

        return redirect()->route('admin.contract-types')->with('success', 'Tipe kontrak berhasil dibuat.');
    }

    public function updateContractType(UpdateContractTypeRequest $request, ContractType $type)
    {
        $type->update($request->validated());

        return redirect()->route('admin.contract-types')->with('success', 'Tipe kontrak berhasil diperbarui.');
    }

    public function destroyContractType(ContractType $type)
    {
        $type->delete();

        return redirect()->route('admin.contract-types')->with('success', 'Tipe kontrak berhasil dihapus.');
    }

    public function bulkDestroyContractTypes(Request $request)
    {
        $ids = $request->input('ids', []);
        if (empty($ids)) {
            return back();
        }
        ContractType::whereIn('id', $ids)->delete();

        return back()->with('success', count($ids).' tipe kontrak berhasil dihapus.');
    }

    // ─── Contract Statuses ────────────────────────────────────────────────────

    public function contractStatuses(Request $request)
    {
        $query = $this->organizationQuery->contractStatuses($request);

        return Inertia::render('admin/Index', [
            'currentView' => 'contract-statuses',
            'statuses' => $query->orderBy('label')->paginate($request->input('per_page', 10))->withQueryString(),
            'filters' => $request->only(['search']),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Master Status', 'href' => route('admin.contract-statuses'), 'icon' => 'Tags'],
            ],
        ]);
    }

    public function storeContractStatus(StoreContractStatusRequest $request)
    {
        ContractStatus::create($request->validated());

        return back()->with('success', 'Status berhasil dibuat.');
    }

    public function updateContractStatus(UpdateContractStatusRequest $request, ContractStatus $status)
    {
        $status->update($request->validated());

        return back()->with('success', 'Status berhasil diperbarui.');
    }

    public function destroyContractStatus(ContractStatus $status)
    {
        $status->delete();

        return back()->with('success', 'Status berhasil dihapus.');
    }

    public function bulkDestroyStatuses(Request $request)
    {
        $ids = $request->input('ids', []);
        if (empty($ids)) {
            return back();
        }
        ContractStatus::whereIn('id', $ids)->delete();

        return back()->with('success', count($ids).' status berhasil dihapus.');
    }

    // ─── Departments ──────────────────────────────────────────────────────────

    public function departments(Request $request)
    {
        $query = $this->organizationQuery->departments($request);

        if ($request->wantsJson()) {
            return response()->json($query->orderBy('name')->paginate($request->input('per_page', 10)));
        }

        return Inertia::render('admin/Index', [
            'currentView' => 'departments',
            'departments' => $query->orderBy('name')->paginate($request->input('per_page', 10))->withQueryString(),
            'filters' => $request->only(['search', 'is_active']),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Master Departemen', 'href' => route('core.index', 'departments'), 'icon' => 'Building2'],
            ],
        ]);
    }

    public function storeDepartment(StoreDepartmentRequest $request)
    {
        $data = $request->validated();
        $data['created_by'] = $data['updated_by'] = Auth::id();
        Department::create($data);

        return back()->with('success', 'Departemen berhasil dibuat.');
    }

    public function updateDepartment(UpdateDepartmentRequest $request, Department $department)
    {
        $data = $request->validated();
        $data['updated_by'] = Auth::id();
        $department->update($data);

        return back()->with('success', 'Departemen berhasil diperbarui.');
    }

    public function destroyDepartment(Department $department)
    {
        $department->delete();

        return back()->with('success', 'Departemen berhasil dihapus.');
    }

    public function bulkDestroyDepartment(BulkDeleteRequest $request)
    {
        $ids = $request->validated()['ids'];
        Department::whereIn('id', $ids)->delete();

        return back()->with('success', count($ids).' departemen berhasil dihapus.');
    }

    // ─── Navigation & Modules ─────────────────────────────────────────────────

    public function navigation()
    {
        $groups = ModuleGroup::with(['modules' => fn ($q) => $q->orderBy('name')])->orderBy('name')->get();

        return Inertia::render('admin/Index', ['currentView' => 'navigation', 'groups' => $groups]);
    }

    public function moduleGroups(Request $request)
    {
        $query = ModuleGroup::query()->when($request->search, function ($q, $s) {
            $s = strtolower($s);

            return $q->where(DB::raw('LOWER(name)'), 'like', "%{$s}%");
        });

        return Inertia::render('admin/Index', [
            'currentView' => 'module-groups',
            'moduleGroups' => $query->orderBy('name')->paginate($request->input('per_page', 10))->withQueryString(),
            'filters' => $request->only(['search']),
            'breadcrumbs' => [['title' => 'Administrasi', 'href' => '#'], ['title' => 'Grup Modul', 'href' => route('admin.module-groups')]],
        ]);
    }

    public function modules(Request $request)
    {
        $query = Module::with('moduleGroup')
            ->when($request->search, function ($q, $s) {
                $s = strtolower($s);

                return $q->where(DB::raw('LOWER(name)'), 'like', "%{$s}%")
                    ->orWhere(DB::raw('LOWER(description)'), 'like', "%{$s}%");
            })
            ->when($request->module_group_id, fn ($q, $id) => $q->whereIn('module_group_id', (array) $id));

        return Inertia::render('admin/Index', [
            'currentView' => 'modules',
            'modules' => $query->orderBy('name')->paginate($request->input('per_page', 10))->withQueryString(),
            'moduleGroups' => ModuleGroup::all(),
            'filters' => $request->only(['search', 'module_group_id']),
            'breadcrumbs' => [['title' => 'Administrasi', 'href' => '#'], ['title' => 'Modul Sistem', 'href' => route('admin.modules')]],
        ]);
    }

    public function reorderNavigation(ReorderRoleNavigationRequest $request)
    {
        $data = $request->validated();

        foreach ($data['groups'] as $groupData) {
            foreach ($groupData['modules'] ?? [] as $moduleData) {
                Module::where('id', $moduleData['id'])->update(['module_group_id' => $groupData['id']]);
                AccessModule::updateOrCreate(
                    ['role_id' => $data['role_id'], 'module_id' => $moduleData['id']],
                    ['can_read' => true, 'created_by' => Auth::id()],
                );
            }
        }

        return back()->with('success', 'Navigation and permissions berhasil diperbarui.');
    }

    public function storeModuleGroup(StoreModuleGroupRequest $request)
    {
        $data = $request->validated();
        $roleId = $data['role_id'] ?? null;
        unset($data['role_id']);

        $data['created_by'] = $data['updated_by'] = Auth::id();
        $group = ModuleGroup::create($data);

        if ($roleId) {
            $maxSeq = \App\Models\RoleModuleGroup::where('role_id', $roleId)->max('sequence') ?? 0;
            \App\Models\RoleModuleGroup::create([
                'role_id' => $roleId,
                'module_group_id' => $group->id,
                'sequence' => $maxSeq + 1,
            ]);
        }

        return back()->with('success', 'Module group berhasil dibuat.');
    }

    public function updateModuleGroup(UpdateModuleGroupRequest $request, ModuleGroup $group)
    {
        $data = $request->validated();
        $data['updated_by'] = Auth::id();
        $group->update($data);

        return back()->with('success', 'Module group berhasil diperbarui.');
    }

    public function destroyModuleGroup(ModuleGroup $group)
    {
        $group->delete();

        return back()->with('success', 'Module group berhasil dihapus.');
    }

    public function bulkDestroyModuleGroups(BulkDeleteRequest $request)
    {
        $ids = $request->validated()['ids'];
        ModuleGroup::whereIn('id', $ids)->delete();

        return back()->with('success', count($ids).' grup modul berhasil dihapus.');
    }

    public function storeModule(StoreModuleRequest $request)
    {
        $data = $request->validated();
        $roleId = $data['role_id'] ?? null;
        unset($data['role_id']);

        $data['created_by'] = $data['updated_by'] = Auth::id();
        $module = Module::create($data);

        // ponytail: Secara otomatis buat record AccessModule untuk setiap role
        $roles = Role::all();
        foreach ($roles as $role) {
            $isTargetRole = ($roleId && $role->id === $roleId);
            $isAdmin = in_array($role->name, ['Admin', 'Super Admin']);

            AccessModule::create([
                'role_id' => $role->id,
                'module_id' => $module->id,
                'module_group_id' => $module->module_group_id,
                'can_read' => $isTargetRole || $isAdmin,
                'can_create' => $isTargetRole || $isAdmin,
                'can_update' => $isTargetRole || $isAdmin,
                'can_delete' => $isTargetRole || $isAdmin,
                'can_approve' => $isTargetRole || $isAdmin,
                'can_bulk_approve' => $isTargetRole || $isAdmin,
                'can_bulk_delete' => $isTargetRole || $isAdmin,
                'created_by' => Auth::id(),
            ]);
        }

        return back()->with('success', 'Module berhasil dibuat.');
    }

    public function updateModule(UpdateModuleRequest $request, Module $module)
    {
        $data = $request->validated();
        $data['updated_by'] = Auth::id();
        $module->update($data);

        // ponytail: Sync group ID ke access modules
        if (isset($data['module_group_id'])) {
            AccessModule::where('module_id', $module->id)->update([
                'module_group_id' => $data['module_group_id'],
            ]);
        }

        return back()->with('success', 'Module berhasil diperbarui.');
    }

    public function destroyModule(Module $module)
    {
        $module->delete();

        return back()->with('success', 'Module berhasil dihapus.');
    }

    public function bulkDestroyModules(BulkDeleteRequest $request)
    {
        $ids = $request->validated()['ids'];
        Module::whereIn('id', $ids)->delete();

        return back()->with('success', count($ids).' modul berhasil dihapus.');
    }

    // ─── Numbering Formats ────────────────────────────────────────────────────

    public function numberingFormats()
    {
        return Inertia::render('admin/Index', [
            'currentView' => 'numbering-formats',
            'formats' => NumberingFormat::all(),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Pengaturan Penomoran', 'href' => route('admin.numbering-formats'), 'icon' => 'Hash'],
            ],
        ]);
    }

    public function updateNumberingFormat(UpdateNumberingFormatRequest $request, NumberingFormat $format)
    {
        $format->update($request->validated());

        return back()->with('success', 'Numbering format berhasil diperbarui.');
    }

    // ─── Department Export / Import ───────────────────────────────────────────

    public function exportDepartments()
    {
        return Excel::download(
            new DepartmentsWorkbookExport,
            'data_departemen_'.date('Ymd').'.xlsx',
        );
    }

    public function importDepartments(ImportFileRequest $request)
    {
        try {
            Excel::import(new DepartmentsImport, $request->file('file'));

            return back()->with('success', 'Data departemen berhasil diimpor.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal mengimpor data: '.$e->getMessage()]);
        }
    }
}
