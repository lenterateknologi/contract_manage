<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('t_approvals', 'workflow_id')) {
            Schema::table('t_approvals', function (Blueprint $table) {
                $table->uuid('workflow_id')->nullable()->after('contract_id');
                $table->integer('step_number')->nullable()->after('sequence');
                $table->string('approver_type', 50)->nullable()->after('role');
                $table->boolean('is_current_step')->default(false)->after('is_active');
                $table->integer('batch_no')->default(1)->after('is_current_step');
                $table->uuid('parent_approval_id')->nullable()->after('batch_no');
                $table->boolean('is_adhoc')->default(false)->after('parent_approval_id');

                $table->index(['contract_id', 'is_active', 'is_current_step']);
                $table->index(['contract_id', 'workflow_id', 'batch_no']);
                $table->index(['contract_id', 'workflow_step_id', 'status']);
            });
        }

        if (! Schema::hasColumn('t_contracts', 'is_in_sub_workflow')) {
            Schema::table('t_contracts', function (Blueprint $table) {
                $table->boolean('is_in_sub_workflow')->default(false)->after('origin_workflow_id');
                $table->integer('branch_step_number')->nullable()->after('is_in_sub_workflow');
                $table->integer('current_step_number')->nullable()->after('branch_step_number');
                $table->uuid('current_sub_workflow_id')->nullable()->after('current_step_number');
                $table->integer('workflow_iteration')->default(1)->after('current_sub_workflow_id');

                $table->index(['workflow_id', 'current_step_number']);
                $table->index(['is_in_sub_workflow', 'status']);
            });
        }

        // Backfill existing approvals with workflow_id, step_number, approver_type from m_workflow_steps
        try {
            DB::statement("
                UPDATE t_approvals a
                SET workflow_id = ws.workflow_id,
                    step_number = ws.step,
                    approver_type = ws.approver_type
                FROM m_workflow_steps ws
                WHERE a.workflow_step_id = ws.id
            ");

            // Backfill contracts current_step_number from active workflow_step_id
            DB::statement("
                UPDATE t_contracts c
                SET current_step_number = ws.step
                FROM m_workflow_steps ws
                WHERE c.workflow_step_id = ws.id
            ");

            // Mark current active pending/waiting approvals as is_current_step
            DB::statement("
                UPDATE t_approvals
                SET is_current_step = true
                WHERE is_active = true AND status IN ('pending', 'waiting')
            ");

            DB::statement("
                UPDATE t_approvals
                SET is_adhoc = true
                WHERE role IN ('Persetujuan Tambahan', 'Penandatangan')
            ");
        } catch (\Throwable $e) {
            // Ignore backfill error on empty/fresh setups
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('t_approvals', function (Blueprint $table) {
            $table->dropColumn([
                'workflow_id',
                'step_number',
                'approver_type',
                'is_current_step',
                'batch_no',
                'parent_approval_id',
                'is_adhoc',
            ]);
        });

        Schema::table('t_contracts', function (Blueprint $table) {
            $table->dropColumn([
                'is_in_sub_workflow',
                'branch_step_number',
                'current_step_number',
                'current_sub_workflow_id',
                'workflow_iteration',
            ]);
        });
    }
};
