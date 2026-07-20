<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop kolom use_role_filter dan filter_settings dari m_users
        Schema::table('m_users', function (Blueprint $table) {
            if (Schema::hasColumn('m_users', 'use_role_filter')) {
                $table->dropColumn('use_role_filter');
            }
            if (Schema::hasColumn('m_users', 'filter_settings')) {
                $table->dropColumn('filter_settings');
            }
        });

        // Drop tabel m_contract_filter_items dulu (ada FK ke m_contract_filter)
        Schema::dropIfExists('m_contract_filter_items');

        // Drop tabel m_contract_filter
        Schema::dropIfExists('m_contract_filter');
    }

    public function down(): void
    {
        // Tidak perlu rollback
    }
};
