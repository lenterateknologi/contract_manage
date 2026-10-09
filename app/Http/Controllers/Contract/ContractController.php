<?php

namespace App\Http\Controllers\Contract;

use App\Exports\Transaction\ContractExport;
use App\Http\Actions\Contract\StoreContractAction;
use App\Http\Actions\Contract\UpdateContractAction;
use App\Http\Controllers\Controller;
use App\Http\Formatters\ContractFormatter;
use App\Http\Queries\Contract\ContractDashboardQuery;
use App\Http\Queries\Contract\ContractDetailQuery;
use App\Http\Queries\Contract\ContractListQuery;
use App\Http\Queries\Contract\ContractOptionsQuery;
use App\Http\Requests\Contract\StoreContractRequest;
use App\Http\Requests\Contract\UpdateContractRequest;
use App\Imports\ContractImport;
use App\Models\Master\AccessModule;
use App\Models\Master\DashboardType;
use App\Models\Master\Role;
use App\Models\Master\User;
use App\Models\Master\Workflow;
use App\Models\Transaction\Contract;
use App\Models\Transaction\SubmissionReview;
use App\Services\ContractFilterScopeService;
use App\Services\Workflow\ContractWorkflowService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use OpenApi\Attributes as OA;

class ContractController extends Controller
{
    use ApiResponse;

    private ContractWorkflowService $workflowService;

    private StoreContractAction $storeAction;

    private UpdateContractAction $updateAction;

    private ContractListQuery $contractListQuery;

    private ContractDetailQuery $contractDetailQuery;

    private ContractOptionsQuery $contractOptionsQuery;

    public function __construct(
        ContractWorkflowService $workflowService,
        StoreContractAction $storeAction,
        UpdateContractAction $updateAction,
        ContractListQuery $contractListQuery,
        ContractDetailQuery $contractDetailQuery,
        ContractOptionsQuery $contractOptionsQuery,
    ) {
        $this->workflowService = $workflowService;
        $this->storeAction = $storeAction;
        $this->updateAction = $updateAction;
        $this->contractListQuery = $contractListQuery;
        $this->contractDetailQuery = $contractDetailQuery;
        $this->contractOptionsQuery = $contractOptionsQuery;
    }


    public function index(Request $request): JsonResponse
    {
        $view = $request->query('view', 'contracts');
        $contracts = (new ContractListQuery)
            ->build($request, $view)
            ->paginate($request->integer('per_page', 25))
            ->through(fn ($c) => ContractFormatter::formatContract($c, false));

        return $this->successResponse($contracts, 'Contracts retrieved successfully');
    }

    /**
     * Generalized method for Inertia contract views
     */
    public function contractsView(Request $request, string $view = 'contracts', ?string $tab = null): Response|JsonResponse|RedirectResponse
    {
        if ($view === 'contracts' || $view === 'all') {
            $user = Auth::user();
            $canViewGlobal = $user && $user->canViewGlobalContracts();
            if (! $canViewGlobal) {
                return redirect()->route('contracts.organization', $request->query());
            }
        }

        $perPage = min(max($request->integer('per_page', 25), 1), 100);
        $contracts = $this->contractListQuery
            ->build($request, $view)
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn ($c) => ContractFormatter::formatContract($c, false));

        $counts = $this->getCachedContractCounts(Auth::id());

        if ($request->wantsJson() && ! $request->header('X-Inertia')) {
            return response()->json([
                'status' => 'success',
                'view' => $view,
                'data' => $contracts,
                'counts' => $counts,
            ]);
        }

        $loaders = $this->contractOptionsQuery->getLoaders();
        $meta = $this->getViewMetadata($view);

        $resolvedTab = $tab ?? $request->query('tab') ?? $request->query('dashboard_tab');

        $data = array_merge([
            'currentView' => $view,
            'currentDashboardTab' => $resolvedTab,
            'contracts' => $contracts,
            'types' => $loaders['types'](),
            'submissionTypes' => $loaders['submissionTypes'](),
            'users' => Inertia::defer(fn () => $loaders['users']()),
            'vendors' => Inertia::defer(fn () => $loaders['vendors']()),
            'formTemplates' => Inertia::defer(fn () => $loaders['formTemplates']()),
            'departments' => $loaders['departments'](),
            'divisions' => $loaders['divisions'](),
            'roles' => $loaders['roles'](),
            'regions' => $loaders['regions'](),
            'locations' => $loaders['locations'](),
            'companyGroups' => $loaders['companyGroups'](),
            'companies' => $loaders['companies'](),
            'organizationTree' => Inertia::defer(fn () => ContractFilterScopeService::buildOrganizationTree(
                $loaders['companyGroups'](),
                $loaders['regions'](),
                $loaders['companies']()
            )),
            'contractStatuses' => $loaders['contractStatuses'](),
            'userFilterSettings' => Auth::user()?->getContractFilterSettings() ?? [],
            'dashboardConfig' => (new ContractDashboardQuery)->resolveDashboardConfig(Auth::user()),
            'filters' => array_merge($request->only([
                'search', 'status', 'contract_type_id', 'role_id', 'department_id',
                'created_from', 'created_to', 'region_ids', 'vendor_ids', 'statuses',
                'contract_type_ids', 'pic_ids', 'department_ids', 'submission_type_id',
                'period', 'company_group_ids', 'company_ids',
                'company_group_id', 'region_id', 'company_id', 'division_id',
                'mine_tab', 'duty_tab', 'org_tab', 'contract_tab', 'parent_tab', 'pending_tab', 'approval_status', 'expiry_tab',
                'sort_by', 'sort_dir', 'sortBy', 'sortDir',
            ]), [
                'per_page' => $perPage,
            ]),
            'breadcrumbs' => [
                ['title' => 'Manajemen Kontrak', 'href' => route('contracts'), 'icon' => 'FileText'],
                ['title' => $meta['title'], 'href' => '#', 'description' => $meta['description'], 'icon' => $meta['icon']],
            ],
        ], $counts);

