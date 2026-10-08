<?php

namespace App\Services\Workflow;

use App\Enums\WorkflowAction;
use App\Models\Approval;
use App\Models\Contract;
use App\Models\ContractStatus;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowStep;
use App\Models\WorkflowStepAction;
use App\Services\Workflow\Actions\WorkflowTransitionService;
use App\Services\Workflow\Concerns\EvaluatesWorkflowSteps;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

class ContractWorkflowService
{
    use EvaluatesWorkflowSteps;

    public function __construct(
        protected SLAService $slaService,
        protected WorkflowQueryService $queryService,
        protected WorkflowTransitionService $transitionService,
        protected StepAuthorityResolver $authorityResolver,
        protected StepApprovalLifecycleService $approvalLifecycleService,
    ) {}

    public function getQueryService(): WorkflowQueryService
    {
        return $this->queryService;
    }

    public function getAuthorityResolver(): StepAuthorityResolver
    {
        return $this->authorityResolver;
    }

    public function getApprovalLifecycleService(): StepApprovalLifecycleService
    {
        return $this->approvalLifecycleService;
    }

    public function getTransitionService(): WorkflowTransitionService
    {
        return $this->transitionService;
    }

    /**
     * Send a contract for approval by initiating its workflow.
     */
    public function sendForApproval(Contract $contract, ?string $workflowId = null, ?array $options = [], bool $submit = false): Contract
    {
        $metadata = $options ?: [];
        $topic = $metadata['topic'] ?? ($contract->metadata['topic'] ?? 'perjanjian');
        $now = now();

        $workflow = null;
        if ($workflowId) {
            $workflow = Workflow::find($workflowId);
        }

        if (! $workflow) {
            $taxRequired = (bool) ($metadata['tax_required'] ?? ($contract->metadata['tax_required'] ?? false));
            $typeStr = $contract->contract_type_id ?: ($contract->contractType->code ?? 'General');

            // 1. Try specific match
            $workflow = Workflow::getDefaultByContractType($typeStr, $taxRequired);

            // 2. Fallback: Try any default workflow regardless of tax if specific fails
            if (! $workflow) {
                $workflow = Workflow::where('is_active', true)
                    ->where('is_default', true)
                    ->first();
            }

            // 3. Last Resort: Just take any active workflow
            if (! $workflow) {
                $workflow = Workflow::where('is_active', true)->first();
            }
        }

        if (! $workflow) {
            throw new \Exception('Alur kerja tidak ditemukan dan tidak ada alur default untuk tipe kontrak ini.');
        }

        $workflow->loadMissing('steps');

        $deadlines = $this->slaService->calculateContractDeadlines($contract, $topic, $now);
        $draftingDeadline = $deadlines['drafting_deadline'];
        $totalDeadline = $deadlines['total_deadline'];
        $stageDeadline = $deadlines['stage_deadline'] ?? $draftingDeadline;

        $metadata = array_merge($contract->metadata ?? [], $metadata, [
            'tax_required' => $metadata['tax_required'] ?? ($contract->metadata['tax_required'] ?? false),
            'topic' => $topic,
            'sla_config_id' => $deadlines['sla_config_id'],
            'drafting_deadline' => $draftingDeadline->toIso8601String(),
            'total_deadline' => $totalDeadline ? $totalDeadline->toIso8601String() : null,
            'current_phase' => 'drafting',
        ]);

        $contract->update([
            'metadata' => $metadata,
            'sla_config_id' => $deadlines['sla_config_id'],
            'sla_due_at' => $totalDeadline ?: $draftingDeadline,
            'current_stage_due_at' => $stageDeadline,
            'stage_sla_hours' => $deadlines['stage_hours'] ?? $deadlines['drafting_hours'],
            'sla_total_hours' => $deadlines['total_hours'],
            'stage_started_at' => $now,
            'sla_status' => 'on_track',
        ]);
        $contract->load(['initiator.department', 'initiator.company', 'creator.department', 'creator.company']);

        $contract->approvals()->delete();

        $firstStep = $workflow->steps()->orderBy('step')->first();

        while ($firstStep instanceof WorkflowStep) {
            if (! $this->shouldExecuteStep($contract, $firstStep)) {
                $firstStep = $this->findNextValidStep($contract, $firstStep);

                continue;
            }

            break;
        }

        if (! $firstStep instanceof WorkflowStep) {
            throw new \Exception('Tidak ada tahapan alur kerja yang valid untuk permintaan ini.');
        }

        $statusStr = ($firstStep->meta && ! empty($firstStep->meta['target_status']))
            ? $firstStep->meta['target_status']
            : ($firstStep->actions()->whereIn('action_code', ['approve', 'submit'])->value('target_status') 
                ?? data_get($workflow->meta, 'initial_status') 
                ?? $contract->status);
        $nextStatus = ContractStatus::where('code', $statusStr)->first();

        $stageSla = $this->slaService->resolveStageSla($contract, $nextStatus?->code ?: $statusStr, $now);

        $updateData = [
            'workflow_id' => $workflow->id,
            'workflow_step_id' => $firstStep->id,
            'status' => $nextStatus?->code ?: $statusStr,
            'submitted_at' => now(),
            'current_stage_due_at' => $stageSla['stage_deadline'],
            'stage_sla_hours' => $stageSla['stage_hours'],
            'stage_started_at' => $now,
            'sla_status' => 'on_track',
        ];

        if (empty($contract->origin_workflow_id)) {
            $updateData['origin_workflow_id'] = $workflow->id;
        }

        $contract->update($updateData);

        $this->createApprovalForStep($contract, $firstStep);

        if ($submit) {
            $draftingApproval = $contract->approvals()
                ->where('workflow_step_id', $firstStep->id)
                ->where('status', 'pending')
                ->where('user_id', Auth::id())
                ->first();

            if ($draftingApproval && ($firstStep->step_category === 'drafting' || $firstStep->approver_type === 'initiator')) {
                $this->approveContract($contract, $draftingApproval, 'Pengajuan draf kontrak dikirim oleh inisiator');
            } else {
                $this->handleAutoAdvanceStep($contract, $firstStep);
            }
        }

        $this->queryService->logHistory($contract, 'CONTRACT_SENT', 'Kontrak dikirim untuk persetujuan', Auth::id());

        return $contract->fresh();
    }

