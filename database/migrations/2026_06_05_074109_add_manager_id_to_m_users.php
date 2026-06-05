<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('m_users', function (Blueprint $table) {
            $table->uuid('manager_id')->nullable()->after('department_id');
            $table->foreign('manager_id')->references('id')->on('m_users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('m_users', function (Blueprint $table) {
            $table->dropForeign(['manager_id']);
            $table->dropColumn('manager_id');
        });
    }
};
