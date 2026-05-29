<?php

namespace App\Http\Controllers;

use App\Actions\Contract\ApproveContractAction;
use App\Actions\Contract\ExportContractAction;
use App\Actions\Contract\FileAction;
use App\Actions\Contract\RejectContractAction;
use App\Actions\Contract\StoreContractAction;
use App\Actions\Contract\UpdateContractAction;
use App\Formatters\ContractFormatter;
use App\Models\Approval;
use App\Models\Contract;
use App\Models\User;
use App\Models\WorkflowStep;
use App\Services\ContractWorkflowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ContractApprovalController extends Controller
{
    private ContractWorkflowService $workflowService;

    private StoreContractAction $storeAction;

    private UpdateContractAction $updateAction;

    private ApproveContractAction $approveAction;

    private RejectContractAction $rejectAction;

    private FileAction $fileAction;

    private ExportContractAction $exportAction;

    public function __construct(
        ContractWorkflowService $workflowService,
        StoreContractAction $storeAction,
        UpdateContractAction $updateAction,
        ApproveContractAction $approveAction,
        RejectContractAction $rejectAction,
        FileAction $fileAction,
        ExportContractAction $exportAction,
    ) {
        $this->workflowService = $workflowService;
        $this->storeAction = $storeAction;
        $this->updateAction = $updateAction;
        $this->approveAction = $approveAction;
        $this->rejectAction = $rejectAction;
        $this->fileAction = $fileAction;
        $this->exportAction = $exportAction;
    }

    public function send(Request $request, string $id): JsonResponse
    {
        try {
            $contract = Contract::findOrFail($id);

            if ($contract->status !== 'draft') {
                return response()->json(['message' => 'Hanya kontrak berstatus draft yang dapat dikirim.'], 422);
            }

            $workflowId = $request->input('workflow_id');
            $customSteps = $request->input('custom_steps');

            // Use workflow service to send for approval
            $contract = $this->workflowService->sendForApproval($contract, $workflowId, $customSteps, true);

            $contract->load(['creator', 'versions.uploader', 'approvals.approver', 'approvals.workflowStep', 'workflow.steps', 'histories.actor', 'messages.user', 'workflow', 'workflowStep']);

            return response()->json(ContractFormatter::formatContract($contract), 200);
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
            'p1_user_id' => 'nullable|uuid|exists:m_users,id',
            'p2_user_id' => 'nullable|uuid|exists:m_users,id',
            'action_code' => 'nullable|string',
        ]);

        $contract = Contract::findOrFail($id);

        // Find the pending approval for the current user
        $approval = Approval::where('contract_id', $id)
            ->where('user_id', Auth::id())
            ->where('status', 'pending')
            ->first();

        if (! $approval) {
            return response()->json(['message' => 'Tidak ada persetujuan tertunda yang ditemukan untuk Anda.'], 422);
        }

        // VALIDATION: Manager can only assign to their own department staff
        if ($request->assigned_pic_id && Auth::user()->role === 'Manager') {
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

        $contract = $this->approveAction->approve(
            $contract,
            $approval,
            $request->note,
            $attachmentPath,
            $request->assigned_pic_id,
            $request->execution_order,
            $request->action_code,
        );

        return response()->json(ContractFormatter::formatContract($contract));
    }

    public function reject(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'reason' => 'required|string',
            'attachment' => 'nullable|file|max:10240', // 10MB limit
        ]);

        $contract = Contract::findOrFail($id);

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

        return response()->json(ContractFormatter::formatContract($contract));
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
        ]);

        try {
            $contract = Contract::findOrFail($id);

            if (! in_array($contract->status, ['draft', 'in_review', 'revision'])) {
                return response()->json(['message' => 'Persetujuan tambahan hanya dapat ditambahkan pada kontrak yang sedang berjalan.'], 422);
            }

            $userIds = $request->input('user_ids');
            if (empty($userIds) && $request->input('user_id')) {
                $userIds = [$request->input('user_id')];
            }

            if (empty($userIds)) {
                return response()->json(['message' => 'Harap pilih minimal satu user.'], 422);
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

            $targetStep = WorkflowStep::findOrFail($targetStepId);
            $isSequential = $request->boolean('is_sequential', false);
            $addedUsers = [];

            foreach ($userIds as $index => $userId) {
                // Prevent duplicate approval for the same step
                $existing = Approval::where('contract_id', $contract->id)
                    ->where('workflow_step_id', $targetStepId)
                    ->where('user_id', $userId)
                    ->exists();

                if ($existing) {
                    continue;
                }

                $user = User::findOrFail($userId);

                // Sequential logic: if there is already a pending approval on this step, others wait.
                $status = 'pending';
                if ($isSequential) {
                    $hasPending = Approval::where('contract_id', $contract->id)
                        ->where('workflow_step_id', $targetStepId)
                        ->where('role', 'Persetujuan Tambahan')
                        ->where('status', 'pending')
                        ->exists();

                    if ($hasPending || $index > 0) {
                        $status = 'waiting';
                    }
                }

                $maxSort = Approval::where('contract_id', $contract->id)
                    ->where('workflow_step_id', $targetStepId)
                    ->max('sort_order') ?: 0;

                Approval::create([
                    'contract_id' => $contract->id,
                    'workflow_step_id' => $targetStepId,
                    'user_id' => $user->id,
                    'approver_name' => $user->name,
                    'role' => 'Persetujuan Tambahan',
                    'job_title' => $user->job_title ?? null,
                    'status' => $status,
                    'sequence' => $targetStep->step,
                    'sort_order' => $maxSort + 1,
                    'comment' => $request->input('note'),
                    'is_active' => true,
                    'created_by' => Auth::id(),
                    'updated_by' => Auth::id(),
                ]);

                $addedUsers[] = $user->name;
            }

            if (empty($addedUsers)) {
                return response()->json(['message' => 'Semua user yang dipilih sudah terdaftar sebagai approver pada tahap ini.'], 422);
            }

            // Log history
            $actorName = Auth::user()->name;
            $count = count($addedUsers);
            $contract->histories()->create([
                'action' => 'ADHOC_APPROVER_ADDED',
                'description' => "{$count} persetujuan tambahan ditambahkan oleh {$actorName}. Catatan: " . $request->input('note'),
                'actor_id' => Auth::id(),
            ]);

            $contract->load(['creator', 'versions.uploader', 'approvals.approver', 'approvals.workflowStep', 'workflow.steps', 'histories.actor', 'messages.user', 'workflow', 'workflowStep']);

            return response()->json(ContractFormatter::formatContract($contract), 200);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function submitAdhocApprovers(string $id): JsonResponse
    {
        try {
            $contract = Contract::findOrFail($id);

            // Activate any inactive (draft/staged) ad-hoc approvals for the current step
            Approval::where('contract_id', $contract->id)
                ->where('workflow_step_id', $contract->workflow_step_id)
                ->where('role', 'Persetujuan Tambahan')
                ->where('is_active', false)
                ->update(['is_active' => true, 'status' => 'pending']);

            $contract->load(['creator', 'versions.uploader', 'approvals.approver', 'approvals.workflowStep', 'workflow.steps', 'histories.actor', 'messages.user', 'workflow', 'workflowStep']);

            return response()->json(ContractFormatter::formatContract($contract), 200);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function removeAdhocApprover(string $id, string $approvalId): JsonResponse
    {
        try {
            $contract = Contract::findOrFail($id);
            $approval = Approval::where('contract_id', $id)->findOrFail($approvalId);

            if ($approval->role !== 'Persetujuan Tambahan') {
                return response()->json(['message' => 'Hanya persetujuan tambahan yang dapat dihapus.'], 403);
            }

            if (! in_array($approval->status, ['pending', 'waiting'])) {
                return response()->json(['message' => 'Persetujuan yang sudah diproses tidak dapat dihapus.'], 403);
            }

            $approval->forceDelete();

            $contract->load(['creator', 'versions.uploader', 'approvals.approver', 'approvals.workflowStep', 'workflow.steps', 'histories.actor', 'messages.user', 'workflow', 'workflowStep']);

            return response()->json(ContractFormatter::formatContract($contract), 200);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
}
