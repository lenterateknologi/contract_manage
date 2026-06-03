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
        // 1. Contracts
        Schema::create('t_contracts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('contract_no')->unique();
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('contract_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('contract_type')->nullable(); // Legacy type string
            $table->foreignUuid('contract_type_id')->nullable()->constrained('m_contract_types')->nullOnDelete();
            $table->string('transaction_type')->default('General');
            $table->enum('status', ['draft', 'in_review', 'revision', 'approved', 'locked', 'archived'])->default('draft');
            $table->unsignedInteger('current_version')->default(1);
            $table->foreignUuid('workflow_id')->nullable()->constrained('m_workflows')->nullOnDelete();
            $table->foreignUuid('workflow_step_id')->nullable()->constrained('m_workflow_steps')->nullOnDelete();
            $table->foreignUuid('created_by')->constrained('m_users')->cascadeOnDelete();
            $table->json('metadata')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 2. Approvals
        Schema::create('t_approvals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('contract_id')->constrained('t_contracts')->cascadeOnDelete();
            $table->foreignUuid('workflow_step_id')->constrained('m_workflow_steps')->cascadeOnDelete();
            $table->foreignUuid('user_id')->nullable()->constrained('m_users')->nullOnDelete();
            $table->string('approver_name')->nullable();
            $table->string('role')->index();
            $table->string('job_title')->nullable();
            $table->enum('status', ['pending', 'waiting', 'approved', 'rejected'])->default('pending')->index();
            $table->text('comment')->nullable();
            $table->integer('sequence')->default(0);
            $table->timestamp('decided_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignUuid('created_by')->nullable()->constrained('m_users')->nullOnDelete();
            $table->foreignUuid('updated_by')->nullable()->constrained('m_users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        // 3. Contract Attachments
        Schema::create('t_contract_attachments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('contract_id')->constrained('t_contracts')->cascadeOnDelete();
            $table->string('label');
            $table->string('category')->nullable();
            $table->string('file_name');
            $table->string('file_path');
            $table->string('file_type')->nullable();
            $table->foreignUuid('uploaded_by')->constrained('m_users')->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        // 4. Contract Versions
        Schema::create('t_contract_versions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('contract_id')->constrained('t_contracts')->cascadeOnDelete();
            $table->unsignedInteger('version_no');
            $table->string('file_name');
            $table->string('file_path')->nullable();
            $table->string('document_type')->nullable();
            $table->text('change_log')->nullable();
            $table->foreignUuid('uploaded_by')->constrained('m_users')->cascadeOnDelete();
            $table->boolean('is_final')->default(false);
            $table->string('file_hash')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 5. Contract Messages
        Schema::create('t_contract_messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('contract_id')->constrained('t_contracts')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('m_users')->cascadeOnDelete();
            $table->text('message');
            $table->json('read_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 6. Contract Form Submissions
        Schema::create('t_contract_form_submissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('contract_id')->constrained('t_contracts')->cascadeOnDelete();
            $table->foreignUuid('form_template_id')->constrained('m_form_templates')->cascadeOnDelete();
            $table->string('document_type', 10); // f1 or f2
            $table->unsignedInteger('current_version')->default(1);
            $table->foreignUuid('submitted_by')->nullable()->constrained('m_users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['contract_id', 'document_type']);
        });

        // 7. Forgot Password
        Schema::create('t_forgot_password', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('email');
            $table->foreignUuid('user_id')->constrained('m_users')->cascadeOnDelete();
            $table->timestamp('expire_at');
            $table->timestamp('redeemed_at')->nullable();
            $table->string('token', 64)->unique();
            $table->timestamps();

            $table->index(['email', 'token', 'expire_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_forgot_password');
        Schema::dropIfExists('t_contract_form_submissions');
        Schema::dropIfExists('t_contract_messages');
        Schema::dropIfExists('t_contract_versions');
        Schema::dropIfExists('t_contract_attachments');
        Schema::dropIfExists('t_approvals');
        Schema::dropIfExists('t_contracts');
    }
};
