<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class JsonDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $files = Storage::disk('local')->files();
        $jsonFiles = array_filter($files, function ($file) {
            return str_ends_with($file, '.json');
        });

        if (empty($jsonFiles)) {
            $this->command->warn('No JSON files found in storage/app/private/');

            return;
        }

        foreach ($jsonFiles as $file) {
            $tableName = basename($file, '.json');
            $this->command->info("Seeding table: {$tableName}");

            if (! Schema::hasTable($tableName)) {
                $this->command->error("Table {$tableName} does not exist. Skipping.");

                continue;
            }

            $content = Storage::disk('local')->get($file);
            $data = json_decode($content, true);

            if (empty($data)) {
                $this->command->line("No data found for {$tableName}. Skipping.");

                continue;
            }

            // Disable foreign key checks for PostgreSQL (since it's pgsql in .env)
            DB::statement('SET CONSTRAINTS ALL DEFERRED');

            // Clear existing data
            DB::table($tableName)->delete();

            // Chunk data to avoid memory issues or query limits
            $chunks = array_chunk($data, 1000);
            foreach ($chunks as $chunk) {
                DB::table($tableName)->insert($chunk);
            }

            $this->command->info('Seeded ' . count($data) . " rows into {$tableName}.");
        }
    }
}
