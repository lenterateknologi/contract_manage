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
        Schema::create('m_vendor_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('vendor_id')->constrained('m_vendors')->onDelete('cascade');

            $table->string('document_name');
            $table->string('document_type'); // e.g. AKTA_PENDIRIAN, NPWP, SIUP
            $table->string('file_url')->nullable();

            $table->date('expires_at')->nullable();
            $table->boolean('is_verified')->default(false);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_vendor_documents');
    }
};
