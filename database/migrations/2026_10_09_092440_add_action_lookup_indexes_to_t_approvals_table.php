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
        if (Schema::hasTable('t_approvals')) {
            Schema::table('t_approvals', function (Blueprint $table) {
                // Index for 'Butuh Tindakan Saya' (Pending approval at current workflow step)
                $table->index(['user_id', 'status', 'workflow_step_id', 'contract_id'], 'idx_approvals_pending_lookup');

                // Index for 'Pernah Saya Tindak Lanjuti' (History / Acted approvals)
                $table->index(['user_id', 'status', 'decided_at', 'contract_id'], 'idx_approvals_history_lookup');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('t_approvals')) {
            Schema::table('t_approvals', function (Blueprint $table) {
                $table->dropIndex('idx_approvals_pending_lookup');
                $table->dropIndex('idx_approvals_history_lookup');
            });
        }
    }
};
