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
        Schema::create('access_modules', function (Blueprint $table) {
            $table->uuid('role_id');
            $table->uuid('module_id');
            $table->primary(['role_id', 'module_id']);
            $table->boolean('can_read')->default(true);
            $table->boolean('can_create')->default(true);
            $table->boolean('can_update')->default(true);
            $table->boolean('can_delete')->default(true); 
            $table->foreignUuid('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('access_modules');
    }
};
