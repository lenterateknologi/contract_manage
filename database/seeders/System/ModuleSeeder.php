<?php

namespace Database\Seeders\System;

use App\Models\Module;
use App\Models\ModuleGroup;
use Illuminate\Database\Seeder;

class ModuleSeeder extends Seeder
{
    public function run(): void
    {
        $dir = database_path('data_json');
        $files = glob($dir.'/master_data_export_*.json');
        if (empty($files)) {
            return;
        }
        usort($files, function ($a, $b) {
            return filemtime($b) <=> filemtime($a);
        });
        $jsonPath = $files[0];

        $jsonData = json_decode(file_get_contents($jsonPath), true);

        foreach ($jsonData['module_groups'] as $groupData) {
            ModuleGroup::withTrashed()->updateOrCreate(['name' => $groupData['name']], [
                'icon' => $groupData['icon'] ?? null,
                'deleted_at' => null,
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
