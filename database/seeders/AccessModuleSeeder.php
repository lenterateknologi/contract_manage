<?php

namespace Database\Seeders;

use App\Models\Module;
use App\Models\ModuleGroup;
use App\Models\Role;
use App\Models\User;
use App\Models\AccessModule;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AccessModuleSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstWhere('email', 'admin@example.com') ?? User::first();
        $adminId = $admin ? $admin->id : null;
        $roles = Role::all();
        $modules = Module::all();

        // Truncation is handled in MasterSeeder, but we'll do pivot table cleanup here too
        DB::table('m_role_module_groups')->truncate();

        foreach ($roles as $role) {
            // Seed group relationships for each role
            $groups = ModuleGroup::all();
            foreach ($groups as $group) {
                DB::table('m_role_module_groups')->insert([
                    'role_id' => $role->id,
                    'module_group_id' => $group->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            foreach ($modules as $module) {
                // Skip sensitive modules for non-admins
                if ($module->identifier === 'AUDIT' && $role->name !== 'Admin') {
                    continue;
                }

                if (str_starts_with($module->route, '/admin') && $role->name !== 'Admin') {
                    continue;
                }

                AccessModule::updateOrCreate(
                    [
                        'role_id' => $role->id,
                        'module_id' => $module->id,
                    ],
                    [
                        'can_view' => true,
                        'can_create' => $role->name === 'Admin' || $role->name === 'Manager',
                        'can_edit' => $role->name === 'Admin' || $role->name === 'Manager',
                        'can_delete' => $role->name === 'Admin',
                        'can_approve' => $role->name === 'Admin' || $role->name === 'Manager' || $role->name === 'Director',
                    ]
                );
            }
        }
    }
}
