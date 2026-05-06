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
            SubmissionTypeSeeder::class,   // 5. Submission Types
            MasterSeeder::class,           // 6. Structure & Admin (finds Roles/Depts)
            VendorSeeder::class,           // 7. Vendors
            UserSeeder::class,             // 8. Extended Users
            SampleSeeder::class,           // 9. Transactions & Redesigns
            JsonDataSeeder::class,         // 10. Data from JSON files
        ]);
    }
}
