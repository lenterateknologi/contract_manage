<?php

namespace Database\Seeders;

use App\Models\Role;
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
            ['name' => 'Manager', 'description' => 'Department head or team manager with approval authority'],
            ['name' => 'Staff', 'description' => 'Regular employee with initiation and review authority'],
            ['name' => 'Director', 'description' => 'Executive level with final approval authority'],
            ['name' => 'Vendor', 'description' => 'External party with restricted access'],
        ];

        foreach ($roles as $role) {
            Role::withTrashed()->updateOrCreate(
                ['name' => $role['name']],
                ['description' => $role['description'], 'deleted_at' => null]
            );
        }
    }
}
