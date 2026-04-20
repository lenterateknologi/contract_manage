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
        // 1. Departments
        Schema::create('m_departments', function (Blueprint $table) {
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

        // 2. Roles
        Schema::create('m_roles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 3. Users (Master User Table)
        Schema::create('m_users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('username')->unique()->nullable();
            $table->string('initials', 10)->nullable();
            $table->string('role')->nullable(); // Legacy role field, keep for now
            $table->string('position')->nullable();
            $table->string('phone')->nullable();
            $table->string('bg_color')->nullable();
            $table->string('text_color')->nullable();
            $table->foreignId('role_id')->nullable(); // New FK to m_roles (if numeric) or uuid
            $table->foreignUuid('department_id')->nullable()->constrained('m_departments')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();
        });

        // 4. Contract Types (m_contract_types)
        Schema::create('m_contract_types', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name')->unique();
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->string('type')->nullable(); // For categorization (e.g. f1, f2)
            $table->boolean('is_active')->default(true);
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 5. Contract Statuses (m_contract_statuses)
        Schema::create('m_contract_statuses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code')->unique();
            $table->string('label');
            $table->string('color', 20)->default('gray');
            $table->string('bg_color', 20)->nullable();
            $table->string('icon', 50)->nullable();
            $table->text('description')->nullable();
            $table->integer('sequence')->default(0);
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 6. Vendors
        Schema::create('m_vendors', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->string('tax_id')->nullable();
            $table->string('category')->nullable();
            $table->boolean('is_active')->default(true);
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 7. Module Groups (Must be before Modules for FK)
        Schema::create('m_module_groups', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name')->unique();
            $table->string('icon')->nullable();
            $table->integer('sequence')->default(0);
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 8. Modules
        Schema::create('m_modules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('identifier')->unique();
            $table->foreignUuid('module_group_id')->nullable()->constrained('m_module_groups')->nullOnDelete();
            $table->string('icon')->nullable();
            $table->string('route')->nullable();
            $table->integer('sequence')->default(0);
            $table->boolean('is_active')->default(true);
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 9. Access Modules (Permissions)
        Schema::create('m_access_modules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('role_id')->constrained('m_roles')->cascadeOnDelete();
            $table->foreignUuid('module_id')->constrained('m_modules')->cascadeOnDelete();
            $table->boolean('can_view')->default(false);
            $table->boolean('can_create')->default(false);
            $table->boolean('can_edit')->default(false);
            $table->boolean('can_delete')->default(false);
            $table->boolean('can_approve')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });

        // 10. Role Module Groups Relationships
        Schema::create('m_role_module_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('role_id')->constrained('m_roles')->cascadeOnDelete();
            $table->foreignUuid('module_group_id')->constrained('m_module_groups')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_role_module_groups');
        Schema::dropIfExists('m_access_modules');
        Schema::dropIfExists('m_modules');
        Schema::dropIfExists('m_module_groups');
        Schema::dropIfExists('m_vendors');
        Schema::dropIfExists('m_contract_statuses');
        Schema::dropIfExists('m_contract_types');
        Schema::dropIfExists('m_users');
        Schema::dropIfExists('m_roles');
        Schema::dropIfExists('m_departments');
    }
};
