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
        // 0. Clean up existing pivot if needed
        Schema::dropIfExists('t_workflow_step_users');

        // 1. Pivot tables for Workflow Steps
        Schema::create('m_workflow_step_roles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('workflow_step_id')->constrained('m_workflow_steps')->cascadeOnDelete();
            $table->string('role_name');
            $table->timestamps();
        });

        Schema::create('m_workflow_step_departments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('workflow_step_id')->constrained('m_workflow_steps')->cascadeOnDelete();
            $table->foreignUuid('department_id')->constrained('m_departments')->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('m_workflow_step_users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('workflow_step_id')->constrained('m_workflow_steps')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('m_users')->cascadeOnDelete();
            $table->timestamps();
        });

        // 2. Pivot tables for Workflow Initiators
        Schema::create('m_workflow_initiator_roles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('workflow_id')->constrained('m_workflows')->cascadeOnDelete();
            $table->string('role_name');
            $table->timestamps();
        });

        Schema::create('m_workflow_initiator_departments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('workflow_id')->constrained('m_workflows')->cascadeOnDelete();
            $table->foreignUuid('department_id')->constrained('m_departments')->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('m_workflow_initiator_users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('workflow_id')->constrained('m_workflows')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('m_users')->cascadeOnDelete();
            $table->timestamps();
        });

        // 3. Clean up old JSON columns
        $indexes = Schema::getIndexes('m_workflow_steps');
        $hasRoleIndex = false;
        foreach ($indexes as $index) {
            if (($index['name'] ?? '') === 'm_workflow_steps_role_index') {
                $hasRoleIndex = true;

                break;
            }
        }

        Schema::table('m_workflow_steps', function (Blueprint $table) use ($hasRoleIndex) {
            if ($hasRoleIndex) {
                $table->dropIndex('m_workflow_steps_role_index');
            }

            $columns = ['role', 'department_ids', 'user_ids', 'department_id'];
            foreach ($columns as $col) {
                if (Schema::hasColumn('m_workflow_steps', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        Schema::table('m_workflows', function (Blueprint $table) {
            $columns = ['initiator_roles', 'initiator_users', 'initiator_departments'];
            foreach ($columns as $col) {
                if (Schema::hasColumn('m_workflows', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_workflows', function (Blueprint $table) {
            $table->json('initiator_roles')->nullable();
            $table->json('initiator_users')->nullable();
            $table->json('initiator_departments')->nullable();
        });

        Schema::table('m_workflow_steps', function (Blueprint $table) {
            $table->json('role')->nullable();
            $table->json('department_ids')->nullable();
            $table->json('user_ids')->nullable();
        });

        Schema::dropIfExists('m_workflow_initiator_users');
        Schema::dropIfExists('m_workflow_initiator_departments');
        Schema::dropIfExists('m_workflow_initiator_roles');
        Schema::dropIfExists('m_workflow_step_users');
        Schema::dropIfExists('m_workflow_step_departments');
        Schema::dropIfExists('m_workflow_step_roles');
    }
};
