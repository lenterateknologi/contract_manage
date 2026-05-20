<?php

namespace Database\Seeders;

use App\Models\AccessModule;
use App\Models\Module;
use App\Models\ModuleGroup;
use App\Models\Role;
use App\Models\RoleModuleGroup;
use Illuminate\Database\Seeder;

class MigrateNavigationToRoleSpecificSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = Role::all();
        $modules = Module::all();
        $groups = ModuleGroup::all();

        foreach ($roles as $role) {
            // Copy group sort order
            foreach ($groups as $group) {
                RoleModuleGroup::updateOrCreate(
                    ['role_id' => $role->id, 'module_group_id' => $group->id],
                    ['sort_number' => $group->sort_number ?? 0],
                );
            }

            // Copy module grouping and sort order
            foreach ($modules as $module) {
                // Only if they have access
                $access = AccessModule::where('role_id', $role->id)
                    ->where('module_id', $module->id)
                    ->first();

                if ($access) {
                    $access->update([
                        'module_group_id' => $module->module_group_id,
                        'sort_number' => $module->sort_number ?? 0,
                    ]);
                }
            }
        }
    }
}
