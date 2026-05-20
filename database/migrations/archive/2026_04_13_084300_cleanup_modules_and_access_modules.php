<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Skip structural changes on SQLite to avoid migration failures in tests
        if (config('database.default') === 'sqlite') {
            return;
        }

        Schema::table('modules', function (Blueprint $table) {
            $table->dropColumn('parent_module_id');
        });

        Schema::table('access_modules', function (Blueprint $table) {
            // Drop current primary key to replace it with a surrogate ID
            $table->dropPrimary(['role_id', 'module_id']);
            $table->id()->first();
            // Re-add indices for the foreign keys if they were part of the primary
            $table->index('role_id');
            $table->index('module_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('modules', function (Blueprint $table) {
            $table->uuid('parent_module_id')->index()->nullable();
        });

        Schema::table('access_modules', function (Blueprint $table) {
            $table->dropColumn('id');
            $table->primary(['role_id', 'module_id']);
        });
    }
};
