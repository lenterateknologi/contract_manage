<?php

namespace Database\Seeders\System;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $jsonPath = base_path('data_json/master data sidebar.json');
        if (! file_exists($jsonPath)) {
            return;
        }

        $jsonData = json_decode(file_get_contents($jsonPath), true);

        foreach ($jsonData['roles'] as $role) {
            Role::updateOrCreate(['name' => $role['name']], [
                'description' => $role['description'] ?? null,
            ]);
        }
    }
}
