<?php

namespace Database\Seeders\System;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
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

        foreach ($jsonData['roles'] as $role) {
            Role::updateOrCreate(['name' => $role['name']], [
                'description' => $role['description'] ?? null,
            ]);
        }
    }
}
