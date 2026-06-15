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
            System\ContractStatusSeeder::class,
            System\SubmissionTypeSeeder::class,

            // --- BUSINESS MASTER DATA ---
            Business\OrganizationalSeeder::class,
            Business\DepartmentSeeder::class,
            Business\ContractTypeSeeder::class,
            Business\VendorSeeder::class,
            Business\UserSeeder::class,
            Business\WorkflowSeeder::class,

            // --- TRANSACTIONAL DATA ---
            Transaction\ContractSeeder::class,
        ]);
    }
}
