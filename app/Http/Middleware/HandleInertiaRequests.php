<?php

namespace App\Http\Middleware;

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
                    'bg_color' => $request->user()->bg_color,
                    'text_color' => $request->user()->text_color,
                ]) : null,
                'permissions' => $this->getUserPermissions($request),
            ],
            'sidebarNavGroups' => $this->getSidebarNavGroups($request),
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

        return \App\Models\AccessModule::where('role_id', $role->id)
            ->join('m_modules', 'm_access_modules.module_id', '=', 'm_modules.id')
            ->select('m_modules.identifier as code', 'can_read', 'can_create', 'can_update', 'can_delete')
            ->get()
            ->keyBy('code')
            ->map(fn ($item) => [
                'read' => (bool) $item->can_read,
                'create' => (bool) $item->can_create,
                'update' => (bool) $item->can_update,
                'delete' => (bool) $item->can_delete,
            ])
            ->all();
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

        $modules = Module::where('showed_as_menu', true)
            ->join('m_access_modules', 'm_modules.id', '=', 'm_access_modules.module_id')
            ->join('m_module_groups', 'm_access_modules.module_group_id', '=', 'm_module_groups.id')
            ->leftJoin('m_role_module_groups', function ($join) use ($role) {
                $join->on('m_module_groups.id', '=', 'm_role_module_groups.module_group_id')
                    ->where('m_role_module_groups.role_id', '=', $role->id);
            })
            ->where('m_access_modules.role_id', $role->id)
            ->where('m_access_modules.can_read', true)
            ->select(
                'm_modules.*', 
                'm_module_groups.name as group_title', 
                'm_access_modules.sequence as module_sort', 
                'm_role_module_groups.sequence as group_sort'
            )
            ->orderByRaw('COALESCE(m_role_module_groups.sequence, 999)')
            ->orderBy('m_access_modules.sequence')
            ->get();

        return $modules->groupBy('group_title')
            ->map(function ($items, $title) {
                return [
                    'title' => $title,
                    'items' => $items->map(fn ($module) => [
                        'title' => $module->name,
                        'url' => $module->route,
                        'icon' => $module->icon,
                    ])->values()->all(),
                ];
            })
            ->values()
            ->all();
    }
}
