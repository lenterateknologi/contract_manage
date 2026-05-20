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
        Schema::create('forgot_password', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('email');
            $table->uuid('user_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->timestamp('expire_at');
            $table->timestamp('redeemed_at')->nullable();
            $table->string('token', 64)->unique();
            $table->timestamps();

            // Indexes
            $table->index('email');
            $table->index('user_id');
            $table->index('expire_at');
            $table->index('token');
            $table->index('redeemed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('forgot_password');
    }
};
