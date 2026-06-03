<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('initials', 4)->nullable()->after('name');
            $table->string('role')->nullable()->after('initials');
            $table->string('bg_color', 10)->nullable()->after('role');
            $table->string('text_color', 10)->nullable()->after('bg_color');
        });
    }

    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['initials', 'role', 'bg_color', 'text_color']);
        });
        Schema::enableForeignKeyConstraints();
    }
};
