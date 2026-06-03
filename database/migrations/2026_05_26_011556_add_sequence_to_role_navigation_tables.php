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
        Schema::table('m_role_module_groups', function (Blueprint $table) {
            $table->integer('sequence')->nullable()->after('module_group_id');
        });

        Schema::table('m_access_modules', function (Blueprint $table) {
            $table->integer('sequence')->nullable()->after('module_group_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_role_module_groups', function (Blueprint $table) {
            $table->dropColumn('sequence');
        });

        Schema::table('m_access_modules', function (Blueprint $table) {
            $table->dropColumn('sequence');
        });
    }
};
