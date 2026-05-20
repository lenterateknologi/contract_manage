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
        Schema::dropIfExists('m_company_group_region');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('m_company_group_region', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_group_id')->constrained('m_company_groups')->onDelete('cascade');
            $table->foreignId('region_id')->constrained('m_regions')->onDelete('cascade');
            $table->timestamps();
        });
    }
};
