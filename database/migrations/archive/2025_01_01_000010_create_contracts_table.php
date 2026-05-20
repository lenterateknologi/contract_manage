<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    public function up(): void
    {
        Schema::create('contracts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('contract_no')->unique();
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignUuid('created_by')->constrained('users')->cascadeOnDelete();
            $table->enum('status', ['draft', 'in_review', 'revision', 'approved', 'locked', 'archived'])->default('draft');
            $table->unsignedInteger('current_version')->default(1);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        DB::statement('DROP TABLE IF EXISTS contracts CASCADE');
        Schema::enableForeignKeyConstraints();
    }
};
