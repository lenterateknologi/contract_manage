<?php

namespace App\Http\Controllers;

use App\Models\AccessModule;
use App\Models\ContractStatus;
use App\Models\Department;
use App\Models\ContractType;
use App\Models\Module;
use App\Models\ModuleGroup;
use App\Models\Role;
use App\Models\RoleModuleGroup;
use App\Models\User;
use App\Models\Vendor;
use App\Models\Workflow;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function users(Request $request)
    {
        $query = User::with('department')
            ->when($request->search, function ($q, $search) {
                $q->where(function($qq) use ($search) {
                    $qq->where('name', 'ilike', "%{$search}%")
                       ->orWhere('email', 'ilike', "%{$search}%")
                       ->orWhere('username', 'ilike', "%{$search}%");
                });
            })
            ->when($request->role, function ($q, $role) {
                $q->whereIn('role', (array)$role);
            })
            ->when($request->department_id, function ($q, $deptId) {
                $q->whereIn('department_id', (array)$deptId);
            });

        return Inertia::render('admin/index', [
            'currentView' => 'users',
            'users' => $query->orderBy('name')->paginate($request->input('per_page', 10))->withQueryString(),
            'roles' => Role::orderBy('name')->get(),
            'departments' => Department::orderBy('name')->get(),
            'filters' => $request->only(['search', 'role', 'department_id']),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Manajemen User', 'href' => route('admin.users'), 'description' => 'Kelola akses dan profil pengguna sistem.', 'icon' => 'Users'],
            ],
        ]);
    }

    public function roles(Request $request)
    {
        $query = Role::query()
            ->when($request->search, function ($q, $search) {
                $q->where(function($qq) use ($search) {
                    $qq->where('name', 'ilike', "%{$search}%")
                       ->orWhere('description', 'ilike', "%{$search}%");
                });
            })
            ->when($request->created_from, function ($q, $from) {
                $q->whereDate('created_at', '>=', $from);
            })
            ->when($request->created_to, function ($q, $to) {
                $q->whereDate('created_at', '<=', $to);
            });

        return Inertia::render('admin/index', [
            'currentView' => 'roles',
            'roles' => $query->orderBy('name')->paginate($request->input('per_page', 10))->withQueryString(),
            'filters' => $request->only(['search', 'created_from', 'created_to']),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Manajemen Role', 'href' => route('admin.roles'), 'description' => 'Pengaturan peran dan otorisasi.', 'icon' => 'ShieldCheck'],
            ],
        ]);
    }

    public function storeRole(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:m_roles,name',
            'description' => 'nullable|string',
        ]);

        Role::create($data);

        return back()->with('success', 'Role berhasil dibuat.');
    }

    public function updateRole(Request $request, Role $role)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:m_roles,name,'.$role->id,
            'description' => 'nullable|string',
        ]);

        $role->update($data);

        return back()->with('success', 'Role berhasil diperbarui.');
    }

    public function destroyRole(Role $role)
    {
        // Prevent deleting core roles if needed, but for now just delete
        $role->delete();

        return back()->with('success', 'Role berhasil dihapus.');
    }

    public function bulkDestroyRole(Request $request)
    {
        $ids = $request->input('ids', []);
        if (empty($ids)) return back();

        Role::whereIn('id', $ids)->delete();
        return back()->with('success', count($ids) . ' role berhasil dihapus.');
    }

    public function roleConfig(Role $role, Request $request)
    {
        // 1. Get Modules with Access for the Matrix Tab
        $modules = Module::with(['moduleGroup', 'accessModules' => function ($query) use ($role) {
            $query->where('role_id', $role->id);
        }])->orderBy('module_group_id')->orderBy('id')->get();

        $modules->transform(function ($module) {
            $module->access = $module->accessModules->first();
            unset($module->accessModules);
            return $module;
        });

        // 2. Get Navigation Structure for the Drag & Drop Tab
        $groups = ModuleGroup::orderBy('name')->get()->map(function ($group) use ($role) {
            $group->modules = Module::whereHas('accessModules', function ($q) use ($role, $group) {
                $q->where('role_id', $role->id)
                    ->where('module_group_id', $group->id)
                    ->where('can_read', true);
            })->orderBy('name')->get();

            return $group;
        })->values();

        $allModules = Module::orderBy('name')->get();

        return Inertia::render('admin/role-config', [
            'role' => $role,
            'modules' => $modules,
            'navigation' => $groups,
            'allModules' => $allModules,
            'defaultTab' => $request->query('tab', 'access'),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Manajemen Role', 'href' => route('admin.roles'), 'icon' => 'ShieldCheck'],
                ['title' => 'Konfigurasi Role', 'href' => '#', 'description' => "Pengaturan menyeluruh untuk role {$role->name}.", 'icon' => 'Settings2'],
            ],
        ]);
    }

    public function updateRoleAccess(Request $request, Role $role)
    {
        $data = $request->validate([
            'accesses' => 'required|array',
            'accesses.*.module_id' => 'required|uuid|exists:m_modules,id',
            'accesses.*.can_read' => 'boolean',
            'accesses.*.can_create' => 'boolean',
            'accesses.*.can_update' => 'boolean',
            'accesses.*.can_delete' => 'boolean',
            'accesses.*.can_approve' => 'boolean',
            'accesses.*.can_bulk_approve' => 'boolean',
            'accesses.*.can_bulk_delete' => 'boolean',
        ]);

        foreach ($data['accesses'] as $accessData) {
            // Logic: If any permission is true, can_read MUST be true
            $canRead = $accessData['can_read'] || 
                       $accessData['can_create'] || 
                       $accessData['can_update'] || 
                       $accessData['can_delete'] || 
                       ($accessData['can_approve'] ?? false) || 
                       ($accessData['can_bulk_approve'] ?? false) || 
                       ($accessData['can_bulk_delete'] ?? false);

            $existingAccess = \App\Models\AccessModule::where('role_id', $role->id)
                ->where('module_id', $accessData['module_id'])
                ->first();

            // Auto-assign module_group_id if it's new read access and group is empty
            $targetGroupId = $existingAccess?->module_group_id;
            if ($canRead && !$targetGroupId) {
                $module = \App\Models\Module::find($accessData['module_id']);
                $targetGroupId = $module?->module_group_id;
            }

            \App\Models\AccessModule::updateOrCreate(
                [
                    'role_id' => $role->id,
                    'module_id' => $accessData['module_id'],
                ],
                [
                    'can_read' => $canRead,
                    'can_create' => $accessData['can_create'],
                    'can_update' => $accessData['can_update'],
                    'can_delete' => $accessData['can_delete'],
                    'can_approve' => $accessData['can_approve'] ?? false,
                    'can_bulk_approve' => $accessData['can_bulk_approve'] ?? false,
                    'can_bulk_delete' => $accessData['can_bulk_delete'] ?? false,
                    'module_group_id' => $targetGroupId,
                ]
            );
        }

        return back()->with('success', 'Role access berhasil diperbarui.');
    }

    public function reorderRoleNavigation(Request $request, Role $role)
    {
        $data = $request->validate([
            'role_id' => 'required|uuid|exists:m_roles,id',
            'groups' => 'required|array',
            'groups.*.id' => 'required|uuid|exists:m_module_groups,id',
            'groups.*.modules' => 'nullable|array',
            'groups.*.modules.*.id' => 'required|uuid|exists:m_modules,id',
        ]);

        $roleId = $data['role_id'];
        $activeModuleIds = [];

        foreach ($data['groups'] as $groupData) {
            // Ensure group exists for this role
            RoleModuleGroup::updateOrCreate(
                [
                    'role_id' => $roleId,
                    'module_group_id' => $groupData['id'],
                ],
                []
            );

            if (! empty($groupData['modules'])) {
                foreach ($groupData['modules'] as $moduleData) {
                    $activeModuleIds[] = $moduleData['id'];

                    AccessModule::where('role_id', $roleId)
                        ->where('module_id', $moduleData['id'])
                        ->update([
                            'can_read' => true,
                            'module_group_id' => $groupData['id'],
                        ]);
                }
            }
        }

        // Deactivate (remove from nav) any modules that are no longer in any group
        AccessModule::where('role_id', $roleId)
            ->whereNotIn('module_id', $activeModuleIds)
            ->update([
                'can_read' => false,
                'module_group_id' => null,
            ]);

        return back();
    }

    public function storeUser(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:m_users,email',
            'username' => 'required|string|max:20|unique:m_users,username',
            'password' => 'required|string|min:8',
            'role' => 'required|string',
            'position' => 'nullable|string',
            'phone' => 'nullable|string',
            'department_id' => 'nullable|uuid|exists:m_departments,id',
            'is_active' => 'boolean',
        ]);

        $data['password'] = bcrypt($data['password']);
        $data['initials'] = collect(explode(' ', $data['name']))->map(fn ($n) => strtoupper(substr($n, 0, 1)))->take(2)->join('');

        User::create($data);

        return back()->with('success', 'User berhasil dibuat.');
    }

    /**
     * Update user details.
     * @param Request $request
     * @param User $user
     * @return \Illuminate\Http\RedirectResponse
     */
    public function updateUser(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:m_users,email,'.$user->id,
            'username' => 'required|string|max:20|unique:m_users,username,'.$user->id,
            'role' => 'required|string',
            'position' => 'nullable|string',
            'phone' => 'nullable|string',
            'department_id' => 'nullable|uuid|exists:m_departments,id',
            'is_active' => 'boolean',
            'password' => 'nullable|string|min:8',
        ]);

        if (empty($data['password'])) {
            unset($data['password']);
        } else {
            $data['password'] = bcrypt($data['password']);
        }

        $user->update($data);

        return back()->with('success', 'User berhasil diperbarui.');
    }

    public function destroyUser(User $user)
    {
        if ($user->id === Auth::id()) {
            abort(403, 'Tidak dapat menghapus diri sendiri.');
        }
        $user->delete();

        return back()->with('success', 'User berhasil dihapus.');
    }

    public function bulkDestroyUser(Request $request)
    {
        $ids = $request->input('ids', []);
        if (empty($ids)) return back();

        // Prevent deleting yourself
        if (in_array(Auth::id(), $ids)) {
            return back()->with('error', 'Tidak dapat menghapus diri sendiri.in bulk operation.');
        }

        User::whereIn('id', $ids)->delete();
        return back()->with('success', count($ids) . ' pengguna berhasil dihapus.');
    }

    public function contractTypes(Request $request)
    {
        $query = ContractType::query()
            ->when($request->search, function ($q, $search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('description', 'ilike', "%{$search}%");
            });

        return Inertia::render('admin/index', [
            'currentView' => 'contract-types',
            'types' => $query->orderBy('name')->paginate($request->input('per_page', 10))->withQueryString(),
            'formTemplates' => \App\Models\FormTemplate::where('is_active', true)->orderBy('name')->get(),
            'contractTemplates' => \App\Models\ContractTemplate::orderBy('name')->get(),
            'filters' => $request->only(['search']),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Tipe Kontrak', 'href' => route('admin.contract-types'), 'description' => 'Definisi kategori dan template dokumen.', 'icon' => 'FileText'],
            ],
        ]);
    }

    public function createContractType()
    {
        return Inertia::render('admin/contract-types/form', [
            'formTemplates' => \App\Models\FormTemplate::where('is_active', true)->orderBy('name')->get(),
            'contractTemplates' => \App\Models\ContractTemplate::orderBy('name')->get(),
        ]);
    }

    public function editContractType(ContractType $type)
    {
        return Inertia::render('admin/contract-types/form', [
            'contractType' => $type,
            'formTemplates' => \App\Models\FormTemplate::where('is_active', true)->orderBy('name')->get(),
            'contractTemplates' => \App\Models\ContractTemplate::orderBy('name')->get(),
        ]);
    }

    public function storeContractType(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:m_contract_types,name',
            'description' => 'nullable|string',
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
            'name' => 'required|string|max:255|unique:m_contract_types,name,'.$type->id,
            'description' => 'nullable|string',
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

    public function contractStatuses(Request $request)
    {
        $query = ContractStatus::query()
            ->when($request->search, function ($q, $search) {
                $q->where('label', 'ilike', "%{$search}%")
                  ->orWhere('code', 'ilike', "%{$search}%")
                  ->orWhere('description', 'ilike', "%{$search}%");
            });

        return Inertia::render('admin/index', [
            'currentView' => 'contract-statuses',
            'statuses' => $query->orderBy('label')->paginate($request->input('per_page', 10))->withQueryString(),
            'filters' => $request->only(['search']),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Master Status', 'href' => route('admin.contract-statuses'), 'description' => 'Pengaturan status kontrak dan visualisasi.', 'icon' => 'Tags'],
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
            'code' => 'required|string|max:50|unique:m_contract_statuses,code,'.$status->id,
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

    public function departments(Request $request)
    {
        $query = Department::query()
            ->when($request->search, function ($q, $search) {
                $q->where(function($qq) use ($search) {
                    $qq->where('name', 'ilike', "%{$search}%")
                       ->orWhere('code', 'ilike', "%{$search}%")
                       ->orWhere('description', 'ilike', "%{$search}%");
                });
            })
            ->when($request->is_active, function ($q, $active) {
                $bools = collect((array)$active)->map(fn($v) => filter_var($v, FILTER_VALIDATE_BOOLEAN))->toArray();
                $q->whereIn('is_active', $bools);
            });

        return Inertia::render('admin/index', [
            'currentView' => 'departments',
            'departments' => $query->orderBy('name')->paginate($request->input('per_page', 10))->withQueryString(),
            'filters' => $request->only(['search', 'is_active']),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Master Departemen', 'href' => route('admin.departments'), 'description' => 'Kelola divisi dan struktur organisasi.', 'icon' => 'Building2'],
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

        $data['created_by'] = Auth::id();
        $data['updated_by'] = Auth::id();

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
        if (empty($ids)) return back();

        Department::whereIn('id', $ids)->delete();
        return back()->with('success', count($ids) . ' departemen berhasil dihapus.');
    }

    public function vendors(Request $request)
    {
        $query = Vendor::query()
            ->when($request->search, function ($q, $search) {
                $q->where(function($qq) use ($search) {
                    $qq->where('name', 'ilike', "%{$search}%")
                       ->orWhere('code', 'ilike', "%{$search}%")
                       ->orWhere('category', 'ilike', "%{$search}%")
                       ->orWhere('email', 'ilike', "%{$search}%");
                });
            })
            ->when($request->category, function ($q, $category) {
                $q->whereIn('category', (array)$category);
            })
            ->when($request->is_active, function ($q, $active) {
                $bools = collect((array)$active)->map(fn($v) => filter_var($v, FILTER_VALIDATE_BOOLEAN))->toArray();
                $q->whereIn('is_active', $bools);
            });

        return Inertia::render('admin/index', [
            'currentView' => 'vendors',
            'vendors' => $query->orderBy('name')->paginate($request->input('per_page', 10))->withQueryString(),
            'filters' => $request->only(['search', 'category', 'is_active']),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Master Vendor', 'href' => route('admin.vendors'), 'description' => 'Kelola database pihak ketiga dan mitra.', 'icon' => 'Truck'],
            ],
        ]);
    }

    public function createVendor()
    {
        return Inertia::render('admin/vendors/form', [
            'vendor' => null,
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Master Vendor', 'href' => route('admin.vendors'), 'icon' => 'Truck'],
                ['title' => 'Tambah Vendor', 'href' => '#', 'description' => 'Registrasi rekanan baru.'],
            ],
        ]);
    }

    public function editVendor(Vendor $vendor)
    {
        $vendor->load('documents');
        return Inertia::render('admin/vendors/form', [
            'vendor' => $vendor,
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Master Vendor', 'href' => route('admin.vendors'), 'icon' => 'Truck'],
                ['title' => 'Kelola Vendor', 'href' => '#', 'description' => 'Update profil & kelola dokumen legal.'],
            ],
        ]);
    }

    public function storeVendor(Request $request)
    {
        $data = $request->validate([
            'code' => 'required|string|max:50|unique:m_vendors,code',
            'name' => 'required|string|max:255',
            'category' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'is_active' => 'boolean',
            'company_type' => 'nullable|string|max:100',
            'is_individual' => 'boolean',
            'website' => 'nullable|string|max:255',
            'pic_name' => 'nullable|string|max:255',
            'pic_position' => 'nullable|string|max:255',
            'npwp' => 'nullable|string|max:50',
            'nib' => 'nullable|string|max:50',
            'siup' => 'nullable|string|max:50',
            'director_name' => 'nullable|string|max:255',
            'bank_name' => 'nullable|string|max:255',
            'bank_account_no' => 'nullable|string|max:100',
            'bank_account_name' => 'nullable|string|max:255',
        ]);

        $data['created_by'] = Auth::id();
        $data['updated_by'] = Auth::id();

        $vendor = Vendor::create($data);

        return redirect()->route('admin.vendors.edit', $vendor->id)->with('success', 'Vendor berhasil dibuat. Anda sekarang dapat melampirkan dokumen.');
    }

    public function updateVendor(Request $request, Vendor $vendor)
    {
        $data = $request->validate([
            'code' => 'required|string|max:50|unique:m_vendors,code,' . $vendor->id,
            'name' => 'required|string|max:255',
            'category' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'is_active' => 'boolean',
            'company_type' => 'nullable|string|max:100',
            'is_individual' => 'boolean',
            'website' => 'nullable|string|max:255',
            'pic_name' => 'nullable|string|max:255',
            'pic_position' => 'nullable|string|max:255',
            'npwp' => 'nullable|string|max:50',
            'nib' => 'nullable|string|max:50',
            'siup' => 'nullable|string|max:50',
            'director_name' => 'nullable|string|max:255',
            'bank_name' => 'nullable|string|max:255',
            'bank_account_no' => 'nullable|string|max:100',
            'bank_account_name' => 'nullable|string|max:255',
        ]);

        $data['updated_by'] = Auth::id();

        $vendor->update($data);

        return back()->with('success', 'Vendor berhasil diperbarui.');
    }

    public function uploadVendorDocument(Request $request, Vendor $vendor)
    {
        $request->validate([
            'document_file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'document_type' => 'required|string',
            'expires_at' => 'nullable|date',
        ]);

        $file = $request->file('document_file');
        $originalName = $file->getClientOriginalName();
        $path = $file->storeAs("vendor_documents/{$vendor->id}", time() . "_{$originalName}", 'public');

        $vendor->documents()->create([
            'document_name' => $originalName,
            'document_type' => $request->document_type,
            'file_url' => '/storage/' . $path,
            'expires_at' => $request->filled('expires_at') && $request->expires_at !== '' ? $request->expires_at : null,
            'is_verified' => true,
        ]);

        return back()->with('success', 'Dokumen berhasil diunggah.');
    }

    public function destroyVendorDocument(Vendor $vendor, \App\Models\VendorDocument $document)
    {
        if ($document->vendor_id !== $vendor->id) {
            abort(403);
        }

        $document->delete();
        return back()->with('success', 'Dokumen berhasil dihapus.');
    }

    public function destroyVendor(Vendor $vendor)
    {
        $vendor->delete();

        return back()->with('success', 'Vendor berhasil dihapus.');
    }

    public function bulkDestroyStatuses(Request $request)
    {
        $ids = $request->input('ids', []);
        if (empty($ids)) return back();

        ContractStatus::whereIn('id', $ids)->delete();
        return back()->with('success', count($ids) . ' status berhasil dihapus.');
    }

    public function bulkDestroyContractTypes(Request $request)
    {
        $ids = $request->input('ids', []);
        if (empty($ids)) return back();

        ContractType::whereIn('id', $ids)->delete();
        return back()->with('success', count($ids) . ' tipe kontrak berhasil dihapus.');
    }

    public function bulkDestroyModules(Request $request)
    {
        $ids = $request->input('ids', []);
        if (empty($ids)) return back();

        Module::whereIn('id', $ids)->delete();
        return back()->with('success', count($ids) . ' modul berhasil dihapus.');
    }

    public function bulkDestroyModuleGroups(Request $request)
    {
        $ids = $request->input('ids', []);
        if (empty($ids)) return back();

        ModuleGroup::whereIn('id', $ids)->delete();
        return back()->with('success', count($ids) . ' grup modul berhasil dihapus.');
    }

    public function bulkDestroyWorkflows(Request $request)
    {
        $ids = $request->input('ids', []);
        if (empty($ids)) return back();

        Workflow::whereIn('id', $ids)->delete();
        return back()->with('success', count($ids) . ' alur kerja berhasil dihapus.');
    }

    public function bulkDestroyVendor(Request $request)
    {
        $ids = $request->input('ids', []);
        if (empty($ids)) return back();

        Vendor::whereIn('id', $ids)->delete();
        return back()->with('success', count($ids) . ' vendor berhasil dihapus.');
    }

    public function workflows(Request $request)
    {
        $query = Workflow::with(['steps.approverRoles', 'steps.approverDepartments', 'steps.approverUsers', 'initiatorRolesData', 'initiatorDepartmentsData', 'initiatorUsersData'])
            ->when($request->search, function ($q, $search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('description', 'ilike', "%{$search}%");
            })
            ->when($request->contract_type, function ($q, $type) {
                $q->whereIn('contract_type', (array)$type);
            });

        return Inertia::render('admin/index', [
            'currentView' => 'workflows',
            'workflows' => $query->orderBy('name')->paginate($request->input('per_page', 10))->withQueryString(),
            'contractTypes' => ContractType::all(),
            'departments' => Department::all(),
            'roles' => Role::all(),
            'users' => User::all(),
            'contractStatuses' => ContractStatus::orderBy('label')->get(),
            'filters' => $request->only(['search', 'contract_type']),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Alur Kerja (Workflows)', 'href' => route('admin.workflows'), 'description' => 'Konfigurasi tahapan persetujuan.', 'icon' => 'GitBranch'],
            ],
        ]);
    }

    public function createWorkflow()
    {
        return Inertia::render('admin/workflows/form', [
            'workflow' => null,
            'contractTypes' => ContractType::all(),
            'departments' => Department::all(),
            'roles' => Role::all(),
            'users' => User::all(),
            'contractStatuses' => ContractStatus::orderBy('label')->get(),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Alur Kerja (Workflows)', 'href' => route('admin.workflows'), 'icon' => 'GitBranch'],
                ['title' => 'Registrasi Alur Baru', 'href' => '#', 'description' => 'Mendefinisikan alur approval baru.'],
            ],
        ]);
    }

    public function editWorkflow(Workflow $workflow)
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
            'contractStatuses' => ContractStatus::orderBy('label')->get(),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Alur Kerja (Workflows)', 'href' => route('admin.workflows'), 'icon' => 'GitBranch'],
                ['title' => 'Parameter Alur Kerja', 'href' => '#', 'description' => "Konfigurasi tahapan untuk {$workflow->name}."],
            ],
        ]);
    }

    public function storeWorkflow(Request $request)
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
            'initiator_roles' => 'nullable|array',
            'initiator_users' => 'nullable|array',
            'initiator_departments' => 'nullable|array',
            'steps' => 'nullable|array',
            'steps.*.role' => 'nullable',
            'steps.*.description' => 'nullable|string',
            'steps.*.approver_type' => 'nullable|string',
            'steps.*.step_type' => 'nullable|string',
            'steps.*.condition_expression' => 'nullable|string',
            'steps.*.phase' => 'nullable|string',
            'steps.*.uploader_type' => 'nullable|string',
            'steps.*.reject_target' => 'nullable|string',
            'steps.*.hierarchy_level' => 'nullable|integer',
            'steps.*.role_id' => 'nullable|string',
            'steps.*.user_ids' => 'nullable|array',
            'steps.*.department_ids' => 'nullable|array',
            'steps.*.status_id' => 'nullable|string',
        ]);

        try {
            return DB::transaction(function() use ($data) {
                $workflowData = collect($data)->except(['initiator_roles', 'initiator_users', 'initiator_departments', 'steps'])->toArray();
                $workflow = Workflow::create($workflowData);

                // Sync Initiators
                if (!empty($data['initiator_roles'])) {
                    foreach ($data['initiator_roles'] as $role) {
                        $workflow->initiatorRolesData()->create(['role_name' => $role]);
                    }
                }
                if (!empty($data['initiator_departments'])) {
                    foreach ($data['initiator_departments'] as $deptId) {
                        $workflow->initiatorDepartmentsData()->create(['department_id' => $deptId]);
                    }
                }
                if (!empty($data['initiator_users'])) {
                    foreach ($data['initiator_users'] as $userId) {
                        $workflow->initiatorUsersData()->create(['user_id' => $userId]);
                    }
                }

                if (! empty($data['steps'])) {
                    foreach ($data['steps'] as $index => $stepData) {
                        $step = $workflow->steps()->create([
                            'approver_type' => $stepData['approver_type'] ?? 'role',
                            'description' => $stepData['description'] ?? '',
                            'status_id' => $stepData['status_id'] ?? null,
                            'step' => $index + 1,
                            'created_by' => Auth::id(),
                            'updated_by' => Auth::id(),
                            'is_active' => true,
                            'step_type' => $stepData['step_type'] ?? 'approval',
                            'condition_expression' => $stepData['condition_expression'] ?? null,
                            'phase' => $stepData['phase'] ?? 'f1_request',
                            'uploader_type' => $stepData['uploader_type'] ?? null,
                            'reject_target' => $stepData['reject_target'] ?? 'initiator',
                            'hierarchy_level' => isset($stepData['hierarchy_level']) ? (int)$stepData['hierarchy_level'] : null,
                            'role_id' => $stepData['role_id'] ?? null,
                        ]);

                        if (!empty($stepData['role'])) {
                            foreach ((array)$stepData['role'] as $role) {
                                $step->approverRoles()->create(['role_name' => $role]);
                            }
                        }
                        if (!empty($stepData['department_ids'])) {
                            foreach ((array)$stepData['department_ids'] as $deptId) {
                                $step->approverDepartments()->create(['department_id' => $deptId]);
                            }
                        }
                        if (!empty($stepData['user_ids'])) {
                            foreach ((array)$stepData['user_ids'] as $userId) {
                                $step->approverUsers()->create(['user_id' => $userId]);
                            }
                        }
                    }
                }

                return redirect()->route('admin.workflows')->with('success', 'Workflow berhasil dibuat.');
            });
        } catch (\Exception $e) {
            Log::error('Workflow Store Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return back()->withErrors(['error' => 'Gagal menyimpan alur kerja: ' . $e->getMessage()]);
        }
    }

    public function updateWorkflow(Request $request, Workflow $workflow)
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
            'initiator_roles' => 'nullable|array',
            'initiator_users' => 'nullable|array',
            'initiator_departments' => 'nullable|array',
            'steps' => 'nullable|array',
            'steps.*.role' => 'nullable',
            'steps.*.description' => 'nullable|string',
            'steps.*.approver_type' => 'nullable|string',
            'steps.*.step_type' => 'nullable|string',
            'steps.*.condition_expression' => 'nullable|string',
            'steps.*.phase' => 'nullable|string',
            'steps.*.uploader_type' => 'nullable|string',
            'steps.*.reject_target' => 'nullable|string',
            'steps.*.hierarchy_level' => 'nullable|integer',
            'steps.*.role_id' => 'nullable|string',
            'steps.*.user_ids' => 'nullable|array',
            'steps.*.department_ids' => 'nullable|array',
            'steps.*.status_id' => 'nullable|string',
        ]);

        try {
            return DB::transaction(function() use ($data, $workflow) {
                // Update basic info
                $workflowData = collect($data)->except(['initiator_roles', 'initiator_users', 'initiator_departments', 'steps'])->toArray();
                $workflow->update($workflowData);

                // Sync Initiators (Role, Dept, User)
                $workflow->initiatorRolesData()->delete();
                if (!empty($data['initiator_roles'])) {
                    foreach ((array)$data['initiator_roles'] as $role) {
                        $workflow->initiatorRolesData()->create(['role_name' => $role]);
                    }
                }

                $workflow->initiatorDepartmentsData()->delete();
                if (!empty($data['initiator_departments'])) {
                    foreach ((array)$data['initiator_departments'] as $deptId) {
                        $workflow->initiatorDepartmentsData()->create(['department_id' => $deptId]);
                    }
                }

                $workflow->initiatorUsersData()->delete();
                if (!empty($data['initiator_users'])) {
                    foreach ((array)$data['initiator_users'] as $userId) {
                        $workflow->initiatorUsersData()->create(['user_id' => $userId]);
                    }
                }

                // Sync Workflow Steps
                foreach ($workflow->steps as $oldStep) {
                    $oldStep->approverRoles()->delete();
                    $oldStep->approverDepartments()->delete();
                    $oldStep->approverUsers()->delete();
                }
                $workflow->steps()->forceDelete();

                if (! empty($data['steps'])) {
                    foreach ($data['steps'] as $index => $stepData) {
                        $step = $workflow->steps()->create([
                            'approver_type' => $stepData['approver_type'] ?? 'role',
                            'description' => $stepData['description'] ?? '',
                            'status_id' => $stepData['status_id'] ?? null,
                            'step' => $index + 1,
                            'created_by' => Auth::id(),
                            'updated_by' => Auth::id(),
                            'is_active' => true,
                            'step_type' => $stepData['step_type'] ?? 'approval',
                            'condition_expression' => $stepData['condition_expression'] ?? null,
                            'phase' => $stepData['phase'] ?? 'f1_request',
                            'uploader_type' => $stepData['uploader_type'] ?? null,
                            'reject_target' => $stepData['reject_target'] ?? 'initiator',
                            'hierarchy_level' => isset($stepData['hierarchy_level']) ? (int)$stepData['hierarchy_level'] : null,
                            'role_id' => $stepData['role_id'] ?? null,
                        ]);

                        if (!empty($stepData['role'])) {
                            foreach ((array)$stepData['role'] as $role) {
                                $step->approverRoles()->create(['role_name' => $role]);
                            }
                        }

                        if (!empty($stepData['department_ids'])) {
                            foreach ((array)$stepData['department_ids'] as $deptId) {
                                $step->approverDepartments()->create(['department_id' => $deptId]);
                            }
                        }

                        if (!empty($stepData['user_ids'])) {
                            foreach ((array)$stepData['user_ids'] as $userId) {
                                $step->approverUsers()->create(['user_id' => $userId]);
                            }
                        }
                    }
                }

                return redirect()->route('admin.workflows')->with('success', 'Workflow berhasil diperbarui.');
            });
        } catch (\Exception $e) {
            Log::error('Workflow Update Error: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Gagal memperbarui alur kerja: ' . $e->getMessage()]);
        }
    }

    public function destroyWorkflow(Workflow $workflow)
    {
        $workflow->delete();

        return redirect()->back();
    }

    public function workflowSteps(Workflow $workflow)
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

    public function updateWorkflowSteps(Request $request, Workflow $workflow)
    {
        // This method is a specialized version of updateWorkflow's step syncing logic
        $data = $request->validate([
            'steps' => 'nullable|array',
            'steps.*.role' => 'nullable',
            'steps.*.description' => 'nullable|string',
            'steps.*.approver_type' => 'nullable|string|in:role,user',
            'steps.*.user_ids' => 'nullable|array',
            'steps.*.department_ids' => 'nullable|array',
            'steps.*.status_id' => 'nullable|string',
        ]);

        return DB::transaction(function() use ($data, $workflow) {
            // Cleanup existing steps
            foreach ($workflow->steps as $oldStep) {
                $oldStep->approverRoles()->delete();
                $oldStep->approverDepartments()->delete();
                $oldStep->approverUsers()->delete();
            }
            $workflow->steps()->forceDelete();

            if (! empty($data['steps'])) {
                foreach ($data['steps'] as $index => $stepData) {
                    $step = $workflow->steps()->create([
                        'approver_type' => $stepData['approver_type'] ?? 'role',
                        'description' => $stepData['description'] ?? '',
                        'status_id' => $stepData['status_id'] ?? null,
                        'step' => $index + 1,
                        'created_by' => Auth::id(),
                        'updated_by' => Auth::id(),
                        'is_active' => true,
                    ]);

                    if (!empty($stepData['role'])) {
                        foreach ((array)$stepData['role'] as $role) {
                            $step->approverRoles()->create(['role_name' => $role]);
                        }
                    }

                    if (!empty($stepData['department_ids'])) {
                        foreach ((array)$stepData['department_ids'] as $deptId) {
                            $step->approverDepartments()->create(['department_id' => $deptId]);
                        }
                    }

                    if (!empty($stepData['user_ids'])) {
                        foreach ((array)$stepData['user_ids'] as $userId) {
                            $step->approverUsers()->create(['user_id' => $userId]);
                        }
                    }
                }
            }

            return redirect()->route('admin.workflows')->with('success', 'Steps berhasil diperbarui.');
        });
    }

    // Navigation Management (Combined)
    public function navigation()
    {
        $groups = ModuleGroup::with(['modules' => function ($query) {
            $query->orderBy('name');
        }])
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/index', [
            'currentView' => 'navigation',
            'groups' => $groups,
        ]);
    }

    public function moduleGroups(Request $request)
    {
        $query = ModuleGroup::query()
            ->when($request->search, function ($q, $search) {
                $q->where('name', 'ilike', "%{$search}%");
            });

        return Inertia::render('admin/index', [
            'currentView' => 'module-groups',
            'moduleGroups' => $query->orderBy('name')->paginate($request->input('per_page', 10))->withQueryString(),
            'filters' => $request->only(['search']),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#'],
                ['title' => 'Grup Modul', 'href' => route('admin.module-groups'), 'description' => 'Kelola pengelompokan menu navigasi.'],
            ],
        ]);
    }

    public function modules(Request $request)
    {
        $query = Module::with('moduleGroup')
            ->when($request->search, function ($q, $search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('description', 'ilike', "%{$search}%");
            })
            ->when($request->module_group_id, function ($q, $groupId) {
                $q->whereIn('module_group_id', (array)$groupId);
            });

        return Inertia::render('admin/index', [
            'currentView' => 'modules',
            'modules' => $query->orderBy('name')->paginate($request->input('per_page', 10))->withQueryString(),
            'moduleGroups' => ModuleGroup::all(),
            'filters' => $request->only(['search', 'module_group_id']),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#'],
                ['title' => 'Modul Sistem', 'href' => route('admin.modules'), 'description' => 'Kelola modul dan fitur aplikasi.'],
            ],
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

        $roleId = $data['role_id'];

        foreach ($data['groups'] as $groupData) {
            if (! empty($groupData['modules'])) {
                foreach ($groupData['modules'] as $moduleData) {
                    Module::where('id', $moduleData['id'])->update([
                        'module_group_id' => $groupData['id'],
                    ]);

                    // Automatically grant can_read permission when module is in navigation
                    AccessModule::updateOrCreate(
                        ['role_id' => $roleId, 'module_id' => $moduleData['id']],
                        [
                            'can_read' => true,
                            'created_by' => Auth::id(), 
                        ]
                    );
                }
            }
        }

        return back()->with('success', 'Navigation and permissions berhasil diperbarui.');
    }

    // Module Groups

    public function storeModuleGroup(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:m_module_groups,name',
            'icon' => 'nullable|string|max:50',
        ]);

        $data['created_by'] = Auth::id();
        $data['updated_by'] = Auth::id();

        ModuleGroup::create($data);

        return back()->with('success', 'Module group berhasil dibuat.');
    }

    public function updateModuleGroup(Request $request, ModuleGroup $group)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:m_module_groups,name,' . $group->id,
            'icon' => 'nullable|string|max:50',
        ]);

        $data['updated_by'] = Auth::id();

        $group->update($data);

        return back()->with('success', 'Module group berhasil diperbarui.');
    }

    public function destroyModuleGroup(ModuleGroup $group)
    {
        $group->delete();

        return back()->with('success', 'Module group berhasil dihapus.');
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

        $data['created_by'] = Auth::id();
        $data['updated_by'] = Auth::id();

        Module::create($data);

        return back()->with('success', 'Module berhasil dibuat.');
    }

    public function updateModule(Request $request, Module $module)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:m_modules,name,'.$module->id,
            'identifier' => 'required|string|max:50|unique:m_modules,identifier,'.$module->id,
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

    public function numberingFormats(Request $request)
    {
        return Inertia::render('admin/index', [
            'currentView' => 'numbering-formats',
            'formats' => \App\Models\NumberingFormat::all(),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Pengaturan Penomoran', 'href' => route('admin.numbering-formats'), 'description' => 'Kelola format nomor otomatis untuk dokumen.', 'icon' => 'Hash'],
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
}
