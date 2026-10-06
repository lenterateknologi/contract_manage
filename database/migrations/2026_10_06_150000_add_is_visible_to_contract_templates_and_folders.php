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
        if (Schema::hasTable('m_contract_templates') && ! Schema::hasColumn('m_contract_templates', 'is_visible')) {
            Schema::table('m_contract_templates', function (Blueprint $table) {
                $table->boolean('is_visible')->default(true)->after('file_type');
            });
        }

        if (Schema::hasTable('m_template_folders') && ! Schema::hasColumn('m_template_folders', 'is_visible')) {
            Schema::table('m_template_folders', function (Blueprint $table) {
                $table->boolean('is_visible')->default(true)->after('name');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('m_contract_templates') && Schema::hasColumn('m_contract_templates', 'is_visible')) {
            Schema::table('m_contract_templates', function (Blueprint $table) {
                $table->dropColumn('is_visible');
            });
        }

        if (Schema::hasTable('m_template_folders') && Schema::hasColumn('m_template_folders', 'is_visible')) {
            Schema::table('m_template_folders', function (Blueprint $table) {
                $table->dropColumn('is_visible');
            });
        }
    }
};
