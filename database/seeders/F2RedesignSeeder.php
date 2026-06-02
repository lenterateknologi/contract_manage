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
        if (! $admin) {
            return;
        }

        $jsonPath = base_path('data_json/f2-resume-dan-persetujuan_export_20260528_042418.json');
        if (! file_exists($jsonPath)) {
            echo ">>> F2 JSON FILE NOT FOUND\n";

            return;
        }

        $jsonData = json_decode(file_get_contents($jsonPath), true);

        $templateName = $jsonData['name'];
        $templateId = '966603a9-e889-4a7b-a7e8-e5e339d67566'; // Keep consistent ID for existing data/relations

        // 1. TOTAL CLEANUP
        DB::table('m_form_fields')->where('form_template_id', $templateId)->delete();
        DB::table('m_form_templates')->where('id', $templateId)->delete();

        echo ">>> CLEANED UP ALL EXISTING F2 TEMPLATES\n";

        // 2. CREATE TEMPLATE
        DB::table('m_form_templates')->insert([
            'id' => $templateId,
            'name' => $templateName,
            'description' => $jsonData['description'] ?? 'F2 Resume template with standardized meta_ naming and placeholders.',
            'document_type' => $jsonData['document_type'] ?? 'f2',
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

        echo ">>> F2 REDESIGN SEEDER COMPLETED FROM JSON\n";
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

            if (! empty($children)) {
                $this->seedFields($children, $templateId, $id);
            }
        }
    }
}
