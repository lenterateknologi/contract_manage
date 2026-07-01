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
        $moduleId = (string) Str::uuid();
        $moduleGroupId = '39703089-6c1d-4753-88ca-1123b52a7a48'; // Master Data group ID

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

        // 2. Grant Access to Admin (4ee99cd1-be94-4122-840f-1dec172b4296) and Super Admin (f0cbb5b2-6828-4ea3-9f86-ea53c6f2a5dd)
        $rolesToGrant = [
            '4ee99cd1-be94-4122-840f-1dec172b4296', // Admin
            'f0cbb5b2-6828-4ea3-9f86-ea53c6f2a5dd', // Super Admin
        ];

        foreach ($rolesToGrant as $roleId) {
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
