<?php

namespace App\Services\Workflow;

use App\Models\Master\WorkflowStep;
use App\Models\Transaction\Approval;
use App\Models\Transaction\Contract;
use Illuminate\Support\Facades\Auth;

class StepApprovalLifecycleService
{
    public function __construct(
        protected StepAuthorityResolver $authorityResolver,
        protected SLAService $slaService,
        protected WorkflowQueryService $queryService,
    ) {}

    /**
     * Create approval records for a workflow step.
     */
    public function createApprovalForStep(Contract $contract, WorkflowStep $step): void
    {
        $res = $this->authorityResolver->resolveApproversForStep($contract, $step);
        $approvers = $res['approvers'];
        $roles = $res['roles'];

        $hasAdhoc = Approval::where('contract_id', $contract->id)
            ->where('workflow_step_id', $step->id)
            ->whereIn('role', ['Persetujuan Tambahan', 'Penandatangan'])
            ->whereIn('status', ['pending', 'waiting'])
            ->exists();

        $initialStatus = $hasAdhoc ? 'waiting' : 'pending';

        // When entering a new approval session for this step, archive/deactivate prior decided records
        $hasPendingWaitingRegular = Approval::where('contract_id', $contract->id)
            ->where('workflow_step_id', $step->id)
            ->whereNotIn('role', ['Persetujuan Tambahan', 'Penandatangan', 'Pihak 1', 'Pihak 2'])
            ->whereIn('status', ['pending', 'waiting'])
            ->exists();

        if (! $hasPendingWaitingRegular) {
            Approval::where('contract_id', $contract->id)
                ->where('workflow_step_id', $step->id)
                ->whereNotIn('role', ['Persetujuan Tambahan', 'Penandatangan', 'Pihak 1', 'Pihak 2'])
                ->whereIn('status', ['approved', 'rejected'])
                ->update(['is_active' => false]);
        }

        // Stale pending/waiting approver cleanup: remove regular approvals for users who are no longer approvers for this step
        $approverUserIds = $approvers->pluck('id')->filter()->toArray();
        if (! empty($approverUserIds)) {
            Approval::where('contract_id', $contract->id)
                ->where('workflow_step_id', $step->id)
                ->whereNotIn('role', ['Persetujuan Tambahan', 'Penandatangan', 'Pihak 1', 'Pihak 2'])
                ->whereIn('status', ['pending', 'waiting'])
                ->whereNotIn('user_id', $approverUserIds)
                ->delete();
        }

        $stageSla = $this->slaService->resolveStageSla($contract, $contract->status, now());
        $stageDueAt = $stageSla['stage_deadline'] ?? null;
        $stageHours = $stageSla['stage_hours'] ?? null;

        foreach ($approvers as $approver) {
            // Guard: skip if a non-adhoc pending/waiting approval for this user+step already exists
            $existing = Approval::where('contract_id', $contract->id)
                ->where('workflow_step_id', $step->id)
                ->where('user_id', $approver->id)
                ->whereNotIn('role', ['Persetujuan Tambahan', 'Penandatangan', 'Pihak 1', 'Pihak 2'])
                ->whereIn('status', ['pending', 'waiting'])
                ->first();

            if ($existing) {
                if ($hasAdhoc && $existing->status === 'pending') {
                    $existing->update(['status' => 'waiting', 'due_at' => $stageDueAt, 'sla_hours' => $stageHours]);
                } elseif (! $hasAdhoc && $existing->status === 'waiting') {
                    $existing->update(['status' => 'pending', 'due_at' => $stageDueAt, 'sla_hours' => $stageHours]);
                }

                continue;
            }

            Approval::create([
                'contract_id' => $contract->id,
                'workflow_id' => $step->workflow_id,
                'workflow_step_id' => $step->id,
                'user_id' => $approver->id,
                'approver_name' => $approver->name,
                'role' => count($roles) > 0 ? $roles[0] : ($step->step_category === 'signing' ? 'Staff Legal (Setup)' : 'Approver'),
                'job_title' => $approver->job_title ?? null,
                'approver_type' => $step->approver_type ?? 'role',
                'status' => $initialStatus,
                'created_by' => Auth::id(),
                'updated_by' => Auth::id(),
                'sequence' => $step->step,
                'step_number' => $step->step,
                'is_active' => true,
                'is_current_step' => true,
                'batch_no' => $contract->workflow_iteration ?? 1,
                'is_adhoc' => false,
                'due_at' => $stageDueAt,
                'sla_hours' => $stageHours,
                'is_overdue' => false,
            ]);
        }

        if ($hasAdhoc) {
            $hasPendingAdhoc = Approval::where('contract_id', $contract->id)
                ->where('workflow_step_id', $step->id)
                ->whereIn('role', ['Persetujuan Tambahan', 'Penandatangan'])
                ->where('status', 'pending')
                ->exists();

            if (! $hasPendingAdhoc) {
                $metadata = $contract->metadata ?? [];
                $isSequential = $metadata['adhoc_steps'][$step->id]['is_sequential'] ?? false;

                if (! $isSequential && isset($metadata['adhoc_steps']) && is_array($metadata['adhoc_steps'])) {
                    foreach ($metadata['adhoc_steps'] as $k => $adhocCfg) {
                        if ((string) $k === (string) $step->id && ! empty($adhocCfg['is_sequential'])) {
                            $isSequential = true;
                            break;
                        }
                    }
                }

                if ($isSequential) {
                    $firstWaitingAdhoc = Approval::where('contract_id', $contract->id)
                        ->where('workflow_step_id', $step->id)
                        ->whereIn('role', ['Persetujuan Tambahan', 'Penandatangan'])
                        ->where('status', 'waiting')
                        ->orderBy('sort_order')
                        ->orderBy('sub_step')
                        ->first();

                    if ($firstWaitingAdhoc) {
                        $firstWaitingAdhoc->update(['status' => 'pending']);
                        $label = $firstWaitingAdhoc->role === 'Penandatangan' ? 'Penandatanganan' : 'Persetujuan tambahan';
                        $this->queryService->logHistory($contract, 'APPROVAL_PENDING', "{$label} berurutan aktif untuk: {$firstWaitingAdhoc->approver_name}", Auth::id());
                    }
                } else {
                    $waitingAdhocs = Approval::where('contract_id', $contract->id)
                        ->where('workflow_step_id', $step->id)
                        ->whereIn('role', ['Persetujuan Tambahan', 'Penandatangan'])
                        ->where('status', 'waiting')
                        ->get();

                    foreach ($waitingAdhocs as $adhoc) {
                        $adhoc->update(['status' => 'pending']);
                    }

                    if ($waitingAdhocs->isNotEmpty()) {
                        $names = $waitingAdhocs->pluck('approver_name')->implode(', ');
                        $this->queryService->logHistory($contract, 'APPROVAL_PENDING', "Persetujuan tambahan serentak aktif untuk: {$names}", Auth::id());
                    }
                }
            }
        }
    }

