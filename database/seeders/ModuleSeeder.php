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

            // Manajemen Kontrak
            ['identifier' => 'CONTRACTS', 'name' => 'Daftar Kontrak', 'route' => '/contracts', 'icon' => 'FileText', 'group' => 'Manajemen Kontrak', 'sequence' => 1],
            ['identifier' => 'MY_CTC', 'name' => 'Kontrak Saya', 'route' => '/contracts/mine', 'icon' => 'UserCheck', 'group' => 'Manajemen Kontrak', 'sequence' => 2],
            ['identifier' => 'PENDING', 'name' => 'Persetujuan', 'route' => '/contracts/pending', 'icon' => 'Clock', 'group' => 'Manajemen Kontrak', 'sequence' => 3],
            ['identifier' => 'EXPIRY', 'name' => 'Masa Berlaku', 'route' => '/contracts/expiry', 'icon' => 'History', 'group' => 'Manajemen Kontrak', 'sequence' => 4],

            // Template Library
            ['identifier' => 'ADMIN_TYPES', 'name' => 'Folder Kontrak', 'route' => '/admin/contract-types', 'icon' => 'FolderClosed', 'group' => 'Template Library', 'sequence' => 1],
            ['identifier' => 'ADMIN_TEMPLATES', 'name' => 'Isi Kontrak', 'route' => '/admin/templates', 'icon' => 'FileCode', 'group' => 'Template Library', 'sequence' => 2],
            ['identifier' => 'ADMIN_FORMS', 'name' => 'Digital Form', 'route' => '/admin/form-templates', 'icon' => 'ScanLine', 'group' => 'Template Library', 'sequence' => 3],

            // Workflow Engine
            ['identifier' => 'ADMIN_WORKFLOWS', 'name' => 'Alur Persetujuan', 'route' => '/admin/workflows', 'icon' => 'Workflow', 'group' => 'Workflow Engine', 'sequence' => 1],
            ['identifier' => 'ADMIN_STATUS', 'name' => 'Label Status', 'route' => '/admin/contract-statuses', 'icon' => 'Tags', 'group' => 'Workflow Engine', 'sequence' => 2],

            // Master Data
            ['identifier' => 'ADMIN_USERS', 'name' => 'Database User', 'route' => '/admin/users', 'icon' => 'UserCog', 'group' => 'Master Data', 'sequence' => 1],
            ['identifier' => 'ADMIN_ROLES', 'name' => 'Izin & Akses', 'route' => '/admin/roles', 'icon' => 'KeyRound', 'group' => 'Master Data', 'sequence' => 2],
            ['identifier' => 'ADMIN_DEPTS', 'name' => 'Departemen', 'route' => '/admin/departments', 'icon' => 'Building2', 'group' => 'Master Data', 'sequence' => 3],
            ['identifier' => 'ADMIN_VENDORS', 'name' => 'Rekan Vendor', 'route' => '/admin/vendors', 'icon' => 'Truck', 'group' => 'Master Data', 'sequence' => 4],

            // System & Security
            ['identifier' => 'ANLTX', 'name' => 'Laporan Analitikal', 'route' => '/admin/reports', 'icon' => 'BarChart3', 'group' => 'System & Security', 'sequence' => 1],
            ['identifier' => 'ADMIN_NAV', 'name' => 'Struktur Navigasi', 'route' => '/admin/module-groups', 'icon' => 'Settings2', 'group' => 'System & Security', 'sequence' => 2],
        ];

        // Get the Admin Role
        $adminRole = Role::firstWhere('name', 'Admin');

        foreach ($modules as $moduleData) {
            $existingModule = Module::withTrashed()->where('identifier', $moduleData['identifier'])->first();
            
            if ($existingModule) {
                if ($existingModule->trashed()) $existingModule->restore();
                $existingModule->update([
                    'name' => $moduleData['name'],
                    'route' => $moduleData['route'],
                    'icon' => $moduleData['icon'],
                    'sequence' => $moduleData['sequence'],
                    'module_group_id' => $groups[$moduleData['group']] ?? null,
                    'created_by' => $adminId,
                    'updated_by' => $adminId,
                ]);
                $createdModule = $existingModule;
            } else {
                $createdModule = Module::create([
                    'identifier' => $moduleData['identifier'],
                    'name' => $moduleData['name'],
                    'route' => $moduleData['route'],
                    'icon' => $moduleData['icon'],
                    'sequence' => $moduleData['sequence'],
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
                        'sequence' => $createdModule->sequence,
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
                        'sequence' => $createdModule->sequence,
                    ]);
                }
            }
        }

        // Clean up removed modules
        $identifiers = array_column($modules, 'identifier');
        Module::whereNotIn('identifier', $identifiers)->delete();
    }
}
