<?php

namespace Database\Seeders;

use App\Models\AccessModule;
use App\Models\ContractStatus;
use App\Models\ContractType;
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
                'id' => Str::uuid(),
                'name' => 'Administrator',
                'password' => Hash::make('password'),
                'role' => 'Admin',
                'department_id' => $legalId,
                'is_active' => true,
            ]
        );

        $procId = Department::where('code', 'PROC')->value('id');
        $finId = Department::where('code', 'FIN')->value('id');
        $itId = Department::where('code', 'IT')->value('id');
        $taxId = Department::where('code', 'TAX')->value('id');

        $managerRole = Role::where('name', 'Manager')->first();
        $directorRole = Role::where('name', 'Director')->first();
        $staffRole = Role::where('name', 'Staff')->first();

        User::updateOrCreate(['email' => 'ahmad@example.com'], ['id' => Str::uuid(), 'name' => 'Ahmad Pembeli', 'password' => Hash::make('password'), 'role' => 'Staff', 'department_id' => $procId, 'role_id' => $staffRole->id]);
        User::updateOrCreate(['email' => 'budi@example.com'], ['id' => Str::uuid(), 'name' => 'Budi Legal', 'password' => Hash::make('password'), 'role' => 'Manager', 'department_id' => $legalId, 'role_id' => $managerRole->id]);
        User::updateOrCreate(['email' => 'citra@example.com'], ['id' => Str::uuid(), 'name' => 'Citra Tax', 'password' => Hash::make('password'), 'role' => 'Manager', 'department_id' => $taxId, 'role_id' => $managerRole->id]);
        User::updateOrCreate(['email' => 'dian@example.com'], ['id' => Str::uuid(), 'name' => 'Dian Finance', 'password' => Hash::make('password'), 'role' => 'Manager', 'department_id' => $finId, 'role_id' => $managerRole->id]);
        User::updateOrCreate(['email' => 'eko@example.com'], ['id' => Str::uuid(), 'name' => 'Eko Director', 'password' => Hash::make('password'), 'role' => 'Director', 'department_id' => $finId, 'role_id' => $directorRole->id]);

        // Contract Types and Statuses are now handled by specialized seeders (ContractTypeSeeder, ContractStatusSeeder)
        // to avoid duplication and maintain historical sample data.

        // 7. Seed Module Groups & Modules (Navigation structure)
        $groups = [
            ['id' => Str::uuid(), 'name' => 'Dashboard', 'icon' => 'LayoutGrid', 'sequence' => 1],
            ['id' => Str::uuid(), 'name' => 'Kontrak', 'icon' => 'FileText', 'sequence' => 2],
            ['id' => Str::uuid(), 'name' => 'Laporan', 'icon' => 'BarChart2', 'sequence' => 3],
            ['id' => Str::uuid(), 'name' => 'Administrasi', 'icon' => 'ShieldCheck', 'sequence' => 4],
        ];
        foreach ($groups as $g) ModuleGroup::create($g);

        $mods = [
            ['name' => 'Summary', 'identifier' => 'DASHBOARD', 'group' => 'Dashboard', 'route' => '/dashboard', 'icon' => 'Home', 'seq' => 1],
            ['name' => 'Laporan', 'identifier' => 'ANLTX', 'group' => 'Dashboard', 'route' => '/admin/reports', 'icon' => 'BarChart3', 'seq' => 2],
            ['name' => 'Semua Kontrak', 'identifier' => 'CONTRACTS', 'group' => 'Kontrak', 'route' => '/contracts', 'icon' => 'Files', 'seq' => 1],
            ['name' => 'Kontrak Saya', 'identifier' => 'MY_CONTRACTS', 'group' => 'Kontrak', 'route' => '/contracts/mine', 'icon' => 'User', 'seq' => 2],
            ['name' => 'Menunggu Approval', 'identifier' => 'PENDING', 'group' => 'Kontrak', 'route' => '/contracts/pending', 'icon' => 'Clock', 'seq' => 3],
            //expiry
            ['name' => 'Masa Berlaku', 'identifier' => 'EXPIRY', 'group' => 'Kontrak', 'route' => '/contracts/expiry', 'icon' => 'History', 'seq' => 4],
            // ['name' => 'Formulir F1', 'identifier' => 'F1_LIST', 'group' => 'Kontrak', 'route' => '/contracts/f1', 'icon' => 'FilePlus', 'seq' => 4],
            // ['name' => 'Formulir F2', 'identifier' => 'F2_LIST', 'group' => 'Kontrak', 'route' => '/contracts/f2', 'icon' => 'FileCheck', 'seq' => 5],

            // ['name' => 'Rekap Kontrak', 'identifier' => 'REPORT', 'group' => 'Laporan', 'route' => '/reports', 'icon' => 'ClipboardList', 'seq' => 1],
            // ['name' => 'Audit Trail', 'identifier' => 'AUDIT', 'group' => 'Laporan', 'route' => '/reports/audit', 'icon' => 'History', 'seq' => 2],

            ['name' => 'Manajemen Role', 'identifier' => 'ADMIN_ROLES', 'group' => 'Administrasi', 'route' => '/admin/roles', 'icon' => 'Shield', 'seq' => 1],
            ['name' => 'Manajemen User', 'identifier' => 'ADMIN_USERS', 'group' => 'Administrasi', 'route' => '/admin/users', 'icon' => 'Users', 'seq' => 2],
            ['name' => 'Form Template', 'identifier' => 'ADMIN_FORMS', 'group' => 'Administrasi', 'route' => '/admin/form-templates', 'icon' => 'ListChecks', 'seq' => 3],
            ['name' => 'Folder Template', 'identifier' => 'ADMIN_TEMPLATES', 'group' => 'Administrasi', 'route' => '/admin/templates', 'icon' => 'FolderOpen', 'seq' => 4],
            ['name' => 'Manajemen Vendor', 'identifier' => 'ADMIN_VENDORS', 'group' => 'Administrasi', 'route' => '/admin/vendors', 'icon' => 'Building2', 'seq' => 5],
            ['name' => 'Manajemen Departemen', 'identifier' => 'ADMIN_DEPTS', 'group' => 'Administrasi', 'route' => '/admin/departments', 'icon' => 'Library', 'seq' => 6],
            ['name' => 'Tipe Kontrak', 'identifier' => 'ADMIN_TYPES', 'group' => 'Administrasi', 'route' => '/admin/contract-types', 'icon' => 'Tags', 'seq' => 7],
            ['name' => 'Status Kontrak', 'identifier' => 'ADMIN_STATUS', 'group' => 'Administrasi', 'route' => '/admin/contract-statuses', 'icon' => 'Activity', 'seq' => 8],
            ['name' => 'Workflow Approval', 'identifier' => 'ADMIN_WORKFLOWS', 'group' => 'Administrasi', 'route' => '/admin/workflows', 'icon' => 'GitBranch', 'seq' => 9],
        ];

        foreach ($mods as $m) {
            $groupId = ModuleGroup::where('name', $m['group'])->value('id');
            Module::create([
                'id' => Str::uuid(),
                'name' => $m['name'],
                'identifier' => $m['identifier'],
                'module_group_id' => $groupId,
                'route' => $m['route'],
                'icon' => $m['icon'],
                'sequence' => $m['seq'],
                'showed_as_menu' => true,
            ]);
        }

        // 8. Workflows & Steps (Dual-Workflow Strategy: Standard vs With Tax)
        $pksTypeId = ContractType::where('code', 'PKS')->value('id');
        $jasaTypeId = ContractType::where('code', 'JASA')->value('id');

        $workflowConfigs = [
            [
                'name' => 'PKS Standard',
                'type_id' => $pksTypeId,
                'type_name' => 'Perjanjian Kerja Sama',
                'is_tax' => false,
                'steps' => [
                    ['role' => 'Manager', 'desc' => 'Direct Review', 'dept' => 'LGL'],
                    ['role' => 'Director', 'desc' => 'Final Approval', 'dept' => 'FIN'],
                ]
            ],
            [
                'name' => 'PKS with Tax Review',
                'type_id' => $pksTypeId,
                'type_name' => 'Perjanjian Kerja Sama',
                'is_tax' => true,
                'steps' => [
                    ['role' => 'Manager', 'desc' => 'Direct Review', 'dept' => 'LGL'],
                    ['role' => 'Manager', 'desc' => 'Tax Validation', 'dept' => 'TAX'],
                    ['role' => 'Director', 'desc' => 'Final Approval', 'dept' => 'FIN'],
                ]
            ],
            [
                'name' => 'Jasa Standard',
                'type_id' => $jasaTypeId,
                'type_name' => 'Perjanjian Jasa',
                'is_tax' => false,
                'steps' => [
                    ['role' => 'Manager', 'desc' => 'Service Validation', 'dept' => 'IT'],
                    ['role' => 'Director', 'desc' => 'Final Approval', 'dept' => 'FIN'],
                ]
            ]
        ];

        foreach ($workflowConfigs as $wf) {
            $workflow = \App\Models\Workflow::create([
                'id' => Str::uuid(),
                'name' => $wf['name'],
                'contract_type' => $wf['type_name'],
                'is_tax_involved' => $wf['is_tax'],
                'is_default' => !$wf['is_tax'], // Default is the standard one
                'is_template' => true,
                'created_by' => $admin->id,
            ]);

            foreach ($wf['steps'] as $idx => $s) {
                $deptId = Department::where('code', $s['dept'])->value('id');
                \App\Models\WorkflowStep::create([
                    'id' => Str::uuid(),
                    'workflow_id' => $workflow->id,
                    'role' => $s['role'],
                    'step' => $idx + 1,
                    'department_id' => $deptId,
                    'description' => $s['desc'],
                    'created_by' => $admin->id,
                ]);
            }
        }

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
                    'sequence' => $g->sequence,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Permissions
            foreach ($allModules as $module) {
                $isAdmin = $role->name === 'Admin';
                $isManager = $role->name === 'Manager';

                // Audit only for Admin
                if ($module->identifier === 'AUDIT' && !$isAdmin) continue;
                // Admin sections only for Admin
                if (str_starts_with($module->route, '/admin') && !$isAdmin) continue;

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
                    'sequence' => $module->sequence,
                ]);
            }
        }
    }
}
