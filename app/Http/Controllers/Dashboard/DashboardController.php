<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Queries\Contract\ContractDashboardQuery;
use App\Http\Queries\Contract\ContractOptionsQuery;
use App\Models\Master\Authority;
use App\Models\Master\DashboardType;
use App\Models\Master\User;
use App\Services\ContractFilterScopeService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    use ApiResponse;

    public function __construct(
        private ContractOptionsQuery $contractOptionsQuery,
        private ContractDashboardQuery $contractDashboardQuery,
    ) {}

    /**
     * Render the Inertia dashboard view with tab-specific metrics.
     */
    public function index(Request $request, ?string $tab = null): Response
    {
        $rawTab = $tab ?? $request->query('tab') ?? $request->query('dashboard_tab') ?? 'overview';

        $tabMapping = [
            'ringkasan' => 'overview',
            'overview' => 'overview',
            'ringkasan-kontrak' => 'overview_contract',
            'kontrak' => 'overview_contract',
            'ringkasan-non-kontrak' => 'overview_non_contract',
            'non-kontrak' => 'overview_non_contract',
            'ringkasan-nda' => 'overview_nda',
            'nda' => 'overview_nda',
            'beban-kerja' => 'workload',
            'workload' => 'workload',
            'master-data' => 'master_data',
            'masterdata' => 'master_data',
        ];

        $resolvedTab = $tabMapping[strtolower($rawTab)] ?? $rawTab;

        $loaders = $this->contractOptionsQuery->getLoaders();
        $user = Auth::user();

        // ponytail: metrics computed directly so page renders immediately with no loading screen
        $metrics = $this->contractDashboardQuery->getMetrics($request, $resolvedTab);
        $dashboardConfig = $this->contractDashboardQuery->resolveDashboardConfig($user);

        return Inertia::render('dashboard/Index', [
            'currentView' => 'dashboard',
            'currentDashboardTab' => $resolvedTab,
            'metrics' => $metrics,
            'dashboardConfig' => $dashboardConfig,
            'userFilterSettings' => $user?->getContractFilterSettings() ?? [],
            'filters' => $request->only([
                'type_id', 'submission_type_id', 'department_id', 'division_id',
                'role_id', 'region_id', 'location_id', 'company_group_id',
                'company_id', 'vendor_id', 'status', 'start_date', 'end_date',
                'created_from', 'created_to',
            ]),
            'types' => Inertia::defer(fn () => $loaders['types']()),
            'submissionTypes' => Inertia::defer(fn () => $loaders['submissionTypes']()),
            'users' => Inertia::defer(fn () => $loaders['users']()),
            'vendors' => Inertia::defer(fn () => $loaders['vendors']()),
            'formTemplates' => Inertia::defer(fn () => $loaders['formTemplates']()),
            'departments' => Inertia::defer(fn () => $loaders['departments']()),
            'divisions' => Inertia::defer(fn () => $loaders['divisions']()),
            'roles' => Inertia::defer(fn () => $loaders['roles']()),
            'regions' => Inertia::defer(fn () => $loaders['regions']()),
            'locations' => Inertia::defer(fn () => $loaders['locations']()),
            'companyGroups' => Inertia::defer(fn () => $loaders['companyGroups']()),
            'companies' => Inertia::defer(fn () => $loaders['companies']()),
            'organizationTree' => Inertia::defer(fn () => ContractFilterScopeService::buildOrganizationTree(
                $loaders['companyGroups'](),
                $loaders['regions'](),
                $loaders['companies']()
            )),
            'contractStatuses' => Inertia::defer(fn () => $loaders['contractStatuses']()),
        ]);
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
        return $this->successResponse($this->contractDashboardQuery->getMetrics($request), 'Dashboard metrics retrieved successfully');
    }

    public function getDashboardSummary(Request $request): JsonResponse
    {
        return $this->successResponse($this->contractDashboardQuery->getSummaryMetrics($request), 'Dashboard summary retrieved successfully');
    }

    public function getDashboardOverview(Request $request): JsonResponse
    {
        return $this->successResponse($this->contractDashboardQuery->getOverviewMetrics($request), 'Dashboard overview retrieved successfully');
    }

    public function getDashboardDistributions(Request $request): JsonResponse
    {
        return $this->successResponse($this->contractDashboardQuery->getDistributions($request), 'Dashboard distributions retrieved successfully');
    }

    public function getDashboardTrends(Request $request): JsonResponse
    {
        return $this->successResponse($this->contractDashboardQuery->getTrends($request), 'Dashboard trends retrieved successfully');
    }

    public function getDashboardAnalysis(Request $request): JsonResponse
    {
        return $this->successResponse($this->contractDashboardQuery->getAnalysis($request), 'Dashboard analysis retrieved successfully');
    }

    public function getDashboardWorkload(Request $request): JsonResponse
    {
        return $this->successResponse($this->contractDashboardQuery->getWorkloads($request), 'Dashboard workload retrieved successfully');
    }

    public function getDashboardMasterData(Request $request): JsonResponse
    {
        return $this->successResponse($this->contractDashboardQuery->getMasterData($request), 'Dashboard master data retrieved successfully');
    }

    public function getDashboardRecentActivity(Request $request): JsonResponse
    {
        return $this->successResponse($this->contractDashboardQuery->getRecentActivityMetrics($request), 'Dashboard recent activity retrieved successfully');
    }
}
