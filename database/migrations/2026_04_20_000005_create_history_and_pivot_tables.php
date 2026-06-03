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
        // 1. Contract History (t_contract_h)
        Schema::create('t_contract_h', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('contract_id')->constrained('t_contracts')->cascadeOnDelete();
            $table->string('action'); // e.g. CREATED, SENT, APPROVED, REJECTED
            $table->text('description')->nullable();
            $table->foreignUuid('actor_id')->constrained('m_users')->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        // 2. Contract Form Submission History (t_contract_form_submission_h)
        Schema::create('t_contract_form_submission_h', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('submission_id')->constrained('t_contract_form_submissions')->cascadeOnDelete();
            $table->unsignedInteger('version_no');
            $table->json('form_data');
            $table->text('change_summary')->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('m_users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['submission_id', 'version_no']);
        });

        // 3. Workflow Step Users Pivot (t_workflow_step_users)
        Schema::create('t_workflow_step_users', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('workflow_step_id')->constrained('m_workflow_steps')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('m_users')->cascadeOnDelete();
            $table->timestamps();
        });

        // 4. HTTP Log History (t_http_log_h)
        // Check if log connection exists in config, if not fallback to default
        $connection = config('database.connections.log') ? 'log' : config('database.default');

        Schema::connection($connection)->dropIfExists('t_http_log_h');
        Schema::connection($connection)->create('t_http_log_h', function (Blueprint $table) {
            $table->id(); // Using standard ID for consistency in baseline
            $table->string('method', 10)->index()->default('GET');
            $table->text('full_url')->nullable();
            $table->string('domain')->index()->nullable();
            $table->text('path')->nullable();
            $table->text('path_index')->nullable()->index();
            $table->text('title')->nullable();
            $table->string('ip')->index()->nullable();
            $table->json('header')->nullable();
            $table->json('file')->nullable();
            $table->json('body')->nullable();
            $table->string('user_id', 36)->index()->nullable();
            $table->timestamp('created_at')->index()->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $connection = config('database.connections.log') ? 'log' : config('database.default');
        Schema::connection($connection)->dropIfExists('t_http_log_h');

        Schema::dropIfExists('t_workflow_step_users');
        Schema::dropIfExists('t_contract_form_submission_h');
        Schema::dropIfExists('t_contract_h');
    }
};
