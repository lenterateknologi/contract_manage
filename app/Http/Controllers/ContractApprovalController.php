<?php

namespace App\Http\Controllers;

use OpenApi\Attributes as OA;

use App\Models\Approval;
use App\Models\Contract;
use App\Models\ContractAttachment;
use App\Models\ContractFormSubmission;
use App\Models\ContractFormSubmissionVersion;
use App\Models\FormTemplate;
use App\Models\ContractHistory;
use App\Models\ContractType;
use App\Models\ContractVersion;
use App\Models\SubmissionType;
use App\Models\Role;
use App\Models\User;
use App\Services\ContractWorkflowService;
use App\Actions\Contract\StoreContractAction;
use App\Actions\Contract\UpdateContractAction;
use App\Actions\Contract\ApproveContractAction;
use App\Actions\Contract\RejectContractAction;
use App\Actions\Contract\ExportContractAction;
use App\Actions\Contract\FileAction;
use App\Formatters\ContractFormatter;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Jobs\GeneratePdfJob;
use Illuminate\Support\Facades\Cache;
use App\Models\Vendor;
use Illuminate\Support\Facades\URL;
use App\Models\AccessModule;

use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

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
        ExportContractAction $exportAction
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
            ]);
    
            $contract = Contract::findOrFail($id);
    
            // Find the pending approval for the current user
            $approval = Approval::where('contract_id', $id)
                ->where('user_id', Auth::id())
                ->where('status', 'pending')
                ->first();
    
            if (!$approval) {
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
                $request->execution_order
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
    
            if (!$approval) {
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
            if (!$this->approveAction->checkBulkPermission('can_bulk_approve')) {
                return response()->json(['message' => 'Anda tidak memiliki izin untuk aksi massal ini.'], 403);
            }
    
            $request->validate([
                'ids' => 'required|array',
                'note' => 'required|string|min:10'
            ]);
    
            $ids = $request->input('ids');
            $note = $request->input('note');
    
            $count = $this->approveAction->bulkApprove($ids, $note);
    
            return response()->json(['message' => "$count kontrak berhasil disetujui."]);
        }

        public function getNextStep(Contract $contract): ?\App\Models\WorkflowStep
        {
            if (!$contract->workflowStep || !$contract->workflow) {
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
}
