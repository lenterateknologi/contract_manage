<?php

namespace Database\Seeders;

use App\Models\Module;
use App\Models\ModuleGroup;
use App\Models\User;
use App\Models\Role;
use App\Models\AccessModule;
use Illuminate\Database\Seeder;

class ModuleSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstWhere('email', 'admin@example.com') ?? User::first();
        $adminId = $admin ? $admin->id : null;
        
        $groups = ModuleGroup::pluck('id', 'name')->all();

        $modules = [
            // Dashboard
            ['identifier' => 'DASH', 'name' => 'Dashboard', 'route' => '/dashboard', 'icon' => 'LayoutGrid', 'group' => 'Dashboard', 'sequence' => 1],
            ['identifier' => 'ANLTX', 'name' => 'Laporan', 'route' => '/admin/reports', 'icon' => 'BarChart3', 'group' => 'Dashboard', 'sequence' => 2],

            // Manajemen Kontrak
            ['identifier' => 'CONTRACTS', 'name' => 'Daftar Kontrak', 'route' => '/contracts', 'icon' => 'FileText', 'group' => 'Manajemen Kontrak', 'sequence' => 1],
            ['identifier' => 'MY_CTC', 'name' => 'Kontrak Saya', 'route' => '/my-contracts', 'icon' => 'UserCheck', 'group' => 'Manajemen Kontrak', 'sequence' => 2],
            ['identifier' => 'PENDING', 'name' => 'Persetujuan', 'route' => '/pending', 'icon' => 'Clock', 'group' => 'Manajemen Kontrak', 'sequence' => 3],
            ['identifier' => 'EXPIRY', 'name' => 'Masa Berlaku', 'route' => '/expiry', 'icon' => 'History', 'group' => 'Manajemen Kontrak', 'sequence' => 4],

            // Konfigurasi Sistem
            ['identifier' => 'USERS', 'name' => 'Pengguna', 'route' => '/admin/users', 'icon' => 'Users', 'group' => 'Konfigurasi Sistem', 'sequence' => 1],
            ['identifier' => 'ROLES', 'name' => 'Hak Akses', 'route' => '/admin/roles', 'icon' => 'ShieldCheck', 'group' => 'Konfigurasi Sistem', 'sequence' => 2],
            ['identifier' => 'CTC_TYPES', 'name' => 'Tipe Kontrak', 'route' => '/admin/contract-types', 'icon' => 'Settings2', 'group' => 'Konfigurasi Sistem', 'sequence' => 3],
            ['identifier' => 'WORKFLOWS', 'name' => 'Alur Kerja', 'route' => '/admin/workflows', 'icon' => 'GitBranch', 'group' => 'Konfigurasi Sistem', 'sequence' => 4],
            ['identifier' => 'TPL_MGMT', 'name' => 'Template Kontrak', 'route' => '/admin/templates', 'icon' => 'FilePlus', 'group' => 'Konfigurasi Sistem', 'sequence' => 5],
            ['identifier' => 'FORM_TPL', 'name' => 'Form Template', 'route' => '/admin/form-templates', 'icon' => 'FileJson', 'group' => 'Konfigurasi Sistem', 'sequence' => 6],
            ['identifier' => 'STS_MGMT', 'name' => 'Master Status', 'route' => '/admin/contract-statuses', 'icon' => 'Tags', 'group' => 'Konfigurasi Sistem', 'sequence' => 7],
            ['identifier' => 'DEPT_MGMT', 'name' => 'Departemen', 'route' => '/admin/departments', 'icon' => 'Building2', 'group' => 'Konfigurasi Sistem', 'sequence' => 8],
            ['identifier' => 'VEN_MGMT', 'name' => 'Vendor', 'route' => '/admin/vendors', 'icon' => 'Truck', 'group' => 'Konfigurasi Sistem', 'sequence' => 9],
            ['identifier' => 'AUDIT', 'name' => 'Log Aktivitas', 'route' => '/admin/audit', 'icon' => 'History', 'group' => 'Konfigurasi Sistem', 'sequence' => 10],
        ];

        // Get the Admin Role
        $adminRole = Role::firstWhere('name', 'Admin');

        foreach ($modules as $moduleData) {
            $createdModule = Module::updateOrCreate(
                ['identifier' => $moduleData['identifier']],
                [
                    'name' => $moduleData['name'],
                    'route' => $moduleData['route'],
                    'icon' => $moduleData['icon'],
                    'sequence' => $moduleData['sequence'],
                    'module_group_id' => $groups[$moduleData['group']] ?? null,
                    'created_by' => $adminId,
                    'updated_by' => $adminId,
                ]
            );

            // Grant Admin access to everything by default
            if ($adminRole) {
                AccessModule::updateOrCreate(
                    [
                        'role_id' => $adminRole->id,
                        'module_id' => $createdModule->id,
                    ],
                    [
                        'can_view' => true,
                        'can_create' => true,
                        'can_edit' => true,
                        'can_delete' => true,
                        'can_approve' => true,
                    ]
                );
            }
        }
    }
}
