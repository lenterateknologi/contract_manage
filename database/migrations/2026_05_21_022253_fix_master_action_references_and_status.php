<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Find the active assign_pic action
        $assignPic = DB::table('m_master_actions')
            ->where('code', 'assign_pic')
            ->first();

        // 2. Find the deleted assign action
        $deletedAssign = DB::table('m_master_actions')
            ->where('code', 'assign')
            ->first();

        if ($assignPic && $deletedAssign) {
            // Update step actions pointing to the old soft-deleted assign action
            DB::table('m_workflow_step_actions')
                ->where('master_action_id', $deletedAssign->id)
                ->update(['master_action_id' => $assignPic->id]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No rollback necessary as this fixes bad references
    }
};
