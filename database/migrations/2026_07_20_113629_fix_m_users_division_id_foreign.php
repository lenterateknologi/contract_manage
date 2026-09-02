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
        if (DB::getDriverName() !== 'sqlite') {
            Schema::table('m_users', function (Blueprint $table) {
                $table->dropForeign(['division_id']);
                $table->foreign('division_id')->references('id')->on('m_division')->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_users', function (Blueprint $table) {
            $table->dropForeign(['division_id']);
            $table->foreign('division_id')->references('id')->on('m_departments')->nullOnDelete();
        });
    }
};
