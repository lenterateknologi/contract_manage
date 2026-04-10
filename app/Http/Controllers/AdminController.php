<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\ContractType;
use App\Models\Workflow;
use App\Models\Role;
use App\Models\Module;
use App\Models\AccessModule;
use Inertia\Inertia;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function users()
    {
        return Inertia::render('admin/index', [
            'currentView' => 'users',
            'users' => User::orderBy('name')->get(),
            'roles' => \App\Models\Role::orderBy('name')->get(),
        ]);
    }

    public function roles()
    {
        return Inertia::render('admin/index', [
            'currentView' => 'roles',
            'roles' => \App\Models\Role::orderBy('name')->get(),
        ]);
    }

    public function storeRole(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'description' => 'nullable|string',
        ]);

        \App\Models\Role::create($data);
        return back()->with('success', 'Role created successfully.');
    }

    public function updateRole(Request $request, \App\Models\Role $role)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name,' . $role->id,
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
            \Illuminate\Support\Facades\DB::table('access_modules')->updateOrInsert(
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

    public function storeUser(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => 'required|string',
        ]);

        $data['password'] = bcrypt($data['password']);
        $data['initials'] = collect(explode(' ', $data['name']))->map(fn($n) => strtoupper(substr($n, 0, 1)))->take(2)->join('');
        
        User::create($data);

        return back()->with('success', 'User created successfully.');
    }

    public function updateUser(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
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
            'name' => 'required|string|max:255|unique:contract_types,name,' . $type->id,
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
            'workflows' => Workflow::with('steps')->orderBy('name')->get(),
            'contractTypes' => ContractType::all(),
        ]);
    }

    public function storeWorkflow(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'contract_type' => 'required|string',
            'description' => 'nullable|string',
            'is_default' => 'boolean',
        ]);

        Workflow::create($data);
        return back()->with('success', 'Workflow created successfully.');
    }

    public function updateWorkflow(Request $request, Workflow $workflow)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'contract_type' => 'required|string',
            'description' => 'nullable|string',
            'is_default' => 'boolean',
        ]);

        $workflow->update($data);
        return back()->with('success', 'Workflow updated successfully.');
    }

    public function destroyWorkflow(Workflow $workflow)
    {
        $workflow->delete();
        return back()->with('success', 'Workflow deleted successfully.');
    }

    // Navigation Management (Combined)
    public function navigation()
    {
        $groups = \App\Models\ModuleGroup::with(['modules' => function ($query) {
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
            'groups' => 'required|array',
            'groups.*.id' => 'required|uuid|exists:module_groups,id',
            'groups.*.sort_number' => 'required|integer',
            'groups.*.modules' => 'nullable|array',
            'groups.*.modules.*.id' => 'required|uuid|exists:modules,id',
            'groups.*.modules.*.sort_number' => 'required|integer',
        ]);

        foreach ($data['groups'] as $groupData) {
            \App\Models\ModuleGroup::where('id', $groupData['id'])->update([
                'sort_number' => $groupData['sort_number']
            ]);

            if (!empty($groupData['modules'])) {
                foreach ($groupData['modules'] as $moduleData) {
                    Module::where('id', $moduleData['id'])->update([
                        'sort_number' => $moduleData['sort_number'],
                        'module_group_id' => $groupData['id']
                    ]);
                }
            }
        }

        return back()->with('success', 'Navigation order updated successfully.');
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
            'code' => 'required|string|max:10|unique:modules,code,' . $module->id,
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
