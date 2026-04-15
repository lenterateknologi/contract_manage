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
            ['code' => 'AUDIT', 'title' => 'Log Aktivitas', 'url' => '/admin/audit', 'icon' => 'History', 'group' => 'Konfigurasi Sistem', 'sort' => 7],
        ];

        $activeCodes = array_column($modules, 'code');

        // Cleanup: Remove any modules not in our enterprise list
        Module::whereNotIn('code', $activeCodes)->delete();

        foreach ($modules as $module) {
            Module::updateOrCreate(
                ['code' => $module['code']],
                [
                    'title' => $module['title'],
                    'sort_number' => $module['sort'],
                    'url' => $module['url'],
                    'icon' => $module['icon'],
                    'module_group_id' => $groups[$module['group']] ?? null,
                    'showed_as_menu' => $module['code'] !== 'NAV_MGMT',
                    'created_by' => $admin->id,
                    'updated_by' => $admin->id,
                ]
            );
        }

        // Specifically remove old modules/groups if needed
        ModuleGroup::whereIn('title', ['Insight & Analytics', 'E-Form & Dokumen', 'Administrasi Sistem', 'Audit & Keamanan', 'Laporan'])->delete();
    }
}
