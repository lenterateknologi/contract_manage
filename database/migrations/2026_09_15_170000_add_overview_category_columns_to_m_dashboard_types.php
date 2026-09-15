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
        Schema::table('m_dashboard_types', function (Blueprint $table) {
            $table->boolean('show_overview_contract')->default(false)->after('show_overview');
            $table->boolean('show_overview_non_contract')->default(false)->after('show_overview_contract');
            $table->boolean('show_overview_nda')->default(false)->after('show_overview_non_contract');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_dashboard_types', function (Blueprint $table) {
            $table->dropColumn([
                'show_overview_contract',
                'show_overview_non_contract',
                'show_overview_nda',
            ]);
        });
    }
};
