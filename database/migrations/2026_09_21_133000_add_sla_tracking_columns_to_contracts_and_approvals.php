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
        Schema::table('t_contracts', function (Blueprint $table) {
            if (! Schema::hasColumn('t_contracts', 'sla_config_id')) {
                $table->uuid('sla_config_id')->nullable()->after('workflow_id');
            }
            if (! Schema::hasColumn('t_contracts', 'sla_due_at')) {
                $table->timestamp('sla_due_at')->nullable()->after('sla_config_id');
            }
            if (! Schema::hasColumn('t_contracts', 'current_stage_due_at')) {
                $table->timestamp('current_stage_due_at')->nullable()->after('sla_due_at');
            }
            if (! Schema::hasColumn('t_contracts', 'sla_status')) {
                $table->string('sla_status', 30)->default('on_track')->after('current_stage_due_at'); // on_track, warning, overdue
            }
            if (! Schema::hasColumn('t_contracts', 'stage_sla_hours')) {
                $table->integer('stage_sla_hours')->nullable()->after('sla_status');
            }
            if (! Schema::hasColumn('t_contracts', 'sla_total_hours')) {
                $table->integer('sla_total_hours')->nullable()->after('stage_sla_hours');
            }
            if (! Schema::hasColumn('t_contracts', 'stage_started_at')) {
                $table->timestamp('stage_started_at')->nullable()->after('sla_total_hours');
            }
            if (! Schema::hasColumn('t_contracts', 'overdue_notified_at')) {
                $table->timestamp('overdue_notified_at')->nullable()->after('stage_started_at');
            }
        });

        Schema::table('t_approvals', function (Blueprint $table) {
            if (! Schema::hasColumn('t_approvals', 'due_at')) {
                $table->timestamp('due_at')->nullable()->after('decided_at');
            }
            if (! Schema::hasColumn('t_approvals', 'sla_hours')) {
                $table->integer('sla_hours')->nullable()->after('due_at');
            }
            if (! Schema::hasColumn('t_approvals', 'is_overdue')) {
                $table->boolean('is_overdue')->default(false)->after('sla_hours');
            }
            if (! Schema::hasColumn('t_approvals', 'overdue_notified_at')) {
                $table->timestamp('overdue_notified_at')->nullable()->after('is_overdue');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('t_contracts', function (Blueprint $table) {
            $table->dropColumn([
                'sla_config_id',
                'sla_due_at',
                'current_stage_due_at',
                'sla_status',
                'stage_sla_hours',
                'sla_total_hours',
                'stage_started_at',
                'overdue_notified_at',
            ]);
        });

        Schema::table('t_approvals', function (Blueprint $table) {
            $table->dropColumn([
                'due_at',
                'sla_hours',
                'is_overdue',
                'overdue_notified_at',
            ]);
        });
    }
};
