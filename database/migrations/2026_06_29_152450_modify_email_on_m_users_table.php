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
        Schema::table('m_users', function (Blueprint $table) {
            $table->dropUnique('m_users_email_unique');
            $table->string('email')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_users', function (Blueprint $table) {
            $table->string('email')->nullable(false)->change();
            $table->unique('email', 'm_users_email_unique');
        });
    }
};
