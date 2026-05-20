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
            $table->uuid('assigned_pic_id')->nullable()->after('created_by');
            $table->uuid('assigned_by_id')->nullable()->after('assigned_pic_id');

            $table->foreign('assigned_pic_id')->references('id')->on('m_users')->onDelete('set null');
            $table->foreign('assigned_by_id')->references('id')->on('m_users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('t_contracts', function (Blueprint $table) {
            $table->dropForeign(['assigned_pic_id']);
            $table->dropForeign(['assigned_by_id']);
            $table->dropColumn(['assigned_pic_id', 'assigned_by_id']);
        });
    }
};
