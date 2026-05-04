<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('seed {type?} {--master} {--transaction}', function ($type = null) {
    $runMaster = $this->option('master') || strtolower((string)$type) === 'master';
    $runTransaction = $this->option('transaction') || strtolower((string)$type) === 'transaction';

    // Default behavior if neither or both are specified
    if (!$runMaster && !$runTransaction) {
        $this->info("Menjalankan seluruh seeder (Master + Transaction)...");
        $this->call('db:seed');
        return;
    }

    if ($runMaster) {
        $this->info("=== MENJALANKAN MASTER DATA SEEDERS ===");
        $this->call('db:seed', ['--class' => \Database\Seeders\RoleSeeder::class]);
        $this->call('db:seed', ['--class' => \Database\Seeders\DepartmentSeeder::class]);
        $this->call('db:seed', ['--class' => \Database\Seeders\ContractTypeSeeder::class]);
        $this->call('db:seed', ['--class' => \Database\Seeders\ContractStatusSeeder::class]);
        $this->call('db:seed', ['--class' => \Database\Seeders\SubmissionTypeSeeder::class]);
        $this->call('db:seed', ['--class' => \Database\Seeders\MasterSeeder::class]);
        $this->call('db:seed', ['--class' => \Database\Seeders\VendorSeeder::class]);
        $this->call('db:seed', ['--class' => \Database\Seeders\VendorRealisticSeeder::class]);
        $this->call('db:seed', ['--class' => \Database\Seeders\UserSeeder::class]);
        $this->info("✔ Selesai memuat Master Data!");
    }

    if ($runTransaction) {
        $this->info("=== MENJALANKAN TRANSACTION DATA SEEDERS ===");
        $this->call('db:seed', ['--class' => \Database\Seeders\SampleSeeder::class]);
        $this->info("✔ Selesai memuat Transaction Data!");
    }
})->purpose('Seed the database by specific category: master or transaction');
