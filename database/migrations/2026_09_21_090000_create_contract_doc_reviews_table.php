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
        Schema::create('t_contract_doc_reviews', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('contract_id');
            $table->uuid('workflow_step_id')->nullable();
            $table->integer('step_number')->nullable();
            $table->integer('workflow_iteration')->default(1);
            $table->string('document_type'); // f1, f2, agreement
            $table->uuid('user_id')->nullable();
            $table->string('user_name')->nullable();
            $table->string('user_role')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->foreign('contract_id')->references('id')->on('t_contracts')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('m_users')->onDelete('set null');

            $table->index(['contract_id', 'workflow_step_id', 'document_type']);
            $table->index(['contract_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_contract_doc_reviews');
    }
};
