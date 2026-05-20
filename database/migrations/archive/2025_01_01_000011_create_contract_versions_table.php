<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    public function up(): void
    {
        Schema::create('contract_versions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('contract_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('version_no');
            $table->string('file_name');
            $table->string('file_path')->nullable();
            $table->text('change_log')->nullable();
            $table->foreignUuid('uploaded_by')->constrained('users')->cascadeOnDelete();
            $table->boolean('is_final')->default(false);
            $table->string('file_hash')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        DB::statement('DROP TABLE IF EXISTS contract_versions CASCADE');
        Schema::enableForeignKeyConstraints();
    }
};
