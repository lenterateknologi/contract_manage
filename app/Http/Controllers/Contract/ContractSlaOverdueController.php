<?php

namespace App\Http\Controllers\Contract;

use App\Http\Controllers\Controller;
use App\Http\Queries\Contract\ContractListQuery;
use App\Models\Master\User;
use App\Models\Transaction\Contract;
use App\Models\Transaction\ContractHistory;
use App\Notifications\ContractSlaOverdueNotification;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ContractSlaOverdueController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected ContractListQuery $contractListQuery,
    ) {}

    /**
     * Get all overdue contracts accessible by the authenticated user.
     * Evaluates:
     * 1. Durasi Total Pengajuan (Lead Time) -> default 3 hari (SLA_DEFAULT_LEAD_TIME_DAYS)
     * 2. Durasi Pengerjaan PIC (Processing Time) -> default 10 hari (SLA_DEFAULT_PROCESSING_TIME_DAYS)
     */
    public function index(Request $request): JsonResponse
    {
        $leadTimeLimit = (int) ($request->input('lead_time_days') ?: config('master.sla.default_lead_time_days', 3));
        $processingTimeLimit = (int) ($request->input('processing_time_days') ?: config('master.sla.default_processing_time_days', 10));
        $slaTypeFilter = $request->input('sla_type', 'all'); // 'all', 'lead_time', 'processing_time', 'both'

        // 1. Build base query with organizational scoping and user accessibility
        $query = $this->contractListQuery->build($request, 'contracts', true);

        // 2. Filter out completed, signed, rejected, closed, or archived contracts
        $query->whereNotIn(DB::raw('UPPER(status)'), [
            'COMPLETED', 'SIGNED', 'REJECTED', 'ARCHIVED', 'CANCELLED', 'CLOSED',
        ])
            ->whereNull('closed_at')
            ->whereNull('finished_at');

        // Eager load assignedBy and supervisor
        $query->with([
            'assignedBy:id,name,email,role_id,department_id,division_id,company_id,phone_number,mobile_no',
            'assignedBy.department:id,name',
            'assignedPic:id,name,email,role_id,department_id,division_id,company_id,phone_number,mobile_no',
            'assignedPic.department:id,name',
            'creator.supervisor:id,name,email',
        ]);

        $contracts = $query->get();
        $now = Carbon::now();

        // 3. Process each contract and compute SLA overdue statuses
        $overdueContracts = $contracts->map(function (Contract $contract) use ($now, $leadTimeLimit, $processingTimeLimit) {
            // A. Lead Time Calculation (Baseline: submitted_at or created_at)
            $leadTimeStart = $contract->submitted_at ? Carbon::parse($contract->submitted_at) : Carbon::parse($contract->created_at);
            $leadTimeElapsedDays = (int) $leadTimeStart->diffInDays($now);
            $leadTimeDueAt = $leadTimeStart->copy()->addDays($leadTimeLimit);
            $isLeadTimeOverdue = $leadTimeElapsedDays >= $leadTimeLimit;
            $leadTimeOverdueDays = $isLeadTimeOverdue ? ($leadTimeElapsedDays - $leadTimeLimit) : 0;

            // B. Processing Time Calculation (Baseline: assigned_at)
            $assignedAt = $contract->assigned_at ? Carbon::parse($contract->assigned_at) : null;
            $processingTimeElapsedDays = $assignedAt ? (int) $assignedAt->diffInDays($now) : null;
            $processingTimeDueAt = $assignedAt ? $assignedAt->copy()->addDays($processingTimeLimit) : null;
            $isProcessingTimeOverdue = $processingTimeElapsedDays !== null && $processingTimeElapsedDays >= $processingTimeLimit;
            $processingTimeOverdueDays = $isProcessingTimeOverdue ? ($processingTimeElapsedDays - $processingTimeLimit) : 0;

            // Determine manager / Ditugaskan Oleh
            $assignedBy = $contract->assignedBy ?: ($contract->creator?->supervisor ?: null);

            $overdueTypes = [];
            if ($isLeadTimeOverdue) {
                $overdueTypes[] = 'lead_time';
            }
            if ($isProcessingTimeOverdue) {
                $overdueTypes[] = 'processing_time';
            }

            return [
                'id' => $contract->id,
                'contract_no' => $contract->contract_no,
                'form_no' => $contract->form_no,
                'title' => $contract->title,
                'status' => $contract->status,
                'status_detail' => $contract->statusDetail,
                'contract_type' => $contract->contractType ? [
                    'id' => $contract->contractType->id,
                    'name' => $contract->contractType->name,
                ] : null,
                'vendor' => $contract->vendor ? [
                    'id' => $contract->vendor->id,
                    'name' => $contract->vendor->vendor_name,
                ] : null,
                'initiator' => $contract->initiator ? [
                    'id' => $contract->initiator->id,
                    'name' => $contract->initiator->name,
                    'department' => $contract->initiator->department?->name,
                ] : null,
                'assigned_pic' => $contract->assignedPic ? [
                    'id' => $contract->assignedPic->id,
                    'name' => $contract->assignedPic->name,
                    'email' => $contract->assignedPic->email,
                    'department' => $contract->assignedPic->department?->name,
                ] : null,
                'assigned_by' => $assignedBy ? [
                    'id' => $assignedBy->id,
                    'name' => $assignedBy->name,
                    'email' => $assignedBy->email,
                    'role' => $assignedBy->role ?? null,
                    'department' => $assignedBy->department?->name ?? null,
                ] : null,
                'created_at' => $contract->created_at?->toIso8601String(),
                'submitted_at' => $contract->submitted_at ? Carbon::parse($contract->submitted_at)->toIso8601String() : null,
                'assigned_at' => $contract->assigned_at ? Carbon::parse($contract->assigned_at)->toIso8601String() : null,
                'sla_info' => [
                    'is_overdue' => ! empty($overdueTypes),
                    'overdue_types' => $overdueTypes,
                    'lead_time' => [
                        'limit_days' => $leadTimeLimit,
                        'elapsed_days' => $leadTimeElapsedDays,
                        'is_overdue' => $isLeadTimeOverdue,
                        'overdue_days' => $leadTimeOverdueDays,
                        'started_at' => $leadTimeStart->toIso8601String(),
                        'due_at' => $leadTimeDueAt->toIso8601String(),
                    ],
                    'processing_time' => [
                        'limit_days' => $processingTimeLimit,
                        'elapsed_days' => $processingTimeElapsedDays,
                        'is_overdue' => $isProcessingTimeOverdue,
                        'overdue_days' => $processingTimeOverdueDays,
                        'started_at' => $assignedAt?->toIso8601String(),
                        'due_at' => $processingTimeDueAt?->toIso8601String(),
                    ],
                ],
            ];
        })->filter(function ($item) use ($slaTypeFilter) {
            $isLead = $item['sla_info']['lead_time']['is_overdue'];
            $isProc = $item['sla_info']['processing_time']['is_overdue'];

            return match ($slaTypeFilter) {
                'lead_time' => $isLead,
                'processing_time' => $isProc,
                'both' => $isLead && $isProc,
                default => $isLead || $isProc, // 'all' or 'any'
            };
        })->values();

        // 4. Manual pagination or collection return
        $perPage = (int) $request->input('per_page', 15);
        $page = (int) $request->input('page', 1);
        $total = $overdueContracts->count();
        $paginated = $overdueContracts->forPage($page, $perPage)->values();

        return $this->successResponse([
            'data' => $paginated,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => (int) ceil($total / max($perPage, 1)),
            ],
            'meta' => [
                'lead_time_days_default' => $leadTimeLimit,
                'processing_time_days_default' => $processingTimeLimit,
                'total_overdue' => $total,
                'total_lead_time_overdue' => $overdueContracts->where('sla_info.lead_time.is_overdue', true)->count(),
                'total_processing_time_overdue' => $overdueContracts->where('sla_info.processing_time.is_overdue', true)->count(),
            ],
        ], 'Daftar pengajuan kontrak melebihi SLA berhasil diambil.');
    }

    /**
     * Send notification to "Ditugaskan Oleh (Manager)" for a specific overdue contract.
     */
    public function notifyManager(Request $request, string $id): JsonResponse
    {
        $contract = Contract::with(['assignedBy', 'assignedPic', 'creator.supervisor', 'statusDetail'])->findOrFail($id);

        // Check Ditugaskan Oleh (Manager)
        $manager = $contract->assignedBy ?: ($contract->creator?->supervisor ?: null);

        if (! $manager) {
            return $this->errorResponse('Data Manager (Ditugaskan Oleh) tidak ditemukan pada pengajuan kontrak ini.', 422);
        }

        $leadTimeLimit = (int) ($request->input('lead_time_days') ?: config('master.sla.default_lead_time_days', 3));
        $processingTimeLimit = (int) ($request->input('processing_time_days') ?: config('master.sla.default_processing_time_days', 10));

        $now = Carbon::now();
        $leadTimeStart = $contract->submitted_at ? Carbon::parse($contract->submitted_at) : Carbon::parse($contract->created_at);
        $leadTimeElapsedDays = (int) $leadTimeStart->diffInDays($now);
        $isLeadTimeOverdue = $leadTimeElapsedDays >= $leadTimeLimit;

        $assignedAt = $contract->assigned_at ? Carbon::parse($contract->assigned_at) : null;
        $processingTimeElapsedDays = $assignedAt ? (int) $assignedAt->diffInDays($now) : null;
        $isProcessingTimeOverdue = $processingTimeElapsedDays !== null && $processingTimeElapsedDays >= $processingTimeLimit;

        $overdueType = ($isLeadTimeOverdue && $isProcessingTimeOverdue)
            ? 'both'
            : ($isProcessingTimeOverdue ? 'processing_time' : 'lead_time');

        $slaDetails = [
            'lead_time_days_limit' => $leadTimeLimit,
            'lead_time_elapsed_days' => $leadTimeElapsedDays,
            'processing_time_days_limit' => $processingTimeLimit,
            'processing_time_elapsed_days' => $processingTimeElapsedDays,
        ];

        // Send notification via Notification facade / user instance
        $manager->notify(new ContractSlaOverdueNotification($contract, $overdueType, $slaDetails));

        // Log contract history
        ContractHistory::create([
            'contract_id' => $contract->id,
            'action' => 'SLA_OVERDUE_NOTIFICATION_SENT',
            'description' => "Notifikasi SLA Overdue ({$overdueType}) dikirimkan ke Manager Ditugaskan Oleh: {$manager->name} ({$manager->email}).",
            'actor_id' => Auth::id() ?: $manager->id,
        ]);

        return $this->successResponse([
            'contract_id' => $contract->id,
            'manager' => [
                'id' => $manager->id,
                'name' => $manager->name,
                'email' => $manager->email,
            ],
            'overdue_type' => $overdueType,
            'sla_details' => $slaDetails,
        ], "Notifikasi peringatan SLA berhasil dikirimkan ke Manager {$manager->name}.");
    }

    /**
     * Send notification to all respective managers for all overdue contracts.
     */
    public function notifyAllOverdue(Request $request): JsonResponse
    {
        $leadTimeLimit = (int) ($request->input('lead_time_days') ?: config('master.sla.default_lead_time_days', 3));
        $processingTimeLimit = (int) ($request->input('processing_time_days') ?: config('master.sla.default_processing_time_days', 10));

        $query = $this->contractListQuery->build($request, 'contracts', true);
        $query->whereNotIn(DB::raw('UPPER(status)'), [
            'COMPLETED', 'SIGNED', 'REJECTED', 'ARCHIVED', 'CANCELLED', 'CLOSED',
        ])
            ->whereNull('closed_at')
            ->whereNull('finished_at')
            ->with(['assignedBy', 'assignedPic', 'creator.supervisor', 'statusDetail']);

        $contracts = $query->get();
        $now = Carbon::now();
        $notifiedCount = 0;
        $results = [];

        foreach ($contracts as $contract) {
            $leadTimeStart = $contract->submitted_at ? Carbon::parse($contract->submitted_at) : Carbon::parse($contract->created_at);
            $leadTimeElapsedDays = (int) $leadTimeStart->diffInDays($now);
            $isLeadTimeOverdue = $leadTimeElapsedDays >= $leadTimeLimit;

            $assignedAt = $contract->assigned_at ? Carbon::parse($contract->assigned_at) : null;
            $processingTimeElapsedDays = $assignedAt ? (int) $assignedAt->diffInDays($now) : null;
            $isProcessingTimeOverdue = $processingTimeElapsedDays !== null && $processingTimeElapsedDays >= $processingTimeLimit;

            if (! $isLeadTimeOverdue && ! $isProcessingTimeOverdue) {
                continue;
            }

            $manager = $contract->assignedBy ?: ($contract->creator?->supervisor ?: null);
            if (! $manager) {
                continue;
            }

            $overdueType = ($isLeadTimeOverdue && $isProcessingTimeOverdue)
                ? 'both'
                : ($isProcessingTimeOverdue ? 'processing_time' : 'lead_time');

            $slaDetails = [
                'lead_time_days_limit' => $leadTimeLimit,
                'lead_time_elapsed_days' => $leadTimeElapsedDays,
                'processing_time_days_limit' => $processingTimeLimit,
                'processing_time_elapsed_days' => $processingTimeElapsedDays,
            ];

            $manager->notify(new ContractSlaOverdueNotification($contract, $overdueType, $slaDetails));

            ContractHistory::create([
                'contract_id' => $contract->id,
                'action' => 'SLA_OVERDUE_NOTIFICATION_SENT',
                'description' => "Notifikasi SLA Overdue ({$overdueType}) dikirimkan ke Manager Ditugaskan Oleh: {$manager->name} ({$manager->email}).",
                'actor_id' => Auth::id() ?: $manager->id,
            ]);

            $notifiedCount++;
            $results[] = [
                'contract_id' => $contract->id,
                'contract_no' => $contract->contract_no ?: $contract->form_no,
                'title' => $contract->title,
                'manager_name' => $manager->name,
                'manager_email' => $manager->email,
                'overdue_type' => $overdueType,
            ];
        }

        return $this->successResponse([
            'total_notified' => $notifiedCount,
            'details' => $results,
        ], "Notifikasi peringatan SLA berhasil dikirimkan ke {$notifiedCount} Manager.");
    }
}
