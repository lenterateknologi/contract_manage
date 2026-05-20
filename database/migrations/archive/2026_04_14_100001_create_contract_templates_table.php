<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    public function up(): void
    {
        Schema::create('contract_templates', function (Blueprint $blueprint) {
            $blueprint->uuid('id')->primary();
            $blueprint->uuid('template_folder_id')->nullable();
            $blueprint->string('name');
            $blueprint->text('description')->nullable();
            $blueprint->string('file_path');
            $blueprint->string('file_name');
            $blueprint->bigInteger('file_size')->default(0);
            $blueprint->string('file_type')->nullable();
            $blueprint->uuid('created_by')->nullable();
            $blueprint->uuid('updated_by')->nullable();
            $blueprint->timestamps();

            $blueprint->foreign('template_folder_id')->references('id')->on('template_folders')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contract_templates');
    }
};
