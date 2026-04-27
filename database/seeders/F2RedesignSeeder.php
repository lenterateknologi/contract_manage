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
        $templateId = "966603a9-e889-4a7b-a7e8-e5e339d67566";

        // 1. TOTAL CLEANUP
        DB::table('m_form_fields')->where('form_template_id', $templateId)->delete();
        DB::table('m_form_templates')->where('id', $templateId)->delete();

        echo ">>> CLEANED UP ALL EXISTING F2 TEMPLATES\n";

        // 2. CREATE TEMPLATE
        DB::table('m_form_templates')->insert([
            'id' => $templateId,
            'name' => $templateName,
            'description' => 'F2 Resume template with standardized meta_ naming and placeholders.',
            'document_type' => 'f2',
            'has_letterhead' => true,
            'is_active' => true,
            'created_by' => $admin->id,
            'updated_by' => $admin->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $interFont = "'Inter', sans-serif";

        $fields = [
            [
                "id" => "019dbe81-4033-71d8-997a-15beda5d3f52",
                "label" => "RESUME DAN PERSETUJUAN",
                "name" => "f2_main_title",
                "type" => "static_text",
                "options" => [
                    "font_size" => 15,
                    "font_weight" => "bold",
                    "alignment" => "center",
                    "margin_bottom" => 5,
                    "font_family" => $interFont
                ],
                "order" => 0
            ],
            [
                "id" => "019dbe81-4035-70d8-8b14-dab12e8235be",
                "label" => "({{meta_tipe_perjanjian}})",
                "name" => "f2_sub_title",
                "type" => "static_text",
                "options" => [
                    "font_size" => 13,
                    "font_style" => "italic",
                    "alignment" => "center",
                    "margin_bottom" => 20,
                    "padding_bottom" => 5,
                    "font_family" => $interFont,
                    "font_weight" => "bold"
                ],
                "order" => 1
            ],
            [
                "id" => "019dbe81-4036-72e2-81cb-1f2ebd5818f5",
                "label" => "Perjanjian tentang",
                "name" => "meta_perjanjian_tentang",
                "type" => "labeled_value",
                "options" => [
                    "font_family" => $interFont,
                    "label_width" => "280px",
                    "font_size" => 11,
                    "font_weight" => "bold"
                ],
                "order" => 2
            ],
            [
                "id" => "019dbe81-4037-70be-a87e-ea4ad4d521e5",
                "label" => "No.Perjanjian/Tanggal F2/Dimohonkan oleh",
                "name" => "meta_ruang_lingkup",
                "type" => "labeled_value",
                "options" => [
                    "font_family" => $interFont,
                    "label_width" => "280px",
                    "font_size" => 11,
                    "font_weight" => "bold"
                ],
                "order" => 3
            ],
            [
                "id" => "019dbe81-403a-71ce-a2da-8e14c781c0da",
                "label" => "Pihak Pertama : {{meta_p1_entity}}",
                "name" => "p1_static",
                "type" => "static_text",
                "width" => "65",
                "options" => [
                    "font_size" => 11,
                    "margin_top" => 15,
                    "margin_bottom" => 10,
                    "font_weight" => "bold",
                    "text_transform" => "uppercase",
                    "font_family" => $interFont
                ],
                "order" => 4
            ],
            [
                "id" => "019dbe81-403b-7169-b3f3-a7083847ce5a",
                "label" => "Pihak Kedua : {{meta_p2_entity}}",
                "name" => "p2_static",
                "type" => "static_text",
                "width" => "65",
                "options" => [
                    "font_size" => 11,
                    "margin_top" => 0,
                    "margin_bottom" => 10,
                    "text_transform" => "uppercase",
                    "font_family" => $interFont,
                    "font_weight" => "bold"
                ],
                "order" => 5
            ],
            [
                "id" => "019dbe81-403c-729e-a62f-86f424f37133",
                "label" => "ISI PERJANJIAN",
                "name" => "f2_title_2",
                "type" => "static_text",
                "width" => "50",
                "options" => [
                    "font_size" => 11,
                    "font_weight" => "bold",
                    "alignment" => "left",
                    "padding_y" => 5,
                    "margin_bottom" => 5,
                    "margin_top" => 15,
                    "font_family" => $interFont,
                    "text_decoration" => "underline"
                ],
                "order" => 6
            ],
            [
                "id" => "019dbe81-403d-70df-8f9b-3f3899cd11eb",
                "label" => "Ruang Lingkup",
                "name" => "meta_f2_scope",
                "type" => "labeled_value",
                "options" => [
                    "font_family" => $interFont,
                    "font_size" => 11,
                    "font_weight" => "bold"
                ],
                "order" => 7
            ],
            [
                "id" => "019dbe81-403d-70df-8f9b-3f389a6fa04e",
                "label" => "Harga Pekerjaan",
                "name" => "meta_f2_price",
                "type" => "labeled_value",
                "options" => [
                    "font_family" => $interFont,
                    "font_size" => 11,
                    "font_weight" => "bold"
                ],
                "order" => 8
            ],
            [
                "id" => "019dbe81-403e-7017-94fb-1cac3384684a",
                "label" => "Cara Pembayaran",
                "name" => "meta_f2_payment",
                "type" => "labeled_value",
                "options" => [
                    "font_family" => $interFont,
                    "font_size" => 11,
                    "font_weight" => "bold"
                ],
                "order" => 9
            ],
            [
                "id" => "019dbe81-403f-7271-bbab-ca389bcf5abb",
                "label" => "Jangka Waktu",
                "name" => "meta_f2_tenure",
                "type" => "labeled_value",
                "options" => [
                    "font_family" => $interFont,
                    "font_size" => 11,
                    "font_weight" => "bold"
                ],
                "order" => 10
            ],
            [
                "id" => "019dbe81-403f-7271-bbab-ca389be3c64a",
                "label" => "Lokasi",
                "name" => "meta_f2_location",
                "type" => "labeled_value",
                "options" => [
                    "margin_bottom" => 30,
                    "font_family" => $interFont,
                    "font_size" => 11,
                    "font_weight" => "bold"
                ],
                "order" => 11
            ],
            [
                "id" => "019dbe81-4040-73bc-bb79-8674d5bb1c32",
                "label" => "Pihak Pertama diwakili oleh {{meta_p1_signer}} selaku {{meta_p1_signer_position}}",
                "name" => "closing_rep_1",
                "type" => "static_text",
                "options" => [
                    "font_size" => 11,
                    "font_style" => "normal",
                    "margin_top" => 0,
                    "margin_bottom" => 0,
                    "text_transform" => "uppercase",
                    "font_family" => $interFont,
                    "font_weight" => "bold"
                ],
                "order" => 12
            ],
            [
                "id" => "019dbe81-4041-7394-a6d7-60e38b5f68c7",
                "label" => "Pihak Kedua diwakili oleh {{meta_p2_signer}} selaku {{meta_p2_signer_position}}",
                "name" => "closing_rep_2",
                "type" => "static_text",
                "options" => [
                    "font_size" => 11,
                    "font_style" => "normal",
                    "margin_top" => 10,
                    "margin_bottom" => 20,
                    "text_transform" => "uppercase",
                    "font_family" => $interFont,
                    "font_weight" => "bold"
                ],
                "order" => 13
            ],
            [
                "id" => "019dbe81-4041-7394-a6d7-60e38be35c06",
                "label" => "Demikian Resume ini dibuat untuk mendapat persetujuan, terima kasih.",
                "name" => "closing_italics",
                "type" => "static_text",
                "options" => [
                    "font_size" => 12,
                    "font_style" => "italic",
                    "margin_top" => 30,
                    "margin_bottom" => 30,
                    "font_family" => $interFont,
                    "font_weight" => "normal",
                    "text_transform" => "none"
                ],
                "order" => 14
            ]
            // SIGNATURES - Preserved for workflow functionality
            // [
            //     "id" => (string) Str::uuid(),
            //     "name" => "f2_signatures", "type" => "grid_x", "width" => "100",
            //     "options" => ["grid_cols" => 3, "col_sizes" => ["1fr", "1fr", "1fr"], "margin_bottom" => 10],
            //     "order" => 15,
            //     "children" => [
            //         [
            //             "id" => (string) Str::uuid(),
            //             "label" => "DIBUAT OLEH (PIC)", "name" => "meta_sig_pic", "type" => "signature_box", "width" => "100",
            //             "options" => ["font_family" => $interFont, "font_size" => 11, "font_weight" => "bold"],
            //             "order" => 16
            //         ],
            //         [
            //             "id" => (string) Str::uuid(),
            //             "label" => "DIKETAHUI (MANAGER)", "name" => "meta_sig_manager", "type" => "signature_box", "width" => "100",
            //             "options" => ["font_family" => $interFont, "font_size" => 11, "font_weight" => "bold"],
            //             "order" => 17
            //         ],
            //         [
            //             "id" => (string) Str::uuid(),
            //             "label" => "DISETUJUI (VP LEGAL)", "name" => "meta_sig_vp", "type" => "signature_box", "width" => "100",
            //             "options" => ["font_family" => $interFont, "font_size" => 11, "font_weight" => "bold"],
            //             "order" => 18
            //         ]
            //     ]
            // ]
        ];

        $this->seedFields($fields, $templateId, null);

        echo ">>> F2 REDESIGN SEEDER COMPLETED\n";
    }

    private function seedFields(array $fields, $templateId, $parentId)
    {
        foreach ($fields as $field) {
            $children = $field['children'] ?? [];
            unset($field['children']);

            if (isset($field['options'])) {
                $field['options'] = json_encode($field['options']);
            }
            if (isset($field['validation_rules'])) {
                $field['validation_rules'] = json_encode($field['validation_rules']);
            }

            $id = $field['id'] ?? (string) Str::uuid();

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

            $currentData['id'] = $id;

            DB::table('m_form_fields')->insert($currentData);

            if (!empty($children)) {
                $this->seedFields($children, $templateId, $id);
            }
        }
    }
}
