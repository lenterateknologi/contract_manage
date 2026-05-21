<?php

namespace App\Services;

use App\Models\Approval;
use App\Models\Contract;
use App\Models\ContractStatus;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowStep;
use App\Services\Traits\EvaluatesWorkflowSteps;
use Illuminate\Support\Facades\Auth;

class ContractWorkflowService
{
    use EvaluatesWorkflowSteps;

    protected SLAService $slaService;

    protected ContractWorkflowQueryService $queryService;

    public function __construct(SLAService $slaService, ContractWorkflowQueryService $queryService)
    {
        $this->slaService = $slaService;
        $this->queryService = $queryService;
    }

    public function sendForApproval(Contract $contract, ?string $workflowId = null, ?array $customSteps = null, bool $submit = false): Contract
    {

        $metadata = request()->input('metadata', []);
        $topic = $metadata['topic'] ?? ($contract->metadata['topic'] ?? 'perjanjian');
        $now = now();

        $workflow = null;
        if ($workflowId) {
            $workflow = Workflow::find($workflowId);
        }

        if (! $workflow) {
            $taxRequired = $metadata['tax_required'] ?? ($contract->metadata['tax_required'] ?? false);
            $typeStr = $contract->contract_type ?: ($contract->contractType ? $contract->contractType->code : 'General');
            $workflow = Workflow::getDefaultByContractType($typeStr, (bool) $taxRequired);
        }

        if (! $workflow) {
            throw new \Exception('Alur kerja tidak ditemukan dan tidak ada alur default untuk tipe kontrak ini.');
        }

        $originWorkflowId = $contract->origin_workflow_id ?: $workflow->id;

        if (strtolower($topic) === 'nda') {
            $contract->update([
                'status' => 'archived',
                'workflow_id' => $workflow->id,
                'origin_workflow_id' => $originWorkflowId,
                'workflow_step_id' => null,
                'submitted_at' => now(),
            ]);

            $contract->histories()->create([
                'action' => 'CONTRACT_ARCHIVED',
                'description' => 'NDA Langsung diarsipkan (Recording Only)',
                'actor_id' => Auth::id(),
            ]);

            return $contract->fresh();
        }

        $draftingHours = $workflow->sla_drafting_hours ?: 72;
        $totalHours = $workflow->sla_total_hours ?: 240;
        $cutoffHour = $workflow->sla_cutoff_hour ?: 16;

        $draftingDeadline = $this->slaService->calculateBusinessDeadline($now, $draftingHours, $cutoffHour);
        $totalDeadline = null;
        if (strtolower($topic) !== 'review') {
            $totalDeadline = $this->slaService->calculateBusinessDeadline($now, $totalHours, $cutoffHour);
        }

        $metadata = array_merge($contract->metadata ?? [], $metadata, [
            'tax_required' => $metadata['tax_required'] ?? ($contract->metadata['tax_required'] ?? false),
            'topic' => $topic,
            'drafting_deadline' => $draftingDeadline->toIso8601String(),
            'total_deadline' => $totalDeadline ? $totalDeadline->toIso8601String() : null,
            'current_phase' => 'drafting',
        ]);

        $contract->update(['metadata' => $metadata]);
        $contract = $contract->fresh();

        $contract->approvals()->delete();

        $firstStep = $workflow->steps()->orderBy('step')->first();

        while ($firstStep) {

            if (! $this->shouldExecuteStep($contract, $firstStep)) {
                $firstStep = $this->findNextValidStep($contract, $firstStep);

                continue;
            }

            break;
        }

        if (! $firstStep) {
            throw new \Exception('Tidak ada tahapan alur kerja yang valid untuk permintaan ini.');
        }

        $statusStr = ($firstStep->meta && isset($firstStep->meta['target_status']) && ! empty($firstStep->meta['target_status']))
            ? $firstStep->meta['target_status']
            : ($firstStep->step === 1 ? 'draft' : 'in_review');
        $nextStatus = ContractStatus::where('code', $statusStr)->first();

        $contract->update([
            'workflow_id' => $workflow->id,
            'origin_workflow_id' => $originWorkflowId,
            'workflow_step_id' => $firstStep->id,
            'status_id' => $nextStatus?->id ?: $contract->status_id,
            'status' => $nextStatus?->code ?: $statusStr,
            'submitted_at' => $firstStep->step === 1 ? $contract->submitted_at : now(),
        ]);

        $this->createApprovalForStep($contract, $firstStep);

        if ($contract->initiated_by_id && $contract->initiated_by_id !== $contract->created_by) {
            if ($contract->initiator) {

            }
        }

        $this->queryService->logHistory($contract, 'CONTRACT_SENT', 'Kontrak dikirim untuk persetujuan', Auth::id());

        $this->handleAutoApproval($contract, Auth::user());

        if ($submit && $firstStep->step === 1 && $contract->status === 'draft') {
            $approval = $contract->approvals()->where('workflow_step_id', $firstStep->id)->first();
            if ($approval) {
                $contract = $this->approveContract($contract, $approval, 'Kontrak dikirim', null, null, null);
            }
        }

        return $contract->fresh();
    }

