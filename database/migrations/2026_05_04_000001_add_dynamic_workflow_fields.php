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
        Schema::table('m_workflows', function (Blueprint $table) {
            if (!Schema::hasColumn('m_workflows', 'scope')) {
                $table->string('scope')->default('HO')->nullable();
            }
            if (!Schema::hasColumn('m_workflows', 'workflow_category')) {
                $table->string('workflow_category')->default('unified')->nullable();
            }
        });

        Schema::table('m_workflow_steps', function (Blueprint $table) {
            if (!Schema::hasColumn('m_workflow_steps', 'phase')) {
                $table->string('phase')->default('f1_request')->nullable();
            }
            if (!Schema::hasColumn('m_workflow_steps', 'uploader_type')) {
                $table->string('uploader_type')->nullable();
            }
            if (!Schema::hasColumn('m_workflow_steps', 'reject_target')) {
                $table->string('reject_target')->default('initiator')->nullable();
            }
            if (!Schema::hasColumn('m_workflow_steps', 'hierarchy_level')) {
                $table->integer('hierarchy_level')->nullable();
            }
            if (!Schema::hasColumn('m_workflow_steps', 'role_id')) {
                $table->foreignUuid('role_id')->nullable()->constrained('m_roles')->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_workflows', function (Blueprint $table) {
            $table->dropColumn(['scope', 'workflow_category']);
        });

        Schema::table('m_workflow_steps', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropColumn(['phase', 'uploader_type', 'reject_target', 'hierarchy_level', 'role_id']);
        });
    }
};
