<?php

namespace App\Http\Controllers;

use App\Exports\AuditReportExport;
use App\Exports\ContractReportExport;
use App\Models\Approval;
use App\Models\Contract;
use App\Models\ContractHistory;
use App\Models\ContractType;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Contract::query();

        // Apply filters
        if ($request->filled('date_from')) {
            $query->where('t_contracts.created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('t_contracts.created_at', '<=', $request->date_to . ' 23:59:59');
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
        $approvedContracts = (clone $query)->where('status', 'approved')->get();
        $avgDays = 0;
        if ($approvedContracts->count() > 0) {
            $totalDays = $approvedContracts->sum(function ($c) {
                $firstSentAt = Approval::where('contract_id', $c->id)->oldest()->value('created_at');
                if (! $firstSentAt) {
                    return 0;
                }

                return $firstSentAt->diffInHours($c->updated_at) / 24;
            });
            $avgDays = round($totalDays / $approvedContracts->count(), 1);
        }

        $contractIds = (clone $query)->pluck('id');
        $bottlenecks = Approval::whereIn('contract_id', $contractIds)
            ->where('status', 'pending')
            ->select('role', DB::raw('count(*) as count'))
            ->groupBy('role')
            ->get();

        $statusDistribution = (clone $query)->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get();

        // Contract Registry List
        $contractsPage = $request->input('contracts_page', 1);
        $contractsPerPage = $request->input('per_page', 10);

        $contractsList = (clone $query)->with(['creator', 'contractType', 'submissionType', 'approvals.approver'])
            ->orderByDesc('created_at')
            ->paginate($contractsPerPage, ['*'], 'contracts_page', $contractsPage);

        $contractsList->getCollection()->transform(function ($c) {
            return [
                'id' => $c->id,
                'contract_no' => $c->contract_no,
                'title' => $c->title,
                'type' => $c->contractType?->name,
                'submission_type' => $c->submissionType?->name ?? '—',
                'status' => $c->status,
                'creator' => $c->creator?->name,
                'created_at' => $c->created_at->toIso8601String(),
                'age_days' => $c->created_at->diffInDays(now()),
                'current_step' => $c->approvals->where('status', 'pending')->first()?->role ?? '—',
            ];
        });

        // Audit Trail (Histories)
        $auditPage = $request->input('audit_page', 1);
        $histories = ContractHistory::whereIn('contract_id', $contractIds)
            ->with(['contract', 'actor'])
            ->orderByDesc('created_at')
            ->paginate($contractsPerPage, ['*'], 'audit_page', $auditPage);

        $histories->getCollection()->transform(function ($h) {
            return [
                'id' => $h->id,
                'contract_no' => $h->contract->contract_no,
                'contract_title' => $h->contract->title,
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

        $monthlyTrend = (clone $query)->leftJoin('m_contract_types', 't_contracts.contract_type_id', '=', 'm_contract_types.id')
            ->select(
                DB::raw($monthExpression),
                'm_contract_types.name as type_name',
                DB::raw('count(*) as count'),
            )
            ->where('t_contracts.created_at', '>=', now()->subMonths(6))
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
                'totalContracts' => (clone $query)->count(),
                'pendingApprovals' => Approval::whereIn('contract_id', $contractIds)->where('status', 'pending')->count(),
                'approvedThisMonth' => (clone $query)->where('status', 'approved')
                    ->where('updated_at', '>=', now()->startOfMonth())
                    ->count(),
            ],
            'contracts' => $contractsList,
            'histories' => $histories,
            'bottlenecks' => $bottlenecks,
            'statusDistribution' => $statusDistribution,
            'monthlyTrend' => $monthlyTrend,
            'users' => User::select('id', 'name')->get(),
            'types' => ContractType::select('id', 'name')->get(),
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
            $query->where('t_contracts.created_at', '<=', $request->date_to . ' 23:59:59');
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

        return Excel::download(new ContractReportExport($contracts), 'rekap_kontrak_' . date('Ymd') . '.xlsx');
    }

    public function exportAuditCsv(Request $request)
    {
        $query = Contract::query();

        // Apply filters
        if ($request->filled('date_from')) {
            $query->where('t_contracts.created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('t_contracts.created_at', '<=', $request->date_to . ' 23:59:59');
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

        return Excel::download(new AuditReportExport($histories), 'audit_trail_' . date('Ymd') . '.xlsx');
    }
}
