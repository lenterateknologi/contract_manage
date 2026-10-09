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
        $berandaGroup = DB::table('m_module_groups')->where('name', 'Beranda')->first();
        if (! $berandaGroup) {
            return;
        }

        // 1. Create or get /admin/contracts/activity module
        $adminActivityModule = DB::table('m_modules')
            ->where('route', '/admin/contracts/activity')
            ->first();

        if (! $adminActivityModule) {
            $moduleId = (string) Str::uuid();
            DB::table('m_modules')->insert([
                'id' => $moduleId,
                'name' => 'Aktivitas Pengajuan',
                'identifier' => 'ADMIN_CONTRACTS_ACTIVITY',
                'module_group_id' => $berandaGroup->id,
                'icon' => 'Layers',
                'route' => '/admin/contracts/activity',
                'showed_as_menu' => true,
                'is_active' => true,
                'description' => 'Ringkasan aktivitas pengajuan dan penugasan PIC untuk tim legal/admin',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $adminActivityModule = DB::table('m_modules')->where('id', $moduleId)->first();
        }

        // 2. Assign access for all roles with default can_read = false
        $roles = DB::table('m_roles')->whereNull('deleted_at')->get();
        foreach ($roles as $role) {
            $existing = DB::table('m_access_modules')
                ->where('role_id', $role->id)
                ->where('module_id', $adminActivityModule->id)
                ->first();

            if (! $existing) {
                DB::table('m_access_modules')->insert([
                    'id' => (string) Str::uuid(),
                    'role_id' => $role->id,
                    'module_id' => $adminActivityModule->id,
                    'module_group_id' => $berandaGroup->id,
                    'can_read' => false,
                    'can_create' => true,
                    'can_update' => true,
                    'can_delete' => true,
                    'can_approve' => true,
                    'can_bulk_approve' => true,
                    'can_bulk_delete' => true,
                    'sequence' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // 3. Configure for role "Staff (legal)": Set sequence 1 to /admin/contracts/activity and disable /contracts/activity
        $staffLegalRole = DB::table('m_roles')->where('name', 'Staff (legal)')->first();
        if ($staffLegalRole) {
            // Enable /admin/contracts/activity as sequence 1
            DB::table('m_access_modules')
                ->where('role_id', $staffLegalRole->id)
                ->where('module_id', $adminActivityModule->id)
                ->update(['can_read' => true, 'sequence' => 1]);

            // Disable standard staff /contracts/activity for Staff (legal)
            $standardActivityModule = DB::table('m_modules')->where('route', '/contracts/activity')->first();
            if ($standardActivityModule) {
                DB::table('m_access_modules')
                    ->where('role_id', $staffLegalRole->id)
                    ->where('module_id', $standardActivityModule->id)
                    ->update(['can_read' => false]);
            }
        }

        Cache::flush();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $adminActivityModule = DB::table('m_modules')
            ->where('route', '/admin/contracts/activity')
            ->first();

        if ($adminActivityModule) {
            DB::table('m_access_modules')->where('module_id', $adminActivityModule->id)->delete();
            DB::table('m_modules')->where('id', $adminActivityModule->id)->delete();
        }

        Cache::flush();
    }
};
