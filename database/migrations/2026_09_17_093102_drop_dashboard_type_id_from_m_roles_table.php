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
        Schema::table('m_roles', function (Blueprint $table) {
            if (Schema::hasColumn('m_roles', 'dashboard_type_id')) {
                $table->dropColumn('dashboard_type_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_roles', function (Blueprint $table) {
            if (! Schema::hasColumn('m_roles', 'dashboard_type_id')) {
                $table->uuid('dashboard_type_id')->nullable()->after('contract_filter_template_id');
            }
        });
    }
};
