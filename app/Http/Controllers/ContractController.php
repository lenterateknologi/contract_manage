<?php

namespace App\Http\Controllers;

use App\Models\Approval;
use App\Models\Contract;
use App\Models\ContractAttachment;
use App\Models\ContractFormSubmission;
use App\Models\ContractFormSubmissionVersion;
use App\Models\FormTemplate;
use App\Models\ContractHistory;
use App\Models\ContractType;
use App\Models\ContractVersion;
use App\Models\Role;
use App\Models\User;
use App\Models\Workflow;
use App\Services\ContractWorkflowService;
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
use Illuminate\Support\Facades\URL;

use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ContractController extends Controller
{
    private ContractWorkflowService $workflowService;

    public function __construct(ContractWorkflowService $workflowService)
    {
        $this->workflowService = $workflowService;
    }

    public function index(Request $request): JsonResponse
    {
        $view = $request->query('view', 'contracts');
        $contracts = $this->getFilteredContractsQuery($request, $view)
            ->paginate($request->integer('per_page', 10))
            ->through(fn ($c) => $this->formatContract($c));

        return response()->json($contracts);
    }

    /**
     * Generalized method for Inertia contract views
     */
    public function contractsView(Request $request, string $view = 'contracts'): Response
    {
        $contracts = $this->getFilteredContractsQuery($request, $view)
            ->paginate($request->integer('per_page', 10))
            ->withQueryString()
            ->through(fn ($c) => $this->formatContract($c));

        $data = [
            'currentView' => $view,
            'contracts' => $contracts,
            'types' => ContractType::all(),
            'formTemplates' => \App\Models\FormTemplate::where('is_active', true)->with('contractType')->get()->map(fn ($ft) => [
                'id' => $ft->id,
                'name' => $ft->name,
                'description' => $ft->description,
                'document_type' => $ft->document_type,
                'contract_type_id' => $ft->contract_type_id,
                'contract_type_name' => $ft->contractType?->name,
                'fields_count' => $ft->fields()->count(),
            ]),
            'filters' => array_merge($request->only(['search', 'status', 'contract_type_id']), [
                'per_page' => $request->integer('per_page', 10),
            ]),
        ];

        $viewTitle = 'Manajemen Kontrak';
        $viewDesc = 'Daftar seluruh kontrak dalam sistem.';
        $viewIcon = 'FileText';

        switch ($view) {
            case 'dashboard':
                $viewTitle = 'Dashboard';
                $viewDesc = 'Statistik dan ringkasan aktivitas kontrak.';
                $viewIcon = 'LayoutGrid';
                break;
            case 'mine':
                $viewTitle = 'Kontrak Saya';
                $viewDesc = 'Daftar kontrak yang Anda buat.';
                $viewIcon = 'FileEdit';
                break;
            case 'pending':
                $viewTitle = 'Pending Approval';
                $viewDesc = 'Kontrak yang menunggu persetujuan Anda.';
                $viewIcon = 'Clock';
                break;
            case 'expiry':
                $viewTitle = 'Masa Berlaku';
                $viewDesc = 'Kontrak yang akan atau telah berakhir.';
                $viewIcon = 'History';
                break;
            case 'f1':
                $viewTitle = 'Formulir F1';
                $viewDesc = 'Daftar kontrak dengan dokumen F1.';
                $viewIcon = 'FilePlus';
                break;
            case 'f2':
                $viewTitle = 'Formulir F2';
                $viewDesc = 'Daftar kontrak dengan dokumen F2.';
                $viewIcon = 'FilePlus';
                break;
        }

        if ($view === 'dashboard') {
            $data['metrics'] = $this->getDashboardMetrics();
        }

        $data['breadcrumbs'] = [
            ['title' => 'Manajemen Kontrak', 'href' => route('contracts'), 'icon' => 'FileText'],
            ['title' => $viewTitle, 'href' => '#', 'description' => $viewDesc, 'icon' => $viewIcon],
        ];

        return Inertia::render('contracts/index', $data);
    }

    public function showView(Request $request, string $id): Response
    {
        $contract = Contract::with([
            'creator', 'contractType', 'approvals.approver', 'approvals.workflowStep',
            'workflow.steps', 'versions.uploader', 'histories.actor', 'messages.user',
            'attachments.uploader', 'formSubmissions',
        ])->findOrFail($id);
        
        // Authorization: Only Admin or Creator can view drafts
        if ($contract->status === 'draft' && $contract->created_by !== Auth::id() && Auth::user()->role !== 'Admin') {
            abort(403, 'Halaman tidak tersedia');
        }

        $contracts = $this->getFilteredContractsQuery($request, 'contracts')
            ->paginate($request->integer('per_page', 10))
            ->withQueryString()
            ->through(fn ($c) => $this->formatContract($c));

        $data = [
            'currentView' => 'contracts',
            'contracts' => $contracts,
            'initialSelected' => $this->formatContract($contract),
            'types' => ContractType::all(),
            'formTemplates' => \App\Models\FormTemplate::where('is_active', true)->with('contractType')->get()->map(fn ($ft) => [
                'id' => $ft->id,
                'name' => $ft->name,
                'description' => $ft->description,
                'document_type' => $ft->document_type,
                'contract_type_id' => $ft->contract_type_id,
                'contract_type_name' => $ft->contractType?->name,
                'fields_count' => $ft->fields()->count(),
            ]),
            'filters' => array_merge($request->only(['search', 'status', 'contract_type_id']), [
                'per_page' => $request->integer('per_page', 10),
            ]),
            'breadcrumbs' => [
                ['title' => 'Manajemen Kontrak', 'href' => route('contracts'), 'icon' => 'FileText'],
                ['title' => 'Detail Kontrak', 'href' => '#', 'description' => 'Melihat detail kontrak.', 'icon' => 'Eye'],
            ],
        ];

        return Inertia::render('contracts/show', $data);
    }

    private function getFilteredContractsQuery(Request $request, string $view = 'contracts')
    {
        $query = Contract::with([
            'creator', 'contractType', 'approvals.approver', 'approvals.workflowStep',
            'workflow.steps', 'versions.uploader', 'histories.actor', 'messages.user',
            'attachments.uploader', 'formSubmissions',
        ])->orderByDesc('created_at');

        // Apply View Filter
        switch ($view) {
            case 'mine':
                $query->where('created_by', Auth::id());
                break;
            case 'pending':
                $query->whereHas('approvals', function ($q) {
                    $q->where('user_id', Auth::id())
                        ->where('status', 'pending')
                        ->whereColumn('workflow_step_id', 't_contracts.workflow_step_id');
                });
                break;
            case 'expiry':
                $query->whereNotNull('end_date');
                break;
            case 'f1':
                $query->whereHas('versions', fn ($q) => $q->where('document_type', 'f1'));
                break;
            case 'f2':
                $query->whereHas('versions', fn ($q) => $q->where('document_type', 'f2'));
                break;
            case 'contracts':
            default:
                // If NOT an Admin, only show non-drafts OR drafts created by current user
                if (Auth::user()->role !== 'Admin') {
                    $query->where(function ($q) {
                        $q->where('status', '!=', 'draft')
                          ->orWhere('created_by', Auth::id());
                    });
                }
                break;
        }

        // Apply Search Filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'ilike', "%{$search}%")
                    ->orWhere('contract_no', 'ilike', "%{$search}%")
                    ->orWhereHas('creator', fn ($uq) => $uq->where('name', 'ilike', "%{$search}%"));
            });
        }

        // Apply Status Filter
        if ($request->filled('status') && $request->status !== 'all') {
            if (is_array($request->status)) {
                $query->whereIn('status', $request->status);
            } else {
                $query->where('status', $request->status);
            }
        }

        // Apply Type Filter
        if ($request->filled('contract_type_id') && $request->contract_type_id !== 'all') {
            if (is_array($request->contract_type_id)) {
                $query->whereIn('contract_type_id', $request->contract_type_id);
            } else {
                $query->where('contract_type_id', $request->contract_type_id);
            }
        }

        return $query;
    }

    private function getDashboardMetrics()
    {
        $user = Auth::user();
        $query = Contract::query();

        if ($user->role !== 'Admin') {
            $query->where('created_by', $user->id);
        }

        $approvedContracts = (clone $query)->where('status', 'approved')->get();
        $avgDays = 0;

        if ($approvedContracts->count() > 0) {
            $totalDays = $approvedContracts->sum(function ($c) {
                $firstSentAt = Approval::where('contract_id', $c->id)->oldest()->value('created_at');
                return $firstSentAt ? Carbon::parse($firstSentAt)->diffInHours($c->updated_at) / 24 : 0;
            });
            $avgDays = round($totalDays / $approvedContracts->count(), 1);
        }

        $monthlyTrend = Contract::leftJoin('m_contract_types', 't_contracts.contract_type_id', '=', 'm_contract_types.id')
            ->select(
                DB::raw("to_char(t_contracts.created_at, 'YYYY-MM') as month"),
                'm_contract_types.name as type_name',
                DB::raw('count(*) as count')
            )
            ->where('t_contracts.created_at', '>=', now()->subMonths(6))
            ->groupBy('month', 'type_name')
            ->orderBy('month')
            ->get()
            ->groupBy('month')
            ->map(function ($items, $month) {
                return [
                    'month' => $month,
                    'types' => $items->map(fn ($i) => [
                        'name' => $i->type_name ?? 'Unspecified',
                        'count' => (int) $i->count,
                    ])->values(),
                    'total' => $items->sum('count'),
                ];
            })->values();

        return [
            'metrics' => [
                'avgCycleTime' => $avgDays,
                'totalContracts' => $query->count(),
                'pendingApprovals' => Approval::where('user_id', Auth::id())->where('status', 'pending')->count(),
                'approvedThisMonth' => (clone $query)->where('status', 'approved')
                    ->where('updated_at', '>=', now()->startOfMonth())
                    ->count(),
            ],
            'monthlyTrend' => $monthlyTrend,
        ];
    }

    public function getTypes(): JsonResponse
    {
        return response()->json(ContractType::all());
    }

    public function show(string $id): JsonResponse
    {
        $contract = Contract::with([
            'creator',
            'versions.uploader',
            'approvals.approver',
            'approvals.workflowStep',
            'workflow.steps',
            'histories.actor',
            'messages.user',
            'attachments.uploader',
            'contractType',
            'formSubmissions',
        ])->findOrFail($id);
        
        // Authorization: Only Admin or Creator can view drafts
        if ($contract->status === 'draft' && $contract->created_by !== Auth::id() && Auth::user()->role !== 'Admin') {
            abort(403, 'Halaman tidak tersedia');
        }

        return response()->json($this->formatContract($contract));
    }

    public function getWorkflows(): JsonResponse
    {
        return response()->json(Workflow::where('is_template', true)->with('steps')->get());
    }

    public function getUsers(): JsonResponse
    {
        return response()->json(User::orderBy('name')->get()->map(fn($u) => $this->formatUser($u)));
    }

    public function getRoles(): JsonResponse
    {
        return response()->json(Role::orderBy('name')->get());
    }

    public function send(Request $request, string $id): JsonResponse
    {
        try {
            $contract = Contract::findOrFail($id);

            if ($contract->status !== 'draft') {
                return response()->json(['message' => 'Only draft contracts can be sent.'], 422);
            }

            $workflowId = $request->input('workflow_id');
            $customSteps = $request->input('custom_steps');

            // Use workflow service to send for approval
            $contract = $this->workflowService->sendForApproval($contract, $workflowId, $customSteps);

            $contract->load(['creator', 'versions.uploader', 'approvals.approver', 'approvals.workflowStep', 'workflow.steps', 'histories.actor', 'messages.user', 'workflow', 'workflowStep']);

            return response()->json($this->formatContract($contract), 200);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'contract_type_id' => 'required|exists:m_contract_types,id',
            'transaction_type' => 'nullable|string|in:Perjanjian Baru,Addendum,Amandement,Perubahan Perjanjian',
            'tax_required' => 'nullable|boolean',
        ]);

        return DB::transaction(function () use ($validated) {
            $userId = Auth::id();

            $contract = Contract::create([
                'contract_no' => 'CTR-'.date('Y').'-'.strtoupper(Str::random(5)),
                'title' => $validated['title'],
                'description' => $validated['description'] ?? '—',
                'contract_type_id' => $validated['contract_type_id'],
                'transaction_type' => $validated['transaction_type'] ?? 'Perjanjian Baru',
                'status' => 'draft',
                'created_by' => $userId,
                'metadata' => [
                    'tax_required' => $validated['tax_required'] ?? false,
                ]
            ]);

            ContractHistory::create(['contract_id' => $contract->id, 'action' => 'CONTRACT_CREATED', 'description' => 'Kontrak dibuat', 'actor_id' => $userId]);

            $contract->load(['creator', 'versions.uploader', 'approvals.approver', 'histories.actor', 'messages.user', 'contractType']);

            return response()->json($this->formatContract($contract), 201);
        });
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        if ($contract->status !== 'draft') {
            return response()->json(['message' => 'Hanya kontrak berstatus draft yang dapat diedit.'], 422);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'contract_no' => 'nullable|string',
            'contract_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'contract_type_id' => 'nullable|exists:m_contract_types,id',
            'transaction_type' => 'nullable|string|in:Perjanjian Baru,Addendum,Amandement,Perubahan Perjanjian',
        ]);

        $contract->update($validated);

        ContractHistory::create([
            'contract_id' => $contract->id,
            'action' => 'CONTRACT_UPDATED',
            'description' => 'Informasi kontrak diperbarui',
            'actor_id' => Auth::id(),
        ]);

        return response()->json($this->formatContract($contract->fresh()));
    }

    public function destroy(string $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        if ($contract->status !== 'draft') {
            return response()->json(['message' => 'Hanya kontrak berstatus draft yang dapat dihapus.'], 422);
        }

        return DB::transaction(function () use ($contract) {
            // Delete from storage
            Storage::disk('local')->deleteDirectory("contracts/{$contract->id}");

            // Other relations are deleted by database cascade
            $contract->delete();

            return response()->json(['message' => 'Kontrak berhasil dihapus.']);
        });
    }

    public function approve(Request $request, string $id): JsonResponse
    {
        $request->validate(['note' => 'nullable|string']);

        $contract = Contract::findOrFail($id);

        // Find the pending approval for the current user
        $approval = Approval::where('contract_id', $id)
            ->where('user_id', Auth::id())
            ->where('status', 'pending')
            ->first();

        if (! $approval) {
            return response()->json(['message' => 'No pending approval found for you.'], 422);
        }

        $contract = $this->workflowService->approveContract($contract, $approval, $request->note);

        return response()->json($this->formatContract($contract));
    }

    public function reject(Request $request, string $id): JsonResponse
    {
        $request->validate(['reason' => 'required|string']);

        $contract = Contract::findOrFail($id);

        // Find the pending approval for the current user
        $approval = Approval::where('contract_id', $id)
            ->where('user_id', Auth::id())
            ->where('status', 'pending')
            ->first();

        if (! $approval) {
            return response()->json(['message' => 'No pending approval found for you.'], 422);
        }

        $contract = $this->workflowService->rejectContract($contract, $approval, $request->reason);

        return response()->json($this->formatContract($contract));
    }

    public function uploadRevision(Request $request, string $id): JsonResponse
    {
        try {
            $request->validate([
                'document_type' => 'nullable|string|in:contract,f1,f2',
                'changelog' => 'required|string',
                'file' => 'required|file|extensions:docx,doc,pdf|max:102400',
            ]);
        } catch (ValidationException $e) {
            Log::error('Validation Failed on Revision', [
                'contract_id' => $id,
                'errors' => $e->errors(),
            ]);
            throw $e;
        }

        $type = $request->input('document_type', 'contract');
        $contract = Contract::findOrFail($id);

        // Find latest version for this type
        $lastVer = ContractVersion::where('contract_id', $contract->id)
            ->where('document_type', $type)
            ->max('version_no') ?? 0;

        $newVer = $lastVer + 1;
        $userId = Auth::id();
        $hash = Str::random(12).'...';

        $typeLabel = strtoupper($type);
        $ext = $request->file('file')->getClientOriginalExtension();
        $fileName = "{$contract->contract_no}_{$typeLabel}_v{$newVer}.{$ext}";
        $filePath = $request->file('file')->storeAs("contracts/{$contract->id}", "v{$newVer}_{$type}_{$fileName}", 'local');

        ContractVersion::create([
            'contract_id' => $contract->id,
            'document_type' => $type,
            'version_no' => $newVer,
            'file_name' => $fileName,
            'file_path' => $filePath,
            'change_log' => $request->changelog,
            'uploaded_by' => $userId,
            'file_hash' => $hash,
        ]);

        // If it's a 'contract' type revision, update the main contract pointer
        if ($type === 'contract') {
            $contract->update(['current_version' => $newVer]);
        }

        // Reset status and approvals regardless of doc type (any revision restarts process)
        $contract->update(['status' => 'in_review']);

        $approvals = $contract->approvals()->orderBy('sequence')->get();
        foreach ($approvals as $i => $a) {
            $a->update(['status' => $i === 0 ? 'pending' : 'waiting', 'note' => null, 'approved_at' => null]);
        }

        ContractHistory::create([
            'contract_id' => $contract->id,
            'action' => 'FILE_UPLOADED',
            'description' => "Upload revisi {$typeLabel} v{$newVer}",
            'actor_id' => $userId,
        ]);

        $contract->load(['creator', 'versions.uploader', 'approvals.approver', 'histories.actor', 'messages.user', 'attachments.uploader']);

        return response()->json($this->formatContract($contract));
    }

    public function download(string $id): mixed
    {
        $contract = Contract::findOrFail($id);
        $version = $contract->currentVersionModel();

        if ($version && $version->file_path && Storage::disk('local')->exists($version->file_path)) {
            return response()->download(Storage::disk('local')->path($version->file_path), $version->file_name);
        }

        return response()->json(['message' => 'File not found.'], 404);
    }

    public function fileContent(string $id, int $versionNo, Request $request): mixed
    {
        $type = $request->query('type', 'contract');
        $contract = Contract::findOrFail($id);
        $version = $contract->versions()
            ->where('document_type', $type)
            ->where('version_no', $versionNo)
            ->firstOrFail();

        if ($version->file_path && Storage::disk('local')->exists($version->file_path)) {
            return response()->download(Storage::disk('local')->path($version->file_path), $version->file_name);
        }

        return response()->json(['message' => 'File not found.'], 404);
    }

    public function attachmentFile(string $id, string $atId): mixed
    {
        $contract = Contract::findOrFail($id);
        $attachment = $contract->attachments()->findOrFail($atId);

        if ($attachment->file_path && Storage::disk('local')->exists($attachment->file_path)) {
            return response()->download(Storage::disk('local')->path($attachment->file_path), $attachment->file_name);
        }

        return response()->json(['message' => 'File not found.'], 404);
    }

    public function changeVersion(Request $request, string $id): JsonResponse
    {
        $request->validate(['version_no' => 'required|integer']);

        $contract = Contract::findOrFail($id);
        $version = $contract->versions()->where('version_no', $request->version_no)->firstOrFail();

        $contract->update(['current_version' => $request->version_no]);

        ContractHistory::create([
            'contract_id' => $contract->id,
            'action' => 'VERSION_CHANGED',
            'description' => "Versi aktif diubah ke v{$request->version_no}",
            'actor_id' => Auth::id(),
        ]);

        $contract->load(['creator', 'versions.uploader', 'approvals.approver', 'histories.actor', 'messages.user']);

        return response()->json($this->formatContract($contract));
    }

    public function pdfPreview(Request $request, string $id, int $versionNo): mixed
    {
        $type = $request->query('type', 'contract');

        // UNIFIED EXPORT: If type is F1 or F2, use the high-fidelity form-based generation logic
        // For previews, we want the PDF to be displayed inline in the browser
        if ($type === 'f1' || $type === 'f2') {
            return $this->exportFormSubmissionPdf($id, $type, 'inline');
        }

        $contract = Contract::findOrFail($id);
        $version = $contract->versions()
            ->where('document_type', $type)
            ->where('version_no', $versionNo)
            ->firstOrFail();

        if (! $version->file_path || ! Storage::disk('local')->exists($version->file_path)) {
            return response()->json(['message' => 'Source file not found.'], 404);
        }

        $sourcePath = Storage::disk('local')->path($version->file_path);
        $pdfDir = Storage::disk('local')->path("contracts/{$id}/pdfs");
        $pdfPath = $pdfDir.'/'.pathinfo($version->file_path, PATHINFO_FILENAME).'.pdf';

        if (! file_exists($pdfDir)) {
            mkdir($pdfDir, 0755, true);
        }

        if (! file_exists($pdfPath)) {
            $soffice = '/Applications/LibreOffice.app/Contents/MacOS/soffice';
            // Use a specific user installation dir to avoid common headless errors on macOS/Server
            $userDir = 'file://'.sys_get_temp_dir().'/soffice_user_'.md5($id);
            $command = "export HOME=/tmp && \"{$soffice}\" -env:UserInstallation={$userDir} --headless --convert-to pdf --outdir \"{$pdfDir}\" \"{$sourcePath}\" 2>&1";
            $output = shell_exec($command);

            if (! file_exists($pdfPath)) {
                Log::error('PDF Generation Failed', [
                    'command' => $command,
                    'output' => $output,
                ]);

                return response()->json([
                    'message' => 'Failed to generate PDF.',
                    'debug' => $output,
                    'path' => $sourcePath,
                ], 500);
            }
        }

        if (file_exists($pdfPath)) {
            return response()->file($pdfPath, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="'.basename($pdfPath).'"',
            ]);
        }

        return response()->json(['message' => 'Failed to generate PDF.'], 500);
    }

    public function attachmentPdfPreview(string $id, string $atId): mixed
    {
        $contract = Contract::findOrFail($id);
        $attachment = $contract->attachments()->findOrFail($atId);

        if (! $attachment->file_path || ! Storage::disk('local')->exists($attachment->file_path)) {
            return response()->json(['message' => 'File not found.'], 404);
        }

        $sourcePath = Storage::disk('local')->path($attachment->file_path);
        $pdfDir = Storage::disk('local')->path("contracts/{$id}/attachments/pdfs");
        $pdfPath = $pdfDir.'/'.pathinfo($attachment->file_path, PATHINFO_FILENAME).'.pdf';

        if (! file_exists($pdfDir)) {
            mkdir($pdfDir, 0755, true);
        }

        if (! file_exists($pdfPath)) {
            // If it's already a PDF, just copy/link it
            if (strtolower(pathinfo($attachment->file_path, PATHINFO_EXTENSION)) === 'pdf') {
                copy($sourcePath, $pdfPath);
            } else {
                $soffice = '/Applications/LibreOffice.app/Contents/MacOS/soffice';
                $userDir = 'file://'.sys_get_temp_dir().'/soffice_user_at_'.md5($atId);
                $command = "export HOME=/tmp && \"{$soffice}\" -env:UserInstallation={$userDir} --headless --convert-to pdf --outdir \"{$pdfDir}\" \"{$sourcePath}\" 2>&1";
                shell_exec($command);
            }
        }

        if (file_exists($pdfPath)) {
            return response()->file($pdfPath, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="'.basename($pdfPath).'"',
            ]);
        }

        return response()->json(['message' => 'Failed to generate PDF.'], 500);
    }

    public function uploadAttachment(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'label' => 'required|string|max:255',
            'category' => 'nullable|string|max:255',
            'file' => 'required|file|max:102400',
        ]);

        $contract = Contract::findOrFail($id);
        $file = $request->file('file');
        $name = $file->getClientOriginalName();
        $ext = $file->getClientOriginalExtension();
        $path = $file->storeAs("contracts/{$contract->id}/attachments", Str::uuid().".{$ext}", 'local');

        ContractAttachment::create([
            'contract_id' => $contract->id,
            'label' => $request->label,
            'category' => $request->category,
            'file_name' => $name,
            'file_path' => $path,
            'file_type' => $file->getMimeType(),
            'uploaded_by' => Auth::id(),
        ]);

        ContractHistory::create([
            'contract_id' => $contract->id,
            'action' => 'FILE_UPLOADED',
            'description' => "Upload lampiran: {$request->label} ({$name})",
            'actor_id' => Auth::id(),
        ]);

        $contract->load(['creator', 'versions.uploader', 'approvals.approver', 'histories.actor', 'messages.user', 'attachments.uploader']);

        return response()->json($this->formatContract($contract));
    }

    public function deleteAttachment(string $id, string $atId): JsonResponse
    {
        $contract = Contract::findOrFail($id);
        $attachment = $contract->attachments()->findOrFail($atId);

        if (Storage::disk('local')->exists($attachment->file_path)) {
            Storage::disk('local')->delete($attachment->file_path);
        }

        $attachment->delete();

        ContractHistory::create([
            'contract_id' => $contract->id,
            'action' => 'FILE_DELETED',
            'description' => "Hapus lampiran: {$attachment->label}",
            'actor_id' => Auth::id(),
        ]);

        $contract->load(['creator', 'versions.uploader', 'approvals.approver', 'histories.actor', 'messages.user', 'attachments.uploader']);

        return response()->json($this->formatContract($contract));
    }

    // ── Format helpers (Exposed for use in routes) ──────────────────────
    public function formatContract(Contract $c): array
    {
        $progress = $c->progressData();

        return [
            'id' => $c->id,
            'contract_no' => $c->contract_no,
            'title' => $c->title,
            'description' => $c->description,
            'contract_type' => $c->contract_type,
            'contract_date' => $c->contract_date,
            'end_date' => $c->end_date,
            'contract_type' => $c->contractType?->name ?? '—',
            'contract_type_id' => $c->contract_type_id,
            'created_by' => $c->created_by,
            'transaction_type' => $c->transaction_type,
            'status' => $c->status,
            'current_version' => $c->current_version,
            'created_at' => $c->created_at->toDateString(),
            'submitted_at' => $c->submitted_at ? $c->submitted_at->format('Y-m-d H:i') : null,
            'creator' => $this->formatUser($c->creator),
            'progress' => $progress,
            'workflow_id' => $c->workflow_id,
            'workflow_step_id' => $c->workflow_step_id,
            'workflow' => $c->workflow ? [
                'id' => $c->workflow->id,
                'name' => $c->workflow->name,
                'contract_type' => $c->workflow->contract_type,
            ] : null,
            'workflow_step' => $c->workflowStep ? [
                'id' => $c->workflowStep->id,
                'step' => $c->workflowStep->step,
                'role' => $c->workflowStep->role,
                'description' => $c->workflowStep->description,
            ] : null,
            'versions' => $c->versions->map(fn ($v) => [
                'id' => $v->id,
                'document_type' => $v->document_type,
                'version_no' => $v->version_no,
                'file_name' => $v->file_name,
                'change_log' => $v->change_log,
                'uploaded_by' => $v->uploaded_by,
                'is_final' => (bool) $v->is_final,
                'file_hash' => $v->file_hash,
                'has_file' => (bool) $v->file_path,
                'created_at' => $v->created_at->toDateString(),
                'uploader' => $this->formatUser($v->uploader),
            ])->sortByDesc('version_no')->values(),
            'approvals' => $this->mapApprovalTimeline($c),
            'workflow_id' => $c->workflow_id,
            'workflow_step_id' => $c->workflow_step_id,
            'histories' => $c->histories->map(fn ($h) => [
                'action' => $h->action,
                'description' => $h->description,
                'actor_id' => $h->actor_id,
                'created_at' => $h->created_at->format('Y-m-d H:i'),
                'actor' => $this->formatUser($h->actor),
            ])->sortByDesc('created_at')->values(),
            'messages' => $c->messages->map(fn ($m) => [
                'id' => $m->id,
                'user_id' => $m->user_id,
                'message' => $m->message,
                'read_by' => $m->read_by ?? [],
                'created_at' => $m->created_at->format('Y-m-d H:i'),
                'user' => $this->formatUser($m->user),
            ]),
            'attachments' => $c->attachments->map(fn ($at) => [
                'id' => $at->id,
                'label' => $at->label,
                'category' => $at->category,
                'file_name' => $at->file_name,
                'file_type' => $at->file_type,
                'created_at' => $at->created_at->toDateString(),
                'uploader' => $this->formatUser($at->uploader),
            ]),
            'form_submissions' => $c->formSubmissions->map(fn ($fs) => [
                'id' => $fs->id,
                'document_type' => $fs->document_type,
                'form_template_id' => $fs->form_template_id,
                'current_version' => $fs->current_version,
                'submitted_by' => $fs->submitted_by,
                'updated_at' => $fs->updated_at->format('Y-m-d H:i'),
            ]),
        ];
    }

    public function mapApprovalTimeline($c)
    {
        // If no workflow assigned yet, return empty or default empty steps
        if (! $c->workflow) {
            return [];
        }

        $timeline = [];
        $workflowSteps = $c->workflow->steps->sortBy('step');

        foreach ($workflowSteps as $step) {
            $approvals = $c->approvals->where('workflow_step_id', $step->id);
            
            // Resolve Department Name
            $deptName = $step->department?->name;
            if (!$deptName && $step->step === 1 && $c->creator?->department) {
                $deptName = $c->creator->department->name;
            }

            // Resolve Specific Names (if any)
            $targetApprovers = null;
            if ($step->approver_type === 'user') {
                $targetApprovers = $step->users->pluck('name')->implode(', ');
            }

            if ($approvals->isNotEmpty()) {
                // If we have actual approval records for this step
                foreach ($approvals as $a) {
                    $timeline[] = [
                        'id' => $a->id,
                        'user_id' => $a->user_id,
                        'approver_name' => $a->approver_name,
                        'role' => $a->role,
                        'department_name' => $deptName,
                        'target_approvers' => $targetApprovers,
                        'sequence' => $step->step,
                        'status' => $a->status,
                        'note' => $a->comment,
                        'approved_at' => $a->decided_at?->toDateTimeString(),
                        'approver' => $this->formatUser($a->approver),
                    ];
                }
            } else {
                // Future step placeholder
                $timeline[] = [
                    'id' => 'step-'.$step->id,
                    'user_id' => null,
                    'approver_name' => 'Pendataan '.$step->role,
                    'role' => $step->role,
                    'department_name' => $deptName,
                    'target_approvers' => $targetApprovers,
                    'sequence' => $step->step,
                    'status' => 'waiting',
                    'note' => null,
                    'approved_at' => null,
                    'approver' => ['name' => 'Approver '.$step->role],
                ];
            }
        }

        return $timeline;
    }

    public function formatUser($user): ?array
    {
        if (! $user) {
            return null;
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'initials' => $user->initials,
            'role' => $user->role,
            'department_id' => $user->department_id,
            'bg_color' => $user->bg_color,
            'text_color' => $user->text_color,
        ];
    }

    // ── Form Submission (F1/F2) ──────────────────────────────────────

    /**
     * Save or update a form submission for a contract.
     */
    public function saveFormSubmission(Request $request, string $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        $request->validate([
            'form_template_id' => 'required|uuid|exists:m_form_templates,id',
            'document_type' => 'required|in:f1,f2',
            'form_data' => 'required|array',
        ]);

        $docType = $request->document_type;
        $formData = $request->form_data;

        // Find or create submission
        $submission = ContractFormSubmission::firstOrNew([
            'contract_id' => $contract->id,
            'document_type' => $docType,
        ]);

        $isNew = !$submission->exists;

        if ($isNew) {
            $submission->form_template_id = $request->form_template_id;
            $submission->submitted_by = Auth::id();
            $submission->current_version = 1;
            $submission->save();
        }

        // Determine version number
        $versionNo = $isNew ? 1 : $submission->current_version + 1;

        // Build change summary
        $changeSummary = null;
        if (!$isNew) {
            $prevVersion = $submission->versions()->where('version_no', $submission->current_version)->first();
            if ($prevVersion) {
                $oldData = $prevVersion->form_data ?? [];
                $changes = [];
                foreach ($formData as $key => $val) {
                    $oldVal = $oldData[$key] ?? null;
                    if ($val !== $oldVal) {
                        $changes[] = $key;
                    }
                }
                if (!empty($changes)) {
                    $changeSummary = 'Perubahan pada: ' . implode(', ', array_slice($changes, 0, 10));
                    if (count($changes) > 10) $changeSummary .= ' (dan ' . (count($changes) - 10) . ' lainnya)';
                }
            }
        }

        // Create version
        ContractFormSubmissionVersion::create([
            'submission_id' => $submission->id,
            'version_no' => $versionNo,
            'form_data' => $formData,
            'change_summary' => $changeSummary,
            'created_by' => Auth::id(),
        ]);

        // Update current version
        $submission->current_version = $versionNo;
        $submission->save();

        // Sync critical fields from F1 to Contract main table
        if ($docType === 'f1') {
            $syncFields = [
                'transaction_mode' => 'transaction_type',
                'jenis_transaksi_pks' => 'transaction_type',
                'contract_title' => 'title',
                'judul_kontrak' => 'title',
            ];
            $updates = [];
            foreach ($syncFields as $formField => $contractField) {
                if (isset($formData[$formField]) && !empty($formData[$formField])) {
                    $updates[$contractField] = $formData[$formField];
                }
            }
            if (!empty($updates)) {
                $contract->update($updates);
            }
        }

        // Log to contract history
        $action = $isNew ? "form_{$docType}_submitted" : "form_{$docType}_updated";
        $desc = $isNew
            ? 'Form ' . strtoupper($docType) . ' telah diisi (v1)'
            : 'Form ' . strtoupper($docType) . " diperbarui ke v{$versionNo}" . ($changeSummary ? ". {$changeSummary}" : '');

        ContractHistory::create([
            'contract_id' => $contract->id,
            'action' => $action,
            'description' => $desc,
            'actor_id' => Auth::id(),
        ]);

        // Return updated contract
        $contract->load(['versions.uploader', 'approvals.user', 'approvals.workflowStep', 'creator', 'histories.actor', 'messages.user', 'attachments.uploader', 'contractType', 'workflow.steps', 'workflowStep', 'formSubmissions']);

        return response()->json($this->formatContract($contract));
    }

    /**
     * Get form submission data for a contract by document type.
     */
    public function getFormSubmission(string $id, string $type): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        $submission = ContractFormSubmission::where('contract_id', $contract->id)
            ->where('document_type', $type)
            ->first();

        $versions = [];
        $prefillData = null;

        if ($submission) {
            $versions = $submission->versions()->with('createdBy')->get()->map(fn ($v) => [
                'id' => $v->id,
                'version_no' => $v->version_no,
                'form_data' => $v->form_data,
                'change_summary' => $v->change_summary,
                'created_by' => $this->formatUser($v->createdBy),
                'created_at' => $v->created_at->format('Y-m-d H:i'),
            ]);
        } else {
            // Apply Smart Inheritance for NEW submissions if type is F2
            if ($type === 'f2') {
                $f1Submission = ContractFormSubmission::where('contract_id', $contract->id)
                    ->where('document_type', 'f1')
                    ->first();
                
                if ($f1Submission) {
                    $latestF1 = $f1Submission->versions()->orderByDesc('version_no')->first();
                    $f1Data = $latestF1 ? ($latestF1->form_data ?? []) : [];
                    $prefillData = $this->applyInheritance($f1Data, $contract);
                }
            }
        }

        return response()->json([
            'submission' => $submission ? [
                'id' => $submission->id,
                'document_type' => $submission->document_type,
                'form_template_id' => $submission->form_template_id,
                'current_version' => $submission->current_version,
                'submitted_by' => $submission->submitted_by,
            ] : null,
            'versions' => $versions,
            'prefill_data' => $prefillData, // Frontend can use this to initialize new forms
        ]);
    }

    /**
     * Export contract form submission to PDF via Background Queue.
     */
    public function exportFormSubmissionPdfQueue(Request $request, string $id, string $type)
    {
        Log::info("PDF Queue Request: id={$id}, type={$type}");
        $contract = Contract::where('id', $id)->first();
        if (!$contract) {
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

        if (!$template) {
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
            
            $formData = $this->applyInheritance($f1Data, $contract, $formData);
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
                ['key' => $cacheKey]
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
                'job_id' => $jobId
            ]);
        } catch (\Exception $e) {
            Log::critical("PDF Queue Failure for ID {$id}: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'type' => $type
            ]);
            return response()->json([
                'message' => 'Gagal antrikan PDF: ' . $e->getMessage(),
            ], 500);
        }
    }


    /**
     * Export a contract's form submission (F1/F2) to PDF.
     * Uses the standard form-template blade for both, but maps F1 data for F2.
     */
    public function exportFormSubmissionPdf(string $id, string $type, string $disposition = 'attachment'): mixed
    {
        set_time_limit(120);

        $contract = Contract::findOrFail($id);

        $template = FormTemplate::where('document_type', $type)
            ->first();

        if (!$template) {
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
            
            $formData = $this->applyInheritance($f1Data, $contract, $formData);
        }

        if (!$formData && $type === 'f1') {
            return response()->json(['message' => 'Data form belum diisi.'], 404);
        }

        try {
            // Generate a signed URL for Browsershot to visit the React print page
            $printUrl = \Illuminate\Support\Facades\URL::temporarySignedRoute(
                'admin.form-templates.render-print',
                now()->addMinutes(10),
                ['template' => $template->id, 'data' => json_encode($formData)]
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
                    '--disable-extensions'
                ])
                ->timeout(180)
                ->format('A4')
                ->margins(0, 0, 0, 0)
                ->showBackground()
                ->waitForSelector('#pdf-render-complete')
                ->setDelay(200)
                ->pdf();







            $fileName = $contract->contract_no . '_' . strtoupper($type) . '.pdf';
            return response($pdfContent)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', $disposition . '; filename="' . $fileName . '"');

        } catch (\Exception $e) {
            Log::error('Browsershot Export Failed: ' . $e->getMessage());

            // Fallback to DomPDF if Browsershot fails
            $fields = $template->fields->sortBy('order');
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.form-template', [
                'template' => $template,
                'formData' => $formData,
                'fields' => $fields,
                'contract' => $contract,
            ]);
            
            $fileName = $contract->contract_no . '_' . strtoupper($type) . '.pdf';
            if ($disposition === 'inline') {
                return $pdf->stream($fileName);
            }
            return $pdf->download($fileName);
        }
    }


    /**
     * Internal logic for F1 -> F2 data mapping
     */
    private function applyInheritance(array $f1Data, Contract $contract, array $existingData = []): array
    {
        $formData = array_merge($f1Data, $existingData);
        
        $inheritanceMap = [
            'perjanjian_tentang' => ['bv_f1_title', 'f1_title', 'judul', 'perjanjian_xxxx', 'judul_kontrak'],
            'tanggal' => ['bv_f1_date', 'f1_date', 'tanggal_perjanjian', 'tanggal'],
            'pihak_pertama' => ['v_p1_entity', 'p1_entity', 'pihak_i_(pt.)', 'nama_pihak_1', 'pihak_i'],
            'pihak_kedua' => ['v_p2_entity', 'p2_entity', 'pihak_ii_(pt.)', 'pihak_ii_(perorangan)', 'nama_pihak_2', 'pihak_ii'],
            'ruang_lingkup' => ['bv_f1_tujuan', 'f1_tujuan', 'lingkup_pekerjaan', 'ruang_lingkup'],
            'harga_pekerjaan' => ['tdv_price', 'price', 'harga/fee', 'nilai_kontrak', 'harga_fee'],
            'cara_pembayaran' => ['tdv_top', 'top', 'terms_of_payment', 'mekanisme_pembayaran'],
            'jangka_waktu' => ['tdv_jw', 'jw', 'masa_berlaku', 'jangka_waktu'],
            'lokasi' => ['tdv_loc', 'loc', 'lokasi_area', 'lokasi'],
            'nama_pihak_1' => ['v_p1_signer', 'p1_signer', 'penandatangan_pihak_i', 'signer_pihak_1'],
            'jabatan_pihak_1' => ['v_p1_position', 'p1_position', 'jabatan_pihak_i', 'position_pihak_1'],
            'nama_pihak_2' => ['v_p2_signer', 'p2_signer', 'penandatangan_pihak_ii', 'signer_pihak_2'],
            'jabatan_pihak_2' => ['v_p2_position', 'p2_position', 'jabatan_pihak_ii', 'position_pihak_2'],
            'objek_perjanjian' => ['bv_f1_tujuan', 'f1_tujuan', 'ruang_lingkup'],
        ];

        foreach ($inheritanceMap as $target => $sources) {
            if (!isset($formData[$target]) || empty($formData[$target])) {
                foreach ($sources as $source) {
                    if (isset($f1Data[$source]) && !empty($f1Data[$source])) {
                        $formData[$target] = $f1Data[$source];
                        // Also set the uppercase version
                        $formData[strtoupper($target)] = $f1Data[$source];
                        break;
                    }
                }
            }
        }

        // Handle specific signature requirements for resume logic
        if (!isset($formData['nama_pihak_1']) || empty($formData['nama_pihak_1'])) {
             $formData['nama_pihak_1'] = $f1Data['v_p1_signer'] ?? ($f1Data['p1_signer'] ?? ($f1Data['pihak_i'] ?? ''));
        }

        // Meta context
        if (!isset($formData['no_kontrak'])) $formData['no_kontrak'] = $contract->contract_no;
        if (!isset($formData['no_perjanjian'])) $formData['no_perjanjian'] = $contract->contract_no;
        if (!isset($formData['pic'])) $formData['pic'] = $contract->creator->name ?? '';
        if (!isset($formData['dimohonkan_oleh'])) $formData['dimohonkan_oleh'] = $contract->creator->name ?? '';

        return $formData;
    }
    /**
     * Convert an image path/URL to Base64 to prevent network deadlocks in PDF generation.
     */
    private function getLogoBase64(?string $logoUrl): ?string
    {
        if (!$logoUrl) return null;

        try {
            $path = null;
            if (str_starts_with($logoUrl, '/storage/')) {
                $trimmedPath = str_replace('/storage/', '', $logoUrl);
                $path = storage_path('app/public/' . $trimmedPath);
            } elseif (file_exists(public_path($logoUrl))) {
                $path = public_path($logoUrl);
            } elseif (str_starts_with($logoUrl, 'http')) {
                $content = file_get_contents($logoUrl);
                $type = pathinfo(parse_url($logoUrl, PHP_URL_PATH), PATHINFO_EXTENSION) ?: 'png';
                return 'data:image/' . $type . ';base64,' . base64_encode($content);
            }

            if ($path && file_exists($path)) {
                $type = pathinfo($path, PATHINFO_EXTENSION);
                $data = file_get_contents($path);
                return 'data:image/' . $type . ';base64,' . base64_encode($data);
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('PDF Logo Base64 failed: ' . $e->getMessage());
        }

        return null;
    }

    /**
     * Upload an agreement drawing/document (Word only)
     */
    public function uploadAgreement(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:docx|max:10240',
            'change_log' => 'nullable|string'
        ]);

        $contract = Contract::findOrFail($id);
        $file = $request->file('file');

        $lastVersion = $contract->versions()
            ->where('document_type', 'agreement')
            ->max('version_no') ?? 0;

        $versionNo = $lastVersion + 1;
        $path = $file->storeAs('contracts/' . $contract->id . '/agreements', "agreement_v{$versionNo}.docx", 'local');

        $version = ContractVersion::create([
            'contract_id' => $contract->id,
            'document_type' => 'agreement',
            'version_no' => $versionNo,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'change_log' => $request->change_log,
            'uploaded_by' => Auth::id(),
        ]);

        ContractHistory::create([
            'contract_id' => $contract->id,
            'action' => 'AGREEMENT_UPLOADED',
            'description' => "Agreement v{$versionNo} diupload: " . $file->getClientOriginalName(),
            'actor_id' => Auth::id(),
        ]);

        $contract->load(['creator', 'versions.uploader', 'approvals.approver', 'histories.actor', 'messages.user', 'attachments.uploader']);

        return response()->json($this->formatContract($contract));
    }


    /**
     * Get all agreement versions for a contract
     */
    public function getAgreementVersions(string $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);
        $versions = $contract->versions()
            ->where('document_type', 'agreement')
            ->orderByDesc('version_no')
            ->with('uploader')
            ->get();

        return response()->json($versions);
    }

    /**
     * Compare two agreement versions
     */
    public function compareAgreementVersions(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'v1' => 'required|integer',
            'v2' => 'required|integer'
        ]);

        $contract = Contract::findOrFail($id);
        
        $version1 = $contract->versions()
            ->where('document_type', 'agreement')
            ->where('version_no', $request->v1)
            ->firstOrFail();

        $version2 = $contract->versions()
            ->where('document_type', 'agreement')
            ->where('version_no', $request->v2)
            ->firstOrFail();

        return response()->json([
            'v1' => [
                'version_no' => $version1->version_no,
                'content' => $this->extractTextFromDocx(Storage::disk('local')->path($version1->file_path))
            ],
            'v2' => [
                'version_no' => $version2->version_no,
                'content' => $this->extractTextFromDocx(Storage::disk('local')->path($version2->file_path))
            ]
        ]);
    }

    /**
     * Extract text from a docx file using ZipArchive and XML parsing
     */
    private function extractTextFromDocx($filePath): string
    {
        if (!file_exists($filePath)) return '';

        $zip = new \ZipArchive();
        if ($zip->open($filePath) === true) {
            if (($index = $zip->locateName('word/document.xml')) !== false) {
                $content = $zip->getFromIndex($index);
                $zip->close();
                
                // Clean up XML tags to get raw text
                // Word XML uses <w:p> for paragraphs and <w:t> for text
                $content = str_replace(['</w:p>', '</w:r>', '<w:tab/>'], ["\n", " ", "\t"], $content);
                $content = strip_tags($content);
                return trim($content);
            }
            $zip->close();
        }
        return '';
    }
}


