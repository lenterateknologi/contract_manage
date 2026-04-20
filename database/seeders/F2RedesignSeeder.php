<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class F2RedesignSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::first();
        if (!$admin) return;

        $templateName = 'F2 - RESUME DAN PERSETUJUAN';

        // 1. CLEANUP
        DB::table('form_templates')->where('document_type', 'f2')->delete();

        // 2. CREATE TEMPLATE
        $templateId = (string) Str::uuid();
        DB::table('form_templates')->insert([
            'id' => $templateId,
            'name' => $templateName,
            'description' => 'F2 Resume template with pixel-perfect boxed layout matching the official "Resume dan Persetujuan" document.',
            'document_type' => 'f2',
            'has_letterhead' => false,
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
                'name' => 'f2_' . Str::random(12),
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

        // 3. OUTER BORDER (The black outline in the image)
        $mainBoxId = $ins(['name' => 'f2_main_layout', 'type' => 'group', 'options' => [
            'border_style' => 'solid', 
            'border_width' => 1.5, 
            'border_color' => '#000',
            'padding_all' => 30, // Increased for a roomier feel
            'margin_bottom' => 30
        ]]);

        // 4. HEADER TITLE BOX
        $headerBoxId = $ins(['parent_id' => $mainBoxId, 'name' => 'f2_header_box', 'type' => 'grid_x', 'options' => [
            'grid_cols' => 3, 'col_sizes' => ['80px', 'auto', '80px'], 
            'border_style' => 'solid', 'border_width' => 1, 'margin_bottom' => 25 // Increased
        ]]);
        // Left spacer with line
        $ins(['parent_id' => $headerBoxId, 'name' => 'h_left_spacer', 'type' => 'static_text', 'options' => ['border_style' => 'right', 'min_height' => 60]]);
        // Title text - Perfectly centered now
        $ins(['parent_id' => $headerBoxId, 'label' => 'RESUME DAN PERSETUJUAN (Perjanjian Baru/ Addendum / Amandement / Perubahan Perjanjian)*', 'name' => 'f2_title', 'type' => 'static_text', 'options' => [
            'font_size' => 12, 'font_weight' => 'bold', 'alignment' => 'center', 'padding_y' => 20
        ]]);
        // Right spacer to balance centering
        $ins(['parent_id' => $headerBoxId, 'name' => 'h_right_spacer', 'type' => 'static_text']);

        // 5. TOP METADATA TABLE (Boxed 2-column)
        $metaTableId = $ins(['parent_id' => $mainBoxId, 'name' => 'f2_meta_table', 'type' => 'group', 'options' => [
            'border_style' => 'solid', 'border_width' => 1, 'margin_bottom' => 25 // Increased
        ]]);
        
        // Row 1: Perjanjian Tentang
        $r1Id = $ins(['parent_id' => $metaTableId, 'name' => 'meta_r1', 'type' => 'grid_x', 'options' => ['grid_cols' => 2, 'col_sizes' => ['220px', 'auto'], 'border_style' => 'bottom']]);
        $ins(['parent_id' => $r1Id, 'label' => 'PERJANJIAN TENTANG', 'name' => 'lbl_tentang', 'type' => 'static_text', 'options' => ['padding_all' => 12, 'border_style' => 'right', 'font_size' => 11.5, 'font_weight' => 'bold']]);
        $ins(['parent_id' => $r1Id, 'name' => 'perjanjian_tentang', 'type' => 'textfield', 'options' => ['padding_all' => 12, 'field_style' => 'dashed_bottom', 'font_size' => 11.5]]);

        // Row 2: No/Tgl/User
        $r2Id = $ins(['parent_id' => $metaTableId, 'name' => 'meta_r2', 'type' => 'grid_x', 'options' => ['grid_cols' => 2, 'col_sizes' => ['220px', 'auto']]]);
        $ins(['parent_id' => $r2Id, 'label' => "NO. PERJANJIAN / TANGGAL F2\nDIMOHONKAN OLEH", 'name' => 'lbl_meta_stacked', 'type' => 'static_text', 'options' => ['padding_all' => 12, 'border_style' => 'right', 'font_size' => 11, 'font_weight' => 'bold']]);
        $ins(['parent_id' => $r2Id, 'name' => 'meta_detail_text', 'type' => 'textfield', 'options' => ['padding_all' => 12, 'field_style' => 'dashed_bottom', 'font_size' => 11.5], 'label' => '[nomor perjanjian] / [tgl f2] / [user]']);

        // 6. PARTIES LIST
        $partyBoxId = $ins(['parent_id' => $mainBoxId, 'name' => 'party_info', 'type' => 'group', 'options' => ['margin_bottom' => 25]]);
        $ins(['parent_id' => $partyBoxId, 'label' => 'PIHAK PERTAMA : ADHITYA SERAYAKORITA', 'type' => 'static_text', 'options' => ['font_weight' => 'bold', 'margin_bottom' => 4, 'font_size' => 11.5]]);
        $p2Row = $ins(['parent_id' => $partyBoxId, 'type' => 'grid_x', 'options' => ['grid_cols' => 2, 'col_sizes' => ['110px', 'auto']]]);
        $ins(['parent_id' => $p2Row, 'label' => 'PIHAK KEDUA  : ', 'type' => 'static_text', 'options' => ['font_weight' => 'bold', 'font_size' => 11.5]]);
        $ins(['parent_id' => $p2Row, 'name' => 'pihak_kedua', 'type' => 'textfield', 'options' => ['font_weight' => 'bold', 'font_size' => 11.5]]);
        
        $ins(['parent_id' => $partyBoxId, 'label' => 'ISI PERJANJIAN :', 'type' => 'static_text', 'options' => ['margin_top' => 15, 'font_size' => 11.5, 'font_weight' => 'bold']]);

        // 7. ISI KETENTUAN TABLE (Boxed)
        $isiTableId = $ins(['parent_id' => $mainBoxId, 'name' => 'isi_table', 'type' => 'group', 'options' => [
            'border_style' => 'solid', 'border_width' => 1, 'margin_bottom' => 25
        ]]);
        // Table Header Line
        $ins(['parent_id' => $isiTableId, 'label' => 'ISI KETENTUAN', 'type' => 'static_text', 'options' => ['alignment' => 'center', 'font_weight' => 'bold', 'padding_y' => 10, 'border_style' => 'bottom', 'font_size' => 12]]);
        
        $isiRows = [
            ['RUANG LINGKUP', 'ruang_lingkup'],
            ['HARGA PEKERJAAN', 'harga_pekerjaan'],
            ['CARA PEMBAYARAN', 'cara_pembayaran'],
            ['JANGKA WAKTU', 'jangka_waktu'],
            ['LOKASI', 'lokasi']
        ];
        foreach($isiRows as $idx => $r) {
            $rowId = $ins(['parent_id' => $isiTableId, 'name' => 'isi_row_'.$idx, 'type' => 'grid_x', 'options' => [
                'grid_cols' => 2, 'col_sizes' => ['180px', 'auto'], 
                'border_style' => $idx < 4 ? 'bottom' : 'none'
            ]]);
            $ins(['parent_id' => $rowId, 'label' => $r[0], 'type' => 'static_text', 'options' => ['padding_all' => 12, 'border_style' => 'right', 'font_size' => 11, 'font_weight' => 'bold']]);
            $ins(['parent_id' => $rowId, 'name' => $r[1], 'type' => 'textfield', 'options' => ['padding_all' => 12, 'font_size' => 11.5]]);
        }

        // 8. REPRESENTATIVES Section
        $repBoxId = $ins(['parent_id' => $mainBoxId, 'name' => 'rep_box', 'type' => 'group', 'options' => ['margin_bottom' => 30]]);
        
        $p1RepRow = $ins(['parent_id' => $repBoxId, 'type' => 'grid_x', 'options' => ['grid_cols' => 4, 'col_sizes' => ['220px', 'auto', '60px', 'auto']]]);
        $ins(['parent_id' => $p1RepRow, 'label' => 'PIHAK PERTAMA DIWAKILI OLEH', 'type' => 'static_text', 'options' => ['font_size' => 11, 'font_weight' => 'bold']]);
        $ins(['parent_id' => $p1RepRow, 'name' => 'nama_pihak_1', 'type' => 'textfield', 'options' => ['font_weight' => 'bold', 'font_size' => 11.5]]);
        $ins(['parent_id' => $p1RepRow, 'label' => 'SELAKU', 'name' => 'rep1_selaku', 'type' => 'static_text', 'options' => ['font_size' => 11, 'font_weight' => 'bold']]);
        $ins(['parent_id' => $p1RepRow, 'name' => 'jabatan_pihak_1', 'type' => 'textfield', 'options' => ['font_weight' => 'bold', 'font_size' => 11.5]]);

        $p2RepRow = $ins(['parent_id' => $repBoxId, 'type' => 'grid_x', 'options' => ['grid_cols' => 4, 'col_sizes' => ['220px', 'auto', '60px', 'auto'], 'margin_top' => 10]]);
        $ins(['parent_id' => $p2RepRow, 'label' => 'PIHAK KEDUA DIWAKILI OLEH', 'type' => 'static_text', 'options' => ['font_size' => 11, 'font_weight' => 'bold']]);
        $ins(['parent_id' => $p2RepRow, 'name' => 'nama_pihak_2', 'type' => 'textfield', 'options' => ['font_weight' => 'bold', 'font_size' => 11.5, 'placeholder' => '[nama]']]);
        $ins(['parent_id' => $p2RepRow, 'label' => 'SELAKU', 'type' => 'static_text', 'options' => ['font_size' => 11, 'font_weight' => 'bold']]);
        $ins(['parent_id' => $p2RepRow, 'name' => 'jabatan_pihak_2', 'type' => 'textfield', 'options' => ['font_weight' => 'bold', 'font_size' => 11.5, 'placeholder' => '[role/jabatan]']]);

        // 9. THE GRAY CLOSING STATEMENT
        $ins(['parent_id' => $mainBoxId, 'label' => 'Demikian Resume ini dibuat untuk mendapat persetujuan Management, terima kasih.', 'name' => 'closing_line', 'type' => 'static_text', 'options' => [
            'padding_all' => 15, 'background_color' => '#f8fafc', 'font_style' => 'italic', 'margin_bottom' => 30, 'border_style' => 'solid', 'border_width' => 1, 'border_color' => '#e2e8f0', 'font_size' => 11, 'alignment' => 'center'
        ]]);

        // 10. SIGNATURE MATRIX (5-column Boxed)
        $sigMasterBoxId = $ins(['parent_id' => $mainBoxId, 'name' => 'sig_master', 'type' => 'group', 'options' => [
            'border_style' => 'solid', 'border_width' => 1, 'margin_top' => 20
        ]]);
        
        // Row 1: Labels
        $sigLabelsGrid = $ins(['parent_id' => $sigMasterBoxId, 'type' => 'grid_x', 'options' => ['grid_cols' => 5, 'border_style' => 'bottom']]);
        $ins(['parent_id' => $sigLabelsGrid, 'label' => 'DIBUAT OLEH :', 'type' => 'static_text', 'options' => ['alignment' => 'center', 'padding_y' => 10, 'border_style' => 'right', 'font_size' => 10, 'font_weight' => 'bold']]);
        $ins(['parent_id' => $sigLabelsGrid, 'label' => 'DIKETAHUI OLEH :', 'type' => 'static_text', 'options' => ['alignment' => 'center', 'padding_y' => 10, 'border_style' => 'right', 'font_size' => 10, 'font_weight' => 'bold', 'grid_col_span' => 3]]);
        $ins(['parent_id' => $sigLabelsGrid, 'label' => 'DISETUJUI OLEH :', 'type' => 'static_text', 'options' => ['alignment' => 'center', 'padding_y' => 10, 'font_size' => 10, 'font_weight' => 'bold']]);

        // Row 2: Signature Boxes
        $sigBoxesGrid = $ins(['parent_id' => $sigMasterBoxId, 'type' => 'grid_x', 'options' => ['grid_cols' => 5, 'border_style' => 'bottom']]);
        $sigPlaceholders = ['[nama PIC]', '[manager legal]', '[VP legal]', '[atasan user]', '[management]'];
        foreach($sigPlaceholders as $i => $ph) {
            $boxId = $ins(['parent_id' => $sigBoxesGrid, 'name' => 'sig_container_'.$i, 'type' => 'group', 'options' => [
                'min_height' => 130, 'border_style' => $i < 4 ? 'right' : 'none', 'padding_all' => 10
            ]]);
            $ins(['parent_id' => $boxId, 'name' => 'sig_val_'.$i, 'type' => 'textfield', 'options' => ['margin_top' => 100, 'alignment' => 'center', 'font_size' => 11, 'font_weight' => 'bold'], 'label' => $ph]);
        }

        // Row 3: Tgl Labels
        $sigTglGrid = $ins(['parent_id' => $sigMasterBoxId, 'type' => 'grid_x', 'options' => ['grid_cols' => 5]]);
        for($i=0; $i<5; $i++) {
            $ins(['parent_id' => $sigTglGrid, 'label' => 'Tgl.', 'type' => 'static_text', 'options' => [
                'padding_x' => 10, 'padding_y' => 6, 'font_size' => 9, 'border_style' => $i < 4 ? 'right' : 'none'
            ]]);
        }

        // 11. VERSION CODE & NOTES
        $footerGrid = $ins(['parent_id' => $mainBoxId, 'type' => 'grid_x', 'options' => ['grid_cols' => 1, 'margin_top' => 5]]);
        $ins(['parent_id' => $footerGrid, 'label' => 'Form F2/Legal', 'type' => 'static_text', 'options' => ['alignment' => 'right', 'font_size' => 9, 'font_weight' => 'bold']]);

        $notesGroupId = $ins(['name' => 'f2_ext_notes', 'type' => 'group', 'options' => ['margin_top' => 20]]);
        $ins(['parent_id' => $notesGroupId, 'label' => "Note:\n(*) Coret salah satu\n(**) Review Note pada halaman belakang", 'type' => 'static_text', 'options' => [
            'font_size' => 10, 'line_height' => 1.5, 'white_space' => 'pre-line'
        ]]);

        echo ">>> PIXEL-PERFECT F2 REDESIGN SEEDER COMPLETED\n";
    }
}
