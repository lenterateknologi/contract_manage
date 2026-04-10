<?php

namespace Database\Seeders;

use App\Models\Module;
use App\Models\ModuleGroup;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AccessModuleSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstWhere('email', 'admin@example.com') ?? User::first();
        $roles = Role::all();
        $modules = Module::all();

        // Cleanup: Remove all old assignments to ensure a perfect reset
        DB::table('access_modules')->truncate();
        DB::table('role_module_groups')->truncate();

        $groups = ModuleGroup::all();

        foreach ($roles as $role) {
            // Seed group ordering for each role
            foreach ($groups as $group) {
                DB::table('role_module_groups')->insert([
                    'role_id' => $role->id,
                    'module_group_id' => $group->id,
                    'sort_number' => $group->sort_number,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            foreach ($modules as $module) {
                if ($module->title === 'Audit Trail' && $role->name !== 'Admin') {
                    continue;
                }

                if (str_starts_with($module->url, '/admin') && $role->name !== 'Admin') {
                    continue;
                }

                DB::table('access_modules')->updateOrInsert(
                    [
                        'role_id' => $role->id,
                        'module_id' => $module->id,
                    ],
                    [
                        'can_read' => true,
                        'can_create' => true,
                        'can_update' => true,
                        'can_delete' => true,
                        'module_group_id' => $module->module_group_id,
                        'sort_number' => $module->sort_number,
                        'created_by' => $admin->id,
                        'updated_at' => now(),
                    ]
                );
            }
        }
    }
}
