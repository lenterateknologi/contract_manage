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
        Schema::create('m_workflow_contract_types', function (Blueprint $table) {
            $table->uuid('workflow_id')->index();
            $table->uuid('contract_type_id')->index();

            $table->foreign('workflow_id')->references('id')->on('m_workflows')->cascadeOnDelete();
            $table->foreign('contract_type_id')->references('id')->on('m_contract_types')->cascadeOnDelete();

            $table->primary(['workflow_id', 'contract_type_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_workflow_contract_types');
    }
};
