<?php

use Database\Seeders\ContractStatusSeeder;
use Database\Seeders\ContractTypeSeeder;
use Database\Seeders\DepartmentSeeder;
use Database\Seeders\MasterSeeder;
use Database\Seeders\RoleSeeder;
use Database\Seeders\SampleSeeder;
use Database\Seeders\SubmissionTypeSeeder;
use Database\Seeders\UserSeeder;
use Database\Seeders\VendorRealisticSeeder;
use Database\Seeders\VendorSeeder;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('seed {type?} {--master} {--transaction}', function ($type = null) {
    $runMaster = $this->option('master') || strtolower((string) $type) === 'master';
    $runTransaction = $this->option('transaction') || strtolower((string) $type) === 'transaction';

    // Default behavior if neither or both are specified
    if (! $runMaster && ! $runTransaction) {
        $this->info('Menjalankan seluruh seeder (Master + Transaction)...');
        $this->call('db:seed');

        return;
    }

    if ($runMaster) {
        $this->info('=== MENJALANKAN MASTER DATA SEEDERS ===');
        $this->call('db:seed', ['--class' => RoleSeeder::class]);
        $this->call('db:seed', ['--class' => DepartmentSeeder::class]);
        $this->call('db:seed', ['--class' => ContractTypeSeeder::class]);
        $this->call('db:seed', ['--class' => ContractStatusSeeder::class]);
        $this->call('db:seed', ['--class' => SubmissionTypeSeeder::class]);
        $this->call('db:seed', ['--class' => MasterSeeder::class]);
        $this->call('db:seed', ['--class' => VendorSeeder::class]);
        $this->call('db:seed', ['--class' => VendorRealisticSeeder::class]);
        $this->call('db:seed', ['--class' => UserSeeder::class]);
        $this->info('✔ Selesai memuat Master Data!');
    }

    if ($runTransaction) {
        $this->info('=== MENJALANKAN TRANSACTION DATA SEEDERS ===');
        $this->call('db:seed', ['--class' => SampleSeeder::class]);
        $this->info('✔ Selesai memuat Transaction Data!');
    }
})->purpose('Seed the database by specific category: master or transaction');
