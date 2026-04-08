<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contract_approvals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('contract_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('approver_id')->constrained('users')->cascadeOnDelete();
            $table->string('role');
            $table->unsignedInteger('sequence');
            $table->enum('status', ['pending', 'waiting', 'approved', 'rejected'])->default('waiting');
            $table->text('note')->nullable();
            $table->date('approved_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contract_approvals');
    }
};
