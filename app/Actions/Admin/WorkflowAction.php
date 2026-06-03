<?php

namespace App\Actions\Admin;

use App\Models\Department;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowInitiatorDepartment;
use App\Models\WorkflowInitiatorRole;
use App\Models\WorkflowInitiatorUser;
use App\Models\WorkflowStep;
use App\Models\WorkflowStepAction;
use App\Models\WorkflowStepDepartment;
use App\Models\WorkflowStepRole;
use App\Models\WorkflowStepUser;
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
            if (empty($workflowData['contract_type_id'])) {
                $workflowData['contract_type_id'] = null;
            }
            $workflow = Workflow::create($workflowData);

            if ($workflow->is_default) {
                Workflow::where('id', '!=', $workflow->id)
                    ->update(['is_default' => false]);
            }

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
                    /** @var WorkflowStep $step */
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
                        'filter_department' => $stepData['filter_department'] ?? false,
                        'filter_company_group' => $stepData['filter_company_group'] ?? false,
                        'filter_region' => $stepData['filter_region'] ?? false,
                        'filter_company' => $stepData['filter_company'] ?? false,
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
            $workflowData = collect($data)->except(['initiator_roles', 'initiator_users', 'initiator_departments', 'steps'])->toArray();
            if (empty($workflowData['contract_type_id'])) {
                $workflowData['contract_type_id'] = null;
            }
            $workflow->update($workflowData);

            if ($workflow->is_default) {
                Workflow::where('id', '!=', $workflow->id)
                    ->update(['is_default' => false]);
            }

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
                        'filter_department' => $stepData['filter_department'] ?? false,
                        'filter_company_group' => $stepData['filter_company_group'] ?? false,
                        'filter_region' => $stepData['filter_region'] ?? false,
                        'filter_company' => $stepData['filter_company'] ?? false,
                    ];

                    if ($isNew) {
                        $stepFields['created_by'] = Auth::id();
                        /** @var WorkflowStep $step */
                        $step = $workflow->steps()->create($stepFields);
                    } else {
                        /** @var WorkflowStep $step */
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
            $workflow->steps()->forceDelete();

            $stepIdMap = [];
            if (! empty($data['steps'])) {
                foreach ($data['steps'] as $index => $stepData) {
                    /** @var WorkflowStep $step */
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
                        'company_group_ids' => $stepData['company_group_ids'] ?? null,
                        'region_ids' => $stepData['region_ids'] ?? null,
                        'company_ids' => $stepData['company_ids'] ?? null,
                        'filter_department' => $stepData['filter_department'] ?? false,
                        'filter_company_group' => $stepData['filter_company_group'] ?? false,
                        'filter_region' => $stepData['filter_region'] ?? false,
                        'filter_company' => $stepData['filter_company'] ?? false,
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

        foreach ($actionsData as $actData) {
            $code = $actData['action_code'] ?? $actData['master_action_id'] ?? null; // master_action_id field from frontend is now actually sending the action_code enum value

            if (! $code && ! empty($actData['master_action_name'])) {
                $code = strtolower(str_replace(' ', '_', trim($actData['master_action_name'])));
            }

            if (! $code) {
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

            $assigneeConfig = $actData['assignee_config'] ?? [];
            if (isset($assigneeConfig['default_target_step']) && isset($stepIdMap[$assigneeConfig['default_target_step']])) {
                $assigneeConfig['default_target_step'] = $stepIdMap[$assigneeConfig['default_target_step']];
            }
            if (isset($assigneeConfig['signature_target_step']) && isset($stepIdMap[$assigneeConfig['signature_target_step']])) {
                $assigneeConfig['signature_target_step'] = $stepIdMap[$assigneeConfig['signature_target_step']];
            }

            // Map selectable_steps if present
            if (isset($assigneeConfig['selectable_steps']) && is_array($assigneeConfig['selectable_steps'])) {
                $assigneeConfig['selectable_steps'] = array_map(function ($stepId) use ($stepIdMap) {
                    return $stepIdMap[$stepId] ?? $stepId;
                }, $assigneeConfig['selectable_steps']);
            }

            $actionFields = [
                'action_code' => $code,
                'next_step_id' => $nextStepId,
                'next_workflow_id' => $actData['next_workflow_id'] ?? null,
                'next_workflow_step_id' => $actData['next_workflow_step_id'] ?? null,
                'required_fields' => $actData['required_fields'] ?? [],
                'autofilled_fields' => $actData['autofilled_fields'] ?? [],
                'signing_parties' => $actData['signing_parties'] ?? [],
                'assignee_config' => $assigneeConfig,
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

    /**
     * Duplicate the specified workflow.
     */
    public function duplicate(Workflow $workflow): Workflow
    {
        return DB::transaction(function () use ($workflow) {
            $newWorkflow = $workflow->replicate(['is_default']); // Do not copy is_default = true to prevent conflict
            $newWorkflow->is_default = false;

            // Find a unique name
            $originalName = $workflow->name;
            $name = $originalName.' (Copy)';
            $i = 1;
            while (Workflow::where('name', $name)->exists()) {
                $name = $originalName." (Copy {$i})";
                $i++;
            }
            $newWorkflow->name = $name;
            $newWorkflow->created_by = Auth::id();
            $newWorkflow->updated_by = Auth::id();
            $newWorkflow->save();

            // Duplicate Initiator Roles
            /** @var WorkflowInitiatorRole $role */
            foreach ($workflow->initiatorRolesData as $role) {
                $newWorkflow->initiatorRolesData()->create([
                    'role_name' => $role->role_name,
                ]);
            }

            // Duplicate Initiator Departments
            /** @var WorkflowInitiatorDepartment $dept */
            foreach ($workflow->initiatorDepartmentsData as $dept) {
                $newWorkflow->initiatorDepartmentsData()->create([
                    'department_id' => $dept->department_id,
                ]);
            }

            // Duplicate Initiator Users
            /** @var WorkflowInitiatorUser $u */
            foreach ($workflow->initiatorUsersData as $u) {
                $newWorkflow->initiatorUsersData()->create([
                    'user_id' => $u->user_id,
                ]);
            }

            // Duplicate steps and keep a map of old step ID -> new step ID
            $stepIdMap = [];
            $oldSteps = $workflow->steps; // Ordered by step

            /** @var WorkflowStep $oldStep */
            foreach ($oldSteps as $oldStep) {
                $newStep = $oldStep->replicate();
                $newStep->workflow_id = $newWorkflow->id;
                $newStep->created_by = Auth::id();
                $newStep->updated_by = Auth::id();
                $newStep->save();

                $stepIdMap[$oldStep->id] = $newStep->id;

                // Duplicate step approver roles
                /** @var WorkflowStepRole $role */
                foreach ($oldStep->approverRoles as $role) {
                    $newStep->approverRoles()->create([
                        'role_name' => $role->role_name,
                    ]);
                }

                // Duplicate step approver departments
                /** @var WorkflowStepDepartment $dept */
                foreach ($oldStep->approverDepartments as $dept) {
                    $newStep->approverDepartments()->create([
                        'department_id' => $dept->department_id,
                    ]);
                }

                // Duplicate step approver users
                /** @var WorkflowStepUser $u */
                foreach ($oldStep->approverUsers as $u) {
                    $newStep->approverUsers()->create([
                        'user_id' => $u->user_id,
                    ]);
                }
            }

            // Second pass: duplicate step actions and map next_step_id
            /** @var WorkflowStep $oldStep */
            foreach ($oldSteps as $oldStep) {
                $newStepId = $stepIdMap[$oldStep->id] ?? null;
                if (! $newStepId) {
                    continue;
                }

                $newStep = WorkflowStep::find($newStepId);
                if (! $newStep) {
                    continue;
                }

                /** @var WorkflowStepAction $action */
                foreach ($oldStep->actions as $action) {
                    $newAction = $action->replicate();
                    $newAction->workflow_step_id = $newStep->id;
                    $newAction->created_by = Auth::id();
                    $newAction->updated_by = Auth::id();

                    // Map next_step_id if it exists
                    if ($action->next_step_id && isset($stepIdMap[$action->next_step_id])) {
                        $newAction->next_step_id = $stepIdMap[$action->next_step_id];
                    }

                    // Map assignee_config step IDs
                    $assigneeConfig = $action->assignee_config ?? [];
                    if (isset($assigneeConfig['default_target_step']) && isset($stepIdMap[$assigneeConfig['default_target_step']])) {
                        $assigneeConfig['default_target_step'] = $stepIdMap[$assigneeConfig['default_target_step']];
                    }
                    if (isset($assigneeConfig['signature_target_step']) && isset($stepIdMap[$assigneeConfig['signature_target_step']])) {
                        $assigneeConfig['signature_target_step'] = $stepIdMap[$assigneeConfig['signature_target_step']];
                    }
                    if (isset($assigneeConfig['selectable_steps']) && is_array($assigneeConfig['selectable_steps'])) {
                        $assigneeConfig['selectable_steps'] = array_map(function ($stepId) use ($stepIdMap) {
                            return $stepIdMap[$stepId] ?? $stepId;
                        }, $assigneeConfig['selectable_steps']);
                    }
                    $newAction->assignee_config = $assigneeConfig;

                    $newAction->save();
                }
            }

            return $newWorkflow;
        });
    }

    private function resolveDepartmentId(string $identifier): ?string
    {
        if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $identifier)) {
            return $identifier;
        }

        return Department::where('code', $identifier)->value('id');
    }

    private function resolveUserId(string $identifier): ?string
    {
        if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $identifier)) {
            return $identifier;
        }

        return User::where('email', $identifier)->value('id');
    }
}
