<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('m_workflow_steps', function (Blueprint $table) {
            $table->dropForeign(['department_id']);
        });

        // For Postgres, we use a custom cast to JSON
        if (config('database.default') === 'pgsql') {
            DB::statement('ALTER TABLE m_workflow_steps ALTER COLUMN department_id TYPE json USING json_build_array(department_id)');
        } else {
            Schema::table('m_workflow_steps', function (Blueprint $table) {
                $table->json('department_id')->nullable()->change();
            });
        }

        // Rename column to department_ids for clarity if we want, but let's keep it department_id to avoid large refactors
        // unless necessary. Actually, the user wants "multi-value", so department_id as JSON is fine.
        // I will rename it for clarity though.
        Schema::table('m_workflow_steps', function (Blueprint $table) {
            $table->renameColumn('department_id', 'department_ids');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_workflow_steps', function (Blueprint $table) {
            $table->renameColumn('department_ids', 'department_id');
        });

        Schema::table('m_workflow_steps', function (Blueprint $table) {
            if (config('database.default') === 'pgsql') {
                // This is complex to reverse safely, but for dev:
                DB::statement('ALTER TABLE m_workflow_steps ALTER COLUMN department_id TYPE uuid USING (department_id->>0)::uuid');
            } else {
                $table->uuid('department_id')->nullable()->change();
            }

            $table->foreign('department_id')->references('id')->on('m_departments')->onDelete('set null');
        });
    }
};
