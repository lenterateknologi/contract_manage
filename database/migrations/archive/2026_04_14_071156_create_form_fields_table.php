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
        Schema::create('form_fields', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('form_template_id')->constrained('form_templates')->onDelete('cascade');
            $table->string('label');
            $table->string('name');
            $table->string('type'); // text, number, date, select, textarea, checkbox, radio
            $table->string('placeholder')->nullable();
            $table->boolean('is_required')->default(false);
            $table->json('options')->nullable();
            $table->integer('order')->default(0);
            $table->string('validation_rules')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('form_fields');
    }
};
