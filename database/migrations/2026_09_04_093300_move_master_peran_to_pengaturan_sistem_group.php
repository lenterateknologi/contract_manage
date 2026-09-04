<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $pengaturanGroupId = DB::table('m_module_groups')
            ->where('name', 'ilike', '%Pengaturan%')
            ->value('id');

        if ($pengaturanGroupId) {
            // Update module group for Master Peran (ADMIN_ROLES)
            DB::table('m_modules')
                ->where('identifier', 'ADMIN_ROLES')
                ->orWhere('route', '/admin/core/roles')
                ->update(['module_group_id' => $pengaturanGroupId]);

            // Update in m_access_modules as well
            $roleModuleId = DB::table('m_modules')
                ->where('identifier', 'ADMIN_ROLES')
                ->orWhere('route', '/admin/core/roles')
                ->value('id');

            if ($roleModuleId) {
                DB::table('m_access_modules')
                    ->where('module_id', $roleModuleId)
                    ->update(['module_group_id' => $pengaturanGroupId]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $masterDataGroupId = DB::table('m_module_groups')
            ->where('name', 'Master Data')
            ->value('id');

        if ($masterDataGroupId) {
            DB::table('m_modules')
                ->where('identifier', 'ADMIN_ROLES')
                ->orWhere('route', '/admin/core/roles')
                ->update(['module_group_id' => $masterDataGroupId]);

            $roleModuleId = DB::table('m_modules')
                ->where('identifier', 'ADMIN_ROLES')
                ->orWhere('route', '/admin/core/roles')
                ->value('id');

            if ($roleModuleId) {
                DB::table('m_access_modules')
                    ->where('module_id', $roleModuleId)
                    ->update(['module_group_id' => $masterDataGroupId]);
            }
        }
    }
};
