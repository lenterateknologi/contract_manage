<?php

namespace App\Http\Controllers\Report;

use App\Exports\AuditReportExport;
use App\Exports\ContractReportExport;
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
     * REST API: Analytics Report Data
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
                    ->orWhere('t_contracts.contract_no', $likeOp, "%{$search}%")
                    ->orWhereHas('creator', function ($cq) use ($search, $likeOp) {
                        $cq->where('name', $likeOp, "%{$search}%");
                    })
                    ->orWhereHas('workflow', function ($wq) use ($search, $likeOp) {
                        $wq->where('name', $likeOp, "%{$search}%");
                    });
            });
        }

        // Metrics calculation (based on filtered set)
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

        // Contract Registry List
        $page = $request->input('page', $request->input('contracts_page', 1));
        $perPage = $request->input('per_page', 25);

        $contractsList = (clone $query)
            ->with([
                'creator:id,name,role_id',
                'contractType:id,name',
                'submissionType:id,name',
                'workflow:id,name',
                'workflowStep:id,workflow_id,label,step,phase,approver_type',
                'assignedPic:id,name',
                'approvals' => fn ($q) => $q->where('status', 'pending')->with('approver:id,name')->select('id', 'contract_id', 'user_id', 'approver_name', 'role', 'status', 'step_number'),
            ])
            ->orderByDesc('created_at')
            ->paginate($perPage, ['*'], 'page', $page);

        $pageContractIds = $contractsList->getCollection()->pluck('id');
        $latestHistories = ContractHistory::whereIn('contract_id', $pageContractIds)
            ->with('actor:id,name')
            ->orderByDesc('created_at')
            ->get()
            ->groupBy('contract_id')
            ->map(fn ($items) => $items->first());

        $contractsList->getCollection()->transform(function ($c) use ($latestHistories) {
            $currentWorkflow = $c->workflow?->name ?? '—';
            $pendingApprovals = $c->approvals->where('status', 'pending');
            $pendingApproval = $pendingApprovals->first();
            $currentStepName = $c->workflowStep?->label
                ?? $pendingApproval?->role
                ?? ($c->current_step_number ? "Tahap {$c->current_step_number}" : '—');

            // Resolve Current Actors / Approvers for the step
            $actors = [];
            if ($pendingApprovals->isNotEmpty()) {
                $actors = $pendingApprovals->map(function ($a) {
                    return $a->approver?->name ?: ($a->approver_name ?: $a->role);
                })->filter()->unique()->values()->all();
            }

            if (empty($actors)) {
                if (in_array(strtolower((string) $c->status), ['draft', 'revision'])) {
                    $actors = array_filter([$c->creator?->name]);
                } elseif ($c->assignedPic) {
                    $actors = [$c->assignedPic->name];
                } elseif ($c->workflowStep?->approver_type === 'assigned_pic' && $c->assignedPic) {
                    $actors = [$c->assignedPic->name];
                } elseif ($c->workflowStep?->approver_type === 'creator' || $c->workflowStep?->approver_type === 'initiator') {
                    $actors = array_filter([$c->creator?->name]);
                }
            }

            $currentActorDisplay = ! empty($actors) ? implode(', ', $actors) : '—';

            // Resolve Last Action & Last Action By
            $lastHistory = $latestHistories->get($c->id);
            $lastActionBy = $lastHistory?->actor?->name
                ?? $c->creator?->name
                ?? '—';
            $lastAction = $lastHistory?->action ?? 'CREATE';
            $lastActionAt = $lastHistory?->created_at ? $lastHistory->created_at->toIso8601String() : $c->updated_at?->toIso8601String();
            $lastActionDescription = $lastHistory?->description ?? '—';

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
                'current_workflow' => $currentWorkflow,
                'current_step' => $currentStepName,
                'current_step_number' => $c->current_step_number ?? $c->workflowStep?->step,
                'current_actor' => $currentActorDisplay,
                'current_actors' => $actors,
                'last_action_by' => $lastActionBy,
                'last_action' => $lastAction,
                'last_action_at' => $lastActionAt,
                'last_action_description' => $lastActionDescription,
            ];
        });

        // Monthly Trend
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
            'bottlenecks' => $bottlenecks,
            'statusDistribution' => $statusDistribution,
            'monthlyTrend' => $monthlyTrend,
            'users' => $this->userQuery->options()->get(),
            'types' => ContractType::select('id', 'name')->get(),
            'workflows' => Workflow::select('id', 'name')->get(),
            'companies' => CompanyGroup::with('companies')->get(),
        ]);
    }

    /**
     * REST API: Audit Trail Report Data
     */
    public function audit(Request $request): JsonResponse
    {
        $historiesQuery = ContractHistory::query()
            ->with([
                'contract:id,form_no,contract_no,title,contract_type_id,workflow_id,workflow_step_id,status',
                'contract.contractType:id,name',
                'contract.workflowStep:id,workflow_id,label,step',
                'actor',
            ]);

        // 1. Date Range
        if ($request->filled('date_from')) {
            $historiesQuery->where('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $historiesQuery->where('created_at', '<=', $request->date_to.' 23:59:59');
        }

        // 2. By Person (Actor / User)
        $creatorIds = $this->filterUuids($request->input('creator_ids', $request->input('actor_ids', $request->input('user_ids'))));
        if (! empty($creatorIds)) {
            $historiesQuery->where(function ($q) use ($creatorIds) {
                $q->whereIn('actor_id', $creatorIds)
                    ->orWhereIn('created_by', $creatorIds);
            });
        }

        // 3. By Pengajuan / Contract ID
        $contractIds = $this->filterUuids($request->input('contract_ids', $request->input('contract_id')));
        if (! empty($contractIds)) {
            $historiesQuery->whereIn('contract_id', $contractIds);
        }

        // 4. By Tipe Kontrak
        $typeIds = $this->filterUuids($request->input('contract_type_ids'));
        if (! empty($typeIds)) {
            $historiesQuery->whereHas('contract', function ($q) use ($typeIds) {
                $q->whereIn('contract_type_id', $typeIds);
            });
        }

        // 5. By Action Event
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

        // 6. Keyword Search
        if ($request->filled('search')) {
            $search = $request->search;
            $likeOp = DB::getDriverName() === 'sqlite' ? 'like' : 'ilike';
            $historiesQuery->where(function ($q) use ($search, $likeOp) {
                $q->where('action', $likeOp, "%{$search}%")
                    ->orWhere('description', $likeOp, "%{$search}%")
                    ->orWhereHas('contract', function ($cq) use ($search, $likeOp) {
                        $cq->where('title', $likeOp, "%{$search}%")
                            ->orWhere('form_no', $likeOp, "%{$search}%")
                            ->orWhere('contract_no', $likeOp, "%{$search}%");
                    })
                    ->orWhereHas('actor', function ($aq) use ($search, $likeOp) {
                        $aq->where('name', $likeOp, "%{$search}%")
                            ->orWhere('email', $likeOp, "%{$search}%");
                    });
            });
        }

        $page = $request->input('page', $request->input('audit_page', 1));
        $perPage = $request->input('per_page', 25);

        $histories = $historiesQuery->orderByDesc('created_at')
            ->paginate($perPage, ['*'], 'page', $page);

        $histories->getCollection()->transform(function ($h) {
            $stepName = $h->contract?->workflowStep?->label;

            $actorRole = $h->actor?->jobtitle_name
                ?? $h->actor?->joblevel_name
                ?? null;

            $actorDept = $h->actor?->department_name
                ?? $h->actor?->org_name
                ?? null;

            $actorDiv = $h->actor?->division_name
                ?? $h->actor?->company_name
                ?? null;

            return [
                'id' => $h->id,
                'contract_id' => $h->contract_id,
                'form_no' => $h->contract?->form_no,
                'contract_no' => $h->contract?->contract_no,
                'contract_title' => $h->contract?->title,
                'contract_status' => $h->contract?->status,
                'contract_type' => $h->contract?->contractType?->name,
                'action' => $h->action,
                'description' => $h->description,
                'actor' => $h->actor?->name ?? 'System',
                'actor_id' => $h->actor_id,
                'actor_email' => $h->actor?->email,
                'actor_role' => $actorRole,
                'actor_department' => $actorDept,
                'actor_division' => $actorDiv,
                'step_name' => $stepName,
                'step_number' => $h->contract?->workflowStep?->step,
                'created_at' => $h->created_at ? $h->created_at->toIso8601String() : null,
            ];
        });

        // Quick options for contracts and distinct actions to enrich filter UI
        $contractsOptions = Contract::select('id', 'form_no', 'contract_no', 'title')
            ->orderByDesc('created_at')
            ->limit(100)
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'name' => ($c->form_no ?: $c->contract_no ?: 'ID: ' . substr($c->id, 0, 8)) . ' - ' . $c->title,
            ]);

        $distinctActions = ContractHistory::select('action')
            ->distinct()
            ->orderBy('action')
            ->pluck('action');

        return response()->json([
            'histories' => $histories,
            'users' => $this->userQuery->options()->get(),
            'types' => ContractType::select('id', 'name')->get(),
            'contracts' => $contractsOptions,
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
}
