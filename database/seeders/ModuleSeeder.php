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
            // Dashboard
            ['code' => 'DASH', 'title' => 'Dashboard', 'url' => '/dashboard', 'icon' => 'LayoutGrid', 'group' => 'Dashboard', 'sort' => 1],
            ['code' => 'ANLTX', 'title' => 'Laporan', 'url' => '/admin/reports', 'icon' => 'BarChart3', 'group' => 'Dashboard', 'sort' => 2],

            // Manajemen Kontrak
            ['code' => 'CONTRACTS', 'title' => 'Daftar Kontrak', 'url' => '/contracts', 'icon' => 'FileText', 'group' => 'Manajemen Kontrak', 'sort' => 1],
            ['code' => 'MY_CTC', 'title' => 'Kontrak Saya', 'url' => '/my-contracts', 'icon' => 'UserCheck', 'group' => 'Manajemen Kontrak', 'sort' => 2],
            ['code' => 'PENDING', 'title' => 'Persetujuan', 'url' => '/pending', 'icon' => 'Clock', 'group' => 'Manajemen Kontrak', 'sort' => 3],
            ['code' => 'EXPIRY', 'title' => 'Masa Berlaku', 'url' => '/expiry', 'icon' => 'History', 'group' => 'Manajemen Kontrak', 'sort' => 4],

            // Form Digital
            // ['code' => 'F1', 'title' => 'Pengajuan Baru', 'url' => '/f1', 'icon' => 'FilePlus', 'group' => 'Form Digital', 'sort' => 1],

            // Konfigurasi Sistem

            ['code' => 'USERS', 'title' => 'Pengguna', 'url' => '/admin/users', 'icon' => 'Users', 'group' => 'Konfigurasi Sistem', 'sort' => 1],
            ['code' => 'ROLES', 'title' => 'Hak Akses', 'url' => '/admin/roles', 'icon' => 'ShieldCheck', 'group' => 'Konfigurasi Sistem', 'sort' => 2],
            ['code' => 'CTC_TYPES', 'title' => 'Tipe Kontrak', 'url' => '/admin/contract-types', 'icon' => 'Settings2', 'group' => 'Konfigurasi Sistem', 'sort' => 3],
            ['code' => 'WORKFLOWS', 'title' => 'Alur Kerja', 'url' => '/admin/workflows', 'icon' => 'GitBranch', 'group' => 'Konfigurasi Sistem', 'sort' => 4],
            ['code' => 'TPL_MGMT', 'title' => 'Template Kontrak', 'url' => '/admin/templates', 'icon' => 'FilePlus', 'group' => 'Konfigurasi Sistem', 'sort' => 5],
            ['code' => 'FORM_TPL', 'title' => 'Form Template', 'url' => '/admin/form-templates', 'icon' => 'FileJson', 'group' => 'Konfigurasi Sistem', 'sort' => 6],
            ['code' => 'STS_MGMT', 'title' => 'Master Status', 'url' => '/admin/contract-statuses', 'icon' => 'Tags', 'group' => 'Konfigurasi Sistem', 'sort' => 7],
            ['code' => 'DEPT_MGMT', 'title' => 'Departemen', 'url' => '/admin/departments', 'icon' => 'Building2', 'group' => 'Konfigurasi Sistem', 'sort' => 8],
            ['code' => 'VEN_MGMT', 'title' => 'Vendor', 'url' => '/admin/vendors', 'icon' => 'Truck', 'group' => 'Konfigurasi Sistem', 'sort' => 9],
            ['code' => 'AUDIT', 'title' => 'Log Aktivitas', 'url' => '/admin/audit', 'icon' => 'History', 'group' => 'Konfigurasi Sistem', 'sort' => 10],
        ];

        $activeCodes = array_column($modules, 'code');

        // Cleanup: Remove any modules not in our enterprise list
        \App\Models\Module::whereNotIn('code', $activeCodes)->delete();

        // Get the Admin Role
        $adminRole = \App\Models\Role::firstWhere('name', 'Admin');

        foreach ($modules as $module) {
            $createdModule = \App\Models\Module::updateOrCreate(
                ['code' => $module['code']],
                [
                    'title' => $module['title'],
                    'sort_number' => $module['sort'],
                    'url' => $module['url'],
                    'icon' => $module['icon'],
                    'module_group_id' => $groups[$module['group']] ?? null,
                    'showed_as_menu' => !in_array($module['code'], ['NAV_MGMT']),
                    'created_by' => $admin->id,
                    'updated_by' => $admin->id,
                ]
            );

            // Grant Admin access to everything by default
            if ($adminRole) {
                \App\Models\AccessModule::updateOrCreate(
                    [
                        'role_id' => $adminRole->id,
                        'module_id' => $createdModule->id,
                    ],
                    [
                        'can_read' => true,
                        'can_create' => true,
                        'can_update' => true,
                        'can_delete' => true,
                        'module_group_id' => $createdModule->module_group_id,
                        'sort_number' => $createdModule->sort_number,
                        'created_by' => $admin->id,
                        'updated_at' => now(),
                    ]
                );
            }
        }

        // Specifically remove old modules/groups if needed
        ModuleGroup::whereIn('title', ['Insight & Analytics', 'E-Form & Dokumen', 'Administrasi Sistem', 'Audit & Keamanan', 'Laporan'])->delete();
    }
}
