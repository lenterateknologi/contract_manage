<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class SampleSeeder extends Seeder
{
    /**
     * Run the sample transaction data seeds.
     * These are tables prefixed with 't_'.
     */
    public function run(): void
    {
        $this->call([
            TransactionSeeder::class,
            F1RedesignSeeder::class,
            F2RedesignSeeder::class,
        ]);
    }
}
