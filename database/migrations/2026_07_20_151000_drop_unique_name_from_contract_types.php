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
            $table->dropUnique('m_contract_types_name_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_contract_types', function (Blueprint $table) {
            $table->unique('name', 'm_contract_types_name_unique');
        });
    }
};
