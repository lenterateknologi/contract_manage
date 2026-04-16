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
    public function users()
    {
        return Inertia::render('admin/index', [
            'currentView' => 'users',
            'users' => User::with('department')->orderBy('name')->paginate(request('per_page', 10)),
            'roles' => Role::orderBy('name')->get(),
            'departments' => Department::orderBy('name')->get(),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Manajemen User', 'href' => route('admin.users'), 'description' => 'Kelola akses dan profil pengguna sistem.', 'icon' => 'Users'],
            ],
        ]);
    }

    public function roles()
    {
        return Inertia::render('admin/index', [
            'currentView' => 'roles',
            'roles' => Role::orderBy('name')->paginate(request('per_page', 10)),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Manajemen Role', 'href' => route('admin.roles'), 'description' => 'Pengaturan peran dan otorisasi.', 'icon' => 'ShieldCheck'],
            ],
        ]);
    }

    public function storeRole(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'description' => 'nullable|string',
        ]);

        Role::create($data);

        return back()->with('success', 'Role created successfully.');
    }

    public function updateRole(Request $request, Role $role)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name,'.$role->id,
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
        }])->orderBy('module_group_id')->orderBy('sort_number')->get();

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
            'accesses.*.module_id' => 'required|uuid|exists:modules,id',
            'accesses.*.can_read' => 'boolean',
            'accesses.*.can_create' => 'boolean',
            'accesses.*.can_update' => 'boolean',
            'accesses.*.can_delete' => 'boolean',
        ]);

        foreach ($data['accesses'] as $accessData) {
            DB::table('access_modules')->updateOrInsert(
                [
                    'role_id' => $role->id,
                    'module_id' => $accessData['module_id'],
                ],
                [
                    'can_read' => $accessData['can_read'],
                    'can_create' => $accessData['can_create'],
                    'can_update' => $accessData['can_update'],
                    'can_delete' => $accessData['can_delete'],
                    'created_by' => Auth::id(),
                    'updated_at' => now(),
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

            $group->sort_number = $config ? $config->sort_number : 999;

            // Get modules that belong to this group FOR THIS ROLE
            $group->modules = Module::whereHas('accessModules', function ($q) use ($role, $group) {
                $q->where('role_id', $role->id)
                    ->where('module_group_id', $group->id)
                    ->where('can_read', true);
            })->get()->map(function ($module) use ($role) {
                $access = AccessModule::where('role_id', $role->id)
                    ->where('module_id', $module->id)
                    ->first();
                $module->sort_number = $access ? $access->sort_number : 999;

                return $module;
            })->sortBy('sort_number')->values();

            return $group;
        })->sortBy('sort_number')->values();

        $allModules = Module::orderBy('title')->get();

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
            'role_id' => 'required|uuid|exists:roles,id',
            'groups' => 'required|array',
            'groups.*.id' => 'required|uuid|exists:module_groups,id',
            'groups.*.sort_number' => 'required|integer',
            'groups.*.modules' => 'nullable|array',
            'groups.*.modules.*.id' => 'required|uuid|exists:modules,id',
            'groups.*.modules.*.sort_number' => 'required|integer',
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
                ->update(['sort_number' => $groupData['sort_number']]);

            if ($updatedGroups === 0) {
                RoleModuleGroup::create([
                    'role_id' => $roleId,
                    'module_group_id' => $groupData['id'],
                    'sort_number' => $groupData['sort_number'],
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
                            'sort_number' => $moduleData['sort_number'],
                        ]);

                    if ($updated === 0) {
                        AccessModule::create([
                            'role_id' => $roleId,
                            'module_id' => $moduleData['id'],
                            'can_read' => true,
                            'module_group_id' => $groupData['id'],
                            'sort_number' => $moduleData['sort_number'],
                            'created_by' => Auth::id() ?? User::where('role', 'admin')->first()->id,
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
                'sort_number' => 0,
            ]);

        return back();
    }

    public function storeUser(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'username' => 'required|string|max:20|unique:users,username',
            'password' => 'required|string|min:8',
            'role' => 'required|string',
            'position' => 'nullable|string',
            'phone' => 'nullable|string',
            'department_id' => 'nullable|uuid|exists:departments,id',
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
            'email' => 'required|email|unique:users,email,'.$user->id,
            'username' => 'required|string|max:20|unique:users,username,'.$user->id,
            'role' => 'required|string',
            'position' => 'nullable|string',
            'phone' => 'nullable|string',
            'department_id' => 'nullable|uuid|exists:departments,id',
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

    public function contractTypes()
    {
        return Inertia::render('admin/index', [
            'currentView' => 'contract-types',
            'types' => ContractType::orderBy('name')->paginate(request('per_page', 10)),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Tipe Kontrak', 'href' => route('admin.contract-types'), 'description' => 'Definisi kategori dan template dokumen.', 'icon' => 'FileText'],
            ],
        ]);
    }

    public function storeContractType(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:contract_types,name',
            'description' => 'nullable|string',
            'type' => 'required|string|in:f1,f2',
        ]);

        ContractType::create($data);

        return back()->with('success', 'Contract type created successfully.');
    }

    public function updateContractType(Request $request, ContractType $type)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:contract_types,name,'.$type->id,
            'description' => 'nullable|string',
            'type' => 'required|string|in:f1,f2',
        ]);

        $type->update($data);

        return back()->with('success', 'Contract type updated successfully.');
    }

    public function destroyContractType(ContractType $type)
    {
        $type->delete();

        return back()->with('success', 'Contract type deleted successfully.');
    }

    public function contractStatuses()
    {
        return Inertia::render('admin/index', [
            'currentView' => 'contract-statuses',
            'statuses' => ContractStatus::orderBy('sort_order')->paginate(request('per_page', 10)),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Master Status', 'href' => route('admin.contract-statuses'), 'description' => 'Pengaturan status kontrak dan visualisasi.', 'icon' => 'Tags'],
            ],
        ]);
    }

    public function storeContractStatus(Request $request)
    {
        $data = $request->validate([
            'code' => 'required|string|max:50|unique:contract_statuses,code',
            'name' => 'required|string|max:255',
            'color' => 'required|string|max:20',
            'bg_color' => 'required|string|max:20',
            'icon' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'sort_order' => 'required|integer',
            'is_active' => 'boolean',
        ]);

        ContractStatus::create($data);

        return back()->with('success', 'Status created successfully.');
    }

    public function updateContractStatus(Request $request, ContractStatus $status)
    {
        $data = $request->validate([
            'code' => 'required|string|max:50|unique:contract_statuses,code,'.$status->id,
            'name' => 'required|string|max:255',
            'color' => 'required|string|max:20',
            'bg_color' => 'required|string|max:20',
            'icon' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'sort_order' => 'required|integer',
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

    public function departments()
    {
        return Inertia::render('admin/index', [
            'currentView' => 'departments',
            'departments' => Department::orderBy('name')->paginate(request('per_page', 10)),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Master Departemen', 'href' => route('admin.departments'), 'description' => 'Kelola divisi dan struktur organisasi.', 'icon' => 'Building2'],
            ],
        ]);
    }

    public function storeDepartment(Request $request)
    {
        $data = $request->validate([
            'code' => 'required|string|max:50|unique:departments,code',
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
            'code' => 'required|string|max:50|unique:departments,code,' . $department->id,
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

    public function vendors()
    {
        return Inertia::render('admin/index', [
            'currentView' => 'vendors',
            'vendors' => Vendor::orderBy('name')->paginate(request('per_page', 10)),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Master Vendor', 'href' => route('admin.vendors'), 'description' => 'Kelola database pihak ketiga dan mitra.', 'icon' => 'Truck'],
            ],
        ]);
    }

    public function storeVendor(Request $request)
    {
        $data = $request->validate([
            'code' => 'required|string|max:50|unique:vendors,code',
            'name' => 'required|string|max:255',
            'category' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $data['created_by'] = Auth::id();
        $data['updated_by'] = Auth::id();

        Vendor::create($data);

        return back()->with('success', 'Vendor created successfully.');
    }

    /**
     * Update vendor details.
     * @param Request $request
     * @param Vendor $vendor
     * @return \Illuminate\Http\RedirectResponse
     */
    public function updateVendor(Request $request, Vendor $vendor)
    {
        $data = $request->validate([
            'code' => 'required|string|max:50|unique:vendors,code,' . $vendor->id,
            'name' => 'required|string|max:255',
            'category' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $data['updated_by'] = Auth::id();

        $vendor->update($data);

        return back()->with('success', 'Vendor updated successfully.');
    }

    public function destroyVendor(Vendor $vendor)
    {
        $vendor->delete();

        return back()->with('success', 'Vendor deleted successfully.');
    }

    public function workflows()
    {
        return Inertia::render('admin/index', [
            'currentView' => 'workflows',
            'workflows' => Workflow::with(['steps.users', 'department'])->orderBy('name')->paginate(request('per_page', 10)),
            'contractTypes' => ContractType::all(),
            'departments' => Department::all(),
            'roles' => Role::all(),
            'users' => User::all(),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Alur Kerja (Workflows)', 'href' => route('admin.workflows'), 'description' => 'Konfigurasi tahapan persetujuan.', 'icon' => 'GitBranch'],
            ],
        ]);
    }

    public function storeWorkflow(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'contract_type' => 'required|string',
            'department_id' => 'nullable|uuid|exists:departments,id',
            'description' => 'nullable|string',
            'is_default' => 'boolean',
            'steps' => 'nullable|array',
            'steps.*.role' => 'required|string',
            'steps.*.description' => 'nullable|string',
            'steps.*.approver_type' => 'nullable|string|in:role,user',
            'steps.*.user_ids' => 'nullable|array',
            'steps.*.department_id' => 'nullable|uuid|exists:departments,id',
        ]);

        $workflow = Workflow::create($data);

        if (! empty($data['steps'])) {
            foreach ($data['steps'] as $index => $stepData) {
                $workflow->steps()->create([
                    'role' => $stepData['role'],
                    'approver_type' => $stepData['approver_type'] ?? 'role',
                    'user_ids' => $stepData['user_ids'] ?? null,
                    'description' => $stepData['description'] ?? '',
                    'department_id' => $stepData['department_id'] ?? null,
                    'step' => $index + 1,
                    'created_by' => Auth::id(),
                    'updated_by' => Auth::id(),
                ]);
            }
        }

        return back()->with('success', 'Workflow created successfully.');
    }

    public function updateWorkflow(Request $request, Workflow $workflow)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'contract_type' => 'required|string',
            'department_id' => 'nullable|uuid|exists:departments,id',
            'description' => 'nullable|string',
            'is_default' => 'boolean',
            'steps' => 'nullable|array',
            'steps.*.role' => 'required|string',
            'steps.*.description' => 'nullable|string',
            'steps.*.approver_type' => 'nullable|string|in:role,user',
            'steps.*.user_ids' => 'nullable|array',
            'steps.*.department_id' => 'nullable|uuid|exists:departments,id',
        ]);

        $workflow->update($data);

        // Sync steps
        $workflow->steps()->delete();
        if (! empty($data['steps'])) {
            foreach ($data['steps'] as $index => $stepData) {
                $workflow->steps()->create([
                    'role' => $stepData['role'],
                    'approver_type' => $stepData['approver_type'] ?? 'role',
                    'user_ids' => $stepData['user_ids'] ?? null,
                    'description' => $stepData['description'] ?? '',
                    'department_id' => $stepData['department_id'] ?? null,
                    'step' => $index + 1,
                    'created_by' => Auth::id(),
                    'updated_by' => Auth::id(),
                ]);
            }
        }

        return back()->with('success', 'Workflow updated successfully.');
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
            'steps.*.role' => 'required|string',
            'steps.*.selected_role' => 'nullable|string',
            'steps.*.description' => 'nullable|string',
            'steps.*.approver_type' => 'nullable|string|in:role,user',
            'steps.*.user_ids' => 'nullable|array',
            'steps.*.department_id' => 'nullable|uuid|exists:departments,id',
        ]);

        $workflow->steps()->delete();

        if (! empty($data['steps'])) {
            foreach ($data['steps'] as $index => $stepData) {
                $step = $workflow->steps()->create([
                    'role' => ($stepData['approver_type'] ?? 'role') === 'role' ? ($stepData['selected_role'] ?? $stepData['role']) : $stepData['role'],
                    'approver_type' => $stepData['approver_type'] ?? 'role',
                    'description' => ($stepData['approver_type'] ?? 'role') === 'role' ? ($stepData['selected_role'] ?? $stepData['role']) : $stepData['role'],
                    'department_id' => $stepData['department_id'] ?? null,
                    'step' => $index + 1,
                    'created_by' => Auth::id(),
                    'updated_by' => Auth::id(),
                ]);

                if (($stepData['approver_type'] ?? 'role') === 'user' && ! empty($stepData['user_ids'])) {
                    $step->users()->sync($stepData['user_ids']);
                }
            }
        }

        return redirect()->route('admin.workflows');
    }

    // Navigation Management (Combined)
    public function navigation()
    {
        $groups = ModuleGroup::with(['modules' => function ($query) {
            $query->orderBy('sort_number');
        }])
            ->orderBy('sort_number')
            ->get();

        return Inertia::render('admin/index', [
            'currentView' => 'navigation',
            'groups' => $groups,
        ]);
    }

    public function moduleGroups()
    {
        return Inertia::render('admin/index', [
            'currentView' => 'module-groups',
            'moduleGroups' => ModuleGroup::orderBy('sort_number')->paginate(request('per_page', 10)),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#'],
                ['title' => 'Grup Modul', 'href' => route('admin.module-groups'), 'description' => 'Kelola pengelompokan menu navigasi.'],
            ],
        ]);
    }

    public function modules()
    {
        return Inertia::render('admin/index', [
            'currentView' => 'modules',
            'modules' => Module::with('moduleGroup')->orderBy('title')->paginate(request('per_page', 10)),
            'moduleGroups' => ModuleGroup::all(),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#'],
                ['title' => 'Modul Sistem', 'href' => route('admin.modules'), 'description' => 'Kelola modul dan fitur aplikasi.'],
            ],
        ]);
    }

    public function reorderNavigation(Request $request)
    {
        $data = $request->validate([
            'role_id' => 'required|uuid|exists:roles,id',
            'groups' => 'required|array',
            'groups.*.id' => 'required|uuid|exists:module_groups,id',
            'groups.*.sort_number' => 'required|integer',
            'groups.*.modules' => 'nullable|array',
            'groups.*.modules.*.id' => 'required|uuid|exists:modules,id',
            'groups.*.modules.*.sort_number' => 'required|integer',
        ]);

        $roleId = $data['role_id'];

        foreach ($data['groups'] as $groupData) {
            ModuleGroup::where('id', $groupData['id'])->update([
                'sort_number' => $groupData['sort_number'],
            ]);

            if (! empty($groupData['modules'])) {
                foreach ($groupData['modules'] as $moduleData) {
                    Module::where('id', $moduleData['id'])->update([
                        'sort_number' => $moduleData['sort_number'],
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
            'title' => 'required|string|max:255',
            'sort_number' => 'required|integer',
        ]);

        $data['created_by'] = Auth::id();
        $data['updated_by'] = Auth::id();

        ModuleGroup::create($data);

        return back()->with('success', 'Module group created successfully.');
    }

    public function updateModuleGroup(Request $request, ModuleGroup $group)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'sort_number' => 'required|integer',
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
            'code' => 'required|string|max:10|unique:modules,code',
            'title' => 'required|string|max:255',
            'sort_number' => 'required|integer',
            'url' => 'nullable|string',
            'icon' => 'nullable|string',
            'module_group_id' => 'required|uuid|exists:module_groups,id',
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
            'code' => 'required|string|max:10|unique:modules,code,'.$module->id,
            'title' => 'required|string|max:255',
            'sort_number' => 'required|integer',
            'url' => 'nullable|string',
            'icon' => 'nullable|string',
            'module_group_id' => 'required|uuid|exists:module_groups,id',
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
}
