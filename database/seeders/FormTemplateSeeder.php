<?php

namespace Database\Seeders;

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

        // ════════════════════════════════════════════════════════════════
        //  F1 TEMPLATE — FORMULIR PERMINTAAN PEMBUATAN PERJANJIAN
        //  Universal (no contract_type_id) — applies to all types
        // ════════════════════════════════════════════════════════════════

        $this->seedTemplate($admin->id, null, 'f1',
            'FORMULIR PERMINTAAN PEMBUATAN PERJANJIAN',
            'Form F1 pengajuan permintaan pembuatan perjanjian. Berlaku untuk semua tipe kontrak.',
            [
                // ── Header ──
                ['label' => 'PT. LENTERA KREASI TEKNOLOGI', 'type' => 'kop_surat', 'width' => '1/1', 'is_required' => false],
                ['label' => 'FORMULIR PERMINTAAN PEMBUATAN PERJANJIAN', 'type' => 'form_title', 'width' => '1/1', 'is_required' => false],

                // ── Tanggal & Judul ──
                ['label' => 'Tanggal', 'type' => 'date', 'placeholder' => '', 'is_required' => true, 'width' => '1/2'],
                ['label' => 'Judul', 'type' => 'text', 'placeholder' => 'Judul perjanjian...', 'is_required' => true, 'width' => '1/1'],

                // ── Type Perjanjian ──
                ['label' => 'Type Perjanjian', 'type' => 'select', 'placeholder' => 'Pilih type perjanjian...', 'is_required' => true, 'width' => '1/2',
                 'options' => ['Baru', 'Perpanjangan', 'Review', 'Sewa Menyewa', 'Kontrak Jasa', 'Sales Purchase', 'Lainnya']],
                ['label' => 'Type Perjanjian Lainnya (sebutkan)', 'type' => 'text', 'placeholder' => 'Sebutkan jika memilih Lainnya...', 'is_required' => false, 'width' => '1/2'],

                // ── Tujuan/Latar Belakang ──
                ['label' => 'Tujuan/Latar Belakang', 'type' => 'textarea', 'placeholder' => 'Tujuan dan latar belakang perjanjian...', 'is_required' => true, 'width' => '1/1'],

                // ── Pihak I ──
                ['label' => 'Pihak I (PT.)', 'type' => 'text', 'placeholder' => 'PT. ...', 'is_required' => true, 'width' => '1/2'],
                ['label' => 'Pihak I Lainnya (sebutkan)', 'type' => 'text', 'placeholder' => 'Sebutkan jika bukan PT...', 'is_required' => false, 'width' => '1/2'],
                ['label' => 'Penandatanganan Pihak I', 'type' => 'text', 'placeholder' => 'Nama penandatangan...', 'is_required' => true, 'width' => '1/2'],
                ['label' => 'Jabatan Pihak I', 'type' => 'select', 'placeholder' => 'Pilih jabatan...', 'is_required' => true, 'width' => '1/2',
                 'options' => ['Direksi', 'Kuasa Direksi']],

                // ── Pihak II ──
                ['label' => 'Pihak II (PT.)', 'type' => 'text', 'placeholder' => 'PT. ...', 'is_required' => false, 'width' => '1/3'],
                ['label' => 'Pihak II (Perorangan)', 'type' => 'text', 'placeholder' => 'Nama perorangan...', 'is_required' => false, 'width' => '1/3'],
                ['label' => 'Penandatanganan Pihak II', 'type' => 'text', 'placeholder' => 'Nama penandatangan...', 'is_required' => true, 'width' => '1/3'],
                ['label' => 'Jabatan Pihak II', 'type' => 'select', 'placeholder' => 'Pilih jabatan...', 'is_required' => true, 'width' => '1/2',
                 'options' => ['Direksi', 'Kuasa Direksi']],

                // ── Jangka Waktu ──
                ['label' => 'Jangka Waktu (Mulai)', 'type' => 'date', 'placeholder' => '', 'is_required' => true, 'width' => '1/2'],
                ['label' => 'Jangka Waktu (s.d)', 'type' => 'date', 'placeholder' => '', 'is_required' => true, 'width' => '1/2'],

                // ── Lokasi, Luas, Harga ──
                ['label' => 'Lokasi Area', 'type' => 'text', 'placeholder' => 'Lokasi area...', 'is_required' => true, 'width' => '1/1'],
                ['label' => 'Luas (m²)', 'type' => 'text', 'placeholder' => 'Luas area jika ada...', 'is_required' => false, 'width' => '1/2'],
                ['label' => 'Harga/Fee', 'type' => 'text', 'placeholder' => 'Nominal harga/fee...', 'is_required' => true, 'width' => '1/2'],
                ['label' => 'Terms of Payment', 'type' => 'text', 'placeholder' => 'Ketentuan pembayaran...', 'is_required' => true, 'width' => '1/1'],

                // ── Perpajakan ──
                ['label' => 'PPN', 'type' => 'select', 'placeholder' => 'Pilih...', 'is_required' => true, 'width' => '1/2',
                 'options' => ['Ditanggung Pihak I', 'Ditanggung Pihak II']],
                ['label' => 'PPh', 'type' => 'select', 'placeholder' => 'Pilih...', 'is_required' => true, 'width' => '1/2',
                 'options' => ['Ditanggung Pihak I', 'Ditanggung Pihak II']],

                // ── Bahasa & Hukum ──
                ['label' => 'Bahasa', 'type' => 'select', 'placeholder' => 'Pilih bahasa...', 'is_required' => true, 'width' => '1/2',
                 'options' => ['Indonesia', 'Inggris']],
                ['label' => 'Hukum yang Berlaku', 'type' => 'select', 'placeholder' => 'Pilih hukum...', 'is_required' => true, 'width' => '1/2',
                 'options' => ['Indonesia', 'Lainnya']],
                ['label' => 'Hukum Lainnya (sebutkan)', 'type' => 'text', 'placeholder' => 'Sebutkan jika memilih Lainnya...', 'is_required' => false, 'width' => '1/2'],

                // ── Klausul Lainnya ──
                ['label' => 'Klausul Lainnya', 'type' => 'textarea', 'placeholder' => 'Klausul tambahan...', 'is_required' => false, 'width' => '1/1'],
            ]
        );

        // ════════════════════════════════════════════════════════════════
        //  F2 TEMPLATE — RESUME DAN PERSETUJUAN
        //  Universal (no contract_type_id) — single template for all
        // ════════════════════════════════════════════════════════════════

        $this->seedTemplate($admin->id, null, 'f2',
            'RESUME DAN PERSETUJUAN',
            'Form F2 resume dan persetujuan perjanjian. Berlaku untuk semua tipe kontrak.',
            [
                ['label' => 'RESUME DAN PERSETUJUAN', 'type' => 'form_title', 'width' => '1/1', 'is_required' => false],

                // ── Header info ──
                ['label' => 'Jenis Perjanjian', 'type' => 'select', 'placeholder' => 'Pilih jenis...', 'is_required' => true, 'width' => '1/2',
                 'options' => ['Perjanjian Baru', 'Addendum', 'Amandement', 'Perubahan Perjanjian']],
                ['label' => 'Perjanjian tentang', 'type' => 'text', 'placeholder' => 'Nama/judul perjanjian...', 'is_required' => true, 'width' => '1/2'],
                ['label' => 'No. Perjanjian', 'type' => 'text', 'placeholder' => 'Nomor perjanjian...', 'is_required' => true, 'width' => '1/3'],
                ['label' => 'Tanggal', 'type' => 'date', 'placeholder' => '', 'is_required' => true, 'width' => '1/3'],
                ['label' => 'Dimohonkan oleh', 'type' => 'text', 'placeholder' => 'Nama pemohon (user)...', 'is_required' => true, 'width' => '1/3'],

                // ── Pihak ──
                ['label' => 'Pihak Pertama', 'type' => 'text', 'placeholder' => 'PT ...', 'is_required' => true, 'width' => '1/2'],
                ['label' => 'Pihak Kedua', 'type' => 'text', 'placeholder' => 'PT / Perorangan...', 'is_required' => true, 'width' => '1/2'],

                // ── Isi Perjanjian ──
                ['label' => 'Ruang Lingkup', 'type' => 'textarea', 'placeholder' => 'Ruang lingkup perjanjian...', 'is_required' => true, 'width' => '1/1'],
                ['label' => 'Harga Pekerjaan', 'type' => 'textarea', 'placeholder' => 'Detail harga pekerjaan...', 'is_required' => true, 'width' => '1/1'],
                ['label' => 'Cara Pembayaran', 'type' => 'textarea', 'placeholder' => 'Mekanisme pembayaran...', 'is_required' => true, 'width' => '1/1'],
                ['label' => 'Jangka Waktu', 'type' => 'textarea', 'placeholder' => 'Durasi perjanjian...', 'is_required' => true, 'width' => '1/1'],
                ['label' => 'Lokasi', 'type' => 'textarea', 'placeholder' => 'Lokasi pelaksanaan...', 'is_required' => true, 'width' => '1/1'],

                // ── Perwakilan ──
                ['label' => 'Nama Direksi Pihak Pertama', 'type' => 'text', 'placeholder' => 'Nama direktur...', 'is_required' => true, 'width' => '1/2'],
                ['label' => 'Jabatan Pihak Pertama', 'type' => 'text', 'placeholder' => 'Direktur', 'is_required' => true, 'width' => '1/2'],
                ['label' => 'Nama Direksi Pihak Kedua', 'type' => 'text', 'placeholder' => 'Nama direktur vendor...', 'is_required' => true, 'width' => '1/2'],
                ['label' => 'Jabatan Pihak Kedua', 'type' => 'text', 'placeholder' => 'Direktur', 'is_required' => true, 'width' => '1/2'],

                // ── Approval info ──
                ['label' => 'Dibuat oleh (Nama PIC)', 'type' => 'signature_box', 'placeholder' => 'Nama PIC...', 'is_required' => true, 'width' => '1/3',
                 'options' => ['role' => 'Dibuat oleh :', 'name_placeholder' => '[nama pic]']],
                ['label' => 'Diketahui oleh (Manager Legal)', 'type' => 'signature_box', 'placeholder' => 'Nama manager legal...', 'is_required' => false, 'width' => '1/3',
                 'options' => ['role' => 'Diketahui oleh :', 'name_placeholder' => '[manager legal]']],
                ['label' => 'Diketahui oleh (VP Legal)', 'type' => 'signature_box', 'placeholder' => 'Nama VP legal...', 'is_required' => false, 'width' => '1/3',
                 'options' => ['role' => 'Disetujui oleh :', 'name_placeholder' => '[management]']],
                ['label' => 'Catatan Tambahan', 'type' => 'textarea', 'placeholder' => 'Catatan / review note...', 'is_required' => false, 'width' => '1/1'],
            ]
        );
    }

    private function seedTemplate(string $userId, ?string $contractTypeId, string $documentType, string $name, string $description, array $fields): void
    {
        $template = FormTemplate::create([
            'name' => $name,
            'description' => $description,
            'contract_type_id' => $contractTypeId,
            'document_type' => $documentType,
            'is_active' => true,
            'created_by' => $userId,
            'updated_by' => $userId,
        ]);

        foreach ($fields as $index => $fieldData) {
            $template->fields()->create([
                'label' => $fieldData['label'],
                'name' => Str::snake($fieldData['label']),
                'type' => $fieldData['type'],
                'placeholder' => $fieldData['placeholder'] ?? null,
                'is_required' => $fieldData['is_required'] ?? false,
                'width' => $fieldData['width'] ?? '1/1',
                'options' => $fieldData['options'] ?? null,
                'order' => $index,
            ]);
        }
    }
}
