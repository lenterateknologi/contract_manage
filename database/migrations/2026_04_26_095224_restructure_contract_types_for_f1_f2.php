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
            $table->dropColumn(['type', 'input_mechanism', 'form_template_id']);
            
            $table->string('f1_input_mechanism')->default('digital')->nullable();
            $table->foreignUuid('f1_form_template_id')->nullable()->constrained('m_form_templates')->nullOnDelete();
            
            $table->string('f2_input_mechanism')->default('digital')->nullable();
            $table->foreignUuid('f2_form_template_id')->nullable()->constrained('m_form_templates')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_contract_types', function (Blueprint $table) {
            $table->dropForeign(['f1_form_template_id']);
            $table->dropForeign(['f2_form_template_id']);
            $table->dropColumn(['f1_input_mechanism', 'f1_form_template_id', 'f2_input_mechanism', 'f2_form_template_id']);
            
            $table->string('type')->default('f1');
            $table->string('input_mechanism')->default('digital')->nullable();
            $table->foreignUuid('form_template_id')->nullable()->constrained('m_form_templates')->nullOnDelete();
        });
    }
};
