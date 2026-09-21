<?php

namespace App\Services\Workflow;

use App\Models\Contract;
use App\Models\ContractSlaConfig;
use App\Models\ContractType;
use App\Models\Holiday;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\Cache;

class SLAService
{
    /**
     * The hour at which a submission is considered to start the next business day.
     */
    const CUTOFF_HOUR = 16;
    const START_HOUR = 8;

    /**
     * Calculate a deadline based on configured working days (Mon-Sun), start hour, dynamic cut-off, and holiday calendar.
     *
     * @param  CarbonInterface  $startTime  The time the request was submitted.
     * @param  int  $businessHours  The number of hours to add (e.g., 72 for 3 days).
     * @param  int  $cutoffHour  The hour at which submission counts for next day (default 16).
     * @param  array|null  $workingDays  Array of active day numbers (1=Mon, 2=Tue, ..., 7=Sun) or names.
     * @param  int  $startHour  The hour at which business day starts (default 8 for 08:00).
     */
    public function calculateBusinessDeadline(
        CarbonInterface $startTime,
        int $businessHours,
        int $cutoffHour = 16,
        ?array $workingDays = null,
        int $startHour = 8
    ): Carbon {
        $date = Carbon::instance($startTime);

        // Convert hours to days for the business logic (assuming 24h = 1 day cycle)
        $businessDays = ceil($businessHours / 24);
        if ($businessDays < 1) {
            $businessDays = 1;
        }

        // Rule: If submitted before startHour, move to startHour today
        if ($date->hour < $startHour) {
            $date->setTime($startHour, 0, 0);
        }

        // Rule: If submitted after or at cutoff, count starts next working day at startHour
        if ($date->hour >= $cutoffHour) {
            $date = $this->getNextBusinessDay($date, $workingDays)->setTime($startHour, 0, 0);
        }

        // Rule: Ensure we are starting on a valid working day
        while ($this->isNonWorkingDay($date, $workingDays)) {
            $date = $this->getNextBusinessDay($date, $workingDays)->setTime($startHour, 0, 0);
        }

        // Add the working days while skipping non-working days
        for ($i = 0; $i < ($businessDays - 1); $i++) {
            $date->addDay();
            while ($this->isNonWorkingDay($date, $workingDays)) {
                $date->addDay();
            }
        }

        // Set to cutoff hour on the target day
        return $date->setTime($cutoffHour, 0, 0);
    }

    /**
     * Resolve the active SLA configuration for a contract by contract type and topic.
     */
    public function resolveSlaConfig(?string $contractTypeId, ?string $topic = null, ?string $workflowId = null): ?ContractSlaConfig
    {
        if (! $contractTypeId && ! $workflowId) {
            return null;
        }

        $cleanTopic = $topic ? strtolower(trim($topic)) : 'all';

        // 1. Exact match on workflow_id (if provided)
        if ($workflowId) {
            $config = ContractSlaConfig::where('workflow_id', $workflowId)
                ->where('is_active', true)
                ->first();
            if ($config) {
                return $config;
            }
        }

        if (! $contractTypeId) {
            return null;
        }

        // 2. Exact match on contract_type_id and topic
        $config = ContractSlaConfig::where('contract_type_id', $contractTypeId)
            ->where('is_active', true)
            ->where('topic', $cleanTopic)
            ->first();

        // 3. Match on contract_type_id and topic 'all'
        if (! $config) {
            $config = ContractSlaConfig::where('contract_type_id', $contractTypeId)
                ->where('is_active', true)
                ->where('topic', 'all')
                ->first();
        }

        // 4. Fallback to parent contract type SLA if available
        if (! $config) {
            $type = ContractType::find($contractTypeId);
            if ($type && $type->parent_id) {
                $config = $this->resolveSlaConfig($type->parent_id, $topic, $workflowId);
            }
        }

        return $config;
    }

