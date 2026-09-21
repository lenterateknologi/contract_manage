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
            if (! Schema::hasColumn('m_dashboard_types', 'user_ids')) {
                $table->json('user_ids')->nullable()->after('description');
            }
        });

        Schema::table('m_users', function (Blueprint $table) {
            if (! Schema::hasColumn('m_users', 'dashboard_type_id')) {
                $table->uuid('dashboard_type_id')->nullable()->after('role_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_users', function (Blueprint $table) {
            if (Schema::hasColumn('m_users', 'dashboard_type_id')) {
                $table->dropColumn('dashboard_type_id');
            }
        });

        Schema::table('m_dashboard_types', function (Blueprint $table) {
            if (Schema::hasColumn('m_dashboard_types', 'user_ids')) {
                $table->dropColumn('user_ids');
            }
        });
    }
};
