<?php

namespace App\Services\Workflow\Actions;

use App\Models\Approval;
use App\Models\Contract;
use App\Models\WorkflowStep;
use App\Models\WorkflowStepAction;
use App\Services\Workflow\Concerns\EvaluatesWorkflowSteps;

class ActionTransitionHandler
{
    use EvaluatesWorkflowSteps;

    /**
     * Evaluate the next workflow step based on action transition configuration.
     */
    public function evaluate(Contract $contract, WorkflowStep $currentStep, WorkflowStepAction $stepAction): ?WorkflowStep
    {
        $transition = $stepAction->transition_config;

        if (is_array($transition) && isset($transition['type'])) {
            switch ($transition['type']) {
                case 'relative':
                    $offset = (int) ($transition['offset'] ?? 1);
                    if ($offset === 1) {
                        return $this->findNextValidStep($contract, $currentStep);
                    } elseif ($offset === 0) {
                        return $currentStep;
                    } elseif ($offset > 1) {
                        $targetSequence = $currentStep->step + $offset;
                        $allSteps = WorkflowStep::where('workflow_id', $contract->workflow_id)
                            ->where('step', '>=', $targetSequence)
                            ->orderBy('step')
                            ->get();

                        foreach ($allSteps as $step) {
                            if ($this->shouldExecuteStep($contract, $step)) {
                                return $step;
                            }
                        }

                        return null;
                    } elseif ($offset < 0) {
                        $targetSequence = max(1, $currentStep->step + $offset);

                        return WorkflowStep::where('workflow_id', $contract->workflow_id)
                            ->where('step', '<=', $targetSequence)
                            ->orderBy('step', 'desc')
                            ->first();
                    }
                    break;

                case 'finish':
                case 'archive':
                    return null;

                case 'absolute':
                    $targetStep = null;
                    if (! empty($transition['step_id'])) {
                        $targetStep = WorkflowStep::where('workflow_id', $contract->workflow_id)->find($transition['step_id']);
                    }
                    if (! $targetStep && ! empty($stepAction->next_step_id)) {
                        $targetStep = WorkflowStep::where('workflow_id', $contract->workflow_id)->find($stepAction->next_step_id);
                    }
                    if (! $targetStep) {
                        $targetSequence = max(1, (int) ($transition['sequence'] ?? 1));
                        $targetStep = WorkflowStep::where('workflow_id', $contract->workflow_id)->where('step', $targetSequence)->first();
                    }
                    if ($targetStep) {
                        $contract->update([
                            'workflow_id' => $contract->workflow_id,
                            'workflow_step_id' => $targetStep->id,
                        ]);

                        return $targetStep;
                    }
                    break;

                case 'cross_workflow':
                    $workflowId = $transition['workflow_id'] ?? null;
                    if ($workflowId === 'origin_workflow' || $workflowId === 'origin' || empty($workflowId)) {
                        $workflowId = $contract->origin_workflow_id ?: $contract->workflow_id;
                    }

                    if ($workflowId) {
                        $targetSequence = max(1, (int) ($transition['sequence'] ?? 1));
                        $targetStep = null;
                        $metadata = $contract->metadata ?? [];

                        // Dynamic return: if returning to origin from sub-workflow, calculate target step from branch point
                        $returnMode = $transition['return_mode'] ?? '';
                        $originWfId = $contract->origin_workflow_id ?: $contract->workflow_id;
                        $originStepNum = $contract->branch_step_number ?? (isset($metadata['branch_from_step_num']) ? (int) $metadata['branch_from_step_num'] : null);
                        $originStepId = $contract->origin_workflow_step_id ?? (isset($metadata['branch_from_step_id']) ? $metadata['branch_from_step_id'] : null);

                        if ($workflowId === $originWfId) {
                            if ($returnMode === 'branch_origin' || $returnMode === 'origin_step') {
                                if ($originStepId) {
                                    $targetStep = WorkflowStep::where('workflow_id', $originWfId)->where('id', $originStepId)->first();
                                }
                                if (! $targetStep && $originStepNum !== null) {
                                    $targetStep = WorkflowStep::where('workflow_id', $originWfId)->where('step', $originStepNum)->first();
                                }
                            } elseif ($returnMode === 'branch_next' || empty($returnMode)) {
                                if ($originStepNum !== null) {
                                    $targetStep = WorkflowStep::where('workflow_id', $originWfId)
                                        ->where('step', '>', $originStepNum)
                                        ->orderBy('step', 'asc')
                                        ->first();
                                }
                            } elseif ($returnMode === '1' || $returnMode === 'origin_first') {
                                $targetStep = WorkflowStep::where('workflow_id', $originWfId)->orderBy('step', 'asc')->first();
                            }
                        }

                        if (! $targetStep) {
                            $targetStep = WorkflowStep::where('workflow_id', $workflowId)->where('step', $targetSequence)->first();
                        }
                        if (! $targetStep) {
                            $targetStep = WorkflowStep::where('workflow_id', $workflowId)->where('step', '>=', $targetSequence)->orderBy('step')->first()
                                ?: WorkflowStep::where('workflow_id', $workflowId)->orderBy('step', 'desc')->first();
                        }

                        if ($targetStep) {
                            // If jumping into a sub-workflow from main workflow, record the branch origin step
                            if ($workflowId !== $originWfId) {
                                $metadata['branch_from_step_num'] = $currentStep->step;
                                $metadata['branch_from_step_id'] = $currentStep->id;

                                // Pause pending approvals on the origin workflow step so they become 'waiting'
                                Approval::where('contract_id', $contract->id)
                                    ->where('workflow_step_id', $currentStep->id)
                                    ->where('status', 'pending')
                                    ->update(['status' => 'waiting']);

                                $contract->update([
                                    'origin_workflow_id' => $originWfId,
                                    'origin_workflow_step_id' => $currentStep->id,
                                    'workflow_step_id' => $targetStep->id,
                                    'is_in_sub_workflow' => true,
                                    'branch_step_number' => $currentStep->step,
                                    'current_step_number' => $targetStep->step,
                                    'current_sub_workflow_id' => $workflowId,
                                    'metadata' => $metadata,
                                ]);
                            } else {
                                if (isset($metadata['branch_from_step_num'])) {
                                    unset($metadata['branch_from_step_num'], $metadata['branch_from_step_id']);
                                }

                                $contract->update([
                                    'workflow_step_id' => $targetStep->id,
                                    'is_in_sub_workflow' => false,
                                    'branch_step_number' => null,
                                    'origin_workflow_step_id' => null,
                                    'current_step_number' => $targetStep->step,
                                    'current_sub_workflow_id' => null,
                                    'metadata' => $metadata,
                                ]);

                                // Deactivate prior decided records on return target step
                                Approval::where('contract_id', $contract->id)
                                    ->where('workflow_step_id', $targetStep->id)
                                    ->whereIn('status', ['approved', 'rejected'])
                                    ->update(['is_active' => false]);

                                // Reactivate waiting approvals on return target step
                                $waitingCount = Approval::where('contract_id', $contract->id)
                                    ->where('workflow_step_id', $targetStep->id)
                                    ->where('status', 'waiting')
                                    ->update(['status' => 'pending']);

                                if ($waitingCount === 0 && ! Approval::where('contract_id', $contract->id)->where('workflow_step_id', $targetStep->id)->where('status', 'pending')->exists()) {
                                    app(\App\Services\Workflow\ContractWorkflowService::class)->createApprovalForStep($contract, $targetStep);
                                }
                            }

                            return $targetStep;
                        }
                    }
                    break;

                case 'initial_step':
                    $workflowId = $contract->workflow_id ?: $contract->origin_workflow_id;
                    if ($workflowId) {
                        $targetStep = WorkflowStep::where('workflow_id', $workflowId)->orderBy('step')->first();
                        if ($targetStep) {
                            $contract->update([
                                'workflow_step_id' => $targetStep->id,
                                'is_in_sub_workflow' => false,
                                'current_sub_workflow_id' => null,
                            ]);

                            return $targetStep;
                        }
                    }
                    break;
            }
        }

        if ($stepAction->next_workflow_id) {
            $targetSubWfId = $stepAction->next_workflow_id;
            $targetStep = $stepAction->next_workflow_step_id
                ? WorkflowStep::find($stepAction->next_workflow_step_id)
                : WorkflowStep::where('workflow_id', $targetSubWfId)->orderBy('step')->first();

            if ($targetStep) {
                $contract->update([
                    'origin_workflow_id' => $contract->origin_workflow_id ?: $contract->workflow_id,
                    'workflow_step_id' => $targetStep->id,
                    'current_sub_workflow_id' => $targetSubWfId,
                    'is_in_sub_workflow' => ($targetSubWfId !== ($contract->origin_workflow_id ?: $contract->workflow_id)),
                ]);
            }

            return $targetStep;
        }

        if ($stepAction->next_step_id) {
            return WorkflowStep::find($stepAction->next_step_id);
        }

        // Default forward progression for approve/sign/assign/forward/auto actions when no explicit target is set
        $actionCodeStr = $stepAction->action_code instanceof \BackedEnum
            ? $stepAction->action_code->value
            : (string) ($stepAction->action_code ?? '');

        if (in_array(strtolower($actionCodeStr), ['approve', 'assign', 'assign_pic', 'add_adhoc', 'auto'])) {
            return $this->findNextValidStep($contract, $currentStep);
        }

        return null;
    }
}
