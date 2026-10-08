<?php

namespace App\Http\Actions\Admin\Contract;

use App\Http\Formatters\ContractFormatter;
use App\Models\Contract;
use App\Models\ContractStatus;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowStep;
use App\Services\Workflow\SLAService;
use App\Services\Workflow\StepApprovalLifecycleService;
use App\Services\Workflow\WorkflowQueryService;
use Illuminate\Support\Facades\Auth;

class AdminOverrideWorkflowAction
{
    public function __construct(
        protected SLAService $slaService,
        protected WorkflowQueryService $queryService,
        protected StepApprovalLifecycleService $approvalLifecycleService,
        protected \App\Http\Queries\Contract\ContractDetailQuery $contractDetailQuery,
    ) {}

    /**
     * Execute admin override on contract workflow and current active step.
     */
    public function execute(Contract $contract, string $workflowId, string $workflowStepId, ?string $reason = null, ?User $actor = null): array
    {
        $actorId = $actor ? $actor->id : Auth::id();
        $now = now();

        $workflow = Workflow::with('steps')->findOrFail($workflowId);
        $step = $workflow->steps()->findOrFail($workflowStepId);

        $oldWorkflowName = $contract->workflow?->name ?? 'N/A';
        $oldStepName = $contract->workflowStep
            ? "Tahap {$contract->workflowStep->step}: {$contract->workflowStep->name}"
            : 'N/A';

        // 1. Delete stale pending/waiting approvals across the contract
        $contract->approvals()->whereIn('status', ['pending', 'waiting'])->delete();

        // 2. Resolve status based on the step or workflow
        $statusStr = ($step->meta && ! empty($step->meta['target_status']))
            ? $step->meta['target_status']
            : ($step->actions()->whereIn('action_code', ['approve', 'submit'])->value('target_status')
                ?? data_get($workflow->meta, 'initial_status')
                ?? $contract->status);
        $nextStatus = ContractStatus::where('code', $statusStr)->first();
        $targetStatusCode = $nextStatus?->code ?: $statusStr;

        $stageSla = $this->slaService->resolveStageSla($contract, $targetStatusCode, $now);

        // 3. Update contract attributes
        $contract->update([
            'workflow_id' => $workflow->id,
            'workflow_step_id' => $step->id,
            'status' => $targetStatusCode,
            'current_stage_due_at' => $stageSla['stage_deadline'],
            'stage_sla_hours' => $stageSla['stage_hours'],
            'stage_started_at' => $now,
            'sla_status' => 'on_track',
        ]);

        // 4. Create new approval records for the new step
        $this->approvalLifecycleService->createApprovalForStep($contract, $step);

        // 5. Log audit trail history
        $newStepName = "Tahap {$step->step}: {$step->name}";
        $logDescription = "Admin mengubah alur kerja dari [{$oldWorkflowName} - {$oldStepName}] ke [{$workflow->name} - {$newStepName}].";
        if (! empty($reason)) {
            $logDescription .= " Alasan: {$reason}";
        }
        $this->queryService->logHistory($contract, 'ADMIN_WORKFLOW_OVERRIDE', $logDescription, $actorId);

        $freshContract = $this->contractDetailQuery->find($contract->id);

        return ContractFormatter::formatContract($freshContract);
    }
}
