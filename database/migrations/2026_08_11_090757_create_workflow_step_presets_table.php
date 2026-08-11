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
        Schema::create('m_workflow_step_presets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->json('step_data');
            $table->foreignUuid('created_by_user_id')->nullable()->constrained('m_users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_workflow_step_presets');
    }
};
