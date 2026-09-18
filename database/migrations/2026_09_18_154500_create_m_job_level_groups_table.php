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
        // 1. Create m_job_level_groups table
        if (! Schema::hasTable('m_job_level_groups')) {
            Schema::create('m_job_level_groups', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->bigInteger('idjoblevelgroup')->nullable()->index();
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

        // 2. Add job_level_group_id to m_job_levels if it doesn't exist
        if (Schema::hasTable('m_job_levels') && ! Schema::hasColumn('m_job_levels', 'job_level_group_id')) {
            Schema::table('m_job_levels', function (Blueprint $table) {
                $table->foreignUuid('job_level_group_id')->nullable()->after('id_job_level_group')->constrained('m_job_level_groups')->nullOnDelete();
            });
        }

        // 3. Register module in m_modules and grant access to roles
        $portalGroup = DB::table('m_module_groups')->where('name', 'Portal')->first();
        $groupId = $portalGroup?->id;

        if (! $groupId) {
            $masterGroup = DB::table('m_module_groups')->where('name', 'Master Data')->first();
            $groupId = $masterGroup?->id;
        }

        $module = [
            'identifier' => 'ADMIN_JOB_LEVEL_GROUPS',
            'name' => 'Master Group Job Level',
            'route' => '/admin/core/job-level-groups',
            'icon' => 'Layers',
            'description' => 'Master data group level jabatan terintegrasi dengan Portal',
        ];

        $existingModule = DB::table('m_modules')->where('identifier', $module['identifier'])->first();
        if (! $existingModule) {
            $newModuleId = (string) Str::uuid();
            DB::table('m_modules')->insert([
                'id' => $newModuleId,
                'name' => $module['name'],
                'identifier' => $module['identifier'],
                'module_group_id' => $groupId,
                'icon' => $module['icon'],
                'route' => $module['route'],
                'description' => $module['description'],
                'showed_as_menu' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $roles = DB::table('m_roles')->get();
            foreach ($roles as $role) {
                DB::table('m_access_modules')->insert([
                    'id' => (string) Str::uuid(),
                    'role_id' => $role->id,
                    'module_id' => $newModuleId,
                    'can_read' => true,
                    'can_create' => in_array($role->name, ['Super Administrator', 'Admin', 'Legal Admin']),
                    'can_update' => in_array($role->name, ['Super Administrator', 'Admin', 'Legal Admin']),
                    'can_delete' => in_array($role->name, ['Super Administrator', 'Admin', 'Legal Admin']),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('m_job_levels') && Schema::hasColumn('m_job_levels', 'job_level_group_id')) {
            Schema::table('m_job_levels', function (Blueprint $table) {
                $table->dropForeign(['job_level_group_id']);
                $table->dropColumn('job_level_group_id');
            });
        }

        $mod = DB::table('m_modules')->where('identifier', 'ADMIN_JOB_LEVEL_GROUPS')->first();
        if ($mod) {
            DB::table('m_access_modules')->where('module_id', $mod->id)->delete();
            DB::table('m_modules')->where('id', $mod->id)->delete();
        }

        Schema::dropIfExists('m_job_level_groups');
    }
};
