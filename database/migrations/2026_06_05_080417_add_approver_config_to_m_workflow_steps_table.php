<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('m_workflow_steps', 'approver_config')) {
            Schema::table('m_workflow_steps', function (Blueprint $table) {
                $table->json('approver_config')->nullable()->after('meta');
            });
        }

        // Migrate existing step configuration into JSON
        DB::table('m_workflow_steps')->orderBy('id')->chunk(100, function ($steps) {
            foreach ($steps as $step) {
                $config = [
                    'custom' => [],
                    'roles' => [],
                    'departments' => [],
                    'users' => [],
                ];

                $approverType = $step->approver_type;

                if ($approverType === 'initiator') {
                    $config['custom'][] = 'initiator';
                } elseif ($approverType === 'atasan') {
                    $config['custom'][] = 'atasan';
                } elseif ($approverType === 'assigned_pic') {
                    $config['custom'][] = 'assigned_pic';
                } elseif ($approverType === 'role') {
                    // Get associated roles from m_workflow_step_roles
                    $roles = DB::table('m_workflow_step_roles')
                        ->where('workflow_step_id', $step->id)
                        ->pluck('role_name')
                        ->toArray();
                    $config['roles'] = $roles;

                    // Get associated departments from m_workflow_step_departments
                    $depts = DB::table('m_workflow_step_departments')
                        ->where('workflow_step_id', $step->id)
                        ->pluck('department_id')
                        ->toArray();
                    $config['departments'] = $depts;
                } elseif ($approverType === 'user') {
                    // Get associated users from m_workflow_step_users
                    $users = DB::table('m_workflow_step_users')
                        ->where('workflow_step_id', $step->id)
                        ->pluck('user_id')
                        ->toArray();
                    $config['users'] = $users;
                }

                DB::table('m_workflow_steps')
                    ->where('id', $step->id)
                    ->update(['approver_config' => json_encode($config)]);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('m_workflow_steps', 'approver_config')) {
            Schema::table('m_workflow_steps', function (Blueprint $table) {
                $table->dropColumn('approver_config');
            });
        }
    }
};
