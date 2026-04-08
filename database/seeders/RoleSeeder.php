<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            ['name' => 'Admin', 'description' => 'Super Administrator with full access'],
            ['name' => 'Initiator', 'description' => 'User who initiates contract requests'],
            ['name' => 'Tax', 'description' => 'Tax department reviewer'],
            ['name' => 'Legal', 'description' => 'Legal department reviewer'],
            ['name' => 'Management', 'description' => 'Management level reviewer'],
            ['name' => 'Direksi', 'description' => 'Director level reviewer'],
            ['name' => 'Vendor', 'description' => 'External vendor reviewer'],
        ];

        foreach ($roles as $role) {
            \App\Models\Role::updateOrCreate(['name' => $role['name']], $role);
        }
    }
}
