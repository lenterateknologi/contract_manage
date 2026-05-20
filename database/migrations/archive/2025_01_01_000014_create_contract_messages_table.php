<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    public function up(): void
    {
        Schema::create('contract_messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('contract_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->text('message');
            $table->json('read_by')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        DB::statement('DROP TABLE IF EXISTS contract_messages CASCADE');
        Schema::enableForeignKeyConstraints();
    }
};
