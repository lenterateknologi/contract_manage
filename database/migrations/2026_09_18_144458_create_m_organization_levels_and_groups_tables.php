<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create m_organization_levels table
        if (! Schema::hasTable('m_organization_levels')) {
            Schema::create('m_organization_levels', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->bigInteger('idorg_level')->nullable()->index();
                $table->string('code', 50)->index();
                $table->string('name', 255);
                $table->string('created_by_name')->nullable();
                $table->string('modified_by_name')->nullable();
                $table->timestamp('portal_created_date')->nullable();
                $table->timestamp('portal_modified_date')->nullable();
                $table->boolean('is_used')->default(false)->index();
                $table->boolean('is_active')->default(true)->index();
                $table->uuid('created_by')->nullable();
                $table->uuid('updated_by')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        // 2. Create m_organization_groups table
        if (! Schema::hasTable('m_organization_groups')) {
            Schema::create('m_organization_groups', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->bigInteger('idorg_group')->nullable()->index();
                $table->string('code', 50)->index();
                $table->string('name', 255);
                $table->string('oracle_code', 50)->nullable()->index();
                $table->string('created_by_name')->nullable();
                $table->string('modified_by_name')->nullable();
                $table->timestamp('portal_created_date')->nullable();
                $table->timestamp('portal_modified_date')->nullable();
                $table->boolean('is_used')->default(false)->index();
                $table->boolean('is_active')->default(true)->index();
                $table->uuid('created_by')->nullable();
                $table->uuid('updated_by')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        // 3. Register modules in m_modules and grant access to roles
        $portalGroup = DB::table('m_module_groups')->where('name', 'Portal')->first();
        $groupId = $portalGroup?->id;

        if (! $groupId) {
            $masterGroup = DB::table('m_module_groups')->where('name', 'Master Data')->first();
            $groupId = $masterGroup?->id;
        }

        $modulesToCreate = [
            [
                'identifier' => 'ADMIN_ORGANIZATION_LEVELS',
                'name' => 'Master Level Organisasi',
                'route' => '/admin/core/organization-levels',
                'icon' => 'GitBranch',
                'description' => 'Master data level hierarki organisasi terintegrasi dengan Portal',
            ],
            [
                'identifier' => 'ADMIN_ORGANIZATION_GROUPS',
                'name' => 'Master Group Organisasi',
                'route' => '/admin/core/organization-groups',
                'icon' => 'FolderClosed',
                'description' => 'Master data group fungsi organisasi terintegrasi dengan Portal',
            ],
        ];

        $roles = DB::table('m_roles')->get();

        foreach ($modulesToCreate as $mod) {
            $existingModule = DB::table('m_modules')->where('identifier', $mod['identifier'])->first();
            if (! $existingModule) {
                $newModuleId = (string) Str::uuid();
                DB::table('m_modules')->insert([
                    'id' => $newModuleId,
                    'name' => $mod['name'],
                    'identifier' => $mod['identifier'],
                    'module_group_id' => $groupId,
                    'icon' => $mod['icon'],
                    'route' => $mod['route'],
                    'description' => $mod['description'],
                    'showed_as_menu' => true,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $moduleId = $newModuleId;
            } else {
                $moduleId = $existingModule->id;
                DB::table('m_modules')->where('id', $moduleId)->update([
                    'name' => $mod['name'],
                    'route' => $mod['route'],
                    'module_group_id' => $groupId,
                    'showed_as_menu' => true,
                    'is_active' => true,
                    'updated_at' => now(),
                ]);
            }

            // Grant permission to all existing roles so admin & users have access
            foreach ($roles as $role) {
                $hasAccess = DB::table('m_access_modules')
                    ->where('role_id', $role->id)
                    ->where('module_id', $moduleId)
                    ->exists();

                if (! $hasAccess) {
                    DB::table('m_access_modules')->insert([
                        'id' => (string) Str::uuid(),
                        'role_id' => $role->id,
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
        $moduleIds = DB::table('m_modules')
            ->whereIn('identifier', ['ADMIN_ORGANIZATION_LEVELS', 'ADMIN_ORGANIZATION_GROUPS'])
            ->pluck('id');

        DB::table('m_access_modules')->whereIn('module_id', $moduleIds)->delete();
        DB::table('m_modules')->whereIn('id', $moduleIds)->delete();

        Schema::dropIfExists('m_organization_groups');
        Schema::dropIfExists('m_organization_levels');
    }
};
