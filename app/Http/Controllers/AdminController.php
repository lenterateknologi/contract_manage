<?php

namespace App\Http\Controllers;

use App\Models\AccessModule;
use App\Models\ContractType;
use App\Models\Module;
use App\Models\ModuleGroup;
use App\Models\Role;
use App\Models\RoleModuleGroup;
use App\Models\User;
use App\Models\Workflow;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function users()
    {
        return Inertia::render('admin/index', [
            'currentView' => 'users',
            'users' => User::orderBy('name')->get(),
            'roles' => Role::orderBy('name')->get(),
        ]);
    }

    public function roles()
    {
        return Inertia::render('admin/index', [
            'currentView' => 'roles',
            'roles' => Role::orderBy('name')->get(),
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
                    'created_by' => auth()->id(),
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
                            'created_by' => auth()->id() ?? User::where('role', 'admin')->first()->id,
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
        ]);

        $data['password'] = bcrypt($data['password']);
        $data['initials'] = collect(explode(' ', $data['name']))->map(fn ($n) => strtoupper(substr($n, 0, 1)))->take(2)->join('');

        User::create($data);

        return back()->with('success', 'User created successfully.');
    }

    public function updateUser(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,'.$user->id,
            'username' => 'required|string|max:20|unique:users,username,'.$user->id,
            'role' => 'required|string',
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
        if ($user->id === auth()->id()) {
            abort(403, 'Cannot delete yourself.');
        }
        $user->delete();

        return back()->with('success', 'User deleted successfully.');
    }

    public function contractTypes()
    {
        return Inertia::render('admin/index', [
            'currentView' => 'contract-types',
            'types' => ContractType::orderBy('name')->get(),
        ]);
    }

    public function storeContractType(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:contract_types,name',
            'description' => 'nullable|string',
        ]);

        ContractType::create($data);

        return back()->with('success', 'Contract type created successfully.');
    }

    public function updateContractType(Request $request, ContractType $type)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:contract_types,name,'.$type->id,
            'description' => 'nullable|string',
        ]);

        $type->update($data);

        return back()->with('success', 'Contract type updated successfully.');
    }

    public function destroyContractType(ContractType $type)
    {
        $type->delete();

        return back()->with('success', 'Contract type deleted successfully.');
    }

    public function workflows()
    {
        return Inertia::render('admin/index', [
            'currentView' => 'workflows',
            'workflows' => Workflow::with('steps.users')->orderBy('name')->get(),
            'contractTypes' => ContractType::all(),
            'roles' => Role::all(),
            'users' => User::all(),
        ]);
    }

    public function storeWorkflow(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'contract_type' => 'required|string',
            'description' => 'nullable|string',
            'is_default' => 'boolean',
            'steps' => 'nullable|array',
            'steps.*.role' => 'required|string',
            'steps.*.description' => 'nullable|string',
            'steps.*.approver_type' => 'nullable|string|in:role,user',
            'steps.*.user_ids' => 'nullable|array',
        ]);

        $workflow = Workflow::create($data);

        if (! empty($data['steps'])) {
            foreach ($data['steps'] as $index => $stepData) {
                $workflow->steps()->create([
                    'role' => $stepData['role'],
                    'approver_type' => $stepData['approver_type'] ?? 'role',
                    'user_ids' => $stepData['user_ids'] ?? null,
                    'description' => $stepData['description'] ?? '',
                    'step' => $index + 1,
                    'created_by' => auth()->id(),
                    'updated_by' => auth()->id(),
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
            'description' => 'nullable|string',
            'is_default' => 'boolean',
            'steps' => 'nullable|array',
            'steps.*.role' => 'required|string',
            'steps.*.description' => 'nullable|string',
            'steps.*.approver_type' => 'nullable|string|in:role,user',
            'steps.*.user_ids' => 'nullable|array',
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
                    'step' => $index + 1,
                    'created_by' => auth()->id(),
                    'updated_by' => auth()->id(),
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
        ]);

        $workflow->steps()->delete();

        if (! empty($data['steps'])) {
            foreach ($data['steps'] as $index => $stepData) {
                $step = $workflow->steps()->create([
                    'role' => ($stepData['approver_type'] ?? 'role') === 'role' ? ($stepData['selected_role'] ?? $stepData['role']) : $stepData['role'],
                    'approver_type' => $stepData['approver_type'] ?? 'role',
                    'description' => $stepData['role'], // Use manual label for description/display
                    'step' => $index + 1,
                    'created_by' => auth()->id(),
                    'updated_by' => auth()->id(),
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
            'navigation' => $groups,
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
                            'created_by' => auth()->id(), // Fix: Add current user ID
                        ]
                    );
                }
            }
        }

        return back()->with('success', 'Navigation order and permissions updated successfully.');
    }

    // Module Groups

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

        $data['created_by'] = auth()->id();
        $data['updated_by'] = auth()->id();

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

        $data['updated_by'] = auth()->id();

        $module->update($data);

        return back()->with('success', 'Module updated successfully.');
    }

    public function destroyModule(Module $module)
    {
        $module->delete();

        return back()->with('success', 'Module deleted successfully.');
    }
}
