<?php

use App\Models\Division;
use App\Models\Role;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $staffRole = Role::where('name', 'Staff')->first();
        $astManagerRole = Role::where('name', 'Ast Manager')->first();
        $managerRole = Role::where('name', 'Manager')->first();

        $staffLegalRole = Role::where('name', 'Staff Legal')->first();
        $astManagerLegalRole = Role::where('name', 'Ast Manager Legal')->first();
        $managerLegalRole = Role::where('name', 'Manager Legal')->first();

        $legalDivision = Division::where('name', 'Legal')->orWhere('code', 'lga')->first();
        $legalDivId = $legalDivision?->id;

        $roleMapping = array_filter([
            $staffLegalRole?->id => $staffRole?->id,
            $astManagerLegalRole?->id => $astManagerRole?->id,
            $managerLegalRole?->id => $managerRole?->id,
        ]);

        $legalRoleIds = array_keys($roleMapping);

        if (! empty($legalRoleIds)) {
            // 1. Reassign users to base generic roles & ensure division is Legal if null
            foreach ($roleMapping as $oldRoleId => $newRoleId) {
                if ($newRoleId) {
                    DB::table('m_users')
                        ->where('role_id', $oldRoleId)
                        ->update([
                            'role_id' => $newRoleId,
                            'division_id' => DB::raw("COALESCE(division_id, '{$legalDivId}')"),
                            'updated_at' => now(),
                        ]);
                }
            }

            // 2. Update workflow step authorities (attach legal division if missing)
            foreach ($roleMapping as $oldRoleId => $newRoleId) {
                if ($newRoleId) {
                    DB::table('m_workflow_step_authorities')
                        ->where('role_id', $oldRoleId)
                        ->update([
                            'role_id' => $newRoleId,
                            'division_id' => DB::raw("COALESCE(division_id, " . ($legalDivId ? "'{$legalDivId}'" : "NULL") . ")"),
                            'updated_at' => now(),
                        ]);

                    DB::table('m_workflow_initiator_authorities')
                        ->where('role_id', $oldRoleId)
                        ->update([
                            'role_id' => $newRoleId,
                            'division_id' => DB::raw("COALESCE(division_id, " . ($legalDivId ? "'{$legalDivId}'" : "NULL") . ")"),
                            'updated_at' => now(),
                        ]);
                }
            }

            // 3. Update direct role_id on workflow steps
            foreach ($roleMapping as $oldRoleId => $newRoleId) {
                if ($newRoleId) {
                    DB::table('m_workflow_steps')
                        ->where('role_id', $oldRoleId)
                        ->update([
                            'role_id' => $newRoleId,
                            'updated_at' => now(),
                        ]);
                }
            }

            // 4. Clean up access modules and module groups
            DB::table('m_access_modules')->whereIn('role_id', $legalRoleIds)->delete();
            DB::table('m_role_module_groups')->whereIn('role_id', $legalRoleIds)->delete();

            // 5. Force delete the Legal specific roles
            DB::table('m_roles')->whereIn('id', $legalRoleIds)->delete();
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Re-creating the roles if rolled back
        $legalRoles = [
            ['name' => 'Staff Legal', 'description' => 'Staff Divisi Legal'],
            ['name' => 'Ast Manager Legal', 'description' => 'Assistant Manager Divisi Legal'],
            ['name' => 'Manager Legal', 'description' => 'Manager Divisi Legal'],
        ];

        foreach ($legalRoles as $r) {
            Role::firstOrCreate(['name' => $r['name']], ['description' => $r['description']]);
        }
    }
};
