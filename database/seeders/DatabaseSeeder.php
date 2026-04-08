<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            UserSeeder::class,
            ContractTypeSeeder::class,
            WorkflowSeeder::class,
            WorkflowStepSeeder::class,
            ContractSeeder::class,
        ]);
    }
}
