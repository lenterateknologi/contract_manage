<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::table('m_modules')->where('identifier', 'dashboard_types')->exists()) {
            return;
        }

        $moduleGroup = DB::table('m_module_groups')->whereIn('name', ['Pengaturan Sistem', 'Master Data', 'Lainnya'])->first();
        $moduleGroupId = $moduleGroup ? $moduleGroup->id : null;

        if (! $moduleGroupId) {
            $moduleGroupId = (string) Str::uuid();
            DB::table('m_module_groups')->insert([
                'id' => $moduleGroupId,
                'name' => 'Pengaturan Sistem',
                'icon' => 'Settings2',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $moduleId = (string) Str::uuid();

        DB::table('m_modules')->insert([
            'id' => $moduleId,
            'name' => 'Tipe Dashboard',
            'identifier' => 'dashboard_types',
            'module_group_id' => $moduleGroupId,
            'icon' => 'LayoutDashboard',
            'route' => '/admin/core/dashboard-types',
            'showed_as_menu' => true,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $roles = DB::table('m_roles')->whereIn('name', ['Admin', 'Super Admin'])->pluck('id');

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
                'sequence' => 13,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        $module = DB::table('m_modules')->where('identifier', 'dashboard_types')->first();
        if ($module) {
            DB::table('m_access_modules')->where('module_id', $module->id)->delete();
            DB::table('m_modules')->where('id', $module->id)->delete();
        }
    }
};
