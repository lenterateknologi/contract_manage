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
            ['name' => 'Dashboard', 'icon' => 'LayoutGrid', 'sequence' => 1],
            ['name' => 'Manajemen Kontrak', 'icon' => 'FileText', 'sequence' => 2],
            ['name' => 'Template Library', 'icon' => 'Library', 'sequence' => 3],
            ['name' => 'Workflow Engine', 'icon' => 'GitBranch', 'sequence' => 4],
            ['name' => 'Master Data', 'icon' => 'Database', 'sequence' => 5],
            ['name' => 'System & Security', 'icon' => 'ShieldCheck', 'sequence' => 6],
        ];
        foreach ($groups as $g) {
            ModuleGroup::create([
                'name' => $g['name'],
                'icon' => $g['icon'],
                'sequence' => $g['sequence']
            ]);
        }

        $mods = [
            // Dashboard
            ['name' => 'Dashboard', 'identifier' => 'DASH', 'group' => 'Dashboard', 'route' => '/dashboard', 'icon' => 'LayoutGrid', 'seq' => 1],
            
            // Manajemen Kontrak
            ['name' => 'Daftar Kontrak', 'identifier' => 'CONTRACTS', 'group' => 'Manajemen Kontrak', 'route' => '/contracts', 'icon' => 'FileText', 'seq' => 1],
            ['name' => 'Kontrak Saya', 'identifier' => 'MY_CTC', 'group' => 'Manajemen Kontrak', 'route' => '/contracts/mine', 'icon' => 'UserCheck', 'seq' => 2],
            ['name' => 'Persetujuan', 'identifier' => 'PENDING', 'group' => 'Manajemen Kontrak', 'route' => '/contracts/pending', 'icon' => 'Clock', 'seq' => 3],
            ['name' => 'Masa Berlaku', 'identifier' => 'EXPIRY', 'group' => 'Manajemen Kontrak', 'route' => '/contracts/expiry', 'icon' => 'History', 'seq' => 4],

            // Template Library
            ['name' => 'Folder Kontrak', 'identifier' => 'ADMIN_TYPES', 'group' => 'Template Library', 'route' => '/admin/contract-types', 'icon' => 'FolderClosed', 'seq' => 1],
            ['name' => 'Isi Kontrak', 'identifier' => 'ADMIN_TEMPLATES', 'group' => 'Template Library', 'route' => '/admin/templates', 'icon' => 'FileCode', 'seq' => 2],
            ['name' => 'Digital Form', 'identifier' => 'ADMIN_FORMS', 'group' => 'Template Library', 'route' => '/admin/form-templates', 'icon' => 'ScanLine', 'seq' => 3],

            // Workflow Engine
            ['name' => 'Alur Persetujuan', 'identifier' => 'ADMIN_WORKFLOWS', 'group' => 'Workflow Engine', 'route' => '/admin/workflows', 'icon' => 'Workflow', 'seq' => 1],
            ['name' => 'Label Status', 'identifier' => 'ADMIN_STATUS', 'group' => 'Workflow Engine', 'route' => '/admin/contract-statuses', 'icon' => 'Tags', 'seq' => 2],

            // Master Data
            ['name' => 'Database User', 'identifier' => 'ADMIN_USERS', 'group' => 'Master Data', 'route' => '/admin/users', 'icon' => 'UserCog', 'seq' => 1],
            ['name' => 'Izin & Akses', 'identifier' => 'ADMIN_ROLES', 'group' => 'Master Data', 'route' => '/admin/roles', 'icon' => 'KeyRound', 'seq' => 2],
            ['name' => 'Departemen', 'identifier' => 'ADMIN_DEPTS', 'group' => 'Master Data', 'route' => '/admin/departments', 'icon' => 'Building2', 'seq' => 3],
            ['name' => 'Rekan Vendor', 'identifier' => 'ADMIN_VENDORS', 'group' => 'Master Data', 'route' => '/admin/vendors', 'icon' => 'Truck', 'seq' => 4],

            // System & Security
            ['name' => 'Laporan Analitikal', 'identifier' => 'ANLTX', 'group' => 'System & Security', 'route' => '/admin/reports', 'icon' => 'BarChart3', 'seq' => 1],
        ];

        foreach ($mods as $m) {
            $groupId = ModuleGroup::where('name', $m['group'])->value('id');
            Module::create([
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
            $workflow = \App\Models\Workflow::updateOrCreate([
                'name' => $wf['name'],
                'contract_type' => $wf['type_name'],
            ], [
                'is_tax_involved' => $wf['is_tax'],
                'is_default' => !$wf['is_tax'], // Default is the standard one
                'is_template' => true,
                'created_by' => $admin->id,
            ]);

            $workflow->steps()->forceDelete();

            foreach ($wf['steps'] as $idx => $s) {
                $deptId = Department::where('code', $s['dept'])->value('id');
                $step = \App\Models\WorkflowStep::create([
                    'workflow_id' => $workflow->id,
                    'step' => $idx + 1,
                    'description' => $s['desc'],
                    'created_by' => $admin->id,
                    'approver_type' => 'role',
                    'is_active' => true,
                ]);

                if (!empty($s['role'])) {
                    $step->approverRoles()->create(['role_name' => $s['role']]);
                }

                if ($deptId) {
                    $step->approverDepartments()->create(['department_id' => $deptId]);
                }
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
