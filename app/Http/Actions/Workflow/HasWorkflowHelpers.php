<?php

namespace App\Http\Actions\Workflow;

use App\Models\Department;
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

            if (! $code) {
                continue;
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
                'action_code' => $code,
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
                $step->actions()->create($actionFields);
            } else {
                $action = WorkflowStepAction::findOrFail($actionId);
                $action->update($actionFields);
            }
        }
    }

    protected function resolveDepartmentId(string $identifier): ?string
    {
        if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $identifier)) {
            return $identifier;
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
}
