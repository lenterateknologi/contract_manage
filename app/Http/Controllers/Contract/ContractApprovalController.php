<?php

namespace App\Http\Controllers\Contract;

use App\Http\Actions\Contract\ApproveContractAction;
use App\Http\Actions\Contract\RejectContractAction;
use App\Http\Controllers\Controller;
use App\Http\Formatters\ContractFormatter;
use App\Http\Queries\Contract\ContractDetailQuery;
use App\Models\Approval;
use App\Models\Contract;
use App\Models\Role;
use App\Models\User;
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

    public function approve(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'note' => 'nullable|string',
            'attachment' => 'nullable|file|max:10240', // 10MB limit
            'assigned_pic_id' => 'nullable|uuid|exists:m_users,id',
            'execution_order' => 'nullable|string',
            'signer_user_ids' => 'nullable|array',
            'signer_user_ids.*' => 'uuid|exists:m_users,id',
            'p1_user_id' => 'nullable|uuid|exists:m_users,id',
            'p2_user_id' => 'nullable|uuid|exists:m_users,id',
            'action_code' => 'nullable|string',
            'target_step_id' => 'nullable|uuid|exists:m_workflow_steps,id',
        ]);

        $contract = $this->contractDetailQuery->find($id);

        // Find the pending approval for the current user
        $approval = Approval::where('contract_id', $id)
            ->where('user_id', Auth::id())
            ->where('status', 'pending')
            ->first();

        if (! $approval) {
            return response()->json(['message' => 'Tidak ada persetujuan tertunda yang ditemukan untuk Anda.'], 422);
        }

        // VALIDATION: Manager can only assign to their own department staff
        $userRole = Auth::user()->role ?? Auth::user()->roleRelation?->name;
        if ($request->assigned_pic_id && $userRole === 'Manager') {
            $assignedUser = User::find($request->assigned_pic_id);
            if ($assignedUser && $assignedUser->department_id !== Auth::user()->department_id) {
                return response()->json(['message' => 'Anda hanya dapat menugaskan kontrak kepada staf di departemen Anda sendiri.'], 422);
            }
        }

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store("contracts/{$contract->id}/approvals", 'local');
            $approval->attachment_path = $attachmentPath;
        }

        $signerUserIds = $request->input('signer_user_ids');
        if (empty($signerUserIds)) {
            $p1 = $request->input('p1_user_id');
            $p2 = $request->input('p2_user_id');
            $signerUserIds = [];
            if ($p1) {
                $signerUserIds[] = $p1;
            }
            if ($p2) {
                $signerUserIds[] = $p2;
            }
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
            ! empty($signerUserIds) ? $signerUserIds : null,
        );

        return response()->json(ContractFormatter::formatContract($contract->fresh()));
    }

    public function reject(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'reason' => 'required|string',
            'attachment' => 'nullable|file|max:10240', // 10MB limit
        ]);

        $contract = $this->contractDetailQuery->find($id);

        // Find the pending approval for the current user
        $approval = Approval::where('contract_id', $id)
            ->where('user_id', Auth::id())
            ->where('status', 'pending')
            ->first();

        if (! $approval) {
            return response()->json(['message' => 'Tidak ada persetujuan tertunda yang ditemukan untuk Anda.'], 422);
        }

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store("contracts/{$contract->id}/approvals", 'local');
            $approval->attachment_path = $attachmentPath;
        }

        $contract = $this->rejectAction->execute($contract, $approval, $request->reason, $attachmentPath);

        return response()->json(ContractFormatter::formatContract($contract->fresh()));
    }

    public function bulkApprove(Request $request): JsonResponse
    {
        if (! $this->approveAction->checkBulkPermission('can_bulk_approve')) {
            return response()->json(['message' => 'Anda tidak memiliki izin untuk aksi massal ini.'], 403);
        }

        $request->validate([
            'ids' => 'required|array',
            'note' => 'required|string|min:10',
        ]);

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

    public function addAdhocApprover(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'user_ids' => 'nullable|array',
            'user_ids.*' => 'uuid|exists:m_users,id',
            'user_id' => 'nullable|uuid|exists:m_users,id',
            'note' => 'nullable|string|max:1000',
            'target_step_id' => 'nullable|uuid|exists:m_workflow_steps,id',
            'is_sequential' => 'nullable|boolean',
            'role' => 'nullable|string|max:100',
        ]);

        try {
            $contract = $this->contractDetailQuery->find($id);

            if (! in_array($contract->status, ['draft', 'in_review', 'revision'])) {
                return response()->json(['message' => 'Partisipan tambahan hanya dapat ditambahkan pada kontrak yang sedang berjalan.'], 422);
            }

            $targetStepId = $request->input('target_step_id');
            // Sanitize target_step_id: convert "null", "none", "current" or empty to null
            if ($targetStepId === 'null' || $targetStepId === 'none' || $targetStepId === 'current' || empty($targetStepId)) {
                $targetStepId = null;
            }

            $targetStepId = $targetStepId ?: $contract->workflow_step_id;
            if (! $targetStepId) {
                return response()->json(['message' => 'Tahap alur kerja tidak aktif saat ini.'], 422);
            }

            $role = $request->input('role', Role::ADHOC_APPROVER);
            $userIds = $request->input('user_ids', []);
            $singleUserId = $request->input('user_id');
            if (empty($userIds) && $singleUserId) {
                $userIds = [$singleUserId];

                $existing = Approval::where('contract_id', $contract->id)
                    ->where('workflow_step_id', $targetStepId)
                    ->where('user_id', $singleUserId)
                    ->where('role', $role)
                    ->exists();
                if ($existing) {
                    return response()->json(['message' => "User sudah terdaftar sebagai {$role}."], 422);
                }
            }

            $targetStep = WorkflowStep::findOrFail($targetStepId);
            $isSequential = $request->boolean('is_sequential', false);
            $isCurrentStep = $targetStepId === $contract->workflow_step_id;

            // Save is_sequential setting to contract metadata
            $metadata = $contract->metadata ?? [];
            if (! isset($metadata['adhoc_steps'])) {
                $metadata['adhoc_steps'] = [];
            }
            $metadata['adhoc_steps'][$targetStepId] = [
                'is_sequential' => $isSequential,
            ];
            $contract->update(['metadata' => $metadata]);

            // Validate that we are not removing any non-pending/waiting approvers
            $existingNonPendingUserIds = Approval::where('contract_id', $contract->id)
                ->where('workflow_step_id', $targetStepId)
                ->where('role', $role)
                ->whereNotIn('status', ['pending', 'waiting'])
                ->pluck('user_id')
                ->toArray();

            $removedNonPending = array_diff($existingNonPendingUserIds, $userIds);
            if (! empty($removedNonPending)) {
                return response()->json(['message' => 'Tidak dapat menghapus partisipan yang sudah memberikan keputusan.'], 422);
            }

            // Remove unselected pending/waiting participants of this role
            $query = Approval::where('contract_id', $contract->id)
                ->where('workflow_step_id', $targetStepId)
                ->where('role', $role)
                ->whereIn('status', ['pending', 'waiting']);

            if (empty($userIds)) {
                $query->delete();
            } else {
                $query->whereNotIn('user_id', $userIds)->delete();
            }

            $addedUsers = [];

            foreach ($userIds as $index => $userId) {
                // Prevent duplicate for the same step and role
                $existing = Approval::where('contract_id', $contract->id)
                    ->where('workflow_step_id', $targetStepId)
                    ->where('user_id', $userId)
                    ->where('role', $role)
                    ->exists();

                if ($existing) {
                    continue;
                }

                $user = User::findOrFail($userId);

                // Initial status logic:
                // 1. If it's not the current active step of the contract, it must be 'waiting'.
                // 2. If it is the current step:
                //    - If parallel (not sequential), it's 'pending'.
                //    - If sequential, it's 'pending' only if it's the first in the batch AND no other participant of this role is already pending.
                $status = 'pending';

                if (! $isCurrentStep) {
                    $status = 'waiting';
                } elseif ($isSequential) {
                    $hasPending = Approval::where('contract_id', $contract->id)
                        ->where('workflow_step_id', $targetStepId)
                        ->where('role', $role)
                        ->where('status', 'pending')
                        ->exists();

                    if ($hasPending || $index > 0) {
                        $status = 'waiting';
                    }
                }

                $maxSort = Approval::where('contract_id', $contract->id)
                    ->where('workflow_step_id', $targetStepId)
                    ->max('sort_order') ?: 0;

                $maxSubStep = Approval::where('contract_id', $contract->id)
                    ->where('workflow_step_id', $targetStepId)
                    ->whereNotNull('sub_step')
                    ->max('sub_step') ?: 0;

                Approval::create([
                    'contract_id' => $contract->id,
                    'workflow_step_id' => $targetStepId,
                    'user_id' => $user->id,
                    'approver_name' => $user->name,
                    'role' => $role,
                    'job_title' => $user->job_title ?? null,
                    'status' => $status,
                    'sequence' => $targetStep->step,
                    'sub_step' => $maxSubStep + 1,
                    'sort_order' => $maxSort + 1,
                    'comment' => $request->input('note'),
                    'is_active' => true,
                    'created_by' => Auth::id(),
                    'updated_by' => Auth::id(),
                ]);

                $addedUsers[] = $user->name;
            }

            // Sync main step regular approvals status when adding ad-hoc approvals to current step
            if ($isCurrentStep) {
                $hasActiveAdhoc = Approval::where('contract_id', $contract->id)
                    ->where('workflow_step_id', $targetStepId)
                    ->where('role', $role)
                    ->whereIn('status', ['pending', 'waiting'])
                    ->exists();

                if ($hasActiveAdhoc) {
                    // Logic for blocking main approvers should only apply for ADHOC_APPROVER role
                    if ($role === Role::ADHOC_APPROVER) {
                        Approval::where('contract_id', $contract->id)
                            ->where('workflow_step_id', $targetStepId)
                            ->whereNotIn('role', ['Persetujuan Tambahan', 'Pihak 1', 'Pihak 2'])
                            ->where('status', 'pending')
                            ->update(['status' => 'waiting']);
                    }
                } else {
                    // Restore status logic
                    if ($role === Role::ADHOC_APPROVER) {
                        Approval::where('contract_id', $contract->id)
                            ->where('workflow_step_id', $targetStepId)
                            ->whereNotIn('role', ['Persetujuan Tambahan', 'Pihak 1', 'Pihak 2'])
                            ->where('status', 'waiting')
                            ->update(['status' => 'pending']);
                    }
                }
            }

            if (! empty($addedUsers)) {
                // Log history only if new users were added
                $actorName = Auth::user()->name;
                $count = count($addedUsers);
                $contract->histories()->create([
                    'action' => 'ADHOC_PARTICIPANT_ADDED',
                    'description' => "{$count} {$role} ditambahkan oleh {$actorName}. Catatan: ".$request->input('note'),
                    'actor_id' => Auth::id(),
                ]);
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
                ->where('role', Role::ADHOC_APPROVER)
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

            if ($approval->role !== Role::ADHOC_APPROVER && $approval->role !== 'Penandatangan') {
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
