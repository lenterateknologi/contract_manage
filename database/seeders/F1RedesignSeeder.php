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

        $fields = [
            [
                "id" => "019db402-e36c-719f-9bab-b96a82dc9eab",
                "name" => "f1_header_grid",
                "type" => "grid_x",
                "width" => "100",
                "is_required" => false,
                "options" => [
                    "grid_cols" => 2,
                    "col_sizes" => ["180px", "auto"],
                    "margin_bottom" => 20
                ],
                "order" => 0,
                "children" => [
                    [
                        "id" => "019db402-e36e-7282-990b-79d58c8116f1",
                        "name" => "f1_logo",
                        "type" => "image",
                        "width" => "100",
                        "is_required" => false,
                        "options" => [
                            "logo_url" => "/storage/fr_logo.png",
                            "logo_size" => 200,
                            "alignment" => "left",
                            "padding_top" => 5
                        ],
                        "order" => 1,
                        "children" => []
                    ],
                    [
                        "id" => "019db402-e373-719b-a70b-d02e083bc0ee",
                        "name" => "f1_meta_box",
                        "type" => "group",
                        "width" => "100",
                        "is_required" => false,
                        "options" => [
                            "border_style" => "solid",
                            "border_width" => 1,
                            "border_color" => "#000"
                        ],
                        "order" => 2,
                        "children" => [
                            [
                                "id" => "019db402-e377-72cd-99ad-e2a38633c2af",
                                "label" => "NOMOR",
                                "name" => "meta_nomor",
                                "type" => "labeled_value",
                                "width" => "100",
                                "is_required" => false,
                                "options" => [
                                    "label_width" => "100px",
                                    "show_colon" => true,
                                    "padding_all" => 4,
                                    "border_style" => "bottom",
                                    "border_color" => "#000",
                                    "font_size" => 10,
                                    "field_style" => "none",
                                    "font_weight_label" => "bold"
                                ],
                                "order" => 3,
                                "children" => []
                            ],
                            [
                                "id" => "019db402-e37d-7245-9ffe-c3bba73bbd09",
                                "label" => "TOPIK",
                                "name" => "meta_topik",
                                "type" => "labeled_value",
                                "width" => "100",
                                "is_required" => false,
                                "options" => [
                                    "label_width" => "100px",
                                    "show_colon" => true,
                                    "padding_all" => 4,
                                    "border_style" => "bottom",
                                    "border_color" => "#000",
                                    "font_size" => 10,
                                    "field_style" => "none",
                                    "font_weight_label" => "bold"
                                ],
                                "order" => 4,
                                "children" => []
                            ],
                            [
                                "id" => "019db402-e386-70ee-b363-a00c958ff017",
                                "label" => "SUB TOPIK",
                                "name" => "meta_sub_topik",
                                "type" => "labeled_value",
                                "width" => "100",
                                "is_required" => false,
                                "options" => [
                                    "label_width" => "100px",
                                    "show_colon" => true,
                                    "padding_all" => 4,
                                    "border_style" => "bottom",
                                    "border_color" => "#000",
                                    "font_size" => 10,
                                    "field_style" => "none",
                                    "font_weight_label" => "bold"
                                ],
                                "order" => 5,
                                "children" => []
                            ],
                            [
                                "id" => "019db402-e38b-7219-ba6e-d1c8d6dafda8",
                                "label" => "LAMPIRAN",
                                "name" => "meta_lampiran",
                                "type" => "labeled_value",
                                "width" => "100",
                                "is_required" => false,
                                "options" => [
                                    "label_width" => "100px",
                                    "show_colon" => true,
                                    "padding_all" => 4,
                                    "border_style" => "none",
                                    "border_color" => "#000",
                                    "font_size" => 10,
                                    "field_style" => "none",
                                    "font_weight_label" => "bold"
                                ],
                                "order" => 6,
                                "children" => []
                            ]
                        ]
                    ]
                ]
            ],
            [
                "id" => "019db402-e38e-7150-aa99-f46e37de616a",
                "label" => "FORMULIR PERMINTAAN PEMBUATAN PERJANJIAN",
                "name" => "f1_main_title",
                "type" => "static_text",
                "width" => "100",
                "is_required" => false,
                "options" => [
                    "font_size" => 14,
                    "font_weight" => "bold",
                    "alignment" => "center",
                    "padding_y" => 10,
                    "margin_bottom" => 20
                ],
                "order" => 7,
                "children" => []
            ],
            [
                "id" => "05CEB701-B2B3-4F97-84AA-FE4E26B9B0CF",
                "label" => "I. INFORMASI DASAR PERJANJIAN",
                "name" => "f1_main_title_copy",
                "type" => "static_text",
                "width" => "100",
                "is_required" => false,
                "options" => [
                    "font_size" => 12,
                    "font_weight" => "bold",
                    "alignment" => "left",
                    "padding_y" => 10,
                    "margin_bottom" => 0
                ],
                "order" => 8,
                "children" => []
            ],
            [
                "id" => "019db402-e391-7201-b6b2-a8820fb9e923",
                "label" => "Tgl Dibuat",
                "name" => "bv_f1_date",
                "type" => "labeled_value",
                "width" => "100",
                "is_required" => false,
                "options" => [
                    "value_type" => "date",
                    "label_width" => "220px",
                    "show_colon" => true,
                    "field_style" => "dashed_bottom",
                    "font_size" => 11.5
                ],
                "order" => 9,
                "children" => []
            ],
            [
                "id" => "019db402-e395-705d-8b97-36578079638d",
                "label" => "Judul Kontrak",
                "name" => "bv_f1_title",
                "type" => "labeled_value",
                "width" => "100",
                "is_required" => false,
                "options" => [
                    "value_type" => "textfield",
                    "label_width" => "220px",
                    "show_colon" => true,
                    "field_style" => "dashed_bottom",
                    "font_size" => 11.5
                ],
                "order" => 10,
                "children" => []
            ],
            [
                "id" => "019db402-e397-701e-a5b9-805b2367985b",
                "label" => "TUJUAN / LATAR BELAKANG KERJASAMA",
                "name" => "bv_f1_tujuan",
                "type" => "labeled_value",
                "width" => "100",
                "is_required" => false,
                "options" => [
                    "value_type" => "textarea",
                    "label_width" => "220px",
                    "show_colon" => true,
                    "field_style" => "dashed_bottom",
                    "font_size" => 11.5,
                    "min_height" => 60
                ],
                "order" => 11,
                "children" => []
            ],
            [
                "id" => "019db402-e398-72c5-8fc1-cf49d3a8497e",
                "label" => "Tipe Perjanjian",
                "name" => "f1_sifat_row",
                "type" => "labeled_value",
                "width" => "100",
                "is_required" => false,
                "options" => [
                    "value_type" => "searchable_select",
                    "label_width" => "220px",
                    "show_colon" => true,
                    "placeholder" => "Pilih Tipe Perjanjian...",
                    "items" => [
                        ["label" => "BARU", "value" => "BARU"],
                        ["label" => "PERPANJANGAN", "value" => "PERPANJANGAN"],
                        ["label" => "ADDENDUM / REVIEW / PERALIHAN", "value" => "ADDENDUM / REVIEW / PERALIHAN"]
                    ]
                ],
                "order" => 12,
                "children" => []
            ],
            [
                "id" => "59314872-6073-4EB6-9449-31A57657A34E",
                "label" => "II. IDENTITAS PIHAK PERTAMA (INTERNAL)",
                "name" => "f1_main_title_copy_copy",
                "type" => "static_text",
                "width" => "100",
                "is_required" => false,
                "options" => [
                    "font_size" => 12,
                    "font_weight" => "bold",
                    "alignment" => "left",
                    "padding_y" => 10,
                    "margin_bottom" => 0,
                    "margin_top" => 20
                ],
                "order" => 13,
                "children" => []
            ],
            [
                "id" => "019db402-e39d-7059-95ca-cf29811c2d23",
                "label" => "NAMA ENTITAS / PERUSAHAAN",
                "name" => "v_p1_entity",
                "type" => "labeled_value",
                "width" => "100",
                "is_required" => false,
                "options" => [
                    "value_type" => "textfield",
                    "label_width" => "220px",
                    "show_colon" => true,
                    "field_style" => "dashed_bottom",
                    "font_size" => 11.5
                ],
                "order" => 14,
                "children" => []
            ],
            [
                "id" => "019db402-e39e-7349-a6a2-b2a75179e617",
                "label" => "NAMA PENANDATANGAN KONTRAK",
                "name" => "v_p1_signer",
                "type" => "labeled_value",
                "width" => "100",
                "is_required" => false,
                "options" => [
                    "value_type" => "textfield",
                    "label_width" => "220px",
                    "show_colon" => true,
                    "field_style" => "dashed_bottom",
                    "font_size" => 11.5
                ],
                "order" => 15,
                "children" => []
            ],
            [
                "id" => "019db402-e39e-7349-a6a2-b2a75215d2c1",
                "label" => "ALAMAT LENGKAP",
                "name" => "v_p1_position",
                "type" => "labeled_value",
                "width" => "100",
                "is_required" => false,
                "options" => [
                    "value_type" => "textfield",
                    "label_width" => "220px",
                    "show_colon" => true,
                    "field_style" => "dashed_bottom",
                    "font_size" => 11.5
                ],
                "order" => 16,
                "children" => []
            ],
            [
                "id" => "D4F26FCD-CD07-4FC1-8291-10A5615909D2",
                "label" => "III. IDENTITAS PIHAK KEDUA (EKSTERNAL)",
                "name" => "f1_main_title_copy_copy_copy",
                "type" => "static_text",
                "width" => "100",
                "is_required" => false,
                "options" => [
                    "font_size" => 12,
                    "font_weight" => "bold",
                    "alignment" => "left",
                    "padding_y" => 10,
                    "margin_bottom" => 0,
                    "margin_top" => 20
                ],
                "order" => 17,
                "children" => []
            ],
            [
                "id" => "019db402-e39f-7334-9985-5dca6cebef02",
                "label" => "NAMA ENTITAS / PERUSAHAAN",
                "name" => "v_p2_entity",
                "type" => "labeled_value",
                "width" => "100",
                "is_required" => false,
                "options" => [
                    "value_type" => "textfield",
                    "label_width" => "220px",
                    "show_colon" => true,
                    "field_style" => "dashed_bottom",
                    "font_size" => 11.5
                ],
                "order" => 18,
                "children" => []
            ],
            [
                "id" => "019db402-e3a0-701b-bdda-0a7f27f2ef4b",
                "label" => "NAMA PENANDATANGAN KONTRAK",
                "name" => "v_p2_signer",
                "type" => "labeled_value",
                "width" => "100",
                "is_required" => false,
                "options" => [
                    "value_type" => "textfield",
                    "label_width" => "220px",
                    "show_colon" => true,
                    "field_style" => "dashed_bottom",
                    "font_size" => 11.5
                ],
                "order" => 19,
                "children" => []
            ],
            [
                "id" => "019db402-e3a0-701b-bdda-0a7f28b674f5",
                "label" => "ALAMAT LENGKAP",
                "name" => "v_p2_position",
                "type" => "labeled_value",
                "width" => "100",
                "is_required" => false,
                "options" => [
                    "value_type" => "textfield",
                    "label_width" => "220px",
                    "show_colon" => true,
                    "field_style" => "dashed_bottom",
                    "font_size" => 11.5
                ],
                "order" => 20,
                "children" => []
            ],
            [
                "id" => "D1C308B0-2CCE-4F5B-97DD-74EE31112E5D",
                "label" => "IV. DETAIL KOMERSIAL & OPERASIONAL",
                "name" => "f1_main_title_copy_copy_copy_copy",
                "type" => "static_text",
                "width" => "100",
                "is_required" => false,
                "options" => [
                    "font_size" => 12,
                    "font_weight" => "bold",
                    "alignment" => "left",
                    "padding_y" => 10,
                    "margin_bottom" => 0,
                    "margin_top" => 20
                ],
                "order" => 21,
                "children" => []
            ],
            [
                "id" => "019db402-e3a1-7338-bc44-31824cbe9d09",
                "label" => "MASA BERLAKU / JANGKA WAKTU",
                "name" => "tdv_jw",
                "type" => "labeled_value",
                "width" => "100",
                "is_required" => false,
                "options" => [
                    "value_type" => "textfield",
                    "label_width" => "220px",
                    "show_colon" => true,
                    "field_style" => "dashed_bottom",
                    "font_size" => 11.5
                ],
                "order" => 22,
                "children" => []
            ],
            [
                "id" => "019db402-e3a3-72bf-9e0c-ab80b5f5353d",
                "label" => "LOKASI / AREA PEKERJAAN",
                "name" => "tdv_loc",
                "type" => "labeled_value",
                "width" => "100",
                "is_required" => false,
                "options" => [
                    "value_type" => "textfield",
                    "label_width" => "220px",
                    "show_colon" => true,
                    "field_style" => "dashed_bottom",
                    "font_size" => 11.5
                ],
                "order" => 23,
                "children" => []
            ],
            [
                "id" => "019db402-e3a4-7330-baba-9071a7ac022b",
                "label" => "DIMENSI / LUAS (M2)",
                "name" => "tdv_luas",
                "type" => "labeled_value",
                "width" => "100",
                "is_required" => false,
                "options" => [
                    "value_type" => "textfield",
                    "label_width" => "220px",
                    "show_colon" => true,
                    "field_style" => "dashed_bottom",
                    "font_size" => 11.5
                ],
                "order" => 24,
                "children" => []
            ],
            [
                "id" => "019db402-e3a5-7335-9f3d-890dbab3f90f",
                "label" => "NILAI TRANSAKSI / IMBALAN JASA",
                "name" => "tdv_price",
                "type" => "labeled_value",
                "width" => "100",
                "is_required" => false,
                "options" => [
                    "value_type" => "textfield",
                    "label_width" => "220px",
                    "show_colon" => true,
                    "field_style" => "dashed_bottom",
                    "font_size" => 11.5
                ],
                "order" => 25,
                "children" => []
            ],
            [
                "id" => "019db402-e3a5-7335-9f3d-890dbb84fcd9",
                "label" => "MEKANISME & SYARAT PEMBAYARAN",
                "name" => "tdv_top",
                "type" => "labeled_value",
                "width" => "100",
                "is_required" => false,
                "options" => [
                    "value_type" => "textfield",
                    "label_width" => "220px",
                    "show_colon" => true,
                    "field_style" => "dashed_bottom",
                    "font_size" => 11.5
                ],
                "order" => 26,
                "children" => []
            ],
            [
                "id" => "CEB061AD-5E7E-4AAA-AFB5-A20EBF0A3802",
                "label" => "PEMBEBANAN PPN",
                "name" => "tax_ppn",
                "type" => "labeled_value",
                "width" => "100",
                "is_required" => false,
                "options" => [
                    "value_type" => "select",
                    "label_width" => "220px",
                    "show_colon" => true,
                    "font_size" => 11,
                    "font_weight_label" => "bold",
                    "items" => [
                        ["label" => "Ditanggung Pihak I", "value" => "Pihak I"],
                        ["label" => "Ditanggung Pihak II", "value" => "Pihak II"],
                        ["label" => "Bebas / Tidak Terutang", "value" => "N/A"]
                    ]
                ],
                "order" => 27,
                "children" => []
            ],
            [
                "id" => "019db402-e3a7-7333-8891-f102717ef00e",
                "label" => "PEMBEBANAN PPH",
                "name" => "tax_pph",
                "type" => "labeled_value",
                "width" => "100",
                "is_required" => false,
                "options" => [
                    "value_type" => "select",
                    "label_width" => "220px",
                    "show_colon" => true,
                    "font_size" => 11,
                    "font_weight_label" => "bold",
                    "items" => [
                        ["label" => "Dipotong Pihak I", "value" => "Pihak I"],
                        ["label" => "Dipotong Pihak II", "value" => "Pihak II"],
                        ["label" => "N/A", "value" => "N/A"]
                    ]
                ],
                "order" => 28,
                "children" => []
            ],
            [
                "id" => "019db402-e3a9-7181-b049-8e97b450cd9c",
                "label" => "RINGKASAN KLAUSUL PENTING",
                "name" => "kl_field",
                "type" => "labeled_value",
                "width" => "100",
                "is_required" => false,
                "options" => [
                    "value_type" => "textarea",
                    "label_width" => "220px",
                    "show_colon" => true,
                    "min_height" => 100,
                    "font_size" => 11,
                    "font_weight_label" => "bold",
                    "field_style" => "dashed_bottom"
                ],
                "order" => 29,
                "children" => []
            ]
        ];

        $this->seedFields($fields, $templateId, null);

        echo ">>> F1 NEW TEMPLATE SEEDER COMPLETED\n";
    }

    private function seedFields(array $fields, $templateId, $parentId)
    {
        foreach ($fields as $field) {
            $children = $field['children'] ?? [];
            unset($field['children']);
            
            // Format options
            if (isset($field['options'])) {
                $field['options'] = json_encode($field['options']);
            }
            if (isset($field['validation_rules'])) {
                $field['validation_rules'] = json_encode($field['validation_rules']);
            }

            // Defensive ID handling
            $originalId = $field['id'] ?? (string) Str::uuid();
            $id = Str::isUuid($originalId) ? $originalId : (string) Str::uuid();

            $currentData = array_merge([
                'label' => '',
                'placeholder' => '',
                'width' => '100',
                'is_required' => false,
                'form_template_id' => $templateId,
                'parent_id' => $parentId,
                'created_at' => now(),
                'updated_at' => now(),
            ], $field);

            // Ensure ID is UUID
            $currentData['id'] = $id;

            DB::table('m_form_fields')->insert($currentData);

            if (!empty($children)) {
                $this->seedFields($children, $templateId, $id);
            }
        }
    }
}
