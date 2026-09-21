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
        Schema::create('t_contract_reviews', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('contract_id');
            $table->uuid('workflow_step_id')->nullable();
            $table->uuid('workflow_step_action_id')->nullable();
            $table->integer('step_number')->nullable();
            $table->integer('workflow_iteration')->default(1);
            
            // Context/category of the review requirement (e.g. 'document_review', 'field_requirement', 'attachment_requirement', 'checklist')
            $table->string('context_type')->default('document_review')->index();
            
            // Specific key or type (e.g. 'f1', 'f2', 'agreement', 'meta_tax_required', etc.)
            $table->string('item_key')->nullable()->index();
            
            // Legacy document_type alias column for backwards compatibility
            $table->string('document_type')->nullable();
            
            // Status of the item ('reviewed', 'verified', 'pending', 'rejected', etc.)
            $table->string('status')->default('reviewed')->index();
            
            $table->uuid('user_id')->nullable();
            $table->string('user_name')->nullable();
            $table->string('user_role')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->ipAddress('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('contract_id')->references('id')->on('t_contracts')->onDelete('cascade');
            $table->foreign('workflow_step_id')->references('id')->on('m_workflow_steps')->onDelete('set null');
            $table->foreign('user_id')->references('id')->on('m_users')->onDelete('set null');

            $table->index(['contract_id', 'workflow_step_id', 'context_type', 'item_key'], 'idx_contract_review_lookup');
        });

        // Migrate existing data from t_contract_doc_reviews if exists
        if (Schema::hasTable('t_contract_doc_reviews')) {
            $existing = DB::table('t_contract_doc_reviews')->get();
            foreach ($existing as $row) {
                DB::table('t_contract_reviews')->insert([
                    'id' => $row->id,
                    'contract_id' => $row->contract_id,
                    'workflow_step_id' => $row->workflow_step_id,
                    'workflow_step_action_id' => null,
                    'step_number' => $row->step_number,
                    'workflow_iteration' => $row->workflow_iteration ?? 1,
                    'context_type' => 'document_review',
                    'item_key' => $row->document_type,
                    'document_type' => $row->document_type,
                    'status' => 'reviewed',
                    'user_id' => $row->user_id,
                    'user_name' => $row->user_name,
                    'user_role' => $row->user_role,
                    'reviewed_at' => $row->reviewed_at,
                    'ip_address' => $row->ip_address,
                    'user_agent' => $row->user_agent,
                    'metadata' => $row->metadata,
                    'created_at' => $row->created_at,
                    'updated_at' => $row->updated_at,
                ]);
            }
            Schema::dropIfExists('t_contract_doc_reviews');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_contract_reviews');
    }
};
