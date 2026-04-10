<?php

namespace App\Http\Middleware;

use App\Models\Module;
use App\Models\Role;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
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
                    'initials'   => $request->user()->initials,
                    'role'       => $request->user()->role,
                    'bg_color'   => $request->user()->bg_color,
                    'text_color' => $request->user()->text_color,
                ]) : null,
            ],
            'sidebarNavGroups' => $this->getSidebarNavGroups($request),
        ]);
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
            ->whereHas('accessModules', function ($query) use ($role) {
                $query->where('role_id', $role->id);
            })
            ->with('moduleGroup')
            ->orderBy('module_group_id')
            ->orderBy('sort_number')
            ->get();

        return $modules->groupBy(fn ($module) => $module->moduleGroup?->title ?? 'Other')
            ->map(function ($items, $title) {
                return [
                    'title' => $title,
                    'items' => $items->map(fn ($module) => [
                        'title' => $module->title,
                        'url' => $module->url,
                        'icon' => $module->icon,
                    ])->values()->all(),
                ];
            })
            ->values()
            ->all();
    }
}
