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
        Schema::create('workflow_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workflow_id')->constrained('workflows')->onDelete('cascade');
            $table->string('role', 100)->index();
            $table->integer('step')->index();
            $table->string('description', 255)->nullable();
            $table->timestamps();
            $table->boolean('is_active')->default(true)->index();
            $table->uuid('created_by')->index();
            $table->uuid('updated_by')->index();
            $table->unique(['workflow_id', 'step']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        DB::statement('DROP TABLE IF EXISTS workflow_steps CASCADE');
        Schema::enableForeignKeyConstraints();
    }
};
