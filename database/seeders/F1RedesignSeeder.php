<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class F1RedesignSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::first();
        if (!$admin) return;

        $templateName = 'F1 - FORMULIR PERMINTAAN PERJANJIAN';

        // 1. TOTAL CLEANUP
        DB::table('form_templates')->where('document_type', 'f1')->delete();

        // 2. CREATE TEMPLATE
        $templateId = (string) Str::uuid();
        DB::table('form_templates')->insert([
            'id' => $templateId,
            'name' => $templateName,
            'description' => 'F1 Professional template with high-fidelity boxed layout and formal legal typography.',
            'document_type' => 'f1',
            'has_letterhead' => true,
            'is_active' => true,
            'created_by' => $admin->id,
            'updated_by' => $admin->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $order = 0;

        // HELPER
        $ins = function($data) use ($templateId, &$order) {
            $id = (string) Str::uuid();
            $payload = array_merge([
                'id' => $id,
                'form_template_id' => $templateId,
                'label' => '',
                'name' => 'f1_' . Str::random(12),
                'order' => $order++,
                'width' => '100',
                'is_required' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ], $data);
            if (isset($payload['options'])) $payload['options'] = json_encode($payload['options']);
            DB::table('form_fields')->insert($payload);
            return $id;
        };

        // 3. HEADER
        $hGridId = $ins([
            'name' => 'f1_header_grid', 'type' => 'grid_x',
            'options' => ['grid_cols' => 2, 'col_sizes' => ['180px', 'auto'], 'margin_bottom' => 20]
        ]);
        
        // Logo part
        $ins(['parent_id' => $hGridId, 'name' => 'f1_logo', 'type' => 'image', 'options' => [
            'logo_url' => '/storage/fr_logo.png', 
            'logo_size' => 200, 
            'alignment' => 'left',
            'padding_top' => 5
        ]]);
        
        // Metadata Box (The "Nomor/Topik" box)
        $mBoxId = $ins(['parent_id' => $hGridId, 'name' => 'f1_meta_box', 'type' => 'group', 'options' => [
            'border_style' => 'solid', 'border_width' => 1, 'border_color' => '#000'
        ]]);
        
        $meta = [
            ['NOMOR', ''], 
            ['EX SOP NO.', '-'], 
            ['TOPIK', 'PERJANJIAN / PERIJINAN / REGISTRASI'], 
            ['SUB TOPIK', 'PERMINTAAN PEMBUATAN PERJANJIAN'], 
            ['LAMPIRAN', '']
        ];
        foreach ($meta as $idx => $row) {
            $rgId = $ins(['parent_id' => $mBoxId, 'name' => 'f1_meta_r_'.$idx, 'type' => 'grid_x', 'options' => [
                'grid_cols' => 3, 'col_sizes' => ['100px', '20px', 'auto'], 
                'border_style' => $idx < 4 ? 'bottom' : 'none', 
                'border_color' => '#000', 'padding_y' => 4
            ]]);
            $ins(['parent_id' => $rgId, 'label' => $row[0], 'type' => 'static_text', 'options' => ['font_weight' => 'bold', 'font_size' => 10, 'padding_left' => 10]]);
            $ins(['parent_id' => $rgId, 'label' => ':', 'type' => 'static_text', 'options' => ['font_weight' => 'bold', 'alignment' => 'center', 'font_size' => 10]]);
            $ins(['parent_id' => $rgId, 'label' => $row[1], 'name' => 'meta_'.Str::slug($row[0], '_'), 'type' => 'textfield', 'options' => ['font_size' => 10, 'field_style' => 'dashed_bottom']]);
        }

        // MAIN TITLE
        $ins(['label' => "FORMULIR PERMINTAAN PEMBUATAN PERJANJIAN", 'name' => 'f1_main_title', 'type' => 'static_text', 'options' => [
            'font_size' => 14, 'font_weight' => 'bold', 'alignment' => 'center', 'padding_y' => 10, 'margin_bottom' => 20
        ]]);

        // 4. SECTION I: INFORMASI DASAR
        $ins(['label' => "I. INFORMASI DASAR PERJANJIAN", 'name' => 'sec_i_title', 'type' => 'static_text', 'options' => [
            'font_weight' => 'bold', 'font_size' => 12, 'margin_bottom' => 10, 'border_style' => 'bottom', 'border_width' => 2
        ]]);

        $bodyRows = [
            ['TANGGAL PERMINTAAN', 'f1_date', 'date'], 
            ['JUDUL / NAMA PERJANJIAN', 'f1_title', 'textfield'], 
            ['TUJUAN / LATAR BELAKANG KERJASAMA', 'f1_tujuan', 'textarea']
        ];
        foreach ($bodyRows as $row) {
            $bgId = $ins(['name' => 'f1_row_'.$row[1], 'type' => 'grid_x', 'options' => ['grid_cols' => 3, 'col_sizes' => ['220px', '30px', 'auto'], 'padding_y' => 8]]);
            $ins(['parent_id' => $bgId, 'label' => $row[0], 'type' => 'static_text', 'options' => ['font_weight' => 'bold', 'font_size' => 11]]);
            $ins(['parent_id' => $bgId, 'label' => ':', 'type' => 'static_text', 'options' => ['alignment' => 'center', 'font_weight' => 'bold']]);
            $ins(['parent_id' => $bgId, 'name' => 'bv_'.$row[1], 'type' => $row[2], 'options' => ['field_style' => 'dashed_bottom', 'font_size' => 11.5, 'min_height' => $row[2] == 'textarea' ? 60 : null]]);
        }

        // Sifat Perjanjian
        $sfId = $ins(['name' => 'f1_sifat_row', 'type' => 'grid_x', 'options' => ['grid_cols' => 3, 'col_sizes' => ['220px', '30px', 'auto'], 'padding_y' => 8, 'margin_bottom' => 5]]);
        $ins(['parent_id' => $sfId, 'label' => 'SIFAT PERJANJIAN', 'type' => 'static_text', 'options' => ['font_weight' => 'bold', 'font_size' => 11]]);
        $ins(['parent_id' => $sfId, 'label' => ':', 'type' => 'static_text', 'options' => ['alignment' => 'center', 'font_weight' => 'bold']]);
        $ins(['parent_id' => $sfId, 'name' => 'sifat_perjanjian', 'type' => 'searchable_select', 'options' => [
            'placeholder' => 'Pilih Sifat Perjanjian...',
            'items' => [
                ['label' => 'BARU', 'value' => 'BARU'],
                ['label' => 'PERPANJANGAN', 'value' => 'PERPANJANGAN'],
                ['label' => 'ADDENDUM / REVIEW / PERALIHAN', 'value' => 'ADDENDUM / REVIEW / PERALIHAN']
            ]
        ]]);

        // 5. SECTION II & III: IDENTITAS PIHAK
        $pihakSections = [
            ['II. IDENTITAS PIHAK PERTAMA (INTERNAL)', 'p1'],
            ['III. IDENTITAS PIHAK KEDUA (EKSTERNAL)', 'p2']
        ];
        foreach($pihakSections as $sec) {
            $ins(['label' => $sec[0], 'type' => 'static_text', 'options' => [
                'font_weight' => 'bold', 'font_size' => 12, 'margin_top' => 20, 'margin_bottom' => 10, 'border_style' => 'bottom', 'border_width' => 2
            ]]);
            $fields = [
                ['NAMA ENTITAS / PERUSAHAAN', 'entity'],
                ['NAMA PENANDATANGAN KONTRAK', 'signer'],
                ['JABATAN PENANDATANGAN', 'position'],
            ];
            foreach ($fields as $row) {
                $rgId = $ins(['name' => 'f1_pihak_'.$sec[1].'_'.$row[1], 'type' => 'grid_x', 'options' => ['grid_cols' => 3, 'col_sizes' => ['220px', '30px', 'auto'], 'padding_y' => 6]]);
                $ins(['parent_id' => $rgId, 'label' => $row[0], 'type' => 'static_text', 'options' => ['font_weight' => 'bold', 'font_size' => 11]]);
                $ins(['parent_id' => $rgId, 'label' => ':', 'type' => 'static_text', 'options' => ['alignment' => 'center', 'font_weight' => 'bold']]);
                $ins(['parent_id' => $rgId, 'name' => 'v_'.$sec[1].'_'.$row[1], 'type' => 'textfield', 'options' => ['field_style' => 'dashed_bottom', 'font_size' => 11.5]]);
            }
        }

        // 6. SECTION IV: DETAIL KOMERSIAL
        $ins(['label' => "IV. DETAIL KOMERSIAL & OPERASIONAL", 'name' => 'sec_iv_title', 'type' => 'static_text', 'options' => [
            'font_weight' => 'bold', 'font_size' => 12, 'margin_top' => 20, 'margin_bottom' => 10, 'border_style' => 'bottom', 'border_width' => 2
        ]]);
        $detailFields = [
            ['MASA BERLAKU / JANGKA WAKTU', 'jw'], 
            ['LOKASI / AREA PEKERJAAN', 'loc'], 
            ['DIMENSI / LUAS (M2)', 'luas'], 
            ['NILAI TRANSAKSI / IMBALAN JASA', 'price'], 
            ['MEKANISME & SYARAT PEMBAYARAN', 'top']
        ];
        foreach ($detailFields as $row) {
            $rgId = $ins(['name' => 'f1_detail_'.$row[1], 'type' => 'grid_x', 'options' => ['grid_cols' => 3, 'col_sizes' => ['220px', '30px', 'auto'], 'padding_y' => 6]]);
            $ins(['parent_id' => $rgId, 'label' => $row[0], 'type' => 'static_text', 'options' => ['font_weight' => 'bold', 'font_size' => 11]]);
            $ins(['parent_id' => $rgId, 'label' => ':', 'type' => 'static_text', 'options' => ['alignment' => 'center', 'font_weight' => 'bold']]);
            $ins(['parent_id' => $rgId, 'name' => 'tdv_'.$row[1], 'type' => 'textfield', 'options' => ['field_style' => 'dashed_bottom', 'font_size' => 11.5]]);
        }

        // Perpajakan
        $txId = $ins(['name' => 'f1_tax_row', 'type' => 'grid_x', 'options' => ['grid_cols' => 3, 'col_sizes' => ['220px', '30px', 'auto'], 'padding_y' => 10]]);
        $ins(['parent_id' => $txId, 'label' => 'ASPEK PERPAJAKAN', 'type' => 'static_text', 'options' => ['font_weight' => 'bold', 'font_size' => 11]]);
        $ins(['parent_id' => $txId, 'label' => ':', 'type' => 'static_text', 'options' => ['alignment' => 'center', 'font_weight' => 'bold']]);
        $txCont = $ins(['parent_id' => $txId, 'type' => 'grid_x', 'options' => ['grid_cols' => 2, 'gap' => 30]]);
        
        $ins(['parent_id' => $txCont, 'label' => 'PEMBEBANAN PPN', 'name' => 'tax_ppn', 'type' => 'select', 
            'options' => ['show_label' => true, 'font_size' => 10, 'font_weight' => 'bold', 'items' => [
                ['label' => 'Ditanggung Pihak I', 'value' => 'Pihak I'],
                ['label' => 'Ditanggung Pihak II', 'value' => 'Pihak II'],
                ['label' => 'Bebas / Tidak Terutang', 'value' => 'N/A']
            ]]
        ]);
        $ins(['parent_id' => $txCont, 'label' => 'PEMBEBANAN PPH', 'name' => 'tax_pph', 'type' => 'select', 
            'options' => ['show_label' => true, 'font_size' => 10, 'font_weight' => 'bold', 'items' => [
                ['label' => 'Dipotong Pihak I', 'value' => 'Pihak I'],
                ['label' => 'Dipotong Pihak II', 'value' => 'Pihak II'],
                ['label' => 'N/A', 'value' => 'N/A']
            ]]
        ]);

        // Klausul
        $klId = $ins(['name' => 'f1_klausul_row', 'type' => 'grid_x', 'options' => ['grid_cols' => 3, 'col_sizes' => ['220px', '30px', 'auto'], 'margin_top' => 10, 'padding_y' => 6]]);
        $ins(['parent_id' => $klId, 'label' => 'RINGKASAN KLAUSUL PENTING', 'type' => 'static_text', 'options' => ['font_weight' => 'bold', 'font_size' => 11]]);
        $ins(['parent_id' => $klId, 'label' => ':', 'type' => 'static_text', 'options' => ['alignment' => 'center', 'font_weight' => 'bold']]);
        $ins(['parent_id' => $klId, 'name' => 'kl_field', 'type' => 'textarea', 'options' => ['min_height' => 100, 'border_style' => 'solid', 'padding_all' => 10, 'font_size' => 11.5, 'background_color' => '#fcfcfc']]);

        // 7. SIGNATURE FRAME (Modern 3-Column)
        $sigFrameID = $ins(['name' => 'f1_sig_frame', 'type' => 'group', 'options' => [
            'border_style' => 'solid', 'border_width' => 1, 'margin_top' => 30
        ]]);
        
        // Header
        $sigHGrid = $ins(['parent_id' => $sigFrameID, 'name' => 'f1_sig_h', 'type' => 'grid_x', 'options' => ['grid_cols' => 2, 'col_sizes' => ['1fr', '2fr']]]);
        $ins(['parent_id' => $sigHGrid, 'label' => 'PEMOHON', 'type' => 'static_text', 'options' => ['alignment' => 'center', 'font_weight' => 'bold', 'padding_y' => 6, 'border_style' => 'right']]);
        $ins(['parent_id' => $sigHGrid, 'label' => 'PERSETUJUAN PERMINTAAN', 'type' => 'static_text', 'options' => ['alignment' => 'center', 'font_weight' => 'bold', 'padding_y' => 6]]);
        
        // Signature Boxes
        $sigBGrid = $ins(['parent_id' => $sigFrameID, 'name' => 'f1_sig_body', 'type' => 'grid_x', 'options' => ['grid_cols' => 3, 'border_style' => 'y']]);
        for($i=1; $i<=3; $i++) {
            $ins(['parent_id' => $sigBGrid, 'name' => 'sig_f1_box_'.$i, 'type' => 'group', 'options' => [
                'min_height' => 90, 'border_style' => $i < 3 ? 'right' : 'none'
            ]]);
        }
        
        // Roles
        $sigRGrid = $ins(['parent_id' => $sigFrameID, 'name' => 'f1_sig_roles', 'type' => 'grid_x', 'options' => ['grid_cols' => 3]]);
        $roles = ['DEPT. HEAD', 'VICE PRESIDENT', 'CEO / MANAGEMENT'];
        foreach($roles as $idx => $r) {
            $ins(['parent_id' => $sigRGrid, 'label' => $r, 'type' => 'static_text', 'options' => [
                'alignment' => 'center', 'font_weight' => 'bold', 'font_size' => 10, 'padding_y' => 4, 
                'border_style' => $idx < 2 ? 'right' : 'none'
            ]]);
        }

        // 8. FOOTER & NOTES
        $footerId = $ins(['name' => 'f1_footer_group', 'type' => 'group', 'options' => ['margin_top' => 20]]);
        $ins(['parent_id' => $footerId, 'label' => "Dokumen Lampiran Wajib (Jika ada):\n- Akte & TDP Perusahaan\n- SIUP & NPWP Terupdate\n- KTP Direksi Penandatangan\n- Dokumen QCF/Bidding Terlampir", 'type' => 'static_text', 'options' => [
            'font_size' => 10, 'line_height' => 1.5, 'padding_top' => 10, 'color' => '#64748b'
        ]]);

        echo ">>> F1 PROFESSIONAL REDESIGN SEEDER COMPLETED\n";
    }
}
