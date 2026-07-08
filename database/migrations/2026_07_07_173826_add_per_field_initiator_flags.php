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
        Schema::table('m_workflow_step_authorities', function (Blueprint $table) {
            $table->boolean('role_use_initiator')->default(false);
            $table->boolean('department_use_initiator')->default(false);
            $table->boolean('division_use_initiator')->default(false);
            $table->boolean('company_group_use_initiator')->default(false);
            $table->boolean('region_use_initiator')->default(false);
        });

        Schema::table('m_workflow_initiator_authorities', function (Blueprint $table) {
            $table->boolean('role_use_initiator')->default(false);
            $table->boolean('department_use_initiator')->default(false);
            $table->boolean('division_use_initiator')->default(false);
            $table->boolean('company_group_use_initiator')->default(false);
            $table->boolean('region_use_initiator')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_workflow_step_authorities', function (Blueprint $table) {
            $table->dropColumn([
                'role_use_initiator',
                'department_use_initiator',
                'division_use_initiator',
                'company_group_use_initiator',
                'region_use_initiator',
            ]);
        });

        Schema::table('m_workflow_initiator_authorities', function (Blueprint $table) {
            $table->dropColumn([
                'role_use_initiator',
                'department_use_initiator',
                'division_use_initiator',
                'company_group_use_initiator',
                'region_use_initiator',
            ]);
        });
    }
};
