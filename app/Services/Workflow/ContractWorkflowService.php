<?php

namespace App\Services\Workflow;

use App\Enums\WorkflowAction;
use App\Models\Approval;
use App\Models\Contract;
use App\Models\ContractStatus;
use App\Models\ContractVersion;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowStep;
use App\Models\WorkflowStepAction;
use App\Services\Workflow\Concerns\EvaluatesWorkflowSteps;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ContractWorkflowService
{
    use EvaluatesWorkflowSteps;

    public function __construct(
        protected SLAService $slaService,
        protected WorkflowQueryService $queryService
    ) {}

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

        $originWorkflowId = $contract->origin_workflow_id ?: $workflow->id;

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

        $statusStr = ($firstStep->meta && isset($firstStep->meta['target_status']) && ! empty($firstStep->meta['target_status']))
            ? $firstStep->meta['target_status']
            : ($firstStep->step === 1 ? 'draft' : 'in_review');
        $nextStatus = ContractStatus::where('code', $statusStr)->first();

        $contract->update([
            'workflow_id' => $workflow->id,
            'origin_workflow_id' => $originWorkflowId,
            'workflow_step_id' => $firstStep->id,
            'status' => $nextStatus?->code ?: $statusStr,
            'submitted_at' => $firstStep->step === 1 ? $contract->submitted_at : now(),
        ]);

        $this->createApprovalForStep($contract, $firstStep);

        $this->queryService->logHistory($contract, 'CONTRACT_SENT', 'Kontrak dikirim untuk persetujuan', Auth::id());

        return $contract->fresh();
    }

    /**
     * Create approval records for a workflow step.
     */
    public function createApprovalForStep(Contract $contract, WorkflowStep $step): void
    {
        $roles = (array) $step->role;
        $lowerRoles = array_map('strtolower', $roles);
        $approvers = collect();

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
            if ($step->approver_type === 'assigned_pic' && $contract->assigned_pic_id) {
                $pic = User::find($contract->assigned_pic_id);
                $approvers = $pic ? collect([$pic]) : collect();
            } else {
                $query = User::whereIn('role', ['Staff Legal', 'Admin']);
                $targetDeptIds = ! empty($step->department_ids) ? $step->department_ids : [];
                if (! empty($targetDeptIds)) {
                    $query->whereIn('department_id', $targetDeptIds);
                }
                $approvers = $query->get();
            }
            $roles = ['Staff Legal (Setup)'];
        }

        if ($approvers->isEmpty()) {
            if ($step->approver_type === 'atasan') {
                $approvers = $this->queryService->resolveHierarchyApprover($contract, $step);
            } elseif ($step->approver_type === 'user') {
                $approvers = $step->users()->get();
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
                    $targetDeptIds = $step->department_ids ?? [];

                    if ($step->filter_department) {
                        $query->where('department_id', $contract->initiator->department_id ?? '00000000-0000-0000-0000-000000000000');
                    } elseif (! empty($targetDeptIds)) {
                        $query->whereIn('department_id', $targetDeptIds);
                    }

                    $initiatorCompany = $contract->initiator->company;
                    if ($step->filter_company_group || $step->filter_region) {
                        $query->whereHas('company', function ($q) use ($step, $initiatorCompany) {
                            if ($step->filter_company_group) {
                                $groupId = $initiatorCompany?->company_group_id ?? '00000000-0000-0000-0000-000000000000';
                                $q->where('company_group_id', $groupId);
                            }
                            if ($step->filter_region) {
                                $regionId = $initiatorCompany?->region_id ?? '00000000-0000-0000-0000-000000000000';
                                $q->where('region_id', $regionId);
                            }
                        });
                    }

                    if ($step->filter_company) {
                        $query->where('company_id', $contract->initiator->company_id ?? '00000000-0000-0000-0000-000000000000');
                    }

                    $approvers = $query->get();
                }
            }
        }

        $hasAdhoc = Approval::where('contract_id', $contract->id)
            ->where('workflow_step_id', $step->id)
            ->whereIn('role', ['Persetujuan Tambahan', 'Penandatangan'])
            ->whereIn('status', ['pending', 'waiting'])
            ->exists();

        $initialStatus = $hasAdhoc ? 'waiting' : 'pending';

        foreach ($approvers as $approver) {
            Approval::create([
                'contract_id' => $contract->id,
                'workflow_step_id' => $step->id,
                'user_id' => $approver->id,
                'approver_name' => $approver->name,
                'role' => count($roles) > 0 ? $roles[0] : 'Approver',
                'job_title' => $approver->job_title ?? null,
                'status' => $initialStatus,
                'created_by' => Auth::id(),
                'updated_by' => Auth::id(),
                'sequence' => $step->step,
                'is_active' => true,
            ]);
        }

        if ($hasAdhoc) {
            $metadata = $contract->metadata ?? [];
            $isSequential = $metadata['adhoc_steps'][$step->id]['is_sequential'] ?? false;

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

    /**
     * Approve a contract and move to next step if conditions are met.
     */
    public function approveContract(Contract $contract, Approval $approval, ?string $comment = null, ?string $attachmentPath = null, ?string $assignedPicId = null, ?string $executionOrder = null, string|WorkflowAction $actionCode = WorkflowAction::APPROVE, ?string $targetStepId = null, $signerUserIdsParam = null): Contract
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
            $alreadyApproved = $contract->approvals()
                ->where('workflow_step_id', $approval->workflow_step_id)
                ->where('role', '!=', 'Persetujuan Tambahan')
                ->where('status', 'approved')
                ->exists();

            if ($alreadyApproved) {
                $approval->delete();

                return $contract;
            }
        }

        $isSigningSetup = ($approval->workflowStep->step_category === 'signing' || in_array(strtolower($actionCode), ['signature', 'sign'])) &&
            $approval->sub_step === null &&
            (! empty($signerUserIdsParam) || request()->has('signer_user_ids'));

        if ($isSigningSetup) {
            return $this->handleSigningSetup($contract, $approval, $actionCode, $comment, $signerUserIdsParam, $targetStepId);
        }

        $approval->approve($comment, $attachmentPath);
        $this->queryService->logHistory($contract, 'APPROVAL_APPROVED', "Disetujui oleh {$approval->approver_name} ({$approval->role})", Auth::id());

        $this->activateNextApprovers($contract, $approval);

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
            $this->queryService->logHistory($contract, 'WORKFLOW_ASSIGNED', 'PIC ditugaskan ke: '.($pic ? $pic->name : $assignedPicId), Auth::id());
        }

        $currentStepApprovals = $contract->approvals()
            ->where('workflow_step_id', $approval->workflow_step_id)
            ->where('is_active', true)
            ->get();

        $regularApprovals = $currentStepApprovals->filter(fn (Approval $a) => ! in_array($a->role, ['Persetujuan Tambahan', 'Penandatangan', 'Pihak 1', 'Pihak 2']));
        $adhocApprovals = $currentStepApprovals->filter(fn (Approval $a) => $a->role === 'Persetujuan Tambahan');
        $signerApprovals = $currentStepApprovals->filter(fn (Approval $a) => in_array($a->role, ['Penandatangan', 'Pihak 1', 'Pihak 2']));

        $adhocApproved = $adhocApprovals->isEmpty() || $adhocApprovals->every(fn (Approval $a) => $a->status === 'approved');
        $signersApproved = $signerApprovals->isEmpty() || $signerApprovals->every(fn (Approval $a) => $a->status === 'approved');

        if ($regularApprovals->isEmpty()) {
            $regularApproved = true;
        } else {
            $regularApproved = $isRoleBased
                ? $regularApprovals->contains(fn (Approval $a) => $a->status === 'approved')
                : $regularApprovals->every(fn (Approval $a) => $a->status === 'approved');
        }

        $allApproved = $adhocApproved && $signersApproved && $regularApproved;

        if ($approval->workflowStep->step_category === 'joint_upload') {
            $jointApproved = $this->handleJointUpload($contract, $approval, $executionOrder);
            if (! $jointApproved) {
                return $contract->fresh();
            }
            $allApproved = true;
        }

        $isSignerRole = in_array($approval->role, ['Penandatangan', 'Pihak 1', 'Pihak 2']);
        $isSigningCategory = $approval->workflowStep->step_category === 'signing';
        $isSigningAction = in_array(strtolower($actionCode), ['sign', 'signature']);

        if ($isSigningCategory || $isSignerRole || $isSigningAction) {
            $this->handleSigningCompletion($contract, $approval, $attachmentPath);
        }

        if ($allApproved) {
            $this->handleWorkflowTransition($contract, $approval, $actionCode);
        }

        return $contract->fresh();
    }

    /**
     * Handle setup for signing process (adding signers as sequential sub-steps)
     */
    private function handleSigningSetup(Contract $contract, Approval $approval, string $actionCode, ?string $comment = null, $signerUserIdsParam = null, ?string $targetStepId = null): Contract
    {
        $signerUserIds = $signerUserIdsParam ?: request()->input('signer_user_ids', []);
        if (! is_array($signerUserIds)) {
            $signerUserIds = $signerUserIds ? [$signerUserIds] : [];
        }

        if (count($signerUserIds) > 0) {
            $signingAction = $approval->workflowStep->actions->filter(function ($act) use ($actionCode) {
                $code = $act->action_code instanceof WorkflowAction ? $act->action_code->value : ($act->action_code ?? $act->masterAction?->code);

                return strtolower((string) $code) === strtolower($actionCode) || in_array(strtolower((string) $code), ['signature', 'sign']);
            })->first();

            $targetStepId = $targetStepId ?: (request()->input('target_step_id') ?: ($signingAction?->assignee_config['signature_target_step'] ?? $approval->workflow_step_id));
            $targetStep = $targetStepId == $approval->workflow_step_id ? $approval->workflowStep : WorkflowStep::find($targetStepId);
            $targetSequence = $targetStep->step ?? $approval->workflowStep->step;
            $currentSequence = $approval->workflowStep->step;

            $initialStatus = ($targetSequence <= $currentSequence) ? 'pending' : 'waiting';
            $allSigners = [];

            foreach ($signerUserIds as $index => $id) {
                $user = User::find($id);
                if ($user) {
                    $maxSort = Approval::where('contract_id', $contract->id)->where('workflow_step_id', $targetStepId)->max('sort_order') ?: 0;
                    $maxSubStep = Approval::where('contract_id', $contract->id)->where('workflow_step_id', $targetStepId)->whereNotNull('sub_step')->max('sub_step') ?: 0;

                    $role = (request()->has('p1_user_id') || request()->has('p2_user_id')) ? (($index === 0) ? 'Pihak 1' : 'Pihak 2') : 'Penandatangan';

                    Approval::create([
                        'contract_id' => $contract->id,
                        'workflow_step_id' => $targetStepId,
                        'user_id' => $user->id,
                        'approver_name' => $user->name,
                        'role' => $role,
                        'status' => empty($allSigners) ? $initialStatus : 'waiting',
                        'sequence' => $targetSequence,
                        'sub_step' => $maxSubStep + 1,
                        'sort_order' => $maxSort + 1,
                        'is_active' => true,
                        'created_by' => Auth::id(),
                        'updated_by' => Auth::id(),
                    ]);
                    $allSigners[] = $user->name;
                }
            }

            $this->queryService->logHistory($contract, 'SIGNING_SETUP', 'Delegasi Penandatanganan: '.implode(', ', $allSigners), Auth::id());

            if ($targetStepId === $contract->workflow_step_id) {
                $contract->approvals()
                    ->where('workflow_step_id', $targetStepId)
                    ->whereNotIn('role', ['initiator', 'Penandatangan', 'Persetujuan Tambahan', 'Pihak 1', 'Pihak 2'])
                    ->where('status', 'pending')
                    ->update(['status' => 'waiting']);

                $approval->update(['status' => 'waiting', 'comment' => $comment]);
            } else {
                $approval->update(['comment' => $comment]);
            }

            return $contract->fresh();
        }

        return $contract;
    }

    /**
     * Activate the next set of approvers in a sequential or ad-hoc process.
     */
    private function activateNextApprovers(Contract $contract, Approval $approval): void
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

            $nextApproval = $nextApprovalQuery->orderBy('sort_order')
                ->orderBy('sub_step')
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

    /**
     * Handle logic when a signing approval is completed.
     */
    private function handleSigningCompletion(Contract $contract, Approval $approval, ?string $attachmentPath = null): void
    {
        $metadata = $contract->metadata ?? [];
        $metadata["signer_{$approval->id}_downloaded_at"] = now()->toIso8601String();
        $contract->update(['metadata' => $metadata]);

        if ($attachmentPath) {
            $lastVersion = ContractVersion::where('contract_id', $contract->id)->where('document_type', 'agreement')->max('version_no') ?? 0;
            $versionNo = $lastVersion + 1;
            $ext = pathinfo($attachmentPath, PATHINFO_EXTENSION) ?: 'docx';
            $newPath = 'contracts/'.$contract->id.'/agreements/'."agreement_v{$versionNo}.{$ext}";

            Storage::disk('local')->makeDirectory('contracts/'.$contract->id.'/agreements');
            Storage::disk('local')->copy($attachmentPath, $newPath);

            ContractVersion::create([
                'contract_id' => $contract->id,
                'document_type' => 'agreement',
                'version_no' => $versionNo,
                'file_name' => "agreement_v{$versionNo}.{$ext}",
                'file_path' => $newPath,
                'change_log' => in_array($approval->role, ['Pihak 1', 'Pihak 2']) ? "Dokumen ditandatangani {$approval->role}" : "Dokumen ditandatangani oleh {$approval->approver_name}",
                'uploaded_by' => Auth::id(),
            ]);

            $contract->update(['current_version' => $versionNo]);
        }

        $this->queryService->logHistory($contract, 'SIGNING_STEP_COMPLETE', "Penandatanganan selesai oleh {$approval->approver_name}", Auth::id());
    }

    /**
     * Handle joint upload logic for steps that require both initiator and legal to finish.
     */
    private function handleJointUpload(Contract $contract, Approval $approval, ?string $executionOrder = null): bool
    {
        $metadata = $contract->metadata ?? [];

        if (! isset($metadata['step_12_order'])) {
            $order = $executionOrder ?? 'legal_first';
            $metadata['step_12_order'] = ($order === 'initiator_first') ? ['initiator', 'legal'] : ['legal', 'initiator'];
            $metadata['step_12_finished'] = [];
            if ($order === 'legal_first') {
                $metadata['step_12_finished'][] = 'legal';
            }
            $contract->update(['metadata' => $metadata]);
            $this->queryService->logHistory($contract, 'WORKFLOW_ORDER_SET', 'Urutan penyelesaian diatur: '.($order === 'initiator_first' ? 'Inisiator dulu' : 'Legal dulu'), Auth::id());

            if (! empty(array_diff($metadata['step_12_order'], $metadata['step_12_finished']))) {
                $this->createApprovalForStep($contract, $approval->workflowStep);

                return false;
            }
        } else {
            $actorKey = ($approval->user_id === $contract->initiated_by_id) ? 'initiator' : 'legal';
            $finished = $metadata['step_12_finished'] ?? [];
            $finished[] = $actorKey;
            $metadata['step_12_finished'] = array_unique($finished);
            $contract->update(['metadata' => $metadata]);

            if (! empty(array_diff($metadata['step_12_order'], $metadata['step_12_finished']))) {
                $this->createApprovalForStep($contract, $approval->workflowStep);

                return false;
            }
        }

        return true;
    }

    /**
     * Handle workflow transition to the next step.
     */
    private function handleWorkflowTransition(Contract $contract, Approval $approval, string $actionCode): void
    {
        $isRoleBased = $approval->workflowStep->approver_type === 'role';
        if ($isRoleBased) {
            $contract->approvals()->where('workflow_step_id', $approval->workflow_step_id)->where('role', '!=', 'Persetujuan Tambahan')->whereIn('status', ['pending', 'waiting'])->delete();
        }

        if (str_contains(strtolower($approval->role), 'legal') || str_contains(strtolower($approval->workflowStep->description ?? ''), 'legal')) {
            $metadata = $contract->metadata ?? [];
            $metadata['current_phase'] = 'agreement';
            $metadata['drafting_finished_at'] = now()->toIso8601String();
            $contract->update(['metadata' => $metadata]);
        }

        $stepAction = $approval->workflowStep->actions()->where('action_code', $actionCode)->first();
        if ($stepAction && ! empty($stepAction->autofilled_fields)) {
            $metadata = $contract->metadata ?? [];
            foreach ($stepAction->autofilled_fields as $field) {
                $metadata[$field] = now()->toIso8601String();
            }
            $contract->update(['metadata' => $metadata]);
        }

        $nextStep = $stepAction ? $this->evaluateTransition($contract, $approval->workflowStep, $stepAction) : null;
        while ($nextStep && ! $this->shouldExecuteStep($contract, $nextStep)) {
            $nextStep = $this->findNextValidStep($contract, $nextStep);
        }

        if (! $nextStep) {
            $nextStep = $this->findNextValidStep($contract, $approval->workflowStep);
        }

        if ($nextStep) {
            $statusStr = $nextStep->meta['target_status'] ?? ($nextStep->step_category === 'signing' ? 'locked' : ($nextStep->step === 1 ? 'draft' : 'in_review'));
            $nextStatus = ContractStatus::where('code', $statusStr)->first();

            $contract->update([
                'workflow_step_id' => $nextStep->id,
                'status' => $nextStatus?->code ?: $statusStr,
            ]);

            $this->createApprovalForStep($contract, $nextStep);
            $this->handleAutoApproval($contract, Auth::user());
            $this->queryService->logHistory($contract, 'WORKFLOW_ADVANCED', "Alur kerja berlanjut ke tahap {$nextStep->step}: {$nextStep->description}", Auth::id());
        } else {
            $archivedStatus = ContractStatus::where('code', 'archived')->first();
            if ($approval->workflowStep->step_category === 'closing' && $archivedStatus) {
                $contract->update(['status' => $archivedStatus->code, 'workflow_step_id' => null]);
                $this->queryService->logHistory($contract, 'CONTRACT_COMPLETED', 'Alur kerja selesai (Arsip).', Auth::id());
            } else {
                $approvedStatus = ContractStatus::where('code', 'approved')->first();
                $contract->update(['status' => 'approved', 'workflow_step_id' => null]);
                $this->queryService->logHistory($contract, 'CONTRACT_APPROVED', 'Seluruh persetujuan selesai. Kontrak disetujui.', Auth::id());
            }
        }
    }

    /**
     * Reject a contract and move it back to drafting/revision.
     */
    public function rejectContract(Contract $contract, Approval $approval, string $reason, ?string $attachmentPath = null): Contract
    {
        $approval->reject($reason, $attachmentPath);

        Approval::where('contract_id', $contract->id)
            ->where('workflow_step_id', $approval->workflow_step_id)
            ->where('status', 'pending')
            ->delete();

        $stepAction = $approval->workflowStep->actions()->where('action_code', 'reject')->first();
        $targetStep = $stepAction ? $this->evaluateTransition($contract, $approval->workflowStep, $stepAction) : WorkflowStep::where('workflow_id', $contract->workflow_id)->where('step', 1)->first();

        $statusStr = $targetStep->meta['target_status'] ?? 'revision';
        $revisionStatus = ContractStatus::where('code', $statusStr)->first();

        $contract->update([
            'status' => $revisionStatus?->code ?: $statusStr,
            'workflow_step_id' => $targetStep ? $targetStep->id : null,
        ]);

        $description = "Rejected by {$approval->approver_name} ({$approval->role}): {$reason}. ".($targetStep ? "Sent back to step {$targetStep->step}: {$targetStep->description}." : 'Sent back to Initiator for revision.');

        $contract->approvals()->where('workflow_step_id', $approval->workflow_step_id)->where('status', 'pending')->get()->each(fn (Approval $a) => $a->reject('Ditolak oleh '.$approval->approver_name));

        $this->queryService->logHistory($contract, 'APPROVAL_REJECTED', $description, Auth::id());

        return $contract->fresh();
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
        $transition = $stepAction->transition_config;

        if (is_array($transition) && isset($transition['type'])) {
            switch ($transition['type']) {
                case 'relative':
                    $offset = (int) ($transition['offset'] ?? 1);
                    if ($offset === 1) {
                        return $this->findNextValidStep($contract, $currentStep);
                    } elseif ($offset > 1) {
                        $targetSequence = $currentStep->step + $offset;
                        $allSteps = WorkflowStep::where('workflow_id', $contract->workflow_id)->where('step', '>=', $targetSequence)->orderBy('step')->get();
                        foreach ($allSteps as $step) {
                            if ($this->shouldExecuteStep($contract, $step)) {
                                return $step;
                            }
                        }

                        return null;
                    } elseif ($offset < 0) {
                        $targetSequence = max(1, $currentStep->step + $offset);

                        return WorkflowStep::where('workflow_id', $contract->workflow_id)->where('step', '<=', $targetSequence)->orderBy('step', 'desc')->first();
                    }

                    break;

                case 'absolute':
                    $targetSequence = max(1, (int) ($transition['sequence'] ?? 1));

                    return WorkflowStep::where('workflow_id', $contract->workflow_id)->where('step', $targetSequence)->first();

                case 'cross_workflow':
                    $workflowId = $transition['workflow_id'] ?? null;
                    if ($workflowId) {
                        $contract->update(['workflow_id' => $workflowId]);
                        $targetSequence = max(1, (int) ($transition['sequence'] ?? 1));

                        return WorkflowStep::where('workflow_id', $workflowId)->where('step', $targetSequence)->first();
                    }

                    break;
            }
        }

        if ($stepAction->next_workflow_id) {
            $contract->update(['workflow_id' => $stepAction->next_workflow_id]);

            return $stepAction->next_workflow_step_id ? WorkflowStep::find($stepAction->next_workflow_step_id) : WorkflowStep::where('workflow_id', $stepAction->next_workflow_id)->orderBy('step')->first();
        }

        return $stepAction->next_step_id ? WorkflowStep::find($stepAction->next_step_id) : null;
    }
}
