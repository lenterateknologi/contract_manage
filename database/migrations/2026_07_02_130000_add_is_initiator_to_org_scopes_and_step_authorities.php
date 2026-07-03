<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('m_workflow_org_scopes', function (Blueprint $table) {
            $table->boolean('is_initiator')->default(false)->after('company_id');
        });

        Schema::table('m_workflow_step_authorities', function (Blueprint $table) {
            $table->boolean('is_initiator')->default(false)->after('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('m_workflow_org_scopes', function (Blueprint $table) {
            $table->dropColumn('is_initiator');
        });

        Schema::table('m_workflow_step_authorities', function (Blueprint $table) {
            $table->dropColumn('is_initiator');
        });
    }
};
