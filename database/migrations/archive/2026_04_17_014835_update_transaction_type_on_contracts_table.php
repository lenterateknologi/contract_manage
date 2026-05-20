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
        // For PostgreSQL, changing an enum column to string doesn't always drop the CHECK constraint.
        // We drop it manually to be sure.
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_transaction_type_check');
        }

        Schema::table('contracts', function (Blueprint $table) {
            $table->string('transaction_type')->default('Perjanjian Baru')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->enum('transaction_type', ['Baru', 'Perpanjangan', 'Review'])->default('Baru')->change();
        });
    }
};
