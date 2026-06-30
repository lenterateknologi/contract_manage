<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $connection = config('database.default');
        $schema = Schema::connection($connection);

        $tables = $schema->getTables();

        $excludedTables = [
            'migrations',
            'sessions',
            'cache',
            'failed_jobs',
            'jobs',
            'password_resets',
            'personal_access_tokens',
            'telescope_entries',
            'telescope_entries_tags',
            'telescope_monitoring',
            't_http_log',
            't_http_logs',
            't_http_log_h',
            't_http_log_histories',
        ];

        foreach ($tables as $tableInfo) {
            $tableName = $tableInfo['name'] ?? null;
            if (! $tableName || in_array($tableName, $excludedTables)) {
                continue;
            }

            $schema->table($tableName, function (Blueprint $table) use ($schema, $tableName) {
                if (! $schema->hasColumn($tableName, 'created_by')) {
                    $table->uuid('created_by')->nullable()->index();
                }
                if (! $schema->hasColumn($tableName, 'updated_by')) {
                    $table->uuid('updated_by')->nullable()->index();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op: the columns will be automatically dropped when the tables themselves are dropped
    }
};
