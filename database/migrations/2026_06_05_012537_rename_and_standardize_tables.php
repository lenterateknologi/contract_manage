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
        Schema::rename('t_contract_messages', 't_messages');
        Schema::rename('t_contract_attachments', 't_attachments');
        Schema::rename('t_contract_h', 't_contract_histories');
        Schema::rename('t_contract_form_submission_h', 't_contract_form_submission_histories');

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::rename('t_messages', 't_contract_messages');
        Schema::rename('t_attachments', 't_contract_attachments');

    }
};
