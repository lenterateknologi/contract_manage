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
        Schema::table('m_contract_statuses', function (Blueprint $table) {
            $table->boolean('allow_reference')->default(false)->after('allow_info_edit');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_contract_statuses', function (Blueprint $table) {
            if (Schema::hasColumn('m_contract_statuses', 'allow_reference')) {
                $table->dropColumn('allow_reference');
            }
        });
    }
};
