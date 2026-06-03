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
        Schema::table('m_workflow_step_actions', function (Blueprint $table) {
            $table->string('action_code')->nullable()->after('master_action_id');
        });

        // Migrate existing data
        $actions = DB::table('m_workflow_step_actions')
            ->join('m_master_actions', 'm_workflow_step_actions.master_action_id', '=', 'm_master_actions.id')
            ->select('m_workflow_step_actions.id', 'm_master_actions.code')
            ->get();

        foreach ($actions as $action) {
            DB::table('m_workflow_step_actions')
                ->where('id', $action->id)
                ->update(['action_code' => $action->code]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_workflow_step_actions', function (Blueprint $table) {
            $table->dropColumn('action_code');
        });
    }
};
