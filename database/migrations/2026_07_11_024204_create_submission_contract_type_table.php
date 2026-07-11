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
        Schema::create('m_submission_contract_types', function (Blueprint $table) {
            $table->uuid('contract_type_id');
            $table->uuid('submission_type_id');
            $table->primary(['contract_type_id', 'submission_type_id']);

            $table->foreign('contract_type_id')
                ->references('id')
                ->on('m_contract_types')
                ->onDelete('cascade');

            $table->foreign('submission_type_id')
                ->references('id')
                ->on('m_submission_types')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_submission_contract_types');
    }
};
