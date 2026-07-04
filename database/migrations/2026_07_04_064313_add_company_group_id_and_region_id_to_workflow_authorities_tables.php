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
        Schema::table('m_workflow_initiator_authorities', function (Blueprint $table) {
            $table->uuid('company_group_id')->nullable()->after('user_id');
            $table->uuid('region_id')->nullable()->after('company_group_id');

            $table->index('company_group_id');
            $table->index('region_id');
        });

        Schema::table('m_workflow_step_authorities', function (Blueprint $table) {
            $table->uuid('company_group_id')->nullable()->after('user_id');
            $table->uuid('region_id')->nullable()->after('company_group_id');

            $table->index('company_group_id');
            $table->index('region_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_workflow_initiator_authorities', function (Blueprint $table) {
            $table->dropIndex(['company_group_id']);
            $table->dropIndex(['region_id']);

            $table->dropColumn(['company_group_id', 'region_id']);
        });

        Schema::table('m_workflow_step_authorities', function (Blueprint $table) {
            $table->dropIndex(['company_group_id']);
            $table->dropIndex(['region_id']);

            $table->dropColumn(['company_group_id', 'region_id']);
        });
    }
};
