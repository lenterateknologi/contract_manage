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
            $table->uuid('workflow_id')->nullable()->after('id');
            $table->json('features')->nullable()->after('workflow_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_contract_types', function (Blueprint $table) {
            $table->dropColumn(['workflow_id', 'features']);
        });
    }
};
