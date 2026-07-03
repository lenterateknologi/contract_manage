<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('m_workflow_initiator_authorities', function (Blueprint $table) {
            // Identifies which authority field this row belongs to when is_initiator=true
            // Values: 'role' | 'department' | 'user' | null (legacy rows)
            $table->string('authority_type', 32)->nullable()->after('is_initiator');
        });
    }

    public function down(): void
    {
        Schema::table('m_workflow_initiator_authorities', function (Blueprint $table) {
            $table->dropColumn('authority_type');
        });
    }
};
