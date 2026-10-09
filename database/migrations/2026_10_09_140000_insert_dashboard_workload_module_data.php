<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;
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
        if (DB::table('m_modules')->where('identifier', 'DASHBOARD_WORKLOAD')->orWhere('route', '/dashboard/beban-kerja')->exists()) {
            return;
        }

        // 1. Resolve Beranda module group
        $moduleGroup = DB::table('m_module_groups')->where('name', 'Beranda')->first();
        if (! $moduleGroup) {
            $newGroupId = (string) Str::uuid();
            DB::table('m_module_groups')->insert([
                'id' => $newGroupId,
                'name' => 'Beranda',
                'icon' => 'LayoutDashboard',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $moduleGroupId = $newGroupId;
        } else {
            $moduleGroupId = $moduleGroup->id;
        }

        $moduleId = (string) Str::uuid();

        // 2. Insert Module
        DB::table('m_modules')->insert([
            'id' => $moduleId,
            'name' => 'Beban Kerja',
            'identifier' => 'DASHBOARD_WORKLOAD',
            'module_group_id' => $moduleGroupId,
            'icon' => 'Briefcase',
            'route' => '/dashboard/beban-kerja',
            'showed_as_menu' => true,
            'is_active' => true,
            'description' => 'Statistik dan ringkasan beban kerja tim',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 3. Grant Access to all existing roles
        $roles = DB::table('m_roles')->pluck('id');
        $accessInserts = [];
        foreach ($roles as $roleId) {
            $accessInserts[] = [
                'id' => (string) Str::uuid(),
                'role_id' => $roleId,
                'module_id' => $moduleId,
                'module_group_id' => $moduleGroupId,
                'can_read' => true,
                'can_create' => false,
                'can_update' => false,
                'can_delete' => false,
                'can_approve' => false,
                'can_bulk_approve' => false,
                'can_bulk_delete' => false,
                'sequence' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (! empty($accessInserts)) {
            DB::table('m_access_modules')->insert($accessInserts);
        }

        // Flush cache so changes take effect immediately
        Cache::flush();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $module = DB::table('m_modules')
            ->where('identifier', 'DASHBOARD_WORKLOAD')
            ->orWhere('route', '/dashboard/beban-kerja')
            ->first();

        if ($module) {
            DB::table('m_access_modules')->where('module_id', $module->id)->delete();
            DB::table('m_modules')->where('id', $module->id)->delete();
        }

        Cache::flush();
    }
};
