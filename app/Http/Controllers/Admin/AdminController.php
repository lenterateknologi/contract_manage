<?php

namespace App\Http\Controllers\Admin;

use App\Exports\UsersExport;
use App\Http\Actions\Role\RoleAccessAction;
use App\Http\Controllers\Controller;
use App\Http\Queries\Master\OrganizationQuery;
use App\Http\Queries\Master\UserQuery;
use App\Http\Requests\Common\ImportFileRequest;
use App\Http\Requests\Role\ReorderRoleNavigationRequest;
use App\Http\Requests\Role\StoreRoleRequest;
use App\Http\Requests\Role\UpdateRoleAccessRequest;
use App\Http\Requests\Role\UpdateRoleRequest;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Imports\UsersImport;
use App\Models\AccessModule;
use App\Models\Company;
use App\Models\CompanyGroup;
use App\Models\Department;
use App\Models\Division;
use App\Models\JobLevel;
use App\Models\JobLevelGroup;
use App\Models\JobTitle;
use App\Models\Location;
use App\Models\Module;
use App\Models\ModuleGroup;
use App\Models\OrganizationGroup;
use App\Models\Region;
use App\Models\Role;
use App\Models\RoleModuleGroup;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use OpenApi\Attributes as OA;

class AdminController extends Controller
{
    public function __construct(
        protected UserQuery $userQuery,
        protected OrganizationQuery $organizationQuery,
    ) {}

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
        $query = $this->userQuery->list($request);

        if ($request->wantsJson()) {
            return response()->json([
                'users' => $query->orderBy('name')->paginate($request->input('per_page', 15)),
                'roles' => Role::orderBy('name')->get(),
                'departments' => Department::orderBy('name')->get(),
                'companies' => Company::with(['group', 'region'])->orderBy('name')->get(),
            ]);
        }

