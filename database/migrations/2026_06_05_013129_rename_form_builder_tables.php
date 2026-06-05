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
        Schema::rename('t_contract_form_submissions', 't_form_submissions');
        Schema::rename('t_contract_form_submission_histories', 't_form_submission_histories');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::rename('t_form_submissions', 't_contract_form_submissions');
        Schema::rename('t_form_submission_histories', 't_contract_form_submission_histories');
    }
};
