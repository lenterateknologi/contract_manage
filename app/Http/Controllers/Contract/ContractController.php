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
use App\Models\Transaction\Contract;
use App\Models\Transaction\SubmissionReview;
use App\Services\ContractFilterScopeService;
use App\Services\Workflow\ContractWorkflowService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
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

    #[OA\Get(
        path: '/api/contracts',
        summary: 'Get list of contracts',
        tags: ['Contracts'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'view', in: 'query', description: 'Filter by view (dashboard, contracts, mine, pending, etc.)', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'search', in: 'query', description: 'Search query', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'per_page', in: 'query', description: 'Items per page', schema: new OA\Schema(type: 'integer', default: 10)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'List of contracts'),
        ],
    )]
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

        $contracts = in_array($view, ['dashboard', 'profile'])
            ? new LengthAwarePaginator([], 0, 25)
            : $this->contractListQuery
                ->build($request, $view)
                ->paginate($request->integer('per_page', 25))
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
                'company_group_id', 'region_id', 'company_id', 'division_id', 'mine_tab', 'org_tab', 'contract_tab', 'parent_tab', 'pending_tab', 'expiry_tab',
                'sort_by', 'sort_dir', 'sortBy', 'sortDir',
            ]), [
                'per_page' => $request->integer('per_page', 10),
            ]),
            'breadcrumbs' => [
                ['title' => 'Manajemen Kontrak', 'href' => route('contracts'), 'icon' => 'FileText'],
                ['title' => $meta['title'], 'href' => '#', 'description' => $meta['description'], 'icon' => $meta['icon']],
            ],
        ], $counts);

        if ($view === 'dashboard') {
            $data['metrics'] = Inertia::defer(fn () => (new ContractDashboardQuery)->getMetrics($request));
        }

        return Inertia::render('contracts/Index', $data);
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
            'pending' => ['title' => 'Persetujuan Saya', 'description' => 'Dokumen pengajuan yang menunggu atau telah diproses persetujuan Anda.', 'icon' => 'Clock'],
            'expiry' => ['title' => 'Masa Berlaku Dokumen', 'description' => 'Dokumen yang akan atau telah berakhir masa berlakunya.', 'icon' => 'History'],
            'archived' => ['title' => 'Arsip Dokumen', 'description' => 'Kontrak yang telah diarsipkan.', 'icon' => 'FolderClosed'],
            'in_progress' => ['title' => 'On Progress', 'description' => 'Kontrak yang sedang dalam proses pengerjaan.', 'icon' => 'Clock'],
            'f1' => ['title' => 'Formulir F1', 'description' => 'Daftar kontrak dengan dokumen F1.', 'icon' => 'FilePlus'],
            'f2' => ['title' => 'Formulir F2', 'description' => 'Daftar kontrak dengan dokumen F2.', 'icon' => 'FilePlus'],
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
            foreach ($roots as $root) {
                $rootDescendantMap[$root->id] = $getDescendantIds($root->id);
            }

            // Scoped base query respecting user organization permissions (no eager loading needed for counts)
            $scopedAllQuery = $this->contractListQuery->build(new Request, 'all', false);
            $activeContractsQuery = (clone $scopedAllQuery)->whereRaw('UPPER(status) != ?', ['ARCHIVED'])->whereNull('closed_at');

            // Dynamic counts per root category
            $dynamicParentCounts = [];
            foreach ($rootDescendantMap as $rootId => $descendantIds) {
                $dynamicParentCounts[$rootId] = (clone $activeContractsQuery)->where(fn ($q) => $q->whereIn('contract_type_id', $descendantIds)->orWhereIn('contract_type_parent_id', $descendantIds))->count();
            }

            $kontrakParent = $roots->first(fn ($p) => strtoupper($p->code ?? '') === 'A-1' || (stripos($p->name, 'non') === false && stripos($p->name, 'kontrak') !== false)) ?: $roots->first();
            $nonKontrakParent = $roots->first(fn ($p) => strtoupper($p->code ?? '') === 'A-2' || stripos($p->name, 'non') !== false);
            $ndaParent = $roots->first(fn ($p) => strtoupper($p->code ?? '') === 'NDA' || stripos($p->name, 'nda') !== false || stripos($p->name, 'kerahasiaan') !== false);

            $kontrakIds = $kontrakParent ? $getDescendantIds($kontrakParent->id) : [];
            $nonKontrakIds = $nonKontrakParent ? $getDescendantIds($nonKontrakParent->id) : [];
            $ndaIds = $ndaParent ? $getDescendantIds($ndaParent->id) : [];

            $parentCategoryCounts = array_merge([
                'all' => (clone $activeContractsQuery)->count(),
                'kontrak' => $kontrakIds ? (clone $activeContractsQuery)->where(fn ($q) => $q->whereIn('contract_type_id', $kontrakIds)->orWhereIn('contract_type_parent_id', $kontrakIds))->count() : 0,
                'non_kontrak' => $nonKontrakIds ? (clone $activeContractsQuery)->where(fn ($q) => $q->whereIn('contract_type_id', $nonKontrakIds)->orWhereIn('contract_type_parent_id', $nonKontrakIds))->count() : 0,
                'nda' => $ndaIds ? (clone $activeContractsQuery)->where(fn ($q) => $q->whereIn('contract_type_id', $ndaIds)->orWhereIn('contract_type_parent_id', $ndaIds))->count() : 0,
                'in_progress' => (clone $scopedAllQuery)->whereIn('status', ['in_review', 'pending', 'locked'])->whereNull('closed_at')->count(),
                'archived' => (clone $scopedAllQuery)->where(fn ($q) => $q->whereRaw('UPPER(status) = ?', ['ARCHIVED'])->orWhereNotNull('closed_at'))->count(),
            ], $dynamicParentCounts);

            // Org Group Counts
            $scopedOrgQuery = $this->contractListQuery->build(new Request, 'organization', false);
            $activeOrgQuery = (clone $scopedOrgQuery)->whereRaw('UPPER(status) != ?', ['ARCHIVED'])->whereNull('closed_at');
            $dynamicOrgCounts = [];
            foreach ($rootDescendantMap as $rootId => $descendantIds) {
                $dynamicOrgCounts[$rootId] = (clone $activeOrgQuery)->where(fn ($q) => $q->whereIn('contract_type_id', $descendantIds)->orWhereIn('contract_type_parent_id', $descendantIds))->count();
            }

            $orgCategoryCounts = array_merge([
                'all' => (clone $activeOrgQuery)->count(),
                'kontrak' => $kontrakIds ? (clone $activeOrgQuery)->where(fn ($q) => $q->whereIn('contract_type_id', $kontrakIds)->orWhereIn('contract_type_parent_id', $kontrakIds))->count() : 0,
                'non_kontrak' => $nonKontrakIds ? (clone $activeOrgQuery)->where(fn ($q) => $q->whereIn('contract_type_id', $nonKontrakIds)->orWhereIn('contract_type_parent_id', $nonKontrakIds))->count() : 0,
                'nda' => $ndaIds ? (clone $activeOrgQuery)->where(fn ($q) => $q->whereIn('contract_type_id', $ndaIds)->orWhereIn('contract_type_parent_id', $ndaIds))->count() : 0,
                'in_progress' => (clone $scopedOrgQuery)->whereIn('status', ['in_review', 'pending', 'locked'])->whereNull('closed_at')->count(),
                'archived' => (clone $scopedOrgQuery)->where(fn ($q) => $q->whereRaw('UPPER(status) = ?', ['ARCHIVED'])->orWhereNotNull('closed_at'))->count(),
            ], $dynamicOrgCounts);

            $scopedMineQuery = $this->contractListQuery->build(new Request, 'mine', false);
            $myActiveQuery = (clone $scopedMineQuery)->whereRaw('UPPER(status) != ?', ['ARCHIVED'])->whereNull('closed_at');
            $dynamicMineCounts = [];
            foreach ($rootDescendantMap as $rootId => $descendantIds) {
                $dynamicMineCounts[$rootId] = (clone $myActiveQuery)->where(fn ($q) => $q->whereIn('contract_type_id', $descendantIds)->orWhereIn('contract_type_parent_id', $descendantIds))->count();
            }

            $mineCounts = array_merge([
                'all' => (clone $myActiveQuery)->count(),
                'kontrak' => $kontrakIds ? (clone $myActiveQuery)->where(fn ($q) => $q->whereIn('contract_type_id', $kontrakIds)->orWhereIn('contract_type_parent_id', $kontrakIds))->count() : 0,
                'non_kontrak' => $nonKontrakIds ? (clone $myActiveQuery)->where(fn ($q) => $q->whereIn('contract_type_id', $nonKontrakIds)->orWhereIn('contract_type_parent_id', $nonKontrakIds))->count() : 0,
                'nda' => $ndaIds ? (clone $myActiveQuery)->where(fn ($q) => $q->whereIn('contract_type_id', $ndaIds)->orWhereIn('contract_type_parent_id', $ndaIds))->count() : 0,
                'in_progress' => (clone $scopedMineQuery)->whereIn('status', ['in_review', 'pending', 'locked'])->whereNull('closed_at')->count(),
                'archived' => (clone $scopedMineQuery)->where(fn ($q) => $q->whereRaw('UPPER(status) = ?', ['ARCHIVED'])->orWhereNotNull('closed_at'))->count(),
            ], $dynamicMineCounts);

            $pendingCounts = [
                'pending' => DB::table('t_approvals')
                    ->join('t_contracts', 't_approvals.contract_id', '=', 't_contracts.id')
                    ->where('t_approvals.user_id', $userId)
                    ->where('t_approvals.status', 'pending')
                    ->whereNull('t_contracts.deleted_at')
                    ->whereRaw("UPPER(t_contracts.status) != 'DRAFT'")
                    ->whereColumn('t_approvals.workflow_step_id', 't_contracts.workflow_step_id')
                    ->distinct('t_contracts.id')
                    ->count('t_contracts.id'),
                'history' => DB::table('t_approvals')
                    ->join('t_contracts', 't_approvals.contract_id', '=', 't_contracts.id')
                    ->where('t_approvals.user_id', $userId)
                    ->whereIn('t_approvals.status', ['approved', 'rejected', 'revision'])
                    ->whereNull('t_contracts.deleted_at')
                    ->whereRaw("UPPER(t_contracts.status) != 'DRAFT'")
                    ->distinct('t_contracts.id')
                    ->count('t_contracts.id'),
            ];

            $scopedExpiryQuery = (clone $scopedAllQuery)
                ->whereNotNull('end_date')
                ->whereDate('end_date', '<=', now()->addDays(30)->toDateString());
            $dynamicExpiryCounts = [];
            foreach ($rootDescendantMap as $rootId => $descendantIds) {
                $dynamicExpiryCounts[$rootId] = (clone $scopedExpiryQuery)->where(fn ($q) => $q->whereIn('contract_type_id', $descendantIds)->orWhereIn('contract_type_parent_id', $descendantIds))->count();
            }

            $expiryCategoryCounts = array_merge([
                'all' => (clone $scopedExpiryQuery)->count(),
                'kontrak' => $kontrakIds ? (clone $scopedExpiryQuery)->where(fn ($q) => $q->whereIn('contract_type_id', $kontrakIds)->orWhereIn('contract_type_parent_id', $kontrakIds))->count() : 0,
                'non_kontrak' => $nonKontrakIds ? (clone $scopedExpiryQuery)->where(fn ($q) => $q->whereIn('contract_type_id', $nonKontrakIds)->orWhereIn('contract_type_parent_id', $nonKontrakIds))->count() : 0,
                'nda' => $ndaIds ? (clone $scopedExpiryQuery)->where(fn ($q) => $q->whereIn('contract_type_id', $ndaIds)->orWhereIn('contract_type_parent_id', $ndaIds))->count() : 0,
            ], $dynamicExpiryCounts);

            return [
                'parentCategoryCounts' => $parentCategoryCounts,
                'orgCategoryCounts' => $orgCategoryCounts,
                'mineCounts' => $mineCounts,
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

        return Inertia::render('contracts/show', $data);
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
        $userId = $request->query('user_id');
        $dashboardTypeId = $request->query('dashboard_type_id');

        $user = null;
        if (! empty($userId)) {
            $user = User::with(['roleRelation', 'division', 'department'])->find($userId);
        }

        if (! $user) {
            $user = $request->user();
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

    #[OA\Get(
        path: '/api/contracts/{id}',
        summary: 'Get contract details',
        tags: ['Contracts'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', description: 'Contract ID', required: true, schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Contract details'),
            new OA\Response(response: 404, description: 'Contract not found'),
        ],
    )]
    public function show(string $id): JsonResponse
    {
        $contract = $this->contractDetailQuery->find($id);

        // Authorization: Only Admin or Creator can view drafts
        if ($contract->status === 'draft' && $contract->created_by !== Auth::id() && Auth::user()?->role !== 'Admin') {
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

        $user = $request->user();
        $targetUserId = $request->query('user_id');

        if ($targetUserId) {
            $targetUser = User::find($targetUserId);
            if ($targetUser) {
                $user = $targetUser;
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

        return $this->successResponse($loaders['roles'](), 'Roles retrieved successfully');
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
                    'step_number' => $contract->workflow_step?->step ?? $contract->current_step_number,
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

        return DB::transaction(function () use ($contract) {
            // Delete from storage
            Storage::disk('local')->deleteDirectory("contracts/{$contract->id}");

            // Other relations are deleted by database cascade
            $contract->delete();

            return $this->successResponse(null, 'Kontrak berhasil dihapus.');
        });
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

            return $this->successResponse(['deleted_count' => $count], "{$count} kontrak berhasil dihapus.");
        });
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
