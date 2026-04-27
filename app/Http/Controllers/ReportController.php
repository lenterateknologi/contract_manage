<?php

namespace App\Http\Controllers;

use App\Models\Approval;
use App\Models\Contract;
use App\Models\ContractHistory;
use App\Models\ContractType;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Contract::query();

        // Apply filters
        if ($request->filled('date_from')) {
            $query->where('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('created_at', '<=', $request->date_to . ' 23:59:59');
        }

        // Multi-select filters - only apply if not empty
        $typeIds = $request->input('contract_type_ids');
        if (is_array($typeIds) && count($typeIds) > 0) {
            $query->whereIn('contract_type_id', $typeIds);
        }

        $creatorIds = $request->input('creator_ids');
        if (is_array($creatorIds) && count($creatorIds) > 0) {
            $query->whereIn('created_by', $creatorIds);
        }

        $involvedIds = $request->input('involved_ids');
        if (is_array($involvedIds) && count($involvedIds) > 0) {
            $query->where(function ($q) use ($involvedIds) {
                $q->whereIn('created_by', $involvedIds)
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
                if (!$firstSentAt) {
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
        $contractsList = (clone $query)->with(['creator', 'contractType', 'approvals.approver'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($c) {
                return [
                    'id' => $c->id,
                    'contract_no' => $c->contract_no,
                    'title' => $c->title,
                    'type' => $c->contractType?->name,
                    'status' => $c->status,
                    'creator' => $c->creator?->name,
                    'created_at' => $c->created_at->toIso8601String(),
                    'age_days' => $c->created_at->diffInDays(now()),
                    'current_step' => $c->approvals->where('status', 'pending')->first()?->role ?? '—',
                ];
            });

        // Audit Trail (Histories)
        $histories = ContractHistory::whereIn('contract_id', $contractIds)
            ->with(['contract', 'actor'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($h) {
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
        $monthlyTrend = (clone $query)->leftJoin('m_contract_types', 't_contracts.contract_type_id', '=', 'm_contract_types.id')
            ->select(
                DB::raw("to_char(t_contracts.created_at, 'YYYY-MM') as month"),
                'm_contract_types.name as type_name',
                DB::raw('count(*) as count')
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

    public function exportCsv(Request $request): StreamedResponse
    {
        $query = Contract::with(['creator', 'contractType']);

        // Apply filters
        if ($request->filled('date_from')) {
            $query->where('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('created_at', '<=', $request->date_to . ' 23:59:59');
        }

        // Multi-select filters
        $typeIds = $request->input('contract_type_ids');
        if (is_array($typeIds) && count($typeIds) > 0) {
            $query->whereIn('contract_type_id', $typeIds);
        }

        $creatorIds = $request->input('creator_ids');
        if (is_array($creatorIds) && count($creatorIds) > 0) {
            $query->whereIn('created_by', $creatorIds);
        }

        $involvedIds = $request->input('involved_ids');
        if (is_array($involvedIds) && count($involvedIds) > 0) {
            $query->where(function ($q) use ($involvedIds) {
                $q->whereIn('created_by', $involvedIds)
                    ->orWhereHas('approvals', function ($aq) use ($involvedIds) {
                        $aq->whereIn('user_id', $involvedIds);
                    });
            });
        }

        $contracts = $query->orderByDesc('created_at')->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="rekap_kontrak_' . date('Ymd') . '.csv"',
        ];

        return new StreamedResponse(function () use ($contracts) {
            $handle = fopen('php://output', 'w');

            // Add BOM for Excel UTF-8 support
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));

            // Headers
            fputcsv($handle, [
                'ID',
                'No. Kontrak',
                'Judul',
                'Tipe',
                'Status',
                'Pembuat',
                'Tgl Dibuat',
                'Versi Terakhir',
                'Deskripsi',
            ]);

            foreach ($contracts as $c) {
                fputcsv($handle, [
                    $c->id,
                    $c->contract_no,
                    $c->title,
                    $c->contractType?->name ?? '—',
                    strtoupper($c->status),
                    $c->creator?->name ?? '—',
                    $c->created_at->toDateString(),
                    $c->current_version,
                    $c->description,
                ]);
            }

            fclose($handle);
        }, 200, $headers);
    }

    public function exportAuditCsv(Request $request): StreamedResponse
    {
        $query = Contract::query();

        // Apply filters
        if ($request->filled('date_from')) {
            $query->where('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('created_at', '<=', $request->date_to . ' 23:59:59');
        }

        // Multi-select filters
        $typeIds = $request->input('contract_type_ids');
        if (is_array($typeIds) && count($typeIds) > 0) {
            $query->whereIn('contract_type_id', $typeIds);
        }

        $creatorIds = $request->input('creator_ids');
        if (is_array($creatorIds) && count($creatorIds) > 0) {
            $query->whereIn('created_by', $creatorIds);
        }

        $involvedIds = $request->input('involved_ids');
        if (is_array($involvedIds) && count($involvedIds) > 0) {
            $query->where(function ($q) use ($involvedIds) {
                $q->whereIn('created_by', $involvedIds)
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

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="audit_trail_' . date('Ymd') . '.csv"',
        ];

        return new StreamedResponse(function () use ($histories) {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF)); // BOM

            fputcsv($handle, [
                'Waktu',
                'No. Kontrak',
                'Judul Kontrak',
                'Aksi',
                'Deskripsi',
                'Aktor',
            ]);

            foreach ($histories as $h) {
                fputcsv($handle, [
                    $h->created_at->toDateTimeString(),
                    $h->contract->contract_no,
                    $h->contract->title,
                    strtoupper($h->action),
                    $h->description,
                    $h->actor?->name ?? '—',
                ]);
            }
            fclose($handle);
        }, 200, $headers);
    }
}
