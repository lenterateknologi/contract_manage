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
        Schema::create('m_contract_sla_configs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('contract_type_id')->constrained('m_contract_types')->cascadeOnDelete();
            $table->foreignUuid('workflow_id')->nullable()->constrained('m_workflows')->nullOnDelete();

            $table->string('name')->nullable();
            $table->string('topic', 50)->nullable()->default('all');
            $table->string('priority', 20)->default('NORMAL');

            $table->integer('sla_drafting_hours')->default(72);
            $table->integer('sla_review_hours')->nullable();
            $table->integer('sla_total_hours')->default(240);
            $table->integer('sla_cutoff_hour')->default(16);
            $table->integer('warning_threshold_percent')->default(80);

            $table->boolean('is_active')->default(true);
            $table->foreignUuid('created_by')->nullable()->constrained('m_users')->nullOnDelete();
            $table->foreignUuid('updated_by')->nullable()->constrained('m_users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['contract_type_id', 'is_active', 'topic'], 'idx_sla_type_active_topic');
        });

        Schema::create('m_contract_sla_step_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('sla_config_id')->constrained('m_contract_sla_configs')->cascadeOnDelete();
            $table->foreignUuid('workflow_step_id')->nullable()->constrained('m_workflow_steps')->nullOnDelete();

            $table->string('phase', 50); // 'drafting', 'legal_review', 'approval', 'signing', 'finalization'
            $table->integer('duration_hours');
            $table->boolean('is_business_days')->default(true);

            $table->timestamps();
            $table->index(['sla_config_id', 'phase'], 'idx_sla_step_phase');
        });

        Schema::create('t_contract_sla_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('contract_id')->constrained('t_contracts')->cascadeOnDelete();
            $table->foreignUuid('workflow_step_id')->nullable()->constrained('m_workflow_steps')->nullOnDelete();
            $table->foreignUuid('assigned_user_id')->nullable()->constrained('m_users')->nullOnDelete();

            $table->string('phase', 50);
            $table->timestamp('started_at');
            $table->timestamp('target_deadline');
            $table->timestamp('actual_completed_at')->nullable();

            $table->string('status', 20)->default('ON_TRACK'); // 'ON_TRACK', 'WARNING', 'BREACHED', 'COMPLETED'
            $table->integer('duration_spent_minutes')->nullable();

            $table->timestamps();
            $table->index(['contract_id', 'status'], 'idx_contract_sla_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_contract_sla_logs');
        Schema::dropIfExists('m_contract_sla_step_items');
        Schema::dropIfExists('m_contract_sla_configs');
    }
};
