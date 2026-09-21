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
        Schema::create('m_on_behalf_authorities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('authority_type')->default('group');
            $table->uuid('role_id')->nullable();
            $table->uuid('department_id')->nullable();
            $table->uuid('division_id')->nullable();
            $table->uuid('organization_group_id')->nullable();
            $table->uuid('location_id')->nullable();
            $table->uuid('user_id')->nullable();
            $table->uuid('company_group_id')->nullable();
            $table->uuid('company_id')->nullable();
            $table->uuid('region_id')->nullable();

            $table->boolean('role_use_initiator')->default(false);
            $table->boolean('department_use_initiator')->default(false);
            $table->boolean('division_use_initiator')->default(false);
            $table->boolean('organization_group_use_initiator')->default(false);
            $table->boolean('location_use_initiator')->default(false);
            $table->boolean('company_group_use_initiator')->default(false);
            $table->boolean('company_use_initiator')->default(false);
            $table->boolean('region_use_initiator')->default(false);

            $table->boolean('is_active')->default(true);
            $table->integer('sequence')->nullable()->default(1);
            $table->text('description')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('role_id')->references('id')->on('m_roles')->onDelete('cascade');
            $table->foreign('department_id')->references('id')->on('m_departments')->onDelete('cascade');
            $table->foreign('division_id')->references('id')->on('m_division')->onDelete('cascade');
            $table->foreign('location_id')->references('id')->on('m_locations')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('m_users')->onDelete('cascade');
            $table->foreign('company_group_id')->references('id')->on('m_company_groups')->onDelete('cascade');
            $table->foreign('company_id')->references('id')->on('m_companies')->onDelete('cascade');
            $table->foreign('region_id')->references('id')->on('m_regions')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_on_behalf_authorities');
    }
};