    /**
     * Create approval records for a workflow step.
     */
    public function createApprovalForStep(Contract $contract, WorkflowStep $step): void
    {
        $this->approvalLifecycleService->createApprovalForStep($contract, $step);
    }

    /**
     * Resolve the list of actual users authorized to approve a step.
     */
    public function resolveApproversForStep(Contract $contract, WorkflowStep $step): array
    {
        return $this->authorityResolver->resolveApproversForStep($contract, $step);
    }

    /**
     * Process an action on a contract approval and transition workflow dynamically.
     */
    public function approveContract(Contract $contract, Approval $approval, ?string $comment = null, ?string $attachmentPath = null, ?string $assignedPicId = null, ?string $executionOrder = null, string|WorkflowAction $actionCode = WorkflowAction::APPROVE, ?string $targetStepId = null, ?string $actionId = null): Contract
    {
        if (! $contract->relationLoaded('initiator')) {
            $contract->load(['initiator.department', 'initiator.company', 'creator.department', 'creator.company']);
        }

        if ($actionCode instanceof WorkflowAction) {
            $actionCode = $actionCode->value;
        }

        if (! in_array($approval->status, ['pending', 'waiting'])) {
            return $contract;
        }

        $isRoleBased = $approval->workflowStep->approver_type === 'role';
        if ($isRoleBased && $approval->role !== 'Persetujuan Tambahan') {
            // Only consider approvals created on or after this approval's creation time as concurrent/already approved
            $alreadyApproved = $contract->approvals()
                ->where('workflow_step_id', $approval->workflow_step_id)
                ->where('role', '!=', 'Persetujuan Tambahan')
                ->where('status', 'approved')
                ->where('id', '!=', $approval->id)
                ->where('created_at', '>=', $approval->created_at)
                ->exists();

            if ($alreadyApproved) {
                $approval->delete();

                return $contract;
            }
        }

        $currentStep = $approval->workflowStep;
        $stepAction = $this->transitionService->resolveStepAction($contract, $approval, (string) $actionCode, $actionId);

        // Validate required fields configured on step actions or step meta (only for main step approvers)
        if ($currentStep && $approval->sub_step === null && $approval->role !== 'Persetujuan Tambahan') {
            $this->validateRequiredFields($contract, $currentStep, $stepAction, $assignedPicId);
        }

        if ($stepAction && ! empty($stepAction->autofilled_fields)) {
            $this->applyAutofilledFields($contract, $stepAction->autofilled_fields);
        }

        $actionIdToSave = ($stepAction?->id && \Illuminate\Support\Str::isUuid($stepAction->id)) ? $stepAction->id : (\Illuminate\Support\Str::isUuid($actionId) ? $actionId : null);
        $actionCodeToSave = $stepAction?->action_code instanceof \App\Enums\WorkflowAction ? $stepAction->action_code->value : ($stepAction?->action_code ?? (string) $actionCode);
        $actionAliasToSave = $stepAction?->alias;

        $stepName = $approval->workflowStep?->name ?: "Tahap {$approval->sequence}";
        $commentSuffix = $comment ? " (Catatan: {$comment})" : '';

        $isRejectAction = in_array(strtolower((string) $actionCodeToSave), ['reject', 'rejection', 'tolak']);

        if ($isRejectAction) {
            $approval->reject($comment, $attachmentPath, $actionIdToSave, $actionCodeToSave, $actionAliasToSave);
            $actionLabel = $actionAliasToSave ?: 'Ditolak';
            $this->queryService->logHistory($contract, 'APPROVAL_REJECTED', "{$actionLabel} pada [{$stepName}] oleh {$approval->approver_name} ({$approval->role}){$commentSuffix}", Auth::id());
        } else {
            $approval->approve($comment, $attachmentPath, $actionIdToSave, $actionCodeToSave, $actionAliasToSave);

            if (in_array($actionCodeToSave, ['branch', 'add_adhoc'])) {
                $actionLabel = $actionAliasToSave ?: ($actionCodeToSave === 'branch' ? 'Pindah Workflow' : 'Persetujuan Tambahan');
                $this->queryService->logHistory($contract, 'WORKFLOW_BRANCHED', "{$actionLabel} pada [{$stepName}] oleh {$approval->approver_name} ({$approval->role}){$commentSuffix}", Auth::id());
            } elseif (in_array($actionCodeToSave, ['assign', 'assign_pic'])) {
                $actionLabel = $actionAliasToSave ?: 'Persetujuan & Penugasan PIC';
                $this->queryService->logHistory($contract, 'APPROVAL_APPROVED', "{$actionLabel} pada [{$stepName}] oleh {$approval->approver_name} ({$approval->role}){$commentSuffix}", Auth::id());
            } else {
                $actionLabel = $actionAliasToSave ?: 'Disetujui';
                $this->queryService->logHistory($contract, 'APPROVAL_APPROVED', "{$actionLabel} pada [{$stepName}] oleh {$approval->approver_name} ({$approval->role}){$commentSuffix}", Auth::id());
            }
        }

        $this->activateNextApprovers($contract, $approval);

        if ($assignedPicId) {
            $now = now();
            $metadata = $contract->metadata ?? [];
            $metadata['assigned_pic_id'] = $assignedPicId;
            $metadata['assigned_by_id'] = Auth::id();
            $metadata['assigned_at'] = $now->toIso8601String();
            $metadata['pic_assigned_at'] = $now->toIso8601String();

            $contract->update([
                'assigned_pic_id' => $assignedPicId,
                'assigned_by_id' => Auth::id(),
                'assigned_at' => $now,
                'metadata' => $metadata,
            ]);

            $pic = User::find($assignedPicId);
            $this->queryService->logHistory($contract, 'WORKFLOW_ASSIGNED', 'PIC ditugaskan ke: '.($pic ? $pic->name : $assignedPicId), Auth::id());
        }

        $currentStepApprovals = $contract->approvals()
            ->where('workflow_step_id', $approval->workflow_step_id)
            ->where('is_active', true)
            ->get();

        $regularApprovals = $currentStepApprovals->filter(fn (Approval $a) => ! in_array($a->role, ['Persetujuan Tambahan', 'Penandatangan', 'Pihak 1', 'Pihak 2']));
        $adhocApprovals = $currentStepApprovals->filter(fn (Approval $a) => $a->role === 'Persetujuan Tambahan');
        $signerApprovals = $currentStepApprovals->filter(fn (Approval $a) => in_array($a->role, ['Penandatangan', 'Pihak 1', 'Pihak 2']));

        // Evaluate Ad-Hoc Approvals rule
        if ($adhocApprovals->isEmpty()) {
            $adhocApproved = true;
        } else {
            $adhocStepMeta = ($contract->metadata['adhoc_steps'] ?? [])[$approval->workflow_step_id] ?? [];
            $adhocRule = $adhocStepMeta['approval_rule'] ?? 'all';
            $adhocMinApprovals = (int) ($adhocStepMeta['min_approvals'] ?? $adhocApprovals->count());

            if ($adhocRule === 'any') {
                $adhocApproved = $adhocApprovals->contains(fn (Approval $a) => $a->status === 'approved');
            } elseif ($adhocRule === 'quorum') {
                $approvedCount = $adhocApprovals->filter(fn (Approval $a) => $a->status === 'approved')->count();
                $adhocApproved = $approvedCount >= max(1, $adhocMinApprovals);
            } else {
                $adhocApproved = $adhocApprovals->every(fn (Approval $a) => $a->status === 'approved');
            }
        }

        $signersApproved = $signerApprovals->isEmpty() || $signerApprovals->every(fn (Approval $a) => $a->status === 'approved');

        if ($regularApprovals->isEmpty()) {
            $regularApproved = true;
        } else {
            $regularApproved = $isRoleBased
                ? $regularApprovals->contains(fn (Approval $a) => $a->status === 'approved')
                : $regularApprovals->every(fn (Approval $a) => $a->status === 'approved');
        }

        $allApproved = $adhocApproved && $signersApproved && $regularApproved;

        $isBranchOrReject = in_array(strtolower((string) $actionCode), ['branch', 'cross_workflow', 'reject', 'rejection', 'tolak']) 
            || in_array(strtolower((string) $actionCodeToSave), ['branch', 'cross_workflow', 'reject', 'rejection', 'tolak']);

        if ($allApproved || $isBranchOrReject) {
            $this->handleWorkflowTransition($contract, $approval, (string) $actionCode, $actionId);
        }

        return $contract->fresh();
    }

