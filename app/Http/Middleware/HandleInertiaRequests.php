<?php

namespace App\Http\Middleware;

use App\Models\AccessModule;
use App\Models\Approval;
use App\Models\Contract;
use App\Models\Module;
use App\Models\Role;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
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
                    'stats' => [
                        'total_created' => Contract::where('created_by', $request->user()->id)->count(),
                        'pending_approvals' => Approval::where('user_id', $request->user()->id)
                            ->where('status', 'pending')
                            ->whereHas('contract', fn ($q) => $q->whereNull('deleted_at'))
                            ->count(),
                        'assigned_active' => Contract::where('assigned_pic_id', $request->user()->id)
                            ->where('status', 'active')
                            ->count(),
                    ],
                ]) : null,
                'permissions' => $this->getUserPermissions($request),
            ],
            'sidebarNavGroups' => $this->getSidebarNavGroups($request),
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

        // Inject full permissions for system menus if the user is an admin
        if ($request->user()->role === 'Admin' || $request->user()->role === 'Super Admin' || $request->user()->is_admin) {
            $systemCodes = ['ADMIN_USERS', 'ADMIN_ROLES', 'ADMIN_NAV_MAPPING', 'ADMIN_ACCESS_MAPPING', 'ADMIN_MEMBERS', 'master_data_sync'];
            foreach ($systemCodes as $code) {
                $permissions[$code] = [
                    'read' => true,
                    'create' => true,
                    'update' => true,
                    'delete' => true,
                    'approve' => true,
                    'bulk_approve' => true,
                    'bulk_delete' => true,
                ];
            }
        }

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
                'm_module_groups.name as group_title',
                'm_role_module_groups.sequence as group_sequence',
                'm_access_modules.sequence as module_sequence',
            )
            ->get();

        $groups = $modules->groupBy(fn ($item) => trim($item->group_title))
            ->map(function ($items, $title) {
                $first = $items->first();
                $sortedItems = $items->map(fn ($module) => [
                    'title' => $module->name,
                    'url' => $module->route,
                    'icon' => $module->icon,
                    'sequence' => $module->module_sequence,
                ])->values()->all();

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
            $foundSystemGroup = false;
            foreach ($groups as &$group) {
                if (trim($group['title']) === 'Pengaturan Sistem') {
                    $group['items'][] = [
                        'title' => 'Ekspor Impor Master',
                        'url' => '/admin/master-data-sync',
                        'icon' => 'RefreshCw',
                        'sequence' => 99,
                    ];
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
                $groups[] = [
                    'title' => 'Pengaturan Sistem',
                    'sequence' => 99,
                    'items' => [
                        [
                            'title' => 'Ekspor Impor Master',
                            'url' => '/admin/master-data-sync',
                            'icon' => 'RefreshCw',
                            'sequence' => 99,
                        ],
                    ],
                ];
            }
        }

        return array_values($groups);
    }
}
