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
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
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
                        ->whereColumn('workflow_step_id', 'contracts.workflow_step_id');
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

        // If not admin, only show user's own contracts in metrics
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

        return [
            'metrics' => [
                'avgCycleTime' => $avgDays,
                'totalContracts' => $query->count(),
                'pendingApprovals' => Approval::where('user_id', Auth::id())->where('status', 'pending')->count(),
                'approvedThisMonth' => (clone $query)->where('status', 'approved')
                    ->where('updated_at', '>=', now()->startOfMonth())
                    ->count(),
            ],
            'monthlyTrend' => Contract::leftJoin('contract_types', 'contracts.contract_type_id', '=', 'contract_types.id')
                ->select(
                    \DB::raw("to_char(contracts.created_at, 'YYYY-MM') as month"),
                    'contract_types.name as type_name',
                    \DB::raw('count(*) as count')
                )
                ->where('contracts.created_at', '>=', now()->subMonths(6))
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
                })->values(),
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

        return response()->json($this->formatContract($contract));
    }

    public function getWorkflows(): JsonResponse
    {
        return response()->json(Workflow::where('is_template', true)->get());
    }

    public function getUsers(): JsonResponse
    {
        return response()->json(User::orderBy('name')->get());
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
        ]);

        return \DB::transaction(function () use ($validated) {
            $userId = Auth::id();

            $contract = Contract::create([
                'contract_no' => 'CTR-'.date('Y').'-'.strtoupper(Str::random(5)),
                'title' => $validated['title'],
                'description' => $validated['description'] ?? '—',
                'status' => 'draft',
                'created_by' => $userId,
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
            'contract_type_id' => 'nullable|exists:contract_types,id',
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

        return \DB::transaction(function () use ($contract) {
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
            \Log::error('Validation Failed on Revision', [
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
            return Storage::disk('local')->download($version->file_path, $version->file_name);
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
            return Storage::disk('local')->download($version->file_path, $version->file_name);
        }

        return response()->json(['message' => 'File not found.'], 404);
    }

    public function attachmentFile(string $id, string $atId): mixed
    {
        $contract = Contract::findOrFail($id);
        $attachment = $contract->attachments()->findOrFail($atId);

        if ($attachment->file_path && Storage::disk('local')->exists($attachment->file_path)) {
            return Storage::disk('local')->download($attachment->file_path, $attachment->file_name);
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
                \Log::error('PDF Generation Failed', [
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
            'status' => $c->status,
            'current_version' => $c->current_version,
            'created_at' => $c->created_at->toDateString(),
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

            if ($approvals->isNotEmpty()) {
                // If we have actual approval records for this step
                foreach ($approvals as $a) {
                    $timeline[] = [
                        'id' => $a->id,
                        'user_id' => $a->user_id,
                        'approver_name' => $a->approver_name,
                        'role' => $a->role,
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
            'form_template_id' => 'required|uuid|exists:form_templates,id',
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
            $submission->submitted_by = auth()->id();
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
            'created_by' => auth()->id(),
        ]);

        // Update current version
        $submission->current_version = $versionNo;
        $submission->save();

        // Log to contract history
        $action = $isNew ? "form_{$docType}_submitted" : "form_{$docType}_updated";
        $desc = $isNew
            ? 'Form ' . strtoupper($docType) . ' telah diisi (v1)'
            : 'Form ' . strtoupper($docType) . " diperbarui ke v{$versionNo}" . ($changeSummary ? ". {$changeSummary}" : '');

        ContractHistory::create([
            'contract_id' => $contract->id,
            'action' => $action,
            'description' => $desc,
            'actor_id' => auth()->id(),
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

        if (!$submission) {
            return response()->json(['submission' => null, 'versions' => []]);
        }

        $versions = $submission->versions()->with('createdBy')->get()->map(fn ($v) => [
            'id' => $v->id,
            'version_no' => $v->version_no,
            'form_data' => $v->form_data,
            'change_summary' => $v->change_summary,
            'created_by' => $this->formatUser($v->createdBy),
            'created_at' => $v->created_at->format('Y-m-d H:i'),
        ]);

        return response()->json([
            'submission' => [
                'id' => $submission->id,
                'document_type' => $submission->document_type,
                'form_template_id' => $submission->form_template_id,
                'current_version' => $submission->current_version,
                'submitted_by' => $submission->submitted_by,
            ],
            'versions' => $versions,
        ]);
    }

    /**
     * Export a contract's form submission (F1/F2) to PDF.
     * Uses the standard form-template blade for both, but maps F1 data for F2.
     */
    public function exportFormSubmissionPdf(string $id, string $type): mixed
    {
        $contract = Contract::findOrFail($id);

        // Find the template for this docType
        // All form templates are universal right now per the seeder (contract_type_id is null)
        // If contract_type specific ones were added, we would query the relation, but this is safest.
        $template = FormTemplate::with(['fields' => fn($q) => $q->orderBy('order')])
            ->where('document_type', $type)
            ->first();

        if (!$template) {
            return response()->json(['message' => "Form template $type not found."], 404);
        }

        // ── Get the Data Source ──
        // Always try to get F1 data because F2 is a resume of F1
        $f1Submission = ContractFormSubmission::where('contract_id', $contract->id)
            ->where('document_type', 'f1')
            ->first();

        if (!$f1Submission) {
            return response()->json(['message' => 'Form F1 belum diisi.'], 404);
        }

        $latestF1Version = $f1Submission->versions()->orderByDesc('version_no')->first();
        $f1Data = $latestF1Version ? ($latestF1Version->form_data ?? []) : [];

        $formData = [];
        if ($type === 'f1') {
            $formData = $f1Data;
        } else {
            // Mapping F1 data to F2 field names based on seeder
            $formData = [
                'jenis_perjanjian' => $f1Data['type_perjanjian'] ?? '',
                'perjanjian_tentang' => $f1Data['judul'] ?? '',
                'no_perjanjian' => $contract->contract_no,
                'tanggal' => $f1Data['tanggal'] ?? '',
                'dimohonkan_oleh' => $contract->user->name ?? '',
                'pihak_pertama' => $f1Data['pihak_i_(pt.)'] ?? '',
                'pihak_kedua' => (!empty($f1Data['pihak_ii_(pt.)']) ? $f1Data['pihak_ii_(pt.)'] : ($f1Data['pihak_ii_(perorangan)'] ?? '')),
                'ruang_lingkup' => $f1Data['tujuan/latar_belakang'] ?? '',
                'harga_pekerjaan' => $f1Data['harga/fee'] ?? '',
                'cara_pembayaran' => $f1Data['terms_of_payment'] ?? '',
                'jangka_waktu' => (($f1Data['jangka_waktu_(mulai)'] ?? '') . ' s/d ' . ($f1Data['jangka_waktu_(s.d)'] ?? '')),
                'lokasi' => $f1Data['lokasi_area'] ?? '',
                'nama_direksi_pihak_pertama' => $f1Data['penandatanganan_pihak_i'] ?? '',
                'jabatan_pihak_pertama' => $f1Data['jabatan_pihak_i'] ?? '',
                'nama_direksi_pihak_kedua' => $f1Data['penandatanganan_pihak_ii'] ?? '',
                'jabatan_pihak_kedua' => $f1Data['jabatan_pihak_ii'] ?? '',
                'dibuat_oleh_(nama_pic)' => $contract->user->name ?? '',
            ];
        }

        $fields = $template->fields->sortBy('order');

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.form-template', [
            'template' => $template,
            'formData' => $formData,
            'fields' => $fields,
        ]);

        $fileName = $contract->contract_no . '_' . strtoupper($type) . '.pdf';
        return $pdf->download($fileName);
    }
}
