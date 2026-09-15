<?php

namespace App\Http\Controllers\Contract;

use App\Exports\ContractExport;
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
use App\Models\AccessModule;
use App\Models\Contract;
use App\Models\Role;
use App\Models\User;
use App\Services\ContractFilterScopeService;
use App\Services\Workflow\ContractWorkflowService;
use Illuminate\Http\JsonResponse;
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
            ->paginate($request->integer('per_page', 15))
            ->through(fn ($c) => ContractFormatter::formatContract($c, false));

        return response()->json($contracts);
    }

    /**
     * Generalized method for Inertia contract views
     */
    public function contractsView(Request $request, string $view = 'contracts'): Response
    {
        $loaders = $this->contractOptionsQuery->getLoaders();

        $contracts = in_array($view, ['dashboard', 'profile'])
            ? new LengthAwarePaginator([], 0, 15)
            : $this->contractListQuery
                ->build($request, $view)
                ->paginate($request->integer('per_page', 15))
                ->withQueryString()
                ->through(fn ($c) => ContractFormatter::formatContract($c, false));

        $counts = $this->getCachedContractCounts(Auth::id());
        $meta = $this->getViewMetadata($view);

        $data = array_merge([
            'currentView' => $view,
            'contracts' => $contracts,
            'types' => $loaders['types'](),
            'submissionTypes' => $loaders['submissionTypes'](),
            'users' => $loaders['users'](),
            'vendors' => $loaders['vendors'](),
            'formTemplates' => $loaders['formTemplates'](),
            'departments' => $loaders['departments'](),
            'divisions' => $loaders['divisions'](),
            'roles' => $loaders['roles'](),
            'regions' => $loaders['regions'](),
            'locations' => $loaders['locations'](),
            'companyGroups' => $loaders['companyGroups'](),
            'companies' => $loaders['companies'](),
            'organizationTree' => ContractFilterScopeService::buildOrganizationTree(
                $loaders['companyGroups'](),
                $loaders['regions'](),
                $loaders['companies']()
            ),
            'contractStatuses' => $loaders['contractStatuses'](),
            'filters' => array_merge($request->only([
                'search', 'status', 'contract_type_id', 'role_id', 'department_id',
                'created_from', 'created_to', 'region_ids', 'vendor_ids', 'statuses',
                'contract_type_ids', 'pic_ids', 'department_ids', 'submission_type_id',
                'period', 'company_group_ids', 'company_ids',
                'company_group_id', 'region_id', 'company_id', 'division_id', 'mine_tab', 'contract_tab', 'parent_tab', 'pending_tab', 'expiry_tab',
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
            $kontrakParent = $roots->first(fn ($p) => strtoupper($p->code) === 'A-1' || (stripos($p->name, 'non') === false && stripos($p->name, 'kontrak') !== false));
            $nonKontrakParent = $roots->first(fn ($p) => strtoupper($p->code) === 'A-2' || stripos($p->name, 'non') !== false);
            $ndaParent = $roots->first(fn ($p) => strtoupper($p->code) === 'NDA' || stripos($p->name, 'nda') !== false || stripos($p->name, 'kerahasiaan') !== false);

            $kontrakIds = $getDescendantIds($kontrakParent?->id);
            $nonKontrakIds = $getDescendantIds($nonKontrakParent?->id);
            $ndaIds = $getDescendantIds($ndaParent?->id);

            // Scoped base query respecting user organization permissions
            $scopedAllQuery = $this->contractListQuery->build(new Request(), 'all');
            $activeContractsQuery = (clone $scopedAllQuery)->whereRaw('UPPER(status) != ?', ['ARCHIVED'])->whereNull('closed_at');

            $parentCategoryCounts = [
                'all' => (clone $activeContractsQuery)->count(),
                'kontrak' => (clone $activeContractsQuery)->where(fn ($q) => $q->whereIn('contract_type_id', $kontrakIds)->orWhereIn('contract_type_parent_id', $kontrakIds))->count(),
                'non_kontrak' => (clone $activeContractsQuery)->where(fn ($q) => $q->whereIn('contract_type_id', $nonKontrakIds)->orWhereIn('contract_type_parent_id', $nonKontrakIds))->count(),
                'nda' => (clone $activeContractsQuery)->where(fn ($q) => $q->whereIn('contract_type_id', $ndaIds)->orWhereIn('contract_type_parent_id', $ndaIds))->count(),
                'in_progress' => (clone $scopedAllQuery)->whereIn('status', ['in_review', 'pending', 'locked'])->whereNull('closed_at')->count(),
                'archived' => (clone $scopedAllQuery)->where(fn ($q) => $q->whereRaw('UPPER(status) = ?', ['ARCHIVED'])->orWhereNotNull('closed_at'))->count(),
            ];

            $myBaseQuery = DB::table('t_contracts')
                ->whereNull('deleted_at')
                ->where(function ($q) use ($userId) {
                    $q->where('created_by', $userId)
                        ->orWhere('initiated_by_id', $userId);
                });
            $myActiveQuery = (clone $myBaseQuery)->whereRaw('UPPER(status) != ?', ['ARCHIVED'])->whereNull('closed_at');

            $mineCounts = [
                'all' => (clone $myActiveQuery)->count(),
                'kontrak' => (clone $myActiveQuery)->where(fn ($q) => $q->whereIn('contract_type_id', $kontrakIds)->orWhereIn('contract_type_parent_id', $kontrakIds))->count(),
                'non_kontrak' => (clone $myActiveQuery)->where(fn ($q) => $q->whereIn('contract_type_id', $nonKontrakIds)->orWhereIn('contract_type_parent_id', $nonKontrakIds))->count(),
                'nda' => (clone $myActiveQuery)->where(fn ($q) => $q->whereIn('contract_type_id', $ndaIds)->orWhereIn('contract_type_parent_id', $ndaIds))->count(),
                'in_progress' => (clone $myBaseQuery)->whereIn('status', ['in_review', 'pending', 'locked'])->whereNull('closed_at')->count(),
                'archived' => (clone $myBaseQuery)->where(fn ($q) => $q->whereRaw('UPPER(status) = ?', ['ARCHIVED'])->orWhereNotNull('closed_at'))->count(),
            ];

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
            $expiryCategoryCounts = [
                'all' => (clone $scopedExpiryQuery)->count(),
                'kontrak' => (clone $scopedExpiryQuery)->where(fn ($q) => $q->whereIn('contract_type_id', $kontrakIds)->orWhereIn('contract_type_parent_id', $kontrakIds))->count(),
                'non_kontrak' => (clone $scopedExpiryQuery)->where(fn ($q) => $q->whereIn('contract_type_id', $nonKontrakIds)->orWhereIn('contract_type_parent_id', $nonKontrakIds))->count(),
                'nda' => (clone $scopedExpiryQuery)->where(fn ($q) => $q->whereIn('contract_type_id', $ndaIds)->orWhereIn('contract_type_parent_id', $ndaIds))->count(),
            ];

            return [
                'parentCategoryCounts' => $parentCategoryCounts,
                'mineCounts' => $mineCounts,
                'pendingCounts' => $pendingCounts,
                'expiryCategoryCounts' => $expiryCategoryCounts,
            ];
        });
    }

    public function showView(Request $request, string $id): Response
    {
        $contract = $this->contractDetailQuery->find($id);

        Gate::authorize('view', $contract);

        $loaders = $this->contractOptionsQuery->getLoaders();

        $contracts = $this->contractListQuery
            ->build($request, 'contracts')
            ->paginate($request->integer('per_page', 15))
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
                'per_page' => $request->integer('per_page', 15),
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

        return response()->json($loaders['types']());
    }

    public function getSubmissionTypes(): JsonResponse
    {
        $loaders = $this->contractOptionsQuery->getLoaders();

        return response()->json($loaders['submissionTypes']());
    }

    public function getDashboardMetrics(Request $request): JsonResponse
    {
        return response()->json((new ContractDashboardQuery)->getMetrics($request));
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
        if ($contract->status === 'draft' && $contract->created_by !== Auth::id() && Auth::user()->role !== 'Admin') {
            abort(403, 'Halaman tidak tersedia');
        }

        return response()->json(ContractFormatter::formatContract($contract));
    }

    public function getWorkflows(Request $request): JsonResponse
    {
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

        return response()->json($users);
    }

    public function getRoles(): JsonResponse
    {
        $loaders = $this->contractOptionsQuery->getLoaders();

        return response()->json($loaders['roles']());
    }

    #[OA\Post(
        path: '/api/contracts',
        summary: 'Create a new contract',
        tags: ['Contracts'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'title', type: 'string'),
                    new OA\Property(property: 'contract_type_id', type: 'string'),
                    new OA\Property(property: 'submission_type_id', type: 'string'),
                    new OA\Property(property: 'vendor_id', type: 'string'),
                ],
            ),
        ),
        responses: [
            new OA\Response(response: 201, description: 'Contract created'),
            new OA\Response(response: 422, description: 'Validation error'),
        ],
    )]
    public function store(StoreContractRequest $request): JsonResponse
    {
        $contract = $this->storeAction->execute($request->validated());

        return response()->json(ContractFormatter::formatContract($contract), 201);
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

        return response()->json(ContractFormatter::formatContract($contract->fresh()));
    }

    public function destroy(string $id): JsonResponse
    {
        $contract = $this->contractDetailQuery->find($id);

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
        if (! $this->checkBulkPermission('can_bulk_delete')) {
            return response()->json(['message' => 'Anda tidak memiliki izin untuk aksi massal ini.'], 403);
        }

        $ids = $request->input('ids');
        if (empty($ids)) {
            return response()->json(['message' => 'Tidak ada kontrak yang dipilih.'], 422);
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

            return response()->json(['message' => "$count kontrak berhasil dihapus."]);
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
