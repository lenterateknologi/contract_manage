<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('m_workflows', function (Blueprint $table) {
            $table->json('approver_roles')->nullable()->after('initiator_type');
            $table->json('approver_departments')->nullable()->after('approver_roles');
            $table->json('approver_users')->nullable()->after('approver_departments');
            $table->json('legal_roles')->nullable()->after('approver_users');
            $table->json('legal_departments')->nullable()->after('legal_roles');
            $table->json('legal_users')->nullable()->after('legal_departments');
        });

        Schema::table('m_workflow_steps', function (Blueprint $table) {
            $table->string('label')->nullable()->after('workflow_id');
            $table->string('actor_type')->default('approver')->after('label');
            $table->json('allowed_actions')->nullable()->after('actor_type');
            $table->boolean('is_mandatory')->default(true)->after('allowed_actions');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_workflows', function (Blueprint $table) {
            $table->dropColumn([
                'approver_roles', 'approver_departments', 'approver_users',
                'legal_roles', 'legal_departments', 'legal_users',
            ]);
        });

        Schema::table('m_workflow_steps', function (Blueprint $table) {
            $table->dropColumn(['label', 'actor_type', 'allowed_actions', 'is_mandatory']);
        });
    }
};
