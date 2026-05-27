<?php

namespace Database\Seeders;

use App\Models\AccessModule;
use App\Models\Department;
use App\Models\Module;
use App\Models\ModuleGroup;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class MasterSeeder extends Seeder
{
    /**
     * Run the comprehensive Master Data seeder.
     * Consolidates all 'm_'-prefixed tables for a clean baseline.
     */
    public function run(): void
    {
        // We skip truncating here as 'migrate:fresh' handled it or we use updateOrCreate
        // to maintain records seeded by preceding specialized seeders.

        // Roles and Departments are now handled by RoleSeeder and DepartmentSeeder.
        $legalId = Department::where('code', 'LGL')->value('id');

        // 4. Seed Users (Baseline)
        $admin = User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Administrator',
                'password' => Hash::make('password'),
                'role' => 'Admin',
                'department_id' => $legalId,
                'is_active' => true,
            ],
        );

        $procId = Department::where('code', 'PROC')->value('id');
        $finId = Department::where('code', 'FIN')->value('id');
        $itId = Department::where('code', 'IT')->value('id');
        $taxId = Department::where('code', 'TAX')->value('id');

        $managerRole = Role::where('name', 'Manager')->first();
        $directorRole = Role::where('name', 'Director')->first();
        $staffRole = Role::where('name', 'Staff')->first();

        User::updateOrCreate(['email' => 'ahmad@example.com'], ['name' => 'Ahmad Pembeli', 'password' => Hash::make('password'), 'role' => 'Staff', 'department_id' => $procId, 'role_id' => $staffRole->id]);
        User::updateOrCreate(['email' => 'budi@example.com'], ['name' => 'Budi Legal', 'password' => Hash::make('password'), 'role' => 'Manager', 'department_id' => $legalId, 'role_id' => $managerRole->id]);
        User::updateOrCreate(['email' => 'citra@example.com'], ['name' => 'Citra Tax', 'password' => Hash::make('password'), 'role' => 'Manager', 'department_id' => $taxId, 'role_id' => $managerRole->id]);
        User::updateOrCreate(['email' => 'dian@example.com'], ['name' => 'Dian Finance', 'password' => Hash::make('password'), 'role' => 'Manager', 'department_id' => $finId, 'role_id' => $managerRole->id]);
        User::updateOrCreate(['email' => 'eko@example.com'], ['name' => 'Eko Director', 'password' => Hash::make('password'), 'role' => 'Director', 'department_id' => $finId, 'role_id' => $directorRole->id]);

        // Contract Types and Statuses are now handled by specialized seeders (ContractTypeSeeder, ContractStatusSeeder)
        // to avoid duplication and maintain historical sample data.

        // 7. Seed Module Groups & Modules (Navigation structure)
        // Cleanup existing navigation structure to ensure clean baseline
        DB::table('m_role_module_groups')->truncate();
        AccessModule::query()->forceDelete();
        Module::query()->forceDelete();
        ModuleGroup::query()->forceDelete();

        $groups = [
            ['name' => 'Beranda', 'icon' => 'LayoutGrid'],
            ['name' => 'Modul Kontrak', 'icon' => 'FileText'],
            ['name' => 'Desain Template', 'icon' => 'Library'],
            ['name' => 'Konfigurasi Alur', 'icon' => 'GitBranch'],
            ['name' => 'Data Master', 'icon' => 'Database'],
            ['name' => 'Sistem & Laporan', 'icon' => 'ShieldCheck'],
        ];
        foreach ($groups as $g) {
            ModuleGroup::create([
                'name' => $g['name'],
                'icon' => $g['icon'],
            ]);
        }

        $mods = [
            // Beranda
            ['name' => 'Dashboard Utama', 'identifier' => 'DASH', 'group' => 'Beranda', 'route' => '/dashboard', 'icon' => 'LayoutGrid'],

            // Modul Kontrak
            ['name' => 'Draft saya', 'identifier' => 'MY_CTC', 'group' => 'Modul Kontrak', 'route' => '/contracts/mine', 'icon' => 'FilePlus'],
            ['name' => 'Semua Kontrak', 'identifier' => 'CONTRACTS', 'group' => 'Modul Kontrak', 'route' => '/contracts', 'icon' => 'Files'],
            ['name' => 'Perlu Persetujuan', 'identifier' => 'PENDING', 'group' => 'Modul Kontrak', 'route' => '/contracts/pending', 'icon' => 'ClipboardCheck'],
            ['name' => 'Masa Berlaku', 'identifier' => 'EXPIRY', 'group' => 'Modul Kontrak', 'route' => '/contracts/expiry', 'icon' => 'CalendarClock'],

            // Desain Template
            ['name' => 'Kategori Kontrak', 'identifier' => 'ADMIN_TYPES', 'group' => 'Desain Template', 'route' => '/admin/contract-types', 'icon' => 'FolderClosed'],
            ['name' => 'Isi Kontrak', 'identifier' => 'ADMIN_TEMPLATES', 'group' => 'Desain Template', 'route' => '/admin/templates', 'icon' => 'FileCode'],
            ['name' => 'Formulir Digital', 'identifier' => 'ADMIN_FORMS', 'group' => 'Desain Template', 'route' => '/admin/form-templates', 'icon' => 'ScanLine'],

            // Konfigurasi Alur
            ['name' => 'Alur Persetujuan', 'identifier' => 'ADMIN_WORKFLOWS', 'group' => 'Konfigurasi Alur', 'route' => '/admin/workflows', 'icon' => 'Workflow'],
            ['name' => 'Master Status', 'identifier' => 'ADMIN_STATUS', 'group' => 'Konfigurasi Alur', 'route' => '/admin/contract-statuses', 'icon' => 'Tags'],

            // Data Master
            ['name' => 'Data Group', 'identifier' => 'ADMIN_GROUPS', 'group' => 'Data Master', 'route' => '/admin/company-groups', 'icon' => 'Users'],
            ['name' => 'Data Region', 'identifier' => 'ADMIN_REGIONS', 'group' => 'Data Master', 'route' => '/admin/regions', 'icon' => 'GitBranch'],
            ['name' => 'Data Company', 'identifier' => 'ADMIN_COMPANIES', 'group' => 'Data Master', 'route' => '/admin/companies', 'icon' => 'Building2'],
            ['name' => 'Manajemen Pengguna', 'identifier' => 'ADMIN_USERS', 'group' => 'Data Master', 'route' => '/admin/users', 'icon' => 'UserCog'],
            ['name' => 'Hak Akses & Peran', 'identifier' => 'ADMIN_ROLES', 'group' => 'Data Master', 'route' => '/admin/roles', 'icon' => 'KeyRound'],
            ['name' => 'Data Departemen', 'identifier' => 'ADMIN_DEPTS', 'group' => 'Data Master', 'route' => '/admin/departments', 'icon' => 'Building2'],
            ['name' => 'Daftar Vendor', 'identifier' => 'ADMIN_VENDORS', 'group' => 'Data Master', 'route' => '/admin/vendors', 'icon' => 'Truck'],
            ['name' => 'Anggota Divisi', 'identifier' => 'ADMIN_MEMBERS', 'group' => 'Data Master', 'route' => '/admin/members', 'icon' => 'Users'],

            // Sistem & Laporan
            ['name' => 'Analitik Kontrak', 'identifier' => 'ANLTX', 'group' => 'Sistem & Laporan', 'route' => '/admin/reports/analytics', 'icon' => 'BarChart3'],
            ['name' => 'Jejak Audit', 'identifier' => 'AUDIT', 'group' => 'Sistem & Laporan', 'route' => '/admin/reports/audit', 'icon' => 'History'],
            ['name' => 'Ekspor Impor Master', 'identifier' => 'ADMIN_MASTER_DATA', 'group' => 'Sistem & Laporan', 'route' => '/admin/master-data-sync', 'icon' => 'RefreshCw'],
        ];

        foreach ($mods as $mIdx => $m) {
            $groupId = ModuleGroup::where('name', $m['group'])->value('id');
            Module::create([
                'name' => $m['name'],
                'identifier' => $m['identifier'],
                'module_group_id' => $groupId,
                'route' => $m['route'],
                'icon' => $m['icon'],
                'showed_as_menu' => true,
            ]);
        }

        // 8. Workflows & Steps are now handled by A1WorkflowSeeder.
        // This avoids duplication and ensures the 14-step workflow is the source of truth.

        // 9. Access Modules (Permissions) - Full for Admin
        $allRoles = Role::all();
        $allModules = Module::all();
        $allGroups = ModuleGroup::all();

        foreach ($allRoles as $role) {
            // Role-specific Group order
            foreach ($allGroups as $g) {
                DB::table('m_role_module_groups')->insert([
                    'role_id' => $role->id,
                    'module_group_id' => $g->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Permissions
            foreach ($allModules as $module) {
                $isAdmin = $role->name === 'Admin';
                $isManager = $role->name === 'Manager';

                // Audit only for Admin
                if ($module->identifier === 'AUDIT' && ! $isAdmin) {
                    continue;
                }
                // Admin sections only for Admin
                if (str_starts_with($module->route, '/admin') && ! $isAdmin) {
                    continue;
                }

                AccessModule::create([
                    'id' => Str::uuid(),
                    'role_id' => $role->id,
                    'module_id' => $module->id,
                    'module_group_id' => $module->module_group_id,
                    'can_read' => true,
                    'can_create' => $isAdmin || $isManager,
                    'can_update' => $isAdmin || $isManager,
                    'can_delete' => $isAdmin,
                    'can_approve' => $isAdmin || $isManager || $role->name === 'Director',
                ]);
            }
        }
    }
}
