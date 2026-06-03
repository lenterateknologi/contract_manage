<?php

namespace App\Services;

use App\Enums\WorkflowAction;
use App\Models\Approval;
use App\Models\Contract;
use App\Models\ContractStatus;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowStep;
use App\Models\WorkflowStepAction;
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
            $taxRequired = (bool) ($metadata['tax_required'] ?? ($contract->metadata['tax_required'] ?? false));
            $typeStr = $contract->contract_type_id ?: ($contract->contractType?->code ?? 'General');

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
            'status' => $nextStatus?->code ?: $statusStr,
            'submitted_at' => $firstStep->step === 1 ? $contract->submitted_at : now(),
        ]);

        $this->createApprovalForStep($contract, $firstStep);

        if ($contract->initiated_by_id && $contract->initiated_by_id !== $contract->created_by) {
            if ($contract->initiator) {

            }
        }

        $this->queryService->logHistory($contract, 'CONTRACT_SENT', 'Kontrak dikirim untuk persetujuan', Auth::id());

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

                    if ($step->filter_department && $contract->initiator?->department_id) {
                        $query->where('department_id', $contract->initiator->department_id);
                    } elseif (! empty($targetDeptIds)) {
                        $query->whereIn('department_id', $targetDeptIds);
                    }

                    $initiatorCompany = $contract->initiator?->company;

                    if ($step->filter_company_group && $initiatorCompany?->company_group_id) {
                        $companyGroupId = $initiatorCompany->company_group_id;
                        $query->whereHas('company', function ($q) use ($companyGroupId) {
                            $q->where('company_group_id', $companyGroupId);
                        });
                    }
                    if ($step->filter_region && $initiatorCompany?->region_id) {
                        $regionId = $initiatorCompany->region_id;
                        $query->whereHas('company', function ($q) use ($regionId) {
                            $q->where('region_id', $regionId);
                        });
                    }
                    if ($step->filter_company && $contract->initiator?->company_id) {
                        $query->where('company_id', $contract->initiator->company_id);
                    }

                    $approvers = $query->get();
                }
            }
        }

        // 2. Determine initial status for regular approvers:
        // If there are ANY ad-hoc approvers (Persetujuan Tambahan) or Signers for this step,
        // regular approvers must WAIT until they are finished.
        $hasAdhoc = Approval::where('contract_id', $contract->id)
            ->where('workflow_step_id', $step->id)
            ->whereIn('role', ['Persetujuan Tambahan', 'Pihak 1', 'Pihak 2'])
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

        // 3. Activate ad-hoc approvals for this step if they are in 'waiting' status
        if ($hasAdhoc) {
            $metadata = $contract->metadata ?? [];
            $isSequential = $metadata['adhoc_steps'][$step->id]['is_sequential'] ?? false;

            if ($isSequential) {
                // Activate only the first waiting ad-hoc approval
                $firstWaitingAdhoc = Approval::where('contract_id', $contract->id)
                    ->where('workflow_step_id', $step->id)
                    ->where('role', 'Persetujuan Tambahan')
                    ->where('status', 'waiting')
                    ->orderBy('sort_order')
                    ->first();

                if ($firstWaitingAdhoc) {
                    $firstWaitingAdhoc->update(['status' => 'pending']);
                    $this->queryService->logHistory(
                        $contract,
                        'APPROVAL_PENDING',
                        "Persetujuan tambahan berurutan aktif untuk: {$firstWaitingAdhoc->approver_name}",
                        Auth::id(),
                    );
                }
            } else {
                // Activate all waiting ad-hoc approvals
                $waitingAdhocs = Approval::where('contract_id', $contract->id)
                    ->where('workflow_step_id', $step->id)
                    ->where('role', 'Persetujuan Tambahan')
                    ->where('status', 'waiting')
                    ->get();

                foreach ($waitingAdhocs as $adhoc) {
                    $adhoc->update(['status' => 'pending']);
                }

                if ($waitingAdhocs->isNotEmpty()) {
                    $names = $waitingAdhocs->pluck('approver_name')->implode(', ');
                    $this->queryService->logHistory(
                        $contract,
                        'APPROVAL_PENDING',
                        "Persetujuan tambahan serentak aktif untuk: {$names}",
                        Auth::id(),
                    );
                }
            }
        }
    }

    /**
     * Approve a contract (handles approval and moves to next step if all approved)
     */
    public function approveContract(Contract $contract, Approval $approval, ?string $comment = null, ?string $attachmentPath = null, ?string $assignedPicId = null, ?string $executionOrder = null, string|WorkflowAction $actionCode = WorkflowAction::APPROVE, ?string $targetStepId = null, $p1UserIdsParam = null, $p2UserIdsParam = null): Contract
    {
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
            (! empty($p1UserIdsParam) || ! empty($p2UserIdsParam) || request()->has('p1_user_id') || request()->has('p2_user_id'));

        if ($isSigningSetup) {
            $p1UserIds = $p1UserIdsParam ?: request()->input('p1_user_id', []);
            $p2UserIds = $p2UserIdsParam ?: request()->input('p2_user_id', []);

            if (! is_array($p1UserIds)) {
                $p1UserIds = $p1UserIds ? [$p1UserIds] : [];
            }
            if (! is_array($p2UserIds)) {
                $p2UserIds = $p2UserIds ? [$p2UserIds] : [];
            }

            if (count($p1UserIds) > 0 || count($p2UserIds) > 0) {
                $signingAction = $approval->workflowStep->actions->filter(function ($act) use ($actionCode) {
                    $code = $act->action_code;
                    if ($code instanceof WorkflowAction) {
                        $code = $code->value;
                    }
                    $code = $code ?? $act->masterAction?->code;

                    $actionCodeStr = $actionCode;
                    if ($actionCodeStr instanceof WorkflowAction) {
                        $actionCodeStr = $actionCodeStr->value;
                    }

                    $codeStr = is_string($code) ? $code : '';
                    $actionCodeStr = is_string($actionCodeStr) ? $actionCodeStr : '';

                    return strtolower($codeStr) === strtolower($actionCodeStr) || in_array(strtolower($codeStr), ['signature', 'sign']);
                })->first();

                $targetStepId = $targetStepId ?: request()->input('target_step_id');
                $targetStepId = $targetStepId ?: ($signingAction?->assignee_config['signature_target_step'] ?? $approval->workflow_step_id);

                $targetStep = $targetStepId == $approval->workflow_step_id
                                ? $approval->workflowStep
                                : WorkflowStep::find($targetStepId);

                $targetSequence = $targetStep->step ?? $approval->workflowStep->step;
                $currentSequence = $approval->workflowStep->step;

                // Determine initial status based on whether it's a current or future step
                $initialStatus = ($targetSequence <= $currentSequence) ? 'pending' : 'waiting';
                $allSigners = [];

                // Helper function to create signer
                $createSigner = function ($userIds, $statusFallback) use ($contract, $targetStepId, $initialStatus, $targetSequence, &$allSigners) {
                    foreach ($userIds as $id) {
                        $user = User::find($id);
                        if ($user) {
                            $maxSort = Approval::where('contract_id', $contract->id)
                                ->where('workflow_step_id', $targetStepId)
                                ->max('sort_order') ?: 0;

                            $maxSubStep = Approval::where('contract_id', $contract->id)
                                ->where('workflow_step_id', $targetStepId)
                                ->whereNotNull('sub_step')
                                ->max('sub_step') ?: 0;

                            $newSubStep = $maxSubStep + 1;

                            Approval::create([
                                'contract_id' => $contract->id,
                                'workflow_step_id' => $targetStepId,
                                'user_id' => $user->id,
                                'approver_name' => $user->name,
                                'role' => 'Penandatangan',
                                'status' => empty($allSigners) ? $initialStatus : $statusFallback,
                                'sequence' => $targetSequence,
                                'sub_step' => $newSubStep,
                                'sort_order' => $maxSort + 1,
                                'is_active' => true,
                                'created_by' => Auth::id(),
                                'updated_by' => Auth::id(),
                            ]);
                            $allSigners[] = $user->name;
                        }
                    }
                };

                // Process P1 and P2 (we maintain P1/P2 distinction just for sequential vs parallel logic if needed, but treat them uniformly as 'Penandatangan')
                $createSigner($p1UserIds, 'pending');
                $createSigner($p2UserIds, count($p1UserIds) > 0 ? 'waiting' : 'pending');

                $logMsg = 'Delegasi Penandatanganan: ' . implode(', ', $allSigners);
                $this->queryService->logHistory($contract, 'SIGNING_SETUP', $logMsg, Auth::id());

                // IMPORTANT: Only update current step approvals to 'waiting' if we are actually in that step
                if ($targetStepId === $contract->workflow_step_id) {
                    $contract->approvals()
                        ->where('workflow_step_id', $targetStepId)
                        ->whereNotIn('role', ['initiator', 'Penandatangan', 'Pihak 1', 'Pihak 2', 'Persetujuan Tambahan'])
                        ->where('status', 'pending')
                        ->update(['status' => 'waiting']);

                    $approval->update([
                        'status' => 'waiting',
                        'comment' => $comment,
                    ]);
                } else {
                    // If inserting into a future step, just update the setup-comment on the current approval but keep it pending
                    $approval->update([
                        'comment' => $comment,
                    ]);
                }

                return $contract->fresh();
            }
        }

        $approval->approve($comment, $attachmentPath);

        $this->queryService->logHistory($contract, 'APPROVAL_APPROVED', "Disetujui oleh {$approval->approver_name} ({$approval->role})", Auth::id());

        // Sequential Approvals: Trigger next one if any
        if (in_array($approval->role, ['Persetujuan Tambahan', 'Pihak 1', 'Pihak 2'])) {
            $nextApproval = Approval::where('contract_id', $contract->id)
                ->where('workflow_step_id', $approval->workflow_step_id)
                ->where(function ($q) use ($approval) {
                    if ($approval->role === 'Persetujuan Tambahan') {
                        $q->where('role', 'Persetujuan Tambahan');
                    } else {
                        $q->whereIn('role', ['Pihak 1', 'Pihak 2']);
                    }
                })
                ->where('is_active', true)
                ->where('status', 'waiting')
                ->orderBy('sort_order')
                ->first();

            if ($nextApproval) {
                $nextApproval->update(['status' => 'pending']);
                $logMsg = $approval->role === 'Persetujuan Tambahan'
                    ? "Persetujuan dialihkan ke approver tambahan berikutnya: {$nextApproval->approver_name}"
                    : "Pihak 1 selesai mengunggah. Giliran Pihak 2 ({$nextApproval->approver_name}) aktif.";
                $this->queryService->logHistory($contract, 'APPROVAL_PENDING', $logMsg, Auth::id());
            } else {
                if (in_array($approval->role, ['Persetujuan Tambahan', 'Pihak 1', 'Pihak 2'])) {
                    // All adhoc/signers finished for this step, now ACTIVATE regular approvers
                    $regularApprovalsToActivate = Approval::where('contract_id', $contract->id)
                        ->where('workflow_step_id', $approval->workflow_step_id)
                        ->whereNotIn('role', ['Persetujuan Tambahan', 'Pihak 1', 'Pihak 2'])
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
            ->where('is_active', true)
            ->get();

        $regularApprovals = $currentStepApprovals->filter(fn ($a) => $a->role !== 'Persetujuan Tambahan');
        $adhocApprovals = $currentStepApprovals->filter(fn ($a) => $a->role === 'Persetujuan Tambahan');

        $isRoleBased = $approval->workflowStep->approver_type === 'role';

        $adhocApproved = $adhocApprovals->every(fn ($a) => $a->status === 'approved');

        if ($regularApprovals->isEmpty()) {
            $regularApproved = true;
        } else {
            $regularApproved = $isRoleBased
                ? $regularApprovals->contains(fn ($a) => $a->status === 'approved')
                : $regularApprovals->every(fn ($a) => $a->status === 'approved');
        }

        $allApproved = $adhocApproved && $regularApproved;

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
            if ($approval->role === 'Pihak 1') {
                $metadata = $contract->metadata ?? [];
                $metadata['p1_downloaded_at'] = now()->toIso8601String();
                $contract->update(['metadata' => $metadata]);

                if ($attachmentPath) {
                    $lastVersion = $contract->versions()
                        ->where('document_type', 'agreement')
                        ->max('version_no') ?? 0;
                    $versionNo = $lastVersion + 1;
                    $ext = pathinfo($attachmentPath, PATHINFO_EXTENSION) ?: 'docx';
                    $newPath = 'contracts/' . $contract->id . '/agreements/' . "agreement_v{$versionNo}.{$ext}";

                    \Illuminate\Support\Facades\Storage::disk('local')->makeDirectory('contracts/' . $contract->id . '/agreements');
                    \Illuminate\Support\Facades\Storage::disk('local')->copy($attachmentPath, $newPath);

                    \App\Models\ContractVersion::create([
                        'contract_id' => $contract->id,
                        'document_type' => 'agreement',
                        'version_no' => $versionNo,
                        'file_name' => "agreement_v{$versionNo}.{$ext}",
                        'file_path' => $newPath,
                        'change_log' => 'Dokumen ditandatangani Pihak 1',
                        'uploaded_by' => Auth::id(),
                    ]);
                }

                $this->queryService->logHistory($contract, 'SIGNING_P1_COMPLETE', 'Pihak 1 telah mengunggah dokumen ttd (Progres 50%)', Auth::id());
                // Pihak 2 will be activated automatically by the sequential logic
            } elseif ($approval->role === 'Pihak 2') {
                $metadata = $contract->metadata ?? [];
                $metadata['p2_downloaded_at'] = now()->toIso8601String();
                $contract->update(['metadata' => $metadata]);

                if ($attachmentPath) {
                    $lastVersion = $contract->versions()
                        ->where('document_type', 'agreement')
                        ->max('version_no') ?? 0;
                    $versionNo = $lastVersion + 1;
                    $ext = pathinfo($attachmentPath, PATHINFO_EXTENSION) ?: 'docx';
                    $newPath = 'contracts/' . $contract->id . '/agreements/' . "agreement_v{$versionNo}.{$ext}";

                    \Illuminate\Support\Facades\Storage::disk('local')->makeDirectory('contracts/' . $contract->id . '/agreements');
                    \Illuminate\Support\Facades\Storage::disk('local')->copy($attachmentPath, $newPath);

                    \App\Models\ContractVersion::create([
                        'contract_id' => $contract->id,
                        'document_type' => 'agreement',
                        'version_no' => $versionNo,
                        'file_name' => "agreement_v{$versionNo}.{$ext}",
                        'file_path' => $newPath,
                        'change_log' => 'Dokumen ditandatangani Pihak 2',
                        'uploaded_by' => Auth::id(),
                    ]);
                }

                $this->queryService->logHistory($contract, 'SIGNING_COMPLETED', 'Penandatanganan selesai oleh Pihak 2 (Progres 100%)', Auth::id());
            }
        }

        if ($allApproved) {

            if ($isRoleBased) {
                $contract->approvals()
                    ->where('workflow_step_id', $approval->workflow_step_id)
                    ->where('role', '!=', 'Persetujuan Tambahan')
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
                ->where('action_code', $actionCode)
                ->first();

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
                $nextStep = $this->evaluateTransition($contract, $approval->workflowStep, $stepAction);
            }
            if (! $nextStep) {
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
                    'status' => $nextStatus?->code ?: $statusStr,
                ]);

                $this->createApprovalForStep($contract, $nextStep);

                $this->queryService->logHistory($contract, 'WORKFLOW_ADVANCED', "Alur kerja berlanjut ke tahap {$nextStep->step}: {$nextStep->description}", Auth::id());
            } else {
                $archivedStatus = ContractStatus::where('code', 'archived')->first();
                if ($approval->workflowStep->step_category === 'closing' && $archivedStatus) {
                    $contract->update([
                        'status' => $archivedStatus->code,
                        'workflow_step_id' => null,
                    ]);
                    $this->queryService->logHistory($contract, 'CONTRACT_COMPLETED', 'Alur kerja selesai (Arsip).', Auth::id());
                } else {
                    $approvedStatus = ContractStatus::where('code', 'approved')->first();
                    $contract->update([
                        'status' => 'approved',
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
            ->where('action_code', 'reject')
            ->first();

        $targetStep = null;
        if ($stepAction) {
            $targetStep = $this->evaluateTransition($contract, $approval->workflowStep, $stepAction);
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

    public function getAvailableWorkflows(?User $user, ?string $contractType = null)
    {
        return $this->queryService->getAvailableWorkflows($user, $contractType);
    }

    public function resolveHierarchyApprover(Contract $contract, WorkflowStep|int $stepOrLevel = 1)
    {
        return $this->queryService->resolveHierarchyApprover($contract, $stepOrLevel);
    }

    public function evaluateTransition(Contract $contract, WorkflowStep $currentStep, WorkflowStepAction $stepAction): ?WorkflowStep
    {
        $transition = is_string($stepAction->transition_config)
            ? json_decode($stepAction->transition_config, true)
            : $stepAction->transition_config;

        if (is_array($transition) && isset($transition['type'])) {
            switch ($transition['type']) {
                case 'relative':
                    $offset = (int) ($transition['offset'] ?? 1);
                    if ($offset === 1) {
                        return $this->findNextValidStep($contract, $currentStep);
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

                case 'absolute':
                    $targetSequence = max(1, (int) ($transition['sequence'] ?? 1));

                    return WorkflowStep::where('workflow_id', $contract->workflow_id)
                        ->where('step', $targetSequence)
                        ->first();

                case 'cross_workflow':
                    $workflowId = $transition['workflow_id'] ?? null;
                    if ($workflowId) {
                        $contract->update(['workflow_id' => $workflowId]);
                        $targetSequence = max(1, (int) ($transition['sequence'] ?? 1));

                        return WorkflowStep::where('workflow_id', $workflowId)
                            ->where('step', $targetSequence)
                            ->first();
                    }

                    break;
            }
        }

        // Fallback to old behavior
        if ($stepAction->next_workflow_id) {
            $contract->update(['workflow_id' => $stepAction->next_workflow_id]);
            if ($stepAction->next_workflow_step_id) {
                return WorkflowStep::find($stepAction->next_workflow_step_id);
            } else {
                return WorkflowStep::where('workflow_id', $stepAction->next_workflow_id)
                    ->orderBy('step')
                    ->first();
            }
        } elseif ($stepAction->next_step_id) {
            return WorkflowStep::find($stepAction->next_step_id);
        }

        return null;
    }
}
