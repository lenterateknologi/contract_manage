<?php

namespace App\Http\Middleware;

use App\Http\Queries\Contract\ContractListQuery;
use App\Models\Master\AccessModule;
use App\Models\Master\ContractFilterTemplate;
use App\Models\Master\ContractStatus;
use App\Models\Master\DashboardType;
use App\Models\Master\Module;
use App\Models\Master\Role;
use App\Models\Master\User;
use App\Models\Transaction\Contract;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Middleware;
use Tighten\Ziggy\BladeRouteGenerator;

class HandleInertiaRequests extends Middleware
{
    public function handle(Request $request, \Closure $next)
    {
        // ponytail: ensure fresh Ziggy routes script on long-running PHP servers (Octane/FrankenPHP/serve)
        if (class_exists(BladeRouteGenerator::class)) {
            BladeRouteGenerator::$generated = false;
        }

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
        $impersonatorUser = $impersonatorId ? User::find($impersonatorId) : null;

        return array_merge(parent::share($request), [
            'name' => config('app.name'),
            'tagline' => config('app.tagline', 'Legal Management System'),
            'meta_title' => config('app.meta_title', 'corixa - Legal Management System'),
            'logo' => config('app.logo', '/images/logo.png'),
            'favicon' => config('app.favicon', '/favicon.ico'),
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
                    'allowed_on_behalf_user_ids' => $request->user()->allowed_on_behalf_user_ids,
                    'is_admin' => (bool) ($request->user()->isAdmin() || $request->user()->isSuperAdmin() || in_array($request->user()->role, ['Admin', 'Super Admin'])),
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
            'masterContractStatuses' => Cache::remember('master_contract_statuses_global', now()->addMinutes(10), function () {
                return ContractStatus::select('id', 'code', 'label', 'color', 'bg_color', 'icon')->get();
            }),
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
                if ($d->show_overview) {
                    $activeTabs[] = 'Ringkasan';
                }
                if ($d->show_overview_contract) {
                    $activeTabs[] = 'Kontrak';
                }
                if ($d->show_overview_non_contract) {
                    $activeTabs[] = 'Non Kontrak';
                }
                if ($d->show_overview_nda) {
                    $activeTabs[] = 'NDA';
                }
                if ($d->show_workload) {
                    $activeTabs[] = 'Beban Kerja';
                }
                if ($d->show_master_data) {
                    $activeTabs[] = 'Master Data';
                }

                $badge = empty($activeTabs) ? 'Tanpa Tab' : implode(' + ', $activeTabs);

                return [
                    'id' => (string) $d->id,
                    'name' => $d->name,
                    'label' => $d->name,
                    'badge' => $badge,
                    'description' => $d->description ?: 'Konfigurasi visibilitas tab dashboard',
                    'show_overview' => (bool) $d->show_overview,
                    'show_overview_contract' => (bool) $d->show_overview_contract,
                    'show_overview_non_contract' => (bool) $d->show_overview_non_contract,
                    'show_overview_nda' => (bool) $d->show_overview_nda,
                    'show_workload' => (bool) $d->show_workload,
                    'show_master_data' => (bool) $d->show_master_data,
                ];
            })->values()->all();

            $filterTemplates = ContractFilterTemplate::orderBy('name')->get()->map(function ($t) {
                $dimCount = 0;
                if ($t->can_change_company_group) {
                    $dimCount++;
                }
                if ($t->can_change_region) {
                    $dimCount++;
                }
                if ($t->can_change_company) {
                    $dimCount++;
                }
                if ($t->can_change_division) {
                    $dimCount++;
                }
                if ($t->can_change_department) {
                    $dimCount++;
                }

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

            $access = AccessModule::where('role_id', $role->id)
                ->join('m_modules', 'm_access_modules.module_id', '=', 'm_modules.id')
                ->select('m_modules.identifier as code', 'm_modules.route', 'can_read', 'can_create', 'can_update', 'can_delete', 'can_approve', 'can_bulk_approve', 'can_bulk_delete')
                ->get();

            $byCode = $access->keyBy('code')
                ->map(fn ($item) => [
                    'code' => $item->code,
                    'route' => $item->route,
                    'read' => (bool) $item->can_read,
                    'create' => (bool) $item->can_create,
                    'update' => (bool) $item->can_update,
                    'delete' => (bool) $item->can_delete,
                    'approve' => (bool) ($item->can_approve ?? false),
                    'bulk_approve' => (bool) ($item->can_bulk_approve ?? false),
                    'bulk_delete' => (bool) ($item->can_bulk_delete ?? false),
                ])
                ->all();

            $byRoute = [];
            foreach ($access as $item) {
                if ($item->route) {
                    $byRoute[$item->route] = $byCode[$item->code] ?? [];
                }
            }

            $isAdmin = in_array($roleName, ['Admin', 'Super Admin']);
            if ($isAdmin) {
                $byCode['ADMIN_BACKUPS'] = [
                    'code' => 'ADMIN_BACKUPS',
                    'route' => '/admin/backups',
                    'read' => true,
                    'create' => true,
                    'update' => true,
                    'delete' => true,
                    'approve' => false,
                    'bulk_approve' => false,
                    'bulk_delete' => false,
                ];
                $byRoute['/admin/backups'] = $byCode['ADMIN_BACKUPS'];
            }

            return array_merge($byCode, $byRoute);
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

            $currentUser = $request->user();
            $canViewGlobalContracts = $currentUser && $currentUser->canViewGlobalContracts();
            if (! $canViewGlobalContracts) {
                // Non-global view users: hide global /contracts and /admin/reports/divisions, show /contracts/organization as Semua Pengajuan
                $modules = $modules->reject(fn ($m) => in_array($m->route, ['/contracts', '/admin/contracts', '/admin/reports/divisions']));
            } else {
                // Global view users: hide /contracts/organization, show global /contracts as Semua Pengajuan
                $modules = $modules->reject(fn ($m) => in_array($m->route, ['/contracts/organization', '/contracts/org-group']));
            }

            $groups = $modules->groupBy(fn ($item) => trim($item->group_title))
                ->map(function ($items, $title) {
                    $first = $items->first();
                    $sortedItems = $items->map(function ($module) {
                        $route = $module->route;
                        $menuTitle = match ($route) {
                            '/contracts', '/admin/contracts' => 'Semua Pengajuan',
                            '/contracts/organization', '/contracts/org-group' => 'Semua Pengajuan',
                            '/contracts/activity', '/admin/contracts/activity' => 'Aktivitas Pengajuan',
                            '/contracts/mine' => 'Pengajuan Saya',
                            '/contracts/mine?parent_tab=in_progress' => 'Sedang Diproses',
                            '/contracts/mine?status=draft' => 'Draft Pengajuan',
                            '/contracts/duty' => 'Tugas Saya',
                            '/contracts/pending' => 'Persetujuan Saya',
                            '/contracts/expiry' => 'Masa Berlaku Dokumen',
                            '/dashboard/beban-kerja', '/dashboard/workload' => 'Beban Kerja',
                            default => $module->name,
                        };

                        return [
                            'title' => $menuTitle,
                            'url' => $route,
                            'description' => $module->description,
                            'icon' => $module->icon,
                            'sequence' => $module->module_sequence,
                            'badge' => null,
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

            $isAdmin = (bool) ($currentUser && ($currentUser->isAdmin() || $currentUser->isSuperAdmin() || in_array($roleName, ['Admin', 'Super Admin'])));
            if ($isAdmin) {
                $hasBackup = false;
                if (isset($groups['Pengaturan Sistem'])) {
                    foreach ($groups['Pengaturan Sistem']['items'] as $item) {
                        if ($item['url'] === '/admin/backups') {
                            $hasBackup = true;
                            break;
                        }
                    }
                    if (! $hasBackup) {
                        $groups['Pengaturan Sistem']['items'][] = [
                            'title' => 'Dump & Restore',
                            'url' => '/admin/backups',
                            'description' => 'Manajemen ekspor dan impor file database dump/restore secara manual',
                            'icon' => 'Database',
                            'sequence' => 99,
                            'badge' => null,
                            'children' => null,
                        ];
                    }
                } else {
                    $groups['Pengaturan Sistem'] = [
                        'title' => 'Pengaturan Sistem',
                        'icon' => 'Settings2',
                        'sequence' => 99,
                        'items' => [
                            [
                                'title' => 'Dump & Restore',
                                'url' => '/admin/backups',
                                'description' => 'Manajemen ekspor dan impor file database dump/restore secara manual',
                                'icon' => 'Database',
                                'sequence' => 99,
                                'badge' => null,
                                'children' => null,
                            ],
                        ],
                    ];
                }
            }

            usort($groups, function ($a, $b) {
                $orderA = $a['sequence'] ?? 9999;
                $orderB = $b['sequence'] ?? 9999;
                if ($orderA === $orderB) {
                    return strcmp($a['title'], $b['title']);
                }

                return $orderA <=> $orderB;
            });

            return array_values($groups);
        });
    }
}
