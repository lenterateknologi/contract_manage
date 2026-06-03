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
        Schema::table('access_modules', function (Blueprint $table) {
            $table->uuid('module_group_id')->nullable()->after('module_id');
            $table->integer('sort_number')->default(0)->after('module_group_id');

            $table->foreign('module_group_id')->references('id')->on('module_groups')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('access_modules', function (Blueprint $table) {
            $table->dropForeign(['module_group_id']);
            $table->dropColumn(['module_group_id', 'sort_number']);
        });
    }
};
