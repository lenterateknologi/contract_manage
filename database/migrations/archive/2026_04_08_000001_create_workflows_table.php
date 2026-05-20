<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('workflows', function (Blueprint $table) {
            $table->id();
            $table->string('contract_type', 100)->index();
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->boolean('is_default')->default(false)->index();
            $table->timestamps();
            $table->boolean('is_active')->default(true)->index();
            $table->uuid('created_by')->index();
            $table->uuid('updated_by')->index();
            $table->unique(['contract_type']);

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        DB::statement('DROP TABLE IF EXISTS workflows CASCADE');
        Schema::enableForeignKeyConstraints();
    }
};
