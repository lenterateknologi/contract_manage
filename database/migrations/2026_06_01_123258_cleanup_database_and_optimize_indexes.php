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
        // 1. Drop Legacy Tables
        Schema::dropIfExists('m_company');
        Schema::dropIfExists('m_company_group');

        // 2. Drop Redundant Columns in m_users
        Schema::table('m_users', function (Blueprint $table) {
            $columnsToDrop = [];
            if (Schema::hasColumn('m_users', 'company')) {
                $columnsToDrop[] = 'company';
            }
            if (Schema::hasColumn('m_users', 'region')) {
                $columnsToDrop[] = 'region';
            }
            if (Schema::hasColumn('m_users', 'group')) {
                $columnsToDrop[] = 'group';
            }
            if (Schema::hasColumn('m_users', 'location')) {
                $columnsToDrop[] = 'location';
            }

            if (! empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });

        // 3. Drop Redundant Columns in t_contracts
        Schema::table('t_contracts', function (Blueprint $table) {
            if (Schema::hasColumn('t_contracts', 'contract_type')) {
                $table->dropColumn('contract_type');
            }

            // Add Index to status
            $table->index('status');
        });

        // 4. Optimize Indexes in t_approvals
        Schema::table('t_approvals', function (Blueprint $table) {
            $table->index('contract_id');
            $table->index('user_id');
            $table->index('workflow_step_id');
        });

        // 5. Optimize Indexes in m_users
        Schema::table('m_users', function (Blueprint $table) {
            $table->index('role_id');
            $table->index('department_id');
            $table->index('company_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Re-adding columns (minimal rollback representation)
        Schema::table('m_users', function (Blueprint $table) {
            $table->dropIndex(['role_id']);
            $table->dropIndex(['department_id']);
            $table->dropIndex(['company_id']);

            $table->string('company')->nullable();
            $table->string('region')->nullable();
            $table->string('group')->nullable();
            $table->string('location')->nullable();
        });

        Schema::table('t_approvals', function (Blueprint $table) {
            $table->dropIndex(['contract_id']);
            $table->dropIndex(['user_id']);
            $table->dropIndex(['workflow_step_id']);
        });

        Schema::table('t_contracts', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->string('contract_type')->nullable();
        });

        // Not recreating legacy tables in down() as they shouldn't have been used.
    }
};
