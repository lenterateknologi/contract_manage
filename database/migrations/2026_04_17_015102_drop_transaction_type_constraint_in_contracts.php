<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            // Manually drop the check constraint that PostgreSQL creates for enum columns
            DB::statement('ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_transaction_type_check');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No easy way to put it back without knowing the exact state, 
        // and we want it gone anyway.
    }
};
