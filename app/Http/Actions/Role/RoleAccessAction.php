<?php

namespace App\Http\Actions\Role;

use App\Models\Master\AccessModule;
use App\Models\Master\Module;
use App\Models\Master\ModuleGroup;
use App\Models\Master\Role;
use App\Models\Master\RoleModuleGroup;
use Illuminate\Support\Facades\DB;

class RoleAccessAction
{
    /**
     * Update access matrix for a role.
     */
    public function updateRoleAccess(Role $role, array $accesses): void
    {
        DB::transaction(function () use ($role, $accesses) {
            foreach ($accesses as $accessData) {
                // Logic: If any permission is true, can_read MUST be true
                $canRead = $accessData['can_read'] ||
                           $accessData['can_create'] ||
                           $accessData['can_update'] ||
                           $accessData['can_delete'] ||
                           ($accessData['can_approve'] ?? false) ||
                           ($accessData['can_bulk_approve'] ?? false) ||
                           ($accessData['can_bulk_delete'] ?? false);

                AccessModule::updateOrCreate(
                    [
                        'role_id' => $role->id,
                        'module_id' => $accessData['module_id'],
                    ],
                    [
                        'can_read' => $canRead,
                        'can_create' => $accessData['can_create'],
                        'can_update' => $accessData['can_update'],
                        'can_delete' => $accessData['can_delete'],
                        'can_approve' => $accessData['can_approve'] ?? false,
                        'can_bulk_approve' => $accessData['can_bulk_approve'] ?? false,
                        'can_bulk_delete' => $accessData['can_bulk_delete'] ?? false,
                    ],
                );
            }
        });
    }

    /**
     * Reorder role navigation structure.
     */
    public function reorderRoleNavigation(Role $role, array $groups): void
    {
        DB::transaction(function () use ($role, $groups) {
            $roleId = $role->id;
            $activeModuleIds = [];
            $activeGroupIds = [];

            foreach ($groups as $gIdx => $groupData) {
                $activeGroupIds[] = $groupData['id'];

                // Ensure group exists for this role with the updated sequence
                RoleModuleGroup::updateOrCreate(
                    [
                        'role_id' => $roleId,
                        'module_group_id' => $groupData['id'],
                    ],
                    [
                        'sequence' => $gIdx + 1,
                    ],
                );

                if (! empty($groupData['modules'])) {
                    foreach ($groupData['modules'] as $mIdx => $moduleData) {
                        $activeModuleIds[] = $moduleData['id'];

                        AccessModule::updateOrCreate(
                            [
                                'role_id' => $roleId,
                                'module_id' => $moduleData['id'],
                            ],
                            [
                                'can_read' => true,
                                'module_group_id' => $groupData['id'],
                                'sequence' => $mIdx + 1,
                            ],
                        );
                    }
                }
            }

            // Remove groups that are no longer part of this role's navigation
            RoleModuleGroup::where('role_id', $roleId)
                ->whereNotIn('module_group_id', $activeGroupIds)
                ->delete();

            // Clear module_group_id and sequence for modules that are no longer in any navigation group for this role
            AccessModule::where('role_id', $roleId)
                ->whereNotIn('module_id', $activeModuleIds)
                ->update([
                    'module_group_id' => null,
                    'sequence' => null,
                ]);
        });
    }

    /**
     * Get role configuration data including modules matrix, navigation structure, and list of roles.
     */
    public function getRoleConfigData(Role $role): array
    {
        // 1. Get All Active Modules with Role Access for the Matrix Tab
        $modules = Module::where('is_active', true)
            ->with(['moduleGroup', 'accessModules' => function ($query) use ($role) {
                $query->where('role_id', $role->id);
            }])
            ->orderBy('module_group_id')
            ->orderBy('name')
            ->get();

        $modules->transform(function ($module) {
            $module->access = $module->accessModules->first();
            unset($module->accessModules);

            return $module;
        });

        // 2. Get Navigation Structure for the Drag & Drop Tab
        $groups = ModuleGroup::select('m_module_groups.*')
            ->join('m_role_module_groups', function ($join) use ($role) {
                $join->on('m_module_groups.id', '=', 'm_role_module_groups.module_group_id')
                    ->where('m_role_module_groups.role_id', '=', $role->id);
            })
            ->orderBy('m_role_module_groups.sequence', 'asc')
            ->get()
            ->map(function ($group) use ($role) {
                $group->modules = Module::select('m_modules.*')
                    ->join('m_access_modules', 'm_modules.id', '=', 'm_access_modules.module_id')
                    ->where('m_access_modules.role_id', $role->id)
                    ->where('m_access_modules.module_group_id', $group->id)
                    ->where('m_access_modules.can_read', true)
                    ->orderByRaw('COALESCE(m_access_modules.sequence, 9999) ASC')
                    ->orderBy('m_modules.name')
                    ->get();

                return $group;
            })
            ->filter(fn ($group) => $group->modules->isNotEmpty())
            ->values();

        $allModules = Module::where('is_active', true)->with('moduleGroup')->orderBy('name')->get();
        $allRoles = Role::orderBy('name')->get();

        return [
            'role' => $role,
            'roles' => $allRoles,
            'modules' => $modules,
            'navigation' => $groups,
            'allModules' => $allModules,
        ];
    }
}
