<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            // --- SYSTEM MASTER DATA ---
            System\RoleSeeder::class,
            System\ModuleSeeder::class,
            System\PermissionSeeder::class,
            Business\OrganizationalSeeder::class,
            Business\DepartmentSeeder::class,
            Business\UserSeeder::class,
        ]);
    }
}
