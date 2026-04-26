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
        $templateId = "515493da-f5a3-453b-bf52-e5f379bef933";

        // 1. TOTAL CLEANUP
        DB::table('m_form_fields')->where('form_template_id', $templateId)->delete();
        DB::table('m_form_templates')->where('id', $templateId)->delete();

        echo ">>> CLEANED UP EXISTING F1 TEMPLATE\n";

        // 2. CREATE TEMPLATE
        DB::table('m_form_templates')->insert([
            'id'          => $templateId,
            'name'        => $templateName,
            'description' => 'F1 Professional template with standardized meta_ naming and high-fidelity document styling.',
            'document_type' => 'f1',
            'has_letterhead' => true,
            'is_active'   => true,
            'created_by'  => $admin->id,
            'updated_by'  => $admin->id,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        // 3. FIELDS — standardized with meta_ prefix
        $fields = [
            [
                "id" => "019dbe62-687d-7211-8c49-9cdad0a43091",
                "name" => "f1_header_grid",
                "type" => "grid_x",
                "options" => ["grid_cols" => 2, "col_sizes" => ["180px", "auto"], "margin_bottom" => 20],
                "order" => 0,
                "children" => [
                    [
                        "id" => "019dbe62-6894-7213-a072-8dbee2634e7e",
                        "name" => "meta_logo",
                        "type" => "image",
                        "options" => ["logo_url" => "/storage/fr_logo.png", "logo_size" => 200, "alignment" => "left", "padding_top" => 5],
                        "order" => 1
                    ],
                    [
                        "id" => "019dbe62-6895-7311-a39b-6e0d69e46646",
                        "name" => "f1_meta_box",
                        "type" => "group",
                        "options" => ["border_style" => "solid", "border_width" => 1, "border_color" => "#000"],
                        "order" => 2,
                        "children" => [
                            [
                                "id" => "019dbe62-6896-7282-9335-b7724b968a51",
                                "label" => "NOMOR",
                                "name" => "meta_nomor",
                                "type" => "labeled_value",
                                "options" => ["label_width" => "100px", "show_colon" => true, "field_style" => "dashed_bottom", "font_weight_label" => "bold", "font_size" => 10],
                                "order" => 3
                            ],
                            [
                                "id" => "019dbe62-6898-731c-9ebf-bd41c5b3b64a",
                                "label" => "TOPIK",
                                "name" => "meta_topik",
                                "type" => "labeled_value",
                                "options" => ["label_width" => "100px", "show_colon" => true, "field_style" => "dashed_bottom", "font_weight_label" => "bold", "font_size" => 10],
                                "order" => 4
                            ],
                            [
                                "id" => "019dbe62-6899-72be-a7c0-7ca5ed135888",
                                "label" => "SUB TOPIK",
                                "name" => "meta_sub_topik",
                                "type" => "labeled_value",
                                "options" => ["label_width" => "100px", "show_colon" => true, "field_style" => "dashed_bottom", "font_weight_label" => "bold", "font_size" => 10],
                                "order" => 5
                            ],
                            [
                                "id" => "019dbe62-6899-72be-a7c0-7ca5edeaed9e",
                                "label" => "LAMPIRAN",
                                "name" => "meta_lampiran",
                                "type" => "labeled_value",
                                "options" => ["label_width" => "100px", "show_colon" => true, "value_type" => "textarea", "field_style" => "dashed_bottom", "font_weight_label" => "bold", "font_size" => 10],
                                "order" => 6
                            ]
                        ]
                    ]
                ]
            ],
            [
                "id" => "019dbe62-689a-7203-a682-baa5f0269278",
                "label" => "FORMULIR PERMINTAAN PEMBUATAN PERJANJIAN",
                "name" => "f1_main_title",
                "type" => "static_text",
                "options" => ["font_size" => 14, "font_weight" => "bold", "alignment" => "center", "padding_y" => 10, "margin_bottom" => 20],
                "order" => 7
            ],
            [
                "id" => "019dbe62-689b-7080-ae5d-5ec40c7ba79c",
                "label" => "I. INFORMASI DASAR PERJANJIAN",
                "name" => "f1_sec_1_title",
                "type" => "static_text",
                "options" => ["font_size" => 12, "font_weight" => "bold", "alignment" => "left", "padding_y" => 10, "margin_bottom" => 0],
                "order" => 8
            ],
            [
                "id" => "019dbe62-689b-7080-ae5d-5ec40d0a8e88",
                "label" => "Tgl Dibuat",
                "name" => "meta_tgl_dibuat",
                "type" => "labeled_value",
                "options" => ["value_type" => "date", "label_width" => "220px", "show_colon" => true, "field_style" => "dashed_bottom", "font_size" => 11.5],
                "order" => 9
            ],
            [
                "id" => "019dbe62-689c-72df-819f-dbecb640a658",
                "label" => "Judul Kontrak",
                "name" => "meta_judul_kontrak",
                "type" => "labeled_value",
                "options" => ["value_type" => "textfield", "label_width" => "220px", "show_colon" => true, "field_style" => "dashed_bottom", "font_size" => 11.5],
                "order" => 10
            ],
            [
                "id" => "019dbe62-689d-7034-9f7f-cb17093f9f80",
                "label" => "Tipe Perjanjian",
                "name" => "meta_tipe_perjanjian",
                "type" => "labeled_value",
                "options" => ["value_type" => "textfield", "label_width" => "220px", "show_colon" => true, "field_style" => "dashed_bottom", "font_size" => 11.5],
                "order" => 11
            ],
            [
                "id" => "019dbe62-689d-7034-9f7f-cb17094c8827",
                "label" => "II. IDENTITAS PIHAK PERTAMA",
                "name" => "f1_sec_2_title",
                "type" => "static_text",
                "options" => ["font_size" => 12, "font_weight" => "bold", "alignment" => "left", "padding_y" => 10, "margin_top" => 20],
                "order" => 12
            ],
            [
                "id" => "019dbe62-689f-724b-8ae1-2b0343bf0a04",
                "label" => "NAMA ENTITAS / PERUSAHAAN",
                "name" => "meta_p1_entity",
                "type" => "labeled_value",
                "options" => ["value_type" => "textfield", "label_width" => "220px", "show_colon" => true, "field_style" => "dashed_bottom", "font_size" => 11.5],
                "order" => 13
            ],
            [
                "id" => "019dbe62-68a0-7394-96e3-acbcede586eb",
                "label" => "NAMA PENANDATANGAN KONTRAK",
                "name" => "meta_p1_signer",
                "type" => "labeled_value",
                "options" => ["value_type" => "textfield", "label_width" => "220px", "show_colon" => true, "field_style" => "dashed_bottom", "font_size" => 11.5],
                "order" => 14
            ],
            [
                "id" => "019dbe62-68a0-7394-96e3-acbceebd04d8",
                "label" => "JABATAN PENANDATANGAN KONTRAK",
                "name" => "meta_p1_signer_position",
                "type" => "labeled_value",
                "options" => ["value_type" => "textfield", "label_width" => "220px", "show_colon" => true, "field_style" => "dashed_bottom", "font_size" => 11.5],
                "order" => 15
            ],
            [
                "id" => "019dbe62-68a1-73f6-8982-aaffd2b7f888",
                "label" => "ALAMAT LENGKAP",
                "name" => "meta_p1_alamat",
                "type" => "labeled_value",
                "options" => ["value_type" => "textarea", "label_width" => "220px", "show_colon" => true, "field_style" => "dashed_bottom", "font_size" => 11.5],
                "order" => 16
            ],
            [
                "id" => "019dbe62-68a2-71ad-b766-3adb0746349a",
                "label" => "III. IDENTITAS PIHAK KEDUA",
                "name" => "f1_sec_3_title",
                "type" => "static_text",
                "options" => ["font_size" => 12, "font_weight" => "bold", "alignment" => "left", "padding_y" => 10, "margin_top" => 20],
                "order" => 17
            ],
            [
                "id" => "019dbe62-68a2-71ad-b766-3adb0759ffe4",
                "label" => "NAMA ENTITAS / PERUSAHAAN",
                "name" => "meta_p2_entity",
                "type" => "labeled_value",
                "options" => ["value_type" => "textfield", "label_width" => "220px", "show_colon" => true, "field_style" => "dashed_bottom", "font_size" => 11.5],
                "order" => 18
            ],
            [
                "id" => "019dbe62-68a3-7340-8d27-10e55419493b",
                "label" => "NAMA PENANDATANGAN KONTRAK",
                "name" => "meta_p2_signer",
                "type" => "labeled_value",
                "options" => ["value_type" => "textfield", "label_width" => "220px", "show_colon" => true, "field_style" => "dashed_bottom", "font_size" => 11.5],
                "order" => 19
            ],
            [
                "id" => "019dbe62-68a3-7340-8d27-10e554b0cb75",
                "label" => "JABATAN PENANDATANGAN KONTRAK",
                "name" => "meta_p2_signer_position",
                "type" => "labeled_value",
                "options" => ["value_type" => "textfield", "label_width" => "220px", "show_colon" => true, "field_style" => "dashed_bottom", "font_size" => 11.5],
                "order" => 20
            ],
            [
                "id" => "019dbe62-68a4-719c-9447-38ad57b34e87",
                "label" => "ALAMAT LENGKAP",
                "name" => "meta_p2_alamat",
                "type" => "labeled_value",
                "options" => ["value_type" => "textarea", "label_width" => "220px", "show_colon" => true, "field_style" => "dashed_bottom", "font_size" => 11.5],
                "order" => 21
            ],
            [
                "id" => "019dbe62-68a5-721f-8777-6f02a23e6c3e",
                "label" => "IV. DETAIL KOMERSIAL & OPERASIONAL",
                "name" => "f1_sec_4_title",
                "type" => "static_text",
                "options" => ["font_size" => 12, "font_weight" => "bold", "alignment" => "left", "padding_y" => 10, "margin_top" => 20],
                "order" => 22
            ],
            [
                "id" => "019dbe62-68aa-70a9-b2e3-8997b280d385",
                "label" => "MASA BERLAKU / JANGKA WAKTU",
                "name" => "meta_masa_berlaku",
                "type" => "labeled_value",
                "options" => ["value_type" => "textfield", "label_width" => "220px", "show_colon" => true, "field_style" => "dashed_bottom", "font_size" => 11.5],
                "order" => 23
            ],
            [
                "id" => "019dbe62-68ab-72dd-a3d6-50396d95a9e3",
                "label" => "LOKASI / AREA PEKERJAAN",
                "name" => "meta_lokasi",
                "type" => "labeled_value",
                "options" => ["value_type" => "textfield", "label_width" => "220px", "show_colon" => true, "field_style" => "dashed_bottom", "font_size" => 11.5],
                "order" => 24
            ],
            [
                "id" => "019dbe62-68ac-70ec-af1a-447fd86fdf40",
                "label" => "DIMENSI / LUAS (M2)",
                "name" => "meta_dimensi",
                "type" => "labeled_value",
                "options" => ["value_type" => "textfield", "label_width" => "220px", "show_colon" => true, "field_style" => "dashed_bottom", "font_size" => 11.5],
                "order" => 25
            ],
            [
                "id" => "019dbe62-68b1-72ed-b92e-eb40eac2bdc0",
                "label" => "NILAI TRANSAKSI / IMBALAN JASA",
                "name" => "meta_nilai_transaksi",
                "type" => "labeled_value",
                "options" => ["value_type" => "textfield", "label_width" => "220px", "show_colon" => true, "field_style" => "dashed_bottom", "font_size" => 11.5],
                "order" => 26
            ],
            [
                "id" => "019dbe62-68b4-730a-a36f-f0d366b1fc86",
                "label" => "MEKANISME & SYARAT PEMBAYARAN",
                "name" => "meta_mekanisme_pembayaran",
                "type" => "labeled_value",
                "options" => ["value_type" => "textfield", "label_width" => "220px", "show_colon" => true, "field_style" => "dashed_bottom", "font_size" => 11.5],
                "order" => 27
            ],
            [
                "id" => "019dbe62-68b5-70bf-870f-b3d96ca2dd8e",
                "label" => "PEMBEBANAN PPN",
                "name" => "meta_ppn",
                "type" => "labeled_value",
                "options" => ["value_type" => "select", "label_width" => "220px", "show_colon" => true, "font_size" => 11, "font_weight_label" => "bold", "items" => [
                    ["label" => "Ditanggung Pihak I", "value" => "Pihak I"],
                    ["label" => "Ditanggung Pihak II", "value" => "Pihak II"],
                    ["label" => "Bebas / Tidak Terutang", "value" => "N/A"]
                ]],
                "order" => 28
            ],
            [
                "id" => "019dbe62-68b6-7200-afd2-c8ddd9d81ae5",
                "label" => "PEMBEBANAN PPH",
                "name" => "meta_pph",
                "type" => "labeled_value",
                "options" => ["value_type" => "select", "label_width" => "220px", "show_colon" => true, "font_size" => 11, "font_weight_label" => "bold", "items" => [
                    ["label" => "Dipotong Pihak I", "value" => "Pihak I"],
                    ["label" => "Dipotong Pihak II", "value" => "Pihak II"],
                    ["label" => "N/A", "value" => "N/A"]
                ]],
                "order" => 29
            ],
            [
                "id" => "019dbe62-68ba-7316-97dd-eff13f76b38b",
                "label" => "RINGKASAN KLAUSUL PENTING",
                "name" => "meta_ringkasan_klausul",
                "type" => "labeled_value",
                "options" => ["value_type" => "textarea", "label_width" => "220px", "show_colon" => true, "min_height" => 100, "font_size" => 11, "font_weight_label" => "bold", "field_style" => "dashed_bottom"],
                "order" => 30
            ]
        ];

        $this->seedFields($fields, $templateId, null);

        echo ">>> F1 REDESIGN SEEDER COMPLETED\n";
    }

    private function seedFields(array $fields, $templateId, $parentId): void
    {
        foreach ($fields as $field) {
            $children = $field['children'] ?? [];
            unset($field['children']);

            $field['options'] = isset($field['options']) ? json_encode($field['options']) : null;

            $data = array_merge([
                'label'           => '',
                'placeholder'     => '',
                'width'           => '100',
                'is_required'     => false,
                'form_template_id'=> $templateId,
                'parent_id'       => $parentId,
                'created_at'      => now(),
                'updated_at'      => now(),
            ], $field);

            DB::table('m_form_fields')->insert($data);

            if (!empty($children)) {
                $this->seedFields($children, $templateId, $field['id']);
            }
        }
    }
}
