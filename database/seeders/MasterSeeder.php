<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class MasterSeeder extends Seeder
{
    /**
     * Run the master data seeds.
     * These are tables prefixed with 'm_'.
     */
    public function run(): void
    {
        // Disable FK constraints and truncate master tables to ensure clean seed
        \Illuminate\Support\Facades\Schema::disableForeignKeyConstraints();
        \App\Models\Department::truncate();
        \App\Models\Role::truncate();
        \App\Models\User::truncate();
        \App\Models\Vendor::truncate();
        \App\Models\ModuleGroup::truncate();
        \App\Models\Module::truncate();
        \App\Models\AccessModule::truncate();
        \App\Models\ContractType::truncate();
        \App\Models\Workflow::truncate();
        \App\Models\WorkflowStep::truncate();
        \App\Models\ContractStatus::truncate();
        \App\Models\FormTemplate::truncate();
        \Illuminate\Support\Facades\Schema::enableForeignKeyConstraints();

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
            ContractStatusSeeder::class,
            FormTemplateSeeder::class,
        ]);
    }
}
