<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('m_workflow_org_scopes', function (Blueprint $table) {
            // Identifies which scope field this row belongs to when is_initiator=true
            // Values: 'company_group' | 'region' | 'company' | null (legacy rows without specific type)
            $table->string('scope_type', 32)->nullable()->after('is_initiator');
        });

        // Backfill existing is_initiator=true rows: they have no specific scope_type,
        // so we leave scope_type as null — the controller will treat null as "all" (legacy).
    }

    public function down(): void
    {
        Schema::table('m_workflow_org_scopes', function (Blueprint $table) {
            $table->dropColumn('scope_type');
        });
    }
};
