<?php

namespace App\Http\Controllers\Report;

use App\Exports\AuditReportExport;
use App\Exports\ContractReportExport;
use App\Exports\DivisionReportExport;
use App\Exports\TeamReportExport;
use App\Http\Controllers\Controller;
use App\Http\Queries\Master\UserQuery;
use App\Models\CompanyGroup;
use App\Models\Contract;
use App\Models\ContractHistory;
use App\Models\ContractType;
use App\Models\Workflow;
use App\Models\WorkflowStep;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends Controller
{
    public function __construct(
        protected UserQuery $userQuery,
    ) {}

    /**
     * Filter array or comma-separated string to ensure only valid UUIDs are queried
     */
    protected function filterUuids(mixed $ids): array
    {
        if (empty($ids)) {
            return [];
        }
        if (is_string($ids)) {
            $ids = explode(',', $ids);
        }
        if (! is_array($ids)) {
            return [];
        }

        return array_values(array_filter($ids, function ($id) {
            return is_string($id) && preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', trim($id));
        }));
    }

    /**
     * REST API: Analytics Report Data (Lean & Fast Summary)
     */
    public function analytics(Request $request): JsonResponse
    {
        $query = Contract::query();

        // 1. Date Range Filter
        if ($request->filled('date_from')) {
            $query->where('t_contracts.created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('t_contracts.created_at', '<=', $request->date_to.' 23:59:59');
        }

        // 2. Contract Types Multi-select
        $typeIds = $this->filterUuids($request->input('contract_type_ids'));
        if (! empty($typeIds)) {
            $query->whereIn('t_contracts.contract_type_id', $typeIds);
        }

        // 3. By Person: Creator (Pengaju)
        $creatorIds = $this->filterUuids($request->input('creator_ids', $request->input('user_ids')));
        if (! empty($creatorIds)) {
            $query->whereIn('t_contracts.created_by', $creatorIds);
        }

        // 4. By Person: Involved (Creator or Approver)
        $involvedIds = $this->filterUuids($request->input('involved_ids'));
        if (! empty($involvedIds)) {
            $query->where(function ($q) use ($involvedIds) {
                $q->whereIn('t_contracts.created_by', $involvedIds)
                    ->orWhereHas('approvals', function ($aq) use ($involvedIds) {
                        $aq->whereIn('user_id', $involvedIds);
                    });
            });
        }

        // 5. By Pengajuan (Contract ID)
        $contractIdsParam = $this->filterUuids($request->input('contract_ids', $request->input('contract_id')));
        if (! empty($contractIdsParam)) {
            $query->whereIn('t_contracts.id', $contractIdsParam);
        }

        // 6. By Workflow
        $workflowIds = $this->filterUuids($request->input('workflow_ids', $request->input('workflow_id')));
        if (! empty($workflowIds)) {
            $query->whereIn('t_contracts.workflow_id', $workflowIds);
        }

        // 7. By Status
        $statuses = $request->input('statuses', $request->input('status'));
        if ($statuses) {
            $statusArr = is_array($statuses) ? $statuses : explode(',', $statuses);
            $validStatuses = array_values(array_filter(array_map('trim', $statusArr)));
            if (! empty($validStatuses)) {
                $query->whereIn('t_contracts.status', $validStatuses);
            }
        }

        // 8. Search Keyword
        if ($request->filled('search')) {
            $search = $request->search;
            $likeOp = DB::getDriverName() === 'sqlite' ? 'like' : 'ilike';
            $query->where(function ($q) use ($search, $likeOp) {
                $q->where('t_contracts.title', $likeOp, "%{$search}%")
                    ->orWhere('t_contracts.form_no', $likeOp, "%{$search}%")
                    ->orWhere('t_contracts.contract_no', $likeOp, "%{$search}%");
            });
        }

        // Contract Registry List (Lean select & light relations)
        $page = $request->input('page', $request->input('contracts_page', 1));
        $perPage = $request->input('per_page', 25);

        $contractsList = (clone $query)
            ->select([
                't_contracts.id',
                't_contracts.form_no',
                't_contracts.contract_no',
                't_contracts.title',
                't_contracts.contract_type_id',
                't_contracts.submission_type_id',
                't_contracts.status',
                't_contracts.created_by',
                't_contracts.created_at',
            ])
            ->with([
                'creator:id,name',
                'contractType:id,name',
                'submissionType:id,name',
            ])
            ->orderByDesc('t_contracts.created_at')
            ->paginate($perPage, ['*'], 'page', $page);

        $contractsList->getCollection()->transform(function ($c) {
            return [
                'id' => $c->id,
                'form_no' => $c->form_no,
                'contract_no' => $c->contract_no,
                'title' => $c->title,
                'type' => $c->contractType?->name ?? '—',
                'submission_type' => $c->submissionType?->name ?? '—',
                'status' => $c->status,
                'creator' => $c->creator?->name ?? '—',
                'created_at' => $c->created_at ? $c->created_at->toIso8601String() : null,
            ];
        });

        // Only active users who have created contracts (lightweight ~50 records instead of 3,368)
        $usersList = DB::table('m_users')
            ->whereIn('id', function ($sub) {
                $sub->select('created_by')->from('t_contracts')->whereNotNull('created_by')->whereNull('deleted_at')->distinct();
            })
            ->where('is_used', true)
            ->whereNull('deleted_at')
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return response()->json([
            'contracts' => $contractsList,
            'users' => $usersList,
            'types' => ContractType::select('id', 'name')->orderBy('name')->get(),
            'workflows' => Workflow::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    /**
     * REST API: Audit Trail Report Data (Lean & Fast)
     */
    public function audit(Request $request): JsonResponse
    {
        $historiesQuery = DB::table('t_contract_h as h')
            ->leftJoin('t_contracts as c', 'h.contract_id', '=', 'c.id')
            ->leftJoin('m_contract_types as ct', 'c.contract_type_id', '=', 'ct.id')
            ->leftJoin('m_users as u', 'h.actor_id', '=', 'u.id')
            ->whereNull('h.deleted_at');

        // 1. Date Range
        if ($request->filled('date_from')) {
            $historiesQuery->where('h.created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $historiesQuery->where('h.created_at', '<=', $request->date_to.' 23:59:59');
        }

        // 2. By Person (Actor / User)
        $creatorIds = $this->filterUuids($request->input('creator_ids', $request->input('actor_ids', $request->input('user_ids'))));
        if (! empty($creatorIds)) {
            $historiesQuery->whereIn('h.actor_id', $creatorIds);
        }

        // 3. By Pengajuan / Contract ID
        $contractIds = $this->filterUuids($request->input('contract_ids', $request->input('contract_id')));
        if (! empty($contractIds)) {
            $historiesQuery->whereIn('h.contract_id', $contractIds);
        }

        // 4. By Tipe Kontrak
        $typeIds = $this->filterUuids($request->input('contract_type_ids'));
        if (! empty($typeIds)) {
            $historiesQuery->whereIn('c.contract_type_id', $typeIds);
        }

        // 5. By Action Event
        $actions = $request->input('actions', $request->input('action'));
        if ($actions) {
            $actArr = is_array($actions) ? $actions : explode(',', $actions);
            $validActions = array_values(array_filter(array_map('trim', $actArr)));
            if (! empty($validActions)) {
                $historiesQuery->where(function ($q) use ($validActions) {
                    foreach ($validActions as $act) {
                        $q->orWhere('h.action', 'ilike', "%{$act}%");
                    }
                });
            }
        }

        // 6. Keyword Search
        if ($request->filled('search')) {
            $search = $request->search;
            $likeOp = DB::getDriverName() === 'sqlite' ? 'like' : 'ilike';
            $historiesQuery->where(function ($q) use ($search, $likeOp) {
                $q->where('h.action', $likeOp, "%{$search}%")
                    ->orWhere('h.description', $likeOp, "%{$search}%")
                    ->orWhere('c.title', $likeOp, "%{$search}%")
                    ->orWhere('c.form_no', $likeOp, "%{$search}%")
                    ->orWhere('c.contract_no', $likeOp, "%{$search}%")
                    ->orWhere('u.name', $likeOp, "%{$search}%");
            });
        }

        $page = $request->input('page', $request->input('audit_page', 1));
        $perPage = $request->input('per_page', 25);

        $histories = $historiesQuery
            ->select([
                'h.id',
                'h.contract_id',
                'h.action',
                'h.description',
                'h.created_at',
                'c.form_no',
                'c.contract_no',
                'c.title as contract_title',
                'c.status as contract_status',
                'ct.name as contract_type',
                DB::raw("COALESCE(u.name, 'System') as actor"),
                'u.email as actor_email',
            ])
            ->orderByDesc('h.created_at')
            ->paginate($perPage, ['*'], 'page', $page);

        // Only actors who have history logs (lightweight list instead of 3368 users)
        $actorsList = DB::table('m_users')
            ->whereIn('id', function ($sub) {
                $sub->select('actor_id')->from('t_contract_h')->whereNotNull('actor_id')->whereNull('deleted_at')->distinct();
            })
            ->where('is_used', true)
            ->whereNull('deleted_at')
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        $distinctActions = DB::table('t_contract_h')
            ->select('action')
            ->distinct()
            ->whereNotNull('action')
            ->whereNull('deleted_at')
            ->orderBy('action')
            ->pluck('action');

        return response()->json([
            'histories' => $histories,
            'users' => $actorsList,
            'types' => ContractType::select('id', 'name')->orderBy('name')->get(),
            'actions' => $distinctActions,
        ]);
    }

    /**
     * Backward-compatible Combined Data Endpoint
     */
    public function index(Request $request): JsonResponse
    {
        $query = Contract::query();

        // Apply filters
        if ($request->filled('date_from')) {
            $query->where('t_contracts.created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('t_contracts.created_at', '<=', $request->date_to.' 23:59:59');
        }

        $typeIds = $this->filterUuids($request->input('contract_type_ids'));
        if (! empty($typeIds)) {
            $query->whereIn('t_contracts.contract_type_id', $typeIds);
        }

        $creatorIds = $this->filterUuids($request->input('creator_ids'));
        if (! empty($creatorIds)) {
            $query->whereIn('t_contracts.created_by', $creatorIds);
        }

        $involvedIds = $this->filterUuids($request->input('involved_ids'));
        if (! empty($involvedIds)) {
            $query->where(function ($q) use ($involvedIds) {
                $q->whereIn('t_contracts.created_by', $involvedIds)
                    ->orWhereHas('approvals', function ($aq) use ($involvedIds) {
                        $aq->whereIn('user_id', $involvedIds);
                    });
            });
        }

        $contractIds = (clone $query)->pluck('t_contracts.id');

        $approvedStats = DB::table('t_contracts')
            ->leftJoin('t_approvals', 't_contracts.id', '=', 't_approvals.contract_id')
            ->whereIn('t_contracts.id', $contractIds)
            ->where('t_contracts.status', 'approved')
            ->whereNull('t_contracts.deleted_at')
            ->select('t_contracts.id', 't_contracts.updated_at', DB::raw('MIN(t_approvals.created_at) as first_sent_at'))
            ->groupBy('t_contracts.id', 't_contracts.updated_at')
            ->get();

        $avgDays = 0;
        if ($approvedStats->count() > 0) {
            $totalDays = $approvedStats->sum(function ($c) {
                if (! $c->first_sent_at) {
                    return 0;
                }

                $firstSent = Carbon::parse($c->first_sent_at);
                $updatedAt = Carbon::parse($c->updated_at);

                return $firstSent->diffInHours($updatedAt) / 24;
            });
            $avgDays = round($totalDays / $approvedStats->count(), 1);
        }

        $bottlenecks = DB::table('t_approvals')
            ->whereIn('contract_id', $contractIds)
            ->where('status', 'pending')
            ->whereNull('deleted_at')
            ->select('role', DB::raw('count(*) as count'))
            ->groupBy('role')
            ->get();

        $statusDistribution = DB::table('t_contracts')
            ->whereIn('id', $contractIds)
            ->whereNull('deleted_at')
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get();

        $contractsPage = $request->input('contracts_page', $request->input('page', 1));
        $contractsPerPage = $request->input('per_page', 25);

        $contractsList = (clone $query)
            ->with([
                'creator:id,name,role_id',
                'contractType:id,name',
                'submissionType:id,name',
                'approvals' => fn ($q) => $q->where('status', 'pending')->select('id', 'contract_id', 'role', 'status'),
            ])
            ->orderByDesc('created_at')
            ->paginate($contractsPerPage, ['*'], 'contracts_page', $contractsPage);

        $contractsList->getCollection()->transform(function ($c) {
            return [
                'id' => $c->id,
                'form_no' => $c->form_no,
                'contract_no' => $c->contract_no,
                'title' => $c->title,
                'type' => $c->contractType?->name,
                'submission_type' => $c->submissionType?->name ?? '—',
                'status' => $c->status,
                'creator' => $c->creator?->name,
                'created_at' => $c->created_at->toIso8601String(),
                'age_days' => $c->created_at->diffInDays(now()),
                'current_step' => $c->approvals->first()?->role ?? '—',
            ];
        });

        $auditPage = $request->input('audit_page', 1);
        $histories = ContractHistory::whereIn('contract_id', $contractIds)
            ->with([
                'contract:id,form_no,contract_no,title',
                'actor:id,name,role_id',
            ])
            ->orderByDesc('created_at')
            ->paginate($contractsPerPage, ['*'], 'audit_page', $auditPage);

        $histories->getCollection()->transform(function ($h) {
            return [
                'id' => $h->id,
                'form_no' => $h->contract?->form_no,
                'contract_no' => $h->contract?->contract_no,
                'contract_title' => $h->contract?->title,
                'action' => $h->action,
                'description' => $h->description,
                'actor' => $h->actor?->name,
                'created_at' => $h->created_at->toIso8601String(),
            ];
        });

        $monthExpression = DB::getDriverName() === 'sqlite'
            ? "strftime('%Y-%m', t_contracts.created_at) as month"
            : "to_char(t_contracts.created_at, 'YYYY-MM') as month";

        $monthlyTrend = DB::table('t_contracts')
            ->leftJoin('m_contract_types', 't_contracts.contract_type_id', '=', 'm_contract_types.id')
            ->whereIn('t_contracts.id', $contractIds)
            ->where('t_contracts.created_at', '>=', now()->subMonths(6))
            ->whereNull('t_contracts.deleted_at')
            ->select(
                DB::raw($monthExpression),
                'm_contract_types.name as type_name',
                DB::raw('count(*) as count')
            )
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
            })->values();

        return response()->json([
            'metrics' => [
                'avgCycleTime' => $avgDays,
                'totalContracts' => $contractIds->count(),
                'pendingApprovals' => DB::table('t_approvals')->whereIn('contract_id', $contractIds)->where('status', 'pending')->whereNull('deleted_at')->count(),
                'approvedThisMonth' => DB::table('t_contracts')->whereIn('id', $contractIds)->where('status', 'approved')->where('updated_at', '>=', now()->startOfMonth())->whereNull('deleted_at')->count(),
            ],
            'contracts' => $contractsList,
            'histories' => $histories,
            'bottlenecks' => $bottlenecks,
            'statusDistribution' => $statusDistribution,
            'monthlyTrend' => $monthlyTrend,
            'users' => $this->userQuery->options()->get(),
            'types' => ContractType::select('id', 'name')->get(),
            'companies' => CompanyGroup::with('companies')->get(),
        ]);
    }

    public function exportAnalytics(Request $request)
    {
        return $this->exportCsv($request);
    }

    public function exportCsv(Request $request)
    {
        $query = Contract::with([
            'creator',
            'contractType',
            'submissionType',
            'workflow',
            'workflowStep',
            'assignedPic',
            'approvals' => fn ($q) => $q->where('status', 'pending')->with('approver'),
        ]);

        // Apply filters
        if ($request->filled('date_from')) {
            $query->where('t_contracts.created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('t_contracts.created_at', '<=', $request->date_to.' 23:59:59');
        }

        $typeIds = $this->filterUuids($request->input('contract_type_ids'));
        if (! empty($typeIds)) {
            $query->whereIn('t_contracts.contract_type_id', $typeIds);
        }

        $creatorIds = $this->filterUuids($request->input('creator_ids', $request->input('user_ids')));
        if (! empty($creatorIds)) {
            $query->whereIn('t_contracts.created_by', $creatorIds);
        }

        $involvedIds = $this->filterUuids($request->input('involved_ids'));
        if (! empty($involvedIds)) {
            $query->where(function ($q) use ($involvedIds) {
                $q->whereIn('t_contracts.created_by', $involvedIds)
                    ->orWhereHas('approvals', function ($aq) use ($involvedIds) {
                        $aq->whereIn('user_id', $involvedIds);
                    });
            });
        }

        $contractIdsParam = $this->filterUuids($request->input('contract_ids', $request->input('contract_id')));
        if (! empty($contractIdsParam)) {
            $query->whereIn('t_contracts.id', $contractIdsParam);
        }

        $workflowIds = $this->filterUuids($request->input('workflow_ids', $request->input('workflow_id')));
        if (! empty($workflowIds)) {
            $query->whereIn('t_contracts.workflow_id', $workflowIds);
        }

        $statuses = $request->input('statuses', $request->input('status'));
        if ($statuses) {
            $statusArr = is_array($statuses) ? $statuses : explode(',', $statuses);
            $validStatuses = array_values(array_filter(array_map('trim', $statusArr)));
            if (! empty($validStatuses)) {
                $query->whereIn('t_contracts.status', $validStatuses);
            }
        }

        $contracts = $query->orderByDesc('t_contracts.created_at')->get();

        $contractIds = $contracts->pluck('id');
        $latestHistories = ContractHistory::whereIn('contract_id', $contractIds)
            ->with('actor:id,name')
            ->orderByDesc('created_at')
            ->get()
            ->groupBy('contract_id')
            ->map(fn ($items) => $items->first());

        return Excel::download(new ContractReportExport($contracts, $latestHistories), 'rekap_kontrak_'.date('Ymd').'.xlsx');
    }

    public function exportAudit(Request $request)
    {
        return $this->exportAuditCsv($request);
    }

    public function exportAuditCsv(Request $request)
    {
        $historiesQuery = ContractHistory::with([
            'contract.contractType',
            'contract.workflowStep',
            'actor',
        ]);

        // Apply filters
        if ($request->filled('date_from')) {
            $historiesQuery->where('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $historiesQuery->where('created_at', '<=', $request->date_to.' 23:59:59');
        }

        $creatorIds = $this->filterUuids($request->input('creator_ids', $request->input('actor_ids', $request->input('user_ids'))));
        if (! empty($creatorIds)) {
            $historiesQuery->where(function ($q) use ($creatorIds) {
                $q->whereIn('actor_id', $creatorIds)
                    ->orWhereIn('created_by', $creatorIds);
            });
        }

        $contractIds = $this->filterUuids($request->input('contract_ids', $request->input('contract_id')));
        if (! empty($contractIds)) {
            $historiesQuery->whereIn('contract_id', $contractIds);
        }

        $typeIds = $this->filterUuids($request->input('contract_type_ids'));
        if (! empty($typeIds)) {
            $historiesQuery->whereHas('contract', function ($q) use ($typeIds) {
                $q->whereIn('contract_type_id', $typeIds);
            });
        }

        $actions = $request->input('actions', $request->input('action'));
        if ($actions) {
            $actArr = is_array($actions) ? $actions : explode(',', $actions);
            $validActions = array_values(array_filter(array_map('trim', $actArr)));
            if (! empty($validActions)) {
                $historiesQuery->where(function ($q) use ($validActions) {
                    foreach ($validActions as $act) {
                        $q->orWhere('action', 'like', "%{$act}%");
                    }
                });
            }
        }

        $histories = $historiesQuery->orderByDesc('created_at')->get();

        return Excel::download(new AuditReportExport($histories), 'audit_trail_'.date('Ymd').'.xlsx');
    }

    /**
     * REST API: Monthly Submissions by Organization Group Report Data
     */
    public function divisions(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! ($user && ($user->isAdmin() || $user->isSuperAdmin() || $user->isLegal()))) {
            return $this->errorResponse('Akses ditolak. Laporan ini hanya dapat diakses oleh bagian Legal.', 403);
        }

        $year = (int) $request->input('year', date('Y'));
        if ($year < 2000 || $year > 2100) {
            $year = (int) date('Y');
        }

        // Get all unique years from contracts for year selector (excluding draft)
        $availableYears = DB::table('t_contracts')
            ->selectRaw('DISTINCT EXTRACT(YEAR FROM created_at)::int as year')
            ->whereNull('deleted_at')
            ->where('status', '!=', 'draft')
            ->whereNotNull('created_at')
            ->orderByDesc('year')
            ->pluck('year')
            ->toArray();

        if (empty($availableYears)) {
            $availableYears = [$year];
        } elseif (! in_array($year, $availableYears)) {
            $availableYears[] = $year;
            rsort($availableYears);
        }

        // Master Organization Groups (with active users > 0 and is_used = true)
        $allOrgGroups = DB::table('m_organization_groups as og')
            ->join('m_departments as dept', function ($join) {
                $join->on('dept.idorg_group', '=', 'og.idorg_group')
                    ->orOn('dept.org_group_name', '=', 'og.name');
            })
            ->join('m_users as u', function ($join) {
                $join->on('u.department_id', '=', 'dept.id')
                    ->whereNull('u.deleted_at')
                    ->where('u.is_active', true)
                    ->where('u.is_used', true);
            })
            ->whereNull('og.deleted_at')
            ->where('og.is_active', true)
            ->where('og.is_used', true)
            ->select(['og.id', 'og.name', 'og.code', 'og.idorg_group', DB::raw('COUNT(DISTINCT u.id) as user_count')])
            ->groupBy('og.id', 'og.name', 'og.code', 'og.idorg_group')
            ->havingRaw('COUNT(DISTINCT u.id) > 0')
            ->orderBy('og.name')
            ->get();

        // Master Types
        $types = DB::table('m_contract_types')
            ->select(['id', 'name'])
            ->whereNull('deleted_at')
            ->orderBy('name')
            ->get();

        // Master Statuses (excluding draft)
        $statuses = DB::table('m_contract_statuses')
            ->select(['code', 'label'])
            ->whereNull('deleted_at')
            ->where('code', '!=', 'draft')
            ->orderBy('label')
            ->get();

        // Base query contracts (excluding draft)
        $query = DB::table('t_contracts as c')
            ->leftJoin('m_users as u', 'c.created_by', '=', 'u.id')
            ->leftJoin('m_departments as dept', 'u.department_id', '=', 'dept.id')
            ->leftJoin('m_organization_groups as og', function ($join) {
                $join->on('dept.idorg_group', '=', 'og.idorg_group')
                    ->orOn('dept.org_group_name', '=', 'og.name');
            })
            ->leftJoin('m_contract_types as ct', 'c.contract_type_id', '=', 'ct.id')
            ->whereNull('c.deleted_at')
            ->where('c.status', '!=', 'draft')
            ->whereYear('c.created_at', $year);

        // Filter organization groups
        $orgGroupIds = $this->filterUuids($request->input('organization_group_ids', $request->input('org_group_ids', $request->input('division_ids'))));
        if (! empty($orgGroupIds)) {
            $query->whereIn('og.id', $orgGroupIds);
        }

        // Filter contract types
        $typeIds = $this->filterUuids($request->input('contract_type_ids'));
        if (! empty($typeIds)) {
            $query->whereIn('c.contract_type_id', $typeIds);
        }

        // Filter statuses
        $statusInput = $request->input('statuses', $request->input('status'));
        if ($statusInput) {
            $statusArr = is_array($statusInput) ? $statusInput : explode(',', $statusInput);
            $validStatuses = array_values(array_filter(array_map('trim', $statusArr)));
            if (! empty($validStatuses)) {
                $query->whereIn('c.status', $validStatuses);
            }
        }

        // Search keyword
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('c.contract_no', 'like', "%{$search}%")
                    ->orWhere('c.title', 'like', "%{$search}%")
                    ->orWhere('og.name', 'like', "%{$search}%")
                    ->orWhere('dept.org_group_name', 'like', "%{$search}%")
                    ->orWhere('u.name', 'like', "%{$search}%");
            });
        }

        $monthNames = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
        ];

        $allOrgMap = $allOrgGroups->keyBy(fn ($item) => (string) $item->id);

        // Monthly Aggregations per Organization Group
        $monthlyOrgData = (clone $query)
            ->selectRaw("
                COALESCE(og.id::text, 'unassigned') as org_group_id,
                COALESCE(og.name, dept.org_group_name, 'Tanpa Organization Group') as org_group_name,
                COALESCE(og.code, dept.code, '-') as org_group_code,
                EXTRACT(MONTH FROM c.created_at)::int as month,
                COUNT(c.id) as total_count
            ")
            ->groupBy('og.id', 'og.name', 'dept.org_group_name', 'og.code', 'dept.code', DB::raw('EXTRACT(MONTH FROM c.created_at)'))
            ->get();

        $matrixOrgMap = [];
        foreach ($monthlyOrgData as $row) {
            $groupId = $row->org_group_id;
            if (! isset($matrixOrgMap[$groupId])) {
                $userCount = isset($allOrgMap[$groupId]) ? (int) $allOrgMap[$groupId]->user_count : 0;
                $matrixOrgMap[$groupId] = [
                    'org_group_id' => $groupId,
                    'org_group_name' => $row->org_group_name,
                    'org_group_code' => $row->org_group_code,
                    'division_id' => $groupId,
                    'division_name' => $row->org_group_name,
                    'division_code' => $row->org_group_code,
                    'user_count' => $userCount,
                    'months' => array_fill(1, 12, 0),
                    'total' => 0,
                    'average' => 0,
                ];
            }
            $matrixOrgMap[$groupId]['months'][(int) $row->month] = (int) $row->total_count;
            $matrixOrgMap[$groupId]['total'] += (int) $row->total_count;
        }

        if (empty($orgGroupIds)) {
            foreach ($allOrgGroups as $og) {
                $groupId = (string) $og->id;
                if (! isset($matrixOrgMap[$groupId])) {
                    $matrixOrgMap[$groupId] = [
                        'org_group_id' => $groupId,
                        'org_group_name' => $og->name,
                        'org_group_code' => $og->code ?? '-',
                        'division_id' => $groupId,
                        'division_name' => $og->name,
                        'division_code' => $og->code ?? '-',
                        'user_count' => (int) $og->user_count,
                        'months' => array_fill(1, 12, 0),
                        'total' => 0,
                        'average' => 0,
                    ];
                } else {
                    $matrixOrgMap[$groupId]['user_count'] = (int) $og->user_count;
                }
            }
        }

        $monthlyTotalsOrg = array_fill(1, 12, 0);
        $grandTotalOrg = 0;
        $activeOrgCount = 0;

        foreach ($matrixOrgMap as &$item) {
            $itemTotal = $item['total'];
            $item['average'] = round($itemTotal / 12, 1);
            if ($itemTotal > 0) {
                $activeOrgCount++;
            }
            for ($m = 1; $m <= 12; $m++) {
                $monthlyTotalsOrg[$m] += $item['months'][$m];
            }
            $grandTotalOrg += $itemTotal;
        }
        unset($item);

        $matrixOrgList = array_values($matrixOrgMap);
        usort($matrixOrgList, function ($a, $b) {
            if ($b['total'] === $a['total']) {
                return strcmp($a['org_group_name'], $b['org_group_name']);
            }
            return $b['total'] <=> $a['total'];
        });

        $topOrg = ! empty($matrixOrgList) && $matrixOrgList[0]['total'] > 0 ? [
            'name' => $matrixOrgList[0]['org_group_name'],
            'total' => $matrixOrgList[0]['total'],
            'code' => $matrixOrgList[0]['org_group_code'],
        ] : null;

        $peakMonthOrgNum = 1;
        $peakMonthOrgCount = 0;
        foreach ($monthlyTotalsOrg as $m => $count) {
            if ($count > $peakMonthOrgCount) {
                $peakMonthOrgCount = $count;
                $peakMonthOrgNum = $m;
            }
        }
        $peakMonthOrg = $peakMonthOrgCount > 0 ? [
            'month' => $peakMonthOrgNum,
            'name' => $monthNames[$peakMonthOrgNum],
            'total' => $peakMonthOrgCount,
        ] : null;

        $summaryOrg = [
            'totalSubmissions' => $grandTotalOrg,
            'avgPerMonth' => round($grandTotalOrg / 12, 1),
            'activeDivisionsCount' => $activeOrgCount,
            'totalDivisions' => count($allOrgGroups),
            'topDivision' => $topOrg,
            'peakMonth' => $peakMonthOrg,
        ];

        // Detail submissions list (latest 100 items)
        $submissions = (clone $query)
            ->select([
                'c.id',
                'c.contract_no',
                'c.title',
                'c.status',
                'c.created_at',
                'u.name as creator_name',
                DB::raw("COALESCE(og.name, dept.org_group_name, 'Tanpa Org Group') as division_name"),
                DB::raw("COALESCE(og.name, dept.org_group_name, 'Tanpa Org Group') as org_group_name"),
                DB::raw("COALESCE(og.code, dept.code, '-') as org_group_code"),
                'ct.name as contract_type_name',
            ])
            ->orderByDesc('c.created_at')
            ->limit(100)
            ->get();

        return response()->json([
            'status' => 'success',
            'year' => $year,
            'availableYears' => $availableYears,
            'organizationGroups' => $allOrgGroups,
            'divisions' => $allOrgGroups,
            'types' => $types,
            'statuses' => $statuses,
            'matrix' => $matrixOrgList,
            'monthlyTotals' => $monthlyTotalsOrg,
            'summary' => $summaryOrg,
            'submissions' => $submissions,
        ]);
    }

    /**
     * Export Monthly Organization Group Matrix to Excel
     */
    public function exportDivisions(Request $request)
    {
        $response = $this->divisions($request);
        if ($response->getStatusCode() !== 200) {
            return $response;
        }
        $data = $response->getData(true);

        $year = (int) ($data['year'] ?? date('Y'));
        $matrix = $data['matrix'] ?? [];
        $monthlyTotals = $data['monthlyTotals'] ?? [];
        $totalSubmissions = (int) ($data['summary']['totalSubmissions'] ?? 0);

        return Excel::download(
            new DivisionReportExport($year, $matrix, $monthlyTotals, $totalSubmissions),
            "laporan_pengajuan_org_group_{$year}.xlsx"
        );
    }

    /**
     * REST API: Monthly Contracts by Team Members in the Same Org Group (as Creator or PIC)
     */
    public function team(Request $request): JsonResponse
    {
        $year = (int) $request->input('year', date('Y'));
        if ($year < 2000 || $year > 2100) {
            $year = (int) date('Y');
        }

        $roleType = $request->input('role_type', 'creator') === 'pic' ? 'pic' : 'creator';

        // Get all unique years from contracts for year selector (excluding draft)
        $availableYears = DB::table('t_contracts')
            ->selectRaw('DISTINCT EXTRACT(YEAR FROM created_at)::int as year')
            ->whereNull('deleted_at')
            ->where('status', '!=', 'draft')
            ->whereNotNull('created_at')
            ->orderByDesc('year')
            ->pluck('year')
            ->toArray();

        if (empty($availableYears)) {
            $availableYears = [$year];
        } elseif (! in_array($year, $availableYears)) {
            $availableYears[] = $year;
            rsort($availableYears);
        }

        // Master Organization Groups (with active users > 0 and is_used = true)
        $allOrgGroups = DB::table('m_organization_groups as og')
            ->join('m_departments as dept', function ($join) {
                $join->on('dept.idorg_group', '=', 'og.idorg_group')
                    ->orOn('dept.org_group_name', '=', 'og.name');
            })
            ->join('m_users as u', function ($join) {
                $join->on('u.department_id', '=', 'dept.id')
                    ->whereNull('u.deleted_at')
                    ->where('u.is_active', true)
                    ->where('u.is_used', true);
            })
            ->whereNull('og.deleted_at')
            ->where('og.is_active', true)
            ->where('og.is_used', true)
            ->select(['og.id', 'og.name', 'og.code', 'og.idorg_group', DB::raw('COUNT(DISTINCT u.id) as user_count')])
            ->groupBy('og.id', 'og.name', 'og.code', 'og.idorg_group')
            ->havingRaw('COUNT(DISTINCT u.id) > 0')
            ->orderBy('og.name')
            ->get();

        // Determine active Org Group
        $orgGroupId = $request->input('org_group_id');
        $currentOrgGroup = null;

        if (! empty($orgGroupId)) {
            $currentOrgGroup = $allOrgGroups->firstWhere('id', $orgGroupId);
        }

        // If not specified or not found, try to resolve from logged-in user's department
        if (! $currentOrgGroup && $request->user()) {
            $userDept = DB::table('m_departments')
                ->where('id', $request->user()->department_id)
                ->first();

            if ($userDept) {
                $currentOrgGroup = $allOrgGroups->first(function ($og) use ($userDept) {
                    return ($userDept->idorg_group && $og->idorg_group == $userDept->idorg_group)
                        || ($userDept->org_group_name && strcasecmp($og->name, $userDept->org_group_name) === 0);
                });
            }
        }

        // Fallback: pick the first org group with non-draft activity or first in list
        if (! $currentOrgGroup && $allOrgGroups->isNotEmpty()) {
            $currentOrgGroup = $allOrgGroups->firstWhere('name', 'HO - COMMERCIAL & PROCUREMENT')
                ?: ($allOrgGroups->firstWhere('name', 'HO - LEGAL') ?: $allOrgGroups->first());
        }

        $monthNames = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
        ];

        if (! $currentOrgGroup) {
            return response()->json([
                'status' => 'success',
                'year' => $year,
                'availableYears' => $availableYears,
                'roleType' => $roleType,
                'currentOrgGroup' => null,
                'organizationGroups' => $allOrgGroups,
                'matrix' => [],
                'monthlyTotals' => array_fill(1, 12, 0),
                'summary' => [
                    'totalSubmissions' => 0,
                    'activeUsersCount' => 0,
                    'totalUsers' => 0,
                    'topUser' => null,
                    'peakMonth' => null,
                ],
            ]);
        }

        // Get all active users belonging to this Organization Group (is_used = true)
        $teamUsers = DB::table('m_users as u')
            ->join('m_departments as dept', 'u.department_id', '=', 'dept.id')
            ->leftJoin('m_division as d', 'u.division_id', '=', 'd.id')
            ->whereNull('u.deleted_at')
            ->where('u.is_active', true)
            ->where('u.is_used', true)
            ->where(function ($q) use ($currentOrgGroup) {
                $q->where('dept.idorg_group', $currentOrgGroup->idorg_group)
                    ->orWhere('dept.org_group_name', $currentOrgGroup->name);
            })
            ->select([
                'u.id as user_id',
                'u.name as user_name',
                'u.email as user_email',
                'u.nik as user_nik',
                DB::raw("COALESCE(d.name, 'Divisi') as division_name"),
                DB::raw("COALESCE(dept.org_group_name, '{$currentOrgGroup->name}') as org_group_name"),
            ])
            ->orderBy('u.name')
            ->get();

        // Query non-draft contracts for this year
        $contractQuery = DB::table('t_contracts as c')
            ->whereNull('c.deleted_at')
            ->where('c.status', '!=', 'draft')
            ->whereYear('c.created_at', $year);

        if ($roleType === 'pic') {
            $contractQuery->join('m_users as u', 'c.assigned_pic_id', '=', 'u.id');
        } else {
            $contractQuery->join('m_users as u', 'c.created_by', '=', 'u.id');
        }

        $contractQuery->join('m_departments as dept', 'u.department_id', '=', 'dept.id')
            ->where(function ($q) use ($currentOrgGroup) {
                $q->where('dept.idorg_group', $currentOrgGroup->idorg_group)
                    ->orWhere('dept.org_group_name', $currentOrgGroup->name);
            });

        // Search keyword filter
        if ($request->filled('search')) {
            $search = trim($request->search);
            $contractQuery->where(function ($q) use ($search) {
                $q->where('u.name', 'ilike', "%{$search}%")
                    ->orWhere('u.email', 'ilike', "%{$search}%")
                    ->orWhere('u.nik', 'ilike', "%{$search}%");
            });
        }

        $monthlyUserData = $contractQuery
            ->selectRaw('
                u.id as user_id,
                EXTRACT(MONTH FROM c.created_at)::int as month,
                COUNT(c.id) as total_count
            ')
            ->groupBy('u.id', DB::raw('EXTRACT(MONTH FROM c.created_at)'))
            ->get();

        // Initialize all users in this Org Group with 0s
        $matrixUserMap = [];
        foreach ($teamUsers as $u) {
            $uid = (string) $u->user_id;
            $matrixUserMap[$uid] = [
                'user_id' => $uid,
                'user_name' => $u->user_name,
                'user_email' => $u->user_email,
                'user_nik' => $u->user_nik,
                'division_name' => $u->division_name,
                'org_group_name' => $currentOrgGroup->name,
                'months' => array_fill(1, 12, 0),
                'total' => 0,
            ];
        }

        foreach ($monthlyUserData as $row) {
            $uid = (string) $row->user_id;
            if (isset($matrixUserMap[$uid])) {
                $matrixUserMap[$uid]['months'][(int) $row->month] = (int) $row->total_count;
                $matrixUserMap[$uid]['total'] += (int) $row->total_count;
            }
        }

        $monthlyTotals = array_fill(1, 12, 0);
        $grandTotal = 0;
        $activeUsersCount = 0;

        foreach ($matrixUserMap as &$item) {
            $itemTotal = $item['total'];
            if ($itemTotal > 0) {
                $activeUsersCount++;
            }
            for ($m = 1; $m <= 12; $m++) {
                $monthlyTotals[$m] += $item['months'][$m];
            }
            $grandTotal += $itemTotal;
        }
        unset($item);

        $matrixList = array_values($matrixUserMap);
        usort($matrixList, function ($a, $b) {
            if ($b['total'] === $a['total']) {
                return strcmp($a['user_name'], $b['user_name']);
            }
            return $b['total'] <=> $a['total'];
        });

        $topUser = ! empty($matrixList) && $matrixList[0]['total'] > 0 ? [
            'name' => $matrixList[0]['user_name'],
            'total' => $matrixList[0]['total'],
            'email' => $matrixList[0]['user_email'],
            'division' => $matrixList[0]['division_name'],
        ] : null;

        $peakMonthNum = 1;
        $peakMonthCount = 0;
        foreach ($monthlyTotals as $m => $count) {
            if ($count > $peakMonthCount) {
                $peakMonthCount = $count;
                $peakMonthNum = $m;
            }
        }
        $peakMonth = $peakMonthCount > 0 ? [
            'month' => $peakMonthNum,
            'name' => $monthNames[$peakMonthNum],
            'total' => $peakMonthCount,
        ] : null;

        return response()->json([
            'status' => 'success',
            'year' => $year,
            'availableYears' => $availableYears,
            'roleType' => $roleType,
            'currentOrgGroup' => $currentOrgGroup,
            'organizationGroups' => $allOrgGroups,
            'matrix' => $matrixList,
            'monthlyTotals' => $monthlyTotals,
            'summary' => [
                'totalSubmissions' => $grandTotal,
                'activeUsersCount' => $activeUsersCount,
                'totalUsers' => count($matrixList),
                'topUser' => $topUser,
                'peakMonth' => $peakMonth,
            ],
        ]);
    }

    /**
     * Export Monthly Team Matrix to Excel
     */
    public function exportTeam(Request $request)
    {
        $response = $this->team($request);
        $data = $response->getData(true);

        $year = (int) ($data['year'] ?? date('Y'));
        $roleType = $data['roleType'] ?? 'creator';
        $currentOrgGroup = $data['currentOrgGroup'] ?? null;
        $orgGroupName = $currentOrgGroup['name'] ?? 'Semua';
        $matrix = $data['matrix'] ?? [];
        $monthlyTotals = $data['monthlyTotals'] ?? [];
        $totalSubmissions = (int) ($data['summary']['totalSubmissions'] ?? 0);

        $sanitizedOrg = preg_replace('/[^A-Za-z0-9_\-]/', '_', strtolower($orgGroupName));

        return Excel::download(
            new TeamReportExport($year, $roleType, $orgGroupName, $matrix, $monthlyTotals, $totalSubmissions),
            "laporan_tim_{$roleType}_{$sanitizedOrg}_{$year}.xlsx"
        );
    }
}
