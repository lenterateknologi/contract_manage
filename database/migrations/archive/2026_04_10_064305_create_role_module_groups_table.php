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
        Schema::create('role_module_groups', function (Blueprint $table) {
            $table->uuid('role_id');
            $table->uuid('module_group_id');
            $table->integer('sort_number')->default(0);
            $table->primary(['role_id', 'module_group_id']);
            $table->foreign('role_id')->references('id')->on('roles')->onDelete('cascade');
            $table->foreign('module_group_id')->references('id')->on('module_groups')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('role_module_groups');
    }
};
