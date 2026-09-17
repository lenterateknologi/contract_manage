<?php

namespace App\Services\Workflow;

use App\Models\Contract;
use App\Models\ContractSlaConfig;
use App\Models\ContractType;
use Carbon\Carbon;
use Carbon\CarbonInterface;

class SLAService
{
    /**
     * The hour at which a submission is considered to start the next business day.
     */
    const CUTOFF_HOUR = 16;
    const START_HOUR = 8;

    /**
     * Calculate a deadline based on configured working days (Mon-Sun), start hour, and dynamic cut-off.
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
        if (! $contractTypeId) {
            return null;
        }

        $cleanTopic = $topic ? strtolower(trim($topic)) : 'all';

        // 1. Exact match on contract_type_id and topic
        $config = ContractSlaConfig::where('contract_type_id', $contractTypeId)
            ->where('is_active', true)
            ->where('topic', $cleanTopic)
            ->first();

        // 2. Match on contract_type_id and topic 'all'
        if (! $config) {
            $config = ContractSlaConfig::where('contract_type_id', $contractTypeId)
                ->where('is_active', true)
                ->where('topic', 'all')
                ->first();
        }

        // 3. Fallback to parent contract type SLA if available
        if (! $config) {
            $type = ContractType::find($contractTypeId);
            if ($type && $type->parent_id) {
                $config = $this->resolveSlaConfig($type->parent_id, $topic, $workflowId);
            }
        }

        return $config;
    }

    /**
     * Calculate both drafting and total deadlines for a contract using hierarchical SLA resolution.
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

        return [
            'sla_config_id' => $slaConfig?->id,
            'drafting_hours' => $draftingHours,
            'total_hours' => $totalHours,
            'start_hour' => $startHour,
            'cutoff_hour' => $cutoffHour,
            'working_days' => $workingDays,
            'drafting_deadline' => $draftingDeadline,
            'total_deadline' => $totalDeadline,
        ];
    }

    /**
     * Check if a date falls on a non-working day based on custom configured working days.
     * Days map: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun
     */
    public function isNonWorkingDay(Carbon $date, ?array $workingDays = null): bool
    {
        if (empty($workingDays)) {
            // Default: Monday to Friday are working days, Saturday & Sunday are non-working days
            return $date->isSaturday() || $date->isSunday();
        }

        // Standardize configured working days to integer values (1-7) or string names
        $isoDay = $date->isoWeekday(); // 1 (Mon) to 7 (Sun)
        $dayName = strtolower($date->format('l')); // monday, tuesday...

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
