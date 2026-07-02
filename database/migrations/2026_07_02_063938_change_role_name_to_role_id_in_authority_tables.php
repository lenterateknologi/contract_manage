<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('m_workflow_initiator_authorities', function (Blueprint $table) {
            $table->dropColumn('role_name');
            $table->foreignUuid('role_id')->nullable()->after('workflow_id')->constrained('m_roles')->nullOnDelete();
        });

        Schema::table('m_workflow_step_authorities', function (Blueprint $table) {
            $table->dropColumn('role_name');
            $table->foreignUuid('role_id')->nullable()->after('workflow_step_id')->constrained('m_roles')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('m_workflow_initiator_authorities', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropColumn('role_id');
            $table->string('role_name')->nullable()->after('workflow_id');
        });

        Schema::table('m_workflow_step_authorities', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropColumn('role_id');
            $table->string('role_name')->nullable()->after('workflow_step_id');
        });
    }
};
