<?php

namespace App\Services\Workflow\Actions;

use App\Models\Master\ContractStatus;
use App\Models\Master\WorkflowStep;
use App\Models\Master\WorkflowStepAction;
use App\Models\Transaction\Approval;
use App\Models\Transaction\Contract;
use App\Services\Workflow\Concerns\EvaluatesWorkflowSteps;
use App\Services\Workflow\ContractWorkflowService;
use App\Services\Workflow\SLAService;
use App\Services\Workflow\WorkflowQueryService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class WorkflowTransitionService
{
    use EvaluatesWorkflowSteps;

    public function __construct(
        protected ActionTransitionHandler $transitionHandler,
        protected SLAService $slaService,
        protected WorkflowQueryService $queryService,
    ) {}

    /**
     * Resolve the corresponding WorkflowStepAction from the request or workflow configuration.
     */
    public function resolveStepAction(Contract $contract, Approval $approval, string $actionCode, ?string $actionId = null): ?WorkflowStepAction
    {
        $requestActionId = $actionId ?: request()->input('action_id') ?: request()->input('step_action_id');
        $stepAction = null;

        // 1. Check if matching specific action by UUID in step actions
        if ($requestActionId && Str::isUuid($requestActionId) && $approval->workflowStep) {
            $stepAction = $approval->workflowStep->actions()->where('id', $requestActionId)->first();
        }

        // 2. Check workflow meta custom actions (e.g. exact custom action ID, or fallback to action_code)
        if (! $stepAction) {
            $customActions = $contract->workflow?->meta['custom_actions']
                ?? $contract->origin_workflow?->meta['custom_actions']
                ?? [];
            if (is_array($customActions)) {
                // First pass: Prioritize exact action ID if provided
                if ($requestActionId) {
                    foreach ($customActions as $cAct) {
                        $cId = $cAct['id'] ?? '';
                        if ($cId && $cId === $requestActionId) {
                            $stepAction = new WorkflowStepAction;
                            $stepAction->forceFill([
                                'id' => $cId,
                                'action_code' => $cAct['action_code'] ?? $actionCode,
                                'alias' => $cAct['alias'] ?? $cAct['name'] ?? null,
                                'transition_config' => $cAct['transition_config'] ?? null,
                                'target_status' => $cAct['target_status'] ?? null,
                                'next_workflow_id' => $cAct['next_workflow_id'] ?? null,
                                'next_step_id' => $cAct['next_step_id'] ?? null,
                                'required_fields' => $cAct['required_fields'] ?? [],
                                'autofilled_fields' => $cAct['autofilled_fields'] ?? [],
                            ]);
                            break;
                        }
                    }
                }

                // Second pass: Fallback match by action code if not resolved by ID
                if (! $stepAction && $actionCode) {
                    foreach ($customActions as $cAct) {
                        $cId = $cAct['id'] ?? '';
                        $cCode = $cAct['action_code'] ?? '';
                        if ($cCode === $actionCode) {
                            $stepAction = new WorkflowStepAction;
                            $stepAction->forceFill([
                                'id' => $cId ?: $cCode,
                                'action_code' => $cCode,
                                'alias' => $cAct['alias'] ?? $cAct['name'] ?? null,
                                'transition_config' => $cAct['transition_config'] ?? null,
                                'target_status' => $cAct['target_status'] ?? null,
                                'next_workflow_id' => $cAct['next_workflow_id'] ?? null,
                                'next_step_id' => $cAct['next_step_id'] ?? null,
                                'required_fields' => $cAct['required_fields'] ?? [],
                                'autofilled_fields' => $cAct['autofilled_fields'] ?? [],
                            ]);
                            break;
                        }
                    }
                }
            }
        }

        // 3. Match action code in step actions
        if (! $stepAction && $approval->workflowStep && $actionCode) {
            $stepAction = $approval->workflowStep->actions()->where('action_code', $actionCode)->first();
        }

        return $stepAction;
    }

    /**
     * Evaluate the next step based on action transition configuration.
     */
    public function evaluateNextStep(Contract $contract, WorkflowStep $currentStep, ?WorkflowStepAction $stepAction = null): ?WorkflowStep
    {
        if (! $stepAction) {
            return $this->findNextValidStep($contract, $currentStep);
        }

        return $this->transitionHandler->evaluate($contract, $currentStep, $stepAction);
    }

    /**
     * Execute workflow transition to the next step.
     */
    public function executeTransition(Contract $contract, Approval $approval, string $actionCode, ?string $actionId = null): void
    {
        $workflowService = app(ContractWorkflowService::class);

        if (str_contains(strtolower($approval->role), 'legal') || str_contains(strtolower($approval->workflowStep?->description ?? ''), 'legal')) {
            $metadata = $contract->metadata ?? [];
            $metadata['current_phase'] = 'agreement';
            $metadata['drafting_finished_at'] = now()->toIso8601String();
            $contract->update(['metadata' => $metadata]);
        }

        $stepAction = $this->resolveStepAction($contract, $approval, $actionCode, $actionId);

        if ($stepAction && ! empty($stepAction->autofilled_fields)) {
            $workflowService->applyAutofilledFields($contract, $stepAction->autofilled_fields);
        }

        $hasExplicitTransition = $stepAction && (
            (is_array($stepAction->transition_config) && ! empty($stepAction->transition_config['type']))
            || $stepAction->next_workflow_id
            || $stepAction->next_step_id
        );

        $nextStep = $stepAction && $approval->workflowStep ? $this->evaluateNextStep($contract, $approval->workflowStep, $stepAction) : null;
        while ($nextStep && ! $this->shouldExecuteStep($contract, $nextStep)) {
            $nextStep = $this->findNextValidStep($contract, $nextStep);
        }

        $isRoleBased = $approval->workflowStep?->approver_type === 'role';
        if ($isRoleBased && $nextStep && $nextStep->id !== $approval->workflow_step_id && ! $contract->is_in_sub_workflow) {
            $contract->approvals()->where('workflow_step_id', $approval->workflow_step_id)->where('role', '!=', 'Persetujuan Tambahan')->whereIn('status', ['pending', 'waiting'])->delete();
        }

        $isReject = in_array(strtolower((string) $actionCode), ['reject', 'rejection', 'tolak', 'revisi']);
        $statusStr = null;

        if ($isReject && ! $hasExplicitTransition) {
            $step1 = WorkflowStep::where('workflow_id', $contract->workflow_id)->orderBy('step')->first();
            $nextStep = $step1 ?: $approval->workflowStep;
            $statusStr = $stepAction?->target_status ?: 'revision';
        } elseif (! $nextStep && ! $hasExplicitTransition) {
            if ($contract->is_in_sub_workflow || ($contract->origin_workflow_id && $contract->workflow_id !== $contract->origin_workflow_id) || $contract->current_sub_workflow_id) {
                // Sub-workflow completed its steps, return to origin workflow at next step (branch_from_step_num + 1)
                $metadata = $contract->metadata ?? [];
                $targetSequence = (int) ($metadata['branch_from_step_num'] ?? 1) + 1;
                $originWfId = $contract->origin_workflow_id ?: $contract->workflow_id;

                $allSteps = WorkflowStep::where('workflow_id', $originWfId)
                    ->where('step', '>=', $targetSequence)
                    ->where('is_active', true)
                    ->orderBy('step')
                    ->get();
                $targetStep = $allSteps->first(fn ($s) => $this->shouldExecuteStep($contract, $s))
                    ?: WorkflowStep::where('workflow_id', $originWfId)->orderBy('step', 'desc')->first();

                if ($targetStep) {
                    unset($metadata['branch_from_step_num'], $metadata['branch_from_step_id']);
                    $contract->update([
                        'workflow_step_id' => $targetStep->id,
                        'is_in_sub_workflow' => false,
                        'branch_step_number' => null,
                        'origin_workflow_step_id' => null,
                        'current_step_number' => $targetStep->step,
                        'current_sub_workflow_id' => null,
                        'metadata' => $metadata,
                    ]);

                    // Deactivate prior decided records on origin step
                    Approval::where('contract_id', $contract->id)
                        ->where('workflow_step_id', $targetStep->id)
                        ->whereIn('status', ['approved', 'rejected'])
                        ->update(['is_active' => false]);

                    // Reactivate waiting approvals on the origin step
                    $reactivatedCount = Approval::where('contract_id', $contract->id)
                        ->where('workflow_step_id', $targetStep->id)
                        ->where('status', 'waiting')
                        ->update(['status' => 'pending', 'is_current_step' => true]);

                    if ($reactivatedCount === 0 && ! Approval::where('contract_id', $contract->id)->where('workflow_step_id', $targetStep->id)->where('status', 'pending')->exists()) {
                        $workflowService->createApprovalForStep($contract, $targetStep);
                    }

                    $nextStep = $targetStep;
                    $targetStepLabel = $targetStep->label ?: $targetStep->name ?: $targetStep->description ?: "Tahap {$targetStep->step}";
                    $this->queryService->logHistory($contract, 'WORKFLOW_RETURNED', "Sub-alur kerja selesai. Kembali ke alur kerja utama pada Tahap {$targetStep->step}: {$targetStepLabel}", Auth::id());
                }
            } elseif ($approval->workflowStep) {
                $nextStep = $this->findNextValidStep($contract, $approval->workflowStep);
            }
        }

        if ($nextStep) {
            $statusStr = $statusStr ?? ($stepAction?->target_status
                ?: ($nextStep->id === $approval->workflow_step_id
                    ? $contract->status
                    : ($nextStep->meta['target_status']
                        ?? $nextStep->actions()->where('action_code', 'approve')->value('target_status')
                        ?? ($contract->status === 'draft' ? 'in_review' : $contract->status))));
            $nextStatus = ContractStatus::where('code', $statusStr)->first();

            $isSameStep = $nextStep->id === $approval->workflow_step_id;
            $now = now();
            $stageSla = $this->slaService->resolveStageSla($contract, $nextStatus?->code ?: $statusStr, $now);

            $contract->update([
                'workflow_id' => $nextStep->workflow_id ?: $contract->workflow_id,
                'workflow_step_id' => $nextStep->id,
                'status' => $nextStatus?->code ?: $statusStr,
                'current_stage_due_at' => $stageSla['stage_deadline'],
                'stage_sla_hours' => $stageSla['stage_hours'],
                'stage_started_at' => $now,
                'sla_status' => 'on_track',
            ]);

            if (! $isSameStep) {
                // Deactivate prior decided records on target step
                Approval::where('contract_id', $contract->id)
                    ->where('workflow_step_id', $nextStep->id)
                    ->whereIn('status', ['approved', 'rejected'])
                    ->update(['is_active' => false]);

                $workflowService->createApprovalForStep($contract, $nextStep);

                $nextStepLabel = $nextStep->name ?: $nextStep->description ?: "Tahap {$nextStep->step}";
                $this->queryService->logHistory($contract, 'WORKFLOW_ADVANCED', "Alur kerja berlanjut ke Tahap {$nextStep->step}: {$nextStepLabel}", Auth::id());
                $workflowService->handleAutoAdvanceStep($contract, $nextStep);
            }
        } else {
            $targetStat = $stepAction?->target_status
                ?: $approval->workflowStep?->actions()->where('action_code', 'approve')->value('target_status')
                ?: data_get($contract->workflow?->meta, 'completed_status')
                ?: 'approved';

            $contract->update([
                'status' => $targetStat,
                'workflow_step_id' => null,
                'current_stage_due_at' => null,
                'finished_at' => now(),
            ]);
            $this->queryService->logHistory($contract, 'CONTRACT_COMPLETED', 'Seluruh persetujuan alur kerja selesai.', Auth::id());
        }
    }
}
