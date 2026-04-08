<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\ContractType;
use App\Models\Workflow;
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

    public function destroyRole(\App\Models\Role $role)
    {
        // Prevent deleting core roles if needed, but for now just delete
        $role->delete();
        return back()->with('success', 'Role deleted successfully.');
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
}
