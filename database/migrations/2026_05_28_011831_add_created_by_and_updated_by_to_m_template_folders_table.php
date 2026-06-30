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
        Schema::table('m_template_folders', function (Blueprint $table) {
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_template_folders', function (Blueprint $table) {
            if (Schema::hasColumn('m_template_folders', 'created_by')) {
                $table->dropColumn('created_by');
            }
            if (Schema::hasColumn('m_template_folders', 'updated_by')) {
                $table->dropColumn('updated_by');
            }
        });
    }
};
