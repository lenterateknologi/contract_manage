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
        Schema::table('t_contracts', function (Blueprint $table) {
            $table->dropUnique('t_contracts_contract_no_unique');
        });

        Schema::table('t_contracts', function (Blueprint $table) {
            $table->renameColumn('contract_no', 'form_no');
            $table->renameColumn('crown_no', 'contract_no');
        });

        Schema::table('t_contracts', function (Blueprint $table) {
            $table->index('form_no');
            $table->index('contract_no');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('t_contracts', function (Blueprint $table) {
            $table->dropIndex(['form_no']);
            $table->dropIndex(['contract_no']);
        });

        Schema::table('t_contracts', function (Blueprint $table) {
            $table->renameColumn('contract_no', 'crown_no');
            $table->renameColumn('form_no', 'contract_no');
        });

        Schema::table('t_contracts', function (Blueprint $table) {
            $table->unique('contract_no', 't_contracts_contract_no_unique');
        });
    }
};
