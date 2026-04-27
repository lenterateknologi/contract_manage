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

        return back()->with('success', 'Role created successfully.');
    }

    public function updateRole(Request $request, Role $role)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:m_roles,name,'.$role->id,
            'description' => 'nullable|string',
        ]);

        $role->update($data);

        return back()->with('success', 'Role updated successfully.');
    }

    public function destroyRole(Role $role)
    {
        // Prevent deleting core roles if needed, but for now just delete
        $role->delete();

        return back()->with('success', 'Role deleted successfully.');
    }

    public function roleAccess(Role $role)
    {
        $modules = Module::with(['moduleGroup', 'accessModules' => function ($query) use ($role) {
            $query->where('role_id', $role->id);
        }])->orderBy('module_group_id')->orderBy('sequence')->get();

        $modules->transform(function ($module) {
            $module->access = $module->accessModules->first();
            unset($module->accessModules);

            return $module;
        });

        return Inertia::render('admin/role-access', [
            'role' => $role,
            'modules' => $modules,
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Manajemen Role', 'href' => route('admin.roles'), 'icon' => 'ShieldCheck'],
                ['title' => 'Hak Akses', 'href' => '#', 'description' => "Otorisasi modul untuk role {$role->name}.", 'icon' => 'Settings2'],
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
        ]);

        foreach ($data['accesses'] as $accessData) {
            \App\Models\AccessModule::updateOrCreate(
                [
                    'role_id' => $role->id,
                    'module_id' => $accessData['module_id'],
                ],
                [
                    'can_read' => $accessData['can_read'],
                    'can_create' => $accessData['can_create'],
                    'can_update' => $accessData['can_update'],
                    'can_delete' => $accessData['can_delete'],
                ]
            );
        }

        return back()->with('success', 'Role access updated successfully.');
    }

    public function roleNavigation(Role $role)
    {
        // Get all groups and their role-specific sort order
        $groups = ModuleGroup::all()->map(function ($group) use ($role) {
            $config = RoleModuleGroup::where('role_id', $role->id)
                ->where('module_group_id', $group->id)
                ->first();

            $group->sequence = $config ? $config->sequence : 999;

            // Get modules that belong to this group FOR THIS ROLE
            $group->modules = Module::whereHas('accessModules', function ($q) use ($role, $group) {
                $q->where('role_id', $role->id)
                    ->where('module_group_id', $group->id)
                    ->where('can_read', true);
            })->get()->map(function ($module) use ($role) {
                $access = AccessModule::where('role_id', $role->id)
                    ->where('module_id', $module->id)
                    ->first();
                $module->sequence = $access ? $access->sequence : 999;

                return $module;
            })->sortBy('sequence')->values();

            return $group;
        })->sortBy('sequence')->values();

        $allModules = Module::orderBy('name')->get();

        return Inertia::render('admin/role-navigation', [
            'role' => $role,
            'navigation' => $groups,
            'allModules' => $allModules,
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Manajemen Role', 'href' => route('admin.roles'), 'icon' => 'ShieldCheck'],
                ['title' => 'Struktur Navigasi', 'href' => '#', 'description' => "Kelola urutan menu untuk role {$role->name}.", 'icon' => 'LayoutGrid'],
            ],
        ]);
    }

    public function reorderRoleNavigation(Request $request, Role $role)
    {
        $data = $request->validate([
            'role_id' => 'required|uuid|exists:m_roles,id',
            'groups' => 'required|array',
            'groups.*.id' => 'required|uuid|exists:m_module_groups,id',
            'groups.*.sequence' => 'required|integer',
            'groups.*.modules' => 'nullable|array',
            'groups.*.modules.*.id' => 'required|uuid|exists:m_modules,id',
            'groups.*.modules.*.sequence' => 'required|integer',
        ]);

        $roleId = $data['role_id'];
        $activeModuleIds = [];

        Log::info('Reordering Role Navigation', [
            'role_id' => $roleId,
            'groups_count' => count($data['groups']),
        ]);

        foreach ($data['groups'] as $groupData) {
            // Save group order for this role specifically - using query builder due to composite key
            $updatedGroups = RoleModuleGroup::where('role_id', $roleId)
                ->where('module_group_id', $groupData['id'])
                ->update(['sequence' => $groupData['sequence']]);

            if ($updatedGroups === 0) {
                RoleModuleGroup::create([
                    'role_id' => $roleId,
                    'module_group_id' => $groupData['id'],
                    'sequence' => $groupData['sequence'],
                ]);
            }

            if (! empty($groupData['modules'])) {
                foreach ($groupData['modules'] as $moduleData) {
                    $activeModuleIds[] = $moduleData['id'];

                    // Directly update using query builder to ensure targeting the correct composite key row
                    $updated = AccessModule::where('role_id', $roleId)
                        ->where('module_id', $moduleData['id'])
                        ->update([
                            'can_read' => true,
                            'module_group_id' => $groupData['id'],
                            'sequence' => $moduleData['sequence'],
                        ]);

                    if ($updated === 0) {
                        AccessModule::create([
                            'role_id' => $roleId,
                            'module_id' => $moduleData['id'],
                            'can_read' => true,
                            'module_group_id' => $groupData['id'],
                            'sequence' => $moduleData['sequence'],
                        ]);
                    }
                }
            }
        }

        // Deactivate (remove from nav) any modules that are no longer in any group
        AccessModule::where('role_id', $roleId)
            ->whereNotIn('module_id', $activeModuleIds)
            ->update([
                'can_read' => false,
                'module_group_id' => null,
                'sequence' => 0,
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

        return back()->with('success', 'User created successfully.');
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

        return back()->with('success', 'User updated successfully.');
    }

    public function destroyUser(User $user)
    {
        if ($user->id === Auth::id()) {
            abort(403, 'Cannot delete yourself.');
        }
        $user->delete();

        return back()->with('success', 'User deleted successfully.');
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

        return back()->with('success', 'Contract type created successfully.');
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

        return back()->with('success', 'Contract type updated successfully.');
    }

    public function destroyContractType(ContractType $type)
    {
        $type->delete();

        return back()->with('success', 'Contract type deleted successfully.');
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
            'statuses' => $query->orderBy('sequence')->paginate($request->input('per_page', 10))->withQueryString(),
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
            'sequence' => 'required|integer',
            'is_active' => 'boolean',
        ]);

        ContractStatus::create($data);

        return back()->with('success', 'Status created successfully.');
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
            'sequence' => 'required|integer',
            'is_active' => 'boolean',
        ]);

        $status->update($data);

        return back()->with('success', 'Status updated successfully.');
    }

    public function destroyContractStatus(ContractStatus $status)
    {
        $status->delete();

        return back()->with('success', 'Status deleted successfully.');
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

        return back()->with('success', 'Department created successfully.');
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

        return back()->with('success', 'Department updated successfully.');
    }

    public function destroyDepartment(Department $department)
    {
        $department->delete();

        return back()->with('success', 'Department deleted successfully.');
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

        return redirect()->route('admin.vendors.edit', $vendor->id)->with('success', 'Vendor created successfully. You can now attach documents.');
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

        return back()->with('success', 'Vendor updated successfully.');
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

        return back()->with('success', 'Document uploaded successfully.');
    }

    public function destroyVendorDocument(Vendor $vendor, \App\Models\VendorDocument $document)
    {
        if ($document->vendor_id !== $vendor->id) {
            abort(403);
        }

        $document->delete();
        return back()->with('success', 'Document deleted successfully.');
    }

    public function destroyVendor(Vendor $vendor)
    {
        $vendor->delete();

        return back()->with('success', 'Vendor deleted successfully.');
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
            'contractStatuses' => ContractStatus::orderBy('sequence')->get(),
            'filters' => $request->only(['search', 'contract_type']),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Alur Kerja (Workflows)', 'href' => route('admin.workflows'), 'description' => 'Konfigurasi tahapan persetujuan.', 'icon' => 'GitBranch'],
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
            'initiator_roles' => 'nullable|array',
            'initiator_users' => 'nullable|array',
            'initiator_departments' => 'nullable|array',
            'steps' => 'nullable|array',
            'steps.*.role' => 'nullable',
            'steps.*.description' => 'nullable|string',
            'steps.*.approver_type' => 'nullable|string|in:role,user',
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

                return back()->with('success', 'Workflow created successfully.');
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
            'initiator_roles' => 'nullable|array',
            'initiator_users' => 'nullable|array',
            'initiator_departments' => 'nullable|array',
            'steps' => 'nullable|array',
            'steps.*.role' => 'nullable',
            'steps.*.description' => 'nullable|string',
            'steps.*.approver_type' => 'nullable|string|in:role,user',
            'steps.*.user_ids' => 'nullable|array',
            'steps.*.department_ids' => 'nullable|array',
            'steps.*.status_id' => 'nullable|string',
        ]);

        try {
            return DB::transaction(function() use ($data, $workflow) {
                $workflowData = collect($data)->except(['initiator_roles', 'initiator_users', 'initiator_departments', 'steps'])->toArray();
                $workflow->update($workflowData);

                // Sync Initiators
                $workflow->initiatorRolesData()->delete();
                if (!empty($data['initiator_roles'])) {
                    foreach ($data['initiator_roles'] as $role) {
                        $workflow->initiatorRolesData()->create(['role_name' => $role]);
                    }
                }

                $workflow->initiatorDepartmentsData()->delete();
                if (!empty($data['initiator_departments'])) {
                    foreach ($data['initiator_departments'] as $deptId) {
                        $workflow->initiatorDepartmentsData()->create(['department_id' => $deptId]);
                    }
                }

                $workflow->initiatorUsersData()->delete();
                if (!empty($data['initiator_users'])) {
                    foreach ($data['initiator_users'] as $userId) {
                        $workflow->initiatorUsersData()->create(['user_id' => $userId]);
                    }
                }

                // Sync steps - Detailed Cleanup
                $oldSteps = $workflow->steps()->get();
                foreach ($oldSteps as $s) {
                    $s->approverRoles()->delete();
                    $s->approverDepartments()->delete();
                    $s->approverUsers()->delete();
                    $s->forceDelete();
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

                return back()->with('success', 'Workflow updated successfully.');
            });
        } catch (\Exception $e) {
            Log::error('Workflow Update Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
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
        $data = $request->validate([
            'steps' => 'nullable|array',
            'steps.*.role' => 'required',
            'steps.*.selected_role' => 'nullable|string',
            'steps.*.description' => 'nullable|string',
            'steps.*.approver_type' => 'nullable|string|in:role,user',
            'steps.*.user_ids' => 'nullable|array',
            'steps.*.department_id' => 'nullable|uuid|exists:m_departments,id',
        ]);

        $workflow->steps()->each(function($s) {
            $s->approverRoles()->delete();
            $s->approverDepartments()->detach();
            $s->approverUsers()->detach();
            $s->forceDelete();
        });

        if (! empty($data['steps'])) {
            foreach ($data['steps'] as $index => $stepData) {
                $step = $workflow->steps()->create([
                    'approver_type' => $stepData['approver_type'] ?? 'role',
                    'description' => $stepData['description'] ?? '',
                    'step' => $index + 1,
                    'created_by' => Auth::id(),
                    'updated_by' => Auth::id(),
                ]);

                if (($stepData['approver_type'] ?? 'role') === 'role') {
                    $roleName = $stepData['selected_role'] ?? (is_array($stepData['role']) ? $stepData['role'][0] : $stepData['role']);
                    $step->approverRoles()->create(['role_name' => $roleName]);
                } else if (! empty($stepData['user_ids'])) {
                     $step->approverUsers()->sync($stepData['user_ids']);
                }

                if (!empty($stepData['department_id'])) {
                    $step->approverDepartments()->sync([$stepData['department_id']]);
                }
            }
        }

        return redirect()->route('admin.workflows');
    }

    // Navigation Management (Combined)
    public function navigation()
    {
        $groups = ModuleGroup::with(['modules' => function ($query) {
            $query->orderBy('sequence');
        }])
            ->orderBy('sequence')
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
            'moduleGroups' => $query->orderBy('sequence')->paginate($request->input('per_page', 10))->withQueryString(),
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
            'groups.*.sequence' => 'required|integer',
            'groups.*.modules' => 'nullable|array',
            'groups.*.modules.*.id' => 'required|uuid|exists:m_modules,id',
            'groups.*.modules.*.sequence' => 'required|integer',
        ]);

        $roleId = $data['role_id'];

        foreach ($data['groups'] as $groupData) {
            ModuleGroup::where('id', $groupData['id'])->update([
                'sequence' => $groupData['sort_number'],
            ]);

            if (! empty($groupData['modules'])) {
                foreach ($groupData['modules'] as $moduleData) {
                    Module::where('id', $moduleData['id'])->update([
                        'sequence' => $moduleData['sort_number'],
                        'module_group_id' => $groupData['id'],
                    ]);

                    // Automatically grant can_read permission when module is in navigation
                    AccessModule::updateOrCreate(
                        ['role_id' => $roleId, 'module_id' => $moduleData['id']],
                        [
                            'can_read' => true,
                            'created_by' => Auth::id(), // Fix: Add current user ID
                        ]
                    );
                }
            }
        }

        return back()->with('success', 'Navigation order and permissions updated successfully.');
    }

    // Module Groups

    public function storeModuleGroup(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:m_module_groups,name',
            'sequence' => 'required|integer',
            'icon' => 'nullable|string|max:50',
        ]);

        $data['created_by'] = Auth::id();
        $data['updated_by'] = Auth::id();

        ModuleGroup::create($data);

        return back()->with('success', 'Module group created successfully.');
    }

    public function updateModuleGroup(Request $request, ModuleGroup $group)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:m_module_groups,name,' . $group->id,
            'sequence' => 'required|integer',
            'icon' => 'nullable|string|max:50',
        ]);

        $data['updated_by'] = Auth::id();

        $group->update($data);

        return back()->with('success', 'Module group updated successfully.');
    }

    public function destroyModuleGroup(ModuleGroup $group)
    {
        $group->delete();

        return back()->with('success', 'Module group deleted successfully.');
    }

    public function storeModule(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:m_modules,name',
            'identifier' => 'required|string|max:50|unique:m_modules,identifier',
            'module_group_id' => 'required|uuid|exists:m_module_groups,id',
            'sequence' => 'required|integer',
            'route' => 'nullable|string|max:255',
            'icon' => 'nullable|string|max:50',
            'showed_as_menu' => 'boolean',
        ]);

        $data['created_by'] = Auth::id();
        $data['updated_by'] = Auth::id();

        Module::create($data);

        return back()->with('success', 'Module created successfully.');
    }

    public function updateModule(Request $request, Module $module)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:m_modules,name,'.$module->id,
            'identifier' => 'required|string|max:50|unique:m_modules,identifier,'.$module->id,
            'module_group_id' => 'required|uuid|exists:m_module_groups,id',
            'sequence' => 'required|integer',
            'route' => 'nullable|string|max:255',
            'icon' => 'nullable|string|max:50',
            'showed_as_menu' => 'boolean',
        ]);

        $data['updated_by'] = Auth::id();

        $module->update($data);

        return back()->with('success', 'Module updated successfully.');
    }

    public function destroyModule(Module $module)
    {
        $module->delete();

        return back()->with('success', 'Module deleted successfully.');
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

        return back()->with('success', 'Numbering format updated successfully.');
    }
}
