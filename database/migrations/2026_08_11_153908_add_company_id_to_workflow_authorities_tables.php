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
        if (! Schema::hasColumn('m_workflow_step_authorities', 'company_id')) {
            Schema::table('m_workflow_step_authorities', function (Blueprint $table) {
                $table->uuid('company_id')->nullable()->after('company_group_id');
                $table->boolean('company_use_initiator')->default(false)->after('company_group_use_initiator');

                $table->foreign('company_id')
                    ->references('id')
                    ->on('m_companies')
                    ->nullOnDelete();
            });
        }

        if (! Schema::hasColumn('m_workflow_initiator_authorities', 'company_id')) {
            Schema::table('m_workflow_initiator_authorities', function (Blueprint $table) {
                $table->uuid('company_id')->nullable()->after('company_group_id');
                $table->boolean('company_use_initiator')->default(false)->after('company_group_id');

                $table->foreign('company_id')
                    ->references('id')
                    ->on('m_companies')
                    ->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('m_workflow_step_authorities', 'company_id')) {
            Schema::table('m_workflow_step_authorities', function (Blueprint $table) {
                $table->dropForeign(['company_id']);
                $table->dropColumn(['company_id', 'company_use_initiator']);
            });
        }

        if (Schema::hasColumn('m_workflow_initiator_authorities', 'company_id')) {
            Schema::table('m_workflow_initiator_authorities', function (Blueprint $table) {
                $table->dropForeign(['company_id']);
                $table->dropColumn(['company_id', 'company_use_initiator']);
            });
        }
    }
};
