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
        Schema::table('t_messages', function (Blueprint $table) {
            $table->json('reactions')->nullable()->after('read_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('t_messages', function (Blueprint $table) {
            $table->dropColumn('reactions');
        });
    }
};
