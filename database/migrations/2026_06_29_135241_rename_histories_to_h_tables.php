<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::rename('t_contract_histories', 't_contract_h');
        Schema::rename('t_form_submission_histories', 't_form_submission_h');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::rename('t_contract_h', 't_contract_histories');
        Schema::rename('t_form_submission_h', 't_form_submission_histories');
    }
};
