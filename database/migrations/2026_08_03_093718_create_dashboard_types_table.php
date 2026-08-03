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
        if (! Schema::hasTable('m_dashboard_types')) {
            Schema::create('m_dashboard_types', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('name');
                $table->text('description')->nullable();
                $table->uuid('role_id')->nullable();
                $table->uuid('department_id')->nullable();
                $table->boolean('show_overview')->default(false);
                $table->boolean('show_workload')->default(false);
                $table->boolean('show_master_data')->default(false);
                $table->uuid('created_by')->nullable();
                $table->uuid('updated_by')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('m_dashboard_types');
    }
};
