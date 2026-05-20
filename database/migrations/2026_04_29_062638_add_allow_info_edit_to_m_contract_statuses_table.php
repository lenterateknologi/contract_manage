<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('m_contract_statuses', function (Blueprint $table) {
            $table->boolean('allow_info_edit')->default(false)->after('display_mode');
        });

        // Set draft status to allow info edit by default
        DB::table('m_contract_statuses')
            ->where('code', 'draft')
            ->update(['allow_info_edit' => true]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_contract_statuses', function (Blueprint $table) {
            $table->dropColumn('allow_info_edit');
        });
    }
};
