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
        Schema::table('m_contract_sla_configs', function (Blueprint $table) {
            $table->unsignedSmallInteger('sla_start_hour')->default(8)->after('sla_total_hours')->comment('Jam mulai kerja efektif (0-23, e.g. 8 for 08:00 WIB)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_contract_sla_configs', function (Blueprint $table) {
            $table->dropColumn('sla_start_hour');
        });
    }
};
