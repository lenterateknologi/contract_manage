<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $role = DB::table('m_roles')->where('name', 'Staff (legal)')->first();
        if (! $role) {
            return;
        }

        $berandaGroup = DB::table('m_module_groups')->where('name', 'Beranda')->first();
        if (! $berandaGroup) {
            return;
        }

        // Set all existing Beranda modules for Staff (legal) to can_read = false
        DB::table('m_access_modules')
            ->where('role_id', $role->id)
            ->where('module_group_id', $berandaGroup->id)
            ->update(['can_read' => false]);

        // Enable only 2 sub-sidebar modules: Aktivitas Pengajuan and Beban Kerja
        $activityModule = DB::table('m_modules')->where('route', '/contracts/activity')->first();
        $workloadModule = DB::table('m_modules')->where('route', '/dashboard/beban-kerja')->first();

        if ($activityModule) {
            DB::table('m_access_modules')
                ->where('role_id', $role->id)
                ->where('module_id', $activityModule->id)
                ->update(['can_read' => true, 'sequence' => 1]);
        }

        if ($workloadModule) {
            DB::table('m_access_modules')
                ->where('role_id', $role->id)
                ->where('module_id', $workloadModule->id)
                ->update(['can_read' => true, 'sequence' => 2]);
        }

        Cache::flush();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $role = DB::table('m_roles')->where('name', 'Staff (legal)')->first();
        if (! $role) {
            return;
        }

        $berandaGroup = DB::table('m_module_groups')->where('name', 'Beranda')->first();
        if (! $berandaGroup) {
            return;
        }

        // Restore can_read = true for default modules
        DB::table('m_access_modules')
            ->where('role_id', $role->id)
            ->where('module_group_id', $berandaGroup->id)
            ->update(['can_read' => true]);

        Cache::flush();
    }
};
