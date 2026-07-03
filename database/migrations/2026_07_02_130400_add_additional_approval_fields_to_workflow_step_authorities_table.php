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
        Schema::table('m_workflow_step_authorities', function (Blueprint $table) {
            $table->boolean('is_additional')->default(false)->after('authority_type');
            $table->string('additional_type', 32)->nullable()->after('is_additional'); // 'signer', 'reviewer', 'assignee'

            $table->uuid('workflow_step_action_id')->nullable()->after('workflow_step_id');
            $table->uuid('target_step_id')->nullable()->after('workflow_step_action_id');

            $table->foreign('workflow_step_action_id')
                ->references('id')
                ->on('m_workflow_step_actions')
                ->onDelete('cascade');

            $table->foreign('target_step_id')
                ->references('id')
                ->on('m_workflow_steps')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_workflow_step_authorities', function (Blueprint $table) {
            $table->dropForeign(['target_step_id']);
            $table->dropForeign(['workflow_step_action_id']);
            $table->dropColumn(['is_additional', 'additional_type', 'workflow_step_action_id', 'target_step_id']);
        });
    }
};
