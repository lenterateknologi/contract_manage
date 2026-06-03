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
        Schema::table('m_access_modules', function (Blueprint $table) {
            $table->boolean('can_bulk_approve')->default(false)->after('can_approve');
            $table->boolean('can_bulk_delete')->default(false)->after('can_bulk_approve');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_access_modules', function (Blueprint $table) {
            $table->dropColumn(['can_bulk_approve', 'can_bulk_delete']);
        });
    }
};