    /**
     * Activate the next set of approvers in a sequential or ad-hoc process.
     */
    public function activateNextApprovers(Contract $contract, Approval $approval): void
    {
        if (in_array($approval->role, ['Persetujuan Tambahan', 'Penandatangan', 'Pihak 1', 'Pihak 2'])) {
            $nextApprovalQuery = Approval::where('contract_id', $contract->id)
                ->where('workflow_step_id', $approval->workflow_step_id)
                ->where('is_active', true)
                ->where('status', 'waiting');

            if ($approval->role === 'Persetujuan Tambahan') {
                $nextApprovalQuery->where('role', 'Persetujuan Tambahan');
            } else {
                $nextApprovalQuery->whereIn('role', ['Penandatangan', 'Pihak 1', 'Pihak 2']);
            }

            $nextApproval = $nextApprovalQuery->orderBy('sub_step')
                ->orderBy('sort_order')
                ->first();

            if ($nextApproval) {
                $nextApproval->update(['status' => 'pending']);
                $this->queryService->logHistory($contract, 'APPROVAL_PENDING', "Proses {$approval->role} dialihkan ke orang berikutnya: {$nextApproval->approver_name}", Auth::id());

                return;
            }
        }

        if (in_array($approval->role, ['Persetujuan Tambahan', 'Penandatangan', 'Pihak 1', 'Pihak 2'])) {
            $hasRemainingSequential = Approval::where('contract_id', $contract->id)
                ->where('workflow_step_id', $approval->workflow_step_id)
                ->whereIn('role', ['Persetujuan Tambahan', 'Penandatangan', 'Pihak 1', 'Pihak 2'])
                ->whereIn('status', ['pending', 'waiting'])
                ->exists();

            if (! $hasRemainingSequential) {
                $regularApprovalsToActivate = Approval::where('contract_id', $contract->id)
                    ->where('workflow_step_id', $approval->workflow_step_id)
                    ->whereNotIn('role', ['Persetujuan Tambahan', 'Penandatangan', 'Pihak 1', 'Pihak 2'])
                    ->where('status', 'waiting')
                    ->get();

                foreach ($regularApprovalsToActivate as $ra) {
                    $ra->update(['status' => 'pending']);
                }

                if ($regularApprovalsToActivate->isNotEmpty()) {
                    $this->queryService->logHistory($contract, 'APPROVAL_PENDING', 'Seluruh persetujuan tambahan / penandatanganan selesai. Persetujuan tahap utama kini aktif.', Auth::id());
                }
            }
        }
    }
}
