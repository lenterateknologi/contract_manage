<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    public function up(): void
    {
        Schema::create('contract_form_submissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('contract_id')->constrained('contracts')->onDelete('cascade');
            $table->foreignUuid('form_template_id')->constrained('form_templates')->onDelete('cascade');
            $table->string('document_type', 10); // f1 or f2
            $table->unsignedInteger('current_version')->default(1);
            $table->foreignUuid('submitted_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->unique(['contract_id', 'document_type']); // one F1 and one F2 per contract
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contract_form_submissions');
    }
};
