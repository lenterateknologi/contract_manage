<?php

namespace Database\Seeders;

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

        // Get a default company to link departments to
        $defaultCompany = \App\Models\Company::where('code', 'LTI')->first();
        $companyId = $defaultCompany ? $defaultCompany->id : null;

        $departments = [
            ['code' => 'LGL', 'name' => 'Legal & Compliance', 'description' => 'Departemen Hukum dan Kepatuhan'],
            ['code' => 'TAX', 'name' => 'Tax', 'description' => 'Departemen Perpajakan'],
            ['code' => 'FIN', 'name' => 'Finance & Accounting', 'description' => 'Departemen Keuangan dan Akuntansi'],
            ['code' => 'HRD', 'name' => 'Human Resources', 'description' => 'Departemen Sumber Daya Manusia'],
            ['code' => 'ITC', 'name' => 'Information Technology', 'description' => 'Departemen Teknologi Informasi'],
            ['code' => 'PRC', 'name' => 'Procurement', 'description' => 'Departemen Pengadaan'],
            ['code' => 'MKT', 'name' => 'Sales & Marketing', 'description' => 'Departemen Penjualan dan Pemasaran'],
            ['code' => 'OPS', 'name' => 'Operations', 'description' => 'Departemen Operasional'],
            ['code' => 'MGT', 'name' => 'Management / Direksi', 'description' => 'Jajaran Manajemen dan Direksi'],
        ];

        foreach ($departments as $dept) {
            Department::withTrashed()->updateOrCreate(
                ['code' => $dept['code']],
                [
                    'name' => $dept['name'],
                    'company_id' => $companyId,
                    'description' => $dept['description'],
                    'created_by' => $adminId,
                    'updated_by' => $adminId,
                    'deleted_at' => null,
                ],
            );
        }
    }
}
