<?php

namespace App\Console\Commands;

use App\Models\Vendor;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SyncVendorFromComa extends Command
{
    protected $signature = 'vendor:sync-coma
                            {--key=a : Kata kunci pencarian vendor (default: "a" untuk ambil semua)}
                            {--dry-run : Tampilkan data tanpa menyimpan}';

    protected $description = 'Sync data vendor dari API COMA ke database lokal';

    private string $baseUrl;

    private string $token;

    public function handle(): int
    {
        $this->baseUrl = rtrim(config('services.coma.base_url'), '/');

        $this->info('🔐 Authenticating ke COMA API...');
        if (! $this->authenticate()) {
            $this->error('Gagal autentikasi. Cek COMA_API_USERNAME / COMA_API_PASSWORD di .env');

            return self::FAILURE;
        }
        $this->info('✅ Token berhasil didapat.');

        $key = $this->option('key');
        $dryRun = $this->option('dry-run');

        $this->info("🔍 Mencari vendor dengan key=\"{$key}\"...");
        $vendors = $this->fetchList($key);

        if (empty($vendors)) {
            $this->warn('Tidak ada vendor ditemukan.');

            return self::SUCCESS;
        }

        $this->info('📋 Ditemukan '.count($vendors).' vendor. Mulai fetch detail...');

        $bar = $this->output->createProgressBar(count($vendors));
        $synced = $failed = 0;

        foreach ($vendors as $item) {
            $vendorCode = $item['vendorCode'] ?? null;
            if (! $vendorCode) {
                $bar->advance();

                continue;
            }

            $detail = $this->fetchDetail($vendorCode);
            if (! $detail) {
                $this->newLine();
                $this->warn("  ⚠ Gagal fetch detail untuk {$vendorCode}");
                $failed++;
                $bar->advance();

                continue;
            }

            if ($dryRun) {
                $this->newLine();
                $this->line("  [dry-run] {$vendorCode} — ".($detail['name'] ?? $item['vendorName'] ?? ''));
                $bar->advance();

                continue;
            }

            try {
                $this->upsertVendor($vendorCode, $item, $detail);
                $synced++;
            } catch (\Throwable $e) {
                $this->newLine();
                $this->warn("  ⚠ Gagal simpan {$vendorCode}: {$e->getMessage()}");
                Log::error('SyncVendorFromComa upsert failed', ['code' => $vendorCode, 'error' => $e->getMessage()]);
                $failed++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        $this->info("✅ Selesai. Synced: {$synced} | Failed: {$failed}");

        return self::SUCCESS;
    }

    // --- private helpers ---

    private function authenticate(): bool
    {
        $resp = Http::timeout(15)->post("{$this->baseUrl}/api/Authentication/authenticate", [
            'username' => config('services.coma.username'),
            'password' => config('services.coma.password'),
        ]);

        if (! $resp->successful() || ($resp->json('status') !== 'success')) {
            return false;
        }

        $this->token = $resp->json('data');

        return (bool) $this->token;
    }

    private function fetchList(string $key): array
    {
        $resp = Http::timeout(30)
            ->withToken($this->token)
            ->get("{$this->baseUrl}/api/ContractManagement/SearchVendorByKey", ['key' => $key]);

        return $resp->successful() ? ($resp->json('data') ?? []) : [];
    }

    private function fetchDetail(string $vendorCode): ?array
    {
        $resp = Http::timeout(30)
            ->withToken($this->token)
            ->get("{$this->baseUrl}/api/ContractManagement/GetDetailVendorbyCode", ['vendorCode' => $vendorCode]);

        return $resp->successful() ? ($resp->json('data') ?? null) : null;
    }

    // ponytail: simplified upsert using vendor_code, vendor_name, vendor_detail (json)
    private function upsertVendor(string $vendorCode, array $listItem, array $detail): void
    {
        $vendorName = $detail['name'] ?? $listItem['vendorName'] ?? '';

        $payload = [
            'vendor_code' => $vendorCode,
            'vendor_name' => $vendorName,
            'vendor_detail' => $detail,
            'is_active' => true,
        ];

        $existing = Vendor::withTrashed()->where('vendor_code', $vendorCode)->first();

        if ($existing) {
            if ($existing->trashed()) {
                $existing->restore();
            }
            $existing->update($payload);
        } else {
            Vendor::create($payload);
        }
    }
}
