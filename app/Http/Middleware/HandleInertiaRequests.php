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
            ->where('m_access_modules.role_id', $role->id)
            ->where('m_access_modules.can_read', true)
            ->select(
                'm_modules.id',
                'm_modules.name',
                'm_modules.route',
                'm_modules.icon',
                'm_module_groups.name as group_title'
            )
            ->groupBy('m_modules.id', 'm_modules.name', 'm_modules.route', 'm_modules.icon', 'm_module_groups.name')
            ->get();

        $groupOrder = [
            'Beranda' => 1,
            'Modul Kontrak' => 2,
            'Desain Template' => 3,
            'Konfigurasi Alur' => 4,
            'Data Master' => 5,
            'Sistem & Laporan' => 6,
        ];

        $moduleOrder = [
            'Dashboard Utama' => 1,
            'Draft saya' => 2,
            'Semua Kontrak' => 3,
            'Perlu Persetujuan' => 4,
            'Masa Berlaku' => 5,
            'Kategori Kontrak' => 6,
            'Formulir Digital' => 7,
            'Alur Persetujuan' => 8,
            'Master Status' => 9,
            'Manajemen Pengguna' => 10,
            'Hak Akses & Peran' => 11,
            'Data Departemen' => 12,
            'Daftar Vendor' => 13,
            'Analitik Kontrak' => 14,
            'Jejak Audit' => 15,
        ];

        $groups = $modules->groupBy(fn ($item) => trim($item->group_title))
            ->map(function ($items, $title) use ($moduleOrder) {
                $sortedItems = $items->map(fn ($module) => [
                    'title' => $module->name,
                    'url' => $module->route,
                    'icon' => $module->icon,
                ])->values()->all();

                usort($sortedItems, function ($a, $b) use ($moduleOrder) {
                    $orderA = $moduleOrder[$a['title']] ?? 999;
                    $orderB = $moduleOrder[$b['title']] ?? 999;
                    return $orderA <=> $orderB;
                });

                return [
                    'title' => $title,
                    'items' => $sortedItems,
                ];
            })
            ->all();

        uksort($groups, function ($a, $b) use ($groupOrder) {
            $orderA = $groupOrder[$a] ?? 999;
            $orderB = $groupOrder[$b] ?? 999;
            return $orderA <=> $orderB;
        });

        return array_values($groups);
    }
}
