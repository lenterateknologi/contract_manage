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
        if (Schema::hasTable('m_modules')) {
            \Illuminate\Support\Facades\DB::table('m_modules')
                ->where('identifier', 'contract_filter_templates')
                ->orWhere('route', '/admin/core/contract-filter-templates')
                ->update([
                    'showed_as_menu' => false,
                    'is_active' => false,
                    'updated_at' => now(),
                ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('m_modules')) {
            \Illuminate\Support\Facades\DB::table('m_modules')
                ->where('identifier', 'contract_filter_templates')
                ->update([
                    'showed_as_menu' => true,
                    'is_active' => true,
                    'updated_at' => now(),
                ]);
        }
    }
};
