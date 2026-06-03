<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Department;
use App\Models\User;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::firstWhere('email', 'admin@example.com') ?? User::first();
        $adminId = $admin ? $admin->id : null;

        $jsonPath = base_path('data_json/tipe-kontrak.json');
        if (! file_exists($jsonPath)) {
            $this->command->warn('tipe-kontrak.json not found!');

            return;
        }

        $data = json_decode(file_get_contents($jsonPath), true);
        $departments = $data['departments'] ?? [];

        foreach ($departments as $dept) {
            $companyId = null;
            if (isset($dept['company_code'])) {
                $company = Company::where('code', $dept['company_code'])->first();
                if ($company) {
                    $companyId = $company->id;
                }
            }

            Department::withTrashed()->updateOrCreate(
                ['code' => $dept['code']],
                [
                    'name' => $dept['name'],
                    'company_id' => $companyId,
                    'description' => "Departemen {$dept['name']}",
                    'created_by' => $adminId,
                    'updated_by' => $adminId,
                    'deleted_at' => null,
                ],
            );
        }

        // Ensure Legal department exists for system logic
        Department::withTrashed()->firstOrCreate(
            ['code' => Department::CODE_LEGAL],
            [
                'name' => 'Legal & Compliance',
                'description' => 'Departemen Hukum dan Kepatuhan',
                'created_by' => $adminId,
                'updated_by' => $adminId,
                'deleted_at' => null,
            ],
        );
    }
}
