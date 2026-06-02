<?php

namespace App\Http\Controllers;

use App\Actions\Contract\ApproveContractAction;
use App\Actions\Contract\ExportContractAction;
use App\Actions\Contract\FileAction;
use App\Actions\Contract\RejectContractAction;
use App\Actions\Contract\StoreContractAction;
use App\Actions\Contract\UpdateContractAction;
use App\Formatters\ContractFormatter;
use App\Jobs\GeneratePdfJob;
use App\Models\Contract;
use App\Models\ContractFormSubmission;
use App\Models\FormTemplate;
use App\Services\ContractWorkflowService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ContractExportController extends Controller
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

    public function exportAuditExcel(string $id, Request $request): StreamedResponse
    {
        $contract = Contract::findOrFail($id);
        $query = $contract->histories()->with('actor')->orderBy('created_at', 'desc');

        // Apply Filters (same as getAuditTrail)
        if ($request->action) {
            $query->where('action', $request->action);
        }
        if ($request->actor_id) {
            $query->where('actor_id', $request->actor_id);
        }
        if ($request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }
        if ($request->search) {
            $query->where('description', 'like', '%' . $request->search . '%');
        }

        $histories = $query->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="audit_trail_' . Str::slug($contract->contract_no ?: 'contract') . '_' . date('Ymd') . '.csv"',
        ];

        return new StreamedResponse(function () use ($histories, $contract) {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF)); // BOM for Excel

            // Headers
            fputcsv($handle, [
                'Waktu',
                'No. Kontrak',
                'Judul Kontrak',
                'Aksi',
                'Deskripsi',
                'Aktor',
            ]);

            foreach ($histories as $h) {
                fputcsv($handle, [
                    $h->created_at->format('Y-m-d H:i:s'),
                    $contract->contract_no,
                    $contract->title,
                    strtoupper($h->action),
                    $h->description,
                    $h->actor?->name ?? 'System',
                ]);
            }
            fclose($handle);
        }, 200, $headers);
    }

    public function renderApprovalTimeline(string $id, Request $request)
    {
        $contract = Contract::with(['creator', 'approvals.approver'])->findOrFail($id);

        $query = $contract->approvals()->orderBy('sequence');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('role')) {
            $query->where('role', 'like', '%' . $request->role . '%');
        }
        if ($request->filled('department')) {
            $query->where('department_name', 'like', '%' . $request->department . '%');
        }

        $approvals = $query->get();

        return view('pdf.contract-approval', [
            'contract' => $contract,
            'approvals' => $approvals,
            'generated_at' => now()->format('d/m/Y H:i'),
            'generated_by' => $request->generated_by ?? (Auth::user() ? Auth::user()->name : 'System'),
        ]);
    }

    public function exportApprovalTimelinePdfQueue(string $id, Request $request)
    {
        Log::info("Approval Timeline PDF Queue Request: id={$id}");
        $contract = Contract::findOrFail($id);

        try {
            $jobId = (string) Str::uuid();
            $userName = Auth::user() ? Auth::user()->name : 'System';

            // Parameters for the print view
            $params = array_merge($request->only(['status', 'role', 'department']), [
                'id' => $id,
                'generated_by' => $userName,
            ]);

            // Determine if we need to force 127.0.0.1 for local dev (Browsershot requirement)
            if (app()->environment('local')) {
                $rootUrl = config('app.url');
                if (str_contains($rootUrl, 'localhost')) {
                    URL::forceRootUrl(str_replace('localhost', '127.0.0.1', $rootUrl));
                }
            }

            // Generate the signed URL for the print view
            $printUrl = URL::temporarySignedRoute(
                'contracts.approval.document.print',
                now()->addMinutes(30),
                $params,
            );

            // Safe filename
            $safeNo = Str::slug($contract->contract_no ?: 'contract');
            $fileName = "Approval_Timeline_{$safeNo}_" . time() . '.pdf';

            // Add Job to Queue - FIXED ARGUMENT ORDER (jobId, printUrl, fileName)
            GeneratePdfJob::dispatch(
                $jobId,
                $printUrl,
                $fileName,
            );

            return response()->json([
                'success' => true,
                'job_id' => $jobId,
                'message' => 'Laporan alur approval sedang diproses.',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to queue Approval Timeline PDF: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses laporan alur approval.',
            ], 500);
        }
    }

    public function exportAuditPdfQueue(string $id, Request $request)
    {
        Log::info("Audit PDF Queue Request: id={$id}");
        $contract = Contract::findOrFail($id);

        try {
            $jobId = (string) Str::uuid();

            // Generate the signed URL for the print view
            $printUrl = URL::temporarySignedRoute(
                'contracts.audit.document.print',
                now()->addMinutes(30),
                [
                    'id' => $id,
                    'search' => $request->search,
                    'actor_id' => $request->actor_id,
                    'date_from' => $request->date_from,
                    'date_to' => $request->date_to,
                ],
            );

            // Force 127.0.0.1 on local dev
            if (app()->environment('local')) {
                $printUrl = str_replace('localhost', '127.0.0.1', $printUrl);
            }

            // Safe filename
            $safeNo = Str::slug($contract->contract_no ?: 'contract');
            $fileName = 'Audit_Trail_' . $safeNo . '_' . time() . '.pdf';

            Log::info("Dispatching Audit PDF Job: {$jobId}");

            // Queue the job using existing GeneratePdfJob
            GeneratePdfJob::dispatch($jobId, $printUrl, $fileName);

            Cache::put('pdf_status_' . $jobId, ['status' => 'pending', 'progress' => 10], 1800);

            return response()->json([
                'success' => true,
                'job_id' => $jobId,
            ]);

        } catch (\Exception $e) {
            Log::critical('Audit PDF Queue Failure: ' . $e->getMessage());

            return response()->json(['message' => 'Gagal antrikan PDF: ' . $e->getMessage()], 500);
        }
    }

    public function exportAuditPdf(string $id, Request $request)
    {
        set_time_limit(180);
        $contract = Contract::findOrFail($id);

        try {
            // Generate a signed URL for Browsershot to visit the React audit page
            // We use the specialized .print route which is outside auth
            $printUrl = URL::temporarySignedRoute(
                'contracts.audit.document.print',
                now()->addMinutes(15),
                ['id' => $id, 'search' => $request->search, 'actor_id' => $request->actor_id, 'date_from' => $request->date_from, 'date_to' => $request->date_to],
            );

            // Force 127.0.0.1 on local dev to avoid localhost resolution delays
            if (app()->environment('local')) {
                $printUrl = str_replace('localhost', '127.0.0.1', $printUrl);
            }

            // High-Fidelity PDF rendering via Browsershot
            $pdfContent = \Spatie\Browsershot\Browsershot::url($printUrl)
                ->setNodeBinary('/opt/homebrew/bin/node')
                ->setNpmBinary('/opt/homebrew/bin/npm')
                ->setChromePath('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
                ->noSandbox()
                ->addChromiumArguments([
                    '--disable-gpu',
                    '--disable-dev-shm-usage',
                    '--disable-setuid-sandbox',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-extensions',
                ])
                ->timeout(180)
                ->format('A4')
                ->margins(0, 0, 0, 0)
                ->showBackground()
                ->displayHeaderFooter(false)
                ->setDelay(500);

            $pdfDir = 'contracts/' . $contract->id . '/pdfs';
            $pdfFileName = 'Audit_Trail_' . Str::slug($contract->contract_no) . '_' . md5($printUrl) . '.pdf';
            $pdfPath = $pdfDir . '/' . $pdfFileName;
            $disposition = 'attachment';

            if (Storage::disk('local')->exists($pdfPath)) {
                $finalPdf = Storage::disk('local')->get($pdfPath);
            } else {
                $finalPdf = $pdfContent->pdf();

                // Save to cache
                if (! Storage::disk('local')->exists($pdfDir)) {
                    Storage::disk('local')->makeDirectory($pdfDir);
                }
                Storage::disk('local')->put($pdfPath, $finalPdf);
            }

            return response($finalPdf)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', "$disposition; filename=\"{$pdfFileName}\"");

        } catch (\Exception $e) {
            Log::error('Audit Trail Browsershot Export Failed: ' . $e->getMessage());

            // Fallback to legacy PDF if Browsershot fails
            $contract->load(['creator', 'contractType']);

            $query = $contract->histories()->with('actor');
            if ($request->filled('search')) {
                $query->where('description', 'like', '%' . $request->search . '%');
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

            $pdf = Pdf::loadView('pdf.contract-audit', [
                'contract' => $contract,
                'histories' => $histories,
                'generated_at' => now()->format('d M Y H:i'),
                'generated_by' => Auth::user()->name,
            ]);

            return $pdf->download("Audit_Trail_{$contract->contract_no}.pdf");
        }
    }

    public function renderAuditDocument(string $id, Request $request)
    {
        $contract = Contract::with(['vendor', 'contractType', 'creator', 'initiator'])->findOrFail($id);

        $query = $contract->histories()->with('actor');

        if ($request->filled('search')) {
            $query->where('description', 'like', '%' . $request->search . '%');
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

    public function exportFormSubmissionPdfQueue(Request $request, string $id, string $type)
    {
        Log::info("PDF Queue Request: id={$id}, type={$type}");
        $contract = Contract::where('id', $id)->first();
        if (! $contract) {
            Log::error("Contract not found in PDF Queue: {$id}");

            return response()->json(['message' => 'Contract not found.'], 404);
        }

        $submission = ContractFormSubmission::where('contract_id', $contract->id)
            ->where('document_type', $type)
            ->first();

        $templateId = $request->input('form_template_id');
        if ($templateId) {
            $template = FormTemplate::find($templateId);
        } else {
            $template = $submission ? $submission->template : FormTemplate::where('document_type', $type)->first();
        }

        if (! $template) {
            Log::error("Template not found in PDF Queue. Type: {$type}, Provided ID: " . ($templateId ?? 'none'));

            return response()->json(['message' => 'Template not found.'], 404);
        }

        // Get form data: Prioritize live data from request (Builder-like) then fallback to DB
        $formDataRaw = $request->input('data');
        if ($formDataRaw) {
            $formData = is_string($formDataRaw) ? json_decode($formDataRaw, true) : $formDataRaw;
        } else {
            $latestVersion = $submission ? $submission->versions()->orderByDesc('version_no')->first() : null;
            $formData = $latestVersion ? ($latestVersion->form_data ?? []) : [];
        }

        // Apply Smart Inheritance if it's F2
        if ($type === 'f2') {
            $f1Submission = ContractFormSubmission::where('contract_id', $contract->id)
                ->where('document_type', 'f1')
                ->first();

            $latestF1 = $f1Submission ? $f1Submission->versions()->orderByDesc('version_no')->first() : null;
            $f1Data = $latestF1 ? ($latestF1->form_data ?? []) : [];

            $formData = $this->exportAction->applyInheritance($f1Data, $contract, $formData);
        }

        try {
            $jobId = (string) Str::uuid();
            $cacheKey = 'pdf_adhoc_' . $jobId;

            Log::info("Prepping PDF Cache: {$cacheKey}");
            Cache::put($cacheKey, [
                'template' => $template->toArray() + ['fields' => $template->fields->toArray()],
                'formData' => $formData,
            ], 1800);

            $printUrl = URL::temporarySignedRoute(
                'admin.form-templates.render-adhoc',
                now()->addMinutes(30),
                ['key' => $cacheKey],
            );

            if (app()->environment('local')) {
                $printUrl = str_replace('localhost', '127.0.0.1', $printUrl);
            }

            // Safe filename (slugified contract number to avoid slash issues)
            $safeNo = $contract->contract_no ? Str::slug($contract->contract_no) : 'contract';
            $fileName = $safeNo . '_' . strtoupper($type) . '_' . time() . '.pdf';

            Log::info("Dispatching PDF Job: {$jobId} for file: {$fileName}");
            // Queue the job
            GeneratePdfJob::dispatch($jobId, $printUrl, $fileName);

            Cache::put('pdf_status_' . $jobId, ['status' => 'pending', 'progress' => 10], 1800);

            return response()->json([
                'success' => true,
                'job_id' => $jobId,
            ]);
        } catch (\Exception $e) {
            Log::critical("PDF Queue Failure for ID {$id}: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'type' => $type,
            ]);

            return response()->json([
                'message' => 'Gagal antrikan PDF: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function exportFormSubmissionPdf(string $id, string $type, string $disposition = 'attachment'): mixed
    {
        set_time_limit(120);

        $contract = Contract::findOrFail($id);

        $template = FormTemplate::where('document_type', $type)
            ->first();

        if (! $template) {
            return response()->json(['message' => "Form template $type not found."], 404);
        }

        $submission = ContractFormSubmission::where('contract_id', $contract->id)
            ->where('document_type', $type)
            ->first();

        $latestVersion = $submission ? $submission->versions()->orderByDesc('version_no')->first() : null;
        $formData = $latestVersion ? ($latestVersion->form_data ?? []) : [];

        // Apply Smart Inheritance if it's F2
        if ($type === 'f2') {
            $f1Submission = ContractFormSubmission::where('contract_id', $contract->id)
                ->where('document_type', 'f1')
                ->first();

            $latestF1 = $f1Submission ? $f1Submission->versions()->orderByDesc('version_no')->first() : null;
            $f1Data = $latestF1 ? ($latestF1->form_data ?? []) : [];

            $formData = $this->exportAction->applyInheritance($f1Data, $contract, $formData);
        }

        if (! $formData && $type === 'f1') {
            return response()->json(['message' => 'Data form belum diisi.'], 404);
        }

        // Cache Logic: Check if PDF already exists for this version
        $vno = $latestVersion ? $latestVersion->version_no : 0;
        $pdfDir = "contracts/{$id}/pdfs";
        $pdfFileName = "{$type}_v{$vno}.pdf";
        $pdfPath = "{$pdfDir}/{$pdfFileName}";

        if (Storage::disk('local')->exists($pdfPath)) {
            $content = Storage::disk('local')->get($pdfPath);

            return response($content)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', "$disposition; filename=\"{$pdfFileName}\"");
        }

        try {
            // Generate a signed URL for Browsershot to visit the React print page
            $printUrl = URL::temporarySignedRoute(
                'admin.form-templates.render-print',
                now()->addMinutes(10),
                ['template' => $template->id, 'data' => json_encode($formData)],
            );

            // Force 127.0.0.1 on local dev
            if (app()->environment('local')) {
                $printUrl = str_replace('localhost', '127.0.0.1', $printUrl);
            }

            $pdfContent = \Spatie\Browsershot\Browsershot::url($printUrl)
                ->setNodeBinary('/opt/homebrew/bin/node')
                ->setNpmBinary('/opt/homebrew/bin/npm')
                ->setChromePath('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
                ->noSandbox()
                ->addChromiumArguments([
                    '--disable-gpu',
                    '--disable-dev-shm-usage',
                    '--disable-setuid-sandbox',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-extensions',
                ])
                ->timeout(180)
                ->format('A4')
                ->margins(0, 0, 0, 0)
                ->showBackground()
                ->waitForSelector('#pdf-render-complete')
                ->setDelay(200);

            $finalPdf = $pdfContent->pdf();

            // Save to cache
            if (! Storage::disk('local')->exists($pdfDir)) {
                Storage::disk('local')->makeDirectory($pdfDir);
            }
            Storage::disk('local')->put($pdfPath, $finalPdf);

            return response($finalPdf)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', "$disposition; filename=\"{$pdfFileName}\"");

        } catch (\Exception $e) {
            Log::error('Browsershot Export Failed: ' . $e->getMessage());

            // Fallback to DomPDF if Browsershot fails
            $fields = $template->fields->sortBy('order');
            $pdf = Pdf::loadView('pdf.form-template', [
                'template' => $template,
                'formData' => $formData,
                'fields' => $fields,
                'contract' => $contract,
            ]);

            $safeNo = Str::slug($contract->contract_no ?: 'contract');
            $fileName = $safeNo . '_' . strtoupper($type) . '.pdf';
            if ($disposition === 'inline') {
                return $pdf->stream($fileName);
            }

            return $pdf->download($fileName);
        }
    }

    public function getAuditTrail(string $id, Request $request): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        $query = $contract->histories()->with('actor')->orderBy('created_at', 'desc');

        // Apply Filters
        if ($request->action) {
            $query->where('action', $request->action);
        }

        if ($request->actor_id) {
            $query->where('actor_id', $request->actor_id);
        }

        if ($request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->search) {
            $query->where('description', 'like', '%' . $request->search . '%');
        }

        return response()->json($query->get()->map(function ($h) {
            return [
                'id' => $h->id,
                'action' => $h->action,
                'description' => $h->description,
                'actor' => $h->actor ? [
                    'id' => $h->actor->id,
                    'name' => $h->actor->name,
                ] : null,
                'created_at' => $h->created_at->format('d/m/Y H:i'),
            ];
        }));
    }
}
