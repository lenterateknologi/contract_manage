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
        Schema::create('m_locations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->bigInteger('idlocation')->nullable()->index();
            $table->string('code', 50)->index(); // locationCode
            $table->string('name', 255); // locationName
            $table->bigInteger('idlocation_group')->nullable()->index(); // idlocationGroup
            $table->string('location_group_name', 255)->nullable(); // locationGroupName
            $table->string('phone', 50)->nullable();
            $table->string('fax', 50)->nullable();
            $table->bigInteger('idcountry')->nullable();
            $table->string('country_name', 100)->nullable();
            $table->bigInteger('idprovince')->nullable();
            $table->string('province_name', 100)->nullable();
            $table->bigInteger('idcity')->nullable();
            $table->string('city_name', 100)->nullable();
            $table->bigInteger('idsub_district')->nullable();
            $table->string('sub_district_name', 100)->nullable();
            $table->bigInteger('idvillage')->nullable();
            $table->string('village_name', 100)->nullable();
            $table->text('address')->nullable();
            $table->string('zip_code', 20)->nullable();
            $table->string('oracle_code', 50)->nullable();
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
        Schema::dropIfExists('m_locations');
    }
};
