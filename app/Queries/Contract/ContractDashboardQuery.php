<?php

namespace App\Queries\Contract;

use App\Enums\ContractStatusEnum;
use App\Formatters\ContractFormatter;
use App\Models\Approval;
use App\Models\Contract;
use App\Models\ContractType;
use App\Models\Department;
use App\Models\SubmissionType;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
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
        $roleName = $user->role;
        $hasFullAccess = in_array($roleName, ['Admin', 'Super Admin', 'Director', 'CEO', 'VP']);
        $isAdmin = $hasFullAccess;
        $isManager = $roleName === 'Manager';
        $hasDepartmentAccess = ! $hasFullAccess && ! $isManager;

        [$createdFrom, $createdTo, $period] = $this->resolveDateRange($request);

        $regionIds = $this->normalizeArray($request->input('region_ids', []));
        $companyGroupIds = $this->normalizeArray($request->input('company_group_ids', []));
        $companyIds = $this->normalizeArray($request->input('company_ids', []));
        $vendorIds = $this->normalizeArray($request->input('vendor_ids', []));
        $statuses = $this->normalizeArray($request->input('statuses', []));
        $contractTypeIds = $this->normalizeArray($request->input('contract_type_ids', []));
        $picIds = $this->normalizeArray($request->input('pic_ids', []));
        $departmentIds = $this->normalizeArray($request->input('department_ids', []));

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
        $totalContracts = (clone $baseQuery)->count();
        $inProcessContracts = (clone $baseQuery)
            ->whereIn('status', array_map(fn ($s) => $s->value, ContractStatusEnum::inProcess()))
            ->count();
        $activeContracts = (clone $baseQuery)
            ->where('status', ContractStatusEnum::Approved->value)
            ->where(fn (Builder $q) => $q->whereNull('end_date')->orWhereDate('end_date', '>=', now()->toDateString()))
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
        $prices = DB::table('t_contracts')
            ->join('t_contract_meta', 't_contracts.id', '=', 't_contract_meta.contract_id')
            ->whereIn('t_contracts.id', (clone $baseQuery)->pluck('id'))
            ->pluck('t_contract_meta.f2_price');
        foreach ($prices as $price) {
            $totalValue += ContractFormatter::parsePrice($price);
        }

        // Average approval cycle time
        $approvedContracts = (clone $baseQuery)
            ->where('status', ContractStatusEnum::Approved->value)
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
            $totalDays = $approvedContracts->sum(function (Contract $c) use ($firstApprovals): float {
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
        $allContracts = Contract::select('id', 'parent_id')->get();
        $renewedIds = $allContracts->whereNotNull('parent_id')->pluck('parent_id')->all();
        $renewalFailureByCategory = $this->getRenewalFailureByCategory($baseQuery, $renewedIds);
        $vendorPerformance = $this->getVendorPerformance($baseQuery, $renewedIds);
        $valueDistribution = $this->getValueDistribution($baseQuery);
        $budgetAllocation = $this->getBudgetAllocation($baseQuery);
        $approvalDurationByDept = $this->getApprovalDurationByDept($baseQuery);

        // Workload
        [$startOfMonth, $endOfMonth] = $this->resolveWorkloadPeriod($createdFrom, $createdTo);
        $userWorkloads = $this->getUserWorkloads(
            $user, $hasFullAccess, $isManager, $hasDepartmentAccess,
            $startOfMonth, $endOfMonth,
            $regionIds, $companyGroupIds, $companyIds, $departmentIds,
        );
        $departmentWorkload = $this->getDepartmentWorkload();
        $categoryTraffic = $this->getCategoryTraffic($baseQuery);
        $departmentTraffic = $this->getDepartmentTraffic($baseQuery);
        $totalRenewed = (clone $baseQuery)->whereNotNull('parent_id')->count();
        $renewalCompletionRate = $expiredContracts > 0
            ? round(($totalRenewed / $expiredContracts) * 100, 1)
            : 100;

        return [
            'metrics' => [
                'totalContracts' => $totalContracts,
                'activeContracts' => $activeContracts,
                'expiringContracts' => $expiringSoonContracts,
                'expiredContracts' => $expiredContracts,
                'pendingContracts' => $inProcessContracts,
                'pendingApprovals' => $inProcessContracts,
                'renewalRate' => $renewalRate,
                'totalValue' => $totalValue,
                'avgCycleTime' => $avgDays,
            ],
            'summary' => [
                'total' => $totalContracts,
                'in_process' => $inProcessContracts,
                'active' => $activeContracts,
                'expiring_soon' => $expiringSoonContracts,
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
        ];
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
    ): Builder {
        $baseQuery = Contract::query()->select('t_contracts.*');

        // Role-based scope
        if ($isManager && $user->company_id) {
            $baseQuery->where(function (Builder $q) use ($user): void {
                $q->whereHas('initiator', fn (Builder $sq) => $sq->where('company_id', $user->company_id))
                    ->orWhere(function (Builder $sq) use ($user): void {
                        $sq->whereNull('initiated_by_id')
                            ->whereHas('creator', fn (Builder $ssq) => $ssq->where('company_id', $user->company_id));
                    });
            });
        } elseif ($hasDepartmentAccess && $user->department_id) {
            $baseQuery->where(function (Builder $q) use ($user): void {
                $q->whereHas('initiator', fn (Builder $sq) => $sq->where('department_id', $user->department_id))
                    ->orWhere(function (Builder $sq) use ($user): void {
                        $sq->whereNull('initiated_by_id')
                            ->whereHas('creator', fn (Builder $ssq) => $ssq->where('department_id', $user->department_id));
                    });
            });
        }

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

        // Advanced filters (by role level)
        if ($hasFullAccess) {
            $this->applyFullAccessFilters($baseQuery, $departmentIds, $regionIds, $companyGroupIds, $companyIds);
        } elseif ($isManager && ! empty($departmentIds)) {
            $this->applyDepartmentScopeFilter($baseQuery, $departmentIds);
        }

        return $baseQuery;
    }

    /**
     * @param  array<string>  $departmentIds
     * @param  array<string>  $regionIds
     * @param  array<string>  $companyGroupIds
     * @param  array<string>  $companyIds
     */
    private function applyFullAccessFilters(
        Builder $query,
        array $departmentIds,
        array $regionIds,
        array $companyGroupIds,
        array $companyIds,
    ): void {
        if (! empty($departmentIds)) {
            $this->applyDepartmentScopeFilter($query, $departmentIds);
        }
        if (! empty($regionIds)) {
            $query->where(function (Builder $q) use ($regionIds): void {
                $q->whereHas('initiator.company', fn (Builder $sq) => $sq->whereIn('region_id', $regionIds))
                    ->orWhere(function (Builder $sq) use ($regionIds): void {
                        $sq->whereNull('initiated_by_id')
                            ->whereHas('creator.company', fn (Builder $ssq) => $ssq->whereIn('region_id', $regionIds));
                    });
            });
        }
        if (! empty($companyGroupIds)) {
            $query->where(function (Builder $q) use ($companyGroupIds): void {
                $q->whereHas('initiator.company', fn (Builder $sq) => $sq->whereIn('company_group_id', $companyGroupIds))
                    ->orWhere(function (Builder $sq) use ($companyGroupIds): void {
                        $sq->whereNull('initiated_by_id')
                            ->whereHas('creator.company', fn (Builder $ssq) => $ssq->whereIn('company_group_id', $companyGroupIds));
                    });
            });
        }
        if (! empty($companyIds)) {
            $query->where(function (Builder $q) use ($companyIds): void {
                $q->whereHas('initiator', fn (Builder $sq) => $sq->whereIn('company_id', $companyIds))
                    ->orWhere(function (Builder $sq) use ($companyIds): void {
                        $sq->whereNull('initiated_by_id')
                            ->whereHas('creator', fn (Builder $ssq) => $ssq->whereIn('company_id', $companyIds));
                    });
            });
        }
    }

    /** @param array<string> $departmentIds */
    private function applyDepartmentScopeFilter(Builder $query, array $departmentIds): void
    {
        $query->where(function (Builder $q) use ($departmentIds): void {
            $q->whereHas('initiator', fn (Builder $sq) => $sq->whereIn('department_id', $departmentIds))
                ->orWhere(function (Builder $sq) use ($departmentIds): void {
                    $sq->whereNull('initiated_by_id')
                        ->whereHas('creator', fn (Builder $ssq) => $ssq->whereIn('department_id', $departmentIds));
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
    private function getSubmissionTypeDistribution(Builder $baseQuery): array
    {
        $counts = DB::table('t_contracts')
            ->select('submission_type_id', DB::raw('count(*) as count'))
            ->whereIn('id', (clone $baseQuery)->pluck('id'))
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
    private function getContractTypeDistribution(Builder $baseQuery): array
    {
        $counts = DB::table('t_contracts')
            ->select('contract_type_id', DB::raw('count(*) as count'))
            ->whereIn('id', (clone $baseQuery)->pluck('id'))
            ->whereNotNull('contract_type_id')
            ->groupBy('contract_type_id')
            ->pluck('count', 'contract_type_id');

        return ContractType::whereNotNull('parent_id')
            ->whereColumn('parent_id', '!=', 'id')
            ->get()
            ->map(fn ($type) => [
                'label' => $type->name,
                'count' => (int) $counts->get($type->id, 0),
            ])
            ->sortByDesc('count')
            ->values()
            ->all();
    }

    /** @return array<array{status: string, count: int}> */
    private function getStatusDistribution(Builder $baseQuery): array
    {
        return DB::table('t_contracts')
            ->select('status', DB::raw('count(*) as count'))
            ->whereIn('id', (clone $baseQuery)->pluck('id'))
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
    private function getExpiryTimeline(Builder $baseQuery): array
    {
        $approved = ContractStatusEnum::Approved->value;

        return [
            'under30' => (clone $baseQuery)->where('status', $approved)->whereNotNull('end_date')->whereDate('end_date', '>=', now()->toDateString())->whereDate('end_date', '<', now()->addDays(30)->toDateString())->count(),
            'under60' => (clone $baseQuery)->where('status', $approved)->whereNotNull('end_date')->whereDate('end_date', '>=', now()->addDays(30)->toDateString())->whereDate('end_date', '<', now()->addDays(60)->toDateString())->count(),
            'under90' => (clone $baseQuery)->where('status', $approved)->whereNotNull('end_date')->whereDate('end_date', '>=', now()->addDays(60)->toDateString())->whereDate('end_date', '<', now()->addDays(90)->toDateString())->count(),
            'above90' => (clone $baseQuery)->where('status', $approved)->where(fn (Builder $q) => $q->whereNull('end_date')->orWhereDate('end_date', '>=', now()->addDays(90)->toDateString()))->count(),
        ];
    }

    /** @return array<int, array<string, mixed>> */
    private function getRecentContracts(Builder $baseQuery): array
    {
        return (clone $baseQuery)
            ->with(['creator', 'contractType', 'meta'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'contract_no' => $item->contract_no,
                'title' => $item->title,
                'status' => $item->status,
                'creator' => $item->creator?->name,
                'type' => $item->contractType?->name,
                'price' => $item->meta?->f2_price,
                'created_at' => $item->created_at,
            ])
            ->values()
            ->all();
    }

    /** @return array<int, array<string, mixed>> */
    private function getUpcomingRenewals(Builder $baseQuery): array
    {
        return (clone $baseQuery)
            ->with(['vendor', 'creator'])
            ->where('status', ContractStatusEnum::Approved->value)
            ->whereNotNull('end_date')
            ->whereDate('end_date', '>=', now()->toDateString())
            ->orderBy('end_date', 'asc')
            ->limit(5)
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'contract_no' => $item->contract_no,
                'title' => $item->title,
                'end_date' => $item->end_date,
                'vendor_name' => $item->vendor?->name,
                'creator' => $item->creator?->name,
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
                'contract_no' => $item->contract_no,
                'created_at' => $item->created_at,
            ])
            ->values()
            ->all();
    }

    /** @return array<int, array<string, mixed>> */
    private function getMonthlyTrend(Builder $baseQuery): array
    {
        $trend = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthStart = now()->subMonths($i)->startOfMonth();
            $monthEnd = now()->subMonths($i)->endOfMonth();
            $contractsInMonth = (clone $baseQuery)->with('meta')->whereBetween('created_at', [$monthStart, $monthEnd])->get();
            $trend[] = [
                'month' => $monthStart->translatedFormat('M'),
                'count' => $contractsInMonth->count(),
                'value' => $contractsInMonth->sum(fn ($c) => ContractFormatter::parsePrice($c->meta?->f2_price)),
            ];
        }

        return $trend;
    }

    /** @return array<int, array<string, mixed>> */
    private function getRenewalVsExpiredTrend(Builder $baseQuery): array
    {
        $trend = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthStart = now()->subMonths($i)->startOfMonth();
            $monthEnd = now()->subMonths($i)->endOfMonth();
            $trend[] = [
                'month' => $monthStart->translatedFormat('M'),
                'expired' => (clone $baseQuery)->where('status', ContractStatusEnum::Approved->value)->whereBetween('end_date', [$monthStart, $monthEnd])->count(),
                'renewed' => (clone $baseQuery)->whereNotNull('parent_id')->whereBetween('created_at', [$monthStart, $monthEnd])->count(),
            ];
        }

        return $trend;
    }

    /** @return array<int, array<string, mixed>> */
    private function getMonthlyApprovalTrend(Builder $baseQuery): array
    {
        $trend = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthStart = now()->subMonths($i)->startOfMonth();
            $monthEnd = now()->subMonths($i)->endOfMonth();
            $contracts = (clone $baseQuery)->whereBetween('created_at', [$monthStart, $monthEnd])->get();
            $trend[] = [
                'month' => $monthStart->translatedFormat('M'),
                'approved' => $contracts->where('status', ContractStatusEnum::Approved->value)->count(),
                'pending' => $contracts->whereIn('status', [ContractStatusEnum::InReview->value, ContractStatusEnum::Locked->value])->count(),
                'revision' => $contracts->where('status', ContractStatusEnum::Revision->value)->count(),
                'rejected' => $contracts->where('status', ContractStatusEnum::Rejected->value)->count(),
            ];
        }

        return $trend;
    }

    /** @return array<int, array<string, mixed>> */
    private function getTopVendors(Builder $baseQuery): array
    {
        return (clone $baseQuery)
            ->whereNotNull('vendor_id')
            ->with(['vendor', 'meta'])
            ->get()
            ->groupBy('vendor_id')
            ->map(function ($group) {
                $vendor = $group->first()->vendor;

                return [
                    'name' => $vendor->name ?? 'Unknown Vendor',
                    'count' => $group->count(),
                    'value' => $group->sum(fn ($c) => ContractFormatter::parsePrice($c->meta?->f2_price)),
                ];
            })
            ->sortByDesc('value')
            ->take(5)
            ->values()
            ->all();
    }

    /** @return array<int, array<string, mixed>> */
    private function getCategoryTrend(Builder $baseQuery): array
    {
        $allCategories = ContractType::all();
        $trend = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthStart = now()->subMonths($i)->startOfMonth();
            $monthEnd = now()->subMonths($i)->endOfMonth();
            $row = ['month' => $monthStart->translatedFormat('M')];
            foreach ($allCategories as $cat) {
                $row[$cat->name] = (clone $baseQuery)->where('contract_type_id', $cat->id)->whereBetween('created_at', [$monthStart, $monthEnd])->count();
            }
            $trend[] = $row;
        }

        return $trend;
    }

    /** @return array<int, array<string, mixed>> */
    private function getExpiryRiskHeatmap(Builder $baseQuery): array
    {
        return (clone $baseQuery)
            ->where('status', ContractStatusEnum::Approved->value)
            ->with(['creator.department', 'initiator.department'])
            ->get()
            ->groupBy(fn ($c) => $c->initiator?->department?->name ?? $c->creator?->department?->name ?? 'Tanpa Divisi')
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
    private function getRenewalFailureByCategory(Builder $baseQuery, array $renewedIds): array
    {
        return (clone $baseQuery)
            ->where('status', ContractStatusEnum::Approved->value)
            ->whereNotNull('end_date')
            ->whereDate('end_date', '<', now()->toDateString())
            ->with('contractType')
            ->get()
            ->groupBy(fn ($c) => $c->contractType?->name ?? 'Lainnya')
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
    private function getVendorPerformance(Builder $baseQuery, array $renewedIds): array
    {
        return (clone $baseQuery)
            ->whereNotNull('vendor_id')
            ->with('vendor')
            ->get()
            ->groupBy('vendor_id')
            ->map(function ($group) use ($renewedIds) {
                $vendor = $group->first()->vendor;
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
                    'name' => $vendor?->name ?? 'Unknown',
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
    private function getValueDistribution(Builder $baseQuery): array
    {
        $distribution = [
            ['range' => '< Rp 50M', 'count' => 0],
            ['range' => 'Rp 50M - 500M', 'count' => 0],
            ['range' => '> Rp 500M', 'count' => 0],
        ];
        $prices = (clone $baseQuery)
            ->join('t_contract_meta', 't_contracts.id', '=', 't_contract_meta.contract_id')
            ->select('t_contract_meta.f2_price')
            ->pluck('t_contract_meta.f2_price')
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
    private function getBudgetAllocation(Builder $baseQuery): array
    {
        return (clone $baseQuery)
            ->with(['contractType', 'meta'])
            ->get()
            ->groupBy(fn ($c) => $c->contractType?->name ?? 'Lainnya')
            ->map(fn ($group, $catName) => [
                'name' => $catName,
                'value' => $group->sum(fn ($c) => ContractFormatter::parsePrice($c->meta?->f2_price)),
            ])
            ->values()
            ->all();
    }

    /** @return array<int, array<string, mixed>> */
    private function getApprovalDurationByDept(Builder $baseQuery): array
    {
        return (clone $baseQuery)
            ->where('status', ContractStatusEnum::Approved->value)
            ->with(['creator.department', 'initiator.department'])
            ->get()
            ->groupBy(fn ($c) => $c->initiator?->department?->name ?? $c->creator?->department?->name ?? 'Tanpa Divisi')
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
    ): array {
        $userQuery = User::with('department');

        if ($isManager && $user->company_id) {
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
            ->map(function ($u) use ($startOfMonth, $endOfMonth) {
                $activeCount = Contract::where('assigned_pic_id', $u->id)
                    ->whereIn('status', [ContractStatusEnum::InReview->value, ContractStatusEnum::Revision->value])
                    ->count();
                $pendingCount = Approval::where('user_id', $u->id)->where('status', 'pending')->count();
                $initiatedCount = Contract::where(function ($query) use ($u): void {
                    $query->where('initiated_by_id', $u->id)
                        ->orWhere(function ($q) use ($u): void {
                            $q->whereNull('initiated_by_id')->where('created_by', $u->id);
                        });
                })->count();

                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'initials' => $u->initials,
                    'role' => $u->role,
                    'position' => $u->position,
                    'department_name' => $u->department?->name,
                    'department_id' => $u->department_id,
                    'active_contracts_count' => $activeCount,
                    'pending_tasks_count' => $pendingCount,
                    'initiated_contracts_count' => $initiatedCount,
                    'load_status' => $activeCount >= 10 ? 'Sibuk' : 'Ready',
                    'stats_this_month' => [
                        'pending' => Approval::where('user_id', $u->id)->where('status', 'pending')->whereBetween('created_at', [$startOfMonth, $endOfMonth])->count(),
                        'active' => Contract::where('assigned_pic_id', $u->id)->whereIn('status', [ContractStatusEnum::InReview->value, ContractStatusEnum::Revision->value])->whereBetween('created_at', [$startOfMonth, $endOfMonth])->count(),
                        'completed' => Approval::where('user_id', $u->id)->where('status', 'approved')->whereBetween('updated_at', [$startOfMonth, $endOfMonth])->count() + Contract::where('assigned_pic_id', $u->id)->whereIn('status', ['approved', 'active', 'archived'])->whereBetween('updated_at', [$startOfMonth, $endOfMonth])->count(),
                    ],
                ];
            })
            ->sortByDesc('active_contracts_count')
            ->values()
            ->all();
    }

    /** @return array<int, array<string, mixed>> */
    private function getDepartmentWorkload(): array
    {
        return User::with('department')
            ->get()
            ->groupBy(fn ($u) => $u->department?->name ?? 'Tanpa Divisi')
            ->map(function ($group, $deptName) {
                $userIds = $group->pluck('id');
                $activeReviews = Contract::whereIn('assigned_pic_id', $userIds)
                    ->whereIn('status', [ContractStatusEnum::InReview->value, ContractStatusEnum::Revision->value])
                    ->count();
                $pendingApprovals = Approval::whereIn('user_id', $userIds)->where('status', 'pending')->count();

                return [
                    'department' => $deptName,
                    'active_reviews' => $activeReviews,
                    'pending_approvals' => $pendingApprovals,
                    'total' => $activeReviews + $pendingApprovals,
                ];
            })
            ->filter(fn ($item) => $item['total'] > 0)
            ->sortByDesc('total')
            ->values()
            ->all();
    }

    /** @return array<int, array<string, mixed>> */
    private function getCategoryTraffic(Builder $baseQuery): array
    {
        return ContractType::orderBy('name')
            ->get()
            ->map(function ($type) use ($baseQuery) {
                return [
                    'category_name' => $type->name,
                    'incoming_count' => (clone $baseQuery)->where('contract_type_id', $type->id)->whereIn('status', [ContractStatusEnum::InReview->value, ContractStatusEnum::Revision->value])->count(),
                    'outgoing_count' => (clone $baseQuery)->where('contract_type_id', $type->id)->whereIn('status', [ContractStatusEnum::Approved->value, ContractStatusEnum::Locked->value, 'archived'])->count(),
                ];
            })
            ->values()
            ->all();
    }

    /** @return array<int, array<string, mixed>> */
    private function getDepartmentTraffic(Builder $baseQuery): array
    {
        return Department::orderBy('name')
            ->get()
            ->map(function ($dept) use ($baseQuery) {
                $scopeFn = function (Builder $q) use ($dept): void {
                    $q->whereHas('initiator', fn (Builder $sq) => $sq->where('department_id', $dept->id))
                        ->orWhere(function (Builder $sq) use ($dept): void {
                            $sq->whereNull('initiated_by_id')
                                ->whereHas('creator', fn (Builder $ssq) => $ssq->where('department_id', $dept->id));
                        });
                };

                return [
                    'department_id' => $dept->id,
                    'department_name' => $dept->name,
                    'incoming_count' => (clone $baseQuery)->where($scopeFn)->whereIn('status', [ContractStatusEnum::InReview->value, ContractStatusEnum::Revision->value])->count(),
                    'outgoing_count' => (clone $baseQuery)->where($scopeFn)->whereIn('status', [ContractStatusEnum::Approved->value, ContractStatusEnum::Locked->value, 'archived'])->count(),
                    'member_count' => User::where('department_id', $dept->id)->count(),
                ];
            })
            ->values()
            ->all();
    }
}
