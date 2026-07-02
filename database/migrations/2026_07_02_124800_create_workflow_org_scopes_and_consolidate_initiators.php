<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create m_workflow_org_scopes table
        Schema::create('m_workflow_org_scopes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('workflow_id');
            $table->uuid('company_group_id')->nullable();
            $table->uuid('region_id')->nullable();
            $table->uuid('company_id')->nullable();
            $table->timestamps();

            $table->foreign('workflow_id')
                ->references('id')
                ->on('m_workflows')
                ->onDelete('cascade');
        });

        // 2. Create m_workflow_initiator_authorities table
        Schema::create('m_workflow_initiator_authorities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('workflow_id');
            $table->string('role_name')->nullable();
            $table->uuid('department_id')->nullable();
            $table->uuid('division_id')->nullable();
            $table->uuid('user_id')->nullable();
            $table->timestamps();

            $table->foreign('workflow_id')
                ->references('id')
                ->on('m_workflows')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('m_workflow_initiator_authorities');
        Schema::dropIfExists('m_workflow_org_scopes');
    }
};
