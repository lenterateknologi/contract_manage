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
        Schema::table('workflows', function (Blueprint $col) {
            $col->boolean('is_tax_involved')->default(false)->after('is_template');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('workflows', function (Blueprint $col) {
            $col->dropColumn('is_tax_involved');
        });
    }
};
