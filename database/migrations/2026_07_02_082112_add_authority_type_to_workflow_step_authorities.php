<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('m_workflow_step_authorities', function (Blueprint $table) {
            // Identifies which field this row belongs to when is_initiator=true
            // Values: 'role' | 'department' | 'division' | 'user' | null (legacy)
            $table->string('authority_type', 32)->nullable()->after('is_initiator');
        });
    }

    public function down(): void
    {
        Schema::table('m_workflow_step_authorities', function (Blueprint $table) {
            $table->dropColumn('authority_type');
        });
    }
};
