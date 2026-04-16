<?php

namespace Database\Seeders;

use App\Models\ContractType;
use App\Models\FormTemplate;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class FormTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::first();
        if (! $admin) {
            return;
        }

        // Delete existing templates to refresh
        FormTemplate::query()->delete();

        $contractTypes = ContractType::all();

        foreach ($contractTypes as $type) {
            $this->seedF1ForType($admin->id, $type);
        }

        // Also seed a universal F2 template as a fallback
        $this->seedUniversalF2($admin->id);
    }

    private function seedF1ForType(string $userId, ContractType $type): void
    {
        $fields = $this->getFieldsForType($type->name);

        $template = FormTemplate::create([
            'name' => 'F1 - ' . $type->name,
            'description' => 'Formulir Permintaan Pembuatan Perjanjian untuk ' . $type->name,
            'contract_type_id' => $type->id,
            'document_type' => 'f1',
            'is_active' => true,
            'created_by' => $userId,
            'updated_by' => $userId,
        ]);

        // Add Kop Surat & Title first
        $template->fields()->create([
            'label' => 'PT. LENTERA KREASI TEKNOLOGI',
            'name' => 'kop_surat',
            'type' => 'kop_surat',
            'width' => '1/1',
            'order' => 0,
            'options' => [
                'logo_url' => 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=2117&auto=format&fit=crop',
                'logo_size' => 80,
                'logo_position' => 'left',
                'description' => "Jl. Sudirman No. 123, SCBD, Jakarta Selatan, 12190\nTelp: (021) 5088 1234 • Fax: (021) 5088 5678\nEmail: info@company.com • Website: www.company.com"
            ]
        ]);

        $template->fields()->create([
            'label' => 'FORMULIR PERMINTAAN PEMBUATAN ' . strtoupper($type->name),
            'name' => 'form_title',
            'type' => 'form_title',
            'width' => '1/1',
            'order' => 1,
        ]);

        $order = 2;
        foreach ($fields as $groupName => $groupFields) {
            $group = $template->fields()->create([
                'label' => $groupName,
                'name' => Str::snake($groupName),
                'type' => 'group',
                'width' => '1/1',
                'order' => $order++,
            ]);

            foreach ($groupFields as $idx => $f) {
                $template->fields()->create([
                    'label' => $f['label'],
                    'name' => $f['name'],
                    'type' => $f['type'] ?? 'text',
                    'parent_id' => $group->id,
                    'placeholder' => $f['placeholder'] ?? 'Masukkan ' . strtolower($f['label']) . '...',
                    'is_required' => $f['is_required'] ?? false,
                    'width' => $f['width'] ?? '1/2',
                    'order' => $idx,
                    'options' => $f['options'] ?? null,
                ]);
            }
        }
    }

    private function getFieldsForType(string $typeName): array
    {
        $baseCore = [
            ['label' => 'Nomor Kontrak', 'name' => 'contract_number', 'type' => 'text', 'width' => '1/3'],
            ['label' => 'Judul Kontrak', 'name' => 'contract_title', 'type' => 'text', 'width' => '2/3', 'is_required' => true],
            ['label' => 'Tanggal Mulai', 'name' => 'start_date', 'type' => 'date', 'width' => '1/2'],
            ['label' => 'Tanggal Berakhir', 'name' => 'end_date', 'type' => 'date', 'width' => '1/2'],
        ];

        $baseFinansial = [
            ['label' => 'Nilai Kontrak', 'name' => 'contract_value', 'type' => 'number', 'width' => '1/2'],
            ['label' => 'Mata Uang', 'name' => 'currency', 'type' => 'select', 'width' => '1/2', 'options' => ['IDR', 'USD', 'EUR']],
            ['label' => 'Ketentuan Pembayaran', 'name' => 'payment_terms', 'type' => 'textarea', 'width' => '1/1'],
        ];

        $basePihak = [
            ['label' => 'Nama Perusahaan', 'name' => 'company_name', 'type' => 'text', 'width' => '1/2'],
            ['label' => 'Nama PIC', 'name' => 'pic_name', 'type' => 'text', 'width' => '1/2'],
        ];

        $basePajak = [
            ['label' => 'Wajib Pajak?', 'name' => 'is_tax_required', 'type' => 'checkbox', 'width' => '1/4'],
            ['label' => 'Tipe Pajak', 'name' => 'tax_type', 'type' => 'select', 'width' => '1/2', 'options' => ['PPN 11%', 'PPh 21', 'PPh 23']],
        ];

        $baseDokumen = [
            ['label' => 'Dokumen Pendukung', 'name' => 'support_doc', 'type' => 'text', 'width' => '1/1', 'placeholder' => 'Upload via lampiran sistem'],
        ];

        switch ($typeName) {
            case 'Perjanjian Kerja Sama (PKS)':
                return [
                    'Core Field' => $baseCore,
                    'Pihak' => $basePihak,
                    'Finansial' => $baseFinansial,
                    'Pajak' => $basePajak,
                    'Dokumen' => $baseDokumen,
                ];
            case 'Perjanjian Jasa':
                return [
                    'Core Field' => $baseCore,
                    'Scope & Deliverables' => [
                        ['label' => 'Lingkup Jasa', 'name' => 'service_scope', 'type' => 'textarea'],
                        ['label' => 'Deliverables', 'name' => 'deliverables', 'type' => 'textarea'],
                        ['label' => 'SLA', 'name' => 'sla', 'type' => 'textarea'],
                    ],
                    'Finansial' => array_merge($baseFinansial, [['label' => 'Termin', 'name' => 'termin', 'type' => 'text']]),
                    'Pajak' => $basePajak,
                ];
            case 'Perjanjian Pengadaan Barang':
                return [
                    'Core Field' => [
                        ['label' => 'Nomor Kontrak', 'name' => 'contract_number', 'type' => 'text', 'width' => '1/2'],
                        ['label' => 'Judul Kontrak', 'name' => 'contract_title', 'type' => 'text', 'width' => '1/2'],
                    ],
                    'Barang' => [
                        ['label' => 'Daftar Barang', 'name' => 'item_list', 'type' => 'textarea'],
                        ['label' => 'Jumlah', 'name' => 'quantity', 'type' => 'number'],
                        ['label' => 'Spesifikasi', 'name' => 'specification', 'type' => 'textarea'],
                    ],
                    'Finansial' => $baseFinansial,
                    'Pajak' => $basePajak,
                ];
            case 'Perjanjian Sewa':
                return [
                    'Core Field' => $baseCore,
                    'Objek Sewa' => [
                        ['label' => 'Nama Aset', 'name' => 'asset_name', 'type' => 'text'],
                        ['label' => 'Lokasi', 'name' => 'location', 'type' => 'text'],
                        ['label' => 'Tipe Penggunaan', 'name' => 'usage_type', 'type' => 'text'],
                    ],
                    'Finansial' => [
                        ['label' => 'Biaya Sewa', 'name' => 'rental_fee', 'type' => 'number'],
                        ['label' => 'Jadwal Pembayaran', 'name' => 'payment_schedule', 'type' => 'text'],
                        ['label' => 'Nilai Deposit', 'name' => 'deposit_amount', 'type' => 'number'],
                    ],
                    'Ketentuan' => [
                        ['label' => 'Klausul Maintenance', 'name' => 'maintenance_clause', 'type' => 'textarea'],
                        ['label' => 'Klausul Penalti', 'name' => 'penalty_clause', 'type' => 'textarea'],
                    ],
                ];
            case 'Perjanjian Kerahasiaan (NDA)':
                return [
                    'Core Field' => $baseCore,
                    'Kerahasiaan' => [
                        ['label' => 'Lingkup Kerahasiaan', 'name' => 'confidential_scope', 'type' => 'textarea'],
                        ['label' => 'Tipe Informasi', 'name' => 'information_type', 'type' => 'textarea'],
                        ['label' => 'Batasan Pengungkapan', 'name' => 'disclosure_limit', 'type' => 'textarea'],
                    ],
                    'Ketentuan' => [
                        ['label' => 'Penalti Pelanggaran', 'name' => 'penalty_breach', 'type' => 'textarea'],
                        ['label' => 'Penyelesaian Sengketa', 'name' => 'dispute_resolution', 'type' => 'textarea'],
                    ],
                ];
            case 'Perjanjian Outsourcing':
                return [
                    'Core Field' => $baseCore,
                    'Tenaga Kerja' => [
                        ['label' => 'Jumlah Tenaga Kerja', 'name' => 'manpower_count', 'type' => 'number'],
                        ['label' => 'Deskripsi Pekerjaan', 'name' => 'job_description', 'type' => 'textarea'],
                        ['label' => 'Lokasi Kerja', 'name' => 'work_location', 'type' => 'text'],
                    ],
                    'Finansial' => [
                        ['label' => 'Service Fee', 'name' => 'service_fee', 'type' => 'number'],
                        ['label' => 'Ketentuan Pembayaran', 'name' => 'payment_terms', 'type' => 'textarea'],
                    ],
                ];
            case 'Perjanjian Distribusi':
                return [
                    'Core Field' => $baseCore,
                    'Distribus' => [
                        ['label' => 'Daftar Produk', 'name' => 'product_list', 'type' => 'textarea'],
                        ['label' => 'Wilayah', 'name' => 'territory', 'type' => 'text'],
                        ['label' => 'Eksklusivitas', 'name' => 'exclusivity', 'type' => 'select', 'options' => ['Eksklusif', 'Non-Eksklusif']],
                    ],
                    'Finansial' => [
                        ['label' => 'Margin', 'name' => 'margin', 'type' => 'text'],
                        ['label' => 'Skema Harga', 'name' => 'pricing_scheme', 'type' => 'textarea'],
                    ],
                ];
            case 'Perjanjian Lisensi':
                return [
                    'Core Field' => $baseCore,
                    'Lisensi' => [
                        ['label' => 'Tipe Lisensi', 'name' => 'license_type', 'type' => 'text'],
                        ['label' => 'Lingkup Penggunaan', 'name' => 'usage_scope', 'type' => 'textarea'],
                        ['label' => 'Durasi', 'name' => 'duration', 'type' => 'text'],
                    ],
                    'Finansial' => [
                        ['label' => 'Royalty Fee', 'name' => 'royalty_fee', 'type' => 'number'],
                        ['label' => 'Ketentuan Pembayaran', 'name' => 'payment_terms', 'type' => 'textarea'],
                    ],
                ];
            case 'Perjanjian Joint Venture':
                return [
                    'Core Field' => $baseCore,
                    'Investasi' => [
                        ['label' => 'Kontribusi Modal', 'name' => 'capital_contribution', 'type' => 'number'],
                        ['label' => 'Persentase Kepemilikan', 'name' => 'ownership_percentage', 'type' => 'number'],
                    ],
                    'Operasional' => [
                        ['label' => 'Struktur Manajemen', 'name' => 'management_structure', 'type' => 'textarea'],
                        ['label' => 'Pembagian Keuntungan', 'name' => 'profit_sharing', 'type' => 'textarea'],
                    ],
                ];
            case 'Addendum / Perpanjangan Kontrak':
                return [
                    'Core Field' => [
                        ['label' => 'Nomor Kontrak', 'name' => 'contract_number', 'type' => 'text'],
                        ['label' => 'ID Kontrak Induk', 'name' => 'parent_contract_id', 'type' => 'text'],
                    ],
                    'Perubahan' => [
                        ['label' => 'Klausul yang Diubah', 'name' => 'revised_clause', 'type' => 'textarea'],
                        ['label' => 'Tanggal Efektif', 'name' => 'effective_date', 'type' => 'date'],
                    ],
                    'Dokumen' => [
                        ['label' => 'Dokumen Addendum', 'name' => 'addendum_document', 'type' => 'text'],
                    ],
                ];
            case 'Perjanjian Internal (Intercompany)':
                return [
                    'Core Field' => $baseCore,
                    'Internal' => [
                        ['label' => 'Entitas 1', 'name' => 'entity_1', 'type' => 'text'],
                        ['label' => 'Entitas 2', 'name' => 'entity_2', 'type' => 'text'],
                    ],
                    'Finansial' => [
                        ['label' => 'Transfer Pricing', 'name' => 'transfer_pricing', 'type' => 'textarea'],
                    ],
                ];
            case 'Perjanjian Khusus (Custom)':
                return [
                    'Core Field' => $baseCore,
                    'Flexible' => [
                        ['label' => 'Custom Fields (JSON)', 'name' => 'custom_fields', 'type' => 'textarea'],
                    ],
                ];
        }

        return ['Umum' => $baseCore];
    }

    private function seedUniversalF2(string $userId): void
    {
        $template = FormTemplate::create([
            'name' => 'F2 - RESUME DAN PERSETUJUAN (UNIVERSAL)',
            'description' => 'Formulir F2 resume dan persetujuan untuk semua tipe kontrak.',
            'contract_type_id' => null,
            'document_type' => 'f2',
            'is_active' => true,
            'created_by' => $userId,
            'updated_by' => $userId,
        ]);

        $template->fields()->create([
            'label' => 'RESUME DAN PERSETUJUAN PERJANJIAN',
            'name' => 'form_title',
            'type' => 'form_title',
            'width' => '1/1',
            'order' => 0,
        ]);

        $groupHeader = $template->fields()->create([
            'label' => 'Informasi Utama',
            'name' => 'info_utama',
            'type' => 'group',
            'width' => '1/1',
            'order' => 1,
        ]);

        $fields = [
            ['label' => 'No. Perjanjian', 'name' => 'contract_no', 'type' => 'text', 'width' => '1/2'],
            ['label' => 'Tanggal', 'name' => 'contract_date', 'type' => 'date', 'width' => '1/2'],
            ['label' => 'Para Pihak', 'name' => 'parties', 'type' => 'textarea', 'width' => '1/1'],
            ['label' => 'Ringkasan Objek', 'name' => 'object_summary', 'type' => 'textarea', 'width' => '1/1'],
        ];

        foreach ($fields as $idx => $f) {
            $template->fields()->create([
                'label' => $f['label'],
                'name' => $f['name'],
                'type' => $f['type'],
                'parent_id' => $groupHeader->id,
                'width' => $f['width'],
                'order' => $idx,
            ]);
        }

        $groupApprove = $template->fields()->create([
            'label' => 'Otorisasi & Persetujuan',
            'name' => 'otorisasi',
            'type' => 'group',
            'width' => '1/1',
            'order' => 2,
        ]);

        $signatures = [
            ['label' => 'Dibuat oleh', 'name' => 'sig_initiator', 'width' => '1/3'],
            ['label' => 'Diketahui oleh', 'name' => 'sig_legal', 'width' => '1/3'],
            ['label' => 'Disetujui oleh', 'name' => 'sig_vp', 'width' => '1/3'],
        ];

        foreach ($signatures as $idx => $s) {
            $template->fields()->create([
                'label' => $s['label'],
                'name' => $s['name'],
                'type' => 'signature_box',
                'parent_id' => $groupApprove->id,
                'width' => $s['width'],
                'order' => $idx,
            ]);
        }
    }
}
