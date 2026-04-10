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
            // Insight & Analytics
            ['code' => 'DASH', 'title' => 'Dashboard Utama', 'url' => '/dashboard', 'icon' => 'LayoutGrid', 'group' => 'Insight & Analytics', 'sort' => 1],
            ['code' => 'ANLTX', 'title' => 'Analitik & SLA', 'url' => '/admin/reports', 'icon' => 'BarChart3', 'group' => 'Insight & Analytics', 'sort' => 2],

            // Manajemen Kontrak
            ['code' => 'CONTRACTS', 'title' => 'Register Kontrak', 'url' => '/contracts', 'icon' => 'FileText', 'group' => 'Manajemen Kontrak', 'sort' => 1],
            ['code' => 'PENDING', 'title' => 'Menunggu Approval', 'url' => '/pending', 'icon' => 'Clock', 'group' => 'Manajemen Kontrak', 'sort' => 2],
            ['code' => 'EXPIRY', 'title' => 'Monitoring Masa Berlaku', 'url' => '/admin/expiry', 'icon' => 'AlertCircle', 'group' => 'Manajemen Kontrak', 'sort' => 3],
            ['code' => 'MY_CTC', 'title' => 'Dokumen Saya', 'url' => '/my-contracts', 'icon' => 'UserCheck', 'group' => 'Manajemen Kontrak', 'sort' => 4],

            // E-Form & Dokumen
            ['code' => 'F1', 'title' => 'Permintaan Kontrak (F1)', 'url' => '/f1', 'icon' => 'FilePlus', 'group' => 'E-Form & Dokumen', 'sort' => 1],
            ['code' => 'F2', 'title' => 'Review Legal (F2)', 'url' => '/f2', 'icon' => 'FileCheck', 'group' => 'E-Form & Dokumen', 'sort' => 2],

            // Administrasi Sistem
            ['code' => 'USERS', 'title' => 'Manajemen Pengguna', 'url' => '/admin/users', 'icon' => 'Users', 'group' => 'Administrasi Sistem', 'sort' => 1],
            ['code' => 'ROLES', 'title' => 'Role & Otoritas', 'url' => '/admin/roles', 'icon' => 'ShieldCheck', 'group' => 'Administrasi Sistem', 'sort' => 2],
            ['code' => 'CTC_TYPES', 'title' => 'Master Tipe Kontrak', 'url' => '/admin/contract-types', 'icon' => 'Settings2', 'group' => 'Administrasi Sistem', 'sort' => 3],
            ['code' => 'WORKFLOWS', 'title' => 'Konfigurasi Alur Kerja', 'url' => '/admin/workflows', 'icon' => 'GitBranch', 'group' => 'Administrasi Sistem', 'sort' => 4],
            ['code' => 'NAV_MGMT', 'title' => 'Struktur Navigasi', 'url' => '/admin/navigation', 'icon' => 'Layers', 'group' => 'Administrasi Sistem', 'sort' => 5],

            // Audit & Keamanan
            ['code' => 'AUDIT', 'title' => 'Jejak Audit (Logs)', 'url' => '/admin/audit', 'icon' => 'History', 'group' => 'Audit & Keamanan', 'sort' => 1],
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

        // Specifically remove old modules
        Module::whereIn('code', ['MOD_GRPS', 'MODS', 'AUDIT'])->delete();
        ModuleGroup::where('title', 'Laporan')->delete();
    }
}
