<?php

namespace Database\Seeders\System;

use App\Models\Module;
use App\Models\ModuleGroup;
use Illuminate\Database\Seeder;

class ModuleSeeder extends Seeder
{
    public function run(): void
    {
        $jsonPath = base_path('data_json/master data sidebar.json');
        if (! file_exists($jsonPath)) {
            return;
        }

        $jsonData = json_decode(file_get_contents($jsonPath), true);

        foreach ($jsonData['module_groups'] as $groupData) {
            ModuleGroup::updateOrCreate(['name' => $groupData['name']], [
                'icon' => $groupData['icon'] ?? null,
            ]);
        }

        $groupMap = ModuleGroup::pluck('id', 'name')->all();

        foreach ($jsonData['modules'] as $moduleData) {
            $groupId = ! empty($moduleData['module_group_name']) ? ($groupMap[$moduleData['module_group_name']] ?? null) : null;
            Module::updateOrCreate(['identifier' => $moduleData['identifier']], [
                'name' => $moduleData['name'],
                'route' => $moduleData['route'] ?? null,
                'icon' => $moduleData['icon'] ?? null,
                'description' => $moduleData['description'] ?? null,
                'module_group_id' => $groupId,
                'showed_as_menu' => $moduleData['showed_as_menu'] ?? true,
                'is_active' => $moduleData['is_active'] ?? true,
            ]);
        }
    }
}