        if ($view === 'dashboard') {
            $data['metrics'] = Inertia::defer(fn () => (new ContractDashboardQuery)->getMetrics($request));

            return Inertia::render('dashboard/Index', $data);
        }

        return Inertia::render('contracts/Index', $data);
    }

    /**
     * View summary portal with 3 vertical tables:
     * 1. Perlu Tindakan (Pending Approval for user)
     * 2. Sedang Diproses (In-progress submissions made by user)
     * 3. Draft (Draft submissions made by user)
     */
    public function activityView(Request $request): Response|JsonResponse
    {
        $userId = Auth::id();
        $perPage = min(max($request->integer('per_page', 10), 1), 100);

        // 1. Pending Actions (Perlu Tindakan - Paling Atas)
        $pendingQuery = Contract::query()
            ->pendingApprovalFor($userId)
            ->whereRaw('UPPER(status) != ?', ['DRAFT'])
            ->with([
                'creator.department',
                'contractType',
                'submissionType',
                'statusDetail',
                'workflow',
                'workflowStep.actions',
                'vendor',
                'initiator.department',
                'parent',
                'assignedPic.department',
                'approvals',
            ]);

        if ($request->filled('search_pending')) {
            $search = mb_strtolower(addcslashes($request->search_pending, '%_\\'));
            $pendingQuery->where(function ($q) use ($search) {
                $q->where(DB::raw('LOWER(title)'), 'like', "%{$search}%")
                    ->orWhere(DB::raw('LOWER(form_no)'), 'like', "%{$search}%");
            });
        }

        $this->applyActivitySort(
            $pendingQuery,
            $request->input('sort_pending'),
            $request->input('dir_pending'),
            'updated_at'
        );

        $pendingContracts = $pendingQuery
            ->paginate($perPage, ['*'], 'page_pending')
            ->withQueryString()
            ->through(fn ($c) => ContractFormatter::formatContract($c, false));

        // 2. In Progress (Sedang Diproses milik user - Tengah)
        $inProgressQuery = Contract::query()
            ->mine()
            ->whereIn('status', ['in_review', 'revision', 'pending', 'locked'])
            ->whereRaw('UPPER(status) != ?', ['DRAFT'])
            ->whereNull('closed_at')
            ->with([
                'creator.department',
                'contractType',
                'submissionType',
                'statusDetail',
                'workflow',
                'workflowStep.actions',
                'vendor',
                'initiator.department',
                'parent',
                'assignedPic.department',
                'approvals',
            ]);

        if ($request->filled('search_progress')) {
            $search = mb_strtolower(addcslashes($request->search_progress, '%_\\'));
            $inProgressQuery->where(function ($q) use ($search) {
                $q->where(DB::raw('LOWER(title)'), 'like', "%{$search}%")
                    ->orWhere(DB::raw('LOWER(form_no)'), 'like', "%{$search}%");
            });
        }

        $this->applyActivitySort(
            $inProgressQuery,
            $request->input('sort_progress'),
            $request->input('dir_progress'),
            'updated_at'
        );

        $inProgressContracts = $inProgressQuery
            ->paginate($perPage, ['*'], 'page_progress')
            ->withQueryString()
            ->through(fn ($c) => ContractFormatter::formatContract($c, false));

        // 3. Draft (Draft pengajuan milik user - Paling Bawah)
        $draftQuery = Contract::query()
            ->mine()
            ->whereRaw('UPPER(status) = ?', ['DRAFT'])
            ->with([
                'creator.department',
                'contractType',
                'submissionType',
                'statusDetail',
                'workflow',
                'workflowStep.actions',
                'vendor',
                'initiator.department',
                'parent',
                'assignedPic.department',
            ]);

        if ($request->filled('search_draft')) {
            $search = mb_strtolower(addcslashes($request->search_draft, '%_\\'));
            $draftQuery->where(function ($q) use ($search) {
                $q->where(DB::raw('LOWER(title)'), 'like', "%{$search}%")
                    ->orWhere(DB::raw('LOWER(form_no)'), 'like', "%{$search}%");
            });
        }

        $this->applyActivitySort(
            $draftQuery,
            $request->input('sort_draft'),
            $request->input('dir_draft'),
            'updated_at'
        );

        $draftContracts = $draftQuery
            ->paginate($perPage, ['*'], 'page_draft')
            ->withQueryString()
            ->through(fn ($c) => ContractFormatter::formatContract($c, false));

        $counts = $this->getCachedContractCounts($userId);
        $activityCounts = [
            'pending' => Contract::pendingApprovalFor($userId)->count(),
            'history' => Contract::actedBy($userId)->count(),
            'in_progress' => Contract::mine($userId)
                ->whereIn('status', ['in_review', 'revision', 'pending', 'locked'])
                ->whereRaw('UPPER(status) != ?', ['DRAFT'])
                ->whereNull('closed_at')
                ->count(),
            'draft' => Contract::mine($userId)
                ->whereRaw('UPPER(status) = ?', ['DRAFT'])
                ->count(),
        ];
        $loaders = $this->contractOptionsQuery->getLoaders();

        if ($request->wantsJson() && ! $request->header('X-Inertia')) {
            return response()->json([
                'status' => 'success',
                'pending' => $pendingContracts,
                'in_progress' => $inProgressContracts,
                'draft' => $draftContracts,
                'counts' => $activityCounts,
                'activityCounts' => $activityCounts,
            ]);
        }

        $data = array_merge([
            'currentView' => 'activity',
            'pendingContracts' => $pendingContracts,
            'inProgressContracts' => $inProgressContracts,
            'draftContracts' => $draftContracts,
            'activityCounts' => $activityCounts,
            'counts' => $activityCounts,
            'types' => $loaders['types'](),
            'submissionTypes' => $loaders['submissionTypes'](),
            'users' => Inertia::defer(fn () => $loaders['users']()),
            'vendors' => Inertia::defer(fn () => $loaders['vendors']()),
            'formTemplates' => Inertia::defer(fn () => $loaders['formTemplates']()),
            'departments' => $loaders['departments'](),
            'divisions' => $loaders['divisions'](),
            'roles' => $loaders['roles'](),
            'regions' => $loaders['regions'](),
            'locations' => $loaders['locations'](),
            'companyGroups' => $loaders['companyGroups'](),
            'companies' => $loaders['companies'](),
            'contractStatuses' => $loaders['contractStatuses'](),
            'filters' => $request->only([
                'search_pending', 'search_progress', 'search_draft',
                'page_pending', 'page_progress', 'page_draft',
                'sort_pending', 'dir_pending',
                'sort_progress', 'dir_progress',
                'sort_draft', 'dir_draft',
            ]),
            'breadcrumbs' => [
                ['title' => 'Manajemen Kontrak', 'href' => route('contracts'), 'icon' => 'FileText'],
                ['title' => 'Aktivitas Pengajuan', 'href' => '#', 'description' => 'Ringkasan pengajuan yang perlu tindakan, sedang diproses, dan draft.', 'icon' => 'Layers'],
            ],
        ], $counts);

        return Inertia::render('contracts/Activity', $data);
    }

    /**
     * Apply sorting for activity view tables.
     */
    private function applyActivitySort($query, ?string $sortBy, ?string $sortDir, string $defaultSort = 'updated_at'): void
    {
        $dir = strtolower($sortDir ?? 'desc') === 'asc' ? 'asc' : 'desc';
        $sortBy = $sortBy ?: $defaultSort;

        $userSubquery = fn (string $columnExpr) => User::select('name')
            ->whereColumn('m_users.id', DB::raw($columnExpr))
            ->limit(1);

        $typeSubquery = fn () => DB::table('m_contract_types')
            ->select('name')
            ->whereColumn('m_contract_types.id', 't_contracts.contract_type_id')
            ->limit(1);

        match ($sortBy) {
            'title', 'form_no', 'contract_no_title' => $query->orderByRaw("COALESCE(t_contracts.title, t_contracts.form_no, t_contracts.contract_no) {$dir}"),
            'requestor', 'creator', 'initiator' => $query->orderBy($userSubquery('COALESCE(t_contracts.initiated_by_id, t_contracts.created_by)'), $dir),
            'pic', 'assigned_pic', 'assigned_pic_id' => $query->orderBy($userSubquery('t_contracts.assigned_pic_id'), $dir),
            'type', 'contract_type', 'contract_type_id' => $query->orderBy($typeSubquery(), $dir),
            'status' => $query->orderBy('status', $dir),
            'created_at' => $query->orderBy('created_at', $dir),
            'updated_at' => $query->orderBy('updated_at', $dir),
            default => $query->orderBy($sortBy, $dir),
        };

        $query->orderBy('t_contracts.id', 'desc');
    }

    /**
     * Get view metadata including title, description, and icon.
     *
     * @return array{title: string, description: string, icon: string}
     */
    private function getViewMetadata(string $view): array
    {
        return match ($view) {
            'dashboard' => ['title' => 'Dashboard', 'description' => 'Statistik dan ringkasan aktivitas kontrak.', 'icon' => 'LayoutGrid'],
            'organization' => ['title' => 'Semua Pengajuan', 'description' => 'Daftar seluruh dokumen pengajuan dalam lingkup Organization Group Anda.', 'icon' => 'FileText'],
            'mine' => ['title' => 'Pengajuan Saya', 'description' => 'Daftar dokumen pengajuan yang Anda buat.', 'icon' => 'FileEdit'],
            'duty', 'my_duty', 'assigned' => ['title' => 'Tugas Saya', 'description' => 'Daftar dokumen pengajuan yang ditugaskan kepada Anda sebagai PIC.', 'icon' => 'Briefcase'],
            'pending' => ['title' => 'Persetujuan Saya', 'description' => 'Dokumen pengajuan yang menunggu atau telah diproses persetujuan Anda.', 'icon' => 'Clock'],
            'expiry' => ['title' => 'Masa Berlaku Dokumen', 'description' => 'Dokumen yang akan atau telah berakhir masa berlakunya.', 'icon' => 'History'],
            'archived' => ['title' => 'Arsip Dokumen', 'description' => 'Kontrak yang telah diarsipkan.', 'icon' => 'FolderClosed'],
            'in_progress' => ['title' => 'On Progress', 'description' => 'Kontrak yang sedang dalam proses pengerjaan.', 'icon' => 'Clock'],
            default => ['title' => 'Semua Pengajuan', 'description' => 'Daftar seluruh dokumen pengajuan dalam sistem.', 'icon' => 'FileText'],
        };
    }

    /**
     * Compute and cache contract counts per category for navigation tabs.
     */
    private function getCachedContractCounts(string|int|null $userId): array
    {
        return Cache::remember("contract_category_counts_{$userId}", now()->addMinutes(5), function () use ($userId) {
            $allTypes = DB::table('m_contract_types')->whereNull('deleted_at')->get();

            $getDescendantIds = function ($parentId) use (&$getDescendantIds, $allTypes) {
                if (! $parentId) {
                    return [];
                }
                $children = $allTypes->where('parent_id', $parentId)->pluck('id')->all();
                $descendants = $children;
                foreach ($children as $childId) {
                    $descendants = array_merge($descendants, $getDescendantIds($childId));
                }

                return array_values(array_unique(array_merge([$parentId], $descendants)));
            };

            $roots = $allTypes->whereNull('parent_id');

            // Map every root dynamically to its descendant subtree
            $rootDescendantMap = [];
            $rootMetaMap = [];
            foreach ($roots as $root) {
                $rootDescendantMap[$root->id] = $getDescendantIds($root->id);
                $rootMetaMap[$root->id] = [
                    'code' => strtolower($root->code ?? ''),
                    'slug' => Str::slug($root->name ?? ''),
                    'code_slug' => Str::slug($root->code ?? ''),
                ];
            }

            $kontrakParent = $roots->first(fn ($p) => strtoupper($p->code ?? '') === 'A-1' || (stripos($p->name, 'non') === false && stripos($p->name, 'kontrak') !== false)) ?: $roots->first();
            $nonKontrakParent = $roots->first(fn ($p) => strtoupper($p->code ?? '') === 'A-2' || stripos($p->name, 'non') !== false);
            $ndaParent = $roots->first(fn ($p) => strtoupper($p->code ?? '') === 'NDA' || stripos($p->name, 'nda') !== false || stripos($p->name, 'kerahasiaan') !== false);

            $kontrakIds = $kontrakParent ? $getDescendantIds($kontrakParent->id) : [];
            $nonKontrakIds = $nonKontrakParent ? $getDescendantIds($nonKontrakParent->id) : [];
            $ndaIds = $ndaParent ? $getDescendantIds($ndaParent->id) : [];

            $buildCategoryCounts = function ($activeQuery, $scopedQuery = null, bool $includeStatus = true) use ($rootDescendantMap, $rootMetaMap, $kontrakIds, $nonKontrakIds, $ndaIds) {
                $dynamic = [];
                foreach ($rootDescendantMap as $rootId => $descendantIds) {
                    $cnt = (clone $activeQuery)->where(fn ($q) => $q->whereIn('contract_type_id', $descendantIds)->orWhereIn('contract_type_parent_id', $descendantIds))->count();
                    $dynamic[$rootId] = $cnt;
                    if (! empty($rootMetaMap[$rootId]['code'])) {
                        $dynamic[$rootMetaMap[$rootId]['code']] = $cnt;
                    }
                    if (! empty($rootMetaMap[$rootId]['slug'])) {
                        $dynamic[$rootMetaMap[$rootId]['slug']] = $cnt;
                    }
                    if (! empty($rootMetaMap[$rootId]['code_slug'])) {
                        $dynamic[$rootMetaMap[$rootId]['code_slug']] = $cnt;
                    }
                }

                $base = [
                    'all' => (clone $activeQuery)->count(),
                    'kontrak' => $kontrakIds ? (clone $activeQuery)->where(fn ($q) => $q->whereIn('contract_type_id', $kontrakIds)->orWhereIn('contract_type_parent_id', $kontrakIds))->count() : 0,
                    'non_kontrak' => $nonKontrakIds ? (clone $activeQuery)->where(fn ($q) => $q->whereIn('contract_type_id', $nonKontrakIds)->orWhereIn('contract_type_parent_id', $nonKontrakIds))->count() : 0,
                    'nda' => $ndaIds ? (clone $activeQuery)->where(fn ($q) => $q->whereIn('contract_type_id', $ndaIds)->orWhereIn('contract_type_parent_id', $ndaIds))->count() : 0,
                ];

                if ($includeStatus && $scopedQuery) {
                    $base['in_progress'] = (clone $scopedQuery)->whereIn('status', ['in_review', 'revision', 'pending', 'locked'])->whereNull('closed_at')->count();
                    $base['archived'] = (clone $scopedQuery)->where(fn ($q) => $q->whereRaw('UPPER(status) = ?', ['ARCHIVED'])->orWhereNotNull('closed_at'))->count();
                }

                return array_merge($base, $dynamic);
            };

            // Scoped base query respecting user organization permissions (no eager loading needed for counts)
            $scopedAllQuery = $this->contractListQuery->build(new Request, 'all', false);
            $activeContractsQuery = (clone $scopedAllQuery)->whereRaw('UPPER(status) != ?', ['ARCHIVED'])->whereNull('closed_at');
            $parentCategoryCounts = $buildCategoryCounts($activeContractsQuery, $scopedAllQuery, true);

            // Org Group Counts
            $scopedOrgQuery = $this->contractListQuery->build(new Request, 'organization', false);
            $activeOrgQuery = (clone $scopedOrgQuery)->whereRaw('UPPER(status) != ?', ['ARCHIVED'])->whereNull('closed_at');
            $orgCategoryCounts = $buildCategoryCounts($activeOrgQuery, $scopedOrgQuery, true);

            // Mine Counts
            $scopedMineQuery = Contract::mine($userId);
            $myActiveQuery = (clone $scopedMineQuery)->whereRaw('UPPER(status) != ?', ['ARCHIVED'])->whereNull('closed_at');
            $mineCounts = $buildCategoryCounts($myActiveQuery, $scopedMineQuery, true);

            // Duty Counts (Assigned PIC)
            $scopedDutyQuery = Contract::duty($userId);
            $dutyActiveQuery = (clone $scopedDutyQuery)->whereRaw('UPPER(status) != ?', ['ARCHIVED'])->whereNull('closed_at');
            $dutyCounts = $buildCategoryCounts($dutyActiveQuery, $scopedDutyQuery, true);

            // Pending Approvals Counts
            $pendingCounts = [
                'pending' => Contract::pendingApprovalFor($userId)->count(),
                'history' => Contract::actedBy($userId)->count(),
            ];

            // Expiry Counts
            $scopedExpiryQuery = (clone $scopedAllQuery)
                ->whereNotNull('end_date')
                ->whereDate('end_date', '<=', now()->addDays(30)->toDateString());
            $expiryCategoryCounts = $buildCategoryCounts($scopedExpiryQuery, null, false);

            return [
                'parentCategoryCounts' => $parentCategoryCounts,
                'orgCategoryCounts' => $orgCategoryCounts,
                'mineCounts' => $mineCounts,
                'dutyCounts' => $dutyCounts,
                'pendingCounts' => $pendingCounts,
                'expiryCategoryCounts' => $expiryCategoryCounts,
            ];
        });
    }

    public function showView(Request $request, string $id): Response|JsonResponse
    {
        $contract = $this->contractDetailQuery->find($id);

        if (! Gate::allows('view', $contract)) {
            abort(404, 'Kontrak tidak ditemukan.');
        }

        if ($request->wantsJson() && ! $request->header('X-Inertia')) {
            $formatted = ContractFormatter::formatContract($contract, true);
            // Separate heavy sub-resources to their dedicated endpoints
            unset(
                $formatted['approvals'],
                $formatted['histories'],
                $formatted['workflow'],
                $formatted['sub_workflow'],
                $formatted['origin_workflow'],
                $formatted['origin_workflow_step'],
                $formatted['next_step']
            );

            return $this->successResponse($formatted, 'Contract retrieved successfully');
        }

        $loaders = $this->contractOptionsQuery->getLoaders();

        $contracts = $this->contractListQuery
            ->build($request, 'contracts')
            ->paginate($request->integer('per_page', 25))
            ->withQueryString()
            ->through(fn ($c) => ContractFormatter::formatContract($c, false));

        $data = [
            'currentView' => 'contracts',
            'contracts' => $contracts,
            'initialSelected' => ContractFormatter::formatContract($contract),
            'types' => $loaders['types'](),
            'submissionTypes' => $loaders['submissionTypes'](),
            'users' => Inertia::defer($loaders['users']),
            'vendors' => Inertia::defer($loaders['vendors']),
            'formTemplates' => Inertia::defer($loaders['formTemplates']),
            'filters' => array_merge($request->only(['search', 'status', 'contract_type_id']), [
                'per_page' => $request->integer('per_page', 25),
            ]),
            'breadcrumbs' => [
                ['title' => 'Manajemen Kontrak', 'href' => route('contracts'), 'icon' => 'FileText'],
                ['title' => 'Detail Kontrak', 'href' => '#', 'description' => 'Melihat detail kontrak.', 'icon' => 'Eye'],
            ],
        ];

        return Inertia::render('contracts/Index', $data);
    }

    public function getTypes(): JsonResponse
    {
        $loaders = $this->contractOptionsQuery->getLoaders();

        return $this->successResponse($loaders['types'](), 'Contract types retrieved successfully');
    }

    public function getSubmissionTypes(): JsonResponse
    {
        $loaders = $this->contractOptionsQuery->getLoaders();

        return $this->successResponse($loaders['submissionTypes'](), 'Submission types retrieved successfully');
    }

    public function getDashboardVisibility(Request $request): JsonResponse
    {
        $authUser = $request->user();
        $userId = $request->query('user_id');
        $dashboardTypeId = $request->query('dashboard_type_id');

        $user = null;
        if (! empty($userId)) {
            if ($authUser && ($authUser->id === $userId || $authUser->isAdmin())) {
                $user = User::with(['roleRelation', 'division', 'department'])->find($userId);
            }
        }

        if (! $user) {
            $user = $authUser;
            if ($user && ! $user->relationLoaded('roleRelation')) {
                $user->load(['roleRelation', 'division', 'department']);
            }
        }

        $resolvedType = null;
        if (! empty($dashboardTypeId)) {
            $resolvedType = DashboardType::find($dashboardTypeId);
        }

        if (! $resolvedType && $user) {
            $resolvedType = DashboardType::resolveForUser($user);
        }

        $filterSettings = $user ? $user->getContractFilterSettings() : [];

        $data = [
            'user' => $user ? [
                'id' => (string) $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'division_id' => $user->division_id,
                'division_name' => $user->division?->name,
                'department_id' => $user->department_id,
                'department_name' => $user->department?->name,
            ] : null,
            'profile' => [
                'id' => $resolvedType ? (string) $resolvedType->id : null,
                'name' => $resolvedType?->name ?? 'Default (Fallback)',
                'priority' => $resolvedType?->priority ?? null,
                'description' => $resolvedType?->description ?? 'Tidak ada profil spesifik, menggunakan konfigurasi default sistem.',
            ],
            'visibility' => [
                'show_overview' => (bool) ($resolvedType?->show_overview ?? true),
                'show_overview_contract' => (bool) ($resolvedType?->show_overview_contract ?? true),
                'show_overview_non_contract' => (bool) ($resolvedType?->show_overview_non_contract ?? true),
                'show_overview_nda' => (bool) ($resolvedType?->show_overview_nda ?? true),
                'show_workload' => (bool) ($resolvedType?->show_workload ?? false),
                'show_master_data' => (bool) ($resolvedType?->show_master_data ?? false),
            ],
            'template_authority' => [
                'template_can_read' => (bool) ($resolvedType?->template_can_read ?? true),
                'template_can_download' => (bool) ($resolvedType?->template_can_download ?? true),
                'template_can_upload' => (bool) ($resolvedType?->template_can_upload ?? false),
                'template_can_create_folder' => (bool) ($resolvedType?->template_can_create_folder ?? false),
                'template_can_edit' => (bool) ($resolvedType?->template_can_edit ?? false),
                'template_can_toggle_visibility' => (bool) ($resolvedType?->template_can_toggle_visibility ?? false),
                'template_can_delete' => (bool) ($resolvedType?->template_can_delete ?? false),
            ],
            'on_behalf_authority' => [
                'can_create_on_behalf' => (bool) ($resolvedType?->can_create_on_behalf ?? false),
                'allowed_on_behalf_user_ids' => $user ? $user->allowed_on_behalf_user_ids : null,
            ],
            'filter_settings' => $filterSettings,
        ];

        return $this->successResponse($data, 'Dashboard visibility configuration retrieved successfully');
    }

    public function getDashboardMetrics(Request $request): JsonResponse
    {
        return $this->successResponse((new ContractDashboardQuery)->getMetrics($request), 'Dashboard metrics retrieved successfully');
    }

    public function getDashboardSummary(Request $request): JsonResponse
    {
        return $this->successResponse((new ContractDashboardQuery)->getSummaryMetrics($request), 'Dashboard summary retrieved successfully');
    }

    public function getDashboardOverview(Request $request): JsonResponse
    {
        return $this->successResponse((new ContractDashboardQuery)->getOverviewMetrics($request), 'Dashboard overview retrieved successfully');
    }

    public function getDashboardDistributions(Request $request): JsonResponse
    {
        return $this->successResponse((new ContractDashboardQuery)->getDistributions($request), 'Dashboard distributions retrieved successfully');
    }

    public function getDashboardTrends(Request $request): JsonResponse
    {
        return $this->successResponse((new ContractDashboardQuery)->getTrends($request), 'Dashboard trends retrieved successfully');
    }

    public function getDashboardAnalysis(Request $request): JsonResponse
    {
        return $this->successResponse((new ContractDashboardQuery)->getAnalysis($request), 'Dashboard analysis retrieved successfully');
    }

    public function getDashboardWorkload(Request $request): JsonResponse
    {
        return $this->successResponse((new ContractDashboardQuery)->getWorkloads($request), 'Dashboard workload retrieved successfully');
    }

    public function getDashboardMasterData(Request $request): JsonResponse
    {
        return $this->successResponse((new ContractDashboardQuery)->getMasterData($request), 'Dashboard master data retrieved successfully');
    }

    public function getDashboardRecentActivity(Request $request): JsonResponse
    {
        return $this->successResponse((new ContractDashboardQuery)->getRecentActivityMetrics($request), 'Dashboard recent activity retrieved successfully');
    }

    public function show(string $id): JsonResponse
    {
        $contract = $this->contractDetailQuery->find($id);

        // Authorization: policy view + only Admin or Creator can view drafts
        $isDraftBlocked = $contract->status === 'draft' && ! $this->ownsOrAdmin($contract);
        if ($isDraftBlocked || ! Gate::allows('view', $contract)) {
            return $this->errorResponse('Halaman tidak tersedia', 403);
        }

        return $this->successResponse(ContractFormatter::formatContract($contract), 'Contract retrieved successfully');
    }

    public function getWorkflows(Request $request): JsonResponse
    {
        if ($request->boolean('all')) {
            $workflows = Workflow::where('is_active', true)
                ->with(['steps' => fn ($q) => $q->orderBy('step'), 'contractType'])
                ->orderBy('name')
                ->get();

            return response()->json($workflows);
        }

        $authUser = $request->user();
        $targetUserId = $request->query('user_id');
        $user = $authUser;

        if ($targetUserId && $authUser) {
            $isAuthorized = (string) $authUser->id === (string) $targetUserId
                || $authUser->isAdmin()
                || (bool) $authUser->can_create_on_behalf;

            if ($isAuthorized) {
                $targetUser = User::find($targetUserId);
                if ($targetUser) {
                    $user = $targetUser;
                }
            }
        }

        $contractType = $request->query('contract_type');
        $workflows = $this->workflowService->getAvailableWorkflows($user, $contractType);

        return response()->json($workflows);
    }

    public function getUsers(Request $request): JsonResponse
    {
        $loaders = $this->contractOptionsQuery->getLoaders();
        $users = $loaders['users']();

        return $this->successResponse($users, 'Users retrieved successfully');
    }

    public function getRoles(): JsonResponse
    {
        $loaders = $this->contractOptionsQuery->getLoaders();
        $roles = $loaders['roles']();

        return $this->successResponse($roles, 'Roles retrieved successfully');
    }

    public function store(StoreContractRequest $request): JsonResponse
    {
        $contract = $this->storeAction->execute($request->validated());

        return $this->successResponse(ContractFormatter::formatContract($contract), 'Contract created successfully', 201);
    }

    public function update(UpdateContractRequest $request, string $id): JsonResponse
    {
        $contract = $this->contractDetailQuery->find($id);

        // Granular permission check
        $payload = $request->validated();
        $isUpdatingReference = array_key_exists('parent_id', $payload);
        $isUpdatingInfo = collect($payload)->except(['parent_id'])->isNotEmpty();

        if ($isUpdatingInfo) {
            Gate::authorize('update', $contract);
        }

        if ($isUpdatingReference) {
            Gate::authorize('updateReference', $contract);
        }

        $validated = $request->validated();

        $contract = $this->updateAction->execute($contract, $validated);

        return $this->successResponse(ContractFormatter::formatContract($this->contractDetailQuery->find($contract->id)), 'Contract updated successfully');
    }

    public function reviewDoc(Request $request, string $id): JsonResponse
    {
        $contract = $this->contractDetailQuery->find($id);
        if (! Gate::allows('view', $contract)) {
            abort(404, 'Kontrak tidak ditemukan.');
        }

        $doc = $request->input('doc'); // 'f1' | 'f2' | 'agreement'
        if (! in_array($doc, ['f1', 'f2', 'agreement'])) {
            return $this->errorResponse('Invalid document type', 422);
        }

        $user = $request->user();
        $now = now()->toIso8601String();
        $stepKey = $contract->workflow_step_id ? 'step_'.$contract->workflow_step_id : 'general';

        // Check if current user is an authorized approver/reviewer for the active step
        $contract->loadMissing(['approvals.approver', 'workflowStep.approverAuthorities']);
        $isStepPendingApprover = $contract->approvals
            ->where('workflow_step_id', $contract->workflow_step_id)
            ->whereIn('status', ['pending', 'waiting'])
            ->where('user_id', $user?->id)
            ->isNotEmpty();

        $isAuthorityMatch = false;
        if (! $isStepPendingApprover && $contract->workflowStep) {
            $authorities = $contract->workflowStep->approverAuthorities;
            if ($authorities && $authorities->isNotEmpty()) {
                $isAuthorityMatch = $authorities->contains(function ($auth) use ($user) {
                    if ($auth->authority_type === 'user' && $auth->user_id === $user?->id) {
                        return true;
                    }
                    if ($auth->authority_type === 'role' && $auth->role_id === $user?->role_id) {
                        return true;
                    }
                    if ($auth->authority_type === 'department' && $auth->department_id === $user?->department_id) {
                        return true;
                    }
                    if ($auth->authority_type === 'division' && $auth->division_id === $user?->division_id) {
                        return true;
                    }

                    return false;
                });
            }
        }

        $isEligibleReviewer = $isStepPendingApprover || $isAuthorityMatch || ($user?->role === 'Admin' || $user?->role === 'Superadmin');

        // Only save official review record if user is an eligible reviewer for this step
        if ($isEligibleReviewer) {
            // 1. Save to relational table t_submission_reviews
            SubmissionReview::updateOrCreate(
                [
                    'submission_id' => $contract->id,
                    'submission_type' => SubmissionReview::TYPE_CONTRACT,
                    'workflow_step_id' => $contract->workflow_step_id,
                    'step_number' => $contract->workflowStep?->step ?? $contract->current_step_number,
                    'workflow_iteration' => $contract->workflow_iteration ?? 1,
                    'context_type' => SubmissionReview::CONTEXT_DOCUMENT_REVIEW,
                    'item_key' => $doc,
                    'document_type' => $doc,
                    'user_id' => $user?->id,
                ],
                [
                    'contract_id' => $contract->id,
                    'status' => SubmissionReview::STATUS_REVIEWED,
                    'user_name' => $user?->name,
                    'user_role' => $user?->role ?? $user?->role_name,
                    'reviewed_at' => now(),
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'metadata' => [
                        'device' => $request->header('Sec-Ch-Ua-Platform') ?? 'Web',
                    ],
                ]
            );

            // 2. Keep JSON metadata synchronized for backward compatibility
            $metadata = $contract->metadata ?? [];
            $docReviews = $metadata['doc_reviews'] ?? [];

            $reviewInfo = [
                'reviewed' => true,
                'reviewed_at' => $now,
                'user_id' => $user?->id,
                'user_name' => $user?->name,
                'user_role' => $user?->role ?? $user?->role_name,
            ];

            if (! isset($docReviews[$stepKey])) {
                $docReviews[$stepKey] = [];
            }
            $docReviews[$stepKey][$doc] = $reviewInfo;
            $metadata['doc_reviews'] = $docReviews;
            $metadata["doc_reviews_{$stepKey}"] = $docReviews[$stepKey];

            $contract->update(['metadata' => $metadata]);
        }

        return $this->successResponse([
            'metadata' => $contract->metadata,
            'contract' => ContractFormatter::formatContract($this->contractDetailQuery->find($contract->id)),
        ], $isEligibleReviewer ? 'Dokumen berhasil ditandai telah direview di database' : 'Dokumen dibuka (view-only)');
    }

    public function destroy(string $id): JsonResponse
    {
        $contract = $this->contractDetailQuery->find($id);

        if ($contract->status !== 'draft') {
            return $this->errorResponse('Hanya kontrak berstatus draft yang dapat dihapus.', 422);
        }

        if (! $this->ownsOrAdmin($contract)) {
            return $this->errorResponse('Anda tidak memiliki izin menghapus kontrak ini.', 403);
        }

        // Other relations are deleted by database cascade; files removed only after DB commit
        DB::transaction(fn () => $contract->delete());
        Storage::disk('local')->deleteDirectory("contracts/{$contract->id}");

        return $this->successResponse(null, 'Kontrak berhasil dihapus.');
    }

    public function bulkDestroy(Request $request): JsonResponse
    {
        if (! $this->checkBulkPermission('can_bulk_delete')) {
            return $this->errorResponse('Anda tidak memiliki izin untuk aksi massal ini.', 403);
        }

        $ids = $request->input('ids');
        if (empty($ids)) {
            return $this->errorResponse('Tidak ada kontrak yang dipilih.', 422);
        }

        $contracts = Contract::whereIn('id', (array) $ids)
            ->where('status', 'draft')
            ->get()
            ->filter(fn (Contract $c) => $this->ownsOrAdmin($c));

        DB::transaction(fn () => $contracts->each->delete());
        $contracts->each(fn (Contract $c) => Storage::disk('local')->deleteDirectory("contracts/{$c->id}"));

        $count = $contracts->count();

        return $this->successResponse(['deleted_count' => $count], "{$count} kontrak berhasil dihapus.");
    }

    /**
     * Creator, initiator, or admin.
     */
    private function ownsOrAdmin(Contract $contract): bool
    {
        $user = Auth::user();

        return $user && (
            $contract->created_by === $user->id
            || $contract->initiated_by_id === $user->id
            || $user->isAdmin()
        );
    }

    public function export(Request $request)
    {
        $query = $this->contractListQuery->build($request, $request->input('view', 'all'));

        return Excel::download(
            new ContractExport($query),
            'data_kontrak_'.date('Ymd_His').'.xlsx',
        );
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv',
        ]);

        try {
            Excel::import(new ContractImport, $request->file('file'));

            return back()->with('success', 'Data kontrak berhasil iimpor.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal mengimpor data: '.$e->getMessage()]);
        }
    }

    protected function checkBulkPermission($permission)
    {
        $role = Role::where('name', Auth::user()->role)->first();
        if (! $role) {
            return false;
        }

        return AccessModule::where('role_id', $role->id)
            ->join('m_modules', 'm_access_modules.module_id', '=', 'm_modules.id')
            ->where('m_modules.identifier', 'CONTRACTS')
            ->where($permission, true)
            ->exists();
    }
}
