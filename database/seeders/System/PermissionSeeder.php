<?php

namespace Database\Seeders\System;

use App\Models\AccessModule;
use App\Models\Module;
use App\Models\Role;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $roles = Role::all();
        $allModules = Module::all();

        foreach ($roles as $role) {
            $isFullAccess = in_array($role->name, ['Super Admin', 'Admin']);

            foreach ($allModules as $module) {
                AccessModule::updateOrCreate([
                    'role_id' => $role->id,
                    'module_id' => $module->id,
                ], [
                    'module_group_id' => $module->module_group_id,
                    'can_read' => true,
                    'can_create' => $isFullAccess || in_array($role->name, ['Staff', 'Manager', 'Reviewer']),
                    'can_update' => $isFullAccess || in_array($role->name, ['Staff', 'Manager', 'Reviewer']),
                    'can_delete' => $isFullAccess,
                    'can_approve' => $isFullAccess || in_array($role->name, ['Manager', 'Reviewer']),
                    'can_bulk_approve' => $isFullAccess,
                    'can_bulk_delete' => $isFullAccess,
                ]);
            }
        }
    }
}
