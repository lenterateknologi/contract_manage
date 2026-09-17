<?php

namespace App\Console\Commands;

use App\Models\Holiday;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class SyncHolidaysCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'holidays:sync {year? : Tahun yang ingin disinkronkan (default: tahun berjalan)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sinkronisasi Hari Libur Nasional & Cuti Bersama Indonesia dari Public API ke database lokal';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $inputYear = $this->argument('year');
        $years = $inputYear ? [(int) $inputYear] : [(int) date('Y'), (int) date('Y') + 1];

        $this->info('Memulai sinkronisasi hari libur...');

        foreach ($years as $year) {
            $this->syncYear($year);
        }

        $this->info('Sinkronisasi selesai!');
    }

    protected function syncYear(int $year)
    {
        $this->line("Mengambil data hari libur tahun {$year}...");

        $sources = [
            "https://api-harilibur.vercel.app/api?year={$year}",
            "https://dayoffapi.vercel.app/api?year={$year}",
        ];

        $syncedCount = 0;

        foreach ($sources as $url) {
            try {
                $response = Http::timeout(10)->get($url);
                if ($response->successful()) {
                    $items = $response->json();
                    if (is_array($items) && count($items) > 0) {
                        foreach ($items as $item) {
                            $rawDate = $item['holiday_date'] ?? $item['tanggal'] ?? null;
                            $name = $item['holiday_name'] ?? $item['keterangan'] ?? null;
                            $isNational = $item['is_national_holiday'] ?? (! ($item['is_cuti'] ?? false));

                            if ($rawDate && $name) {
                                $dateStr = Carbon::parse($rawDate)->format('Y-m-d');
                                Holiday::updateOrCreate(
                                    ['holiday_date' => $dateStr],
                                    [
                                        'name' => $name,
                                        'is_cuti_bersama' => ! $isNational,
                                        'is_active' => true,
                                        'description' => ! $isNational ? 'Cuti Bersama Nasional' : 'Hari Libur Nasional',
                                    ]
                                );
                                $syncedCount++;
                            }
                        }

                        $this->info("✓ Berhasil menyinkronkan {$syncedCount} hari libur untuk tahun {$year} dari API.");
                        return;
                    }
                }
            } catch (\Throwable $e) {
                // Continue to next source
            }
        }

        $this->warn("! API eksternal tidak merespons untuk tahun {$year}. Memasang fallback libur nasional standar...");
        $this->seedDefaults($year);
    }

    protected function seedDefaults(int $year)
    {
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
        $this->info("✓ Memasang libur standar untuk tahun {$year}.");
    }
}
