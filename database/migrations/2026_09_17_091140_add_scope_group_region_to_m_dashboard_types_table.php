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
            $table->boolean('scope_to_user_company_group')->default(false)->after('scope_to_user_company');
            $table->boolean('scope_to_user_region')->default(false)->after('scope_to_user_company_group');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_dashboard_types', function (Blueprint $table) {
            $table->dropColumn([
                'scope_to_user_company_group',
                'scope_to_user_region',
            ]);
        });
    }
};
