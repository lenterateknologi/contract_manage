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
        if (Schema::hasTable('m_authorities')) {
            Schema::table('m_authorities', function (Blueprint $table) {
                if (! Schema::hasColumn('m_authorities', 'job_level_id')) {
                    $table->uuid('job_level_id')->nullable()->index();
                }
                if (! Schema::hasColumn('m_authorities', 'job_position_id')) {
                    $table->uuid('job_position_id')->nullable()->index();
                }
            });
        }

        if (Schema::hasTable('m_dashboard_types')) {
            Schema::table('m_dashboard_types', function (Blueprint $table) {
                if (! Schema::hasColumn('m_dashboard_types', 'priority')) {
                    $table->integer('priority')->default(10)->index();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('m_authorities')) {
            Schema::table('m_authorities', function (Blueprint $table) {
                $table->dropColumn(['job_level_id', 'job_position_id']);
            });
        }

        if (Schema::hasTable('m_dashboard_types')) {
            Schema::table('m_dashboard_types', function (Blueprint $table) {
                $table->dropColumn('priority');
            });
        }
    }
};
