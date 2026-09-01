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
        Schema::table('m_regions', function (Blueprint $table) {
            $table->boolean('is_used')->default(false)->change();
        });

        // Set all existing rows to false as requested
        \Illuminate\Support\Facades\DB::table('m_regions')->update(['is_used' => false]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_regions', function (Blueprint $table) {
            $table->boolean('is_used')->default(true)->change();
        });
    }
};
