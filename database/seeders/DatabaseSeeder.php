<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            OrganizationalMasterSeeder::class, // 0. Organizational Master (Groups, Regions, Companies)
            RoleSeeder::class,               // 1. Roles
            DepartmentSeeder::class,         // 2. Departments
            ContractTypeSeeder::class,       // 3. Types
            ContractStatusSeeder::class,     // 4. Statuses
            SubmissionTypeSeeder::class,     // 5. Submission Types
            MasterSeeder::class,             // 6. Structure & Admin (finds Roles/Depts)
            VendorSeeder::class,             // 7. Vendors Base
            VendorRealisticSeeder::class,    // 8. Premium Vendors
            UserSeeder::class,               // 9. Extended Users
            A1WorkflowSeeder::class,         // 10. Unified A1 Workflow (14 Steps)
            SampleSeeder::class,             // 11. Transactions & Redesigns
        ]);
    }
}
