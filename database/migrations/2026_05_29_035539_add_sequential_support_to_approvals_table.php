<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('t_approvals', function (Blueprint $table) {
            $table->integer('sort_order')->default(0);
        });

        // Update check constraint for status to include 'waiting'
        if (config('database.default') === 'pgsql') {
            DB::statement('ALTER TABLE t_approvals DROP CONSTRAINT IF EXISTS t_approvals_status_check');
            DB::statement("ALTER TABLE t_approvals ADD CONSTRAINT t_approvals_status_check CHECK (status::text = ANY (ARRAY['pending'::text, 'waiting'::text, 'approved'::text, 'rejected'::text]))");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('t_approvals', function (Blueprint $table) {
            $table->dropColumn('sort_order');
        });

        if (config('database.default') === 'pgsql') {
            DB::statement('ALTER TABLE t_approvals DROP CONSTRAINT IF EXISTS t_approvals_status_check');
            DB::statement("ALTER TABLE t_approvals ADD CONSTRAINT t_approvals_status_check CHECK (status::text = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]))");
        }
    }
};
