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
        Schema::create('m_business_units', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->bigInteger('idbusiness_unit')->nullable()->index();
            $table->string('code', 50)->index(); // kodeBisnisUnit
            $table->string('name', 255); // deskripsi
            $table->bigInteger('idcompany')->nullable()->index();
            $table->string('company_name', 255)->nullable();
            $table->string('company_oracle_code', 50)->nullable();
            $table->uuid('company_id')->nullable()->index();
            $table->bigInteger('idlocation')->nullable()->index();
            $table->string('location_name', 255)->nullable();
            $table->string('location_oracle_code', 50)->nullable();
            $table->uuid('location_id')->nullable()->index();
            $table->bigInteger('idcompany_group')->nullable()->index();
            $table->string('company_group_code', 50)->nullable();
            $table->string('company_group_name', 255)->nullable();
            $table->uuid('company_group_id')->nullable()->index();
            $table->bigInteger('idregion')->nullable()->index();
            $table->string('region_code', 50)->nullable();
            $table->string('region_name', 150)->nullable();
            $table->uuid('region_id')->nullable()->index();
            $table->bigInteger('idkomoditi')->nullable();
            $table->string('komoditi_name', 255)->nullable();
            $table->string('kebun', 255)->nullable();
            $table->timestamp('last_req_date')->nullable();
            $table->integer('rice_exclude')->default(0);
            $table->integer('is_downstream')->default(0);
            $table->string('ktu', 100)->nullable();
            $table->string('kpp', 100)->nullable();
            $table->string('dppjamsostek', 100)->nullable();
            $table->string('latitude', 50)->nullable();
            $table->string('longitude', 50)->nullable();
            $table->string('created_by_name')->nullable();
            $table->string('modified_by_name')->nullable();
            $table->timestamp('portal_created_date')->nullable();
            $table->timestamp('portal_modified_date')->nullable();
            $table->boolean('is_used')->default(false)->index();
            $table->boolean('is_active')->default(true)->index();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_business_units');
    }
};
