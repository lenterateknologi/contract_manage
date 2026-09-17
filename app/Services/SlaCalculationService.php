<?php

namespace App\Services;

use App\Models\ContractSlaConfig;
use App\Models\Holiday;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class SlaCalculationService
{
    /**
     * Hitung tanggal & jam jatuh tempo (Due Date) SLA berdasarkan:
     * 1. Waktu pengajuan ($submittedAt)
     * 2. Target durasi dalam satuan Hari ($targetDays) atau Jam ($targetHours)
     * 3. Konfigurasi SLA ($config) yang memuat jam cut-off, hari kerja aktif, dan master hari libur
     *
     * @param Carbon $submittedAt
     * @param int|float $targetDays
     * @param ContractSlaConfig|null $config
     * @return Carbon
     */
    public function calculateDueDate(Carbon $submittedAt, float|int $targetDays, ?ContractSlaConfig $config = null): Carbon
    {
        $cutoffHour = $config?->sla_cutoff_hour ?? 16;
        $workingDays = $config?->working_days ? array_map('strval', $config->working_days) : ['1', '2', '3', '4', '5']; // 1=Senin, 7=Minggu

        $current = $submittedAt->copy();

        // 1. Cek Cut-off: Jika lewat dari jam cut-off, pengajuan efektif mulai dihitung esok hari
        if ($current->hour > $cutoffHour || ($current->hour === $cutoffHour && ($current->minute > 0 || $current->second > 0))) {
            $current->addDay()->startOfDay();
        }

        // 2. Ambil seluruh tanggal merah aktif
        $holidays = Holiday::where('is_active', true)
            ->pluck('holiday_date')
            ->map(fn ($d) => $d instanceof Carbon ? $d->format('Y-m-d') : Carbon::parse($d)->format('Y-m-d'))
            ->toArray();

        // 3. Cari Hari Kerja Efektif Pertama (Skip weekend dan libur nasional)
        while (!$this->isWorkingDay($current, $workingDays, $holidays)) {
            $current->addDay()->startOfDay();
        }

        // 4. Tambahkan target hari kerja efektif
        $daysToAdd = (int) ceil($targetDays);
        $daysCounted = 0;

        while ($daysCounted < $daysToAdd) {
            $current->addDay();
            if ($this->isWorkingDay($current, $workingDays, $holidays)) {
                $daysCounted++;
            }
        }

        // 5. Set jam jatuh tempo tepat di jam cut-off SLA
        return $current->setHour($cutoffHour)->setMinute(0)->setSecond(0);
    }

    /**
     * Cek apakah suatu tanggal merupakan hari kerja aktif (Bukan Weekend & Bukan Tanggal Merah)
     */
    public function isWorkingDay(Carbon $date, array $workingDays, array $holidays): bool
    {
        $dayOfWeek = (string) $date->isoFormat('E'); // 1 (Senin) .. 7 (Minggu)
        $dateStr = $date->format('Y-m-d');

        // Harus ada di daftar hari kerja yang diizinkan
        if (!in_array($dayOfWeek, $workingDays, true)) {
            return false;
        }

        // Tidak boleh merupakan tanggal merah
        if (in_array($dateStr, $holidays, true)) {
            return false;
        }

        return true;
    }

    /**
     * Hitung sisa waktu kerja efektif (dalam Jam / Hari) antara sekarang dan Due Date
     */
    public function getEffectiveRemainingHours(Carbon $now, Carbon $dueDate, ?ContractSlaConfig $config = null): float
    {
        if ($now->greaterThanOrEqualTo($dueDate)) {
            return 0.0;
        }

        $workingDays = $config?->working_days ? array_map('strval', $config->working_days) : ['1', '2', '3', '4', '5'];
        $holidays = Holiday::where('is_active', true)
            ->pluck('holiday_date')
            ->map(fn ($d) => $d instanceof Carbon ? $d->format('Y-m-d') : Carbon::parse($d)->format('Y-m-d'))
            ->toArray();

        $current = $now->copy();
        $workingDaysCount = 0;

        while ($current->lessThan($dueDate)) {
            if ($this->isWorkingDay($current, $workingDays, $holidays)) {
                $workingDaysCount++;
            }
            $current->addDay();
        }

        return (float) ($workingDaysCount * 24);
    }
}
