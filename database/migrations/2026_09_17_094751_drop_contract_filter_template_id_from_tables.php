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
        if (Schema::hasTable('m_roles') && Schema::hasColumn('m_roles', 'contract_filter_template_id')) {
            Schema::table('m_roles', function (Blueprint $table) {
                $table->dropColumn('contract_filter_template_id');
            });
        }

        if (Schema::hasTable('m_users') && Schema::hasColumn('m_users', 'contract_filter_template_id')) {
            Schema::table('m_users', function (Blueprint $table) {
                $table->dropColumn('contract_filter_template_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('m_roles') && ! Schema::hasColumn('m_roles', 'contract_filter_template_id')) {
            Schema::table('m_roles', function (Blueprint $table) {
                $table->uuid('contract_filter_template_id')->nullable();
            });
        }

        if (Schema::hasTable('m_users') && ! Schema::hasColumn('m_users', 'contract_filter_template_id')) {
            Schema::table('m_users', function (Blueprint $table) {
                $table->uuid('contract_filter_template_id')->nullable();
            });
        }
    }
};
