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
        Schema::table('m_contract_types', function (Blueprint $table) {
            $table->string('input_mechanism')->default('digital')->nullable();
            $table->foreignUuid('form_template_id')->nullable()->constrained('m_form_templates')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_contract_types', function (Blueprint $table) {
            $table->dropForeign(['form_template_id']);
            $table->dropColumn(['input_mechanism', 'form_template_id']);
        });
    }
};
