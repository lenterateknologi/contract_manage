<?php

namespace App\Http\Controllers\Contract;

use App\Http\Actions\Contract\GetAuditTrailAction;
use App\Http\Actions\Export\ExportApprovalTimelinePdfQueueAction;
use App\Http\Actions\Export\ExportAuditExcelAction;
use App\Http\Actions\Export\ExportAuditPdfAction;
use App\Http\Actions\Export\ExportAuditPdfQueueAction;
use App\Http\Actions\Export\ExportFormSubmissionPdfAction;
use App\Http\Actions\Export\ExportFormSubmissionPdfQueueAction;
use App\Http\Controllers\Controller;
use App\Http\Formatters\ContractFormatter;
use App\Http\Queries\Contract\ContractDetailQuery;
use App\Models\FormSubmission;
use App\Models\FormTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ContractExportController extends Controller
{
    public function __construct(
        protected ContractDetailQuery $contractDetailQuery
    ) {}

    public function exportAuditExcel(string $id, Request $request, ExportAuditExcelAction $action): StreamedResponse
    {
        $contract = $this->contractDetailQuery->find($id);

        return $action->execute($contract, $request);
    }

    public function renderApprovalTimeline(string $id, Request $request)
    {
        $contract = $this->contractDetailQuery->find($id);

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
        $contract = $this->contractDetailQuery->find($id);

        return $action->execute($contract, $request);
    }

    public function exportAuditPdfQueue(string $id, Request $request, ExportAuditPdfQueueAction $action)
    {
        $contract = $this->contractDetailQuery->find($id);

        return $action->execute($contract, $request);
    }

    public function exportAuditPdf(string $id, Request $request, ExportAuditPdfAction $action)
    {
        $contract = $this->contractDetailQuery->find($id);

        return $action->execute($contract, $request);
    }

    public function renderAuditDocument(string $id, Request $request)
    {
        $contract = $this->contractDetailQuery->find($id);

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

    public function renderFormSubmission(string $id, string $type, Request $request)
    {
        $contract = $this->contractDetailQuery->find($id);

        $template = FormTemplate::where('document_type', $type)->with('fields')->first();
        if (! $template) {
            abort(404, "Form template {$type} not found.");
        }

        $submission = FormSubmission::where('contract_id', $contract->id)
            ->where('document_type', $type)
            ->first();

        $latestVersion = $submission ? $submission->versions()->orderByDesc('version_no')->first() : null;
        
        $targetVersion = $latestVersion;
        if ($submission && $request->has('version')) {
            $targetVersion = $submission->versions()->where('version_no', $request->query('version'))->first();
        }

        $formData = $targetVersion ? ($targetVersion->form_data ?? []) : [];

        return Inertia::render('form-management/Print', [
            'template' => $template,
            'formData' => $formData,
        ]);
    }

    public function exportFormSubmissionPdfQueue(Request $request, string $id, string $type, ExportFormSubmissionPdfQueueAction $action)
    {
        $contract = $this->contractDetailQuery->find($id);

        return $action->execute($contract, $type, $request);
    }

    public function exportFormSubmissionPdf(string $id, string $type, Request $request, ExportFormSubmissionPdfAction $action): mixed
    {
        $contract = $this->contractDetailQuery->find($id);

        return $action->execute($contract, $type, $request->query('disposition', 'attachment'));
    }

    public function getAuditTrail(string $id, Request $request, GetAuditTrailAction $action): JsonResponse
    {
        $contract = $this->contractDetailQuery->find($id);

        return $action->execute($contract, $request);
    }
}
