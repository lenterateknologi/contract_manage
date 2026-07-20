<?php

namespace App\Http\Actions\Workflow;

use App\Enums\WorkflowAction;
use App\Models\Department;
use App\Models\Division;
use App\Models\Role;
use App\Models\User;
use App\Models\WorkflowStep;
use App\Models\WorkflowStepAction;
use Illuminate\Support\Facades\Auth;

trait HasWorkflowHelpers
{
    /**
     * Synchronize actions for a specific workflow step.
     */
    protected function syncStepActions(WorkflowStep $step, array $actionsData, array $stepIdMap): void
    {
        $existingActionIds = $step->actions()->pluck('id')->toArray();
        $inputActionIds = collect($actionsData)->pluck('id')->filter(fn ($id) => $id && ! str_starts_with($id, 'new-'))->toArray();

        // Delete actions that are not in the input
        $actionsToDelete = array_diff($existingActionIds, $inputActionIds);
        if (! empty($actionsToDelete)) {
            WorkflowStepAction::whereIn('id', $actionsToDelete)->forceDelete();
        }

        foreach ($actionsData as $actData) {
            $code = $actData['action_code'] ?? $actData['master_action_id'] ?? null;

            if (! $code && ! empty($actData['master_action_name'])) {
                $code = strtolower(str_replace(' ', '_', trim($actData['master_action_name'])));
            }

            $enumCode = null;
            if ($code instanceof WorkflowAction) {
                $enumCode = $code;
            } elseif (is_string($code)) {
                $enumCode = WorkflowAction::tryFrom($code);
            }

            // Resolve next step in the current workflow
            $nextStepId = $actData['next_step_id'] ?? null;
            if ($nextStepId) {
                if (isset($stepIdMap[$nextStepId])) {
                    $nextStepId = $stepIdMap[$nextStepId];
                } else {
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

            if (isset($assigneeConfig['selectable_steps']) && is_array($assigneeConfig['selectable_steps'])) {
                $assigneeConfig['selectable_steps'] = array_map(function ($stepId) use ($stepIdMap) {
                    return $stepIdMap[$stepId] ?? $stepId;
                }, $assigneeConfig['selectable_steps']);
            }

            $actionFields = [
                'action_code' => $enumCode,
                'next_step_id' => $nextStepId,
                'next_workflow_id' => $actData['next_workflow_id'] ?? null,
                'next_workflow_step_id' => $actData['next_workflow_step_id'] ?? null,
                'required_fields' => $actData['required_fields'] ?? [],
                'autofilled_fields' => $actData['autofilled_fields'] ?? [],
                'signing_parties' => $actData['signing_parties'] ?? [],
                'assignee_config' => $assigneeConfig,
                'transition_config' => $actData['transition_config'] ?? null,
                'alias' => $actData['alias'] ?? null,
                'description' => $actData['description'] ?? null,
                'is_active' => $actData['is_active'] ?? true,
                'updated_by' => Auth::id(),
            ];

            $actionId = $actData['id'] ?? null;
            $isNew = ! $actionId || str_starts_with($actionId, 'new-') || ! in_array($actionId, $existingActionIds);

            if ($isNew) {
                $actionFields['created_by'] = Auth::id();
                $action = $step->actions()->create($actionFields);
            } else {
                $action = WorkflowStepAction::findOrFail($actionId);
                $action->update($actionFields);
            }

            $this->syncActionAdditionalAuthorities($action, $actData, $stepIdMap);
        }
    }

    /**
     * Synchronize additional authorities for a specific step action.
     */
    protected function syncActionAdditionalAuthorities(WorkflowStepAction $action, array $actData, array $stepIdMap): void
    {
        $action->additionalAuthorities()->delete();

        // 1. Process Signers (from signing_parties)
        $signingParties = $actData['signing_parties'] ?? [];
        if (! empty($signingParties)) {
            $this->createAdditionalAuthorities(
                $action,
                'signer',
                $signingParties,
                null
            );
        }

        // 2. Process Assignees (from assignee_config)
        $assigneeConfig = $actData['assignee_config'] ?? [];
        if (! empty($assigneeConfig)) {
            $targetStepId = $assigneeConfig['default_target_step'] ?? $assigneeConfig['signature_target_step'] ?? null;
            if ($targetStepId && isset($stepIdMap[$targetStepId])) {
                $targetStepId = $stepIdMap[$targetStepId];
            }
            $this->createAdditionalAuthorities(
                $action,
                'assignee',
                $assigneeConfig,
                $targetStepId
            );
        }

        // 3. Process Reviewers (from reviewer_config)
        $reviewerConfig = $actData['reviewer_config'] ?? [];
        if (! empty($reviewerConfig)) {
            $targetStepId = $reviewerConfig['target_step_id'] ?? null;
            if ($targetStepId && isset($stepIdMap[$targetStepId])) {
                $targetStepId = $stepIdMap[$targetStepId];
            }
            $this->createAdditionalAuthorities(
                $action,
                'reviewer',
                $reviewerConfig,
                $targetStepId
            );
        }
    }

    /**
     * Create WorkflowStepAuthority records for the action.
     */
    protected function createAdditionalAuthorities(
        WorkflowStepAction $action,
        string $type,
        array $config,
        ?string $targetStepId
    ): void {
        $stepId = $action->workflow_step_id;

        // ponytail: If the UI sends a flex-style 'authorities' array, parse it directly.
        if (isset($config['authorities']) && is_array($config['authorities'])) {
            foreach ($config['authorities'] as $auth) {
                if (empty($auth['authority_type'])) {
                    continue;
                }
                $action->additionalAuthorities()->create([
                    'workflow_step_id' => $stepId,
                    'is_additional' => true,
                    'additional_type' => $type,
                    'target_step_id' => $targetStepId,
                    'authority_type' => $auth['authority_type'] ?? null,
                    'role_id' => ! empty($auth['role_id']) ? $this->resolveRoleId($auth['role_id']) : null,
                    'department_id' => ! empty($auth['department_id']) ? $this->resolveDepartmentId($auth['department_id']) : null,
                    'division_id' => ! empty($auth['division_id']) ? $this->resolveDivisionId($auth['division_id']) : null,
                    'user_id' => ! empty($auth['user_id']) ? $this->resolveUserId($auth['user_id']) : null,
                    'company_group_id' => $auth['company_group_id'] ?? null,
                    'region_id' => $auth['region_id'] ?? null,
                    'role_use_initiator' => $auth['role_use_initiator'] ?? false,
                    'department_use_initiator' => $auth['department_use_initiator'] ?? false,
                    'division_use_initiator' => $auth['division_use_initiator'] ?? false,
                    'company_group_use_initiator' => $auth['company_group_use_initiator'] ?? false,
                    'region_use_initiator' => $auth['region_use_initiator'] ?? false,
                ]);
            }

            return;
        }

        // fallback to old way
        $roles = $config['roles'] ?? [];
        $departments = $config['departments'] ?? [];
        $divisions = $config['divisions'] ?? [];
        $users = $config['users'] ?? [];

        $isInitiatorRole = $config['is_initiator_role'] ?? false;
        $isInitiatorDept = $config['is_initiator_department'] ?? false;
        $isInitiatorUser = $config['is_initiator_user'] ?? false;

        $customs = $config['custom'] ?? [];
        foreach ((array) $customs as $customValue) {
            if ($customValue) {
                $action->additionalAuthorities()->create([
                    'workflow_step_id' => $stepId,
                    'is_additional' => true,
                    'additional_type' => $type,
                    'target_step_id' => $targetStepId,
                    'authority_type' => $customValue,
                ]);
            }
        }

        foreach ((array) $roles as $role) {
            if ($role) {
                $resolvedId = $this->resolveRoleId($role);
                if ($resolvedId) {
                    $action->additionalAuthorities()->create([
                        'workflow_step_id' => $stepId,
                        'is_additional' => true,
                        'additional_type' => $type,
                        'target_step_id' => $targetStepId,
                        'role_id' => $resolvedId,
                    ]);
                }
            }
        }

        foreach ((array) $departments as $deptId) {
            if ($deptId) {
                $resolvedId = $this->resolveDepartmentId($deptId);
                if ($resolvedId) {
                    $action->additionalAuthorities()->create([
                        'workflow_step_id' => $stepId,
                        'is_additional' => true,
                        'additional_type' => $type,
                        'target_step_id' => $targetStepId,
                        'department_id' => $resolvedId,
                    ]);
                }
            }
        }

        foreach ((array) $divisions as $divId) {
            if ($divId) {
                $resolvedId = $this->resolveDivisionId($divId);
                if ($resolvedId) {
                    $action->additionalAuthorities()->create([
                        'workflow_step_id' => $stepId,
                        'is_additional' => true,
                        'additional_type' => $type,
                        'target_step_id' => $targetStepId,
                        'division_id' => $resolvedId,
                    ]);
                }
            }
        }

        foreach ((array) $users as $userId) {
            if ($userId) {
                $resolvedId = $this->resolveUserId($userId);
                if ($resolvedId) {
                    $action->additionalAuthorities()->create([
                        'workflow_step_id' => $stepId,
                        'is_additional' => true,
                        'additional_type' => $type,
                        'target_step_id' => $targetStepId,
                        'user_id' => $resolvedId,
                    ]);
                }
            }
        }

        if ($isInitiatorRole) {
            $action->additionalAuthorities()->create([
                'workflow_step_id' => $stepId,
                'is_additional' => true,
                'additional_type' => $type,
                'target_step_id' => $targetStepId,
                'role_use_initiator' => true,
                'authority_type' => 'role',
            ]);
        }

        if ($isInitiatorDept) {
            $action->additionalAuthorities()->create([
                'workflow_step_id' => $stepId,
                'is_additional' => true,
                'additional_type' => $type,
                'target_step_id' => $targetStepId,
                'department_use_initiator' => true,
                'authority_type' => 'department',
            ]);
        }

        if ($isInitiatorUser) {
            $action->additionalAuthorities()->create([
                'workflow_step_id' => $stepId,
                'is_additional' => true,
                'additional_type' => $type,
                'target_step_id' => $targetStepId,
                'authority_type' => 'initiator',
            ]);
        }
    }

    protected function resolveDepartmentId(string $identifier): ?string
    {
        if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $identifier)) {
            return $identifier;
        }

        $divisionId = Division::where('code', $identifier)->value('id');
        if ($divisionId) {
            return $divisionId;
        }

        return Department::where('code', $identifier)->value('id');
    }

    protected function resolveUserId(string $identifier): ?string
    {
        if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $identifier)) {
            return $identifier;
        }

        return User::where('email', $identifier)->value('id');
    }

    protected function resolveRoleId(string $identifier): ?string
    {
        if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $identifier)) {
            return $identifier;
        }

        // ponytail: role_name is the canonical lookup key
        return Role::where('name', $identifier)->value('id');
    }

    protected function resolveDivisionId(string $identifier): ?string
    {
        if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $identifier)) {
            return $identifier;
        }

        return Division::where('code', $identifier)->value('id');
    }
}
