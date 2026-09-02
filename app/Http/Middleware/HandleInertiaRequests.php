<?php

namespace App\Http\Middleware;

use App\Models\AccessModule;
use App\Models\Module;
use App\Models\Role;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
                ]) : null,
                'permissions' => $this->getUserPermissions($request),
            ],
            'sidebarNavGroups' => $this->getSidebarNavGroups($request),
            'upload_configs' => config('uploads.categories'),
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error') ?? ($request->session()->get('errors') ? collect($request->session()->get('errors')->getBag('default')->get('error'))->first() : null),
                'danger' => $request->session()->get('danger'),
                'info' => $request->session()->get('info'),
            ],
        ]);
    }

    protected function getUserPermissions(Request $request): array
    {
        if (! $request->user()) {
            return [];
        }

        $role = Role::firstWhere('name', $request->user()->role);
        if (! $role) {
            return [];
        }

        $permissions = AccessModule::where('role_id', $role->id)
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

        return $permissions;
    }

    protected function getSidebarNavGroups(Request $request): array
    {
        if (! $request->user()) {
            return [];
        }

        $role = Role::firstWhere('name', $request->user()->role);
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

        // ponytail: compute is_used / total counts for Portal master data
        $getPortalCount = function (string $table): string {
            $res = DB::table($table)
                ->whereNull('deleted_at')
                ->selectRaw('COUNT(*) as total, COUNT(CASE WHEN is_used THEN 1 END) as used')
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

        $groups = $modules->groupBy(fn ($item) => trim($item->group_title))
            ->map(function ($items, $title) use ($portalUsedCounts) {
                $first = $items->first();
                $sortedItems = $items->map(function ($module) use ($portalUsedCounts) {
                    $route = $module->route;
                    $title = $module->name;
                    $children = null;

                    if ($route === '/contracts' || $route === '/admin/contracts') {
                        $title = 'Pengajuan';
                        $children = [
                            [
                                'title' => 'Kontrak',
                                'url' => '/contracts?parent_tab=kontrak',
                                'icon' => 'FileText',
                                'description' => 'Dokumen Kontrak',
                            ],
                            [
                                'title' => 'Non Kontrak',
                                'url' => '/contracts?parent_tab=non_kontrak',
                                'icon' => 'FileCheck',
                                'description' => 'Dokumen Non Kontrak',
                            ],
                            [
                                'title' => 'NDA',
                                'url' => '/contracts?parent_tab=nda',
                                'icon' => 'Zap',
                                'description' => 'Non-Disclosure Agreement',
                            ],
                        ];
                    } elseif ($route === '/contracts/mine') {
                        $children = [
                            [
                                'title' => 'Kontrak',
                                'url' => '/contracts/mine?mine_tab=kontrak',
                                'icon' => 'FileText',
                                'description' => 'Dokumen Kontrak Saya',
                            ],
                            [
                                'title' => 'Non Kontrak',
                                'url' => '/contracts/mine?mine_tab=non_kontrak',
                                'icon' => 'FileCheck',
                                'description' => 'Dokumen Non Kontrak Saya',
                            ],
                            [
                                'title' => 'NDA',
                                'url' => '/contracts/mine?mine_tab=nda',
                                'icon' => 'Zap',
                                'description' => 'NDA Saya',
                            ],
                        ];
                    }

                    return [
                        'title' => $title,
                        'url' => $route,
                        'description' => $module->description,
                        'icon' => $module->icon,
                        'sequence' => $module->module_sequence,
                        'badge' => $portalUsedCounts[$module->route] ?? null,
                        'children' => $children,
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
    }
}
