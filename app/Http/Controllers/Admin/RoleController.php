<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\RoleAccessAction;
use App\Http\Controllers\Controller;
use App\Models\Module;
use App\Models\ModuleGroup;
use App\Models\Role;
use Illuminate\Http\Request;
use Inertia\Inertia;
use OpenApi\Attributes as OA;

class RoleController extends Controller
{
    #[OA\Get(
        path: '/api/admin/roles',
        summary: 'Get list of roles',
        tags: ['Admin'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(response: 200, description: 'List of roles'),
        ],
    )]
    public function index(Request $request)
    {
        $query = Role::query()
            ->when($request->search, function ($q, $search) {
                $search = strtolower($search);
                $q->where(function ($qq) use ($search) {
                    $qq->where(\Illuminate\Support\Facades\DB::raw('LOWER(name)'), 'like', "%{$search}%")
                        ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(description)'), 'like', "%{$search}%");
                });
            })
            ->when($request->created_from, function ($q, $from) {
                $q->whereDate('created_at', '>=', $from);
            })
            ->when($request->created_to, function ($q, $to) {
                $q->whereDate('created_at', '<=', $to);
            });

        if ($request->wantsJson()) {
            return response()->json($query->orderBy('name')->paginate($request->input('per_page', 10)));
        }

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

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:m_roles,name',
            'description' => 'nullable|string',
        ]);

        $role = Role::create($data);

        if ($request->wantsJson()) {
            return response()->json($role, 201);
        }

        return back()->with('success', 'Role berhasil dibuat.');
    }

    public function update(Request $request, Role $role)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:m_roles,name,' . $role->id,
            'description' => 'nullable|string',
        ]);

        $role->update($data);

        if ($request->wantsJson()) {
            return response()->json($role);
        }

        return back()->with('success', 'Role berhasil diperbarui.');
    }

    public function destroy(Request $request, Role $role)
    {
        $role->delete();

        if ($request->wantsJson()) {
            return response()->json(['message' => 'Role berhasil dihapus.']);
        }

        return back()->with('success', 'Role berhasil dihapus.');
    }

    public function bulkDestroy(Request $request)
    {
        $ids = $request->input('ids', []);
        if (empty($ids)) {
            return back();
        }

        Role::whereIn('id', $ids)->delete();

        return back()->with('success', count($ids) . ' role berhasil dihapus.');
    }

    public function config(Role $role, Request $request)
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
        $groups = ModuleGroup::select('m_module_groups.*')
            ->leftJoin('m_role_module_groups', function ($join) use ($role) {
                $join->on('m_module_groups.id', '=', 'm_role_module_groups.module_group_id')
                    ->where('m_role_module_groups.role_id', '=', $role->id);
            })
            ->orderByRaw('COALESCE(m_role_module_groups.sequence, 9999) ASC')
            ->orderBy('m_module_groups.name')
            ->get()
            ->map(function ($group) use ($role) {
                $group->modules = Module::select('m_modules.*')
                    ->join('m_access_modules', 'm_modules.id', '=', 'm_access_modules.module_id')
                    ->where('m_access_modules.role_id', $role->id)
                    ->where('m_access_modules.module_group_id', $group->id)
                    ->where('m_access_modules.can_read', true)
                    ->orderByRaw('COALESCE(m_access_modules.sequence, 9999) ASC')
                    ->orderBy('m_modules.name')
                    ->get();

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

    public function updateAccess(Request $request, Role $role, RoleAccessAction $action)
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

        $action->updateRoleAccess($role, $data['accesses']);

        return back()->with('success', 'Role access berhasil diperbarui.');
    }

    public function reorderNavigation(Request $request, Role $role, RoleAccessAction $action)
    {
        $data = $request->validate([
            'role_id' => 'required|uuid|exists:m_roles,id',
            'groups' => 'required|array',
            'groups.*.id' => 'required|uuid|exists:m_module_groups,id',
            'groups.*.modules' => 'nullable|array',
            'groups.*.modules.*.id' => 'required|uuid|exists:m_modules,id',
        ]);

        $action->reorderRoleNavigation($role, $data['groups']);

        return back();
    }
}