    /**
     * Create approval records for a workflow step
     */
    public function createApprovalForStep(Contract $contract, WorkflowStep $step): void
    {

        $roles = (array) $step->role;
        $lowerRoles = array_map('strtolower', $roles);
        $approvers = collect();

        // Rule 1: CEO/MD Approver Replacement
        if (in_array('ceo', $lowerRoles) || in_array('md', $lowerRoles)) {
            $initiatorDeptId = $contract->initiator?->department_id;
            if ($initiatorDeptId) {
                $approvers = User::where(\Illuminate\Support\Facades\DB::raw('LOWER(role)'), 'vp')
                    ->where('department_id', $initiatorDeptId)
                    ->where('is_active', true)
                    ->get();
            }
            if ($approvers->isEmpty()) {
                $approvers = User::where(\Illuminate\Support\Facades\DB::raw('LOWER(role)'), 'vp')
                    ->where('is_active', true)
                    ->get();
            }
            $roles = ['VP'];
            $lowerRoles = ['vp'];
        }

        if ($step->step_category === 'joint_upload') {
            $metadata = $contract->metadata ?? [];
            $order = $metadata['step_12_order'] ?? null;
            $finished = $metadata['step_12_finished'] ?? [];

            if ($order) {
                $remaining = array_diff($order, $finished);
                if (! empty($remaining)) {
                    $nextActorKey = array_values($remaining)[0];
                    if ($nextActorKey === 'initiator') {
                        $approvers = collect([$contract->initiator]);
                        $roles = ['Initiator'];
                    } else {

                        $picId = $metadata['assigned_pic_id'] ?? null;
                        $pic = $picId ? User::find($picId) : null;
                        $approvers = $pic ? collect([$pic]) : collect();
                        $roles = ['Staff Legal'];
                    }
                }
            }
        }

        if ($step->step_category === 'signing') {
            $metadata = $contract->metadata ?? [];
            $signing = $metadata['signing_state'] ?? ['phase' => 'SETUP', 'progress' => 0];
            $phase = $signing['phase'] ?? 'SETUP';

            if ($phase === 'SETUP') {
                if ($step->approver_type === 'assigned_pic' && $contract->assigned_pic_id) {
                    $pic = User::find($contract->assigned_pic_id);
                    $approvers = $pic ? collect([$pic]) : collect();
                } else {

                    $query = User::whereIn('role', ['Staff Legal', 'Admin']);
                    if ($step->department_id) {
                        $query->where('department_id', $step->department_id);
                    }
                    $approvers = $query->get();
                }
                $roles = ['Staff Legal (Setup)'];
            } elseif ($phase === 'P1_PENDING') {
                $p1UserId = $signing['p1_user_id'] ?? null;
                $approvers = $p1UserId ? collect([User::find($p1UserId)]) : collect();
                $roles = ['Pihak 1'];
            } elseif ($phase === 'P2_PENDING') {
                $p2UserId = $signing['p2_user_id'] ?? null;
                $approvers = $p2UserId ? collect([User::find($p2UserId)]) : collect();
                $roles = ['Pihak 2'];
            }
        }

        if ($approvers->isEmpty()) {
            if ($step->approver_type === 'atasan') {

                $approvers = $this->queryService->resolveHierarchyApprover($contract, $step->hierarchy_level ?: 1);
            } elseif ($step->approver_type === 'user') {
                $approvers = $step->users;
            } elseif ($step->approver_type === 'initiator' || in_array('initiator', $lowerRoles)) {

                $approvers = collect([$contract->initiator]);
            } else {

                $metadata = $contract->metadata ?? [];
                $picId = $contract->assigned_pic_id ?? ($metadata['assigned_pic_id'] ?? null);

                if ($step->approver_type === 'assigned_pic' && $picId) {
                    $pic = User::find($picId);
                    if ($pic) {
                        $approvers = collect([$pic]);
                    }
                }

                if ($approvers->isEmpty()) {

                    $query = User::whereIn('role', $roles);

                    $targetDeptIds = ! empty($step->department_ids) ? $step->department_ids : ($step->department_id ? [$step->department_id] : []);

                    if (! empty($targetDeptIds)) {
                        $query->whereIn('department_id', $targetDeptIds);
                    }

                    $approvers = $query->get();

                    if ($approvers->isEmpty()) {
                        $approvers = User::whereIn('role', $roles)->get();
                    }
                }
            }
        }

        foreach ($approvers as $approver) {
            Approval::create([
                'contract_id' => $contract->id,
                'workflow_step_id' => $step->id,
                'user_id' => $approver->id,
                'approver_name' => $approver->name,
                'role' => count($roles) > 0 ? $roles[0] : 'Approver',
                'job_title' => $approver->job_title ?? null,
                'status' => 'pending',
                'created_by' => Auth::id(),
                'updated_by' => Auth::id(),
                'sequence' => $step->step,
            ]);
        }
    }

