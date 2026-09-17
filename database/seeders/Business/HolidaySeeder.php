<?php

namespace Database\Seeders\Business;

use App\Models\Holiday;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Http;

class HolidaySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $year = (int) date('Y');
        $yearsToSeed = [$year, $year + 1];

        foreach ($yearsToSeed as $y) {
            $this->seedHolidaysForYear($y);
        }
    }

    protected function seedHolidaysForYear(int $year): void
    {
        try {
            // Fetch from Public Indonesian Holiday API
            $response = Http::timeout(5)->get("https://api-harilibur.vercel.app/api?year={$year}");
            if ($response->successful()) {
                $holidays = $response->json();
                if (is_array($holidays)) {
                    foreach ($holidays as $h) {
                        $date = $h['holiday_date'] ?? null;
                        $name = $h['holiday_name'] ?? null;
                        $isCuti = (bool) ($h['is_national_holiday'] === false);

                        if ($date && $name) {
                            Holiday::updateOrCreate(
                                ['holiday_date' => Carbon::parse($date)->format('Y-m-d')],
                                [
                                    'name' => $name,
                                    'is_cuti_bersama' => $isCuti,
                                    'is_active' => true,
                                    'description' => $isCuti ? 'Cuti Bersama Nasional' : 'Hari Libur Nasional',
                                ]
                            );
                        }
                    }
                    return;
                }
            }
        } catch (\Throwable $e) {
            // Fallback manual defaults if API unreachable
        }

        // Standard Fallback holidays
        $defaults = [
            "{$year}-01-01" => ['name' => 'Tahun Baru Masehi', 'is_cuti' => false],
            "{$year}-05-01" => ['name' => 'Hari Buruh Internasional', 'is_cuti' => false],
            "{$year}-06-01" => ['name' => 'Hari Lahir Pancasila', 'is_cuti' => false],
            "{$year}-08-17" => ['name' => 'Hari Kemerdekaan Republik Indonesia', 'is_cuti' => false],
            "{$year}-12-25" => ['name' => 'Hari Raya Natal', 'is_cuti' => false],
        ];

        foreach ($defaults as $date => $item) {
            Holiday::updateOrCreate(
                ['holiday_date' => $date],
                [
                    'name' => $item['name'],
                    'is_cuti_bersama' => $item['is_cuti'],
                    'is_active' => true,
                    'description' => 'Hari Libur Nasional (Default)',
                ]
            );
        }
    }
}
