<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    public function up(): void
    {
        Schema::create('contract_form_submission_versions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('submission_id')->constrained('contract_form_submissions')->onDelete('cascade');
            $table->unsignedInteger('version_no');
            $table->json('form_data'); // all filled field values
            $table->text('change_summary')->nullable(); // what changed
            $table->foreignUuid('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->unique(['submission_id', 'version_no']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contract_form_submission_versions');
    }
};
