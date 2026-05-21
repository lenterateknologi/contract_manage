<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('m_workflow_steps', function (Blueprint $table) {
            $table->dropForeign('m_workflow_steps_status_id_foreign');
            $table->dropColumn(['step_type', 'reject_target', 'actor_type', 'status_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_workflow_steps', function (Blueprint $table) {
            $table->string('step_type')->default('approval');
            $table->string('reject_target')->default('initiator')->nullable();
            $table->string('actor_type')->default('approver');
            $table->uuid('status_id')->nullable();

            $table->foreign('status_id')
                ->references('id')
                ->on('m_contract_statuses')
                ->nullOnDelete();
        });
    }
};
