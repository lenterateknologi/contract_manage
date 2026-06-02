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
            $columnsToDrop = [];
            if (Schema::hasColumn('m_contract_statuses', 'display_mode')) {
                $columnsToDrop[] = 'display_mode';
            }
            if (Schema::hasColumn('m_contract_statuses', 'allow_info_edit')) {
                $columnsToDrop[] = 'allow_info_edit';
            }
            if (Schema::hasColumn('m_contract_statuses', 'allow_reference')) {
                $columnsToDrop[] = 'allow_reference';
            }

            if (! empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_contract_statuses', function (Blueprint $table) {
            //
        });
    }
};
