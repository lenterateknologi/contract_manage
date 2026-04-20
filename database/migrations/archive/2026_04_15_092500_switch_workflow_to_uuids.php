<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Drop existing foreign keys
        Schema::table('workflow_steps', function (Blueprint $table) {
            $table->dropForeign(['workflow_id']);
        });

        Schema::table('contracts', function (Blueprint $table) {
            $table->dropForeign(['workflow_id']);
            $table->dropForeign(['workflow_step_id']);
        });

        Schema::table('approvals', function (Blueprint $table) {
            $table->dropForeign(['workflow_step_id']);
        });

        Schema::table('workflow_step_users', function (Blueprint $table) {
            $table->dropForeign(['workflow_step_id']);
        });

        // 2. Clear existing data to avoid type conversion errors
        DB::table('approvals')->truncate();
        DB::table('workflow_step_users')->truncate();
        DB::table('workflow_steps')->truncate();
        DB::table('workflows')->truncate();
        
        // Reset contract workflow links
        DB::table('contracts')->update(['workflow_id' => null, 'workflow_step_id' => null]);

        // 3. Drop and recreate columns as UUID (Robust way for PostgreSQL)
        Schema::table('workflow_step_users', function (Blueprint $table) {
            $table->dropColumn('workflow_step_id');
        });

        Schema::table('approvals', function (Blueprint $table) {
            $table->dropColumn('workflow_step_id');
        });

        Schema::table('contracts', function (Blueprint $table) {
            $table->dropColumn(['workflow_id', 'workflow_step_id']);
        });

        Schema::table('workflow_steps', function (Blueprint $table) {
            $table->dropColumn(['id', 'workflow_id']);
        });

        Schema::table('workflows', function (Blueprint $table) {
            $table->dropColumn('id');
        });

        // 4. Re-add columns as UUID
        Schema::table('workflows', function (Blueprint $table) {
            $table->uuid('id')->primary();
        });

        Schema::table('workflow_steps', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('workflow_id');
        });

        Schema::table('contracts', function (Blueprint $table) {
            $table->uuid('workflow_id')->nullable();
            $table->uuid('workflow_step_id')->nullable();
        });

        Schema::table('approvals', function (Blueprint $table) {
            $table->uuid('workflow_step_id');
        });

        Schema::table('workflow_step_users', function (Blueprint $table) {
            $table->uuid('workflow_step_id');
        });

        // 4. Re-add foreign keys
        Schema::table('workflow_steps', function (Blueprint $table) {
            $table->foreign('workflow_id')->references('id')->on('workflows')->onDelete('cascade');
        });

        Schema::table('contracts', function (Blueprint $table) {
            $table->foreign('workflow_id')->references('id')->on('workflows')->onDelete('set null');
            $table->foreign('workflow_step_id')->references('id')->on('workflow_steps')->onDelete('set null');
        });

        Schema::table('approvals', function (Blueprint $table) {
            $table->foreign('workflow_step_id')->references('id')->on('workflow_steps')->onDelete('cascade');
        });

        Schema::table('workflow_step_users', function (Blueprint $table) {
            $table->foreign('workflow_step_id')->references('id')->on('workflow_steps')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        // Standard down migration would be complex; usually we'd go back to integers
    }
};
