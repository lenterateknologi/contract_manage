<?php

namespace Database\Seeders;

use App\Models\AccessModule;
use App\Models\Module;
use App\Models\ModuleGroup;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class ModuleSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstWhere('email', 'admin@example.com') ?? User::first();
        $adminId = $admin ? $admin->id : null;

        $groups = ModuleGroup::pluck('id', 'name')->all();

        $modules = [
            // Beranda
            ['identifier' => 'DASH',     'name' => 'Dashboard Utama',    'route' => '/dashboard',              'icon' => 'LayoutGrid',  'group' => 'Beranda',           'sequence' => 1],

            // Manajemen Kontrak
            ['identifier' => 'CONTRACTS', 'name' => 'Semua Kontrak',      'route' => '/contracts',              'icon' => 'FileText',    'group' => 'Manajemen Kontrak', 'sequence' => 1],
            ['identifier' => 'MY_CTC',   'name' => 'Draft Saya',         'route' => '/contracts/mine',         'icon' => 'UserCheck',   'group' => 'Manajemen Kontrak', 'sequence' => 2],
            ['identifier' => 'PENDING',  'name' => 'Perlu Persetujuan',  'route' => '/contracts/pending',      'icon' => 'Clock',       'group' => 'Manajemen Kontrak', 'sequence' => 3],
            ['identifier' => 'EXPIRY',   'name' => 'Masa Berlaku',       'route' => '/contracts/expiry',       'icon' => 'History',     'group' => 'Manajemen Kontrak', 'sequence' => 4],

            // Desain Template
            ['identifier' => 'ADMIN_TYPES',    'name' => 'Kategori Kontrak', 'route' => '/admin/contract-types',   'icon' => 'FolderClosed', 'group' => 'Desain Template', 'sequence' => 1],
            ['identifier' => 'ADMIN_TEMPLATES', 'name' => 'Isi Kontrak',      'route' => '/admin/templates',        'icon' => 'FileCode',     'group' => 'Desain Template', 'sequence' => 2],
            ['identifier' => 'ADMIN_FORMS',    'name' => 'Formulir Digital', 'route' => '/admin/form-templates',  'icon' => 'ScanLine',     'group' => 'Desain Template', 'sequence' => 3],

            // Konfigurasi Alur
            ['identifier' => 'ADMIN_WORKFLOWS', 'name' => 'Alur Persetujuan', 'route' => '/admin/workflows',        'icon' => 'Workflow', 'group' => 'Konfigurasi Alur', 'sequence' => 1],
            ['identifier' => 'ADMIN_STATUS',   'name' => 'Master Status',    'route' => '/admin/contract-statuses', 'icon' => 'Tags',     'group' => 'Konfigurasi Alur', 'sequence' => 2],

            // Data Master
            ['identifier' => 'ADMIN_GROUPS',  'name' => 'Data Group',      'route' => '/admin/company-groups', 'icon' => 'Users',        'group' => 'Data Master', 'sequence' => 1],
            ['identifier' => 'ADMIN_REGIONS', 'name' => 'Data Region',     'route' => '/admin/regions',        'icon' => 'GitBranch',    'group' => 'Data Master', 'sequence' => 2],
            ['identifier' => 'ADMIN_COMPANIES', 'name' => 'Data Company',    'route' => '/admin/companies',      'icon' => 'Building2',    'group' => 'Data Master', 'sequence' => 3],
            ['identifier' => 'ADMIN_USERS',   'name' => 'Manajemen Pengguna', 'route' => '/admin/users',       'icon' => 'UserCog',  'group' => 'Data Master', 'sequence' => 4],
            ['identifier' => 'ADMIN_ROLES',   'name' => 'Hak Akses & Peran', 'route' => '/admin/roles',        'icon' => 'KeyRound', 'group' => 'Data Master', 'sequence' => 5],
            ['identifier' => 'ADMIN_DEPTS',   'name' => 'Data Departemen',    'route' => '/admin/departments', 'icon' => 'Building2', 'group' => 'Data Master', 'sequence' => 6],
            ['identifier' => 'ADMIN_VENDORS', 'name' => 'Daftar Vendor',      'route' => '/admin/vendors',     'icon' => 'Truck',    'group' => 'Data Master', 'sequence' => 7],

            // Sistem & Laporan
            ['identifier' => 'ANLTX', 'name' => 'Analitik Kontrak', 'route' => '/admin/reports/analytics', 'icon' => 'BarChart3', 'group' => 'Sistem & Laporan', 'sequence' => 1],
            ['identifier' => 'AUDIT', 'name' => 'Jejak Audit',      'route' => '/admin/reports/audit',     'icon' => 'ClipboardList', 'group' => 'Sistem & Laporan', 'sequence' => 2],
        ];

        // Get the Admin Role
        $adminRole = Role::firstWhere('name', 'Admin');

        foreach ($modules as $moduleData) {
            $existingModule = Module::withTrashed()->where('identifier', $moduleData['identifier'])->first();

            if ($existingModule) {
                if ($existingModule->trashed()) {
                    $existingModule->restore();
                }
                $existingModule->update([
                    'name' => $moduleData['name'],
                    'route' => $moduleData['route'],
                    'icon' => $moduleData['icon'],
                    'module_group_id' => $groups[$moduleData['group']] ?? null,
                    'updated_by' => $adminId,
                ]);
                $createdModule = $existingModule;
            } else {
                $createdModule = Module::create([
                    'identifier' => $moduleData['identifier'],
                    'name' => $moduleData['name'],
                    'route' => $moduleData['route'],
                    'icon' => $moduleData['icon'],
                    'module_group_id' => $groups[$moduleData['group']] ?? null,
                    'created_by' => $adminId,
                    'updated_by' => $adminId,
                ]);
            }

            // Grant Admin access to everything by default
            if ($adminRole) {
                $existingAccess = AccessModule::where('role_id', $adminRole->id)
                    ->where('module_id', $createdModule->id)
                    ->first();

                if ($existingAccess) {
                    $existingAccess->update([
                        'module_group_id' => $createdModule->module_group_id,
                        'can_read' => true,
                        'can_create' => true,
                        'can_update' => true,
                        'can_delete' => true,
                        'can_approve' => true,
                    ]);
                } else {
                    AccessModule::create([
                        'role_id' => $adminRole->id,
                        'module_id' => $createdModule->id,
                        'module_group_id' => $createdModule->module_group_id,
                        'can_read' => true,
                        'can_create' => true,
                        'can_update' => true,
                        'can_delete' => true,
                        'can_approve' => true,
                    ]);
                }
            }
        }

        // Clean up removed modules
        $identifiers = array_column($modules, 'identifier');
        Module::whereNotIn('identifier', $identifiers)->delete();
    }
}
