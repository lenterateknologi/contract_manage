<?php

namespace App\Http\Actions\Workflow;

use App\Models\Workflow;
use App\Models\WorkflowStep;
use App\Models\WorkflowStepAction;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DuplicateWorkflowAction
{
    /**
     * Duplicate the specified workflow.
     */
    public function execute(Workflow $workflow): Workflow
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

            // Duplicate Org Scopes
            foreach ($workflow->orgScopes as $scope) {
                $newWorkflow->orgScopes()->create([
                    'company_group_id' => $scope->company_group_id,
                    'region_id' => $scope->region_id,
                    'company_id' => $scope->company_id,
                ]);
            }

            // Duplicate Initiator Authorities
            foreach ($workflow->initiatorAuthorities as $auth) {
                $newWorkflow->initiatorAuthorities()->create([
                    'role_id' => $auth->role_id,
                    'department_id' => $auth->department_id,
                    'division_id' => $auth->division_id,
                    'user_id' => $auth->user_id,
                ]);
            }

            // Duplicate steps and keep a map of old step ID -> new step ID
            $stepIdMap = [];
            $workflow->load([
                'steps.approverAuthorities',
                'steps.actions',
            ]);
            $oldSteps = $workflow->steps; // Ordered by step

            /** @var WorkflowStep $oldStep */
            foreach ($oldSteps as $oldStep) {
                $newStep = $oldStep->replicate();
                $newStep->workflow_id = $newWorkflow->id;
                $newStep->created_by = Auth::id();
                $newStep->updated_by = Auth::id();
                $newStep->save();

                $stepIdMap[$oldStep->id] = $newStep->id;

                // Duplicate step approver authorities
                foreach ($oldStep->approverAuthorities as $auth) {
                    $newStep->approverAuthorities()->create([
                        'role_id' => $auth->role_id,
                        'department_id' => $auth->department_id,
                        'division_id' => $auth->division_id,
                        'user_id' => $auth->user_id,
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
}
