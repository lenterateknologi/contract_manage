<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class FormCustomF1Seeder extends Seeder
{
    public function run(): void
    {
        $admin = User::first();
        if (! $admin) {
            echo ">>> NO ADMIN USER FOUND. EXITING.\n";

            return;
        }

        // Cleanup old templates
        $names = ['FORM F1 PENGISIAN PERJANJIAN JUAL BELI', 'FORM F1 ADDENDUM ATAU PERUBAHAN PERJANJIAN'];
        $oldTemplates = DB::table('m_form_templates')->whereIn('name', $names)->get();
        foreach ($oldTemplates as $t) {
            DB::table('m_form_fields')->where('form_template_id', $t->id)->delete();
            DB::table('m_form_templates')->where('id', $t->id)->delete();
        }

        // FORM 1: Jual Beli
        $templateId1 = Str::uuid()->toString();

        DB::table('m_form_templates')->insert([
            'id' => $templateId1,
            'name' => 'FORM F1 PENGISIAN PERJANJIAN JUAL BELI',
            'description' => 'Formulir isian perjanjian jual beli',
            'document_type' => 'f1',
            'has_letterhead' => true,
            'is_active' => true,
            'created_by' => $admin->id,
            'updated_by' => $admin->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $fields1 = [
            $this->createSection('1. Identitas Para Pihak', [
                $this->createField('a. Nama Penjual/Supplier', 'Isi nama lengkap penjual/supplier yang berpartisipasi dalam transaksi'),
                $this->createField('b. Nama Wakil dan Jabatan yang akan menandatangani', 'Isi nama sesuai di akta atau kuasa dari direksi atau pengurus yang berhak'),
                $this->createField('c. Alamat Penjual', 'Isi alamat lengkap penjual', 'textarea'),
                $this->createField('d. Nama Pembeli', 'Isi nama lengkap pembeli yang berpartisipasi dalam transaksi'),
                $this->createField('e. Nama Wakil dan Jabatan yang akan menandatangani', 'Isi nama sesuai di akta atau kuasa dari direksi atau pengurus yang berhak'),
                $this->createField('f. Alamat Pembeli', 'Isi alamat lengkap pembeli', 'textarea'),
            ]),
            $this->createSection('2. Deskripsi Barang yang Dijual', [
                $this->createField('a. Jenis Barang', 'Contoh: Barang elektronik, kendaraan, tanah, atau barang lainnya'),
                $this->createField('b. Detail Barang', 'Cantumkan spesifikasi barang, seperti merk, model, ukuran, kualitas, kondisi barang (baru/bekas), item-item apa saja yang termasuk/tidak termasuk dalam penjualan (misalnya instalasi, commissioning, training, pengiriman) dll', 'textarea'),
                $this->createField('c. Jumlah Barang', 'Cantumkan jumlah atau volume barang yang dijual'),
            ]),
            $this->createSection('3. Harga dan Pembayaran', [
                $this->createField('a. Harga Barang', 'Tuliskan harga total barang yang dijual dalam mata uang yang disepakati'),
                $this->createField('b. Harga Barang sudah termasuk', 'Tuliskan hal-hal yang sudah didapat atas Harga Barang', 'textarea'),
                $this->createField('c. Harga Barang tidak termasuk', 'Tuliskan hal-hal yang belum di dapat atas Harga Barang', 'textarea'),
                $this->createField('d. Pajak', 'Tuliskan pajak yang akan ditanggung oleh penjual dan pembeli'),
                $this->createField('e. Jadwal Pembayaran', 'Cantumkan apakah pembayaran dilakukan sekaligus atau bertahap (misalnya, termin atau down payment)', 'textarea'),
                $this->createField('f. Dokumen Pembayaran', 'Cantumkan dokumen apa saja yang mesti dilengkapi agar pembeli membayar atas Harga Barang', 'textarea'),
                $this->createField('g. Metode Pembayaran', 'Sebutkan metode pembayaran yang disepakati (misalnya, transfer bank, tunai, cek, dll.)'),
                $this->createField('h. Jangka Waktu pembayaran', 'Sebutkan berapa hari pembeli akan membayar Harga barang sesuai Jadwal pembayaran sejak diterimanya dokumen pembayaran dengan lengkap dan benar'),
            ]),
            $this->createSection('4. Pengiriman dan Penyerahan Barang', [
                $this->createField('a. Metode pengiriman', 'Cantumkan metode pengiriman, contoh seperti Franco, Loco, FOB atau CIF', 'textarea'),
                $this->createField('b. Lokasi Penyerahan Barang', 'Jelaskan lokasi penyerahan barang (misalnya, di tempat penjual, di lokasi pembeli, atau lokasi lain yang disepakati)', 'textarea'),
                $this->createField('c. Tanggal Pengiriman/Serah Terima', 'Tuliskan tanggal atau periode waktu untuk pengiriman atau penyerahan barang, termasuk tanggal instalasi dan/atau commissioning bila diperlukan'),
                $this->createField('d. Biaya Pengiriman', 'Sebutkan pihak yang menanggung biaya pengiriman (penjual, pembeli, atau dibagi bersama)'),
            ]),
            $this->createSection('5. Jaminan dan Garansi', [
                $this->createField('a. Jaminan Barang', 'Jelaskan apakah barang yang dijual disertai jaminan (misalnya, garansi pabrik atau garansi dari penjual)'),
                $this->createField('b. Jangka Waktu Garansi', 'Tuliskan jangka waktu berlakunya garansi (misalnya, 6 bulan, 1 tahun, dll.)'),
                $this->createField('c. Ketentuan Garansi', 'Jelaskan secara singkat apa saja yang dicakup dalam garansi, misalnya perbaikan, penggantian barang, dll', 'textarea'),
            ]),
            $this->createSection('6. Sanksi atas Keterlambatan', [
                $this->createField('a. Sanksi Keterlambatan Pengiriman', 'Tuliskan sanksi yang berlaku jika penjual terlambat mengirimkan barang sesuai dengan jadwal yang disepakati', 'textarea'),
                $this->createField('b. Sanksi Keterlambatan Pembayaran', 'Tuliskan sanksi yang berlaku jika pembeli terlambat melakukan pembayaran', 'textarea'),
            ]),
            $this->createSection('7. Ketentuan Penolakan atau Pengembalian Barang', [
                $this->createField('a. Syarat Penolakan Barang', 'Jelaskan ketentuan yang berlaku jika pembeli menolak barang karena cacat atau tidak sesuai spesifikasi atau tidak memenuhi performa yang disepakati', 'textarea'),
                $this->createField('b. Prosedur Pengembalian Barang', 'Jelaskan prosedur yang harus diikuti untuk pengembalian barang, jika terjadi cacat atau ketidaksesuaian', 'textarea'),
                $this->createField('c. Batas Waktu Pengajuan Klaim', 'Cantumkan batas waktu bagi pembeli untuk mengajukan klaim penolakan atau pengembalian barang (misalnya, 7 hari setelah penerimaan barang)'),
            ]),
            $this->createSection('8. Force Majeure', [
                $this->createField('a. Keadaan Force Majeure', 'Cantumkan kondisi yang dianggap force majeure (misalnya, bencana alam, perang, kebakaran, dll.) yang dapat mempengaruhi pelaksanaan perjanjian', 'textarea'),
                $this->createField('b. Dampak Force Majeure', 'Jelaskan tindakan yang harus diambil jika terjadi force majeure, termasuk kemungkinan penundaan atau pembatalan pengiriman dan pembayaran', 'textarea'),
            ]),
            $this->createSection('9. Penyelesaian Perselisihan', [
                $this->createField('a. Mekanisme Penyelesaian Sengketa', 'Tuliskan mekanisme yang disepakati untuk penyelesaian sengketa (misalnya, mediasi, arbitrase, atau pengadilan)'),
                $this->createField('b. Pilihan Hukum yang Berlaku', 'Tuliskan pilihan hukum yang disepakati (misalnya, hukum Indonesia)'),
            ]),
            $this->createSection('10. Concern dan Kekhawatiran Khusus (Opsional)', [
                $this->createField('a. Apakah Ada Kekhawatiran Khusus Mengenai Pengiriman atau Penyerahan Barang?', 'Jelaskan jika ada kekhawatiran tertentu mengenai logistik, lokasi pengiriman, atau kondisi penyerahan barang yang ingin diperhatikan', 'textarea'),
                $this->createField('b. Apakah Ada Persyaratan Khusus Mengenai Kualitas atau Jaminan Barang?', 'Jelaskan jika ada spesifikasi khusus atau jaminan tambahan yang harus diperhatikan dalam perjanjian', 'textarea'),
                $this->createField('c. Apakah Ada Ketentuan Tambahan yang Harus Diakomodasi?', 'Cantumkan ketentuan tambahan yang ingin dimasukkan ke dalam perjanjian, seperti pengecualian tertentu, perlindungan aset, atau kondisi khusus lainnya', 'textarea'),
                $this->createField('d. Komentar atau Saran Lainnya', 'Tuliskan komentar atau saran lain yang ingin disampaikan kepada tim legal untuk dimasukkan ke dalam draf perjanjian jual beli', 'textarea'),
            ]),
        ];

        $order1 = 0;
        $this->insertFields($fields1, $templateId1, null, $order1);

        // FORM 2: Addendum
        $templateId2 = Str::uuid()->toString();

        DB::table('m_form_templates')->insert([
            'id' => $templateId2,
            'name' => 'FORM F1 ADDENDUM ATAU PERUBAHAN PERJANJIAN',
            'description' => 'Formulir isian untuk addendum atau perubahan perjanjian',
            'document_type' => 'f1',
            'has_letterhead' => true,
            'is_active' => true,
            'created_by' => $admin->id,
            'updated_by' => $admin->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $fields2 = [
            $this->createSection('1. Identitas Para Pihak', [
                $this->createField('a. Nama Penjual/Penyedia Jasa/Pemberi Sewa/Vendor', 'Isi nama lengkap penjual/penyedia jasa/pemberi sewa/vendor yang berpartisipasi dalam transaksi'),
                $this->createField('b. Nama Wakil dan Jabatan yang akan menandatangani', 'Isi nama sesuai di akta atau kuasa dari direksi atau pengurus yang berhak'),
                $this->createField('c. Alamat Penjual/Penyedia Jasa/Pemberi Sewa/Vendor', 'Isi alamat lengkap penjual/penyedia jasa/pemberi sewa/vendor', 'textarea'),
                $this->createField('d. Nama Pembeli/Penerima Jasa/Penyewa/Pemilik Proyek', 'Isi nama lengkap pembeli/penerima jasa/penyewa/pemilik proyek yang berpartisipasi dalam transaksi'),
                $this->createField('e. Alamat Pembeli/Penerima Jasa/Penyewa/Pemilik Proyek', 'Isi alamat lengkap pembeli/penerima jasa/penyewa/pemilik proyek', 'textarea'),
                $this->createField('g. Nama Wakil dan Jabatan yang akan menandatangani (Pembeli)', 'Isi nama sesuai di akta atau kuasa dari direksi atau pengurus yang berhak'),
            ]),
            $this->createSection('2. Nomor dan Tanggal Perjanjian Awal', [
                $this->createField('a. Nomor Perjanjian Awal', 'Cantumkan nomor perjanjian asli yang akan diubah'),
                $this->createField('b. Tanggal Perjanjian Awal', 'Tuliskan tanggal perjanjian asli yang berlaku', 'date'),
            ]),
            $this->createSection('3. Bagian yang Akan Diubah', [
                $this->createField('a. Pasal/Bagian yang Diubah', 'Cantumkan pasal atau bagian tertentu dari perjanjian yang akan diubah (misalnya, pasal tentang harga, jadwal pembayaran, atau pengiriman)', 'textarea'),
                $this->createField('b. Deskripsi Perubahan', 'Jelaskan secara rinci perubahan yang akan dilakukan (misalnya, perubahan harga barang, penyesuaian jadwal, atau perubahan ketentuan pengiriman)', 'textarea'),
            ]),
            $this->createSection('4. Alasan Perubahan', [
                $this->createField('a. Alasan Dilakukannya Perubahan', 'Jelaskan alasan mengapa perubahan ini diperlukan (misalnya, perubahan kondisi pasar, penyesuaian kontrak berdasarkan negosiasi baru, dll.)', 'textarea'),
            ]),
            $this->createSection('5. Dampak Perubahan Terhadap Ketentuan Lain', [
                $this->createField('a. Pengaruh Terhadap Pasal Lain dalam Perjanjian', 'Cantumkan apakah perubahan ini mempengaruhi ketentuan lain dalam perjanjian (misalnya, pembayaran, hak dan kewajiban tambahan, dll.)', 'textarea'),
                $this->createField('b. Apakah Ada Ketentuan yang Tetap Tidak Berubah?', 'Tuliskan bagian-bagian dari perjanjian awal yang tetap berlaku dan tidak terpengaruh oleh perubahan ini', 'textarea'),
            ]),
            $this->createSection('6. Tanggal Efektif Perubahan', [
                $this->createField('a. Tanggal Mulai Berlaku Perubahan', 'Tuliskan tanggal mulai efektifnya perubahan dalam perjanjian ini', 'date'),
            ]),
            $this->createSection('7. Concern dan Kekhawatiran Khusus Mengenai Perubahan (Opsional)', [
                $this->createField('a. Apakah Ada Kekhawatiran Mengenai Dampak Perubahan Ini?', 'Jelaskan jika ada kekhawatiran khusus yang terkait dengan perubahan yang diajukan (misalnya, pengaruh terhadap kualitas barang, risiko logistik, atau ketentuan lain)', 'textarea'),
                $this->createField('b. Apakah Ada Persyaratan Khusus Mengenai Implementasi Perubahan?', 'Jelaskan jika ada syarat atau kondisi tertentu yang harus dipenuhi dalam mengimplementasikan perubahan ini (misalnya, waktu implementasi, persyaratan tambahan, dll.)', 'textarea'),
            ]),
            $this->createSection('8. Penyelesaian Perselisihan Mengenai Perubahan', [
                $this->createField('a. Mekanisme Penyelesaian Sengketa', 'Jika ada potensi perselisihan terkait perubahan, cantumkan mekanisme penyelesaian yang disepakati (misalnya, mediasi, arbitrase, atau pengadilan)', 'textarea'),
            ]),
        ];

        $order2 = 0;
        $this->insertFields($fields2, $templateId2, null, $order2);

        echo ">>> FORM F1 CUSTOM SEEDER COMPLETED\n";
    }

    private function createSection($label, $children = [])
    {
        $headerField = [
            'id' => Str::uuid()->toString(),
            'label' => $label,
            'name' => 'header_'.Str::slug($label, '_').'_'.Str::random(4),
            'type' => 'static_text',
            'placeholder' => null,
            'width' => '100',
            'is_required' => false,
            'options' => json_encode([
                'font_size' => 14,
                'font_weight' => 'bold',
                'font_family' => "'Inter', sans-serif",
                'padding_all' => 0,
            ]),
        ];

        array_unshift($children, $headerField);

        return [
            'id' => Str::uuid()->toString(),
            'label' => '',
            'name' => 'section_'.Str::slug($label, '_').'_'.Str::random(4),
            'type' => 'grid_y',
            'container_type' => null,
            'width' => '100',
            'options' => json_encode(['gap' => 16, 'border_style' => 'solid', 'border_width' => 1, 'padding_all' => 10]),
            'children' => $children,
        ];
    }

    private function createField($label, $placeholder = '', $valueType = 'textfield', $isRequired = false)
    {
        return [
            'id' => Str::uuid()->toString(),
            'label' => $label,
            'name' => 'field_'.Str::slug($label, '_').'_'.Str::random(4),
            'type' => 'labeled_value',
            'placeholder' => $placeholder,
            'width' => '100',
            'is_required' => $isRequired,
            'options' => json_encode([
                'value_type' => $valueType,
                'label_width' => '180',
                'show_colon' => true,
                'field_style' => 'dashed_bottom',
                'font_size' => 11,
                'font_family' => "'Inter', sans-serif",
            ]),
        ];
    }

    private function insertFields($fields, $templateId, $parentId, &$order)
    {
        foreach ($fields as $field) {
            $children = $field['children'] ?? [];

            DB::table('m_form_fields')->insert([
                'id' => $field['id'],
                'form_template_id' => $templateId,
                'parent_id' => $parentId,
                'label' => $field['label'],
                'name' => $field['name'],
                'type' => $field['type'],
                'container_type' => $field['container_type'] ?? null,
                'placeholder' => $field['placeholder'] ?? null,
                'is_required' => $field['is_required'] ?? false,
                'use_rich_text' => $field['use_rich_text'] ?? false,
                'width' => $field['width'] ?? '100',
                'options' => $field['options'] ?? null,
                'order' => $order++,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            if (! empty($children)) {
                $this->insertFields($children, $templateId, $field['id'], $order);
            }
        }
    }
}
