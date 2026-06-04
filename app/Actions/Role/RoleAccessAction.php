<?php

namespace App\Actions\Role;

use App\Models\AccessModule;
use App\Models\Module;
use App\Models\Role;
use App\Models\RoleModuleGroup;
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

                $existingAccess = AccessModule::where('role_id', $role->id)
                    ->where('module_id', $accessData['module_id'])
                    ->first();

                // Auto-assign module_group_id if it's new read access and group is empty
                $targetGroupId = $existingAccess?->module_group_id;
                if ($canRead && ! $targetGroupId) {
                    $module = Module::find($accessData['module_id']);
                    $targetGroupId = $module?->module_group_id;
                }

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
                        'module_group_id' => $targetGroupId,
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

            foreach ($groups as $gIdx => $groupData) {
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

            // Deactivate (remove from nav) any modules that are no longer in any group
            AccessModule::where('role_id', $roleId)
                ->whereNotIn('module_id', $activeModuleIds)
                ->update([
                    'can_read' => false,
                    'module_group_id' => null,
                    'sequence' => null,
                ]);
        });
    }
}
