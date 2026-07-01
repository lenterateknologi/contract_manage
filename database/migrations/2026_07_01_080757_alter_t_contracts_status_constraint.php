<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (config('database.default') === 'pgsql') {
            DB::statement('ALTER TABLE t_contracts DROP CONSTRAINT IF EXISTS t_contracts_status_check');
            DB::statement("ALTER TABLE t_contracts ADD CONSTRAINT t_contracts_status_check CHECK (status::text = ANY (ARRAY[
                'draft'::text,
                'in_review'::text,
                'revision'::text,
                'approved'::text,
                'locked'::text,
                'archived'::text,
                'pending'::text,
                'expired'::text,
                'completed'::text,
                'signed'::text,
                'rejected'::text,
                'queue'::text
            ]))");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (config('database.default') === 'pgsql') {
            DB::statement('ALTER TABLE t_contracts DROP CONSTRAINT IF EXISTS t_contracts_status_check');
            DB::statement("ALTER TABLE t_contracts ADD CONSTRAINT t_contracts_status_check CHECK (status::text = ANY (ARRAY[
                'draft'::text,
                'in_review'::text,
                'revision'::text,
                'approved'::text,
                'locked'::text,
                'archived'::text
            ]))");
        }
    }
};
