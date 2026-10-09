<?php

namespace App\Http\Actions\Admin\Contract;

use App\Http\Formatters\ContractFormatter;
use App\Http\Queries\Contract\ContractDetailQuery;
use App\Models\Master\ContractStatus;
use App\Models\Master\User;
use App\Models\Master\Workflow;
use App\Models\Transaction\Approval;
use App\Models\Transaction\Contract;
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
        protected ContractDetailQuery $contractDetailQuery,
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

        $isSameWorkflow = ($contract->workflow_id === $workflow->id);
        $targetStepNum = (int) $step->step;

        // 1. Resolve status based on the step or workflow
        $statusStr = ($step->meta && ! empty($step->meta['target_status']))
            ? $step->meta['target_status']
            : ($step->actions()->whereIn('action_code', ['approve', 'submit'])->value('target_status')
                ?? data_get($workflow->meta, 'initial_status')
                ?? $contract->status);
        $nextStatus = ContractStatus::where('code', $statusStr)->first();
        $targetStatusCode = $nextStatus?->code ?: $statusStr;

        $stageSla = $this->slaService->resolveStageSla($contract, $targetStatusCode, $now);

        // 2. Update contract attributes
        $contract->update([
            'workflow_id' => $workflow->id,
            'workflow_step_id' => $step->id,
            'current_step_number' => $targetStepNum,
            'status' => $targetStatusCode,
            'current_stage_due_at' => $stageSla['stage_deadline'],
            'stage_sla_hours' => $stageSla['stage_hours'],
            'stage_started_at' => $now,
            'sla_status' => 'on_track',
        ]);

        if ($isSameWorkflow) {
            // Case A: Moving steps within the same workflow (e.g. going back 1 step, or jumping forward)

            // Step A.1: Steps strictly BEFORE target step (sequence < targetStepNum)
            Approval::where('contract_id', $contract->id)
                ->where('sequence', '<', $targetStepNum)
                ->whereIn('status', ['pending', 'waiting'])
                ->update([
                    'status' => 'approved',
                    'is_current_step' => false,
                    'is_active' => true,
                    'decided_at' => $now,
                ]);

            // Step A.2: Steps strictly AFTER target step (sequence > targetStepNum)
            Approval::where('contract_id', $contract->id)
                ->where('sequence', '>', $targetStepNum)
                ->update([
                    'status' => 'waiting',
                    'is_current_step' => false,
                    'decided_at' => null,
                    'comment' => null,
                    'action_id' => null,
                    'action_code' => null,
                    'action_alias' => null,
                ]);

            // Step A.3: The TARGET step (sequence == targetStepNum or workflow_step_id == step->id)
            $targetStepApprovals = Approval::where('contract_id', $contract->id)
                ->where(function ($q) use ($step, $targetStepNum) {
                    $q->where('workflow_step_id', $step->id)
                      ->orWhere('sequence', $targetStepNum);
                })
                ->get();

            if ($targetStepApprovals->isNotEmpty()) {
                $hasAdhoc = $targetStepApprovals->whereIn('role', ['Persetujuan Tambahan', 'Penandatangan'])->isNotEmpty();

                foreach ($targetStepApprovals as $appr) {
                    $isAdhoc = in_array($appr->role, ['Persetujuan Tambahan', 'Penandatangan']);
                    $apprStatus = ($hasAdhoc && ! $isAdhoc) ? 'waiting' : 'pending';

                    $appr->update([
                        'workflow_step_id' => $step->id,
                        'sequence' => $targetStepNum,
                        'step_number' => $targetStepNum,
                        'status' => $apprStatus,
                        'is_current_step' => true,
                        'is_active' => true,
                        'decided_at' => null,
                        'comment' => null,
                        'action_id' => null,
                        'action_code' => null,
                        'action_alias' => null,
                        'due_at' => $stageSla['stage_deadline'],
                        'sla_hours' => $stageSla['stage_hours'],
                    ]);
                }
            } else {
                // No existing approval records for target step: create new
                $this->approvalLifecycleService->createApprovalForStep($contract, $step);
            }

            // Deduplicate regular approvals if any duplicates exist for same user + step
            $duplicates = Approval::where('contract_id', $contract->id)
                ->where('workflow_step_id', $step->id)
                ->where('approver_type', '!=', 'adhoc')
                ->orderBy('created_at', 'desc')
                ->get()
                ->groupBy('user_id');

            foreach ($duplicates as $userId => $records) {
                if ($records->count() > 1) {
                    $toDelete = $records->slice(1);
                    Approval::whereIn('id', $toDelete->pluck('id'))->delete();
                }
            }
        } else {
            // Case B: Switching to a completely different workflow
            Approval::where('contract_id', $contract->id)
                ->whereIn('status', ['pending', 'waiting'])
                ->delete();

            $this->approvalLifecycleService->createApprovalForStep($contract, $step);
        }

        // 3. Log audit trail history
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
