<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,             // 1. Roles
            DepartmentSeeder::class,       // 2. Departments
            ContractTypeSeeder::class,     // 3. Types
            ContractStatusSeeder::class,   // 4. Statuses
            MasterSeeder::class,           // 5. Structure & Admin (finds Roles/Depts)
            VendorSeeder::class,           // 6. Vendors
            UserSeeder::class,             // 7. Extended Users
            SampleSeeder::class,           // 8. Transactions & Redesigns
        ]);
    }
}
