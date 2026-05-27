<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AccessModule;
use App\Models\ContractStatus;
use App\Models\ContractType;
use App\Models\Department;
use App\Models\Module;
use App\Models\ModuleGroup;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class MasterConfigController extends Controller
{
    // ─── Contract Types ───────────────────────────────────────────────────────

    public function contractTypes(Request $request): \Inertia\Response
    {
        $sortBy = $request->input('sort_by', 'name');
        $sortDir = $request->input('sort_dir', 'asc');

        // Whitelist columns to ensure query safety
        $allowedSortColumns = ['name', 'parent_id', 'f1_input_mechanism', 'f2_input_mechanism', 'description'];
        if (! in_array($sortBy, $allowedSortColumns)) {
            $sortBy = 'name';
        }
        if (! in_array($sortDir, ['asc', 'desc'])) {
            $sortDir = 'asc';
        }

        $query = ContractType::query()
            ->with('parent')
            ->when(
                $request->search,
                function ($q, $s) {
                    $s = strtolower($s);

                    return $q->where(\Illuminate\Support\Facades\DB::raw('LOWER(name)'), 'like', "%{$s}%")
                        ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(description)'), 'like', "%{$s}%");
                },
            );

        return Inertia::render('admin/index', [
            'currentView' => 'contract-types',
            'types' => $query->orderBy($sortBy, $sortDir)->paginate($request->input('per_page', 10))->withQueryString(),
            'formTemplates' => \App\Models\FormTemplate::where('is_active', true)->orderBy('name')->get(),
            'contractTemplates' => \App\Models\ContractTemplate::orderBy('name')->get(),
            'filters' => $request->only(['search', 'sort_by', 'sort_dir']),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Tipe Kontrak', 'href' => route('admin.contract-types'), 'icon' => 'FileText'],
            ],
        ]);
    }

    public function createContractType()
    {
        return Inertia::render('admin/contract-types/form', [
            'formTemplates' => \App\Models\FormTemplate::where('is_active', true)->orderBy('name')->get(),
            'contractTemplates' => \App\Models\ContractTemplate::orderBy('name')->get(),
            'parentTypes' => ContractType::orderBy('name')->get(),
        ]);
    }

    public function editContractType(ContractType $type)
    {
        return Inertia::render('admin/contract-types/form', [
            'contractType' => $type,
            'formTemplates' => \App\Models\FormTemplate::where('is_active', true)->orderBy('name')->get(),
            'contractTemplates' => \App\Models\ContractTemplate::orderBy('name')->get(),
            'parentTypes' => ContractType::where('id', '!=', $type->id)->orderBy('name')->get(),
        ]);
    }

    public function storeContractType(Request $request)
    {
        $data = $request->validate([
            'code' => 'required|string|max:100|unique:m_contract_types,code',
            'name' => 'required|string|max:255|unique:m_contract_types,name',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|uuid|exists:m_contract_types,id',
            'f1_input_mechanism' => 'required|string|in:manual,digital,folder',
            'f1_form_template_id' => 'nullable|uuid|exists:m_form_templates,id',
            'f1_contract_template_id' => 'nullable|uuid|exists:m_contract_templates,id',
            'f2_input_mechanism' => 'required|string|in:manual,digital,folder',
            'f2_form_template_id' => 'nullable|uuid|exists:m_form_templates,id',
            'f2_contract_template_id' => 'nullable|uuid|exists:m_contract_templates,id',
        ]);
        ContractType::create($data);

        return redirect()->route('admin.contract-types')->with('success', 'Tipe kontrak berhasil dibuat.');
    }

    public function updateContractType(Request $request, ContractType $type)
    {
        $data = $request->validate([
            'code' => 'required|string|max:100|unique:m_contract_types,code,' . $type->id,
            'name' => 'required|string|max:255|unique:m_contract_types,name,' . $type->id,
            'description' => 'nullable|string',
            'parent_id' => 'nullable|uuid|exists:m_contract_types,id|not_in:' . $type->id,
            'f1_input_mechanism' => 'required|string|in:manual,digital,folder',
            'f1_form_template_id' => 'nullable|uuid|exists:m_form_templates,id',
            'f1_contract_template_id' => 'nullable|uuid|exists:m_contract_templates,id',
            'f2_input_mechanism' => 'required|string|in:manual,digital,folder',
            'f2_form_template_id' => 'nullable|uuid|exists:m_form_templates,id',
            'f2_contract_template_id' => 'nullable|uuid|exists:m_contract_templates,id',
        ]);
        $type->update($data);

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

        return back()->with('success', count($ids) . ' tipe kontrak berhasil dihapus.');
    }

    // ─── Contract Statuses ────────────────────────────────────────────────────

    public function contractStatuses(Request $request)
    {
        $query = ContractStatus::query()
            ->when(
                $request->search,
                function ($q, $s) {
                    $s = strtolower($s);

                    return $q->where(\Illuminate\Support\Facades\DB::raw('LOWER(label)'), 'like', "%{$s}%")
                        ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(code)'), 'like', "%{$s}%");
                },
            );

        return Inertia::render('admin/index', [
            'currentView' => 'contract-statuses',
            'statuses' => $query->orderBy('label')->paginate($request->input('per_page', 10))->withQueryString(),
            'filters' => $request->only(['search']),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Master Status', 'href' => route('admin.contract-statuses'), 'icon' => 'Tags'],
            ],
        ]);
    }

    public function storeContractStatus(Request $request)
    {
        $data = $request->validate([
            'code' => 'required|string|max:50|unique:m_contract_statuses,code',
            'label' => 'required|string|max:255',
            'color' => 'required|string|max:20',
            'bg_color' => 'required|string|max:20',
            'icon' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'display_mode' => 'nullable|string|in:interactive,pdf',
            'allow_info_edit' => 'boolean',
            'allow_reference' => 'boolean',
        ]);
        ContractStatus::create($data);

        return back()->with('success', 'Status berhasil dibuat.');
    }

    public function updateContractStatus(Request $request, ContractStatus $status)
    {
        $data = $request->validate([
            'code' => 'required|string|max:50|unique:m_contract_statuses,code,' . $status->id,
            'label' => 'required|string|max:255',
            'color' => 'required|string|max:20',
            'bg_color' => 'required|string|max:20',
            'icon' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'display_mode' => 'nullable|string|in:interactive,pdf',
            'allow_info_edit' => 'boolean',
            'allow_reference' => 'boolean',
        ]);
        $status->update($data);

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

        return back()->with('success', count($ids) . ' status berhasil dihapus.');
    }

    // ─── Departments ──────────────────────────────────────────────────────────

    public function departments(Request $request)
    {
        $query = Department::query()
            ->when(
                $request->search,
                function ($q, $s) {
                    $s = strtolower($s);

                    return $q->where(\Illuminate\Support\Facades\DB::raw('LOWER(name)'), 'like', "%{$s}%")
                        ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(code)'), 'like', "%{$s}%");
                },
            )
            ->when($request->is_active, function ($q, $active) {
                $bools = collect((array) $active)->map(fn ($v) => filter_var($v, FILTER_VALIDATE_BOOLEAN))->toArray();
                $q->whereIn('is_active', $bools);
            });

        if ($request->wantsJson()) {
            return response()->json($query->orderBy('name')->paginate($request->input('per_page', 10)));
        }

        return Inertia::render('admin/index', [
            'currentView' => 'departments',
            'departments' => $query->orderBy('name')->paginate($request->input('per_page', 10))->withQueryString(),
            'filters' => $request->only(['search', 'is_active']),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Master Departemen', 'href' => route('admin.departments'), 'icon' => 'Building2'],
            ],
        ]);
    }

    public function storeDepartment(Request $request)
    {
        $data = $request->validate([
            'code' => 'required|string|max:50|unique:m_departments,code',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);
        $data['created_by'] = $data['updated_by'] = Auth::id();
        Department::create($data);

        return back()->with('success', 'Departemen berhasil dibuat.');
    }

    public function updateDepartment(Request $request, Department $department)
    {
        $data = $request->validate([
            'code' => 'required|string|max:50|unique:m_departments,code,' . $department->id,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);
        $data['updated_by'] = Auth::id();
        $department->update($data);

        return back()->with('success', 'Departemen berhasil diperbarui.');
    }

    public function destroyDepartment(Department $department)
    {
        $department->delete();

        return back()->with('success', 'Departemen berhasil dihapus.');
    }

    public function bulkDestroyDepartment(Request $request)
    {
        $ids = $request->input('ids', []);
        if (empty($ids)) {
            return back();
        }
        Department::whereIn('id', $ids)->delete();

        return back()->with('success', count($ids) . ' departemen berhasil dihapus.');
    }

    // ─── Navigation & Modules ─────────────────────────────────────────────────

    public function navigation()
    {
        $groups = ModuleGroup::with(['modules' => fn ($q) => $q->orderBy('name')])->orderBy('name')->get();

        return Inertia::render('admin/index', ['currentView' => 'navigation', 'groups' => $groups]);
    }

    public function moduleGroups(Request $request)
    {
        $query = ModuleGroup::query()->when($request->search, function ($q, $s) {
            $s = strtolower($s);

            return $q->where(\Illuminate\Support\Facades\DB::raw('LOWER(name)'), 'like', "%{$s}%");
        });

        return Inertia::render('admin/index', [
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

                return $q->where(\Illuminate\Support\Facades\DB::raw('LOWER(name)'), 'like', "%{$s}%")
                    ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(description)'), 'like', "%{$s}%");
            })
            ->when($request->module_group_id, fn ($q, $id) => $q->whereIn('module_group_id', (array) $id));

        return Inertia::render('admin/index', [
            'currentView' => 'modules',
            'modules' => $query->orderBy('name')->paginate($request->input('per_page', 10))->withQueryString(),
            'moduleGroups' => ModuleGroup::all(),
            'filters' => $request->only(['search', 'module_group_id']),
            'breadcrumbs' => [['title' => 'Administrasi', 'href' => '#'], ['title' => 'Modul Sistem', 'href' => route('admin.modules')]],
        ]);
    }

    public function reorderNavigation(Request $request)
    {
        $data = $request->validate([
            'role_id' => 'required|uuid|exists:m_roles,id',
            'groups' => 'required|array',
            'groups.*.id' => 'required|uuid|exists:m_module_groups,id',
            'groups.*.modules' => 'nullable|array',
            'groups.*.modules.*.id' => 'required|uuid|exists:m_modules,id',
        ]);

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

    public function storeModuleGroup(Request $request)
    {
        $data = $request->validate(['name' => 'required|string|max:255|unique:m_module_groups,name', 'icon' => 'nullable|string|max:50']);
        $data['created_by'] = $data['updated_by'] = Auth::id();
        ModuleGroup::create($data);

        return back()->with('success', 'Module group berhasil dibuat.');
    }

    public function updateModuleGroup(Request $request, ModuleGroup $group)
    {
        $data = $request->validate(['name' => 'required|string|max:255|unique:m_module_groups,name,' . $group->id, 'icon' => 'nullable|string|max:50']);
        $data['updated_by'] = Auth::id();
        $group->update($data);

        return back()->with('success', 'Module group berhasil diperbarui.');
    }

    public function destroyModuleGroup(ModuleGroup $group)
    {
        $group->delete();

        return back()->with('success', 'Module group berhasil dihapus.');
    }

    public function bulkDestroyModuleGroups(Request $request)
    {
        $ids = $request->input('ids', []);
        if (empty($ids)) {
            return back();
        }
        ModuleGroup::whereIn('id', $ids)->delete();

        return back()->with('success', count($ids) . ' grup modul berhasil dihapus.');
    }

    public function storeModule(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:m_modules,name',
            'identifier' => 'required|string|max:50|unique:m_modules,identifier',
            'module_group_id' => 'required|uuid|exists:m_module_groups,id',
            'route' => 'nullable|string|max:255',
            'icon' => 'nullable|string|max:50',
            'showed_as_menu' => 'boolean',
        ]);
        $data['created_by'] = $data['updated_by'] = Auth::id();
        Module::create($data);

        return back()->with('success', 'Module berhasil dibuat.');
    }

    public function updateModule(Request $request, Module $module)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:m_modules,name,' . $module->id,
            'identifier' => 'required|string|max:50|unique:m_modules,identifier,' . $module->id,
            'module_group_id' => 'required|uuid|exists:m_module_groups,id',
            'route' => 'nullable|string|max:255',
            'icon' => 'nullable|string|max:50',
            'showed_as_menu' => 'boolean',
        ]);
        $data['updated_by'] = Auth::id();
        $module->update($data);

        return back()->with('success', 'Module berhasil diperbarui.');
    }

    public function destroyModule(Module $module)
    {
        $module->delete();

        return back()->with('success', 'Module berhasil dihapus.');
    }

    public function bulkDestroyModules(Request $request)
    {
        $ids = $request->input('ids', []);
        if (empty($ids)) {
            return back();
        }
        Module::whereIn('id', $ids)->delete();

        return back()->with('success', count($ids) . ' modul berhasil dihapus.');
    }

    // ─── Numbering Formats ────────────────────────────────────────────────────

    public function numberingFormats()
    {
        return Inertia::render('admin/index', [
            'currentView' => 'numbering-formats',
            'formats' => \App\Models\NumberingFormat::all(),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Pengaturan Penomoran', 'href' => route('admin.numbering-formats'), 'icon' => 'Hash'],
            ],
        ]);
    }

    public function updateNumberingFormat(Request $request, \App\Models\NumberingFormat $format)
    {
        $data = $request->validate([
            'format_pattern' => 'required|string',
            'current_number' => 'required|integer',
            'padding' => 'required|integer|min:1|max:10',
            'is_active' => 'boolean',
        ]);
        $format->update($data);

        return back()->with('success', 'Numbering format berhasil diperbarui.');
    }

    // ─── Department Export / Import ───────────────────────────────────────────

    public function exportDepartments()
    {
        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\DepartmentsWorkbookExport(),
            'data_departemen_' . date('Ymd') . '.xlsx',
        );
    }

    public function importDepartments(Request $request)
    {
        $request->validate(['file' => 'required|file|mimes:xlsx,xls']);

        try {
            \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\DepartmentsImport(), $request->file('file'));

            return back()->with('success', 'Data departemen berhasil diimpor.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal mengimpor data: ' . $e->getMessage()]);
        }
    }
}