    /**
     * Resolve the specific SLA target duration (hours) for a given contract stage/status.
     * Supports multi-type SLA and stage-by-status definitions.
     */
    public function resolveStageSla(Contract $contract, ?string $targetStatus = null, ?CarbonInterface $startTime = null): array
    {
        $now = $startTime ? Carbon::instance($startTime) : now();
        $status = $targetStatus ?: $contract->status ?: 'draft';
        $topic = data_get($contract->metadata, 'topic');

        $slaConfig = $this->resolveSlaConfig($contract->contract_type_id, $topic, $contract->workflow_id);

        $cutoffHour = $slaConfig?->sla_cutoff_hour ?? $contract->workflow?->sla_cutoff_hour ?? self::CUTOFF_HOUR;
        $startHour = $slaConfig?->sla_start_hour ?? self::START_HOUR;
        $workingDays = $slaConfig?->working_days;

        $stageHours = null;

        // 1. Search in SLA stages array configured in Master SLA
        if ($slaConfig && is_array($slaConfig->sla_stages) && ! empty($slaConfig->sla_stages)) {
            // Check if associative map format: ['in_review' => 8, 'signing' => 16]
            if (isset($slaConfig->sla_stages[$status])) {
                $val = $slaConfig->sla_stages[$status];
                $stageHours = is_numeric($val) ? (int) $val : (int) ($val['duration_hours'] ?? ($val['hours'] ?? 0));
            } elseif (isset($slaConfig->sla_stages[strtolower($status)])) {
                $val = $slaConfig->sla_stages[strtolower($status)];
                $stageHours = is_numeric($val) ? (int) $val : (int) ($val['duration_hours'] ?? ($val['hours'] ?? 0));
            } else {
                foreach ($slaConfig->sla_stages as $stage) {
                    if (! is_array($stage)) {
                        continue;
                    }
                    $isActive = $stage['is_active'] ?? true;
                    if ($isActive === false || $isActive === 0 || $isActive === '0' || $isActive === 'false') {
                        continue;
                    }

                    $stStatus = $stage['contract_status'] ?? ($stage['status'] ?? null);
                    if ($stStatus && (strtolower($stStatus) === strtolower($status) || $stStatus === 'all')) {
                        $stageHours = (int) ($stage['duration_hours'] ?? ($stage['hours'] ?? 0));
                        if ($stageHours > 0) {
                            break;
                        }
                    }
                }
            }
        }

        // 2. Fallbacks based on status category
        if ($stageHours === null || $stageHours <= 0) {
            if ($status === 'draft') {
                $stageHours = $slaConfig?->sla_drafting_hours ?? $contract->workflow?->sla_drafting_hours ?? 24;
            } elseif (in_array($status, ['pending', 'in_review', 'review', 'review_legal', 'review_finance', 'review_f1', 'review_f2'])) {
                $stageHours = $slaConfig?->sla_review_hours ?? 48;
            } else {
                $stageHours = 48; // General default stage SLA
            }
        }

        $stageDeadline = $this->calculateBusinessDeadline($now, $stageHours, $cutoffHour, $workingDays, $startHour);

        return [
            'sla_config_id' => $slaConfig?->id,
            'stage_status' => $status,
            'stage_hours' => $stageHours,
            'stage_deadline' => $stageDeadline,
            'start_hour' => $startHour,
            'cutoff_hour' => $cutoffHour,
            'working_days' => $workingDays,
        ];
    }

    /**
     * Calculate both drafting, stage, and total deadlines for a contract using hierarchical SLA resolution.
     */
    public function calculateContractDeadlines(Contract $contract, ?string $topic = null, ?CarbonInterface $startTime = null): array
    {
        $now = $startTime ? Carbon::instance($startTime) : now();
        $topic = $topic ?? data_get($contract->metadata, 'topic');
        $contractTypeId = $contract->contract_type_id;

        $slaConfig = $this->resolveSlaConfig($contractTypeId, $topic, $contract->workflow_id);

        $draftingHours = $slaConfig?->sla_drafting_hours
            ?? $contract->workflow?->sla_drafting_hours
            ?? 72;

        $totalHours = $slaConfig?->sla_total_hours
            ?? $contract->workflow?->sla_total_hours
            ?? 240;

        $cutoffHour = $slaConfig?->sla_cutoff_hour
            ?? $contract->workflow?->sla_cutoff_hour
            ?? self::CUTOFF_HOUR;

        $startHour = $slaConfig?->sla_start_hour
            ?? self::START_HOUR;

        $workingDays = $slaConfig?->working_days;

        $draftingDeadline = $this->calculateBusinessDeadline($now, $draftingHours, $cutoffHour, $workingDays, $startHour);

        $totalDeadline = null;
        if (strtolower((string) $topic) !== 'review') {
            $totalDeadline = $this->calculateBusinessDeadline($now, $totalHours, $cutoffHour, $workingDays, $startHour);
        }

        $stageSla = $this->resolveStageSla($contract, $contract->status, $now);

        return [
            'sla_config_id' => $slaConfig?->id,
            'drafting_hours' => $draftingHours,
            'total_hours' => $totalHours,
            'stage_hours' => $stageSla['stage_hours'],
            'stage_deadline' => $stageSla['stage_deadline'],
            'start_hour' => $startHour,
            'cutoff_hour' => $cutoffHour,
            'working_days' => $workingDays,
            'drafting_deadline' => $draftingDeadline,
            'total_deadline' => $totalDeadline,
        ];
    }

    /**
     * Check if a date falls on a non-working day based on custom configured working days and official holidays.
     * Days map: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun
     */
    public function isNonWorkingDay(Carbon $date, ?array $workingDays = null): bool
    {
        // 1. Check official active holidays in m_holidays
        $dateStr = $date->format('Y-m-d');
        $isHoliday = Cache::remember("holiday_{$dateStr}", 3600, function () use ($dateStr) {
            return Holiday::where('holiday_date', $dateStr)->where('is_active', true)->exists();
        });

        if ($isHoliday) {
            return true;
        }

        // 2. Default Mon-Fri if workingDays is not configured
        if (empty($workingDays)) {
            return $date->isSaturday() || $date->isSunday();
        }

        // 3. Match against configured working days
        $isoDay = $date->isoWeekday(); // 1 (Mon) to 7 (Sun)
        $dayName = strtolower($date->format('l'));

        foreach ($workingDays as $d) {
            if (is_numeric($d) && (int) $d === $isoDay) {
                return false;
            }
            if (is_string($d) && strtolower($d) === $dayName) {
                return false;
            }
        }

        return true;
    }

    /**
     * Check if a date falls on a weekend.
     */
    public function isWeekend(Carbon $date): bool
    {
        return $date->isSaturday() || $date->isSunday();
    }

    /**
     * Move to the next working day based on workingDays configuration.
     */
    private function getNextBusinessDay(Carbon $date, ?array $workingDays = null): Carbon
    {
        $next = $date->copy()->addDay()->startOfDay();
        while ($this->isNonWorkingDay($next, $workingDays)) {
            $next->addDay();
        }

        return $next;
    }
}
