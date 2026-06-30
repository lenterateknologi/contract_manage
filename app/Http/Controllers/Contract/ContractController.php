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
use App\Services\Workflow\ContractWorkflowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
            ->paginate($request->integer('per_page', 10))
            ->through(fn ($c) => ContractFormatter::formatContract($c, false));

        return response()->json($contracts);
    }

    /**
     * Generalized method for Inertia contract views
     */
    public function contractsView(Request $request, string $view = 'contracts'): Response
    {
        $loaders = $this->contractOptionsQuery->getLoaders();

        $contracts = $this->contractListQuery
            ->build($request, $view)
            ->paginate($request->integer('per_page', 10))
            ->withQueryString()
            ->through(fn ($c) => ContractFormatter::formatContract($c, false));

        $data = [
            'currentView' => $view,
            'contracts' => $contracts,
            'types' => $loaders['types'](),
            'submissionTypes' => $loaders['submissionTypes'](),
            'users' => Inertia::defer($loaders['users']),
            'vendors' => Inertia::defer($loaders['vendors']),
            'formTemplates' => Inertia::defer($loaders['formTemplates']),
            'departments' => Inertia::defer($loaders['departments']),
            'roles' => Inertia::defer($loaders['roles']),
            'regions' => Inertia::defer($loaders['regions']),
            'companyGroups' => Inertia::defer($loaders['companyGroups']),
            'companies' => Inertia::defer($loaders['companies']),
            'contractStatuses' => Inertia::defer($loaders['contractStatuses']),
            'filters' => array_merge($request->only([
                'search', 'status', 'contract_type_id', 'role_id', 'department_id',
                'created_from', 'created_to', 'region_ids', 'vendor_ids', 'statuses',
                'contract_type_ids', 'pic_ids', 'department_ids', 'submission_type_id',
                'period', 'company_group_ids', 'company_ids',
            ]), [
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
            $data['metrics'] = Inertia::defer(fn () => (new ContractDashboardQuery)->getMetrics($request));
        }

        $data['breadcrumbs'] = [
            ['title' => 'Manajemen Kontrak', 'href' => route('contracts'), 'icon' => 'FileText'],
            ['title' => $viewTitle, 'href' => '#', 'description' => $viewDesc, 'icon' => $viewIcon],
        ];

        return Inertia::render('contracts/Index', $data);
    }

    public function showView(Request $request, string $id): Response
    {
        $contract = $this->contractDetailQuery->find($id);

        Gate::authorize('view', $contract);

        $loaders = $this->contractOptionsQuery->getLoaders();

        $contracts = $this->contractListQuery
            ->build($request, 'contracts')
            ->paginate($request->integer('per_page', 10))
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
                'per_page' => $request->integer('per_page', 10),
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

        if ($targetUserId && ($user->role === 'Admin' || ($user->department && str_contains(strtolower($user->department->name), 'legal')) || str_contains(strtolower($user->role), 'legal'))) {
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
