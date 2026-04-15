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
        Schema::table('form_templates', function (Blueprint $table) {
            $table->boolean('has_letterhead')->default(false)->after('description');
            $table->json('letterhead_json')->nullable()->after('has_letterhead');
        });

        Schema::table('form_fields', function (Blueprint $table) {
            $table->string('width')->default('1/1')->after('order'); // 1/1, 1/2, 1/3, 1/4
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('form_templates', function (Blueprint $table) {
            $table->dropColumn(['has_letterhead', 'letterhead_json']);
        });

        Schema::table('form_fields', function (Blueprint $table) {
            $table->dropColumn('width');
        });
    }
};
