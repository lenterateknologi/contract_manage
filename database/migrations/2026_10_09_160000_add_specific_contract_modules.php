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

        $modulesToEnsure = [
            [
                'name' => 'Sedang Diproses',
                'identifier' => 'MY_CTC_IN_PROGRESS',
                'route' => '/contracts/mine?parent_tab=in_progress',
                'icon' => 'GitBranch',
                'description' => 'Pengajuan yang sedang dalam proses',
            ],
            [
                'name' => 'Draft Pengajuan',
                'identifier' => 'MY_CTC_DRAFT',
                'route' => '/contracts/mine?status=draft',
                'icon' => 'FileEdit',
                'description' => 'Draft pengajuan yang belum diajukan',
            ],
        ];

        foreach ($modulesToEnsure as $mod) {
            $existing = DB::table('m_modules')->where('route', $mod['route'])->first();
            if (! $existing) {
                $modId = (string) Str::uuid();
                DB::table('m_modules')->insert([
                    'id' => $modId,
                    'name' => $mod['name'],
                    'identifier' => $mod['identifier'],
                    'module_group_id' => $berandaGroup->id,
                    'icon' => $mod['icon'],
                    'route' => $mod['route'],
                    'showed_as_menu' => true,
                    'is_active' => true,
                    'description' => $mod['description'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // Ensure access modules exist for all roles
        $allModules = DB::table('m_modules')->where('module_group_id', $berandaGroup->id)->get();
        $roles = DB::table('m_roles')->whereNull('deleted_at')->get();

        foreach ($allModules as $module) {
            foreach ($roles as $role) {
                $exists = DB::table('m_access_modules')
                    ->where('role_id', $role->id)
                    ->where('module_id', $module->id)
                    ->exists();

                if (! $exists) {
                    DB::table('m_access_modules')->insert([
                        'id' => (string) Str::uuid(),
                        'role_id' => $role->id,
                        'module_id' => $module->id,
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
        }

        // Configure role "Staff (legal)"
        $staffLegalRole = DB::table('m_roles')->where('name', 'Staff (legal)')->first();
        if ($staffLegalRole) {
            $routesOrder = [
                '/admin/contracts/activity' => 1,
                '/contracts/pending' => 2,
                '/contracts/duty' => 3,
                '/contracts/mine?parent_tab=in_progress' => 4,
                '/contracts/mine?status=draft' => 5,
                '/dashboard/beban-kerja' => 6,
            ];

            foreach ($routesOrder as $route => $seq) {
                $mod = DB::table('m_modules')->where('route', $route)->first();
                if ($mod) {
                    DB::table('m_access_modules')
                        ->where('role_id', $staffLegalRole->id)
                        ->where('module_id', $mod->id)
                        ->update([
                            'can_read' => true,
                            'module_group_id' => $berandaGroup->id,
                            'sequence' => $seq,
                        ]);
                }
            }
        }

        Cache::flush();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $routes = [
            '/contracts/mine?parent_tab=in_progress',
            '/contracts/mine?status=draft',
        ];

        $moduleIds = DB::table('m_modules')->whereIn('route', $routes)->pluck('id');
        DB::table('m_access_modules')->whereIn('module_id', $moduleIds)->delete();
        DB::table('m_modules')->whereIn('id', $moduleIds)->delete();

        Cache::flush();
    }
};
