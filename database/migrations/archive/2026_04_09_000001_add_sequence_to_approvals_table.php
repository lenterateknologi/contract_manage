<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('approvals', function (Blueprint $table) {
            $table->integer('sequence')->default(0)->after('workflow_step_id')->index();
        });

        // Backfill sequence from workflow_steps.step
        DB::statement('
            UPDATE approvals 
            SET sequence = workflow_steps.step 
            FROM workflow_steps 
            WHERE workflow_steps.id = approvals.workflow_step_id
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('approvals', function (Blueprint $table) {
            $table->dropColumn('sequence');
        });
    }
};
