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
        Schema::create('m_contract_filter_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');

            $table->boolean('can_change_company_group')->default(false);
            $table->json('allowed_company_groups')->nullable();

            $table->boolean('can_change_region')->default(false);
            $table->json('allowed_regions')->nullable();

            $table->boolean('can_change_company')->default(false);
            $table->json('allowed_companies')->nullable();

            $table->boolean('can_change_division')->default(false);
            $table->json('allowed_divisions')->nullable();

            $table->boolean('can_change_department')->default(false);
            $table->json('allowed_departments')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });

        Schema::table('m_users', function (Blueprint $table) {
            $table->uuid('contract_filter_template_id')->nullable()->after('region_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_users', function (Blueprint $table) {
            $table->dropColumn('contract_filter_template_id');
        });

        Schema::dropIfExists('m_contract_filter_templates');
    }
};
