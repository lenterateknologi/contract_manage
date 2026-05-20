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
        Schema::table('t_contracts', function (Blueprint $table) {
            $table->uuid('parent_id')->nullable()->after('id');
            $table->foreign('parent_id')->references('id')->on('t_contracts')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('t_contracts', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropColumn('parent_id');
        });
    }
};
