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
        $groupId = '4a1357c0-e045-4273-838b-cbaa319bdbaa'; // Pengaturan Sistem
        $moduleId = '0e60bff7-2338-4bd5-bd7d-1730833917f0'; // Master Job Level

        $moduleExists = DB::table('m_modules')->where('id', $moduleId)->exists();
        if ($moduleExists) {
            DB::table('m_modules')
                ->where('id', $moduleId)
                ->update([
                    'module_group_id' => $groupId,
                    'showed_as_menu' => true,
                    'is_active' => true,
                    'updated_at' => now(),
                ]);
        }

        $adminRoles = [
            '8c2515e8-d267-4d90-8fc4-4db970c1aa94', // Admin
            '08d9714f-1f29-4ed0-ad01-eac28fac1758', // Super Admin
        ];

        if ($moduleExists) {
            foreach ($adminRoles as $roleId) {
                if (! DB::table('m_roles')->where('id', $roleId)->exists()) {
                    continue;
                }

                $existing = DB::table('m_access_modules')
                    ->where('role_id', $roleId)
                    ->where('module_id', $moduleId)
                    ->first();

                if ($existing) {
                    DB::table('m_access_modules')
                        ->where('id', $existing->id)
                        ->update([
                            'module_group_id' => $groupId,
                            'can_read' => true,
                            'can_create' => true,
                            'can_update' => true,
                            'can_delete' => true,
                            'can_approve' => true,
                            'can_bulk_approve' => true,
                            'can_bulk_delete' => true,
                            'updated_at' => now(),
                        ]);
                } else {
                    DB::table('m_access_modules')->insert([
                        'id' => (string) Str::uuid(),
                        'role_id' => $roleId,
                        'module_id' => $moduleId,
                        'module_group_id' => $groupId,
                        'can_read' => true,
                        'can_create' => true,
                        'can_update' => true,
                        'can_delete' => true,
                        'can_approve' => true,
                        'can_bulk_approve' => true,
                        'can_bulk_delete' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $portalGroupId = 'f4df5da1-f3e8-40a0-ac34-13921a6256f0'; // Portal
        $moduleId = '0e60bff7-2338-4bd5-bd7d-1730833917f0'; // Master Job Level

        DB::table('m_modules')
            ->where('id', $moduleId)
            ->update([
                'module_group_id' => $portalGroupId,
                'updated_at' => now(),
            ]);
    }
};
