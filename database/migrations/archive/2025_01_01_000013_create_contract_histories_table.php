<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    public function up(): void
    {
        Schema::create('contract_histories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('contract_id')->constrained()->cascadeOnDelete();
            $table->string('action');
            $table->text('description')->nullable();
            $table->foreignUuid('actor_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        DB::statement('DROP TABLE IF EXISTS contract_histories CASCADE');
        Schema::enableForeignKeyConstraints();
    }
};
