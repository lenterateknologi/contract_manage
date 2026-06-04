<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Table is already handled by migrate:fresh or updateOrCreate

        // Ensure roles and departments are available
        $roles = Role::pluck('id', 'name')->all();
        $depts = Department::pluck('id', 'code')->all();

        // Get companies mapped by code for UUID lookups
        $companies = Company::pluck('id', 'code')->all();
        // Use JKT-1 as default if LTI doesn't exist
        $defaultCompanyId = $companies['JKT-1'] ?? (count($companies) > 0 ? reset($companies) : null);

        $users = [
            [
                'name' => 'Ahmad Fauzi',
                'email' => 'ahmad@example.com',
                'password' => Hash::make('password'),
                'role' => 'Staff',
                'position' => 'Legal Officer',
                'phone' => '081234567890',
                'department_id' => $depts['LGL'] ?? null,
                'username' => '1000000000000001',
                'company_code' => 'JKT-1',
            ],
            [
                'name' => 'Budi Santoso',
                'email' => 'budi@example.com',
                'password' => Hash::make('password'),
                'role' => 'Manager',
                'position' => 'Legal Manager',
                'phone' => '081234567891',
                'department_id' => $depts['LGL'] ?? null,
                'username' => '1000000000000002',
                'company_code' => 'JKT-1',
            ],
            [
                'name' => 'Citra Dewi',
                'email' => 'citra@example.com',
                'password' => Hash::make('password'),
                'role' => 'Staff',
                'position' => 'Tax Specialist',
                'phone' => '081234567892',
                'department_id' => $depts['TAX'] ?? null,
                'username' => '1000000000000003',
                'company_code' => 'JKT-1',
            ],
            [
                'name' => 'Dian Rahayu',
                'email' => 'dian@example.com',
                'password' => Hash::make('password'),
                'role' => 'Director',
                'position' => 'Finance Director',
                'phone' => '081234567893',
                'department_id' => $depts['FIN'] ?? null,
                'username' => '1000000000000004',
                'company_code' => 'JKT-1',
            ],
            [
                'name' => 'Eko Prasetyo',
                'email' => 'eko@example.com',
                'password' => Hash::make('password'),
                'role' => 'Manager',
                'position' => 'IT Infrastructure Manager',
                'phone' => '081234567894',
                'department_id' => $depts['ITC'] ?? null,
                'username' => '1000000000000005',
                'company_code' => 'JKT-1',
            ],
            [
                'name' => 'Fajar Vendor',
                'email' => 'vendor@example.com',
                'password' => Hash::make('password'),
                'role' => 'Vendor',
                'position' => 'External Partner',
                'phone' => '081234567895',
                'department_id' => null,
                'username' => '1000000000000006',
                'company_code' => 'JKT-1',
            ],
            [
                'name' => 'Super Admin',
                'email' => 'admin@example.com',
                'password' => Hash::make('password'),
                'role' => 'Admin',
                'position' => 'System Administrator',
                'phone' => '081111111111',
                'department_id' => $depts['ITC'] ?? null,
                'username' => '1000000000000007',
                'company_code' => 'JKT-1',
            ],
            [
                'name' => 'Siti Aminah',
                'email' => 'siti@example.com',
                'password' => Hash::make('password'),
                'role' => 'Manager',
                'position' => 'HR Manager',
                'phone' => '081234567896',
                'department_id' => $depts['HRD'] ?? null,
                'username' => '1000000000000008',
                'company_code' => 'JKT-1',
            ],
            [
                'name' => 'Rendi',
                'email' => 'rendi@example.com',
                'password' => Hash::make('password'),
                'role' => 'Staff',
                'position' => 'Legal Specialist',
                'phone' => '081234567897',
                'department_id' => $depts['LGL'] ?? null,
                'username' => '1000000000000009',
                'company_code' => 'JKT-1',
            ],
            [
                'name' => 'Nisa',
                'email' => 'nisa@example.com',
                'password' => Hash::make('password'),
                'role' => 'Staff',
                'position' => 'Legal Compliance',
                'phone' => '081234567898',
                'department_id' => $depts['LGL'] ?? null,
                'username' => '1000000000000010',
                'company_code' => 'JKT-1',
            ],
            [
                'name' => 'Vice President (VP)',
                'email' => 'vp@example.com',
                'password' => Hash::make('password'),
                'role' => 'VP',
                'position' => 'Vice President',
                'phone' => '081234567899',
                'department_id' => $depts['MGT'] ?? null,
                'username' => '1000000000000011',
                'company_code' => 'JKT-1',
            ],
            [
                'name' => 'Chief Executive Officer (CEO)',
                'email' => 'ceo@example.com',
                'password' => Hash::make('password'),
                'role' => 'CEO',
                'position' => 'Chief Executive Officer',
                'phone' => '081234567900',
                'department_id' => $depts['MGT'] ?? null,
                'username' => '1000000000000012',
                'company_code' => 'JKT-1',
            ],
        ];

        foreach ($users as $userData) {
            $roleName = $userData['role'] ?? 'Staff';
            $roleId = $roles[$roleName] ?? null;

            // Determine company_id
            $companyCode = $userData['company_code'] ?? null;
            $userCompanyId = $companies[$companyCode] ?? $defaultCompanyId;

            // Cleanup internal keys before saving
            unset($userData['role'], $userData['company_code']);

            User::withTrashed()->updateOrCreate(
                ['email' => $userData['email']],
                array_merge($userData, [
                    'company_id' => $userCompanyId,
                    'role_id' => $roleId,
                    'is_active' => true,
                    'deleted_at' => null,
                ]),
            );
        }

        // Now seed more users in a structured way
        $deptModels = Department::with('company')->get();

        foreach ($deptModels as $dept) {
            $deptCompanyId = $dept->company_id ?? $defaultCompanyId;

            // Check if this department already has a manager from the specific list above
            $hasManager = User::where('department_id', $dept->id)
                ->where('role', 'Manager')
                ->exists();

            // If no manager, create one
            if (! $hasManager) {
                User::withTrashed()->updateOrCreate(
                    ['email' => 'manager.'.strtolower($dept->code).'@example.com'],
                    [
                        'name' => fake()->name(),
                        'username' => '2000'.str_pad(mt_rand(1, 999999), 12, '0', STR_PAD_LEFT),
                        'password' => Hash::make('password'),
                        'role' => 'Manager',
                        'role_id' => $roles['Manager'] ?? null,
                        'position' => 'Manager of '.$dept->name,
                        'phone' => fake()->phoneNumber(),
                        'department_id' => $dept->id,
                        'company_id' => $deptCompanyId,
                        'is_active' => true,
                        'deleted_at' => null,
                    ],
                );
            }

            // Create 3-5 staff members per department
            $staffCount = mt_rand(3, 5);
            for ($i = 1; $i <= $staffCount; $i++) {
                User::withTrashed()->updateOrCreate(
                    ['email' => "staff{$i}.".strtolower($dept->code).'@example.com'],
                    [
                        'name' => fake()->name(),
                        'username' => '3000'.str_pad(mt_rand(1, 99999999), 12, '0', STR_PAD_LEFT),
                        'password' => Hash::make('password'),
                        'role' => 'Staff',
                        'role_id' => $roles['Staff'] ?? null,
                        'position' => 'Staff of '.$dept->name,
                        'phone' => fake()->phoneNumber(),
                        'department_id' => $dept->id,
                        'company_id' => $deptCompanyId,
                        'is_active' => true,
                        'deleted_at' => null,
                    ],
                );
            }
        }
    }
}
