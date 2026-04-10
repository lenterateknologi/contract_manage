<?php

namespace Database\Seeders;

use App\Models\Module;
use App\Models\ModuleGroup;
use App\Models\User;
use Illuminate\Database\Seeder;

class ModuleSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstWhere('email', 'admin@example.com') ?? User::first();
        $groups = ModuleGroup::pluck('id', 'title')->all();

        $modules = [
            ['code' => 'DASH', 'title' => 'Dashboard', 'url' => '/dashboard', 'icon' => 'LayoutGrid', 'group' => 'Ringkasan', 'sort' => 1],
            ['code' => 'REPORTS', 'title' => 'Pusat Laporan', 'url' => '/admin/reports', 'icon' => 'BarChart3', 'group' => 'Ringkasan', 'sort' => 2],

            ['code' => 'CONTRACTS', 'title' => 'Semua Kontrak', 'url' => '/contracts', 'icon' => 'FileText', 'group' => 'Manajemen Kontrak', 'sort' => 1],
            ['code' => 'MY_CTC', 'title' => 'Kontrak Saya', 'url' => '/my-contracts', 'icon' => 'Users', 'group' => 'Manajemen Kontrak', 'sort' => 2],
            ['code' => 'PENDING', 'title' => 'Menunggu Approval', 'url' => '/pending', 'icon' => 'Clock', 'group' => 'Manajemen Kontrak', 'sort' => 3],

            ['code' => 'F1', 'title' => 'Form F1', 'url' => '/f1', 'icon' => 'FilePlus', 'group' => 'Formulir Standar', 'sort' => 1],
            ['code' => 'F2', 'title' => 'Form F2', 'url' => '/f2', 'icon' => 'FileEdit', 'group' => 'Formulir Standar', 'sort' => 2],

            ['code' => 'USERS', 'title' => 'Pengguna', 'url' => '/admin/users', 'icon' => 'Users', 'group' => 'Data Master', 'sort' => 1],
            ['code' => 'ROLES', 'title' => 'Role', 'url' => '/admin/roles', 'icon' => 'ShieldCheck', 'group' => 'Data Master', 'sort' => 2],
            ['code' => 'CTC_TYPES', 'title' => 'Tipe Kontrak', 'url' => '/admin/contract-types', 'icon' => 'Settings2', 'group' => 'Data Master', 'sort' => 3],
            ['code' => 'WORKFLOWS', 'title' => 'Alur Kerja', 'url' => '/admin/workflows', 'icon' => 'GitBranch', 'group' => 'Data Master', 'sort' => 4],
        ];

        $activeCodes = array_column($modules, 'code');
        Module::whereNotIn('code', $activeCodes)->update(['showed_as_menu' => false]);

        foreach ($modules as $module) {
            Module::updateOrCreate(
                ['code' => $module['code']],
                [
                    'title' => $module['title'],
                    'sort_number' => $module['sort'],
                    'url' => $module['url'],
                    'icon' => $module['icon'],
                    'module_group_id' => $groups[$module['group']] ?? null,
                    'showed_as_menu' => true,
                    'created_by' => $admin->id,
                    'updated_by' => $admin->id,
                ]
            );
        }

        // Specifically remove AUDIT if it exists
        Module::where('code', 'AUDIT')->delete();
        ModuleGroup::where('title', 'Laporan')->delete();
    }
}
