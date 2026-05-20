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
        Schema::table('m_contract_types', function (Blueprint $table) {
            $table->foreignUuid('f1_contract_template_id')->nullable()->constrained('m_contract_templates')->nullOnDelete();
            $table->foreignUuid('f2_contract_template_id')->nullable()->constrained('m_contract_templates')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_contract_types', function (Blueprint $table) {
            $table->dropForeign(['f1_contract_template_id']);
            $table->dropForeign(['f2_contract_template_id']);
            $table->dropColumn(['f1_contract_template_id', 'f2_contract_template_id']);
        });
    }
};
