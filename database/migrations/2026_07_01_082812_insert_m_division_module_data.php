<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Skip if module already exists (idempotent)
        if (DB::table('m_modules')->where('identifier', 'divisions')->exists()) {
            return;
        }

        // Resolve module group dynamically — look up by name to avoid hardcoded UUID issues
        $moduleGroupNames = ['Master Data', 'Pengaturan Sistem', 'Lainnya'];
        $moduleGroup = null;
        foreach ($moduleGroupNames as $groupName) {
            $moduleGroup = DB::table('m_module_groups')->where('name', $groupName)->first();
            if ($moduleGroup) {
                break;
            }
        }

        // If no matching group exists yet, create one
        if (! $moduleGroup) {
            $newGroupId = (string) Str::uuid();
            DB::table('m_module_groups')->insert([
                'id' => $newGroupId,
                'name' => 'Master Data',
                'icon' => 'Database',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $moduleGroupId = $newGroupId;
        } else {
            $moduleGroupId = $moduleGroup->id;
        }

        $moduleId = (string) Str::uuid();

        // 1. Insert Module
        DB::table('m_modules')->insert([
            'id' => $moduleId,
            'name' => 'Divisi',
            'identifier' => 'divisions',
            'module_group_id' => $moduleGroupId,
            'icon' => 'Layers',
            'route' => '/admin/core/divisions',
            'showed_as_menu' => true,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 2. Grant Access to Admin and Super Admin roles (looked up by name to avoid hardcoded UUID issues)
        $roleNames = ['Admin', 'Super Admin'];
        $roles = DB::table('m_roles')->whereIn('name', $roleNames)->pluck('id');

        foreach ($roles as $roleId) {
            DB::table('m_access_modules')->insert([
                'id' => (string) Str::uuid(),
                'role_id' => $roleId,
                'module_id' => $moduleId,
                'module_group_id' => $moduleGroupId,
                'can_read' => true,
                'can_create' => true,
                'can_update' => true,
                'can_delete' => true,
                'can_approve' => false,
                'can_bulk_approve' => false,
                'can_bulk_delete' => true,
                'sequence' => 10,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $module = DB::table('m_modules')->where('identifier', 'divisions')->first();
        if ($module) {
            DB::table('m_access_modules')->where('module_id', $module->id)->delete();
            DB::table('m_modules')->where('id', $module->id)->delete();
        }
    }
};
