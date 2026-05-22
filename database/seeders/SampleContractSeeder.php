<?php

namespace Database\Seeders;

use App\Models\Contract;
use Illuminate\Database\Seeder;

class SampleContractSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Seed 100 contracts
        Contract::factory()->count(100)->create();
    }
}
