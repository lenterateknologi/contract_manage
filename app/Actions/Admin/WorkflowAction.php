<?php

namespace App\Actions\Admin;

use App\Models\MasterAction;
use App\Models\Workflow;
use App\Models\WorkflowStep;
use App\Models\WorkflowStepAction;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class WorkflowAction
{
    /**
     * Store a newly created workflow in storage.
     */
    public function store(array $data): Workflow
    {
        return DB::transaction(function () use ($data) {
            $workflowData = collect($data)->except(['initiator_roles', 'initiator_users', 'initiator_departments', 'steps'])->toArray();
            $workflow = Workflow::create($workflowData);

            // Sync Initiators
            if (! empty($data['initiator_roles'])) {
                foreach ($data['initiator_roles'] as $role) {
                    $workflow->initiatorRolesData()->create(['role_name' => $role]);
                }
            }
            if (! empty($data['initiator_departments'])) {
                foreach ($data['initiator_departments'] as $deptId) {
                    $resolvedId = $this->resolveDepartmentId($deptId);
                    if ($resolvedId) {
                        $workflow->initiatorDepartmentsData()->create(['department_id' => $resolvedId]);
                    }
                }
            }
            if (! empty($data['initiator_users'])) {
                foreach ($data['initiator_users'] as $userId) {
                    $resolvedId = $this->resolveUserId($userId);
                    if ($resolvedId) {
                        $workflow->initiatorUsersData()->create(['user_id' => $resolvedId]);
                    }
                }
            }

            $stepIdMap = [];
            if (! empty($data['steps'])) {
                foreach ($data['steps'] as $index => $stepData) {
                    $stepClientId = $stepData['id'] ?? "new-{$index}";
                    $step = $workflow->steps()->create([
                        'label' => $stepData['label'] ?? null,
                        'is_mandatory' => $stepData['is_mandatory'] ?? true,
                        'approver_type' => $stepData['approver_type'] ?? 'role',
                        'description' => $stepData['description'] ?? '',
                        'step' => $index + 1,
                        'created_by' => Auth::id(),
                        'updated_by' => Auth::id(),
                        'is_active' => true,
                        'step_category' => $stepData['step_category'] ?? null,
                        'is_optional' => $stepData['is_optional'] ?? false,
                        'optional_label' => $stepData['optional_label'] ?? null,
                        'condition_expression' => $stepData['condition_expression'] ?? null,
                        'phase' => $stepData['phase'] ?? 'f1_request',
                        'uploader_type' => $stepData['uploader_type'] ?? null,
                        'hierarchy_level' => isset($stepData['hierarchy_level']) ? (int) $stepData['hierarchy_level'] : null,
                        'role_id' => $stepData['role_id'] ?? null,
                        'company_group_ids' => $stepData['company_group_ids'] ?? null,
                        'region_ids' => $stepData['region_ids'] ?? null,
                        'company_ids' => $stepData['company_ids'] ?? null,
                        'meta' => $stepData['meta'] ?? null,
                    ]);

                    $stepIdMap[$stepClientId] = $step->id;

                    if (! empty($stepData['role'])) {
                        foreach ((array) $stepData['role'] as $role) {
                            $step->approverRoles()->create(['role_name' => $role]);
                        }
                    }
                    if (! empty($stepData['department_ids'])) {
                        foreach ((array) $stepData['department_ids'] as $deptId) {
                            $resolvedId = $this->resolveDepartmentId($deptId);
                            if ($resolvedId) {
                                $step->approverDepartments()->create(['department_id' => $resolvedId]);
                            }
                        }
                    }
                    if (! empty($stepData['user_ids'])) {
                        foreach ((array) $stepData['user_ids'] as $userId) {
                            $resolvedId = $this->resolveUserId($userId);
                            if ($resolvedId) {
                                $step->approverUsers()->create(['user_id' => $resolvedId]);
                            }
                        }
                    }
                }

                // Second pass to sync step actions
                foreach ($data['steps'] as $index => $stepData) {
                    $stepClientId = $stepData['id'] ?? "new-{$index}";
                    $stepId = $stepIdMap[$stepClientId] ?? null;
                    if ($stepId) {
                        $step = WorkflowStep::find($stepId);
                        if ($step) {
                            $this->syncStepActions($step, $stepData['actions'] ?? [], $stepIdMap);
                        }
                    }
                }
            }

            return $workflow;
        });
    }

    /**
     * Update the specified workflow in storage.
     */
    public function update(Workflow $workflow, array $data): Workflow
    {
        return DB::transaction(function () use ($data, $workflow) {
            // Update basic info
            $workflowData = collect($data)->except(['initiator_roles', 'initiator_users', 'initiator_departments', 'steps'])->toArray();
            $workflow->update($workflowData);

            // Sync Initiators (Role, Dept, User)
            $workflow->initiatorRolesData()->delete();
            if (! empty($data['initiator_roles'])) {
                foreach ((array) $data['initiator_roles'] as $role) {
                    $workflow->initiatorRolesData()->create(['role_name' => $role]);
                }
            }

            $workflow->initiatorDepartmentsData()->delete();
            if (! empty($data['initiator_departments'])) {
                foreach ((array) $data['initiator_departments'] as $deptId) {
                    $resolvedId = $this->resolveDepartmentId($deptId);
                    if ($resolvedId) {
                        $workflow->initiatorDepartmentsData()->create(['department_id' => $resolvedId]);
                    }
                }
            }

            $workflow->initiatorUsersData()->delete();
            if (! empty($data['initiator_users'])) {
                foreach ((array) $data['initiator_users'] as $userId) {
                    $resolvedId = $this->resolveUserId($userId);
                    if ($resolvedId) {
                        $workflow->initiatorUsersData()->create(['user_id' => $resolvedId]);
                    }
                }
            }

            // Sync Workflow Steps (Upsert Logic)
            $existingStepIds = $workflow->steps->pluck('id')->toArray();
            $inputStepIds = collect($data['steps'] ?? [])->pluck('id')->filter(fn ($id) => $id && ! str_starts_with($id, 'new-'))->toArray();

            // Delete steps that are not in the input
            $stepsToDelete = array_diff($existingStepIds, $inputStepIds);
            if (! empty($stepsToDelete)) {
                WorkflowStep::whereIn('id', $stepsToDelete)->forceDelete();
            }

            // Shift existing step numbers to avoid unique constraint violations during reordering
            WorkflowStep::where('workflow_id', $workflow->id)->update([
                'step' => DB::raw('step + 10000'),
            ]);

            $stepIdMap = [];
            if (! empty($data['steps'])) {
                foreach ($data['steps'] as $index => $stepData) {
                    $stepId = $stepData['id'] ?? null;
                    $isNew = ! $stepId || str_starts_with($stepId, 'new-') || ! in_array($stepId, $existingStepIds);

                    $stepFields = [
                        'label' => $stepData['label'] ?? null,
                        'description' => $stepData['description'] ?? '',
                        'is_mandatory' => $stepData['is_mandatory'] ?? true,
                        'step' => $index + 1,
                        'updated_by' => Auth::id(),
                        'is_active' => true,
                        'step_category' => $stepData['step_category'] ?? null,
                        'is_optional' => $stepData['is_optional'] ?? false,
                        'optional_label' => $stepData['optional_label'] ?? null,
                        'condition_expression' => $stepData['condition_expression'] ?? null,
                        'phase' => $stepData['phase'] ?? 'f1_request',
                        'uploader_type' => $stepData['uploader_type'] ?? null,
                        'hierarchy_level' => isset($stepData['hierarchy_level']) ? (int) $stepData['hierarchy_level'] : null,
                        'role_id' => $stepData['role_id'] ?? null,
                        'company_group_ids' => $stepData['company_group_ids'] ?? null,
                        'region_ids' => $stepData['region_ids'] ?? null,
                        'company_ids' => $stepData['company_ids'] ?? null,
                        'meta' => $stepData['meta'] ?? null,
                        'approver_type' => $stepData['approver_type'] ?? 'role',
                    ];

                    if ($isNew) {
                        $stepFields['created_by'] = Auth::id();
                        $step = $workflow->steps()->create($stepFields);
                    } else {
                        $step = WorkflowStep::where('workflow_id', $workflow->id)->findOrFail($stepId);
                        $step->update($stepFields);
                    }

                    $stepClientId = $stepData['id'] ?? "new-{$index}";
                    $stepIdMap[$stepClientId] = $step->id;

                    // Sync Approvers
                    $step->approverRoles()->delete();
                    if (! empty($stepData['role'])) {
                        foreach ((array) $stepData['role'] as $role) {
                            $step->approverRoles()->create(['role_name' => $role]);
                        }
                    }

                    $step->approverDepartments()->delete();
                    if (! empty($stepData['department_ids'])) {
                        foreach ((array) $stepData['department_ids'] as $deptId) {
                            $resolvedId = $this->resolveDepartmentId($deptId);
                            if ($resolvedId) {
                                $step->approverDepartments()->create(['department_id' => $resolvedId]);
                            }
                        }
                    }

                    $step->approverUsers()->delete();
                    if (! empty($stepData['user_ids'])) {
                        foreach ((array) $stepData['user_ids'] as $userId) {
                            $resolvedId = $this->resolveUserId($userId);
                            if ($resolvedId) {
                                $step->approverUsers()->create(['user_id' => $resolvedId]);
                            }
                        }
                    }
                }

                // Second pass to sync step actions
                foreach ($data['steps'] as $index => $stepData) {
                    $stepClientId = $stepData['id'] ?? "new-{$index}";
                    $stepId = $stepIdMap[$stepClientId] ?? null;
                    if ($stepId) {
                        $step = WorkflowStep::find($stepId);
                        if ($step) {
                            $this->syncStepActions($step, $stepData['actions'] ?? [], $stepIdMap);
                        }
                    }
                }
            }

            return $workflow;
        });
    }

    /**
     * Remove the specified workflow from storage.
     */
    public function destroy(Workflow $workflow): ?bool
    {
        return $workflow->delete();
    }

    /**
     * Update the workflow steps only.
     */
    public function updateSteps(Workflow $workflow, array $data): Workflow
    {
        return DB::transaction(function () use ($data, $workflow) {
            // Cleanup existing steps
            foreach ($workflow->steps as $oldStep) {
                $oldStep->approverRoles()->delete();
                $oldStep->approverDepartments()->delete();
                $oldStep->approverUsers()->delete();
                $oldStep->actions()->delete();
            }
            $workflow->steps()->forceDelete();

            $stepIdMap = [];
            if (! empty($data['steps'])) {
                foreach ($data['steps'] as $index => $stepData) {
                    $step = $workflow->steps()->create([
                        'label' => $stepData['label'] ?? null,
                        'is_mandatory' => $stepData['is_mandatory'] ?? true,
                        'approver_type' => $stepData['approver_type'] ?? 'role',
                        'description' => $stepData['description'] ?? '',
                        'step' => $index + 1,
                        'created_by' => Auth::id(),
                        'updated_by' => Auth::id(),
                        'is_active' => true,
                        'step_category' => $stepData['step_category'] ?? null,
                        'is_optional' => $stepData['is_optional'] ?? false,
                        'optional_label' => $stepData['optional_label'] ?? null,
                        'condition_expression' => $stepData['condition_expression'] ?? null,
                        'phase' => $stepData['phase'] ?? 'f1_request',
                        'uploader_type' => $stepData['uploader_type'] ?? null,
                        'hierarchy_level' => isset($stepData['hierarchy_level']) ? (int) $stepData['hierarchy_level'] : null,
                        'role_id' => $stepData['role_id'] ?? null,
                        'meta' => $stepData['meta'] ?? null,
                    ]);

                    $stepClientId = $stepData['id'] ?? $index;
                    $stepIdMap[$stepClientId] = $step->id;

                    if (! empty($stepData['role'])) {
                        foreach ((array) $stepData['role'] as $role) {
                            $step->approverRoles()->create(['role_name' => $role]);
                        }
                    }

                    if (! empty($stepData['department_ids'])) {
                        foreach ((array) $stepData['department_ids'] as $deptId) {
                            $resolvedId = $this->resolveDepartmentId($deptId);
                            if ($resolvedId) {
                                $step->approverDepartments()->create(['department_id' => $resolvedId]);
                            }
                        }
                    }

                    if (! empty($stepData['user_ids'])) {
                        foreach ((array) $stepData['user_ids'] as $userId) {
                            $resolvedId = $this->resolveUserId($userId);
                            if ($resolvedId) {
                                $step->approverUsers()->create(['user_id' => $resolvedId]);
                            }
                        }
                    }
                }

                // Second pass to sync step actions
                foreach ($data['steps'] as $index => $stepData) {
                    $stepClientId = $stepData['id'] ?? $index;
                    $stepId = $stepIdMap[$stepClientId] ?? null;
                    if ($stepId) {
                        $step = WorkflowStep::find($stepId);
                        if ($step) {
                            $this->syncStepActions($step, $stepData['actions'] ?? [], $stepIdMap);
                        }
                    }
                }
            }

            return $workflow;
        });
    }

    /**
     * Synchronize actions for a specific workflow step.
     */
    private function syncStepActions(WorkflowStep $step, array $actionsData, array $stepIdMap): void
    {
        $existingActionIds = $step->actions()->pluck('id')->toArray();
        $inputActionIds = collect($actionsData)->pluck('id')->filter(fn ($id) => $id && ! str_starts_with($id, 'new-'))->toArray();

        // Delete actions that are not in the input
        $actionsToDelete = array_diff($existingActionIds, $inputActionIds);
        if (! empty($actionsToDelete)) {
            WorkflowStepAction::whereIn('id', $actionsToDelete)->forceDelete();
        }

        $masterActions = MasterAction::pluck('id', 'code')->toArray();

        foreach ($actionsData as $actData) {
            $masterActionId = $actData['master_action_id'] ?? null;

            // If no master action ID, try using code or name
            if (! $masterActionId && ! empty($actData['master_action_name'])) {
                $code = strtolower(str_replace(' ', '_', trim($actData['master_action_name'])));
                if (isset($masterActions[$code])) {
                    $masterActionId = $masterActions[$code];
                } else {
                    $newMaster = MasterAction::create([
                        'name' => trim($actData['master_action_name']),
                        'code' => $code,
                        'is_active' => true,
                    ]);
                    $masterActionId = $newMaster->id;
                    $masterActions[$code] = $masterActionId;
                }
            }

            if (! $masterActionId) {
                continue;
            }

            // Resolve next step in the current workflow
            $nextStepId = $actData['next_step_id'] ?? null;
            if ($nextStepId) {
                if (isset($stepIdMap[$nextStepId])) {
                    $nextStepId = $stepIdMap[$nextStepId];
                } else {
                    // The target step was deleted or not present in the new steps list
                    $nextStepId = null;
                }
            }

            $actionFields = [
                'master_action_id' => $masterActionId,
                'next_step_id' => $nextStepId,
                'next_workflow_id' => $actData['next_workflow_id'] ?? null,
                'next_workflow_step_id' => $actData['next_workflow_step_id'] ?? null,
                'required_fields' => $actData['required_fields'] ?? [],
                'autofilled_fields' => $actData['autofilled_fields'] ?? [],
                'signing_parties' => $actData['signing_parties'] ?? [],
                'assignee_config' => $actData['assignee_config'] ?? [],
                'alias' => $actData['alias'] ?? null,
                'description' => $actData['description'] ?? null,
                'is_active' => $actData['is_active'] ?? true,
                'updated_by' => Auth::id(),
            ];

            $actionId = $actData['id'] ?? null;
            $isNew = ! $actionId || str_starts_with($actionId, 'new-') || ! in_array($actionId, $existingActionIds);

            if ($isNew) {
                $actionFields['created_by'] = Auth::id();
                $step->actions()->create($actionFields);
            } else {
                $action = WorkflowStepAction::findOrFail($actionId);
                $action->update($actionFields);
            }
        }
    }

    private function resolveDepartmentId(string $identifier): ?string
    {
        if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $identifier)) {
            return $identifier;
        }

        return \App\Models\Department::where('code', $identifier)->value('id');
    }

    private function resolveUserId(string $identifier): ?string
    {
        if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $identifier)) {
            return $identifier;
        }

        return \App\Models\User::where('email', $identifier)->value('id');
    }
}
