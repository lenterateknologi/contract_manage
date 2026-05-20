<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class ExportDatabaseToJson extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:export-json {tables? : Comma separated list of tables or empty for all}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Export database tables to JSON files in storage/app/private';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $tablesArg = $this->argument('tables');

        if ($tablesArg) {
            $tablesToExport = explode(',', $tablesArg);
        } else {
            // Laravel 11/12 specific way to get tables
            $tablesToExport = collect(Schema::getTables())->pluck('name')->toArray();
        }

        // Exclude system tables
        $exclude = ['migrations', 'failed_jobs', 'password_reset_tokens', 'personal_access_tokens', 'sessions', 'jobs'];
        $tablesToExport = array_diff($tablesToExport, $exclude);

        if (empty($tablesToExport)) {
            $this->warn('No tables found to export.');

            return;
        }

        $this->info('Starting export...');

        foreach ($tablesToExport as $table) {
            $this->info("Exporting table: {$table}");

            $data = DB::table($table)->get();

            if ($data->isEmpty()) {
                $this->line("Table {$table} is empty, skipping.");

                continue;
            }

            $json = $data->toJson(JSON_PRETTY_PRINT);
            $fileName = "{$table}.json";

            Storage::disk('local')->put($fileName, $json);

            $this->info("Exported to storage/app/private/{$fileName}");
        }

        $this->info('Export completed successfully.');
    }
}