    /**
     * Activate the next set of approvers in a sequential or ad-hoc process.
     */
    public function activateNextApprovers(Contract $contract, Approval $approval): void
    {
        $this->approvalLifecycleService->activateNextApprovers($contract, $approval);
    }

    /**
     * Handle workflow transition to the next step.
     */
    private function handleWorkflowTransition(Contract $contract, Approval $approval, string $actionCode, ?string $actionId = null): void
    {
        $this->transitionService->executeTransition($contract, $approval, $actionCode, $actionId);
    }

    /**
     * Automatically advance workflow if the current step is configured with an explicit 'auto' action or as a system automation step.
     */
    public function handleAutoAdvanceStep(Contract $contract, WorkflowStep $step): void
    {
        $action = $step->actions()->whereIn('action_code', ['auto', 'automation'])->first();

        $isAutoStep = $action !== null ||
            in_array(strtolower($step->step_category ?? ''), ['auto', 'system', 'automation']) ||
            in_array(strtolower($step->approver_type ?? ''), ['auto', 'system', 'automation']);

        if ($isAutoStep) {
            $action = $action ?: $step->actions()->first();
            if ($action) {
                // Execute autofill if configured
                if (! empty($action->autofilled_fields)) {
                    $this->applyAutofilledFields($contract, $action->autofilled_fields);
                }

                $nextStep = $this->evaluateTransition($contract, $step, $action);
                if ($nextStep && $nextStep->id !== $step->id) {
                    $statusStr = $action->target_status
                        ?: ($nextStep->meta['target_status'] 
                            ?? $nextStep->actions()->where('action_code', 'approve')->value('target_status') 
                            ?? $contract->status);
                    $nextStatus = ContractStatus::where('code', $statusStr)->first();

                    $contract->approvals()
                        ->where('workflow_step_id', $step->id)
                        ->whereIn('status', ['pending', 'waiting'])
                        ->update([
                            'status' => 'approved',
                            'decided_at' => now(),
                            'comment' => $action->alias ?: 'Dijalankan otomatis oleh sistem',
                        ]);

                    $contract->update([
                        'workflow_id' => $nextStep->workflow_id,
                        'workflow_step_id' => $nextStep->id,
                        'status' => $nextStatus?->code ?: $statusStr,
                    ]);

                    $stepLabel = $step->name ?: $step->description ?: "Tahap {$step->step}";
                    $nextStepLabel = $nextStep->name ?: $nextStep->description ?: "Tahap {$nextStep->step}";
                    $this->queryService->logHistory($contract, 'WORKFLOW_AUTO_ADVANCED', "Tahap otomatis dijalankan oleh Sistem: [{$stepLabel}] -> Lanjut ke Tahap {$nextStep->step}: {$nextStepLabel}", null);

                    $this->createApprovalForStep($contract, $nextStep);
                    $this->handleAutoAdvanceStep($contract, $nextStep);
                }
            }
        }
    }

