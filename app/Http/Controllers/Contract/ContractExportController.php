<?php

namespace App\Http\Controllers\Contract;

use App\Actions\Contract\GetAuditTrailAction;
use App\Actions\Export\ExportApprovalTimelinePdfQueueAction;
use App\Actions\Export\ExportAuditExcelAction;
use App\Actions\Export\ExportAuditPdfAction;
use App\Actions\Export\ExportAuditPdfQueueAction;
use App\Actions\Export\ExportFormSubmissionPdfAction;
use App\Actions\Export\ExportFormSubmissionPdfQueueAction;
use App\Formatters\ContractFormatter;
use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Services\ContractWorkflowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ContractExportController extends Controller
{
    public function __construct(
        protected ContractWorkflowService $workflowService,
    ) {}

    public function exportAuditExcel(string $id, Request $request, ExportAuditExcelAction $action): StreamedResponse
    {
        $contract = Contract::findOrFail($id);

        return $action->execute($contract, $request);
    }

    public function renderApprovalTimeline(string $id, Request $request)
    {
        $contract = Contract::with(['creator', 'approvals.approver'])->findOrFail($id);

        $query = $contract->approvals()->orderBy('sequence');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('role')) {
            $query->where('role', 'like', '%'.$request->role.'%');
        }
        if ($request->filled('department')) {
            $query->where('department_name', 'like', '%'.$request->department.'%');
        }

        $approvals = $query->get();

        return view('pdf.contract-approval', [
            'contract' => $contract,
            'approvals' => $approvals,
            'generated_at' => now()->format('d/m/Y H:i'),
            'generated_by' => $request->generated_by ?? (Auth::user() ? Auth::user()->name : 'System'),
        ]);
    }

    public function exportApprovalTimelinePdfQueue(string $id, Request $request, ExportApprovalTimelinePdfQueueAction $action)
    {
        $contract = Contract::findOrFail($id);

        return $action->execute($contract, $request);
    }

    public function exportAuditPdfQueue(string $id, Request $request, ExportAuditPdfQueueAction $action)
    {
        $contract = Contract::findOrFail($id);

        return $action->execute($contract, $request);
    }

    public function exportAuditPdf(string $id, Request $request, ExportAuditPdfAction $action)
    {
        $contract = Contract::findOrFail($id);

        return $action->execute($contract, $request);
    }

    public function renderAuditDocument(string $id, Request $request)
    {
        $contract = Contract::with(['vendor', 'contractType', 'creator', 'initiator'])->findOrFail($id);

        $query = $contract->histories()->with('actor');

        if ($request->filled('search')) {
            $query->where('description', 'like', '%'.$request->search.'%');
        }

        if ($request->filled('actor_id')) {
            $query->where('actor_id', $request->actor_id);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $histories = $query->orderBy('created_at', 'asc')->get();

        return Inertia::render('contracts/AuditTrailDocument', [
            'contract' => ContractFormatter::formatContract($contract),
            'histories' => $histories,
            'filters' => $request->only(['search', 'actor_id', 'date_from', 'date_to']),
        ]);
    }

    public function exportFormSubmissionPdfQueue(Request $request, string $id, string $type, ExportFormSubmissionPdfQueueAction $action)
    {
        $contract = Contract::findOrFail($id);

        return $action->execute($contract, $type, $request);
    }

    public function exportFormSubmissionPdf(string $id, string $type, Request $request, ExportFormSubmissionPdfAction $action): mixed
    {
        $contract = Contract::findOrFail($id);

        return $action->execute($contract, $type, $request->query('disposition', 'attachment'));
    }

    public function getAuditTrail(string $id, Request $request, GetAuditTrailAction $action): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        return $action->execute($contract, $request);
    }
}
