<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    public function up(): void
    {
        Schema::create('contract_types', function (Blueprint $blueprint) {
            $blueprint->uuid('id')->primary();
            $blueprint->string('name');
            $blueprint->text('description')->nullable();
            $blueprint->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contract_types');
    }
};
