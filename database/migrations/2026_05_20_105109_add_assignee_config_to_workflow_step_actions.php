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
        Schema::table('m_workflow_step_actions', function (Blueprint $table) {
            $table->json('assignee_config')->nullable()->after('signing_parties');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_workflow_step_actions', function (Blueprint $table) {
            $table->dropColumn('assignee_config');
        });
    }
};