    public function getAvailableWorkflows(?User $user, ?string $contractType = null)
    {
        return $this->queryService->getAvailableWorkflows($user, $contractType);
    }

    public function resolveHierarchyApprover(Contract $contract, WorkflowStep|int $stepOrLevel = 1)
    {
        return $this->queryService->resolveHierarchyApprover($contract, $stepOrLevel);
    }

    /**
     * Evaluate the next step based on action transition configuration.
     */
    public function evaluateTransition(Contract $contract, WorkflowStep $currentStep, WorkflowStepAction $stepAction): ?WorkflowStep
    {
        return $this->transitionService->evaluateNextStep($contract, $currentStep, $stepAction);
    }

    public function applyStepFilters(Builder $query, WorkflowStep $step, Contract $contract): Builder
    {
        return $this->authorityResolver->applyStepFilters($query, $step, $contract);
    }

    /**
     * Apply automatic filling or clearing of fields on a contract based on step action configuration.
     */
    public function applyAutofilledFields(Contract $contract, array $fields): void
    {
        app(\App\Services\Workflow\Actions\ActionAutofillHandler::class)->apply($contract, $fields);
    }

    /**
     * Validate required fields configured on a step or specific step action.
     */
    public function validateRequiredFields(Contract $contract, WorkflowStep $step, ?WorkflowStepAction $action = null, ?string $assignedPicId = null): void
    {
        app(\App\Services\Workflow\Actions\ActionFieldValidator::class)->validate($contract, $step, $action, $assignedPicId);
    }
}


