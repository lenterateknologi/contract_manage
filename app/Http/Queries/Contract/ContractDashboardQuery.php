<?php

namespace App\Http\Queries\Contract;

use App\Enums\ContractStatusEnum;
use App\Http\Formatters\ContractFormatter;
use App\Models\Approval;
use App\Models\Company;
use App\Models\CompanyGroup;
use App\Models\ContractType;
use App\Models\DashboardType;
use App\Models\Department;
use App\Models\Division;
use App\Models\SubmissionType;
use App\Models\User;
use App\Models\Vendor;
use App\Services\ContractFilterScopeService;
use Carbon\Carbon;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ContractDashboardQuery
{
    /**
     * Get all dashboard metrics for the given request context.
     *
     * @return array<string, mixed>
     */
    public function getMetrics(Request $request): array
    {
        $user = Auth::user();
        if ($user) {
            (new ContractFilterScopeService)->applyToRequest($request, $user);
        }

        $roleName = $user->role;
        $hasFullAccess = in_array($roleName, ['Admin', 'Super Admin', 'Director', 'CEO', 'VP']);
        $isAdmin = $hasFullAccess;
        $isManager = $roleName === 'Manager';
        $hasDepartmentAccess = ! $hasFullAccess && ! $isManager;

        [$createdFrom, $createdTo, $period] = $this->resolveDateRange($request);

        $cleanFn = fn ($id) => preg_replace('/^(g|r|c)_/', '', trim($id));
        $regionIds = array_values(array_map($cleanFn, $this->normalizeArray($request->input('region_ids', $request->input('region_id', [])))));
        $companyGroupIds = array_values(array_map($cleanFn, $this->normalizeArray($request->input('company_group_ids', $request->input('company_group_id', [])))));
        $companyIds = array_values(array_map($cleanFn, $this->normalizeArray($request->input('company_ids', $request->input('company_id', [])))));
        $vendorIds = $this->normalizeArray($request->input('vendor_ids', []));
        $statuses = $this->normalizeArray($request->input('statuses', []));
        $contractTypeIds = $this->normalizeArray($request->input('contract_type_ids', []));
        $picIds = $this->normalizeArray($request->input('pic_ids', []));
        $departmentIds = $this->normalizeArray($request->input('department_ids', $request->input('department_id', [])));

        // ponytail: Query against the materialized view for maximum speed
        $baseQuery = $this->buildBaseQuery(
            $user,
            $hasFullAccess,
            $isManager,
            $hasDepartmentAccess,
            $createdFrom,
            $createdTo,
            $statuses,
            $contractTypeIds,
            $vendorIds,
            $picIds,
            $departmentIds,
            $regionIds,
            $companyGroupIds,
            $companyIds,
        );

        // KPI Cards
        $totalContracts = (clone $baseQuery)->whereRaw("UPPER(status) != 'ARCHIVED'")->count();
        $myTotalContracts = DB::table('t_contracts')
            ->where('created_by', Auth::id())
            ->whereNull('deleted_at')
            ->where('status', '!=', 'draft')
            ->count();
        $archivedTotalContracts = (clone $baseQuery)
            ->where('status', 'archived')
            ->count();
        $inProcessContracts = (clone $baseQuery)
            ->whereIn('status', array_map(fn ($s) => $s->value, ContractStatusEnum::inProcess()))
            ->count();
        $pendingApprovalsForMe = Approval::where('user_id', Auth::id())
            ->where('status', 'pending')
            ->whereHas('contract', function ($q) use ($statuses, $contractTypeIds) {
                if (! empty($statuses)) {
                    $q->whereIn('status', $statuses);
                } else {
                    $q->where('status', '!=', ContractStatusEnum::Draft->value);
                }
                if (! empty($contractTypeIds)) {
                    $q->whereIn('contract_type_id', $contractTypeIds);
                }
            })->count();
        $activeContracts = (clone $baseQuery)
            ->where('status', ContractStatusEnum::Approved->value)
            ->where(fn (QueryBuilder $q) => $q->whereNull('end_date')->orWhereDate('end_date', '>=', now()->toDateString()))
            ->count();
        $expiringSoonContracts = (clone $baseQuery)
            ->where('status', ContractStatusEnum::Approved->value)
            ->whereNotNull('end_date')
            ->whereDate('end_date', '>=', now()->toDateString())
            ->whereDate('end_date', '<=', now()->addDays(30)->toDateString())
            ->count();
        $expiredContracts = (clone $baseQuery)
            ->where('status', ContractStatusEnum::Approved->value)
            ->whereNotNull('end_date')
            ->whereDate('end_date', '<', now()->toDateString())
            ->count();
        $renewedContractsCount = (clone $baseQuery)->whereNotNull('parent_id')->count();
        $renewalRate = ($expiredContracts + $renewedContractsCount) > 0
            ? round(($renewedContractsCount / ($expiredContracts + $renewedContractsCount)) * 100, 1)
            : 0;

        // Total contract value
        $totalValue = 0;
        $prices = (clone $baseQuery)->pluck('f2_price');
        foreach ($prices as $price) {
            $totalValue += ContractFormatter::parsePrice($price);
        }

        // Average approval cycle time
        $approvedContracts = (clone $baseQuery)
            ->where('status', ContractStatusEnum::Approved->value)
            ->orderByDesc('updated_at')
            ->limit(50)
            ->get(['id', 'updated_at']);
        $avgDays = 0;
        if ($approvedContracts->count() > 0) {
            $contractIds = $approvedContracts->pluck('id');
            $firstApprovals = Approval::whereIn('contract_id', $contractIds)
                ->select('contract_id', DB::raw('MIN(created_at) as first_sent_at'))
                ->groupBy('contract_id')
                ->pluck('first_sent_at', 'contract_id')
                ->all();
            $totalDays = $approvedContracts->sum(function ($c) use ($firstApprovals): float {
                $firstSentAt = $firstApprovals[$c->id] ?? null;

                return $firstSentAt ? Carbon::parse($firstSentAt)->diffInHours($c->updated_at) / 24 : 0;
            });
            $avgDays = round($totalDays / $approvedContracts->count(), 1);
        }

        // Distributions
        $submissionTypeDistribution = $this->getSubmissionTypeDistribution($baseQuery);
        $contractTypeDistribution = $this->getContractTypeDistribution($baseQuery);
        $statusDistribution = $this->getStatusDistribution($baseQuery);
        $expiryTimeline = $this->getExpiryTimeline($baseQuery);
        $approvalStatusCounts = [
            'approved' => (clone $baseQuery)->where('status', ContractStatusEnum::Approved->value)->count(),
            'pending' => $inProcessContracts,
            'revision' => (clone $baseQuery)->where('status', ContractStatusEnum::Revision->value)->count(),
            'rejected' => (clone $baseQuery)->where('status', ContractStatusEnum::Rejected->value)->count(),
        ];

        // Lists
        $recentContracts = $this->getRecentContracts($baseQuery);
        $upcomingRenewals = $this->getUpcomingRenewals($baseQuery);
        $pendingApprovalsList = $this->getPendingApprovalsList();
        $recentActivity = $this->getRecentActivity($user, $isAdmin);

        // Trends
        $monthlyTrend = $this->getMonthlyTrend($baseQuery);
        $renewalVsExpiredTrend = $this->getRenewalVsExpiredTrend($baseQuery);
        $monthlyApprovalTrend = $this->getMonthlyApprovalTrend($baseQuery);
        $topVendors = $this->getTopVendors($baseQuery);
        $categoryTrend = $this->getCategoryTrend($baseQuery);

        // Analysis
        $expiryRiskHeatmap = $this->getExpiryRiskHeatmap($baseQuery);
        // ponytail: Query materialized view directly to get id and parent_id of all active contracts
        $renewedIds = DB::table('mv_dashboard_contracts')
            ->whereNotNull('parent_id')
            ->pluck('parent_id')
            ->all();
        $renewalFailureByCategory = $this->getRenewalFailureByCategory($baseQuery, $renewedIds);
        $vendorPerformance = $this->getVendorPerformance($baseQuery, $renewedIds);
        $valueDistribution = $this->getValueDistribution($baseQuery);
        $budgetAllocation = $this->getBudgetAllocation($baseQuery);
        $approvalDurationByDept = $this->getApprovalDurationByDept($baseQuery);

        // Workload
        [$startOfMonth, $endOfMonth] = $this->resolveWorkloadPeriod($createdFrom, $createdTo);

        // ponytail: Pre-load active/pending workload counts to prevent N+1 queries in loop
        $activeCounts = DB::table('mv_dashboard_contracts')
            ->whereIn('status', [ContractStatusEnum::InReview->value, ContractStatusEnum::Revision->value])
            ->select('assigned_pic_id', DB::raw('count(*) as count'))
            ->groupBy('assigned_pic_id')
            ->pluck('count', 'assigned_pic_id');

        $pendingCounts = DB::table('t_approvals')
            ->where('status', 'pending')
            ->select('user_id', DB::raw('count(*) as count'))
            ->groupBy('user_id')
            ->pluck('count', 'user_id');

        $initiatedCounts = DB::table('mv_dashboard_contracts')
            ->select(DB::raw('COALESCE(initiated_by_id, created_by) as user_id'), DB::raw('count(*) as count'))
            ->groupBy('user_id')
            ->pluck('count', 'user_id');

        $pendingThisMonth = DB::table('t_approvals')
            ->where('status', 'pending')
            ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->select('user_id', DB::raw('count(*) as count'))
            ->groupBy('user_id')
            ->pluck('count', 'user_id');

        $activeThisMonth = DB::table('mv_dashboard_contracts')
            ->whereIn('status', [ContractStatusEnum::InReview->value, ContractStatusEnum::Revision->value])
            ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->select('assigned_pic_id', DB::raw('count(*) as count'))
            ->groupBy('assigned_pic_id')
            ->pluck('count', 'assigned_pic_id');

        $completedApprovalsThisMonth = DB::table('t_approvals')
            ->where('status', 'approved')
            ->whereBetween('updated_at', [$startOfMonth, $endOfMonth])
            ->select('user_id', DB::raw('count(*) as count'))
            ->groupBy('user_id')
            ->pluck('count', 'user_id');

        $completedContractsThisMonth = DB::table('mv_dashboard_contracts')
            ->whereIn('status', ['approved', 'active', 'archived'])
            ->whereBetween('updated_at', [$startOfMonth, $endOfMonth])
            ->select('assigned_pic_id', DB::raw('count(*) as count'))
            ->groupBy('assigned_pic_id')
            ->pluck('count', 'assigned_pic_id');

        $userWorkloads = $this->getUserWorkloads(
            $user, $hasFullAccess, $isManager, $hasDepartmentAccess,
            $startOfMonth, $endOfMonth,
            $regionIds, $companyGroupIds, $companyIds, $departmentIds,
            $activeCounts, $pendingCounts, $initiatedCounts,
            $pendingThisMonth, $activeThisMonth, $completedApprovalsThisMonth, $completedContractsThisMonth
        );

        $departmentWorkload = $this->getDepartmentWorkload($activeCounts, $pendingCounts);
        $categoryTraffic = $this->getCategoryTraffic($baseQuery);
        $departmentTraffic = $this->getDepartmentTraffic($baseQuery);

        $totalRenewed = (clone $baseQuery)->whereNotNull('parent_id')->count();
        $renewalCompletionRate = $expiredContracts > 0
            ? round(($totalRenewed / $expiredContracts) * 100, 1)
            : 100;

        $todayStr = now()->toDateString();
        $todayContracts = (clone $baseQuery)->whereDate('created_at', $todayStr)->get(['status']);
        $todayUpdatedContracts = (clone $baseQuery)->whereDate('updated_at', $todayStr)->get(['status']);

        $todayTotal = $todayContracts->count();
        $todayInProcess = $todayContracts->whereIn('status', [
            'draft', 'in_review', 'pending', 'revision',
        ])->count();
        $todayCompleted = $todayUpdatedContracts->whereIn('status', [
            'approved', 'locked',
        ])->count();
        $todayRejected = $todayUpdatedContracts->where('status', 'rejected')->count();
        $todayApproved = $todayUpdatedContracts->where('status', 'approved')->count();

        // Resolve matching dashboard type configuration:
        // 1. Direct role relation dashboard_type_id
        // 2. Matching rules from m_dashboard_types table
        $dashboardConfig = null;
        if ($user && $user->role_id) {
            $userRole = $user->roleRelation;
            if ($userRole && $userRole->dashboard_type_id) {
                $dashboardConfig = DashboardType::find($userRole->dashboard_type_id);
            }
        }

        if (! $dashboardConfig) {
            $dashboardConfig = DashboardType::all()->filter(function ($dt) use ($user) {
                $rawRoles = $dt->role_ids ?? $dt->getAttributeFromArray('role_ids');
                $roleIds = DashboardType::normalizeIds($rawRoles);
                if ($rawRoles === null && ! empty($dt->role_id)) {
                    $roleIds = [$dt->role_id];
                }

                $rawDivisions = $dt->division_ids ?? $dt->getAttributeFromArray('division_ids');
                $divisionIds = DashboardType::normalizeIds($rawDivisions);
                if ($rawDivisions === null && ! empty($dt->division_id)) {
                    $divisionIds = [$dt->division_id];
                }

                $rawDepartments = $dt->department_ids ?? $dt->getAttributeFromArray('department_ids');
                $departmentIds = DashboardType::normalizeIds($rawDepartments);
                if ($rawDepartments === null && ! empty($dt->department_id)) {
                    $departmentIds = [$dt->department_id];
                }

                $roleMatch = empty($roleIds) || in_array((string) $user->role_id, array_map('strval', $roleIds));
                $divisionMatch = empty($divisionIds) || in_array((string) $user->division_id, array_map('strval', $divisionIds));
                $departmentMatch = empty($departmentIds) || in_array((string) $user->department_id, array_map('strval', $departmentIds));

                return $roleMatch && $divisionMatch && $departmentMatch;
            })->sortByDesc(function ($dt) {
                $rawRoles = $dt->role_ids ?? $dt->getAttributeFromArray('role_ids');
                $roleIds = DashboardType::normalizeIds($rawRoles);
                if ($rawRoles === null && ! empty($dt->role_id)) {
                    $roleIds = [$dt->role_id];
                }

                $rawDivisions = $dt->division_ids ?? $dt->getAttributeFromArray('division_ids');
                $divisionIds = DashboardType::normalizeIds($rawDivisions);
                if ($rawDivisions === null && ! empty($dt->division_id)) {
                    $divisionIds = [$dt->division_id];
                }

                $rawDepartments = $dt->department_ids ?? $dt->getAttributeFromArray('department_ids');
                $departmentIds = DashboardType::normalizeIds($rawDepartments);
                if ($rawDepartments === null && ! empty($dt->department_id)) {
                    $departmentIds = [$dt->department_id];
                }

                $score = 0;
                if (! empty($roleIds)) $score += 4;
                if (! empty($divisionIds)) $score += 2;
                if (! empty($departmentIds)) $score += 1;

                return $score;
            })->first();
        }

        return [
            'dashboardConfig' => [
                'has_setting' => (bool) $dashboardConfig,
                'name' => $dashboardConfig ? $dashboardConfig->name : null,
                'show_overview' => $dashboardConfig ? (bool) $dashboardConfig->show_overview : false,
                'show_workload' => $dashboardConfig ? (bool) $dashboardConfig->show_workload : false,
                'show_master_data' => $dashboardConfig ? (bool) $dashboardConfig->show_master_data : false,
            ],
            'metrics' => [
                'totalContracts' => $totalContracts,
                'activeContracts' => $activeContracts,
                'expiringContracts' => $expiringSoonContracts,
                'expiredContracts' => $expiredContracts,
                'pendingContracts' => $inProcessContracts,
                'pendingApprovals' => $pendingApprovalsForMe,
                'renewalRate' => $renewalRate,
                'totalValue' => $totalValue,
                'avgCycleTime' => $avgDays,
            ],
            'summary' => [
                'total' => $todayTotal,
                'my_total' => $myTotalContracts,
                'archived_total' => $archivedTotalContracts,
                'in_process' => $inProcessContracts,
                'pending_for_me' => $pendingApprovalsForMe,
                'completed' => $todayCompleted,
                'rejected' => $todayRejected,
                'approved' => $todayApproved,
            ],
            'activePeriod' => $period,
            'submissionTypeDistribution' => $submissionTypeDistribution,
            'contractTypeDistribution' => $contractTypeDistribution,
            'statusDistribution' => $statusDistribution,
            'expiryTimeline' => $expiryTimeline,
            'approvalStatusCounts' => $approvalStatusCounts,
            'recentContracts' => $recentContracts,
            'upcomingRenewals' => $upcomingRenewals,
            'pendingApprovalsList' => $pendingApprovalsList,
            'recentActivity' => $recentActivity,
            'monthlyTrend' => $monthlyTrend,
            'renewalVsExpiredTrend' => $renewalVsExpiredTrend,
            'monthlyApprovalTrend' => $monthlyApprovalTrend,
            'topVendors' => $topVendors,
            'categoryTrend' => $categoryTrend,
            'expiryRiskHeatmap' => $expiryRiskHeatmap,
            'renewalFailureByCategory' => $renewalFailureByCategory,
            'vendorPerformance' => $vendorPerformance,
            'valueDistribution' => $valueDistribution,
            'budgetAllocation' => $budgetAllocation,
            'approvalDurationByDept' => $approvalDurationByDept,
            'userWorkloads' => $userWorkloads,
            'departmentWorkload' => $departmentWorkload,
            'categoryTraffic' => $categoryTraffic,
            'renewalCompletionRate' => $renewalCompletionRate,
            'departmentTraffic' => $departmentTraffic,
            'dailyTrend' => $this->getDailyTrend($baseQuery),
            'overviewDailyTrend' => $this->getOverviewDailyTrend($baseQuery),
            'masterDataCounts' => $this->getScopedMasterDataCounts($user, $hasFullAccess),
        ];
    }

    private function getScopedMasterDataCounts(User $user, bool $hasFullAccess): array
    {
        $settings = $user->getContractFilterSettings();
        $groupFull = $hasFullAccess || ($settings['can_change_company_group'] ?? false);
        $companyGroupIds = $groupFull ? null : (array_filter([$user->company_group_id], fn ($v) => ! empty($v)));

        // ponytail: filter master data yang is_used = true
        $userQuery = User::query()->where('is_used', true);
        $groupQuery = CompanyGroup::query()->where('is_used', true);
        $companyQuery = Company::query()->where('is_used', true);
        $deptQuery = Department::query()->where('is_used', true);
        $divQuery = Division::query();

        if (! empty($companyGroupIds)) {
            $userQuery->whereIn('company_group_id', $companyGroupIds);
            $groupQuery->whereIn('id', $companyGroupIds);
            $companyQuery->whereIn('company_group_id', $companyGroupIds);

            // ponytail: filter department & divisi berdasarkan company yang ada dalam company_group user
            $deptQuery->whereHas('company', fn ($q) => $q->whereIn('company_group_id', $companyGroupIds));
            $divQuery->whereIn('id', function ($q) use ($companyGroupIds) {
                $q->select('division_id')->from('m_users')->whereIn('company_group_id', $companyGroupIds)->whereNotNull('division_id');
            });
        }

        // ponytail: tambahkan statistik distribusi jumlah user per group dan per company (hanya user is_used = true)
        $usersByGroupQuery = DB::table('m_users as u')
            ->leftJoin('m_company_groups as cg', 'u.company_group_id', '=', 'cg.id')
            ->select(
                DB::raw("COALESCE(cg.name, 'Tanpa Group') as name"),
                DB::raw('count(u.id) as user_count')
            )
            ->where('u.is_used', true)
            ->whereNull('u.deleted_at')
            ->groupBy('cg.name', 'cg.id');

        $usersByCompanyQuery = DB::table('m_users as u')
            ->leftJoin('m_companies as c', 'u.company_id', '=', 'c.id')
            ->leftJoin('m_company_groups as cg', 'u.company_group_id', '=', 'cg.id')
            ->select(
                DB::raw("COALESCE(c.name, 'Tanpa Perusahaan') as company_name"),
                DB::raw("COALESCE(cg.name, '-') as group_name"),
                DB::raw('count(u.id) as user_count')
            )
            ->where('u.is_used', true)
            ->whereNull('u.deleted_at')
            ->groupBy('c.name', 'c.id', 'cg.name');

        if (! empty($companyGroupIds)) {
            $usersByGroupQuery->whereIn('u.company_group_id', $companyGroupIds);
            $usersByCompanyQuery->whereIn('u.company_group_id', $companyGroupIds);
        }

        $usersByGroup = $usersByGroupQuery->orderByDesc('user_count')->get();
        $usersByCompany = $usersByCompanyQuery->orderByDesc('user_count')->get();

        return [
            'users' => $userQuery->count(),
            'companyGroups' => $groupQuery->count(),
            'companies' => $companyQuery->count(),
            'departments' => $deptQuery->count(),
            'divisions' => $divQuery->count(),
            'vendors' => Vendor::count(),
            'organizationTree' => $this->getOrganizationTree($companyGroupIds),
            'usersByGroup' => $usersByGroup,
            'usersByCompany' => $usersByCompany,
        ];
    }

    private function getOrganizationTree(?array $companyGroupIds = null)
    {
        // ponytail: ambil group, company, dan region yang is_used = true
        $groupQuery = CompanyGroup::where('is_used', true)
            ->with(['companies' => function ($q) {
                $q->where('is_used', true)->with(['region' => fn ($r) => $r->where('is_used', true)]);
            }]);

        if (! empty($companyGroupIds)) {
            $groupQuery->whereIn('id', $companyGroupIds);
        }
        $groups = $groupQuery->get();

        $tree = [];
        foreach ($groups as $group) {
            $groupNode = [
                'id' => 'g_'.$group->id,
                'name' => $group->name,
                'code' => $group->code,
                'type' => 'Group',
                'children' => [],
            ];

            $companiesByRegion = $group->companies->groupBy('region_id');
            foreach ($companiesByRegion as $regionId => $companies) {
                if (! $regionId) {
                    $regionName = 'No Region';
                    $regionCode = '-';
                    $rId = 'null';
                } else {
                    $region = $companies->first()->region;
                    $regionName = $region ? $region->name : 'Unknown Region';
                    $regionCode = $region ? $region->code : '-';
                    $rId = $regionId;
                }

                $regionNode = [
                    'id' => 'r_'.$rId.'_g_'.$group->id,
                    'name' => $regionName,
                    'code' => $regionCode,
                    'type' => 'Region',
                    'children' => [],
                ];

                foreach ($companies as $company) {
                    $regionNode['children'][] = [
                        'id' => 'c_'.$company->id,
                        'name' => $company->name,
                        'code' => $company->code,
                        'type' => 'Company',
                        'children' => [],
                    ];
                }

                $groupNode['children'][] = $regionNode;
            }

            $tree[] = $groupNode;
        }

        return $tree;
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Build the role-scoped and filter-scoped base query.
     *
     * @param  array<string>  $statuses
     * @param  array<string>  $contractTypeIds
     * @param  array<string>  $vendorIds
     * @param  array<string>  $picIds
     * @param  array<string>  $departmentIds
     * @param  array<string>  $regionIds
     * @param  array<string>  $companyGroupIds
     * @param  array<string>  $companyIds
     */
    private function buildBaseQuery(
        mixed $user,
        bool $hasFullAccess,
        bool $isManager,
        bool $hasDepartmentAccess,
        ?string $createdFrom,
        ?string $createdTo,
        array $statuses,
        array $contractTypeIds,
        array $vendorIds,
        array $picIds,
        array $departmentIds,
        array $regionIds,
        array $companyGroupIds,
        array $companyIds,
    ): QueryBuilder {
        $baseQuery = DB::table('mv_dashboard_contracts');

        // Date filters
        if (! empty($createdFrom)) {
            $baseQuery->whereDate('created_at', '>=', $createdFrom);
        }
        if (! empty($createdTo)) {
            $baseQuery->whereDate('created_at', '<=', $createdTo);
        }

        // Status filter
        if (! empty($statuses)) {
            $baseQuery->whereIn('status', $statuses);
        } else {
            $baseQuery->where('status', '!=', ContractStatusEnum::Draft->value);
        }

        if (! empty($contractTypeIds)) {
            $baseQuery->whereIn('contract_type_id', $contractTypeIds);
        }
        if (! empty($vendorIds)) {
            $baseQuery->whereIn('vendor_id', $vendorIds);
        }
        if (! empty($picIds)) {
            $baseQuery->whereIn('assigned_pic_id', $picIds);
        }

        // Advanced filters (apply organizational scope filters for all users as determined by ContractFilterScopeService)
        $this->applyFullAccessFilters($baseQuery, $departmentIds, $regionIds, $companyGroupIds, $companyIds);

        return $baseQuery;
    }

    /**
     * @param  array<string>  $departmentIds
     * @param  array<string>  $regionIds
     * @param  array<string>  $companyGroupIds
     * @param  array<string>  $companyIds
     */
    private function applyFullAccessFilters(
        QueryBuilder $query,
        array $departmentIds,
        array $regionIds,
        array $companyGroupIds,
        array $companyIds,
    ): void {
        if (! empty($departmentIds)) {
            $this->applyDepartmentScopeFilter($query, $departmentIds);
        }
        if (! empty($regionIds)) {
            $query->where(function (QueryBuilder $q) use ($regionIds): void {
                $q->whereIn('initiator_region_id', $regionIds)
                    ->orWhere(function (QueryBuilder $sq) use ($regionIds): void {
                        $sq->whereNull('initiated_by_id')
                            ->whereIn('creator_region_id', $regionIds);
                    });
            });
        }
        if (! empty($companyGroupIds)) {
            $query->where(function (QueryBuilder $q) use ($companyGroupIds): void {
                $q->whereIn('initiator_company_group_id', $companyGroupIds)
                    ->orWhere(function (QueryBuilder $sq) use ($companyGroupIds): void {
                        $sq->whereNull('initiated_by_id')
                            ->whereIn('creator_company_group_id', $companyGroupIds);
                    });
            });
        }
        if (! empty($companyIds)) {
            $query->where(function (QueryBuilder $q) use ($companyIds): void {
                $q->whereIn('initiator_company_id', $companyIds)
                    ->orWhere(function (QueryBuilder $sq) use ($companyIds): void {
                        $sq->whereNull('initiated_by_id')
                            ->whereIn('creator_company_id', $companyIds);
                    });
            });
        }
    }

    /** @param array<string> $departmentIds */
    private function applyDepartmentScopeFilter(QueryBuilder $query, array $departmentIds): void
    {
        $query->where(function (QueryBuilder $q) use ($departmentIds): void {
            $q->whereIn('initiator_department_id', $departmentIds)
                ->orWhere(function (QueryBuilder $sq) use ($departmentIds): void {
                    $sq->whereNull('initiated_by_id')
                        ->whereIn('creator_department_id', $departmentIds);
                });
        });
    }

    /** @return array{0: ?string, 1: ?string, 2: string} */
    private function resolveDateRange(Request $request): array
    {
        $createdFrom = $request->input('created_from');
        $createdTo = $request->input('created_to');
        $period = $request->input('period', 'all');

        if ($period !== 'all' && empty($createdFrom) && empty($createdTo)) {
            $createdFrom = match ($period) {
                'last_30_days' => now()->subDays(30)->toDateString(),
                'last_6_months' => now()->subMonths(6)->toDateString(),
                'last_year' => now()->subYear()->toDateString(),
                'current_year' => now()->startOfYear()->toDateString(),
                default => null,
            };
            if ($createdFrom !== null) {
                $createdTo = now()->toDateString();
            }
        }

        return [$createdFrom, $createdTo, $period];
    }

    /** @return array<string> */
    private function normalizeArray(mixed $val): array
    {
        if (empty($val)) {
            return [];
        }
        if (is_array($val)) {
            return $val;
        }

        return array_filter(explode(',', $val));
    }

    /** @return array<array{label: string, count: int}> */
    private function getSubmissionTypeDistribution(QueryBuilder $baseQuery): array
    {
        $counts = (clone $baseQuery)
            ->select('submission_type_id', DB::raw('count(*) as count'))
            ->whereNotNull('submission_type_id')
            ->groupBy('submission_type_id')
            ->pluck('count', 'submission_type_id');

        return SubmissionType::all()
            ->map(fn ($type) => [
                'label' => $type->name,
                'count' => (int) $counts->get($type->id, 0),
            ])
            ->values()
            ->all();
    }

    /** @return array<array{label: string, count: int}> */
    private function getContractTypeDistribution(QueryBuilder $baseQuery): array
    {
        $counts = (clone $baseQuery)
            ->select('contract_type_id', DB::raw('count(*) as count'))
            ->whereNotNull('contract_type_id')
            ->groupBy('contract_type_id')
            ->pluck('count', 'contract_type_id');

        $allTypes = ContractType::all();

        $buildTree = function ($parentId = null) use (&$buildTree, $allTypes, $counts) {
            $branch = [];
            foreach ($allTypes->where('parent_id', $parentId) as $type) {
                // prevent infinite loop
                if ($type->id === $parentId) {
                    continue;
                }

                $children = $buildTree($type->id);
                $nodeCount = (int) $counts->get($type->id, 0);

                $childrenCount = collect($children)->sum('count');
                $totalCount = $nodeCount + $childrenCount;

                $branch[] = [
                    'id' => $type->id,
                    'label' => $type->name,
                    'count' => $totalCount,
                    'children' => $children,
                ];
            }
            // Sort by count desc
            usort($branch, fn ($a, $b) => $b['count'] <=> $a['count']);

            return $branch;
        };

        return $buildTree(null);
    }

    /** @return array<array{status: string, count: int}> */
    private function getStatusDistribution(QueryBuilder $baseQuery): array
    {
        return (clone $baseQuery)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->map(fn ($item) => [
                'status' => $item->status,
                'count' => (int) $item->count,
            ])
            ->values()
            ->all();
    }

    /** @return array<string, int> */
    private function getExpiryTimeline(QueryBuilder $baseQuery): array
    {
        $approved = ContractStatusEnum::Approved->value;

        return [
            'under30' => (clone $baseQuery)->where('status', $approved)->whereNotNull('end_date')->whereDate('end_date', '>=', now()->toDateString())->whereDate('end_date', '<', now()->addDays(30)->toDateString())->count(),
            'under60' => (clone $baseQuery)->where('status', $approved)->whereNotNull('end_date')->whereDate('end_date', '>=', now()->addDays(30)->toDateString())->whereDate('end_date', '<', now()->addDays(60)->toDateString())->count(),
            'under90' => (clone $baseQuery)->where('status', $approved)->whereNotNull('end_date')->whereDate('end_date', '>=', now()->addDays(60)->toDateString())->whereDate('end_date', '<', now()->addDays(90)->toDateString())->count(),
            'above90' => (clone $baseQuery)->where('status', $approved)->where(fn (QueryBuilder $q) => $q->whereNull('end_date')->orWhereDate('end_date', '>=', now()->addDays(90)->toDateString()))->count(),
        ];
    }

    /** @return array<int, array<string, mixed>> */
    private function getRecentContracts(QueryBuilder $baseQuery): array
    {
        return (clone $baseQuery)
            ->orderByDesc('created_at')
            ->limit(5)
            ->get(['id', 'form_no', 'contract_no', 'title', 'status', 'creator_name', 'contract_type_name', 'f2_price', 'created_at'])
            ->map(fn ($item) => [
                'id' => $item->id,
                'form_no' => $item->form_no,
                'contract_no' => $item->contract_no,
                'title' => $item->title,
                'status' => $item->status,
                'creator' => $item->creator_name,
                'type' => $item->contract_type_name,
                'price' => $item->f2_price,
                'created_at' => $item->created_at,
            ])
            ->values()
            ->all();
    }

    /** @return array<int, array<string, mixed>> */
    private function getUpcomingRenewals(QueryBuilder $baseQuery): array
    {
        return (clone $baseQuery)
            ->where('status', ContractStatusEnum::Approved->value)
            ->whereNotNull('end_date')
            ->whereDate('end_date', '>=', now()->toDateString())
            ->orderBy('end_date', 'asc')
            ->limit(5)
            ->get(['id', 'form_no', 'contract_no', 'title', 'end_date', 'vendor_name', 'creator_name'])
            ->map(fn ($item) => [
                'id' => $item->id,
                'form_no' => $item->form_no,
                'contract_no' => $item->contract_no,
                'title' => $item->title,
                'end_date' => $item->end_date,
                'vendor_name' => $item->vendor_name,
                'creator' => $item->creator_name,
            ])
            ->values()
            ->all();
    }

    /** @return array<int, array<string, mixed>> */
    private function getPendingApprovalsList(): array
    {
        return Approval::where('user_id', Auth::id())
            ->where('status', 'pending')
            ->with(['contract.creator', 'contract.contractType'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(fn ($app) => [
                'id' => $app->id,
                'contract_id' => $app->contract_id,
                'form_no' => $app->contract->form_no,
                'contract_no' => $app->contract->contract_no,
                'title' => $app->contract->title,
                'creator' => $app->contract->creator?->name,
                'type' => $app->contract->contractType?->name,
                'requested_at' => $app->created_at,
            ])
            ->values()
            ->all();
    }

    /** @return array<int, array<string, mixed>> */
    private function getRecentActivity(mixed $user, bool $isAdmin): array
    {
        return DB::table('t_contract_h')
            ->leftJoin('m_users', 't_contract_h.actor_id', '=', 'm_users.id')
            ->leftJoin('t_contracts', 't_contract_h.contract_id', '=', 't_contracts.id')
            ->when(! $isAdmin, fn ($q) => $q->where('t_contracts.created_by', $user->id))
            ->select(
                't_contract_h.id',
                't_contract_h.action',
                't_contract_h.description',
                't_contract_h.created_at',
                'm_users.name as actor_name',
                't_contracts.id as contract_id',
                't_contracts.title as contract_title',
                't_contracts.form_no',
                't_contracts.contract_no',
            )
            ->orderByDesc('t_contract_h.created_at')
            ->limit(10)
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'action' => $item->action,
                'description' => $item->description,
                'actor' => $item->actor_name ?? 'Sistem',
                'contract_id' => $item->contract_id,
                'contract_title' => $item->contract_title,
                'form_no' => $item->form_no,
                'contract_no' => $item->contract_no,
                'created_at' => $item->created_at,
            ])
            ->values()
            ->all();
    }

    private function getOverviewDailyTrend(QueryBuilder $baseQuery): array
    {
        $startDate = now()->subMonth()->startOfMonth();
        $endDate = now();
        $userId = Auth::id();

        // 1. Semua Dokumen (non-draft, non-archived) — grouped by created_at date
        $allDocsByDay = (clone $baseQuery)
            ->whereRaw("UPPER(status) != 'ARCHIVED'")
            ->select(DB::raw('DATE(created_at) as day'), DB::raw('count(*) as total'))
            ->groupBy('day')
            ->pluck('total', 'day')
            ->all();

        // 2. Menunggu Persetujuan Saya — approvals pending for me, grouped by created_at date
        $pendingByDay = DB::table('t_approvals')
            ->where('user_id', $userId)
            ->where('status', 'pending')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->select(DB::raw('DATE(created_at) as day'), DB::raw('count(*) as total'))
            ->groupBy('day')
            ->pluck('total', 'day')
            ->all();

        // 3. Dokumen Saya (excluding draft) — grouped by created_at date
        $myDocsByDay = DB::table('t_contracts')
            ->where('created_by', $userId)
            ->whereNull('deleted_at')
            ->where('status', '!=', 'draft')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->select(DB::raw('DATE(created_at) as day'), DB::raw('count(*) as total'))
            ->groupBy('day')
            ->pluck('total', 'day')
            ->all();

        // 4. Dokumen Arsip — contracts with status = archived, grouped by updated_at date
        $archivedByDay = (clone $baseQuery)
            ->where('status', 'archived')
            ->whereBetween('updated_at', [$startDate, $endDate])
            ->select(DB::raw('DATE(updated_at) as day'), DB::raw('count(*) as total'))
            ->groupBy('day')
            ->pluck('total', 'day')
            ->all();

        // 5. On Progress — contracts in process statuses, grouped by created_at date
        $inProgressByDay = (clone $baseQuery)
            ->whereIn('status', ['in_review', 'revision', 'pending', 'locked'])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->select(DB::raw('DATE(created_at) as day'), DB::raw('count(*) as total'))
            ->groupBy('day')
            ->pluck('total', 'day')
            ->all();

        $trend = [];
        $current = $startDate->copy();
        while ($current->lte($endDate)) {
            $dateKey = $current->toDateString();

            $trend[] = [
                'date' => $current->format('d M'),
                'raw_date' => $dateKey,
                'full_date' => $current->translatedFormat('d M Y'),
                'month_key' => $current->format('Y-m'),
                'Semua Dokumen' => (int) ($allDocsByDay[$dateKey] ?? 0),
                'Menunggu Persetujuan Saya' => (int) ($pendingByDay[$dateKey] ?? 0),
                'Dokumen Saya' => (int) ($myDocsByDay[$dateKey] ?? 0),
                'Dokumen Arsip' => (int) ($archivedByDay[$dateKey] ?? 0),
                'On Progress' => (int) ($inProgressByDay[$dateKey] ?? 0),
            ];

            $current->addDay();
        }

        return $trend;
    }

    private function getDailyTrend(QueryBuilder $baseQuery): array
    {
        // ponytail: Generate daily trend from last month start to now for date filtering
        $startDate = now()->subMonth()->startOfMonth();
        $endDate = now();

        $contracts = (clone $baseQuery)
            ->get(['created_at', 'contract_type_id'])
            ->map(function ($c) {
                $c->date_key = Carbon::parse($c->created_at)->toDateString();

                return $c;
            });

        $allTypes = ContractType::all();

        $trend = [];
        $current = $startDate->copy();
        while ($current->lte($endDate)) {
            $dateKey = $current->toDateString();

            // Cumulative contracts created on or before D
            $contractsUpToDay = $contracts->filter(function ($c) use ($dateKey) {
                return $c->date_key <= $dateKey;
            });

            $dayData = [
                'date' => $current->format('d M'),
                'raw_date' => $dateKey,
                'full_date' => $current->translatedFormat('d M Y'),
                'month_key' => $current->format('Y-m'),
            ];

            foreach ($allTypes as $type) {
                $dayData['type_'.$type->id] = 0;
            }
            $dayData['type_null'] = 0;

            foreach ($contractsUpToDay as $contract) {
                $typeKey = $contract->contract_type_id ? 'type_'.$contract->contract_type_id : 'type_null';
                $dayData[$typeKey] = ($dayData[$typeKey] ?? 0) + 1;
            }

            $trend[] = $dayData;
            $current->addDay();
        }

        return $trend;
    }

    /** @return array<int, array<string, mixed>> */
    private function getMonthlyTrend(QueryBuilder $baseQuery): array
    {
        // ponytail: Query once and process in-memory to prevent multiple queries in loop
        $contracts = (clone $baseQuery)
            ->get(['created_at', 'f2_price'])
            ->map(function ($c) {
                $c->month_key = Carbon::parse($c->created_at)->startOfMonth()->toDateString();

                return $c;
            });

        $trend = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthStart = now()->subMonths($i)->startOfMonth();
            $monthKey = $monthStart->toDateString();
            $contractsInMonth = $contracts->where('month_key', $monthKey);

            $trend[] = [
                'month' => $monthStart->translatedFormat('M'),
                'count' => $contractsInMonth->count(),
                'value' => $contractsInMonth->sum(fn ($c) => ContractFormatter::parsePrice($c->f2_price)),
            ];
        }

        return $trend;
    }

    /** @return array<int, array<string, mixed>> */
    private function getRenewalVsExpiredTrend(QueryBuilder $baseQuery): array
    {
        // ponytail: Query once and process in-memory to prevent multiple queries in loop
        $contracts = (clone $baseQuery)
            ->get(['created_at', 'end_date', 'status', 'parent_id'])
            ->map(function ($c) {
                $c->created_month_key = Carbon::parse($c->created_at)->startOfMonth()->toDateString();
                $c->end_month_key = $c->end_date ? Carbon::parse($c->end_date)->startOfMonth()->toDateString() : null;

                return $c;
            });

        $trend = [];
        $approved = ContractStatusEnum::Approved->value;
        for ($i = 5; $i >= 0; $i--) {
            $monthStart = now()->subMonths($i)->startOfMonth();
            $monthKey = $monthStart->toDateString();

            $trend[] = [
                'month' => $monthStart->translatedFormat('M'),
                'expired' => $contracts->where('status', $approved)->where('end_month_key', $monthKey)->count(),
                'renewed' => $contracts->whereNotNull('parent_id')->where('created_month_key', $monthKey)->count(),
            ];
        }

        return $trend;
    }

    /** @return array<int, array<string, mixed>> */
    private function getMonthlyApprovalTrend(QueryBuilder $baseQuery): array
    {
        // ponytail: Query once and process in-memory to prevent multiple queries in loop
        $contracts = (clone $baseQuery)
            ->get(['created_at', 'status'])
            ->map(function ($c) {
                $c->month_key = Carbon::parse($c->created_at)->startOfMonth()->toDateString();

                return $c;
            });

        $trend = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthStart = now()->subMonths($i)->startOfMonth();
            $monthKey = $monthStart->toDateString();
            $monthContracts = $contracts->where('month_key', $monthKey);

            $trend[] = [
                'month' => $monthStart->translatedFormat('M'),
                'approved' => $monthContracts->where('status', ContractStatusEnum::Approved->value)->count(),
                'pending' => $monthContracts->whereIn('status', [ContractStatusEnum::InReview->value, ContractStatusEnum::Locked->value])->count(),
                'revision' => $monthContracts->where('status', ContractStatusEnum::Revision->value)->count(),
                'rejected' => $monthContracts->where('status', ContractStatusEnum::Rejected->value)->count(),
            ];
        }

        return $trend;
    }

    /** @return array<int, array<string, mixed>> */
    private function getTopVendors(QueryBuilder $baseQuery): array
    {
        return (clone $baseQuery)
            ->whereNotNull('vendor_id')
            ->get(['vendor_name', 'vendor_id', 'f2_price'])
            ->groupBy('vendor_id')
            ->map(function ($group) {
                return [
                    'name' => $group->first()->vendor_name ?? 'Unknown Vendor',
                    'count' => $group->count(),
                    'value' => $group->sum(fn ($c) => ContractFormatter::parsePrice($c->f2_price)),
                ];
            })
            ->sortByDesc('value')
            ->take(5)
            ->values()
            ->all();
    }

    /** @return array<int, array<string, mixed>> */
    private function getCategoryTrend(QueryBuilder $baseQuery): array
    {
        $allCategories = ContractType::all();

        // ponytail: Query once and process in-memory to prevent multiple queries in loop
        $contracts = (clone $baseQuery)
            ->get(['created_at', 'contract_type_id'])
            ->map(function ($c) {
                $c->month_key = Carbon::parse($c->created_at)->startOfMonth()->toDateString();

                return $c;
            });

        $trend = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthStart = now()->subMonths($i)->startOfMonth();
            $monthKey = $monthStart->toDateString();
            $monthContracts = $contracts->where('month_key', $monthKey);

            $row = ['month' => $monthStart->translatedFormat('M')];
            foreach ($allCategories as $cat) {
                $row[$cat->name] = $monthContracts->where('contract_type_id', $cat->id)->count();
            }
            $trend[] = $row;
        }

        return $trend;
    }

    /** @return array<int, array<string, mixed>> */
    private function getExpiryRiskHeatmap(QueryBuilder $baseQuery): array
    {
        return (clone $baseQuery)
            ->where('status', ContractStatusEnum::Approved->value)
            ->get(['end_date', 'initiator_department_name', 'creator_department_name'])
            ->groupBy(fn ($c) => $c->initiator_department_name ?? $c->creator_department_name ?? 'Tanpa Divisi')
            ->map(function ($group, $deptName) {
                $highRisk = 0;
                $medRisk = 0;
                $lowRisk = 0;
                foreach ($group as $c) {
                    if (empty($c->end_date)) {
                        $lowRisk++;

                        continue;
                    }
                    $days = Carbon::parse($c->end_date)->diffInDays(now(), false);
                    if ($days > 0 || abs($days) < 30) {
                        $highRisk++;
                    } elseif (abs($days) <= 90) {
                        $medRisk++;
                    } else {
                        $lowRisk++;
                    }
                }

                return ['department' => $deptName, 'high' => $highRisk, 'medium' => $medRisk, 'low' => $lowRisk];
            })
            ->values()
            ->all();
    }

    /**
     * @param  array<string>  $renewedIds
     * @return array<int, array<string, mixed>>
     */
    private function getRenewalFailureByCategory(QueryBuilder $baseQuery, array $renewedIds): array
    {
        return (clone $baseQuery)
            ->where('status', ContractStatusEnum::Approved->value)
            ->whereNotNull('end_date')
            ->whereDate('end_date', '<', now()->toDateString())
            ->get(['id', 'contract_type_name'])
            ->groupBy(fn ($c) => $c->contract_type_name ?? 'Lainnya')
            ->map(function ($group, $catName) use ($renewedIds) {
                $renewed = 0;
                $failed = 0;
                foreach ($group as $c) {
                    if (in_array($c->id, $renewedIds)) {
                        $renewed++;
                    } else {
                        $failed++;
                    }
                }

                return ['category' => $catName, 'renewed' => $renewed, 'failed' => $failed];
            })
            ->values()
            ->all();
    }

    /**
     * @param  array<string>  $renewedIds
     * @return array<int, array<string, mixed>>
     */
    private function getVendorPerformance(QueryBuilder $baseQuery, array $renewedIds): array
    {
        return (clone $baseQuery)
            ->whereNotNull('vendor_id')
            ->get(['id', 'vendor_name', 'vendor_id', 'parent_id', 'status', 'updated_at'])
            ->groupBy('vendor_id')
            ->map(function ($group) use ($renewedIds) {
                $vendorName = $group->first()->vendor_name;
                $total = $group->count();
                $renewed = $group->filter(fn ($c) => in_array($c->id, $renewedIds) || $c->parent_id !== null)->count();
                $approvedGroup = $group->where('status', ContractStatusEnum::Approved->value);
                $avgDays = 0;
                if ($approvedGroup->count() > 0) {
                    $contractIds = $approvedGroup->pluck('id');
                    $firstApprovals = Approval::whereIn('contract_id', $contractIds)
                        ->select('contract_id', DB::raw('MIN(created_at) as first_sent_at'))
                        ->groupBy('contract_id')
                        ->pluck('first_sent_at', 'contract_id')
                        ->all();
                    $totalDays = $approvedGroup->sum(function ($c) use ($firstApprovals): float {
                        $firstSentAt = $firstApprovals[$c->id] ?? null;

                        return $firstSentAt ? Carbon::parse($firstSentAt)->diffInHours($c->updated_at) / 24 : 0;
                    });
                    $avgDays = round($totalDays / $approvedGroup->count(), 1);
                }

                return [
                    'name' => $vendorName ?? 'Unknown',
                    'total' => $total,
                    'renewal_rate' => $total > 0 ? round(($renewed / $total) * 100, 1) : 0,
                    'avg_cycle_time' => $avgDays,
                ];
            })
            ->sortByDesc('total')
            ->take(5)
            ->values()
            ->all();
    }

    /** @return array<int, array<string, mixed>> */
    private function getValueDistribution(QueryBuilder $baseQuery): array
    {
        $distribution = [
            ['range' => '< Rp 50M', 'count' => 0],
            ['range' => 'Rp 50M - 500M', 'count' => 0],
            ['range' => '> Rp 500M', 'count' => 0],
        ];
        $prices = (clone $baseQuery)
            ->pluck('f2_price')
            ->map(fn ($price) => ContractFormatter::parsePrice($price));
        foreach ($prices as $price) {
            if ($price < 50000000) {
                $distribution[0]['count']++;
            } elseif ($price <= 500000000) {
                $distribution[1]['count']++;
            } else {
                $distribution[2]['count']++;
            }
        }

        return $distribution;
    }

    /** @return array<int, array<string, mixed>> */
    private function getBudgetAllocation(QueryBuilder $baseQuery): array
    {
        return (clone $baseQuery)
            ->get(['contract_type_name', 'f2_price'])
            ->groupBy(fn ($c) => $c->contract_type_name ?? 'Lainnya')
            ->map(fn ($group, $catName) => [
                'name' => $catName,
                'value' => $group->sum(fn ($c) => ContractFormatter::parsePrice($c->f2_price)),
            ])
            ->values()
            ->all();
    }

    /** @return array<int, array<string, mixed>> */
    private function getApprovalDurationByDept(QueryBuilder $baseQuery): array
    {
        return (clone $baseQuery)
            ->where('status', ContractStatusEnum::Approved->value)
            ->get(['id', 'initiator_department_name', 'creator_department_name', 'updated_at'])
            ->groupBy(fn ($c) => $c->initiator_department_name ?? $c->creator_department_name ?? 'Tanpa Divisi')
            ->map(function ($group, $deptName) {
                $contractIds = $group->pluck('id');
                $firstApprovals = Approval::whereIn('contract_id', $contractIds)
                    ->select('contract_id', DB::raw('MIN(created_at) as first_sent_at'))
                    ->groupBy('contract_id')
                    ->pluck('first_sent_at', 'contract_id')
                    ->all();
                $totalDays = $group->sum(function ($c) use ($firstApprovals): float {
                    $firstSentAt = $firstApprovals[$c->id] ?? null;

                    return $firstSentAt ? Carbon::parse($firstSentAt)->diffInHours($c->updated_at) / 24 : 0;
                });

                return [
                    'department' => $deptName,
                    'avg_days' => $group->count() > 0 ? round($totalDays / $group->count(), 1) : 0,
                ];
            })
            ->values()
            ->all();
    }

    /** @return array{0: Carbon, 1: Carbon} */
    private function resolveWorkloadPeriod(?string $createdFrom, ?string $createdTo): array
    {
        $start = ! empty($createdFrom) ? Carbon::parse($createdFrom)->startOfDay() : Carbon::now()->startOfMonth();
        $end = ! empty($createdTo) ? Carbon::parse($createdTo)->endOfDay() : Carbon::now()->endOfMonth();

        return [$start, $end];
    }

    /**
     * @param  array<string>  $regionIds
     * @param  array<string>  $companyGroupIds
     * @param  array<string>  $companyIds
     * @param  array<string>  $departmentIds
     * @return array<int, array<string, mixed>>
     */
    private function getUserWorkloads(
        mixed $user,
        bool $hasFullAccess,
        bool $isManager,
        bool $hasDepartmentAccess,
        Carbon $startOfMonth,
        Carbon $endOfMonth,
        array $regionIds,
        array $companyGroupIds,
        array $companyIds,
        array $departmentIds,
        mixed $activeCounts,
        mixed $pendingCounts,
        mixed $initiatedCounts,
        mixed $pendingThisMonth,
        mixed $activeThisMonth,
        mixed $completedApprovalsThisMonth,
        mixed $completedContractsThisMonth
    ): array {
        $userQuery = User::where('is_used', true)
            ->with(['department', 'company', 'division', 'location']);

        // ponytail: Scope to user division if not full access
        if (! $hasFullAccess && $user->division_id) {
            $userQuery->where('division_id', $user->division_id);
        } elseif ($isManager && $user->company_id) {
            $userQuery->where('company_id', $user->company_id);
        } elseif ($hasDepartmentAccess && $user->department_id) {
            $userQuery->where('department_id', $user->department_id);
        }

        if ($hasFullAccess) {
            if (! empty($regionIds)) {
                $userQuery->whereHas('company', fn ($q) => $q->whereIn('region_id', $regionIds));
            }
            if (! empty($companyGroupIds)) {
                $userQuery->whereHas('company', fn ($q) => $q->whereIn('company_group_id', $companyGroupIds));
            }
            if (! empty($companyIds)) {
                $userQuery->whereIn('company_id', $companyIds);
            }
            if (! empty($departmentIds)) {
                $userQuery->whereIn('department_id', $departmentIds);
            }
        } elseif ($isManager && ! empty($departmentIds)) {
            $userQuery->whereIn('department_id', $departmentIds);
        }

        return $userQuery->get()
            ->map(function ($u) use (
                $activeCounts, $pendingCounts, $initiatedCounts,
                $pendingThisMonth, $activeThisMonth, $completedApprovalsThisMonth, $completedContractsThisMonth
            ) {
                $activeCount = (int) $activeCounts->get($u->id, 0);
                $pendingCount = (int) $pendingCounts->get($u->id, 0);
                $initiatedCount = (int) $initiatedCounts->get($u->id, 0);

                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'initials' => $u->initials,
                    'role' => $u->role,
                    'department_name' => $u->department?->name,
                    'department_id' => $u->department_id,
                    'division_id' => $u->division_id,
                    'division_name' => $u->division?->name,
                    'location_id' => $u->location_id,
                    'location_name' => $u->location?->name,
                    'company_id' => $u->company_id,
                    'company_group_id' => $u->company_group_id ?? $u->company?->company_group_id,
                    'region_id' => $u->region_id ?? $u->company?->region_id,
                    'active_contracts_count' => $activeCount,
                    'pending_tasks_count' => $pendingCount,
                    'initiated_contracts_count' => $initiatedCount,
                    'load_status' => $activeCount >= 10 ? 'Sibuk' : 'Ready',
                    'stats_this_month' => [
                        'pending' => (int) $pendingThisMonth->get($u->id, 0),
                        'active' => (int) $activeThisMonth->get($u->id, 0),
                        'completed' => ((int) $completedApprovalsThisMonth->get($u->id, 0)) + ((int) $completedContractsThisMonth->get($u->id, 0)),
                    ],
                ];
            })
            ->sortByDesc('active_contracts_count')
            ->values()
            ->all();
    }

    /** @return array<int, array<string, mixed>> */
    private function getDepartmentWorkload($activeReviews, $pendingApprovals): array
    {
        return User::with('department')
            ->get()
            ->groupBy(fn ($u) => $u->department?->name ?? 'Tanpa Divisi')
            ->map(function ($group, $deptName) use ($activeReviews, $pendingApprovals) {
                $totalActive = 0;
                $totalPending = 0;
                foreach ($group as $u) {
                    $totalActive += (int) $activeReviews->get($u->id, 0);
                    $totalPending += (int) $pendingApprovals->get($u->id, 0);
                }

                return [
                    'department' => $deptName,
                    'active_reviews' => $totalActive,
                    'pending_approvals' => $totalPending,
                    'total' => $totalActive + $totalPending,
                ];
            })
            ->filter(fn ($item) => $item['total'] > 0)
            ->sortByDesc('total')
            ->values()
            ->all();
    }

    /** @return array<int, array<string, mixed>> */
    private function getCategoryTraffic(QueryBuilder $baseQuery): array
    {
        // ponytail: Pre-aggregate counts in single database query to prevent N+1 in loop
        $incomingCounts = (clone $baseQuery)
            ->whereIn('status', [ContractStatusEnum::InReview->value, ContractStatusEnum::Revision->value])
            ->select('contract_type_id', DB::raw('count(*) as count'))
            ->groupBy('contract_type_id')
            ->pluck('count', 'contract_type_id');

        $outgoingCounts = (clone $baseQuery)
            ->whereIn('status', [ContractStatusEnum::Approved->value, ContractStatusEnum::Locked->value, 'archived'])
            ->select('contract_type_id', DB::raw('count(*) as count'))
            ->groupBy('contract_type_id')
            ->pluck('count', 'contract_type_id');

        return ContractType::orderBy('name')
            ->get()
            ->map(function ($type) use ($incomingCounts, $outgoingCounts) {
                return [
                    'category_name' => $type->name,
                    'incoming_count' => (int) $incomingCounts->get($type->id, 0),
                    'outgoing_count' => (int) $outgoingCounts->get($type->id, 0),
                ];
            })
            ->values()
            ->all();
    }

    /** @return array<int, array<string, mixed>> */
    private function getDepartmentTraffic(QueryBuilder $baseQuery): array
    {
        // ponytail: Pre-aggregate counts in single database query using COALESCE to prevent N+1 in loop
        $incomingCounts = (clone $baseQuery)
            ->whereIn('status', [ContractStatusEnum::InReview->value, ContractStatusEnum::Revision->value])
            ->select(DB::raw('COALESCE(initiator_department_id, creator_department_id) as dept_id'), DB::raw('count(*) as count'))
            ->groupBy('dept_id')
            ->pluck('count', 'dept_id');

        $outgoingCounts = (clone $baseQuery)
            ->whereIn('status', [ContractStatusEnum::Approved->value, ContractStatusEnum::Locked->value, 'archived'])
            ->select(DB::raw('COALESCE(initiator_department_id, creator_department_id) as dept_id'), DB::raw('count(*) as count'))
            ->groupBy('dept_id')
            ->pluck('count', 'dept_id');

        return Department::orderBy('name')
            ->get()
            ->map(function ($dept) use ($incomingCounts, $outgoingCounts) {
                return [
                    'department_id' => $dept->id,
                    'department_name' => $dept->name,
                    'incoming_count' => (int) $incomingCounts->get($dept->id, 0),
                    'outgoing_count' => (int) $outgoingCounts->get($dept->id, 0),
                    'member_count' => User::where('department_id', $dept->id)->count(),
                ];
            })
            ->values()
            ->all();
    }
}
