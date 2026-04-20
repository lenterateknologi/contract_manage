<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * This migration FORCES a reset of the workflow system to UUIDs by dropping 
     * and recreating the tables. This is necessary for PostgreSQL compatibility.
     */
    public function up(): void
    {
        // 1. Force drop all related tables in correct order
        DB::statement('DROP TABLE IF EXISTS workflow_step_users CASCADE');
        DB::statement('DROP TABLE IF EXISTS approvals CASCADE');
        DB::statement('DROP TABLE IF EXISTS workflow_steps CASCADE');
        DB::statement('DROP TABLE IF EXISTS workflows CASCADE');

        // 2. Recreate workflows with UUID
        Schema::create('workflows', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('contract_type', 100)->unique();
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->boolean('is_default')->default(false)->index();
            $table->boolean('is_active')->default(true)->index();
            $table->uuid('created_by')->index();
            $table->uuid('updated_by')->index();
            $table->timestamps();
        });

        // 3. Recreate workflow_steps with UUID
        Schema::create('workflow_steps', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('workflow_id')->constrained('workflows')->onDelete('cascade');
            $table->string('role', 100)->index();
            $table->integer('step')->index();
            $table->string('step_type')->default('approval');
            $table->string('condition_expression')->nullable();
            $table->string('description', 255)->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->uuid('created_by')->index();
            $table->uuid('updated_by')->index();
            $table->timestamps();
            $table->unique(['workflow_id', 'step']);
        });

        // 4. Recreate approvals with UUID
        Schema::create('approvals', function (Blueprint $table) {
            $table->id();
            $table->uuid('contract_id');
            $table->foreignUuid('workflow_step_id')->constrained('workflow_steps')->onDelete('cascade');
            $table->uuid('user_id')->nullable();
            $table->string('approver_name', 255)->nullable();
            $table->string('role', 100)->index();
            $table->string('job_title', 255)->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending')->index();
            $table->text('comment')->nullable();
            $table->timestamp('decided_at')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->uuid('created_by')->index();
            $table->uuid('updated_by')->index();
            $table->timestamps();
            
            $table->foreign('contract_id')->references('id')->on('contracts')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
        });

        // 5. Recreate pivot table
        Schema::create('workflow_step_users', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('workflow_step_id')->constrained('workflow_steps')->onDelete('cascade');
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });

        // 6. Fix contracts table columns
        // We drop and re-add to ensure they are the correct UUID type
        Schema::table('contracts', function (Blueprint $table) {
            if (Schema::hasColumn('contracts', 'workflow_id')) {
                $table->dropColumn('workflow_id');
            }
            if (Schema::hasColumn('contracts', 'workflow_step_id')) {
                $table->dropColumn('workflow_step_id');
            }
        });

        Schema::table('contracts', function (Blueprint $table) {
            $table->uuid('workflow_id')->nullable()->after('status');
            $table->uuid('workflow_step_id')->nullable()->after('workflow_id');
            
            $table->foreign('workflow_id')->references('id')->on('workflows')->onDelete('set null');
            $table->foreign('workflow_step_id')->references('id')->on('workflow_steps')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No auto-down for a force reset migration
    }
};
