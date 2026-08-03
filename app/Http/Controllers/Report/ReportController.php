<?php

namespace App\Http\Controllers\Report;

use App\Exports\AuditReportExport;
use App\Exports\ContractReportExport;
use App\Http\Controllers\Controller;
use App\Http\Queries\Master\UserQuery;
use App\Models\Approval;
use App\Models\CompanyGroup;
use App\Models\Contract;
use App\Models\ContractHistory;
use App\Models\ContractType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends Controller
{
    public function __construct(
        protected UserQuery $userQuery,
    ) {}

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

        // Multi-select filters - only apply if not empty
        $typeIds = $request->input('contract_type_ids');
        if (is_array($typeIds) && count($typeIds) > 0) {
            $query->whereIn('t_contracts.contract_type_id', $typeIds);
        }

        $creatorIds = $request->input('creator_ids');
        if (is_array($creatorIds) && count($creatorIds) > 0) {
            $query->whereIn('t_contracts.created_by', $creatorIds);
        }

        $involvedIds = $request->input('involved_ids');
        if (is_array($involvedIds) && count($involvedIds) > 0) {
            $query->where(function ($q) use ($involvedIds) {
                $q->whereIn('t_contracts.created_by', $involvedIds)
                    ->orWhereHas('approvals', function ($aq) use ($involvedIds) {
                        $aq->whereIn('user_id', $involvedIds);
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

                $firstSent = \Carbon\Carbon::parse($c->first_sent_at);
                $updatedAt = \Carbon\Carbon::parse($c->updated_at);

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
        $contractsPage = $request->input('contracts_page', 1);
        $contractsPerPage = $request->input('per_page', 10);

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

        // Audit Trail (Histories)
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
            'histories' => $histories,
            'bottlenecks' => $bottlenecks,
            'statusDistribution' => $statusDistribution,
            'monthlyTrend' => $monthlyTrend,
            'users' => $this->userQuery->options()->get(),
            'types' => ContractType::select('id', 'name')->get(),
            'companies' => CompanyGroup::with('companies')->get(),
        ]);
    }

    public function exportCsv(Request $request)
    {
        $query = Contract::with(['creator', 'contractType', 'submissionType']);

        // Apply filters
        if ($request->filled('date_from')) {
            $query->where('t_contracts.created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('t_contracts.created_at', '<=', $request->date_to.' 23:59:59');
        }

        // Multi-select filters
        $typeIds = $request->input('contract_type_ids');
        if (is_array($typeIds) && count($typeIds) > 0) {
            $query->whereIn('t_contracts.contract_type_id', $typeIds);
        }

        $creatorIds = $request->input('creator_ids');
        if (is_array($creatorIds) && count($creatorIds) > 0) {
            $query->whereIn('t_contracts.created_by', $creatorIds);
        }

        $involvedIds = $request->input('involved_ids');
        if (is_array($involvedIds) && count($involvedIds) > 0) {
            $query->where(function ($q) use ($involvedIds) {
                $q->whereIn('t_contracts.created_by', $involvedIds)
                    ->orWhereHas('approvals', function ($aq) use ($involvedIds) {
                        $aq->whereIn('user_id', $involvedIds);
                    });
            });
        }

        $contracts = $query->orderByDesc('t_contracts.created_at')->get();

        return Excel::download(new ContractReportExport($contracts), 'rekap_kontrak_'.date('Ymd').'.xlsx');
    }

    public function exportAuditCsv(Request $request)
    {
        $query = Contract::query();

        // Apply filters
        if ($request->filled('date_from')) {
            $query->where('t_contracts.created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('t_contracts.created_at', '<=', $request->date_to.' 23:59:59');
        }

        // Multi-select filters
        $typeIds = $request->input('contract_type_ids');
        if (is_array($typeIds) && count($typeIds) > 0) {
            $query->whereIn('t_contracts.contract_type_id', $typeIds);
        }

        $creatorIds = $request->input('creator_ids');
        if (is_array($creatorIds) && count($creatorIds) > 0) {
            $query->whereIn('t_contracts.created_by', $creatorIds);
        }

        $involvedIds = $request->input('involved_ids');
        if (is_array($involvedIds) && count($involvedIds) > 0) {
            $query->where(function ($q) use ($involvedIds) {
                $q->whereIn('t_contracts.created_by', $involvedIds)
                    ->orWhereHas('approvals', function ($aq) use ($involvedIds) {
                        $aq->whereIn('user_id', $involvedIds);
                    });
            });
        }

        $contractIds = $query->pluck('id');
        $histories = ContractHistory::with(['contract', 'actor'])
            ->whereIn('contract_id', $contractIds)
            ->orderByDesc('created_at')
            ->get();

        return Excel::download(new AuditReportExport($histories), 'audit_trail_'.date('Ymd').'.xlsx');
    }
}
