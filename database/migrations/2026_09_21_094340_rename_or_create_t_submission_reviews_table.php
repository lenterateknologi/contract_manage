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
        if (Schema::hasTable('t_contract_reviews')) {
            Schema::rename('t_contract_reviews', 't_submission_reviews');
        }

        if (! Schema::hasTable('t_submission_reviews')) {
            Schema::create('t_submission_reviews', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('submission_id')->nullable()->index(); // Can be contract_id or form_submission_id
                $table->uuid('contract_id')->nullable()->index();
                $table->string('submission_type')->default('contract')->index(); // 'contract' | 'form_submission'
                $table->uuid('workflow_step_id')->nullable();
                $table->uuid('workflow_step_action_id')->nullable();
                $table->integer('step_number')->nullable();
                $table->integer('workflow_iteration')->default(1);
                
                // Context/category (e.g. 'document_review', 'field_requirement', 'attachment_requirement', 'checklist')
                $table->string('context_type')->default('document_review')->index();
                
                // Specific key or type (e.g. 'f1', 'f2', 'agreement', 'meta_tax_required', etc.)
                $table->string('item_key')->nullable()->index();
                
                // Legacy document_type alias column
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

                $table->foreign('workflow_step_id')->references('id')->on('m_workflow_steps')->onDelete('set null');
                $table->foreign('user_id')->references('id')->on('m_users')->onDelete('set null');

                $table->index(['submission_id', 'workflow_step_id', 'context_type', 'item_key'], 'idx_submission_review_lookup');
            });
        } else {
            Schema::table('t_submission_reviews', function (Blueprint $table) {
                if (! Schema::hasColumn('t_submission_reviews', 'submission_id')) {
                    $table->uuid('submission_id')->nullable()->index();
                }
                if (! Schema::hasColumn('t_submission_reviews', 'submission_type')) {
                    $table->string('submission_type')->default('contract')->index();
                }
            });

            DB::statement("UPDATE t_submission_reviews SET submission_id = contract_id WHERE submission_id IS NULL AND contract_id IS NOT NULL");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_submission_reviews');
    }
};
