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
        Schema::dropIfExists('m_workflow_step_authorities');
        Schema::dropIfExists('m_workflow_initiator_authorities');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Legacy tables replaced by m_authorities
    }
};
