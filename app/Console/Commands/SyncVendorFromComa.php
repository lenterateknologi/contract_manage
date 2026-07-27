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

        $key    = $this->option('key');
        $dryRun = $this->option('dry-run');

        $this->info("🔍 Mencari vendor dengan key=\"{$key}\"...");
        $vendors = $this->fetchList($key);

        if (empty($vendors)) {
            $this->warn('Tidak ada vendor ditemukan.');
            return self::SUCCESS;
        }

        $this->info('📋 Ditemukan ' . count($vendors) . ' vendor. Mulai fetch detail...');

        $bar  = $this->output->createProgressBar(count($vendors));
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
                $this->line("  [dry-run] {$vendorCode} — {$detail['name']}");
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

    private function upsertVendor(string $vendorCode, array $listItem, array $detail): void
    {
        $tax = $detail['tax'] ?? [];

        $payload = [
            'coma_data' => $detail,

            // --- Identitas ---
            'name'                        => $detail['name'] ?? $listItem['vendorName'],
            'branch_name'                 => $detail['branchName'] ?? null,
            'company_type'                => $detail['businessTypeName'] ?? null,
            'registration_number'         => $detail['registrationNumber'] ?? null,
            'agreement_number'            => $detail['agreementNumber'] ?? null,
            'agreement_date'              => $detail['agreementDate'] ?? null,
            'approved_date'               => $detail['approvedDate'] ?? null,
            'is_upload_agreement'         => (bool) ($detail['isUploadAgreement'] ?? false),
            'master_agreement_attachment' => $detail['masterAgreementAttachment'] ?? null,
            'vendor_status'               => $detail['status'] ?? null,
            'integrity_pact'              => filter_var($detail['integrityPact'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'master_agreement'            => filter_var($detail['masterAgreement'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'is_single_vendor'            => (bool) ($detail['isSingleVendor'] ?? false),
            'single_vendor_expired'       => $detail['singleVendorExpired'] ?? null,
            'single_vendor_file'          => $detail['singleVendorFile'] ?? null,
            'compliance_level'            => $detail['complianceLevel'] ?? null,
            'compliance_file'             => $detail['complianceFile'] ?? null,
            'coverage_area'               => $detail['coverageArea'] ?? null,
            'total_employees'             => $detail['totalEmployees'] ?? null,
            'company_profile_attachment'  => $detail['companyProfileAttachment'] ?? null,
            'id_card_number'              => $detail['idCardNumber'] ?? null,
            'id_card_file'                => $detail['idCardFile'] ?? null,
            'business_fields'             => $detail['businessFields'] ?? null,
            'business_fields_foreign'     => $detail['businessFieldsForeign'] ?? null,

            // --- Alamat ---
            'address'             => $detail['address'] ?? null,
            'country'             => $detail['country'] ?? null,
            'region'              => $detail['region'] ?? null,
            'city'                => $detail['city'] ?? null,
            'postal_code'         => $detail['postalCode'] ?? null,
            'vendor_country'      => $detail['vendorCountry'] ?? null,
            'mailing_address'     => $detail['mailingAddress'] ?? null,
            'mailing_country'     => $detail['mailingCountry'] ?? null,
            'mailing_region'      => $detail['mailingRegion'] ?? null,
            'mailing_city'        => $detail['mailingCity'] ?? null,
            'mailing_postal_code' => $detail['mailingPostalCode'] ?? null,

            // --- Kontak ---
            'email'         => $detail['companyEmail'] ?? null,
            'phone'         => $detail['companyPhone'] ?? null,
            'fax'           => $detail['companyFax'] ?? null,
            'pic_name'      => $detail['pic'] ?? null,
            'pic_email'     => $detail['picemail'] ?? null,
            'pic_phone'     => $detail['picphone'] ?? null,
            'finance_email' => $detail['financeEmail'] ?? null,
            'tax_email'     => $detail['taxEmail'] ?? null,

            // --- Pajak ---
            'npwp'                  => $tax['npwp'] ?? null,
            'tax_type_npwp'         => $tax['typeNpwp'] ?? null,
            'tax_type_pkp'          => $tax['typePkp'] ?? null,
            'tax_pkp'               => $tax['pkp'] ?? null,
            'tax_type_bkp'          => $tax['typeBkp'] ?? null,
            'tax_ppn'               => $tax['ppn'] ?? null,
            'tax_bkp_desc'          => $tax['bkpDesc'] ?? null,
            'tax_jkp_desc'          => $tax['jkpDesc'] ?? null,
            'tax_is_organization'   => (bool) ($tax['isOrganization'] ?? false),
            'tax_is_siujk'          => $tax['isSiujk'] ?? null,
            'tax_pp23_number'       => $tax['pp23number'] ?? null,
            'tax_pp23_expired_date' => $tax['pp23expiredDate'] ?? null,
            'tax_npwp_file'         => $tax['npwpfile'] ?? null,
            'tax_skpkp_file'        => $tax['skpkpfile'] ?? null,
            'tax_jkp_file'          => $tax['jkpfile'] ?? null,
            'tax_pp23_attachment'   => $tax['pp23attachment'] ?? null,

            // --- Data Array ---
            'bank_data'           => $detail['bank'] ?? null,
            'payment_method_data' => $detail['paymentMethod'] ?? null,
            'legality_data'       => $detail['legality'] ?? null,

            'is_active' => true,
        ];

        $existing = Vendor::withTrashed()->where('external_code', $vendorCode)->first();

        if ($existing) {
            if ($existing->trashed()) {
                $existing->restore();
            }
            $existing->update($payload);
        } else {
            Vendor::create(array_merge($payload, [
                'external_code' => $vendorCode,
                'code'          => $vendorCode,
            ]));
        }
    }
}
