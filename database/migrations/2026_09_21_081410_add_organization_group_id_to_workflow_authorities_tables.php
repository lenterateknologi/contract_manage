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
        if (! Schema::hasColumn('m_workflow_step_authorities', 'organization_group_id')) {
            Schema::table('m_workflow_step_authorities', function (Blueprint $table) {
                $table->uuid('organization_group_id')->nullable()->after('department_id');
                $table->boolean('organization_group_use_initiator')->default(false)->after('department_use_initiator');

                $table->foreign('organization_group_id')
                    ->references('id')
                    ->on('m_organization_groups')
                    ->nullOnDelete();
            });
        }

        if (! Schema::hasColumn('m_workflow_initiator_authorities', 'organization_group_id')) {
            Schema::table('m_workflow_initiator_authorities', function (Blueprint $table) {
                $table->uuid('organization_group_id')->nullable()->after('department_id');
                $table->boolean('organization_group_use_initiator')->default(false)->after('department_id');

                $table->foreign('organization_group_id')
                    ->references('id')
                    ->on('m_organization_groups')
                    ->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('m_workflow_step_authorities', 'organization_group_id')) {
            Schema::table('m_workflow_step_authorities', function (Blueprint $table) {
                $table->dropForeign(['organization_group_id']);
                $table->dropColumn(['organization_group_id', 'organization_group_use_initiator']);
            });
        }

        if (Schema::hasColumn('m_workflow_initiator_authorities', 'organization_group_id')) {
            Schema::table('m_workflow_initiator_authorities', function (Blueprint $table) {
                $table->dropForeign(['organization_group_id']);
                $table->dropColumn(['organization_group_id', 'organization_group_use_initiator']);
            });
        }
    }
};
