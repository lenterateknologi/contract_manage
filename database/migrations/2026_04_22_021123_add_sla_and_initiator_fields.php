<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('t_contracts', function (Blueprint $table) {
            $table->uuid('initiated_by_id')->nullable()->after('created_by');
            $table->foreign('initiated_by_id')->references('id')->on('m_users');
        });

        Schema::table('m_workflows', function (Blueprint $table) {
            $table->integer('sla_drafting_hours')->default(72)->after('is_tax_involved');
            $table->integer('sla_total_hours')->default(240)->after('sla_drafting_hours');
            $table->integer('sla_cutoff_hour')->default(16)->after('sla_total_hours');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_workflows', function (Blueprint $table) {
            $table->dropColumn(['sla_drafting_hours', 'sla_total_hours', 'sla_cutoff_hour']);
        });

        Schema::table('t_contracts', function (Blueprint $table) {
            $table->dropForeign(['initiated_by_id']);
            $table->dropColumn('initiated_by_id');
        });
    }
};
