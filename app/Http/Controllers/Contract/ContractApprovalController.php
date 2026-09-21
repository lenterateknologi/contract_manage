<?php

namespace App\Http\Controllers\Contract;

use App\Http\Actions\Contract\ApproveContractAction;
use App\Http\Actions\Contract\RejectContractAction;
use App\Http\Controllers\Controller;
use App\Http\Formatters\ContractFormatter;
use App\Http\Queries\Contract\ContractDetailQuery;
use App\Http\Requests\Contract\AddAdhocApproverRequest;
use App\Http\Requests\Contract\ApproveContractRequest;
use App\Http\Requests\Contract\BulkApproveContractRequest;
use App\Http\Requests\Contract\RejectContractRequest;
use App\Models\Approval;
use App\Models\Contract;
use App\Models\ContractHistory;
use App\Models\Role;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowStep;
use App\Services\Workflow\ContractWorkflowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ContractApprovalController extends Controller
{
    public function __construct(
        protected ContractWorkflowService $workflowService,
        protected ApproveContractAction $approveAction,
        protected RejectContractAction $rejectAction,
        protected ContractDetailQuery $contractDetailQuery,
    ) {}

    public function send(Request $request, string $id): JsonResponse
    {
        try {
            $contract = $this->contractDetailQuery->find($id);

            if ($contract->status !== 'draft') {
                return response()->json(['message' => 'Hanya kontrak berstatus draft yang dapat dikirim.'], 422);
            }

            $workflowId = $request->input('workflow_id');
            $customSteps = $request->input('custom_steps');

            // Use workflow service to send for approval
            $contract = $this->workflowService->sendForApproval($contract, $workflowId, $customSteps, true);

            return response()->json(ContractFormatter::formatContract($contract->fresh()), 200);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function assignPic(Request $request, string $id): JsonResponse
    {
        $contract = $this->contractDetailQuery->find($id);

        $request->validate([
            'assigned_pic_id' => 'required|uuid|exists:m_users,id',
            'note' => 'nullable|string',
        ]);

        $picId = $request->input('assigned_pic_id');
        $note = $request->input('note');
        $actionCode = $request->input('action_code') ?: 'assign_pic';
        $requestActionId = $request->input('action_id') ?: $request->input('step_action_id');

        $currentStep = $contract->workflowStep;
        $stepAction = null;
        if ($currentStep) {
            if ($requestActionId && \Illuminate\Support\Str::isUuid($requestActionId)) {
                $stepAction = $currentStep->actions()->where('id', $requestActionId)->first();
            }
            if (! $stepAction) {
                $stepAction = $currentStep->actions()->where(function ($q) use ($actionCode) {
                    $q->where('action_code', $actionCode)
                      ->orWhereIn('action_code', ['assign', 'assign_pic', 'approve']);
                })->first();
            }

            if ($stepAction) {
                // Validate required fields on assign action
                $this->workflowService->validateRequiredFields($contract, $currentStep, $stepAction, $picId);

                // Apply autofilled fields if configured on the assign action
                if (! empty($stepAction->autofilled_fields)) {
                    $this->workflowService->applyAutofilledFields($contract, $stepAction->autofilled_fields);
                }
            }
        }

        $actorId = Auth::id() ?: $contract->created_by;
        $now = now();

        $metadata = $contract->metadata ?? [];
        $metadata['assigned_pic_id'] = $picId;
        $metadata['assigned_by_id'] = $actorId;
        $metadata['assigned_at'] = $now->toIso8601String();
        $metadata['pic_assigned_at'] = $now->toIso8601String();
        if ($note) {
            $metadata['assigned_pic_note'] = $note;
        }

        $contract->update([
            'assigned_pic_id' => $picId,
            'assigned_by_id' => $actorId,
            'assigned_at' => $now,
            'metadata' => $metadata,
        ]);

        // Process attachments if any
        $filesToProcess = [];
        if ($request->hasFile('attachments')) {
            $filesToProcess = $request->file('attachments');
        } elseif ($request->hasFile('attachment')) {
            $filesToProcess = [$request->file('attachment')];
        }
        foreach ($filesToProcess as $file) {
            if (! $file) continue;
            $path = $file->store("contracts/{$contract->id}/assignments", 'local');
            $contract->attachments()->create([
                'label' => $file->getClientOriginalName(),
                'category' => 'Lampiran',
                'file_name' => $file->getClientOriginalName(),
                'file_path' => $path,
                'file_type' => $file->getClientOriginalExtension() ?: 'file',
                'uploaded_by' => $actorId,
            ]);
        }

        $pic = User::find($picId);

        // Update any active/pending/waiting approvals for assigned_pic step so the new PIC receives the task
        $picApprovals = Approval::where('contract_id', $contract->id)
            ->whereIn('status', ['pending', 'waiting'])
            ->where(function ($q) {
                $q->where('approver_type', 'assigned_pic')
                    ->orWhere('role', 'PIC Legal')
                    ->orWhere('role', 'Staff Legal');
            })
            ->get();

        foreach ($picApprovals as $appr) {
            $appr->update([
                'user_id' => $pic->id,
                'approver_name' => $pic->name,
            ]);
        }

        $desc = 'PIC ditugaskan ke: '.($pic ? $pic->name : $picId).($note ? " (Catatan: {$note})" : '');
        ContractHistory::create([
            'contract_id' => $contract->id,
            'action' => 'WORKFLOW_ASSIGNED',
            'description' => $desc,
            'actor_id' => $actorId,
        ]);

        return response()->json(ContractFormatter::formatContract($contract->fresh()));
    }

    public function approve(ApproveContractRequest $request, string $id): JsonResponse
    {
        $contract = $this->contractDetailQuery->find($id);

        // Find the pending approval for the current user on the active step (with self-healing if workflow step approver was updated)
        $approvalQuery = Approval::where('contract_id', $id)
            ->where('user_id', Auth::id())
            ->where('status', 'pending');

        if ($contract->workflow_step_id) {
            $approvalQuery->where('workflow_step_id', $contract->workflow_step_id);
        }

        $approval = $approvalQuery->first();

        if (! $approval && $contract->status === 'in_review' && $contract->workflow_step_id && $contract->workflowStep) {
            $this->workflowService->createApprovalForStep($contract, $contract->workflowStep);
            $approval = Approval::where('contract_id', $id)
                ->where('workflow_step_id', $contract->workflow_step_id)
                ->where('user_id', Auth::id())
                ->where('status', 'pending')
                ->first();
        }

        if (! $approval) {
            $actionCode = $request->input('action_code') ?: 'approve';
            $requestActionId = $request->input('action_id') ?: $request->input('step_action_id');
            $isCustomOrBranch = in_array($actionCode, ['branch', 'cross_workflow', 'add_adhoc', 'assign', 'assign_pic'])
                || $requestActionId === 'action_branch'
                || $requestActionId === 'action_adhoc'
                || $requestActionId === 'action_assign_pic';

            $user = Auth::user();
            $isAdmin = in_array($user?->role, ['Admin', 'Super Admin']) || (bool) $user?->is_admin;
            $isActor = $user && ($user->id === $contract->created_by || $user->id === $contract->initiated_by_id || $user->id === $contract->assigned_pic_id);

            if ($isCustomOrBranch || $isAdmin || $isActor) {
                $currentStep = $contract->workflowStep;
                if (! $currentStep && $contract->workflow_step_id) {
                    $currentStep = WorkflowStep::find($contract->workflow_step_id);
                }
                if (! $currentStep && $contract->workflow_id) {
                    $currentStep = WorkflowStep::where('workflow_id', $contract->workflow_id)->orderBy('step')->first();
                }
                if (! $currentStep && $contract->origin_workflow_id) {
                    $currentStep = WorkflowStep::where('workflow_id', $contract->origin_workflow_id)->orderBy('step')->first();
                }
                if (! $currentStep && $contract->contract_type_id) {
                    $wf = Workflow::where('contract_type_id', $contract->contract_type_id)->where('is_active', true)->first();
                    if ($wf) {
                        $currentStep = WorkflowStep::where('workflow_id', $wf->id)->orderBy('step')->first();
                    }
                }
                if (! $currentStep) {
                    $currentStep = WorkflowStep::where('is_active', true)->orderBy('step')->first();
                }

                if ($currentStep) {
                    if (! $contract->workflow_step_id || ! $contract->workflow_id) {
                        $contract->update([
                            'workflow_id' => $contract->workflow_id ?: $currentStep->workflow_id,
                            'workflow_step_id' => $contract->workflow_step_id ?: $currentStep->id,
                        ]);
                        $contract->refresh();
                    }

                    $approval = Approval::create([
                        'contract_id' => $contract->id,
                        'workflow_step_id' => $currentStep->id,
                        'user_id' => $user->id,
                        'approver_name' => $user->name,
                        'role' => $user->role ?: 'User',
                        'status' => 'pending',
                        'sequence' => $currentStep->step,
                        'is_active' => true,
                        'created_by' => $user->id,
                        'updated_by' => $user->id,
                    ]);
                }
            }
        }

        if (! $approval) {
            return response()->json(['message' => 'Tidak ada persetujuan tertunda yang ditemukan untuk Anda.'], 422);
        }


        $attachmentPath = null;
        $filesToProcess = [];
        if ($request->hasFile('attachments')) {
            $filesToProcess = $request->file('attachments');
        } elseif ($request->hasFile('attachment')) {
            $filesToProcess = [$request->file('attachment')];
        }

        
        $isFirst = true;
        foreach ($filesToProcess as $file) {
            if (! $file) continue;
            $path = $file->store("contracts/{$contract->id}/approvals", 'local');
            if ($isFirst) {
                $attachmentPath = $path;
                $approval->attachment_path = $path;
                $isFirst = false;
            }
            $contract->attachments()->create([
                'label' => $file->getClientOriginalName(),
                'category' => 'Lampiran',
                'file_name' => $file->getClientOriginalName(),
                'file_path' => $path,
                'file_type' => $file->getClientOriginalExtension() ?: 'file',
                'uploaded_by' => Auth::id(),
            ]);
        }

        $contract = $this->approveAction->approve(
            $contract,
            $approval,
            $request->note,
            $attachmentPath,
            $request->assigned_pic_id,
            $request->execution_order,
            $request->action_code,
            $request->target_step_id,
            $request->input('action_id'),
        );

        return response()->json(ContractFormatter::formatContract($contract->fresh()));
    }

    public function reject(RejectContractRequest $request, string $id): JsonResponse
    {
        $contract = $this->contractDetailQuery->find($id);

        // Find the pending approval for the current user on the active step (with self-healing if workflow step approver was updated)
        $approvalQuery = Approval::where('contract_id', $id)
            ->where('user_id', Auth::id())
            ->where('status', 'pending');

        if ($contract->workflow_step_id) {
            $approvalQuery->where('workflow_step_id', $contract->workflow_step_id);
        }

        $approval = $approvalQuery->first();

        if (! $approval && $contract->status === 'in_review' && $contract->workflow_step_id && $contract->workflowStep) {
            $this->workflowService->createApprovalForStep($contract, $contract->workflowStep);
            $approval = Approval::where('contract_id', $id)
                ->where('workflow_step_id', $contract->workflow_step_id)
                ->where('user_id', Auth::id())
                ->where('status', 'pending')
                ->first();
        }

        if (! $approval) {
            return response()->json(['message' => 'Tidak ada persetujuan tertunda yang ditemukan untuk Anda.'], 422);
        }

        $attachmentPath = null;
        $filesToProcess = [];
        if ($request->hasFile('attachments')) {
            $filesToProcess = $request->file('attachments');
        } elseif ($request->hasFile('attachment')) {
            $filesToProcess = [$request->file('attachment')];
        }

        $isFirst = true;
        foreach ($filesToProcess as $file) {
            if (! $file) continue;
            $path = $file->store("contracts/{$contract->id}/approvals", 'local');
            if ($isFirst) {
                $attachmentPath = $path;
                $approval->attachment_path = $path;
                $isFirst = false;
            }
            $contract->attachments()->create([
                'label' => $file->getClientOriginalName(),
                'category' => 'Lampiran',
                'file_name' => $file->getClientOriginalName(),
                'file_path' => $path,
                'file_type' => $file->getClientOriginalExtension() ?: 'file',
                'uploaded_by' => Auth::id(),
            ]);
        }

        $contract = $this->rejectAction->execute($contract, $approval, $request->reason, $attachmentPath);

        return response()->json(ContractFormatter::formatContract($contract->fresh()));
    }

    public function bulkApprove(BulkApproveContractRequest $request): JsonResponse
    {
        if (! $this->approveAction->checkBulkPermission('can_bulk_approve')) {
            return response()->json(['message' => 'Anda tidak memiliki izin untuk aksi massal ini.'], 403);
        }

        $ids = $request->input('ids');
        $note = $request->input('note');

        $count = $this->approveAction->bulkApprove($ids, $note);

        return response()->json(['message' => "$count kontrak berhasil disetujui."]);
    }

    public function getNextStep(Contract $contract): ?WorkflowStep
    {
        if (! $contract->workflowStep || ! $contract->workflow) {
            return null;
        }

        // Use the workflow service to find the next valid step (honoring branch logic if any)
        return app(ContractWorkflowService::class)->findNextValidStep($contract, $contract->workflowStep);
    }

    public function requiresPicAssignment(Contract $contract): bool
    {
        $nextStep = $this->getNextStep($contract);

        return $nextStep && $nextStep->approver_type === 'assigned_pic';
    }

    public function addAdhocApprover(AddAdhocApproverRequest $request, string $id): JsonResponse
    {
        try {
            $contract = $this->contractDetailQuery->find($id);

            // if (! in_array($contract->status, ['draft', 'in_review', 'revision'])) {
            //     return response()->json(['message' => 'Partisipan tambahan hanya dapat ditambahkan pada kontrak yang sedang berjalan.'], 422);
            // }

            $targetStepId = $request->input('target_step_id');
            // Sanitize target_step_id: convert "null", "none", "current" or empty to null
            if ($targetStepId === 'null' || $targetStepId === 'none' || $targetStepId === 'current' || empty($targetStepId)) {
                $targetStepId = null;
            }

            // Check if the workflow has an explicit step configured with adhoc authorities
            $wf = $contract->workflow()->with('steps.approverAuthorities')->first();
            $adhocStep = $wf?->steps?->first(function ($s) {
                return $s->approver_type === 'adhoc'
                    || $s->step_category === 'adhoc'
                    || $s->step_category === 'adhoc_review'
                    || $s->approverAuthorities->contains(function ($auth) {
                        return in_array($auth->authority_type, ['adhoc_approvers', 'adhoc']) || $auth->user_id === 'adhoc_approvers';
                    });
            });

            if (! $targetStepId) {
                if ($adhocStep) {
                    $targetStepId = $adhocStep->id;
                } else {
                    $targetStepId = $contract->workflow_step_id;
                }
            } elseif ($adhocStep && $targetStepId === $contract->workflow_step_id) {
                // If targetStepId passed was current step, verify if current step actually has adhoc authority
                $currentStep = $contract->workflowStep ?: WorkflowStep::find($contract->workflow_step_id);
                $currentStepHasAdhoc = $currentStep && (
                    $currentStep->approver_type === 'adhoc'
                    || $currentStep->step_category === 'adhoc'
                    || $currentStep->step_category === 'adhoc_review'
                    || $currentStep->approverAuthorities->contains(fn ($auth) => in_array($auth->authority_type, ['adhoc_approvers', 'adhoc']) || $auth->user_id === 'adhoc_approvers')
                );
                if (! $currentStepHasAdhoc) {
                    $targetStepId = $adhocStep->id;
                }
            }

            if (! $targetStepId) {
                return response()->json(['message' => 'Tahap alur kerja tidak aktif saat ini.'], 422);
            }

            $role = $request->input('role', config('master.roles.adhoc_approver'));
            $userIds = $request->input('user_ids', []);
            $singleUserId = $request->input('user_id');
            if (empty($userIds) && $singleUserId) {
                $userIds = [$singleUserId];

                $existing = Approval::where('contract_id', $contract->id)
                    ->where('workflow_step_id', $targetStepId)
                    ->where('user_id', $singleUserId)
                    ->where('role', $role)
                    ->where('is_active', true)
                    ->whereIn('status', ['pending', 'waiting'])
                    ->exists();
                if ($existing) {
                    return response()->json(['message' => "User sudah terdaftar sebagai {$role} yang aktif."], 422);
                }
            }

            $targetStep = WorkflowStep::findOrFail($targetStepId);

            $isSequential = $request->boolean('is_sequential', false);
            $approvalRule = $request->input('approval_rule', 'all');
            $minApprovals = $request->input('min_approvals', count($userIds));
            $originWfId = $contract->origin_workflow_id ?: $contract->workflow_id;
            $isSubWorkflow = $targetStep->workflow_id !== $originWfId;
            $isCurrentStep = ($targetStepId === $contract->workflow_step_id && $targetStep->workflow_id === $contract->workflow_id) || $isSubWorkflow;

            // Save is_sequential and approval_rule setting to contract metadata
            $metadata = $contract->metadata ?? [];
            if (! isset($metadata['adhoc_steps'])) {
                $metadata['adhoc_steps'] = [];
            }
            $metadata['adhoc_steps'][$targetStepId] = [
                'is_sequential' => $isSequential,
                'approval_rule' => $approvalRule,
                'min_approvals' => $minApprovals,
            ];
            $contract->update(['metadata' => $metadata]);

            // Deactivate prior decided adhoc records for this step so they don't interfere with the new session
            Approval::where('contract_id', $contract->id)
                ->where('workflow_step_id', $targetStepId)
                ->where('role', $role)
                ->whereIn('status', ['approved', 'rejected'])
                ->update(['is_active' => false]);

            // Synchronize only active pending/waiting adhoc participants of this role
            $query = Approval::where('contract_id', $contract->id)
                ->where('workflow_step_id', $targetStepId)
                ->where('role', $role)
                ->where('is_active', true)
                ->whereIn('status', ['pending', 'waiting']);

            if (empty($userIds)) {
                $query->delete();
            } else {
                $query->whereNotIn('user_id', $userIds)->delete();
            }

            $existingActiveBatch = Approval::where('contract_id', $contract->id)
                ->where('workflow_step_id', $targetStepId)
                ->where('is_adhoc', true)
                ->where('is_active', true)
                ->whereIn('status', ['pending', 'waiting'])
                ->value('batch_no');

            $currentBatchNo = $existingActiveBatch ?: ((Approval::where('contract_id', $contract->id)->where('is_adhoc', true)->max('batch_no') ?: 0) + 1);

            foreach ($userIds as $index => $userId) {
                // Prevent duplicate among currently active pending/waiting on the same step
                $existing = Approval::where('contract_id', $contract->id)
                    ->where('workflow_step_id', $targetStepId)
                    ->where('user_id', $userId)
                    ->where('role', $role)
                    ->where('is_active', true)
                    ->whereIn('status', ['pending', 'waiting'])
                    ->exists();

                if ($existing) {
                    continue;
                }

                $user = User::findOrFail($userId);

                // Initial status logic:
                // - If future step (not current): all added ad-hoc approvers start as 'waiting'.
                // - If current step and sequential: first ad-hoc approver is 'pending', subsequent ones are 'waiting'.
                // - If current step and parallel: all newly added ad-hoc approvers are 'pending'.
                $status = 'pending';
                if (! $isCurrentStep) {
                    $status = 'waiting';
                } elseif ($isSequential && $index > 0) {
                    $status = 'waiting';
                }

                $maxSort = Approval::where('contract_id', $contract->id)
                    ->where('workflow_step_id', $targetStepId)
                    ->where('is_active', true)
                    ->max('sort_order') ?: 0;

                $maxSubStep = Approval::where('contract_id', $contract->id)
                    ->where('workflow_step_id', $targetStepId)
                    ->where('is_active', true)
                    ->whereNotNull('sub_step')
                    ->max('sub_step') ?: 0;

                Approval::create([
                    'contract_id' => $contract->id,
                    'workflow_id' => $targetStep->workflow_id,
                    'workflow_step_id' => $targetStepId,
                    'user_id' => $user->id,
                    'approver_name' => $user->name,
                    'role' => $role,
                    'job_title' => $user->job_title ?? null,
                    'approver_type' => 'adhoc',
                    'status' => $status,
                    'sequence' => $targetStep->step,
                    'step_number' => $targetStep->step,
                    'sub_step' => $maxSubStep + 1,
                    'sort_order' => $maxSort + 1,
                    'comment' => $request->input('note'),
                    'is_active' => true,
                    'is_current_step' => $isCurrentStep,
                    'batch_no' => $currentBatchNo,
                    'is_adhoc' => true,
                    'created_by' => Auth::id(),
                    'updated_by' => Auth::id(),
                ]);

                $addedUsers[] = $user->name;
            }

            // Process attachments if any
            $filesToProcess = [];
            if ($request->hasFile('attachments')) {
                $filesToProcess = $request->file('attachments');
            } elseif ($request->hasFile('attachment')) {
                $filesToProcess = [$request->file('attachment')];
            }
            $firstAttachmentPath = null;
            $isFirstAttachment = true;
            foreach ($filesToProcess as $file) {
                if (! $file) continue;
                $path = $file->store("contracts/{$contract->id}/adhoc", 'local');
                if ($isFirstAttachment) {
                    $firstAttachmentPath = $path;
                    $isFirstAttachment = false;
                }
                $contract->attachments()->create([
                    'label' => $file->getClientOriginalName(),
                    'category' => 'Lampiran',
                    'file_name' => $file->getClientOriginalName(),
                    'file_path' => $path,
                    'file_type' => $file->getClientOriginalExtension() ?: 'file',
                    'uploaded_by' => Auth::id(),
                ]);
            }

            if (! empty($addedUsers)) {
                // Log history only if new users were added
                $actorName = Auth::user()?->name ?: 'Pengguna';
                $count = count($addedUsers);
                $contract->histories()->create([
                    'action' => 'ADHOC_PARTICIPANT_ADDED',
                    'description' => "{$count} {$role} ditambahkan oleh {$actorName}. Catatan: ".$request->input('note'),
                    'actor_id' => Auth::id(),
                ]);
            }

            // If branching to a sub-workflow, complete current step and advance to sub-workflow
            if ($isSubWorkflow) {
                // Mark previous step approvals as approved and deactivate current step status
                Approval::where('contract_id', $contract->id)
                    ->where('workflow_step_id', $contract->workflow_step_id)
                    ->whereIn('status', ['pending', 'waiting'])
                    ->update([
                        'status' => 'approved',
                        'is_active' => false,
                        'is_current_step' => false,
                        'decided_at' => now(),
                        'updated_by' => Auth::id(),
                    ]);

                Approval::where('contract_id', $contract->id)
                    ->where('workflow_step_id', '!=', $targetStepId)
                    ->update([
                        'is_current_step' => false,
                    ]);

                $metadata['branch_from_step_num'] = $contract->workflowStep?->step ?? 1;
                $metadata['branch_from_step_id'] = $contract->workflow_step_id;

                $contract->update([
                    'origin_workflow_id' => $originWfId,
                    'workflow_id' => $targetStep->workflow_id,
                    'workflow_step_id' => $targetStepId,
                    'is_in_sub_workflow' => true,
                    'branch_step_number' => $contract->workflowStep?->step ?? 1,
                    'current_step_number' => $targetStep->step,
                    'current_sub_workflow_id' => $targetStep->workflow_id,
                    'metadata' => $metadata,
                ]);

                $this->workflowService->createApprovalForStep($contract->fresh(), $targetStep);

                $targetStepLabel = $targetStep->name ?: $targetStep->description ?: "Tahap {$targetStep->step}";
                $contract->histories()->create([
                    'action' => 'WORKFLOW_ADVANCED',
                    'description' => "Alur kerja berlanjut ke Tahap {$targetStep->step}: {$targetStepLabel}",
                    'actor_id' => Auth::id(),
                ]);
            } else {
                // Check if this ad-hoc addition was executed as a step completion action on the current step
                $requestActionId = $request->input('action_id') ?: $request->input('step_action_id');
                $actionCodeInput = $request->input('action_code') ?: 'add_adhoc';
                $currentStep = $contract->workflowStep ?: ($contract->workflow_step_id ? WorkflowStep::find($contract->workflow_step_id) : null);

                $stepAction = null;
                if ($currentStep) {
                    if ($requestActionId && \Illuminate\Support\Str::isUuid($requestActionId)) {
                        $stepAction = $currentStep->actions()->where('id', $requestActionId)->first();
                    }
                    if (! $stepAction) {
                        $stepAction = $currentStep->actions()->where(function ($q) use ($actionCodeInput) {
                            $q->where('action_code', $actionCodeInput)
                              ->orWhere('action_code', 'add_adhoc');
                        })->first();
                    }
                }

                $hasExplicitAction = $request->filled('action_id') || $request->filled('step_action_id') || $request->filled('action_code');
                $isAddAdhocAction = ($actionCodeInput === 'add_adhoc' && $hasExplicitAction) || ($stepAction && $stepAction->action_code === 'add_adhoc' && $hasExplicitAction);

                if ($isAddAdhocAction || ($hasExplicitAction && $stepAction)) {
                    $currentApproval = Approval::where('contract_id', $contract->id)
                        ->where('workflow_step_id', $contract->workflow_step_id)
                        ->where('status', 'pending')
                        ->where(function ($q) use ($contract) {
                            $q->where('user_id', Auth::id())
                              ->orWhere('user_id', $contract->created_by)
                              ->orWhere('user_id', $contract->initiated_by_id);
                        })
                        ->first();

                    if (! $currentApproval) {
                        $currentApproval = Approval::where('contract_id', $contract->id)
                            ->where('workflow_step_id', $contract->workflow_step_id)
                            ->where('status', 'pending')
                            ->first();
                    }

                    if ($currentApproval) {
                        $contract = $this->approveAction->approve(
                            $contract,
                            $currentApproval,
                            $request->input('note'),
                            $firstAttachmentPath,
                            null,
                            null,
                            $actionCodeInput,
                            $targetStepId,
                            $stepAction?->id ?: $requestActionId
                        );
                    }
                } elseif ($isCurrentStep) {
                    // Sync main step regular approvals status when adding ad-hoc approvals to current step
                    $hasActiveAdhoc = Approval::where('contract_id', $contract->id)
                        ->where('workflow_step_id', $targetStepId)
                        ->where('role', $role)
                        ->where('is_active', true)
                        ->whereIn('status', ['pending', 'waiting'])
                        ->exists();

                    if ($hasActiveAdhoc && $role === config('master.roles.adhoc_approver')) {
                        Approval::where('contract_id', $contract->id)
                            ->where('workflow_step_id', $targetStepId)
                            ->whereNotIn('role', ['Persetujuan Tambahan', 'Pihak 1', 'Pihak 2'])
                            ->where('status', 'pending')
                            ->update(['status' => 'waiting']);
                    }
                }
            }

            return response()->json(ContractFormatter::formatContract($contract->fresh()), 200);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function submitAdhocApprovers(string $id): JsonResponse
    {
        try {
            $contract = $this->contractDetailQuery->find($id);

            // Activate any inactive (draft/staged) ad-hoc approvals for the current step
            Approval::where('contract_id', $contract->id)
                ->where('workflow_step_id', $contract->workflow_step_id)
                ->where('role', config('master.roles.adhoc_approver'))
                ->where('is_active', false)
                ->update(['is_active' => true, 'status' => 'pending']);

            return response()->json(ContractFormatter::formatContract($contract->fresh()), 200);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function removeAdhocApprover(string $id, string $approvalId): JsonResponse
    {
        try {
            $contract = $this->contractDetailQuery->find($id);
            $approval = Approval::find($approvalId);

            if (! $approval) {
                // If it's already gone, consider it a success to avoid 404 errors in UI
                return response()->json(ContractFormatter::formatContract($contract->fresh()), 200);
            }

            if ((string) $approval->contract_id !== (string) $id) {
                return response()->json(['message' => 'Persetujuan tidak ditemukan pada kontrak ini.'], 404);
            }

            if ($approval->role !== config('master.roles.adhoc_approver') && $approval->role !== 'Penandatangan') {
                return response()->json(['message' => 'Hanya persetujuan tambahan atau penandatangan yang dapat dihapus.'], 403);
            }

            if (! in_array($approval->status, ['pending', 'waiting'])) {
                return response()->json(['message' => 'Persetujuan yang sudah diproses tidak dapat dihapus.'], 403);
            }

            $approval->forceDelete();

            return response()->json(ContractFormatter::formatContract($contract->fresh()), 200);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
}
