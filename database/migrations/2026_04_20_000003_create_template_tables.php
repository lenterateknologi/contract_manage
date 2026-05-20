<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Template Folders
        Schema::create('m_template_folders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->uuid('parent_id')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::table('m_template_folders', function (Blueprint $table) {
            $table->foreign('parent_id')->references('id')->on('m_template_folders')->onDelete('cascade');
        });

        // 2. Contract Templates (File-based)
        Schema::create('m_contract_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('template_folder_id')->nullable()->constrained('m_template_folders')->nullOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('file_path');
            $table->string('file_name');
            $table->bigInteger('file_size')->default(0);
            $table->string('file_type')->nullable();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 3. Form Templates (Form Builder)
        Schema::create('m_form_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('document_type')->default('contract'); // contract, f1, f2
            $table->foreignUuid('contract_type_id')->nullable()->constrained('m_contract_types')->nullOnDelete();
            $table->string('transaction_type')->nullable();
            $table->boolean('has_letterhead')->default(false);
            $table->json('letterhead_json')->nullable();
            $table->boolean('is_active')->default(true);
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 4. Form Fields
        Schema::create('m_form_fields', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('form_template_id')->constrained('m_form_templates')->cascadeOnDelete();
            $table->uuid('parent_id')->nullable(); // For nested/repeater fields
            $table->string('label');
            $table->string('name');
            $table->string('type');
            $table->string('container_type')->nullable(); // For special layout containers
            $table->string('width')->default('100'); // percentage or grid span
            $table->string('placeholder')->nullable();
            $table->boolean('is_required')->default(false);
            $table->boolean('use_rich_text')->default(false);
            $table->json('options')->nullable();
            $table->json('validation_rules')->nullable();
            $table->integer('order')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::table('m_form_fields', function (Blueprint $table) {
            $table->foreign('parent_id')->references('id')->on('m_form_fields')->onDelete('cascade');
        });

        // 5. Workflows
        Schema::create('m_workflows', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('contract_type')->index();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignUuid('department_id')->nullable()->constrained('m_departments')->nullOnDelete();
            $table->boolean('is_default')->default(false);
            $table->boolean('is_template')->default(true);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_tax_involved')->default(false);
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 6. Workflow Steps
        Schema::create('m_workflow_steps', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('workflow_id')->constrained('m_workflows')->cascadeOnDelete();
            $table->string('role')->index();
            $table->integer('step')->index();
            $table->string('approver_type')->default('role'); // role, user
            $table->string('step_type')->default('approval'); // approval, notification
            $table->string('condition_expression')->nullable();
            $table->text('description')->nullable();
            $table->foreignUuid('department_id')->nullable()->constrained('m_departments')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['workflow_id', 'step']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_workflow_steps');
        Schema::dropIfExists('m_workflows');
        Schema::dropIfExists('m_form_fields');
        Schema::dropIfExists('m_form_templates');
        Schema::dropIfExists('m_contract_templates');
        Schema::dropIfExists('m_template_folders');
    }
};
