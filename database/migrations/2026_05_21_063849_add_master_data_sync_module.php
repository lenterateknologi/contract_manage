<?php

use App\Models\AccessModule;
use App\Models\Module;
use App\Models\ModuleGroup;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $group = ModuleGroup::firstWhere('name', 'Sistem & Laporan');
        if (! $group) {
            return;
        }

        $admin = User::firstWhere('email', 'admin@example.com') ?? User::first();
        $adminId = $admin ? $admin->id : null;

        $module = Module::updateOrCreate(
            ['identifier' => 'ADMIN_MASTER_DATA'],
            [
                'name' => 'Ekspor Impor Master',
                'route' => '/admin/master-data-sync',
                'icon' => 'RefreshCw',
                'module_group_id' => $group->id,
                'created_by' => $adminId,
                'updated_by' => $adminId,
            ],
        );

        $adminRole = Role::firstWhere('name', 'Admin');
        if ($adminRole) {
            AccessModule::updateOrCreate(
                [
                    'role_id' => $adminRole->id,
                    'module_id' => $module->id,
                ],
                [
                    'module_group_id' => $group->id,
                    'can_read' => true,
                    'can_create' => true,
                    'can_update' => true,
                    'can_delete' => true,
                    'can_approve' => true,
                ],
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $module = Module::firstWhere('identifier', 'ADMIN_MASTER_DATA');
        if ($module) {
            AccessModule::where('module_id', $module->id)->delete();
            $module->forceDelete();
        }
    }
};
