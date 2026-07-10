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
        Schema::dropIfExists('m_workflow_org_scopes');
    }

    public function down(): void
    {
        Schema::create('m_workflow_org_scopes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('workflow_id');
            $table->uuid('company_group_id')->nullable();
            $table->uuid('region_id')->nullable();
            $table->uuid('company_id')->nullable();
            $table->string('scope_type', 50)->default('global');
            $table->boolean('is_initiator')->default(false);
            $table->timestamps();

            $table->foreign('workflow_id')->references('id')->on('m_workflows')->cascadeOnDelete();
        });
    }
};
