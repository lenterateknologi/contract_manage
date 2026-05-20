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
        // 1. Company Groups (Top Level)
        Schema::create('m_company_groups', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 2. Regions
        Schema::create('m_regions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('alias')->nullable();
            $table->string('id_portal_master')->nullable();


            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 3. Companies
        Schema::create('m_companies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('alias')->nullable();
            $table->text('address')->nullable();

            // Relationships
            $table->foreignUuid('company_group_id')->nullable()->constrained('m_company_groups')->nullOnDelete();
            $table->foreignUuid('region_id')->nullable()->constrained('m_regions')->nullOnDelete();

            $table->boolean('is_active')->default(true);
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 4. Update Departments to link to Company
        Schema::table('m_departments', function (Blueprint $table) {
            $table->foreignUuid('company_id')->after('id')->nullable()->constrained('m_companies')->nullOnDelete();
        });

        // 5. Update Users to link to Company
        Schema::table('m_users', function (Blueprint $table) {
            $table->foreignUuid('company_id')->after('role_id')->nullable()->constrained('m_companies')->nullOnDelete();
        });

        // 6. Update Roles to optionally link to Company (if scoping is needed)
        Schema::table('m_roles', function (Blueprint $table) {
            $table->foreignUuid('company_id')->after('id')->nullable()->constrained('m_companies')->nullOnDelete();
        });

        // 7. Update Workflow Steps to store organizational scoping
        Schema::table('m_workflow_steps', function (Blueprint $table) {
            $table->foreignUuid('company_group_id')->nullable()->constrained('m_company_groups')->nullOnDelete();
            $table->foreignUuid('region_id')->nullable()->constrained('m_regions')->nullOnDelete();
            $table->foreignUuid('company_id')->nullable()->constrained('m_companies')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_workflow_steps', function (Blueprint $table) {
            $table->dropForeign(['company_group_id']);
            $table->dropForeign(['region_id']);
            $table->dropForeign(['company_id']);
            $table->dropColumn(['company_group_id', 'region_id', 'company_id']);
        });

        Schema::table('m_roles', function (Blueprint $table) {
            $table->dropForeign(['company_id']);
            $table->dropColumn('company_id');
        });

        Schema::table('m_users', function (Blueprint $table) {
            $table->dropForeign(['company_id']);
            $table->dropColumn('company_id');
        });

        Schema::table('m_departments', function (Blueprint $table) {
            $table->dropForeign(['company_id']);
            $table->dropColumn('company_id');
        });

        Schema::dropIfExists('m_companies');
        Schema::dropIfExists('m_regions');
        Schema::dropIfExists('m_company_groups');
    }
};
