<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\RoleAccessAction;
use App\Exports\UsersExport;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Imports\UsersImport;
use App\Models\Contract;
use App\Models\Department;
use App\Models\Module;
use App\Models\ModuleGroup;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use OpenApi\Attributes as OA;

class AdminController extends Controller
{
    #[OA\Get(
        path: '/api/admin/users',
        summary: 'Get list of users',
        tags: ['Admin'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(response: 200, description: 'List of users'),
        ],
    )]
    public function users(Request $request)
    {
        $query = User::with('department')
            ->when($request->search, function ($q, $search) {
                $search = strtolower($search);
                $q->where(function ($qq) use ($search) {
                    $qq->where(DB::raw('LOWER(name)'), 'like', "%{$search}%")
                        ->orWhere(DB::raw('LOWER(email)'), 'like', "%{$search}%")
                        ->orWhere(DB::raw('LOWER(username)'), 'like', "%{$search}%");
                });
            })
            ->when($request->role, function ($q, $role) {
                $q->whereIn('role', (array) $role);
            })
            ->when($request->department_id, function ($q, $deptId) {
                $q->whereIn('department_id', (array) $deptId);
            });

        if ($request->wantsJson()) {
            return response()->json([
                'users' => $query->orderBy('name')->paginate($request->input('per_page', 10)),
                'roles' => Role::orderBy('name')->get(),
                'departments' => Department::orderBy('name')->get(),
            ]);
        }

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

    public function members(Request $request)
    {
        $users = User::orderBy('name')->get();
        $departments = Department::orderBy('name')->get();

        $departmentTraffic = Department::orderBy('name')
            ->get()
            ->map(function ($dept) {
                $incoming = Contract::where(function ($q) use ($dept) {
                    $q->whereHas('initiator', fn ($sq) => $sq->where('department_id', $dept->id))
                        ->orWhere(function ($sq) use ($dept) {
                            $sq->whereNull('initiated_by_id')
                                ->whereHas('creator', fn ($ssq) => $ssq->where('department_id', $dept->id));
                        });
                })
                    ->whereIn('status', ['in_review', 'revision'])
                    ->count();

                $outgoing = Contract::where(function ($q) use ($dept) {
                    $q->whereHas('initiator', fn ($sq) => $sq->where('department_id', $dept->id))
                        ->orWhere(function ($sq) use ($dept) {
                            $sq->whereNull('initiated_by_id')
                                ->whereHas('creator', fn ($ssq) => $ssq->where('department_id', $dept->id));
                        });
                })
                    ->whereIn('status', ['approved', 'locked', 'archived'])
                    ->count();

                return [
                    'department_id' => $dept->id,
                    'department_name' => $dept->name,
                    'incoming_count' => $incoming,
                    'outgoing_count' => $outgoing,
                    'member_count' => User::where('department_id', $dept->id)->count(),
                ];
            })
            ->values()
            ->all();

        return Inertia::render('admin/index', [
            'currentView' => 'members',
            'users' => $users,
            'departments' => $departments,
            'departmentTraffic' => $departmentTraffic,
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Anggota Divisi', 'href' => route('admin.members'), 'description' => 'Kelola dan lihat anggota berdasarkan divisi/departemen.', 'icon' => 'Users'],
            ],
        ]);
    }

    #[OA\Get(
        path: '/api/admin/roles',
        summary: 'Get list of roles',
        tags: ['Admin'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(response: 200, description: 'List of roles'),
        ],
    )]
    public function roles(Request $request)
    {
        $query = Role::query()
            ->when($request->search, function ($q, $search) {
                $search = strtolower($search);
                $q->where(function ($qq) use ($search) {
                    $qq->where(DB::raw('LOWER(name)'), 'like', "%{$search}%")
                        ->orWhere(DB::raw('LOWER(description)'), 'like', "%{$search}%");
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

    public function storeRole(Request $request)
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

    public function updateRole(Request $request, Role $role)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:m_roles,name,'.$role->id,
            'description' => 'nullable|string',
        ]);

        $role->update($data);

        if ($request->wantsJson()) {
            return response()->json($role);
        }

        return back()->with('success', 'Role berhasil diperbarui.');
    }

    public function destroyRole(Request $request, Role $role)
    {
        // Prevent deleting core roles if needed, but for now just delete
        $role->delete();

        if ($request->wantsJson()) {
            return response()->json(['message' => 'Role berhasil dihapus.']);
        }

        return back()->with('success', 'Role berhasil dihapus.');
    }

    public function bulkDestroyRole(Request $request)
    {
        $ids = $request->input('ids', []);
        if (empty($ids)) {
            return back();
        }

        Role::whereIn('id', $ids)->delete();

        return back()->with('success', count($ids).' role berhasil dihapus.');
    }

    public function accessMapping(Request $request, ?Role $role = null)
    {
        $role = $role ?? Role::orderBy('name')->first();
        if (! $role) {
            return redirect()->route('admin.roles');
        }

        return $this->roleConfig($role, $request, 'access');
    }

    public function navigationMapping(Request $request, ?Role $role = null)
    {
        $role = $role ?? Role::orderBy('name')->first();
        if (! $role) {
            return redirect()->route('admin.roles');
        }

        return $this->roleConfig($role, $request, 'navigation');
    }

    public function roleConfig(Role $role, Request $request, ?string $forcedTab = null)
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

        $allRoles = Role::orderBy('name')->get();

        return Inertia::render('admin/role-config', [
            'role' => $role,
            'roles' => $allRoles,
            'modules' => $modules,
            'navigation' => $groups,
            'allModules' => $allModules,
            'defaultTab' => $forcedTab ?? $request->query('tab', 'access'),
            'isIndependent' => ! is_null($forcedTab),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Manajemen Role', 'href' => route('admin.roles'), 'icon' => 'ShieldCheck'],
                ['title' => 'Konfigurasi Role', 'href' => '#', 'description' => "Pengaturan menyeluruh untuk role {$role->name}.", 'icon' => 'Settings2'],
            ],
        ]);
    }

    public function updateRoleAccess(Request $request, Role $role, RoleAccessAction $action)
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

    public function reorderRoleNavigation(Request $request, Role $role, RoleAccessAction $action)
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

    public function storeUser(StoreUserRequest $request)
    {
        $data = $request->validated();

        $data['password'] = bcrypt($data['password']);

        $user = User::create($data);

        if ($request->wantsJson()) {
            return response()->json($user, 201);
        }

        return back()->with('success', 'User berhasil dibuat.');
    }

    /**
     * Update user details.
     *
     * @return RedirectResponse|JsonResponse
     */
    public function updateUser(UpdateUserRequest $request, User $user)
    {
        $data = $request->validated();

        if (empty($data['password'])) {
            unset($data['password']);
        } else {
            $data['password'] = bcrypt($data['password']);
        }

        $user->update($data);

        if ($request->wantsJson()) {
            return response()->json($user);
        }

        return back()->with('success', 'User berhasil diperbarui.');
    }

    public function destroyUser(Request $request, User $user)
    {
        if ($user->id === Auth::id()) {
            abort(403, 'Tidak dapat menghapus diri sendiri.');
        }
        $user->delete();

        if ($request->wantsJson()) {
            return response()->json(['message' => 'User berhasil dihapus.']);
        }

        return back()->with('success', 'User berhasil dihapus.');
    }

    public function bulkDestroyUser(Request $request)
    {
        $ids = $request->input('ids', []);
        if (empty($ids)) {
            return back();
        }

        // Prevent deleting yourself
        if (in_array(Auth::id(), $ids)) {
            return back()->with('error', 'Tidak dapat menghapus diri sendiri.in bulk operation.');
        }

        User::whereIn('id', $ids)->delete();

        return back()->with('success', count($ids).' pengguna berhasil dihapus.');
    }

    public function exportUsers()
    {
        return Excel::download(new UsersExport, 'data_karyawan_'.date('Ymd').'.xlsx');
    }

    public function importUsers(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls',
        ]);

        try {
            Excel::import(new UsersImport, $request->file('file'));

            return back()->with('success', 'Data karyawan berhasil diimpor.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal mengimpor data: '.$e->getMessage()]);
        }
    }
}
