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
        Schema::table('m_workflow_steps', function (Blueprint $table) {
            if (! Schema::hasColumn('m_workflow_steps', 'is_visible')) {
                $table->boolean('is_visible')->default(true)->after('is_active');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_workflow_steps', function (Blueprint $table) {
            if (Schema::hasColumn('m_workflow_steps', 'is_visible')) {
                $table->dropColumn('is_visible');
            }
        });
    }
};
