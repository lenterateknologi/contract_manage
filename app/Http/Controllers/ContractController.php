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

class ContractController extends Controller
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

    #[OA\Get(
        path: "/api/contracts",
        summary: "Get list of contracts",
        tags: ["Contracts"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "view", in: "query", description: "Filter by view (dashboard, contracts, mine, pending, etc.)", schema: new OA\Schema(type: "string")),
            new OA\Parameter(name: "search", in: "query", description: "Search query", schema: new OA\Schema(type: "string")),
            new OA\Parameter(name: "per_page", in: "query", description: "Items per page", schema: new OA\Schema(type: "integer", default: 10))
        ],
        responses: [
            new OA\Response(response: 200, description: "List of contracts")
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $view = $request->query('view', 'contracts');
        $contracts = $this->getFilteredContractsQuery($request, $view)
            ->paginate($request->integer('per_page', 10))
            ->through(fn ($c) => ContractFormatter::formatContract($c));

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
            ->through(fn ($c) => ContractFormatter::formatContract($c));

        $data = [
            'currentView' => $view,
            'contracts' => $contracts,
            'types' => ContractType::all(),
            'submissionTypes' => SubmissionType::where('is_active', true)->get(),
            'users' => User::with('department')
                ->when(Auth::user()->role === 'Manager', function($q) {
                    return $q->where('department_id', Auth::user()->department_id);
                })
                ->orderBy('name')->get()->map(fn($u) => ContractFormatter::formatUser($u)),
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
            ->through(fn ($c) => ContractFormatter::formatContract($c));

        $data = [
            'currentView' => 'contracts',
            'contracts' => $contracts,
            'initialSelected' => ContractFormatter::formatContract($contract),
            'types' => ContractType::all(),
            'submissionTypes' => SubmissionType::where('is_active', true)->get(),
            'users' => User::with('department')
                ->when(Auth::user()->role === 'Manager', function($q) {
                    return $q->where('department_id', Auth::user()->department_id);
                })
                ->orderBy('name')->get()->map(fn($u) => ContractFormatter::formatUser($u)),
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
            'attachments.uploader', 'formSubmissions', 'vendor.documents', 'initiator.department', 'parent',
            'assignedPic', 'assignedBy'
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
                DB::getDriverName() === 'sqlite'
                    ? DB::raw("strftime('%Y-%m', created_at) as month_key")
                    : DB::raw("to_char(created_at, 'YYYY-MM') as month_key"),
                DB::getDriverName() === 'sqlite'
                    ? DB::raw("strftime('%m', created_at) as month_label")
                    : DB::raw("to_char(created_at, 'Mon') as month_label"),
                DB::raw('count(*) as total')
            )
            ->where('created_at', '>=', now()->subMonths(6))
            ->groupBy('month_key', 'month_label')
            ->orderBy('month_key')
            ->get()
            ->map(fn($item) => [
                'month' => DB::getDriverName() === 'sqlite'
                    ? \Carbon\Carbon::createFromFormat('m', $item->month_label)->format('M')
                    : $item->month_label,
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

    #[OA\Get(
        path: "/api/contracts/{id}",
        summary: "Get contract details",
        tags: ["Contracts"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", description: "Contract ID", required: true, schema: new OA\Schema(type: "string"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Contract details"),
            new OA\Response(response: 404, description: "Contract not found")
        ]
    )]
    public function show(string $id): JsonResponse
    {
        $contract = Contract::with([
            'creator',
            'initiator.department',
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
            'vendor.documents',
            'assignedPic',
            'assignedBy'
        ])->findOrFail($id);

        // Authorization: Only Admin or Creator can view drafts
        if ($contract->status === 'draft' && $contract->created_by !== Auth::id() && Auth::user()->role !== 'Admin') {
            abort(403, 'Halaman tidak tersedia');
        }

        return response()->json(ContractFormatter::formatContract($contract));
    }

    public function getWorkflows(Request $request): JsonResponse
    {
        $contractType = $request->query('contract_type');
        $workflows = $this->workflowService->getAvailableWorkflows(Auth::user(), $contractType);
        return response()->json($workflows);
    }

    public function getUsers(): JsonResponse
    {
        $users = User::with('department')
            ->when(Auth::user()->role === 'Manager', function($q) {
                return $q->where('department_id', Auth::user()->department_id);
            })
            ->orderBy('name')
            ->get()
            ->map(fn($u) => ContractFormatter::formatUser($u));

        return response()->json($users);
    }

    public function getRoles(): JsonResponse
    {
        return response()->json(Role::orderBy('name')->get());
    }


    #[OA\Post(
        path: "/api/contracts",
        summary: "Create a new contract",
        tags: ["Contracts"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "title", type: "string"),
                    new OA\Property(property: "contract_type_id", type: "string"),
                    new OA\Property(property: "submission_type_id", type: "string"),
                    new OA\Property(property: "vendor_id", type: "string")
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: "Contract created"),
            new OA\Response(response: 422, description: "Validation error")
        ]
    )]
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
            'category' => 'nullable|string',
            'project_name' => 'nullable|string',
            'topic' => 'nullable|string',
        ]);

        $contract = $this->storeAction->execute($validated);
        return response()->json(ContractFormatter::formatContract($contract), 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        if ($contract->status !== 'draft') {
            if ($request->has('metadata') && count($request->except(['_method'])) === 1) {
                $contract->update(['metadata' => $request->input('metadata')]);
                return response()->json(ContractFormatter::formatContract($contract));
            }
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

        $contract = $this->updateAction->execute($contract, $validated);

        return response()->json(ContractFormatter::formatContract($contract->fresh(['contractType', 'submissionType', 'vendor', 'creator', 'initiator', 'parent'])));
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

}
