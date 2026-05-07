<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,               // 1. Roles
            DepartmentSeeder::class,         // 2. Departments
            ContractTypeSeeder::class,       // 3. Types
            ContractStatusSeeder::class,     // 4. Statuses
            SubmissionTypeSeeder::class,     // 5. Submission Types
            MasterSeeder::class,             // 6. Structure & Admin (finds Roles/Depts)
            VendorSeeder::class,             // 7. Vendors Base
            VendorRealisticSeeder::class,    // 8. Premium Vendors
            UserSeeder::class,               // 9. Extended Users
            UnifiedWorkflowSeeder::class,    // 10. Unified Workflows (F1 Master)
            MeetingUpdateWorkflowSeeder::class, // 11. Meeting Updates (F1 Pak Rendi/Ibu Nisa)
            SampleSeeder::class,             // 12. Transactions & Redesigns
        ]);
    }
}