    /**
     * Approve a contract (handles approval and moves to next step if all approved)
     */
    public function approveContract(Contract $contract, Approval $approval, ?string $comment = null, ?string $attachmentPath = null, ?string $assignedPicId = null, ?string $executionOrder = null, ?string $actionCode = 'approve'): Contract
    {

        if (! in_array($approval->status, ['pending', 'waiting'])) {
            return $contract;
        }

        $isRoleBased = $approval->workflowStep->approver_type === 'role';

        if ($isRoleBased) {
            $alreadyApproved = $contract->approvals()
                ->where('workflow_step_id', $approval->workflow_step_id)
                ->where('status', 'approved')
                ->exists();

            if ($alreadyApproved) {

                $approval->delete();

                return $contract;
            }
        }

        $approval->approve($comment, $attachmentPath);

        $this->queryService->logHistory($contract, 'APPROVAL_APPROVED', "Disetujui oleh {$approval->approver_name} ({$approval->role})", Auth::id());

        if ($assignedPicId) {
            $metadata = $contract->metadata ?? [];
            $metadata['assigned_pic_id'] = $assignedPicId;
            $metadata['assigned_by_id'] = Auth::id();

            $contract->update([
                'assigned_pic_id' => $assignedPicId,
                'assigned_by_id' => Auth::id(),
                'metadata' => $metadata,
            ]);

            $pic = User::find($assignedPicId);
            $this->queryService->logHistory($contract, 'WORKFLOW_ASSIGNED', 'PIC ditugaskan ke: ' . ($pic ? $pic->name : $assignedPicId), Auth::id());
        }

        $currentStepApprovals = $contract->approvals()
            ->where('workflow_step_id', $approval->workflow_step_id)
            ->get();

        $isRoleBased = $approval->workflowStep->approver_type === 'role';

        $allApproved = $isRoleBased
            ? $currentStepApprovals->contains(fn ($a) => $a->status === 'approved')
            : $currentStepApprovals->every(fn ($a) => $a->status === 'approved');

        if ($approval->workflowStep->step_category === 'joint_upload') {
            $metadata = $contract->metadata ?? [];

            if (! isset($metadata['step_12_order'])) {
                $order = $executionOrder ?? 'legal_first';
                $metadata['step_12_order'] = ($order === 'initiator_first') ? ['initiator', 'legal'] : ['legal', 'initiator'];
                $metadata['step_12_finished'] = [];

                if ($order === 'legal_first') {
                    $metadata['step_12_finished'][] = 'legal';
                }

                $contract->update(['metadata' => $metadata]);
                $this->queryService->logHistory($contract, 'WORKFLOW_ORDER_SET', 'Urutan penyelesaian diatur: ' . ($order === 'initiator_first' ? 'Inisiator dulu' : 'Legal dulu'), Auth::id());

                $remaining = array_diff($metadata['step_12_order'], $metadata['step_12_finished']);
                if (! empty($remaining)) {
                    $this->createApprovalForStep($contract, $approval->workflowStep);

                    return $contract->fresh();
                }
            } else {

                $isInitiator = $approval->user_id === $contract->initiated_by_id;
                $actorKey = $isInitiator ? 'initiator' : 'legal';

                $finished = $metadata['step_12_finished'] ?? [];
                $finished[] = $actorKey;
                $metadata['step_12_finished'] = array_unique($finished);
                $contract->update(['metadata' => $metadata]);

                $remaining = array_diff($metadata['step_12_order'], $metadata['step_12_finished']);
                if (! empty($remaining)) {
                    $this->createApprovalForStep($contract, $approval->workflowStep);

                    return $contract->fresh();
                }
            }

            $allApproved = true;
        }

        if ($approval->workflowStep->step_category === 'signing') {
            $metadata = $contract->metadata ?? [];
            $signing = $metadata['signing_state'] ?? ['phase' => 'SETUP', 'progress' => 0];
            $phase = $signing['phase'] ?? 'SETUP';

            if ($phase === 'SETUP') {

                $p1UserId = request()->input('p1_user_id');
                $p2UserId = request()->input('p2_user_id');

                $signing['phase'] = 'P1_PENDING';
                $signing['p1_user_id'] = $p1UserId;
                $signing['p2_user_id'] = $p2UserId;
                $signing['progress'] = 0;
                $signing['setup_at'] = now()->toIso8601String();
                $signing['setup_by'] = Auth::id();

                $metadata['signing_state'] = $signing;
                $contract->update(['metadata' => $metadata]);

                $p1 = User::find($p1UserId);
                $p2 = User::find($p2UserId);
                $this->queryService->logHistory($contract, 'SIGNING_SETUP', "Delegasi Penandatanganan: P1 ({$p1?->name}) & P2 ({$p2?->name})", Auth::id());

                $this->createApprovalForStep($contract, $approval->workflowStep);

                return $contract->fresh();
            } elseif ($phase === 'P1_PENDING') {

                $signing['phase'] = 'P2_PENDING';
                $signing['progress'] = 50;
                $signing['p1_finished_at'] = now()->toIso8601String();

                $metadata['signing_state'] = $signing;
                $contract->update(['metadata' => $metadata]);

                $this->queryService->logHistory($contract, 'SIGNING_P1_COMPLETE', 'Pihak 1 telah mengunggah dokumen ttd (Progres 50%)', Auth::id());

                $this->createApprovalForStep($contract, $approval->workflowStep);

                return $contract->fresh();
            } elseif ($phase === 'P2_PENDING') {

                $signing['phase'] = 'COMPLETED';
                $signing['progress'] = 100;
                $signing['p2_finished_at'] = now()->toIso8601String();

                $metadata['signing_state'] = $signing;
                $contract->update(['metadata' => $metadata]);

                $this->queryService->logHistory($contract, 'SIGNING_COMPLETED', 'Penandatanganan selesai (Progres 100%)', Auth::id());

                $allApproved = true;
            }
        }

        if ($allApproved) {

            if ($isRoleBased) {
                $contract->approvals()
                    ->where('workflow_step_id', $approval->workflow_step_id)
                    ->whereIn('status', ['pending', 'waiting'])
                    ->delete();
            }

            $isLegalStep = str_contains(strtolower($approval->role), 'legal') ||
                          str_contains(strtolower($approval->workflowStep?->description ?? ''), 'legal');

            if ($isLegalStep) {
                $metadata = $contract->metadata ?? [];
                $metadata['current_phase'] = 'agreement';
                $metadata['drafting_finished_at'] = now()->toIso8601String();
                $contract->update(['metadata' => $metadata]);
            }

            $actionCode = $actionCode ?? 'approve';
            $stepAction = $approval->workflowStep->actions()
                ->whereHas('masterAction', function ($query) use ($actionCode) {
                    $query->where('code', $actionCode);
                })->first();

            // Apply autofill fields
            if ($stepAction && ! empty($stepAction->autofilled_fields)) {
                $metadata = $contract->metadata ?? [];
                foreach ($stepAction->autofilled_fields as $field) {
                    $metadata[$field] = now()->toIso8601String();
                }
                $contract->update(['metadata' => $metadata]);
            }

            // Determine next step
            $nextStep = null;
            if ($stepAction) {
                if ($stepAction->next_workflow_id) {
                    // Cross-workflow transition!
                    $contract->update(['workflow_id' => $stepAction->next_workflow_id]);
                    if ($stepAction->next_workflow_step_id) {
                        $nextStep = WorkflowStep::find($stepAction->next_workflow_step_id);
                    } else {
                        $nextStep = WorkflowStep::where('workflow_id', $stepAction->next_workflow_id)
                            ->orderBy('step')
                            ->first();
                    }
                } elseif ($stepAction->next_step_id) {
                    $nextStep = WorkflowStep::find($stepAction->next_step_id);
                } else {
                    $nextStep = $this->findNextValidStep($contract, $approval->workflowStep);
                }
            } else {
                $nextStep = $this->findNextValidStep($contract, $approval->workflowStep);
            }

            if ($nextStep) {
                $statusStr = ($nextStep->meta && isset($nextStep->meta['target_status']) && ! empty($nextStep->meta['target_status']))
                    ? $nextStep->meta['target_status']
                    : null;

                if (! $statusStr) {
                    $statusStr = 'in_review';
                    if ($nextStep->step_category === 'signing') {
                        $statusStr = 'locked';
                    } elseif ($nextStep->step === 1) {
                        $statusStr = 'draft';
                    }
                }
                $nextStatus = ContractStatus::where('code', $statusStr)->first();

                $contract->update([
                    'workflow_step_id' => $nextStep->id,
                    'status_id' => $nextStatus?->id ?: $contract->status_id,
                    'status' => $nextStatus?->code ?: $statusStr,
                ]);

                $this->createApprovalForStep($contract, $nextStep);

                $this->queryService->logHistory($contract, 'WORKFLOW_ADVANCED', "Alur kerja berlanjut ke tahap {$nextStep->step}: {$nextStep->description}", Auth::id());

                $this->handleAutoApproval($contract, Auth::user());
            } else {
                $archivedStatus = ContractStatus::where('code', 'archived')->first();
                if ($approval->workflowStep->step_category === 'closing' && $archivedStatus) {
                    $contract->update([
                        'status_id' => $archivedStatus->id,
                        'status' => $archivedStatus->code,
                        'workflow_step_id' => null,
                    ]);
                    $this->queryService->logHistory($contract, 'CONTRACT_COMPLETED', 'Alur kerja selesai (Arsip).', Auth::id());
                } else {
                    $approvedStatus = ContractStatus::where('code', 'approved')->first();
                    $contract->update([
                        'status' => 'approved',
                        'status_id' => $approvedStatus?->id,
                        'workflow_step_id' => null,
                    ]);
                    $this->queryService->logHistory($contract, 'CONTRACT_APPROVED', 'Seluruh persetujuan selesai. Kontrak disetujui.', Auth::id());
                }
            }
        }

        return $contract->fresh();
    }

