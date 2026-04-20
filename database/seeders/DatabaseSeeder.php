<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            DepartmentSeeder::class,
            RoleSeeder::class,
            UserSeeder::class,
            VendorSeeder::class,
            ModuleGroupSeeder::class,
            ModuleSeeder::class,
            AccessModuleSeeder::class,
            ContractTypeSeeder::class,
            WorkflowSeeder::class,
            WorkflowStepSeeder::class,
            ContractSeeder::class,
            ContractStatusSeeder::class,
            F1RedesignSeeder::class,
            F2RedesignSeeder::class,
        ]);
    }
}
