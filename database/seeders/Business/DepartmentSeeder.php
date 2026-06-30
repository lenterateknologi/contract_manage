<?php

namespace Database\Seeders\Business;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $jsonPath = database_path('from_tiket/department.json');
        if (! file_exists($jsonPath)) {
            return;
        }

        $jsonData = json_decode(file_get_contents($jsonPath), true);

        // Find the divisions array under whichever key it is placed in the JSON
        $divisions = null;
        foreach ($jsonData as $key => $value) {
            if (is_array($value)) {
                $divisions = $value;
                break;
            }
        }

        if (empty($divisions)) {
            return;
        }

        foreach ($divisions as $div) {
            if (empty($div['name'])) {
                continue;
            }

            Department::updateOrCreate(
                ['id' => $div['id']],
                [
                    'code' => $div['code'] ?? substr(strtoupper(trim($div['name'])), 0, 3),
                    'name' => $div['name'],
                    'is_active' => $div['is_active'] ?? true,
                ]
            );
        }
    }
}
