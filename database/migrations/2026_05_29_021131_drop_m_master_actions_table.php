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
            $table->dropForeign(['master_action_id']);
            $table->dropColumn('master_action_id');
        });

        Schema::dropIfExists('m_master_actions');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('m_master_actions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('code')->unique();
            $table->boolean('is_active')->default(true);
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::table('m_workflow_step_actions', function (Blueprint $table) {
            $table->uuid('master_action_id')->nullable()->after('workflow_step_id');
            $table->foreign('master_action_id')->references('id')->on('m_master_actions')->onDelete('cascade');
        });
    }
};
