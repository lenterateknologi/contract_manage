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
        Schema::table('m_workflows', function (Blueprint $table) {
            $table->json('company_group_ids')->nullable()->after('department_id');
            $table->json('region_ids')->nullable()->after('company_group_ids');
            $table->json('company_ids')->nullable()->after('region_ids');
        });

        Schema::table('m_workflow_steps', function (Blueprint $table) {
            // Drop old single-ID columns first to avoid confusion
            $table->dropForeign(['company_group_id']);
            $table->dropForeign(['region_id']);
            $table->dropForeign(['company_id']);
            $table->dropColumn(['company_group_id', 'region_id', 'company_id']);

            // Add new plural JSON columns
            $table->json('company_group_ids')->nullable()->after('role_id');
            $table->json('region_ids')->nullable()->after('company_group_ids');
            $table->json('company_ids')->nullable()->after('region_ids');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_workflow_steps', function (Blueprint $table) {
            $table->dropColumn(['company_group_ids', 'region_ids', 'company_ids']);

            $table->foreignUuid('company_group_id')->nullable()->constrained('m_company_groups')->nullOnDelete();
            $table->foreignUuid('region_id')->nullable()->constrained('m_regions')->nullOnDelete();
            $table->foreignUuid('company_id')->nullable()->constrained('m_companies')->nullOnDelete();
        });

        Schema::table('m_workflows', function (Blueprint $table) {
            $table->dropColumn(['company_group_ids', 'region_ids', 'company_ids']);
        });
    }
};
