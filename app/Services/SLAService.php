<?php

namespace App\Services;

use Carbon\Carbon;

class SLAService
{
    /**
     * The hour at which a submission is considered to start the next business day.
     */
    const CUTOFF_HOUR = 16;

    /**
     * Calculate a deadline based on business days (Mon-Fri) and dynamic cut-off.
     *
     * @param \Carbon\CarbonInterface $startTime The time the request was submitted.
     * @param int $businessHours The number of hours to add (e.g., 72 for 3 days).
     * @param int $cutoffHour The hour at which submission counts for next day (default 16).
     */
    public function calculateBusinessDeadline(\Carbon\CarbonInterface $startTime, int $businessHours, int $cutoffHour = 16): Carbon
    {
        $date = Carbon::instance($startTime);

        // Convert hours to days for the current business logic (assuming 24h = 1 business day cycle)
        // If the user wants real hour-by-hour business time (e.g. 9-17), that's different.
        // But based on the "3 days" vs "72 hours" request, 24h per day skip weekend is expected.
        $businessDays = ceil($businessHours / 24);

        // Rule: If submitted after cutoff, count starts the next business day
        if ($date->hour >= $cutoffHour) {
            $date = $this->getNextBusinessDay($date);
        }

        // Rule: Ensure we are starting on a business day
        while ($this->isWeekend($date)) {
            $date = $this->getNextBusinessDay($date);
        }

        // Add the business days while skipping weekends
        for ($i = 0; $i < ($businessDays - 1); $i++) {
            $date->addDay();
            while ($this->isWeekend($date)) {
                $date->addDay();
            }
        }

        // Set to cutoff hour on the target day
        return $date->setTime($cutoffHour, 0, 0);
    }

    /**
     * Check if a date falls on a weekend.
     */
    public function isWeekend(Carbon $date): bool
    {
        return $date->isSaturday() || $date->isSunday();
    }

    /**
     * Move to the next business day (skipping weekends).
     */
    private function getNextBusinessDay(Carbon $date): Carbon
    {
        $next = $date->copy()->addDay()->startOfDay();
        while ($this->isWeekend($next)) {
            $next->addDay();
        }

        return $next;
    }
}
