<?php

namespace Database\Seeders\Business;

use App\Models\Company;
use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $jsonPath = base_path('data_json/tipe-kontrak.json');
        if (! file_exists($jsonPath)) {
            return;
        }

        $jsonData = json_decode(file_get_contents($jsonPath), true);

        foreach ($jsonData['departments'] ?? [] as $dept) {
            $companyId = null;
            if (! empty($dept['company_code'])) {
                $company = Company::where('code', $dept['company_code'])->first();
                $companyId = $company ? $company->id : null;
            }

            Department::updateOrCreate(['code' => $dept['code']], [
                'name' => $dept['name'],
                'description' => $dept['description'] ?? null,
                'company_id' => $companyId,
                'is_active' => $dept['is_active'] ?? true,
            ]);
        }
    }
}
