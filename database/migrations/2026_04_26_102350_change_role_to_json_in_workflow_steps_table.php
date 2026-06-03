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
        // For Postgres, we need a custom cast to change to JSON
        if (config('database.default') === 'pgsql') {
            // Drop index first as JSON columns don't support btree indexes in Postgres
            try {
                DB::statement('DROP INDEX IF EXISTS m_workflow_steps_role_index');
            } catch (Exception $e) {
            }

            DB::statement('ALTER TABLE m_workflow_steps ALTER COLUMN role TYPE json USING json_build_array(role)');
        } else {
            Schema::table('m_workflow_steps', function (Blueprint $table) {
                $table->json('role')->nullable()->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_workflow_steps', function (Blueprint $table) {
            $table->string('role', 100)->nullable()->change();
        });
    }
};
