<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Remove the selection_rules table — this feature was never used by
     * ContractWorkflowService and was causing confusion with the live
     * approverRoles / approverDepartments / approverUsers system.
     */
    public function up(): void
    {
        Schema::dropIfExists('m_workflow_step_selection_rules');
    }

    /**
     * Restore the table if the migration is rolled back.
     */
    public function down(): void
    {
        Schema::create('m_workflow_step_selection_rules', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('workflow_step_id');
            $table->string('role_id')->nullable();
            $table->string('department_id')->nullable();
            $table->string('role_name')->nullable();
            $table->timestamps();

            $table->foreign('workflow_step_id')
                ->references('id')
                ->on('m_workflow_steps')
                ->onDelete('cascade');
        });
    }
};
