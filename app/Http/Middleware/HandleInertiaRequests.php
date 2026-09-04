<?php

namespace App\Http\Middleware;

use App\Models\AccessModule;
use App\Models\ContractFilterTemplate;
use App\Models\DashboardType;
use App\Models\Module;
use App\Models\Role;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    public function handle(Request $request, \Closure $next)
    {
        $response = parent::handle($request, $next);

        $response->headers->set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
        $response->headers->set('Pragma', 'no-cache');
        $response->headers->set('Expires', 'Sat, 01 Jan 1900 00:00:00 GMT');

        return $response;
    }

    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');
        $hasSession = $request->hasSession();
        $isImpersonating = $hasSession && $request->session()->has('impersonator_id');
        $impersonatorId = $isImpersonating ? $request->session()->get('impersonator_id') : null;
        $impersonatorUser = $impersonatorId ? \App\Models\User::find($impersonatorId) : null;

        return array_merge(parent::share($request), [
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user() ? array_merge($request->user()->toArray(), [
                    'initials' => $request->user()->initials,
                    'role' => $request->user()->role,
                    'can_change_company_group' => $request->user()->can_change_company_group,
                    'allowed_company_groups' => $request->user()->allowed_company_groups,
                    'can_change_region' => $request->user()->can_change_region,
                    'allowed_regions' => $request->user()->allowed_regions,
                    'can_change_company' => $request->user()->can_change_company,
                    'allowed_companies' => $request->user()->allowed_companies,
                    'can_change_division' => $request->user()->can_change_division,
                    'allowed_divisions' => $request->user()->allowed_divisions,
                    'can_change_department' => $request->user()->can_change_department,
                    'allowed_departments' => $request->user()->allowed_departments,
                    'can_create_on_behalf' => (bool) $request->user()->can_create_on_behalf,
                ]) : null,
                'permissions' => $this->getUserPermissions($request),
                'impersonation' => [
                    'is_impersonating' => $isImpersonating,
                    'impersonator' => $impersonatorUser ? [
                        'id' => $impersonatorUser->id,
                        'name' => $impersonatorUser->name,
                        'email' => $impersonatorUser->email,
                        'nik' => $impersonatorUser->nik ?? $impersonatorUser->username,
                        'role' => $impersonatorUser->role,
                    ] : null,
                    'can_impersonate' => $request->user() ? ($request->user()->isAdmin() || $isImpersonating) : false,
                ],
            ],
            'sidebarNavGroups' => $this->getSidebarNavGroups($request),
            'povOptions' => $this->getPovOptions($request),
            'upload_configs' => config('uploads.categories'),
            'flash' => [
                'success' => $hasSession ? $request->session()->get('success') : null,
                'error' => $hasSession ? ($request->session()->get('error') ?? ($request->session()->get('errors') ? collect($request->session()->get('errors')->getBag('default')->get('error'))->first() : null)) : null,
                'danger' => $hasSession ? $request->session()->get('danger') : null,
                'info' => $hasSession ? $request->session()->get('info') : null,
            ],
        ]);
    }

    protected function getPovOptions(Request $request): ?array
    {
        $user = $request->user();
        if (! $user) {
            return null;
        }

        $isAdmin = in_array($user->role, ['Admin', 'Super Admin']) || $user->is_admin || ($request->hasSession() && $request->session()->has('impersonator_id'));
        if (! $isAdmin) {
            return null;
        }

        return Cache::remember('pov_options_data', now()->addMinutes(10), function () {
            $roles = Role::orderBy('name')->get()->map(function ($role) {
                $allowedRoutes = Module::where('m_modules.showed_as_menu', true)
                    ->join('m_access_modules', 'm_modules.id', '=', 'm_access_modules.module_id')
                    ->where('m_access_modules.role_id', $role->id)
                    ->where('m_access_modules.can_read', true)
                    ->pluck('m_modules.route')
                    ->all();

                $isSuper = $role->name === 'Super Admin';

                return [
                    'id' => (string) $role->id,
                    'name' => $role->name,
                    'label' => $role->name,
                    'badge' => $isSuper ? 'All Access' : 'Role POV',
                    'description' => $role->description ?: ($isSuper ? 'Akses penuh seluruh modul sistem' : "Simulasi hak akses menu {$role->name}"),
                    'allowed_routes' => $isSuper ? null : $allowedRoutes,
                    'can_create_on_behalf' => (bool) $role->can_create_on_behalf,
                ];
            })->values()->all();

            $dashboardTypes = DashboardType::orderBy('name')->get()->map(function ($d) {
                $activeTabs = [];
                if ($d->show_overview) $activeTabs[] = 'Ringkasan';
                if ($d->show_workload) $activeTabs[] = 'Beban Kerja';
                if ($d->show_master_data) $activeTabs[] = 'Master Data';

                $badge = empty($activeTabs) ? 'Tanpa Tab' : implode(' + ', $activeTabs);

                return [
                    'id' => (string) $d->id,
                    'name' => $d->name,
                    'label' => $d->name,
                    'badge' => $badge,
                    'description' => $d->description ?: 'Konfigurasi visibilitas tab dashboard',
                    'show_overview' => (bool) $d->show_overview,
                    'show_workload' => (bool) $d->show_workload,
                    'show_master_data' => (bool) $d->show_master_data,
                ];
            })->values()->all();

            $filterTemplates = ContractFilterTemplate::orderBy('name')->get()->map(function ($t) {
                $dimCount = 0;
                if ($t->can_change_company_group) $dimCount++;
                if ($t->can_change_region) $dimCount++;
                if ($t->can_change_company) $dimCount++;
                if ($t->can_change_division) $dimCount++;
                if ($t->can_change_department) $dimCount++;

                $badge = $dimCount === 5 ? 'Open All' : "{$dimCount}/5 Dimensi";

                return [
                    'id' => (string) $t->id,
                    'name' => $t->name,
                    'label' => $t->name,
                    'badge' => $badge,
                    'description' => "Template filter: {$t->name}",
                    'can_change_company_group' => (bool) $t->can_change_company_group,
                    'can_change_region' => (bool) $t->can_change_region,
                    'can_change_company' => (bool) $t->can_change_company,
                    'can_change_division' => (bool) $t->can_change_division,
                    'can_change_department' => (bool) $t->can_change_department,
                ];
            })->values()->all();

            return [
                'roles' => $roles,
                'dashboard_types' => $dashboardTypes,
                'filter_templates' => $filterTemplates,
            ];
        });
    }

    protected function getUserPermissions(Request $request): array
    {
        if (! $request->user()) {
            return [];
        }

        $roleName = $request->user()->role;
        if (! $roleName) {
            return [];
        }

        return Cache::remember("user_permissions_{$roleName}", now()->addMinutes(10), function () use ($roleName) {
            $role = Role::firstWhere('name', $roleName);
            if (! $role) {
                return [];
            }

            return AccessModule::where('role_id', $role->id)
                ->join('m_modules', 'm_access_modules.module_id', '=', 'm_modules.id')
                ->select('m_modules.identifier as code', 'can_read', 'can_create', 'can_update', 'can_delete', 'can_approve', 'can_bulk_approve', 'can_bulk_delete')
                ->get()
                ->keyBy('code')
                ->map(fn ($item) => [
                    'read' => (bool) $item->can_read,
                    'create' => (bool) $item->can_create,
                    'update' => (bool) $item->can_update,
                    'delete' => (bool) $item->can_delete,
                    'approve' => (bool) ($item->can_approve ?? false),
                    'bulk_approve' => (bool) ($item->can_bulk_approve ?? false),
                    'bulk_delete' => (bool) ($item->can_bulk_delete ?? false),
                ])
                ->all();
        });
    }

    protected function getSidebarNavGroups(Request $request): array
    {
        if (! $request->user()) {
            return [];
        }

        $roleName = $request->user()->role;
        $userId = $request->user()->id;
        if (! $roleName) {
            return [];
        }

        return Cache::remember("sidebar_nav_groups_{$roleName}_{$userId}", now()->addSeconds(30), function () use ($request, $roleName, $userId) {
            $role = Role::firstWhere('name', $roleName);
            if (! $role) {
                return [];
            }

            $modules = Module::where('m_modules.showed_as_menu', true)
                ->join('m_access_modules', 'm_modules.id', '=', 'm_access_modules.module_id')
                ->join('m_module_groups', 'm_access_modules.module_group_id', '=', 'm_module_groups.id')
                ->leftJoin('m_role_module_groups', function ($join) use ($role) {
                    $join->on('m_module_groups.id', '=', 'm_role_module_groups.module_group_id')
                        ->where('m_role_module_groups.role_id', '=', $role->id);
                })
                ->where('m_access_modules.role_id', $role->id)
                ->where('m_access_modules.can_read', true)
                ->select(
                    'm_modules.id',
                    'm_modules.name',
                    'm_modules.route',
                    'm_modules.icon',
                    'm_modules.description',
                    'm_module_groups.name as group_title',
                    'm_module_groups.icon as group_icon',
                    'm_role_module_groups.sequence as group_sequence',
                    'm_access_modules.sequence as module_sequence',
                )
                ->get();

            // compute is_used AND is_active counts for Portal master data
            $getPortalCount = function (string $table): string {
                $hasIsUsed = Schema::hasColumn($table, 'is_used');
                $hasIsActive = Schema::hasColumn($table, 'is_active');

                $condition = '1=1';
                if ($hasIsUsed && $hasIsActive) {
                    $condition = 'is_used = true AND is_active = true';
                } elseif ($hasIsUsed) {
                    $condition = 'is_used = true';
                } elseif ($hasIsActive) {
                    $condition = 'is_active = true';
                }

                $res = DB::table($table)
                    ->whereNull('deleted_at')
                    ->selectRaw("COUNT(*) as total, COUNT(CASE WHEN {$condition} THEN 1 END) as used")
                    ->first();

                return ($res->used ?? 0).'/'.($res->total ?? 0);
            };

            $portalUsedCounts = [
                '/admin/core/departments' => $getPortalCount('m_departments'),
                '/admin/core/company-groups' => $getPortalCount('m_company_groups'),
                '/admin/core/companies' => $getPortalCount('m_companies'),
                '/admin/core/users' => $getPortalCount('m_users'),
                '/admin/core/regions' => $getPortalCount('m_regions'),
                '/admin/core/business-units' => $getPortalCount('m_business_units'),
                '/admin/core/locations' => $getPortalCount('m_locations'),
                '/admin/core/job-levels' => $getPortalCount('m_job_levels'),
                '/admin/core/job-titles' => $getPortalCount('m_job_titles'),
            ];

            $userId = $request->user()?->id;

            // Dynamic counts for Pengajuan modules & children
            $contractCounts = (function () use ($userId) {
                $allTypes = DB::table('m_contract_types')->whereNull('deleted_at')->get();

                $getDescendantIds = function ($parentId) use (&$getDescendantIds, $allTypes) {
                    if (! $parentId) {
                        return [];
                    }
                    $children = $allTypes->where('parent_id', $parentId)->pluck('id')->all();
                    $descendants = $children;
                    foreach ($children as $childId) {
                        $descendants = array_merge($descendants, $getDescendantIds($childId));
                    }

                    return array_values(array_unique(array_merge([$parentId], $descendants)));
                };

                $roots = $allTypes->whereNull('parent_id');
                $kontrakParent = $roots->first(fn ($p) => strtoupper($p->code) === 'A-1' || (stripos($p->name, 'non') === false && stripos($p->name, 'kontrak') !== false));
                $nonKontrakParent = $roots->first(fn ($p) => strtoupper($p->code) === 'A-2' || stripos($p->name, 'non') !== false);
                $ndaParent = $roots->first(fn ($p) => strtoupper($p->code) === 'NDA' || stripos($p->name, 'nda') !== false || stripos($p->name, 'kerahasiaan') !== false);

                $kontrakIds = $getDescendantIds($kontrakParent?->id);
                $nonKontrakIds = $getDescendantIds($nonKontrakParent?->id);
                $ndaIds = $getDescendantIds($ndaParent?->id);

                $baseQuery = DB::table('t_contracts')->whereNull('deleted_at')->whereRaw("UPPER(status) != 'DRAFT'");

                $allTotal = (clone $baseQuery)->count();
                $allKontrak = (clone $baseQuery)->where(fn ($q) => $q->whereIn('contract_type_id', $kontrakIds)->orWhereIn('contract_type_parent_id', $kontrakIds))->count();
                $allNonKontrak = (clone $baseQuery)->where(fn ($q) => $q->whereIn('contract_type_id', $nonKontrakIds)->orWhereIn('contract_type_parent_id', $nonKontrakIds))->count();
                $allNda = (clone $baseQuery)->where(fn ($q) => $q->whereIn('contract_type_id', $ndaIds)->orWhereIn('contract_type_parent_id', $ndaIds))->count();

                $myBaseQuery = (clone $baseQuery)->where('created_by', $userId);
                $myTotal = (clone $myBaseQuery)->count();
                $myKontrak = (clone $myBaseQuery)->where(fn ($q) => $q->whereIn('contract_type_id', $kontrakIds)->orWhereIn('contract_type_parent_id', $kontrakIds))->count();
                $myNonKontrak = (clone $myBaseQuery)->where(fn ($q) => $q->whereIn('contract_type_id', $nonKontrakIds)->orWhereIn('contract_type_parent_id', $nonKontrakIds))->count();
                $myNda = (clone $myBaseQuery)->where(fn ($q) => $q->whereIn('contract_type_id', $ndaIds)->orWhereIn('contract_type_parent_id', $ndaIds))->count();

                $pendingApprovalCount = 0;
                $historyApprovalCount = 0;
                if ($userId) {
                    $pendingApprovalCount = DB::table('t_approvals')
                        ->join('t_contracts', 't_approvals.contract_id', '=', 't_contracts.id')
                        ->where('t_approvals.user_id', $userId)
                        ->where('t_approvals.status', 'pending')
                        ->whereNull('t_contracts.deleted_at')
                        ->whereRaw("UPPER(t_contracts.status) != 'DRAFT'")
                        ->whereColumn('t_approvals.workflow_step_id', 't_contracts.workflow_step_id')
                        ->count();

                    $historyApprovalCount = DB::table('t_approvals')
                        ->join('t_contracts', 't_approvals.contract_id', '=', 't_contracts.id')
                        ->where('t_approvals.user_id', $userId)
                        ->whereIn('t_approvals.status', ['approved', 'rejected', 'revision'])
                        ->whereNull('t_contracts.deleted_at')
                        ->whereRaw("UPPER(t_contracts.status) != 'DRAFT'")
                        ->count();
                }

                $expiryBaseQuery = (clone $baseQuery)->whereNotNull('end_date');
                $expiryTotal = (clone $expiryBaseQuery)->count();
                $expiryKontrak = (clone $expiryBaseQuery)->where(fn ($q) => $q->whereIn('contract_type_id', $kontrakIds)->orWhereIn('contract_type_parent_id', $kontrakIds))->count();
                $expiryNonKontrak = (clone $expiryBaseQuery)->where(fn ($q) => $q->whereIn('contract_type_id', $nonKontrakIds)->orWhereIn('contract_type_parent_id', $nonKontrakIds))->count();
                $expiryNda = (clone $expiryBaseQuery)->where(fn ($q) => $q->whereIn('contract_type_id', $ndaIds)->orWhereIn('contract_type_parent_id', $ndaIds))->count();

                return [
                    'all' => [
                        'total' => $allTotal,
                        'kontrak' => $allKontrak,
                        'non_kontrak' => $allNonKontrak,
                        'nda' => $allNda,
                    ],
                    'mine' => [
                        'total' => $myTotal,
                        'kontrak' => $myKontrak,
                        'non_kontrak' => $myNonKontrak,
                        'nda' => $myNda,
                    ],
                    'pending' => [
                        'total' => $pendingApprovalCount,
                        'pending' => $pendingApprovalCount,
                        'history' => $historyApprovalCount,
                    ],
                    'expiry' => [
                        'total' => $expiryTotal,
                        'kontrak' => $expiryKontrak,
                        'non_kontrak' => $expiryNonKontrak,
                        'nda' => $expiryNda,
                    ],
                ];
            })();

            $groups = $modules->groupBy(fn ($item) => trim($item->group_title))
                ->map(function ($items, $title) use ($portalUsedCounts, $contractCounts) {
                    $first = $items->first();
                    $sortedItems = $items->map(function ($module) use ($portalUsedCounts, $contractCounts) {
                        $route = $module->route;
                        $title = $module->name;
                        $children = null;
                        $badge = $portalUsedCounts[$module->route] ?? null;

                        if ($route === '/contracts' || $route === '/admin/contracts') {
                            $title = 'Semua Pengajuan';
                            $badge = $contractCounts['all']['total'] ?? 0;
                        } elseif ($route === '/contracts/mine') {
                            $title = 'Pengajuan Saya';
                            $badge = $contractCounts['mine']['total'] ?? 0;
                        } elseif ($route === '/contracts/pending') {
                            $title = 'Persetujuan Saya';
                            $badge = $contractCounts['pending']['total'] ?? 0;
                        } elseif ($route === '/contracts/expiry') {
                            $title = 'Masa Berlaku Dokumen';
                            $badge = $contractCounts['expiry']['total'] ?? 0;
                        }

                        return [
                            'title' => $title,
                            'url' => $route,
                            'description' => $module->description,
                            'icon' => $module->icon,
                            'sequence' => $module->module_sequence,
                            'badge' => $badge,
                            'children' => null,
                        ];
                    })->values()->all();

                    usort($sortedItems, function ($a, $b) {
                        $orderA = $a['sequence'] ?? 9999;
                        $orderB = $b['sequence'] ?? 9999;
                        if ($orderA === $orderB) {
                            return strcmp($a['title'], $b['title']);
                        }

                        return $orderA <=> $orderB;
                    });

                    return [
                        'title' => $title,
                        'icon' => $first?->group_icon,
                        'sequence' => $first?->group_sequence,
                        'items' => $sortedItems,
                    ];
                })
                ->all();

            usort($groups, function ($a, $b) {
                $orderA = $a['sequence'] ?? 9999;
                $orderB = $b['sequence'] ?? 9999;
                if ($orderA === $orderB) {
                    return strcmp($a['title'], $b['title']);
                }

                return $orderA <=> $orderB;
            });

            $isAdmin = $request->user()->role === 'Admin' || $request->user()->role === 'Super Admin' || $request->user()->is_admin;
            if ($isAdmin) {
                $hasBackup = false;
                foreach ($groups as $group) {
                    foreach ($group['items'] as $item) {
                        if ($item['url'] === '/admin/backups') {
                            $hasBackup = true;
                        }
                    }
                }

                if (! $hasBackup) {
                    $foundSystemGroup = false;
                    foreach ($groups as &$group) {
                        if (trim($group['title']) === 'Pengaturan Sistem') {
                            if (! $hasBackup) {
                                $group['items'][] = [
                                    'title' => 'Backup & Restore',
                                    'url' => '/admin/backups',
                                    'description' => 'Pencadangan & pemulihan data sistem',
                                    'icon' => 'Database',
                                    'sequence' => 101,
                                ];
                            }
                            // Sort items of this group after appending
                            usort($group['items'], function ($a, $b) {
                                $orderA = $a['sequence'] ?? 9999;
                                $orderB = $b['sequence'] ?? 9999;
                                if ($orderA === $orderB) {
                                    return strcmp($a['title'], $b['title']);
                                }

                                return $orderA <=> $orderB;
                            });
                            $foundSystemGroup = true;
                            break;
                        }
                    }
                    unset($group);

                    if (! $foundSystemGroup) {
                        $newItems = [];
                        if (! $hasBackup) {
                            $newItems[] = [
                                'title' => 'Backup & Restore',
                                'url' => '/admin/backups',
                                'description' => 'Pencadangan & pemulihan data sistem',
                                'icon' => 'Database',
                                'sequence' => 101,
                            ];
                        }
                        $groups[] = [
                            'title' => 'Pengaturan Sistem',
                            'sequence' => 99,
                            'items' => $newItems,
                        ];
                    }
                }
            }

            return array_values($groups);
        });
    }
}
