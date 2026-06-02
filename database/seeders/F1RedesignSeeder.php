<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class F1RedesignSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::first();
        if (! $admin) {
            return;
        }

        $jsonPath = base_path('data_json/f1-formulir-permintaan-perjanjian_export_20260528_042405.json');
        if (! file_exists($jsonPath)) {
            echo ">>> F1 JSON FILE NOT FOUND\n";

            return;
        }

        $jsonData = json_decode(file_get_contents($jsonPath), true);

        $templateName = $jsonData['name'];
        $templateId = '515493da-f5a3-453b-bf52-e5f379bef933'; // Keep consistent ID for existing data/relations

        // 1. TOTAL CLEANUP
        DB::table('m_form_fields')->where('form_template_id', $templateId)->delete();
        DB::table('m_form_templates')->where('id', $templateId)->delete();

        echo ">>> CLEANED UP EXISTING F1 TEMPLATE\n";

        // 2. CREATE TEMPLATE
        DB::table('m_form_templates')->insert([
            'id' => $templateId,
            'name' => $templateName,
            'description' => $jsonData['description'] ?? 'F1 Professional template',
            'document_type' => $jsonData['document_type'] ?? 'f1',
            'has_letterhead' => $jsonData['has_letterhead'] ?? true,
            'letterhead_json' => isset($jsonData['letterhead_json']) ? json_encode($jsonData['letterhead_json']) : null,
            'is_active' => true,
            'created_by' => $admin->id,
            'updated_by' => $admin->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 3. FIELDS
        $fields = $jsonData['fields'] ?? [];

        $this->seedFields($fields, $templateId, null);

        echo ">>> F1 REDESIGN SEEDER COMPLETED FROM JSON\n";
    }

    private function seedFields(array $fields, $templateId, $parentId): void
    {
        foreach ($fields as $field) {
            $children = $field['children'] ?? [];
            unset($field['children']);

            $field['options'] = isset($field['options']) ? json_encode($field['options']) : null;
            $field['validation_rules'] = isset($field['validation_rules']) ? json_encode($field['validation_rules']) : null;

            $data = array_merge([
                'label' => '',
                'placeholder' => '',
                'width' => '100',
                'is_required' => false,
                'form_template_id' => $templateId,
                'parent_id' => $parentId,
                'created_at' => now(),
                'updated_at' => now(),
            ], $field);

            DB::table('m_form_fields')->insert($data);

            if (! empty($children)) {
                $this->seedFields($children, $templateId, $field['id']);
            }
        }
    }
}
