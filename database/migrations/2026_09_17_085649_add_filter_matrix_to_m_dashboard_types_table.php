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
            // 1. Selector Dokumen & Tipe Kontrak
            $table->jsonb('contract_type_ids')->nullable()->after('department_ids');
            $table->jsonb('categories')->nullable()->after('contract_type_ids');

            // 2. Dynamic Scope Modes & Organization Filter Matrix
            $table->boolean('scope_to_user_division')->default(false)->after('categories');
            $table->boolean('scope_to_user_department')->default(false)->after('scope_to_user_division');
            $table->boolean('scope_to_user_company')->default(false)->after('scope_to_user_department');

            $table->jsonb('company_group_ids')->nullable()->after('scope_to_user_company');
            $table->jsonb('region_ids')->nullable()->after('company_group_ids');
            $table->jsonb('company_ids')->nullable()->after('region_ids');
            $table->jsonb('branch_ids')->nullable()->after('company_ids');
            $table->jsonb('business_unit_ids')->nullable()->after('branch_ids');

            // 3. User Target Matrix
            $table->jsonb('job_level_ids')->nullable()->after('business_unit_ids');
            $table->jsonb('job_title_ids')->nullable()->after('job_level_ids');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_dashboard_types', function (Blueprint $table) {
            $table->dropColumn([
                'contract_type_ids',
                'categories',
                'scope_to_user_division',
                'scope_to_user_department',
                'scope_to_user_company',
                'company_group_ids',
                'region_ids',
                'company_ids',
                'branch_ids',
                'business_unit_ids',
                'job_level_ids',
                'job_title_ids',
            ]);
        });
    }
};