        return Inertia::render('admin/Index', [
            'currentView' => 'users',
            'users' => $query->orderBy('name')->paginate($request->input('per_page', 15))->withQueryString(),
            'roles' => Role::orderBy('name')->get(),
            'departments' => Department::orderBy('name')->get(),
            'divisions' => Division::orderBy('name')->get(),
            'companies' => Company::with(['group', 'region'])->orderBy('name')->get(),
            'filters' => $request->only(['search', 'role', 'division_id', 'department_id', 'company_id']),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Manajemen User', 'href' => route('core.index', 'users'), 'description' => 'Kelola akses dan profil pengguna sistem.', 'icon' => 'Users'],
            ],
        ]);
    }

    public function members(Request $request)
    {
        if ($request->has('refresh')) {
            Cache::forget('admin_members_tree_users_v2');
            Cache::forget('admin_members_tree_users_v3');
            Cache::forget('admin_members_divisions');
            Cache::forget('admin_members_departments');
            Cache::forget('admin_members_subdepartments');
            Cache::forget('admin_members_sections');
            Cache::forget('admin_members_dept_traffic');
            Cache::forget('admin_members_company_groups');
            Cache::forget('admin_members_organization_groups');
            Cache::forget('admin_members_regions');
            Cache::forget('admin_members_locations');
            Cache::forget('admin_members_companies');
            Cache::forget('admin_members_job_titles');
            Cache::forget('admin_members_job_levels');
            Cache::forget('admin_members_job_level_groups');
            Cache::forget('admin_members_roles');
        }

        // Cache master data and users payload for high performance (5 min TTL)
        $users = Cache::remember('admin_members_tree_users_v4', 300, function () {
            $allDepts = Department::query()->where('is_used', true)->get(['id', 'name', 'code', 'idorg_level', 'org_level_name', 'org_group_name', 'is_used']);
            $deptByCode = $allDepts->keyBy('code');
            $deptById = $allDepts->keyBy('id');

            return User::query()
                ->where('is_active', true)
                ->where('is_used', true)
                ->select([
                    'id', 'name', 'email', 'nik', 'code', 'image_src', 'is_used', 'idemployee', 'idreporting_to', 'reporting_to',
                    'company_group_id', 'region_id', 'location_id', 'company_id', 'division_id', 'department_id', 'job_position_id', 'job_level_id', 'role_id'
                ])
                ->with([
                    'companyGroup:id,name,code,is_used',
                    'region:id,name,code,is_used',
                    'location:id,name,code,is_used',
                    'company:id,name,code,is_used',
                    'division:id,name,code',
                    'jobTitle:id,name,code,is_used',
                    'jobLevel.jobLevelGroup:id,name,code,is_used',
                    'roleRelation:id,name',
                ])
                ->orderBy('name')
                ->get()
                ->map(function ($u) use ($deptById, $deptByCode) {
                    $dept = $deptById->get($u->department_id);
                    $deptName = $dept?->name ?? 'No Department';
                    $subName = null;
                    $subId = null;
                    $secName = null;
                    $secId = null;

                    if ($dept) {
                        if ($dept->idorg_level >= 7) {
                            $secName = $dept->name;
                            $secId = $dept->id;
                            if (strlen((string) $dept->code) >= 15) {
                                $subCode = substr($dept->code, 0, 11) . '0000';
                                $sub = $deptByCode->get($subCode);
                                $subName = $sub?->name;
                                $subId = $sub?->id;
                                $deptCode = substr($dept->code, 0, 8) . '0000000';
                                $parentDept = $deptByCode->get($deptCode);
                                $deptName = $parentDept?->name ?? $subName ?? $dept->name;
                            }
                        } elseif ($dept->idorg_level == 6) {
                            $subName = $dept->name;
                            $subId = $dept->id;
                            if (strlen((string) $dept->code) >= 15) {
                                $deptCode = substr($dept->code, 0, 8) . '0000000';
                                $parentDept = $deptByCode->get($deptCode);
                                $deptName = $parentDept?->name ?? $dept->name;
                            }
                        }
                    }

                    return [
                        'id' => $u->id,
                        'name' => $u->name,
                        'email' => $u->email,
                        'nik' => $u->nik ?? $u->code ?? '-',
                        'is_used' => (bool) $u->is_used,
                        'group_id' => $u->company_group_id,
                        'group_name' => $u->companyGroup?->name ?? 'No Group',
                        'region_id' => $u->region_id,
                        'region_name' => $u->region?->name ?? 'No Region',
                        'location_id' => $u->location_id,
                        'location_name' => $u->location?->name ?? 'No Location',
                        'company_id' => $u->company_id,
                        'company_name' => $u->company?->name ?? 'No Company',
                        'division_id' => $u->division_id,
                        'division_name' => $u->division?->name ?? $u->division_name ?? 'No Division',
                        'department_id' => $u->department_id,
                        'department_name' => $deptName,
                        'subdepartment_id' => $subId,
                        'subdepartment_name' => $subName,
                        'section_id' => $secId,
                        'section_name' => $secName,
                        'org_group_name' => $dept?->org_group_name ?? 'No Org Group',
                        'job_title_id' => $u->job_position_id,
                        'job_title_name' => $u->jobTitle?->name ?? $u->jobtitle_name ?? 'No Job Title',
                        'job_level_id' => $u->job_level_id,
                        'job_level_name' => $u->jobLevel?->name ?? $u->joblevel_name ?? 'No Job Level',
                        'job_level_code' => $u->jobLevel?->code ?? '',
                        'job_level_rank' => $u->jobLevel?->idjoblevel ?? 0,
                        'hierarchy_tier' => $u->jobLevel?->hierarchy_tier,
                        'tier_name' => $u->jobLevel?->tier_name,
                        'job_level_group_id' => $u->jobLevel?->job_level_group_id,
                        'job_level_group_name' => $u->jobLevel?->jobLevelGroup?->name ?? $u->jobLevel?->group_name ?? 'No Group Level',
                        'role_name' => $u->roleRelation?->name ?? 'Member',
                        'reporting_to' => $u->reporting_to,
                        'idreporting_to' => $u->idreporting_to,
                    ];
                });
        });

        $divisions = Cache::remember('admin_members_divisions', 600, fn () => Division::query()->orderBy('name')->get(['id', 'name', 'code']));
        $departments = Cache::remember('admin_members_departments', 600, fn () => Department::query()->where('is_used', true)->orderBy('name')->get(['id', 'name', 'code', 'company_id', 'is_used']));
        $subdepartments = Cache::remember('admin_members_subdepartments', 600, fn () => Department::query()->where('idorg_level', 6)->where('is_used', true)->orderBy('name')->get(['id', 'name', 'code', 'is_used']));
        $sections = Cache::remember('admin_members_sections', 600, fn () => Department::query()->where('idorg_level', '>=', 7)->where('is_used', true)->orderBy('name')->get(['id', 'name', 'code', 'is_used']));
        $departmentTraffic = Cache::remember('admin_members_dept_traffic', 300, fn () => $this->organizationQuery->getDepartmentTraffic());

        $companyGroups = Cache::remember('admin_members_company_groups', 600, fn () => CompanyGroup::query()->where('is_used', true)->orderBy('name')->get(['id', 'name', 'code', 'is_used']));
        $organizationGroups = Cache::remember('admin_members_organization_groups', 600, fn () => OrganizationGroup::query()->where('is_used', true)->orderBy('name')->get(['id', 'name', 'code', 'is_used']));
        $regions = Cache::remember('admin_members_regions', 600, fn () => Region::query()->where('is_used', true)->orderBy('name')->get(['id', 'name', 'code', 'is_used']));
        $locations = Cache::remember('admin_members_locations', 600, fn () => Location::query()->where('is_used', true)->orderBy('name')->get(['id', 'name', 'code', 'is_used']));
        $companies = Cache::remember('admin_members_companies', 600, fn () => Company::query()->where('is_used', true)->orderBy('name')->get(['id', 'name', 'code', 'company_group_id', 'region_id', 'is_used']));
        $jobTitles = Cache::remember('admin_members_job_titles', 600, fn () => JobTitle::query()->where('is_used', true)->orderBy('name')->get(['id', 'name', 'code', 'job_level_id', 'is_used']));
        $jobLevels = Cache::remember('admin_members_job_levels', 600, fn () => JobLevel::query()->where('is_used', true)->orderBy('name')->get(['id', 'idjoblevel', 'name', 'code', 'hierarchy_tier', 'tier_name', 'job_level_group_id', 'group_name', 'is_used']));
        $jobLevelGroups = Cache::remember('admin_members_job_level_groups', 600, fn () => JobLevelGroup::query()->where('is_used', true)->orderBy('name')->get(['id', 'name', 'code', 'is_used']));
        $roles = Cache::remember('admin_members_roles', 600, fn () => Role::query()->orderBy('name')->get(['id', 'name']));

        return Inertia::render('admin/Index', [
            'currentView' => 'members',
            'users' => $users,
            'roles' => $roles,
            'divisions' => $divisions,
            'departments' => $departments,
            'subdepartments' => $subdepartments,
            'sections' => $sections,
            'companyGroups' => $companyGroups,
            'organizationGroups' => $organizationGroups,
            'regions' => $regions,
            'locations' => $locations,
            'companies' => $companies,
            'jobTitles' => $jobTitles,
            'jobLevels' => $jobLevels,
            'jobLevelGroups' => $jobLevelGroups,
            'departmentTraffic' => $departmentTraffic,
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Struktur & Anggota Organisasi', 'href' => route('admin.members'), 'description' => 'Visualisasi hierarki organisasi dan pemetaan anggota.', 'icon' => 'Network'],
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
            return response()->json($query->orderBy('name')->paginate($request->input('per_page', 15)));
        }

        return Inertia::render('admin/Index', [
            'currentView' => 'roles',
            'roles' => $query->orderBy('name')->paginate($request->input('per_page', 15))->withQueryString(),
            'filters' => $request->only(['search', 'created_from', 'created_to']),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Manajemen Role', 'href' => route('core.index', 'roles'), 'description' => 'Pengaturan peran dan otorisasi.', 'icon' => 'ShieldCheck'],
            ],
        ]);
    }

    public function storeRole(StoreRoleRequest $request)
    {
        $role = Role::create($request->validated());

        if ($request->wantsJson()) {
            return response()->json($role, 201);
        }

        return back()->with('success', 'Role berhasil dibuat.');
    }

    public function updateRole(UpdateRoleRequest $request, Role $role)
    {
        $role->update($request->validated());

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
            return redirect()->route('core.index', 'roles');
        }

        return $this->roleConfig($role, $request, 'access');
    }

    public function navigationMapping(Request $request, ?Role $role = null)
    {
        $role = $role ?? Role::orderBy('name')->first();
        if (! $role) {
            return redirect()->route('core.index', 'roles');
        }

        return $this->roleConfig($role, $request, 'navigation');
    }

    public function roleConfig(Role $role, Request $request, ?string $forcedTab = null, ?RoleAccessAction $action = null)
    {
        $action = $action ?? app(RoleAccessAction::class);
        $configData = $action->getRoleConfigData($role);

        return Inertia::render('roles/Config', [
            ...$configData,
            'defaultTab' => $forcedTab ?? $request->query('tab', 'access'),
            'isIndependent' => ! is_null($forcedTab),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Manajemen Role', 'href' => route('core.index', 'roles'), 'icon' => 'ShieldCheck'],
                ['title' => 'Konfigurasi Role', 'href' => '#', 'description' => "Pengaturan menyeluruh untuk role {$role->name}.", 'icon' => 'Settings2'],
            ],
        ]);
    }

    public function updateRoleAccess(UpdateRoleAccessRequest $request, Role $role, RoleAccessAction $action)
    {
        $action->updateRoleAccess($role, $request->validated()['accesses']);

        return back()->with('success', 'Role access berhasil diperbarui.');
    }

    public function reorderRoleNavigation(ReorderRoleNavigationRequest $request, Role $role, RoleAccessAction $action)
    {
        $action->reorderRoleNavigation($role, $request->validated()['groups']);

        return back();
    }

    /**
     * Remove a group from a role's navigation mapping (not a global delete).
     */
    public function removeNavGroup(Role $role, ModuleGroup $group): RedirectResponse
    {
        // Disable permissions and group for all modules in this group for this role
        AccessModule::where('role_id', $role->id)
            ->where('module_group_id', $group->id)
            ->update([
                'can_read' => false,
                'can_create' => false,
                'can_update' => false,
                'can_delete' => false,
                'can_approve' => false,
                'can_bulk_approve' => false,
                'can_bulk_delete' => false,
                'module_group_id' => null,
                'sequence' => null,
            ]);

        // Remove the role-group sequence record
        RoleModuleGroup::where('role_id', $role->id)
            ->where('module_group_id', $group->id)
            ->delete();

        return back()->with('success', 'Grup berhasil dilepas dari navigasi role ini.');
    }

    /**
     * Remove a module from a role's navigation mapping (not a global delete).
     */
    public function removeNavModule(Role $role, Module $module): RedirectResponse
    {
        AccessModule::where('role_id', $role->id)
            ->where('module_id', $module->id)
            ->update([
                'can_read' => false,
                'can_create' => false,
                'can_update' => false,
                'can_delete' => false,
                'can_approve' => false,
                'can_bulk_approve' => false,
                'can_bulk_delete' => false,
                'module_group_id' => null,
                'sequence' => null,
            ]);

        return back()->with('success', 'Modul berhasil dilepas dari navigasi role ini.');
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

    public function importUsers(ImportFileRequest $request)
    {
        try {
            Excel::import(new UsersImport, $request->file('file'));

            return back()->with('success', 'Data karyawan berhasil diimpor.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal mengimpor data: '.$e->getMessage()]);
        }
    }
}
