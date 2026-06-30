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
        $jsonPath = base_path('data_json/master data sidebar.json');
        if (! file_exists($jsonPath)) {
            return;
        }

        $jsonData = json_decode(file_get_contents($jsonPath), true);

        $roleMap = Role::pluck('id', 'name')->all();
        $moduleMap = Module::pluck('id', 'identifier')->all();

        foreach ($jsonData['access_mappings'] as $mapping) {
            $roleId = $roleMap[$mapping['role_name']] ?? null;
            $moduleId = $moduleMap[$mapping['module_identifier']] ?? null;

            if ($roleId && $moduleId) {
                $module = Module::find($moduleId);
                AccessModule::updateOrCreate([
                    'role_id' => $roleId,
                    'module_id' => $moduleId,
                ], [
                    'module_group_id' => $module->module_group_id,
                    'can_read' => $mapping['can_read'] ?? false,
                    'can_create' => $mapping['can_create'] ?? false,
                    'can_update' => $mapping['can_update'] ?? false,
                    'can_delete' => $mapping['can_delete'] ?? false,
                    'can_approve' => $mapping['can_approve'] ?? false,
                    'can_bulk_approve' => $mapping['can_bulk_approve'] ?? false,
                    'can_bulk_delete' => $mapping['can_bulk_delete'] ?? false,
                    'sequence' => $mapping['sequence'] ?? null,
                ]);
            }
        }
    }
}
