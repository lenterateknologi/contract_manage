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
use App\Models\SubmissionType;
use App\Models\Role;
use App\Models\User;
use App\Services\ContractWorkflowService;
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
            'submissionTypes' => SubmissionType::where('is_active', true)->get(),
            'users' => User::with('department')->orderBy('name')->get()->map(fn($u) => $this->formatUser($u)),
            'vendors' => Vendor::with('documents')->where('is_active', true)->orderBy('name')->get()->map(fn($v) => [
                'id' => $v->id,
                'name' => $v->name,
                'pic_name' => $v->pic_name,
                'pic_position' => $v->pic_position,
                'address' => $v->address,
                'documents' => $v->documents->map(fn($d) => [
                    'id' => $d->id,
                    'name' => $d->document_name,
                    'type' => $d->document_type,
                ]),
            ]),
            'formTemplates' => \App\Models\FormTemplate::where('is_active', true)->with('contractType')->withCount('fields')->get()->map(fn ($ft) => [
                'id' => $ft->id,
                'name' => $ft->name,
                'description' => $ft->description,
                'document_type' => $ft->document_type,
                'contract_type_id' => $ft->contract_type_id,
                'contract_type_name' => $ft->contractType?->name,
                'fields_count' => $ft->fields_count,
            ]),
            'departments' => \App\Models\Department::orderBy('name')->get(),
            'roles' => \App\Models\Role::orderBy('name')->get(),
            'filters' => array_merge($request->only(['search', 'status', 'contract_type_id', 'role_id', 'department_id', 'created_from', 'created_to']), [
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
            $data['metrics'] = $this->getDashboardMetrics($request);
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
            'attachments.uploader', 'formSubmissions', 'vendor.documents'
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
            'submissionTypes' => SubmissionType::where('is_active', true)->get(),
            'users' => User::with('department')->orderBy('name')->get()->map(fn($u) => $this->formatUser($u)),
            'vendors' => Vendor::where('is_active', true)->orderBy('name')->get()->map(fn($v) => [
                'id' => $v->id,
                'name' => $v->name,
                'pic_name' => $v->pic_name,
                'pic_position' => $v->pic_position,
                'address' => $v->address,
            ]),
            'formTemplates' => \App\Models\FormTemplate::where('is_active', true)->with('contractType')->withCount('fields')->get()->map(fn ($ft) => [
                'id' => $ft->id,
                'name' => $ft->name,
                'description' => $ft->description,
                'document_type' => $ft->document_type,
                'contract_type_id' => $ft->contract_type_id,
                'contract_type_name' => $ft->contractType?->name,
                'fields_count' => $ft->fields_count,
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
            'creator.department', 'contractType', 'submissionType', 'approvals.approver.department', 'approvals.workflowStep',
            'workflow.steps', 'versions.uploader', 'histories.actor', 'messages.user',
            'attachments.uploader', 'formSubmissions', 'vendor.documents', 'initiator.department', 'parent'
        ])->latest();


        // Apply View Filter
        switch ($view) {
            case 'mine':
                $query->where('t_contracts.created_by', Auth::id());
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
                $query->where('status', '!=', 'draft');
                break;
            case 'all':
                // No status filter
                break;
        }

        // Apply Search Filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'ilike', "%{$search}%")
                    ->orWhere('contract_no', 'ilike', "%{$search}%")
                    ->orWhere('crown_no', 'ilike', "%{$search}%")
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

        // Apply Department Filter
        if ($request->filled('department_id')) {
            $query->where(function($q) use ($request) {
                $q->whereHas('initiator', function($sq) use ($request) {
                    if (is_array($request->department_id)) $sq->whereIn('department_id', $request->department_id);
                    else $sq->where('department_id', $request->department_id);
                })
                ->orWhere(function($sq) use ($request) {
                    $sq->whereNull('initiated_by_id')
                       ->whereHas('creator', function($ssq) use ($request) {
                           if (is_array($request->department_id)) $ssq->whereIn('department_id', $request->department_id);
                           else $ssq->where('department_id', $request->department_id);
                       });
                });
            });
        }

        // Apply Date Range Filter
        if ($request->filled('created_from')) {
            $query->whereDate('created_at', '>=', $request->created_from);
        }
        if ($request->filled('created_to')) {
            $query->whereDate('created_at', '<=', $request->created_to);
        }


        return $query;
    }

    private function getDashboardMetrics(Request $request)
    {
        $user = Auth::user();
        $isAdmin = $user->role === 'Admin';
        $baseQuery = Contract::query();

        if (!$isAdmin) {
            $baseQuery->where('t_contracts.created_by', $user->id);
        }

        // --- KPI Metrics ---
        $totalContracts = (clone $baseQuery)->count();

        $approvedContracts = (clone $baseQuery)
            ->where('status', 'approved')
            ->orderByDesc('updated_at')
            ->limit(50)
            ->get();
        $avgDays = 0;
        if ($approvedContracts->count() > 0) {
            $contractIds = $approvedContracts->pluck('id');
            $firstApprovals = Approval::whereIn('contract_id', $contractIds)
                ->select('contract_id', DB::raw('MIN(created_at) as first_sent_at'))
                ->groupBy('contract_id')
                ->pluck('first_sent_at', 'contract_id')
                ->all();

            $totalDays = $approvedContracts->sum(function ($c) use ($firstApprovals) {
                $firstSentAt = $firstApprovals[$c->id] ?? null;
                return $firstSentAt ? Carbon::parse($firstSentAt)->diffInHours($c->updated_at) / 24 : 0;
            });
            $avgDays = round($totalDays / $approvedContracts->count(), 1);
        }


        $pendingApprovals = Approval::where('user_id', Auth::id())->where('status', 'pending')->count();

        $approvedThisMonth = (clone $baseQuery)
            ->where('status', 'approved')
            ->where('updated_at', '>=', now()->startOfMonth())
            ->count();

        $revisionCount = (clone $baseQuery)->where('status', 'revision')->count();
        $expiringCount = (clone $baseQuery)
            ->whereNotNull('end_date')
            ->whereDate('end_date', '>=', now())
            ->whereDate('end_date', '<=', now()->addDays(30))
            ->count();
        $attentionCount = $revisionCount + $expiringCount;

        // --- Status Distribution ---
        $statusDistribution = (clone $baseQuery)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->map(fn($item) => [
                'status' => $item->status,
                'count' => (int) $item->count,
            ])
            ->values();

        // --- Type Distribution (Top 5) ---
        $typeDistribution = DB::table('t_contracts')
            ->join('m_contract_types', 't_contracts.contract_type_id', '=', 'm_contract_types.id')
            ->when(!$isAdmin, fn($q) => $q->where('t_contracts.created_by', $user->id))
            ->select('m_contract_types.name as type_name', DB::raw('count(*) as count'))
            ->groupBy('m_contract_types.name')
            ->orderByDesc('count')
            ->limit(5)
            ->get()
            ->map(fn($item) => [
                'name' => $item->type_name,
                'count' => (int) $item->count,
            ])
            ->values();

        // --- Monthly Trend (last 6 months) ---
        $monthlyTrend = DB::table('t_contracts')
            ->when(!$isAdmin, fn($q) => $q->where('t_contracts.created_by', $user->id))
            ->select(
                DB::raw("to_char(created_at, 'YYYY-MM') as month_key"),
                DB::raw("to_char(created_at, 'Mon') as month_label"),
                DB::raw('count(*) as total')
            )
            ->where('created_at', '>=', now()->subMonths(6))
            ->groupBy('month_key', 'month_label')
            ->orderBy('month_key')
            ->get()
            ->map(fn($item) => [
                'month' => $item->month_label,
                'total' => (int) $item->total,
            ])
            ->values();

        // --- Recent Activity Feed ---
        $recentActivity = DB::table('t_contract_h')
            ->leftJoin('m_users', 't_contract_h.actor_id', '=', 'm_users.id')
            ->leftJoin('t_contracts', 't_contract_h.contract_id', '=', 't_contracts.id')
            ->when(!$isAdmin, fn($q) => $q->where('t_contracts.created_by', $user->id))
            ->select(
                't_contract_h.id',
                't_contract_h.action',
                't_contract_h.description',
                't_contract_h.created_at',
                'm_users.name as actor_name',
                't_contracts.id as contract_id',
                't_contracts.title as contract_title',
                't_contracts.contract_no',
            )
            ->orderByDesc('t_contract_h.created_at')
            ->limit(10)
            ->get()
            ->map(fn($item) => [
                'id' => $item->id,
                'action' => $item->action,
                'description' => $item->description,
                'actor' => $item->actor_name ?? 'Sistem',
                'contract_id' => $item->contract_id,
                'contract_title' => $item->contract_title,
                'contract_no' => $item->contract_no,
                'created_at' => $item->created_at,
            ])
            ->values();

        // --- Recent Contracts (5 latest) ---
        $recentContracts = DB::table('t_contracts')
            ->leftJoin('m_users', 't_contracts.created_by', '=', 'm_users.id')
            ->leftJoin('m_contract_types', 't_contracts.contract_type_id', '=', 'm_contract_types.id')
            ->when(!$isAdmin, fn($q) => $q->where('t_contracts.created_by', $user->id))
            ->select(
                't_contracts.id',
                't_contracts.contract_no',
                't_contracts.title',
                't_contracts.status',
                't_contracts.created_at',
                'm_users.name as creator_name',
                'm_contract_types.name as type_name',
            )
            ->orderByDesc('t_contracts.created_at')
            ->limit(5)
            ->get()
            ->map(fn($item) => [
                'id' => $item->id,
                'contract_no' => $item->contract_no,
                'title' => $item->title,
                'status' => $item->status,
                'creator' => $item->creator_name,
                'type' => $item->type_name,
                'created_at' => $item->created_at,
            ])
            ->values();

        return [
            'metrics' => [
                'totalContracts' => $totalContracts,
                'pendingApprovals' => $pendingApprovals,
                'approvedThisMonth' => $approvedThisMonth,
                'attentionCount' => $attentionCount,
                'avgCycleTime' => $avgDays,
            ],
            'statusDistribution' => $statusDistribution,
            'typeDistribution' => $typeDistribution,
            'monthlyTrend' => $monthlyTrend,
            'recentActivity' => $recentActivity,
            'recentContracts' => $recentContracts,
        ];
    }

    public function getTypes(): JsonResponse
    {
        return response()->json(ContractType::all());
    }

    public function getSubmissionTypes(): JsonResponse
    {
        return response()->json(SubmissionType::where('is_active', true)->get());
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
            'submissionType',
            'formSubmissions',
            'vendor.documents'
        ])->findOrFail($id);

        // Authorization: Only Admin or Creator can view drafts
        if ($contract->status === 'draft' && $contract->created_by !== Auth::id() && Auth::user()->role !== 'Admin') {
            abort(403, 'Halaman tidak tersedia');
        }

        return response()->json($this->formatContract($contract));
    }

    public function getWorkflows(Request $request): JsonResponse
    {
        $contractType = $request->query('contract_type');
        $workflows = $this->workflowService->getAvailableWorkflows(Auth::user(), $contractType);
        return response()->json($workflows);
    }

    public function getUsers(): JsonResponse
    {
        return response()->json(User::with('department')->orderBy('name')->get()->map(fn($u) => $this->formatUser($u)));
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
            'crown_no' => 'nullable|string|max:255',
            'contract_type_id' => 'required|exists:m_contract_types,id',
            'submission_type_id' => 'nullable|exists:m_submission_types,id',
            'transaction_type' => 'nullable|string|in:Perjanjian Baru,Addendum,Amandement,Perubahan Perjanjian',
            'tax_required' => 'nullable|boolean',
            'initiated_by_id' => 'nullable|uuid|exists:m_users,id',
            'vendor_id' => 'nullable|uuid|exists:m_vendors,id',
            'kop_sub_topik' => 'nullable|string',
            'p1_entity' => 'nullable|string',
            'p1_signer' => 'nullable|string',
            'p1_signer_position' => 'nullable|string',
            'p1_address' => 'nullable|string',
            'p2_entity' => 'nullable|string',
            'p2_signer' => 'nullable|string',
            'p2_signer_position' => 'nullable|string',
            'p2_address' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated) {
            $userId = Auth::id();
            $initiatorId = $validated['initiated_by_id'] ?? $userId;
            $initiator = \App\Models\User::with('department')->find($initiatorId);
            $contractType = \App\Models\ContractType::find($validated['contract_type_id']);

            $contract_no = \App\Models\NumberingFormat::generateNextNumber('contract', [
                'kode_departemen' => $initiator->department->code ?? 'GEN',
                'kode_perjanjian' => $contractType->code ?? 'KTR',
            ]);

            $contract = Contract::create([
                'contract_no' => $contract_no,
                'title' => $validated['title'],
                'crown_no' => $validated['crown_no'] ?? null,
                'description' => $validated['description'] ?? '—',
                'contract_type_id' => $validated['contract_type_id'],
                'submission_type_id' => $validated['submission_type_id'] ?? null,
                'transaction_type' => $validated['transaction_type'] ?? 'Perjanjian Baru',
                'status' => 'draft',
                'created_by' => $userId,
                'initiated_by_id' => $initiatorId,
                'vendor_id' => $validated['vendor_id'] ?? null,
                'kop_sub_topik' => $validated['kop_sub_topik'] ?? null,
                'parent_id' => $validated['parent_id'] ?? null,
                'p1_entity' => $validated['p1_entity'] ?? null,
                'p1_signer' => $validated['p1_signer'] ?? null,
                'p1_signer_position' => $validated['p1_signer_position'] ?? null,
                'p1_address' => $validated['p1_address'] ?? null,
                'p2_entity' => $validated['p2_entity'] ?? null,
                'p2_signer' => $validated['p2_signer'] ?? null,
                'p2_signer_position' => $validated['p2_signer_position'] ?? null,
                'p2_address' => $validated['p2_address'] ?? null,
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
            'title'            => 'sometimes|required|string|max:255',
            'description'      => 'nullable|string',
            'contract_type_id' => 'nullable|uuid|exists:m_contract_types,id',
            'submission_type_id' => 'nullable|uuid|exists:m_submission_types,id',
            'contract_no'      => 'nullable|string',
            'contract_date'    => 'nullable|date',
            'end_date'         => 'nullable|date',
            'crown_no'         => 'nullable|string|max:255',
            'transaction_type' => 'nullable|string|in:Perjanjian Baru,Addendum,Amandement,Perubahan Perjanjian,General',
            'initiated_by_id'  => 'nullable|uuid|exists:m_users,id',
            'vendor_id'        => 'nullable|uuid|exists:m_vendors,id',
            'kop_sub_topik'    => 'nullable|string',
            'parent_id'        => 'nullable|exists:t_contracts,id',
            'p1_entity'        => 'nullable|string',
            'p1_signer'        => 'nullable|string',
            'p1_signer_position' => 'nullable|string',
            'p1_address'       => 'nullable|string',
            'p2_entity'        => 'nullable|string',
            'p2_signer'        => 'nullable|string',
            'p2_signer_position' => 'nullable|string',
            'p2_address'       => 'nullable|string',
            'metadata'         => 'nullable|array',
        ]);

        $contract->update($validated);

        // Sync contract_type (string label) when contract_type_id is provided
        if (!empty($validated['contract_type_id'])) {
            $contract->contract_type = $contract->contractType?->name ?? $contract->contract_type;
            $contract->save();
        }

        ContractHistory::create([
            'contract_id' => $contract->id,
            'action' => 'CONTRACT_UPDATED',
            'description' => 'Informasi kontrak diperbarui',
            'actor_id' => Auth::id(),
        ]);

        return response()->json($this->formatContract($contract->fresh(['contractType', 'submissionType', 'vendor', 'creator', 'initiator', 'parent'])));
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

    public function bulkDestroy(Request $request): JsonResponse
    {
        if (!$this->checkBulkPermission('can_bulk_delete')) {
            return response()->json(['message' => 'Anda tidak memiliki izin untuk aksi massal ini.'], 403);
        }

        $ids = $request->input('ids');
        if (empty($ids)) return response()->json(['message' => 'Tidak ada kontrak yang dipilih.'], 422);

        return DB::transaction(function () use ($ids) {
            $contracts = Contract::whereIn('id', $ids)->get();
            $count = 0;

            foreach ($contracts as $contract) {
                if ($contract->status === 'draft') {
                    Storage::disk('local')->deleteDirectory("contracts/{$contract->id}");
                    $contract->delete();
                    $count++;
                }
            }

            return response()->json(['message' => "$count kontrak berhasil dihapus."]);
        });
    }

    public function bulkApprove(Request $request): JsonResponse
    {
        if (!$this->checkBulkPermission('can_bulk_approve')) {
            return response()->json(['message' => 'Anda tidak memiliki izin untuk aksi massal ini.'], 403);
        }

        $request->validate([
            'ids' => 'required|array',
            'note' => 'required|string|min:10'
        ]);

        $ids = $request->input('ids');
        $note = $request->input('note');

        return DB::transaction(function () use ($ids, $note) {
            $count = 0;
            foreach ($ids as $id) {
                $approval = Approval::where('contract_id', $id)
                    ->where('user_id', Auth::id())
                    ->where('status', 'pending')
                    ->first();

                if ($approval) {
                    $contract = Contract::find($id);
                    if ($contract) {
                        assert($contract instanceof Contract);
                        $this->workflowService->approveContract($contract, $approval, $note);
                        $count++;
                    }
                }
            }

            return response()->json(['message' => "$count kontrak berhasil disetujui."]);
        });
    }

    protected function checkBulkPermission($permission)
    {
        $role = Role::where('name', Auth::user()->role)->first();
        if (!$role) return false;

        return AccessModule::where('role_id', $role->id)
            ->join('m_modules', 'm_access_modules.module_id', '=', 'm_modules.id')
            ->where('m_modules.identifier', 'CONTRACTS')
            ->where($permission, true)
            ->exists();
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
        $safeNo = Str::slug($contract->contract_no ?: 'contract');
        $fileName = "{$safeNo}_{$typeLabel}_v{$newVer}.{$ext}";
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
            $path = Storage::disk('local')->path($attachment->file_path);
            $mime = match (strtolower(pathinfo($path, PATHINFO_EXTENSION))) {
                'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'doc' => 'application/msword',
                'pdf' => 'application/pdf',
                default => 'application/octet-stream'
            };

            return response()->file($path, [
                'Content-Type' => $mime,
            ]);
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

    public function vendorDocumentFile(string $id, string $docId): mixed
    {
        $contract = Contract::findOrFail($id);
        if (!$contract->vendor_id) abort(404);

        $document = \App\Models\VendorDocument::where('vendor_id', $contract->vendor_id)->findOrFail($docId);

        if (!Storage::disk('public')->exists($document->file_url)) {
            abort(404, 'File not found');
        }

        return response()->download(Storage::disk('public')->path($document->file_url), $document->document_name);
    }

    public function vendorDocumentPdfPreview(string $id, string $docId): mixed
    {
        $contract = Contract::findOrFail($id);
        if (!$contract->vendor_id) abort(404);

        $document = \App\Models\VendorDocument::where('vendor_id', $contract->vendor_id)->findOrFail($docId);

        if (!Storage::disk('public')->exists($document->file_url)) {
            return response()->json(['message' => 'File not found.'], 404);
        }

        $sourcePath = Storage::disk('public')->path($document->file_url);
        $pdfDir = Storage::disk('local')->path("vendors/{$contract->vendor_id}/documents/pdfs");
        $pdfPath = $pdfDir.'/'.pathinfo($document->file_url, PATHINFO_FILENAME).'.pdf';

        if (! file_exists($pdfDir)) {
            mkdir($pdfDir, 0755, true);
        }

        if (! file_exists($pdfPath)) {
            if (strtolower(pathinfo($document->file_url, PATHINFO_EXTENSION)) === 'pdf') {
                copy($sourcePath, $pdfPath);
            } else {
                $soffice = '/Applications/LibreOffice.app/Contents/MacOS/soffice';
                $userDir = 'file://'.sys_get_temp_dir().'/soffice_user_vendor_'.md5($docId);
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
            'crown_no' => $c->crown_no,
            'title' => $c->title,
            'description' => $c->description,
            'contract_type' => $c->contract_type,
            'contract_date' => $c->contract_date,
            'end_date' => $c->end_date,
            'contract_type' => $c->contractType?->name ?? '—',
            'contract_type_id' => $c->contract_type_id,
            'submission_type' => $c->submissionType?->name ?? '—',
            'submission_type_id' => $c->submission_type_id,
            'created_by' => $c->created_by,
            'transaction_type' => $c->transaction_type,
            'p1_entity' => $c->p1_entity,
            'p1_signer' => $c->p1_signer,
            'p1_signer_position' => $c->p1_signer_position,
            'p1_address' => $c->p1_address,
            'p2_entity' => $c->p2_entity,
            'p2_signer' => $c->p2_signer,
            'p2_signer_position' => $c->p2_signer_position,
            'p2_address' => $c->p2_address,
            'vendor_id' => $c->vendor_id,
            'vendor' => $c->vendor ? [
                'id' => $c->vendor->id,
                'name' => $c->vendor->name,
                'pic_name' => $c->vendor->pic_name,
                'pic_position' => $c->vendor->pic_position,
                'address' => $c->vendor->address,
                'documents' => $c->vendor->documents->map(fn($d) => [
                    'id' => $d->id,
                    'name' => $d->document_name,
                    'type' => $d->document_type,
                ]),
            ] : null,
            'status' => $c->status,
            'display_mode' => $c->statusDetail?->display_mode ?? 'interactive',
            'allow_info_edit' => $c->statusDetail?->allow_info_edit ?? ($c->status === 'draft'),
            'allow_reference' => $c->statusDetail?->allow_reference ?? ($c->status === 'draft'),
            'current_version' => $c->current_version,
            'created_at' => $c->created_at->format('d/m/Y'),
            'submitted_at' => $c->submitted_at ? $c->submitted_at->format('d/m/Y H:i') : null,
            'creator' => $this->formatUser($c->creator),
            'initiator' => $this->formatUser($c->initiator),
            'initiated_by_id' => $c->initiated_by_id,
            'kop_sub_topik' => $c->kop_sub_topik,
            'parent_id' => $c->parent_id,
            'parent' => $c->parent ? [
                'id' => $c->parent->id,
                'contract_no' => $c->parent->contract_no,
                'title' => $c->parent->title,
            ] : null,
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
                'attachment_url' => $m->attachment_url,
                'attachment_name' => $m->attachment_name,
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

            // Resolve Department Name(s)
            $deptNames = (array)$step->department_names;
            $deptName = count($deptNames) > 0 ? implode(', ', $deptNames) : null;

            if (!$deptName && $step->step === 1 && $c->initiator?->department) {
                $deptName = $c->initiator->department->name;
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
                $roleLabel = is_array($step->role) ? implode(', ', $step->role) : $step->role;
                $timeline[] = [
                    'id' => 'step-'.$step->id,
                    'user_id' => null,
                    'approver_name' => 'Pendataan '.$roleLabel,
                    'role' => $roleLabel,
                    'department_name' => $deptName,
                    'target_approvers' => $targetApprovers,
                    'sequence' => $step->step,
                    'status' => 'waiting',
                    'note' => null,
                    'approved_at' => null,
                    'approver' => ['name' => 'Approver '.$roleLabel],
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
            'department_name' => $user->department?->name,
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

        $isNewVersion = $request->input('is_new_version', true);

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
        $versionNo = $submission->current_version;
        if ($isNewVersion && !$isNew) {
            $versionNo = $submission->current_version + 1;
        }

        // Build change summary
        $changeSummary = $request->input('change_summary');
        if (!$changeSummary && !$isNew) {
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
                    // Fetch readable labels for the changed keys
                    $fieldLabels = DB::table('m_form_fields')
                        ->where('form_template_id', $submission->form_template_id)
                        ->whereIn('name', $changes)
                        ->pluck('label', 'name')
                        ->toArray();

                    $readableChanges = array_map(function($key) use ($fieldLabels) {
                        return $fieldLabels[$key] ?? $key;
                    }, $changes);

                    $changeSummary = 'Perubahan pada: ' . implode(', ', array_slice($readableChanges, 0, 10));
                    if (count($readableChanges) > 10) $changeSummary .= ' (dan ' . (count($readableChanges) - 10) . ' lainnya)';
                }
            }
        }

        // Create or Update version
        if (!$isNewVersion && !$isNew) {
            $existingVersion = ContractFormSubmissionVersion::where('submission_id', $submission->id)
                ->where('version_no', $versionNo)
                ->first();
            
            if ($existingVersion) {
                $existingVersion->update([
                    'form_data' => $formData,
                    'change_summary' => $changeSummary ?: $existingVersion->change_summary,
                ]);
            } else {
                ContractFormSubmissionVersion::create([
                    'submission_id' => $submission->id,
                    'version_no' => $versionNo,
                    'form_data' => $formData,
                    'change_summary' => $changeSummary,
                    'created_by' => Auth::id(),
                ]);
            }
        } else {
            ContractFormSubmissionVersion::create([
                'submission_id' => $submission->id,
                'version_no' => $versionNo,
                'form_data' => $formData,
                'change_summary' => $changeSummary,
                'created_by' => Auth::id(),
            ]);
        }

        // Update main submission model
        $submission->current_version = $versionNo;
        $submission->save();

        // Sync critical fields from F1 to Contract main table
        if ($docType === 'f1') {
            $updates = [];

            // --- Tipe Perjanjian (transaction_type) ---
            foreach (['meta_tipe_perjanjian', 'f1_sifat_row', 'transaction_mode', 'transaction_type'] as $key) {
                if (!empty($formData[$key])) {
                    $updates['transaction_type'] = $formData[$key];
                    break;
                }
            }

            // --- Judul Kontrak (title) ---
            foreach (['meta_judul_kontrak', 'bv_f1_title', 'judul', 'contract_title'] as $key) {
                if (!empty($formData[$key])) {
                    $updates['title'] = $formData[$key];
                    break;
                }
            }

            // --- Tanggal Kontrak (contract_date) ---
            foreach (['meta_tgl_dibuat', 'bv_f1_date'] as $key) {
                if (!empty($formData[$key])) {
                    $updates['contract_date'] = $formData[$key];
                    break;
                }
            }

            // --- Sub Topik (kop_sub_topik) ---
            if (!empty($formData['meta_sub_topik'])) {
                $updates['kop_sub_topik'] = $formData['meta_sub_topik'];
            }

            // --- Pihak Pertama identity ---
            if (!empty($formData['meta_p1_entity']))          $updates['p1_entity']          = $formData['meta_p1_entity'];
            if (!empty($formData['meta_p1_signer']))          $updates['p1_signer']          = $formData['meta_p1_signer'];
            if (!empty($formData['meta_p1_signer_position'])) $updates['p1_signer_position'] = $formData['meta_p1_signer_position'];
            if (!empty($formData['meta_p1_alamat']))          $updates['p1_address']         = $formData['meta_p1_alamat'];

            // --- Pihak Kedua identity ---
            if (!empty($formData['meta_p2_entity']))          $updates['p2_entity']          = $formData['meta_p2_entity'];
            if (!empty($formData['meta_p2_signer']))          $updates['p2_signer']          = $formData['meta_p2_signer'];
            if (!empty($formData['meta_p2_signer_position'])) $updates['p2_signer_position'] = $formData['meta_p2_signer_position'];
            if (!empty($formData['meta_p2_alamat']))          $updates['p2_address']         = $formData['meta_p2_alamat'];

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
     * Get the audit trail (history) for a contract with filtering.
     */
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

        return response()->json($query->get()->map(function($h) {
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

    /**
     * Export Audit Trail to Excel (CSV) for a single contract.
     */
    public function exportAuditExcel(string $id, Request $request): StreamedResponse
    {
        $contract = Contract::findOrFail($id);
        $query = $contract->histories()->with('actor')->orderBy('created_at', 'desc');

        // Apply Filters (same as getAuditTrail)
        if ($request->action) $query->where('action', $request->action);
        if ($request->actor_id) $query->where('actor_id', $request->actor_id);
        if ($request->date_from) $query->whereDate('created_at', '>=', $request->date_from);
        if ($request->date_to) $query->whereDate('created_at', '<=', $request->date_to);
        if ($request->search) $query->where('description', 'like', '%' . $request->search . '%');

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

    /**
     * Render Approval Timeline for PDF/Print view.
     */
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

    /**
     * Export Approval Timeline to PDF via Background Queue.
     */
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
                'generated_by' => $userName
            ]);

            // Determine if we need to force 127.0.0.1 for local dev (Browsershot requirement)
            if (app()->environment('local')) {
                $rootUrl = config('app.url');
                if (str_contains($rootUrl, 'localhost')) {
                    \Illuminate\Support\Facades\URL::forceRootUrl(str_replace('localhost', '127.0.0.1', $rootUrl));
                }
            }

            // Generate the signed URL for the print view
            $printUrl = \Illuminate\Support\Facades\URL::temporarySignedRoute(
                'contracts.approval.document.print',
                now()->addMinutes(30),
                $params
            );

            // Safe filename
            $safeNo = Str::slug($contract->contract_no ?: 'contract');
            $fileName = "Approval_Timeline_{$safeNo}_" . time() . ".pdf";

            // Add Job to Queue - FIXED ARGUMENT ORDER (jobId, printUrl, fileName)
            \App\Jobs\GeneratePdfJob::dispatch(
                $jobId,
                $printUrl,
                $fileName
            );

            return response()->json([
                'success' => true,
                'job_id' => $jobId,
                'message' => 'Laporan alur approval sedang diproses.'
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to queue Approval Timeline PDF: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses laporan alur approval.'
            ], 500);
        }
    }

    /**
     * Export Audit Trail to PDF via Background Queue.
     */
    public function exportAuditPdfQueue(string $id, Request $request)
    {
        Log::info("Audit PDF Queue Request: id={$id}");
        $contract = Contract::findOrFail($id);

        try {
            $jobId = (string) Str::uuid();

            // Generate the signed URL for the print view
            $printUrl = \Illuminate\Support\Facades\URL::temporarySignedRoute(
                'contracts.audit.document.print',
                now()->addMinutes(30),
                [
                    'id' => $id,
                    'search' => $request->search,
                    'actor_id' => $request->actor_id,
                    'date_from' => $request->date_from,
                    'date_to' => $request->date_to
                ]
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
                'job_id' => $jobId
            ]);

        } catch (\Exception $e) {
            Log::critical("Audit PDF Queue Failure: " . $e->getMessage());
            return response()->json(['message' => 'Gagal antrikan PDF: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Export the audit trail as a PDF.
     */
    public function exportAuditPdf(string $id, Request $request)
    {
        set_time_limit(180);
        $contract = Contract::findOrFail($id);

        try {
            // Generate a signed URL for Browsershot to visit the React audit page
            // We use the specialized .print route which is outside auth
            $printUrl = \Illuminate\Support\Facades\URL::temporarySignedRoute(
                'contracts.audit.document.print',
                now()->addMinutes(15),
                ['id' => $id, 'search' => $request->search, 'actor_id' => $request->actor_id, 'date_from' => $request->date_from, 'date_to' => $request->date_to]
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
                    '--disable-extensions'
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
                if (!Storage::disk('local')->exists($pdfDir)) {
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
            if ($request->filled('search')) $query->where('description', 'like', '%' . $request->search . '%');
            if ($request->filled('actor_id')) $query->where('actor_id', $request->actor_id);
            if ($request->filled('date_from')) $query->whereDate('created_at', '>=', $request->date_from);
            if ($request->filled('date_to')) $query->whereDate('created_at', '<=', $request->date_to);
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
            'contract' => $this->formatContract($contract),
            'histories' => $histories,
            'filters' => $request->only(['search', 'actor_id', 'date_from', 'date_to']),
        ]);
    }

    /**
     * Get form submission data for a contract by document type.
     */
    public function getFormSubmission(string $id, string $type): JsonResponse
    {
        $contract = Contract::with(['contractType', 'vendor', 'initiator', 'creator'])->findOrFail($id);

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
            // No submission yet — prefill_data will be generated below
        }

        // For F2: ALWAYS generate prefill_data (used for static_text placeholder resolution
        // and initial form fill). Frontend merges this under saved form_data.
        if ($type === 'f2') {
            $f1Submission = ContractFormSubmission::where('contract_id', $contract->id)
                ->where('document_type', 'f1')
                ->first();

            $f1Data = [];
            if ($f1Submission) {
                $latestF1 = $f1Submission->versions()->orderByDesc('version_no')->first();
                $f1Data = $latestF1 ? ($latestF1->form_data ?? []) : [];
            }
            $prefillData = $this->applyInheritance($f1Data, $contract);
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
                ->setDelay(200);

            $finalPdf = $pdfContent->pdf();

            // Save to cache
            if (!Storage::disk('local')->exists($pdfDir)) {
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
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.form-template', [
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


    /**
     * Internal logic for F1 -> F2 data mapping.
     * Keys = F2 field names (or placeholder variable names used in static_text templates).
     * Values = exact F1 field names to copy from.
     */
    private function applyInheritance(array $f1Data, Contract $contract, array $existingData = []): array
    {
        $formData = array_merge($f1Data, $existingData);

        // ── F2 labeled_value fields ← F1 field names ────────────────
        $inheritanceMap = [
            'meta_perjanjian_tentang' => 'meta_judul_kontrak',
            'meta_f2_scope'           => 'meta_ringkasan_klausul',
            'meta_f2_price'           => 'meta_nilai_transaksi',
            'meta_f2_payment'         => 'meta_mekanisme_pembayaran',
            'meta_f2_tenure'          => 'meta_masa_berlaku',
            'meta_f2_location'        => 'meta_lokasi',
            // Legacy Mappings
            'perjanjian_tentang'      => 'meta_judul_kontrak',
            'f2_scope'                => 'meta_ringkasan_klausul',
        ];

        foreach ($inheritanceMap as $f2Field => $f1Field) {
            if (empty($formData[$f2Field]) && !empty($f1Data[$f1Field])) {
                $formData[$f2Field] = $f1Data[$f1Field];
            }
        }

        // ── Passthrough: Copy F1 identity fields directly so static_text
        // placeholders like {{meta_p2_entity}} resolve in the F2 renderer ──
        $f1PassthroughFields = [
            'meta_p1_entity', 'meta_p1_signer', 'meta_p1_signer_position', 'meta_p1_alamat',
            'meta_p2_entity', 'meta_p2_signer', 'meta_p2_signer_position', 'meta_p2_alamat',
            'meta_judul_kontrak', 'meta_tgl_dibuat', 'meta_tipe_perjanjian', 'meta_nomor',
            'meta_topik', 'meta_sub_topik', 'meta_ringkasan_klausul',
            // Legacy passthrough
            'v_p1_entity', 'v_p2_entity'
        ];
        foreach ($f1PassthroughFields as $key) {
            if (empty($formData[$key]) && !empty($f1Data[$key])) {
                $formData[$key] = $f1Data[$key];
            }
        }

        // ── Pihak Pertama defaults ─────────────────────────────────────────
        if (empty($formData['meta_p1_entity']))   $formData['meta_p1_entity']   = 'PT. Lentera Teknologi';
        if (empty($formData['meta_p1_signer']))   $formData['meta_p1_signer']   = $contract->initiator?->name ?? $contract->creator?->name ?? '';
        if (empty($formData['meta_p1_signer_position'])) $formData['meta_p1_signer_position'] = $contract->initiator?->role ?? $contract->creator?->role ?? 'Direktur';
        if (empty($formData['meta_p1_alamat']))   $formData['meta_p1_alamat']   = 'The Manhattan Square Mid Tower Lt. 12, Jl. TB Simatupang No.1, Jakarta Selatan';

        // ── Pihak Kedua from Vendor master data ────────────────────────────
        if ($contract->vendor_id && $contract->vendor) {
            $v = $contract->vendor;
            if (empty($formData['meta_p2_entity']))          $formData['meta_p2_entity']          = $v->name;
            if (empty($formData['meta_p2_signer']))          $formData['meta_p2_signer']          = $v->pic_name;
            if (empty($formData['meta_p2_signer_position'])) $formData['meta_p2_signer_position'] = $v->pic_position;
            if (empty($formData['meta_p2_alamat']))          $formData['meta_p2_alamat']          = $v->address;
        }

        // ── Meta context ───────────────────────────────────────────────────
        if (empty($formData['meta_nomor']))       $formData['meta_nomor']       = $contract->contract_no;
        if (empty($formData['meta_topik']))       $formData['meta_topik']       = $contract->contractType?->name ?? $contract->contract_type ?? '';
        if (empty($formData['meta_tipe_perjanjian'])) $formData['meta_tipe_perjanjian'] = $contract->transaction_type ?? 'Perjanjian Baru';
        if (empty($formData['meta_tgl_dibuat']))  $formData['meta_tgl_dibuat']  = $contract->contract_date ? $contract->contract_date->toDateString() : now()->toDateString();

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

    public function compareFormVersions(string $id, string $type)
    {
        $contract = Contract::findOrFail($id);

        // Find matching template (same logic as GenericFormTab)
        $matchingTemplate = \App\Models\FormTemplate::where('document_type', $type)
            ->where(function($q) use ($contract) {
                $q->where('contract_type_id', $contract->contract_type_id)
                  ->orWhereNull('contract_type_id');
            })
            ->orderByRaw('contract_type_id IS NULL ASC')
            ->first();

        $submission = \App\Models\ContractFormSubmission::where('contract_id', $contract->id)
            ->where('document_type', $type)
            ->first();

        $versions = [];
        if ($submission) {
            $versions = $submission->versions()->orderByDesc('version_no')->get()->map(fn ($v) => [
                'id' => $v->id,
                'version_no' => $v->version_no,
                'form_data' => $v->form_data,
                'created_at' => $v->created_at->format('Y-m-d H:i'),
                'created_by' => $v->createdBy ? $v->createdBy->name : '-',
            ]);
        }

        return Inertia::render('admin/contracts/compare-forms', [
            'contract' => $this->formatContract($contract),
            'docType' => $type,
            'template' => $matchingTemplate ? [
                'id' => $matchingTemplate->id,
                'name' => $matchingTemplate->name,
                'description' => $matchingTemplate->description,
                'has_letterhead' => $matchingTemplate->has_letterhead,
                'letterhead_json' => $matchingTemplate->letterhead_json,
                'fields' => $matchingTemplate->fields
            ] : null,
            'versions' => $versions,
            'breadcrumbs' => [
                ['title' => 'Manajemen Kontrak', 'href' => route('contracts'), 'icon' => 'FileText'],
                ['title' => 'Compare Forms', 'href' => '#', 'icon' => 'Columns'],
            ],
        ]);
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
    public function compareAgreementVersions(Request $request, string $id): \Inertia\Response
    {
        $contract = Contract::findOrFail($id);

        $versions = $contract->versions()
            ->where('document_type', 'agreement')
            ->orderByDesc('version_no')
            ->get()
            ->map(fn ($v) => [
                'id' => $v->id,
                'version_no' => $v->version_no,
                'file_name' => $v->file_name,
                'created_at' => $v->created_at->format('Y-m-d H:i'),
                'uploader' => [
                    'name' => $v->uploader ? $v->uploader->name : $v->created_by,
                ],
            ]);

        return Inertia::render('admin/contracts/compare-agreements', [
            'contract' => $this->formatContract($contract),
            'versions' => $versions,
            'initialV1' => (int) $request->v1,
            'initialV2' => (int) $request->v2,
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


