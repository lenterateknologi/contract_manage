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
        Schema::create('m_company_group_region', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('company_group_id')->constrained('m_company_groups')->cascadeOnDelete();
            $table->foreignUuid('region_id')->constrained('m_regions')->cascadeOnDelete();
            $table->timestamps();

            // Ensure unique combination
            $table->unique(['company_group_id', 'region_id'], 'group_region_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_company_group_region');
    }
};
