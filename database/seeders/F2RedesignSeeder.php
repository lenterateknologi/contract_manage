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
        // Preserve the template ID so it updates the existing F2 instance seamlessly
        $templateId = "966603a9-e889-4a7b-a7e8-e5e339d67566";

        // 1. TOTAL CLEANUP
        $oldF2Ids = DB::table('m_form_templates')->where('document_type', 'f2')->pluck('id');
        
        DB::table('m_form_fields')->whereIn('form_template_id', $oldF2Ids)->delete();
        DB::table('m_form_templates')->whereIn('id', $oldF2Ids)->delete();
        
        echo ">>> CLEANED UP ALL EXISTING F2 TEMPLATES\n";

        // 2. CREATE TEMPLATE
        DB::table('m_form_templates')->insert([
            'id' => $templateId,
            'name' => $templateName,
            'description' => 'F2 Resume template updated with user-provided JSON structure.',
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
                "label" => "RESUME DAN PERSETUJUAN", "name" => "f2_main_title", "type" => "static_text", "width" => "100",
                "options" => ["font_size" => 15, "font_weight" => "bold", "alignment" => "center", "margin_bottom" => 5, "font_family" => $interFont],
                "order" => 0
            ],
            [
                "label" => "(Perjanjian Baru/ Addendum / Amandement / Perubahan Perjanjian)*", "name" => "f2_sub_title", "type" => "static_text", "width" => "100",
                "options" => ["font_size" => 10, "font_style" => "italic", "alignment" => "center", "margin_bottom" => 20, "padding_bottom" => 50, "font_family" => $interFont],
                "order" => 1
            ],
            [
                "label" => "Perjanjian tentang ", "name" => "perjanjian_tentang", "type" => "labeled_value", "width" => "100",
                "options" => ["font_family" => $interFont],
                "order" => 2
            ],
            [
                "label" => "No.Perjanjian/Tanggal F2/Dimohonkan oleh", "name" => "meta_ruang_lingkup", "type" => "labeled_value", "width" => "100",
                "options" => ["font_family" => $interFont],
                "order" => 3
            ],
            [
                "label" => "Pihak Pertama : {{company_1}}", "name" => "p1_static", "type" => "static_text", "width" => "65",
                "options" => ["font_size" => 12, "margin_top" => 20, "margin_bottom" => 10, "font_weight" => "normal", "text_transform" => "uppercase", "font_family" => $interFont],
                "order" => 4
            ],
            [
                "label" => "Pihak Kedua : {{company_2}}", "name" => "p2_static", "type" => "static_text", "width" => "65",
                "options" => ["font_size" => 12, "margin_top" => 0, "margin_bottom" => 10, "text_transform" => "uppercase", "font_family" => $interFont],
                "order" => 5
            ],
            [
                "label" => "ISI PERJANJIAN", "name" => "f2_title_2", "type" => "static_text", "width" => "100",
                "options" => ["font_size" => 12, "font_weight" => "bold", "alignment" => "left", "padding_y" => 5, "margin_bottom" => 5, "margin_top" => 20, "font_family" => $interFont],
                "order" => 6
            ],
            [
                "label" => "Ruang Lingkup", "name" => "f2_scope", "type" => "labeled_value", "width" => "100",
                "options" => ["font_family" => $interFont],
                "order" => 7
            ],
            [
                "label" => "Harga Pekerjaan", "name" => "f2_price", "type" => "labeled_value", "width" => "100",
                "options" => ["font_family" => $interFont],
                "order" => 8
            ],
            [
                "label" => "Cara Pembayaran", "name" => "f2_payment", "type" => "labeled_value", "width" => "100",
                "options" => ["font_family" => $interFont],
                "order" => 9
            ],
            [
                "label" => "Jangka Waktu", "name" => "f2_tenure", "type" => "labeled_value", "width" => "100",
                "options" => ["font_family" => $interFont],
                "order" => 10
            ],
            [
                "label" => "Lokasi", "name" => "f2_location", "type" => "labeled_value", "width" => "100",
                "options" => ["margin_bottom" => 30, "font_family" => $interFont],
                "order" => 11
            ],
            [
                "label" => "Pihak Pertama diwakili oleh {{nama_pihak_1}} selaku {{Jabatan_pihak_1}}", "name" => "closing_rep_1", "type" => "static_text", "width" => "65",
                "options" => ["font_size" => 12, "font_style" => "normal", "margin_top" => 0, "margin_bottom" => 0, "text_transform" => "none", "font_family" => $interFont],
                "order" => 12
            ],
            [
                "label" => "Pihak Kedua diwakili oleh {{nama_pihak_2}} selaku {{Jabatan_pihak_2}}", "name" => "closing_rep_2", "type" => "static_text", "width" => "65",
                "options" => ["font_size" => 12, "font_style" => "normal", "margin_top" => 10, "margin_bottom" => 20, "text_transform" => "none", "font_family" => $interFont],
                "order" => 13
            ],
            [
                "label" => "Demikian Resume ini dibuat untuk mendapat persetujuan, terima kasih.", "name" => "closing_italics", "type" => "static_text", "width" => "100",
                "options" => ["font_size" => 11, "font_style" => "italic", "margin_top" => 30, "margin_bottom" => 30, "font_family" => $interFont],
                "order" => 14
            ],
            // SIGNATURES - Preserved logically to ensure approver functionality doesn't break
            [
                "name" => "f2_signatures", "type" => "grid_x", "width" => "100",
                "options" => ["grid_cols" => 3, "col_sizes" => ["1fr", "1fr", "1fr"], "margin_bottom" => 10],
                "order" => 15,
                "children" => [
                    [
                        "label" => "DIBUAT OLEH (PIC)", "name" => "dibuat_oleh_(nama_pic)", "type" => "signature_box", "width" => "100",
                        "options" => ["font_family" => $interFont, "font_size" => 12],
                        "order" => 16
                    ],
                    [
                        "label" => "DIKETAHUI (MANAGER)", "name" => "diketahui_oleh_(manager_legal)", "type" => "signature_box", "width" => "100",
                        "options" => ["font_family" => $interFont, "font_size" => 12],
                        "order" => 17
                    ],
                    [
                        "label" => "DISETUJUI (VP LEGAL)", "name" => "diketahui_oleh_(vp_legal)", "type" => "signature_box", "width" => "100",
                        "options" => ["font_family" => $interFont, "font_size" => 12],
                        "order" => 18
                    ]
                ]
            ]
        ];

        $this->seedFields($fields, $templateId, null);

        echo ">>> F2 USER-JSON TEMPLATE SEEDER COMPLETED\n";
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

            unset($currentData['container_type']); // cleaning up JSON structure artifacts
            $currentData['id'] = $id;

            DB::table('m_form_fields')->insert($currentData);

            if (!empty($children)) {
                $this->seedFields($children, $templateId, $id);
            }
        }
    }
}
