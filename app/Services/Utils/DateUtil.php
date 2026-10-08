<?php

namespace App\Services\Utils;

use Carbon\Carbon;
use Carbon\CarbonInterface;

class DateUtil
{
    /**
     * Format a date or date string using Indonesian locale.
     */
    public static function format($date, string $format = 'j M Y, H:i'): ?string
    {
        if (! $date) {
            return null;
        }

        if (! $date instanceof Carbon) {
            try {
                $date = Carbon::parse($date);
            } catch (\Throwable) {
                return null;
            }
        }

        return $date->locale('id')->translatedFormat($format);
    }

    /**
     * Calculate human-readable duration between two dates.
     */
    public static function duration($startDate, $endDate = null, int $parts = 2): ?string
    {
        if (! $startDate) {
            return null;
        }

        $start = $startDate instanceof Carbon ? $startDate : Carbon::parse($startDate);
        $end = $endDate ? ($endDate instanceof Carbon ? $endDate : Carbon::parse($endDate)) : now();

        return $start->locale('id')->diffForHumans($end, [
            'syntax' => CarbonInterface::DIFF_ABSOLUTE,
            'parts' => $parts,
        ]);
    }
}
