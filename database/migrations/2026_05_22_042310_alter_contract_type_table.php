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
        if (! Schema::hasColumn('m_contract_types', 'parent_id')) {
            Schema::table('m_contract_types', function (Blueprint $table) {
                $table->uuid('parent_id')->nullable()->index()->comment('induk dari jenis kontrak');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('m_contract_types', 'parent_id')) {
            Schema::table('m_contract_types', function (Blueprint $table) {
                $table->dropColumn(['parent_id']);
            });
        }
    }
};