    /**
     * Reject a contract and move it back to drafting/revision
     */
    public function rejectContract(Contract $contract, Approval $approval, string $reason, ?string $attachmentPath = null): Contract
    {

        $approval->reject($reason, $attachmentPath);

        Approval::where('contract_id', $contract->id)
            ->where('workflow_step_id', $approval->workflow_step_id)
            ->where('status', 'pending')
            ->delete();

        // Look up custom reject action config
        $stepAction = $approval->workflowStep->actions()
            ->whereHas('masterAction', function ($query) {
                $query->where('code', 'reject');
            })->first();

        $targetStep = null;
        if ($stepAction) {
            if ($stepAction->next_workflow_id) {
                $contract->update(['workflow_id' => $stepAction->next_workflow_id]);
                if ($stepAction->next_workflow_step_id) {
                    $targetStep = WorkflowStep::find($stepAction->next_workflow_step_id);
                } else {
                    $targetStep = WorkflowStep::where('workflow_id', $stepAction->next_workflow_id)
                        ->orderBy('step')
                        ->first();
                }
            } elseif ($stepAction->next_step_id) {
                $targetStep = WorkflowStep::find($stepAction->next_step_id);
            }
        }

        if (! $targetStep) {
            $targetStep = WorkflowStep::where('workflow_id', $contract->workflow_id)
                ->where('step', 1)
                ->first();
        }

        $description = "Rejected by {$approval->approver_name} ({$approval->role}): {$reason}.";

        $statusStr = ($targetStep && $targetStep->meta && isset($targetStep->meta['target_status']) && ! empty($targetStep->meta['target_status']))
            ? $targetStep->meta['target_status']
            : 'revision';
        $revisionStatus = ContractStatus::where('code', $statusStr)->first();
        $contract->update([
            'status' => $revisionStatus?->code ?: $statusStr,
            'status_id' => $revisionStatus?->id,
            'workflow_step_id' => $targetStep ? $targetStep->id : null,
        ]);

        $description .= $targetStep
            ? " Sent back to step {$targetStep->step}: {$targetStep->description}."
            : ' Sent back to Initiator for revision.';

        $contract->approvals()
            ->where('workflow_step_id', $approval->workflow_step_id)
            ->where('status', 'pending')
            ->get()
            ->each(fn ($a) => $a->reject('Ditolak oleh ' . $approval->approver_name));

        $this->queryService->logHistory($contract, 'APPROVAL_REJECTED', $description, Auth::id());

        return $contract->fresh();
    }

    // ─── Backward-compatible delegation wrappers (used by external callers) ────

    public function getAvailableWorkflows(User $user, ?string $contractType = null)
    {
        return $this->queryService->getAvailableWorkflows($user, $contractType);
    }

    public function resolveHierarchyApprover(Contract $contract, int $level = 1)
    {
        return $this->queryService->resolveHierarchyApprover($contract, $level);
    }
}
