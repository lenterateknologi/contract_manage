<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create m_workflow_step_authorities table
        Schema::create('m_workflow_step_authorities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('workflow_step_id');
            $table->string('role_name')->nullable();
            $table->uuid('department_id')->nullable();
            $table->uuid('division_id')->nullable();
            $table->uuid('user_id')->nullable();
            $table->timestamps();

            $table->foreign('workflow_step_id')
                ->references('id')
                ->on('m_workflow_steps')
                ->onDelete('cascade');
        });

        // 2. Drop deprecated workflow step authority tables
        Schema::dropIfExists('m_workflow_step_roles');
        Schema::dropIfExists('m_workflow_step_departments');
        Schema::dropIfExists('m_workflow_step_divisions');
        Schema::dropIfExists('m_workflow_step_users');
    }

    public function down(): void
    {
        Schema::dropIfExists('m_workflow_step_authorities');
    }
};
