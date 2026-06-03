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

        // Get a default company to link users to
        $defaultCompany = Company::where('code', 'LTI')->first();
        $companyId = $defaultCompany ? $defaultCompany->id : null;

        $users = [
            [
                'name' => 'Ahmad Fauzi',
                'email' => 'ahmad@example.com',
                'password' => Hash::make('password'),
                'initials' => 'AF',
                'role' => 'Staff',
                'position' => 'Legal Officer',
                'phone' => '081234567890',
                'department_id' => $depts['LGL'] ?? null,
                'bg_color' => '#ede9fe',
                'text_color' => '#5b21b6',
                'username' => '1000000000000001',
            ],
            [
                'name' => 'Budi Santoso',
                'email' => 'budi@example.com',
                'password' => Hash::make('password'),
                'initials' => 'BS',
                'role' => 'Manager',
                'position' => 'Legal Manager',
                'phone' => '081234567891',
                'department_id' => $depts['LGL'] ?? null,
                'bg_color' => '#e0f2fe',
                'text_color' => '#0369a1',
                'username' => '1000000000000002',
            ],
            [
                'name' => 'Citra Dewi',
                'email' => 'citra@example.com',
                'password' => Hash::make('password'),
                'initials' => 'CD',
                'role' => 'Staff',
                'position' => 'Tax Specialist',
                'phone' => '081234567892',
                'department_id' => $depts['TAX'] ?? null,
                'bg_color' => '#fef9c3',
                'text_color' => '#854d0e',
                'username' => '1000000000000003',
            ],
            [
                'name' => 'Dian Rahayu',
                'email' => 'dian@example.com',
                'password' => Hash::make('password'),
                'initials' => 'DR',
                'role' => 'Director',
                'position' => 'Finance Director',
                'phone' => '081234567893',
                'department_id' => $depts['FIN'] ?? null,
                'bg_color' => '#dbeafe',
                'text_color' => '#1d4ed8',
                'username' => '1000000000000004',
            ],
            [
                'name' => 'Eko Prasetyo',
                'email' => 'eko@example.com',
                'password' => Hash::make('password'),
                'initials' => 'EP',
                'role' => 'Manager',
                'position' => 'IT Infrastructure Manager',
                'phone' => '081234567894',
                'department_id' => $depts['ITC'] ?? null,
                'bg_color' => '#dcfce7',
                'text_color' => '#166534',
                'username' => '1000000000000005',
            ],
            [
                'name' => 'Fajar Vendor',
                'email' => 'vendor@example.com',
                'password' => Hash::make('password'),
                'initials' => 'FV',
                'role' => 'Vendor',
                'position' => 'External Partner',
                'phone' => '081234567895',
                'department_id' => null,
                'bg_color' => '#ffedd5',
                'text_color' => '#9a3412',
                'username' => '1000000000000006',
            ],
            [
                'name' => 'Super Admin',
                'email' => 'admin@example.com',
                'password' => Hash::make('password'),
                'initials' => 'SA',
                'role' => 'Admin',
                'position' => 'System Administrator',
                'phone' => '081111111111',
                'department_id' => $depts['ITC'] ?? null,
                'bg_color' => '#fee2e2',
                'text_color' => '#991b1b',
                'username' => '1000000000000007',
            ],
            [
                'name' => 'Siti Aminah',
                'email' => 'siti@example.com',
                'password' => Hash::make('password'),
                'initials' => 'SA',
                'role' => 'Manager',
                'position' => 'HR Manager',
                'phone' => '081234567896',
                'department_id' => $depts['HRD'] ?? null,
                'bg_color' => '#fce7f3',
                'text_color' => '#9d174d',
                'username' => '1000000000000008',
            ],
            [
                'name' => 'Rendi',
                'email' => 'rendi@example.com',
                'password' => Hash::make('password'),
                'initials' => 'R',
                'role' => 'Staff',
                'position' => 'Legal Specialist',
                'phone' => '081234567897',
                'department_id' => $depts['LGL'] ?? null,
                'bg_color' => '#ede9fe',
                'text_color' => '#5b21b6',
                'username' => '1000000000000009',
            ],
            [
                'name' => 'Nisa',
                'email' => 'nisa@example.com',
                'password' => Hash::make('password'),
                'initials' => 'N',
                'role' => 'Staff',
                'position' => 'Legal Compliance',
                'phone' => '081234567898',
                'department_id' => $depts['LGL'] ?? null,
                'bg_color' => '#e0f2fe',
                'text_color' => '#0369a1',
                'username' => '1000000000000010',
            ],
            [
                'name' => 'Vice President (VP)',
                'email' => 'vp@example.com',
                'password' => Hash::make('password'),
                'initials' => 'VP',
                'role' => 'VP',
                'position' => 'Vice President',
                'phone' => '081234567899',
                'department_id' => $depts['MGT'] ?? null,
                'bg_color' => '#faf5ff',
                'text_color' => '#6b21a8',
                'username' => '1000000000000011',
            ],
            [
                'name' => 'Chief Executive Officer (CEO)',
                'email' => 'ceo@example.com',
                'password' => Hash::make('password'),
                'initials' => 'CEO',
                'role' => 'CEO',
                'position' => 'Chief Executive Officer',
                'phone' => '081234567900',
                'department_id' => $depts['MGT'] ?? null,
                'bg_color' => '#fff7ed',
                'text_color' => '#c2410c',
                'username' => '1000000000000012',
            ],
        ];

        foreach ($users as $userData) {
            $roleName = $userData['role'] ?? 'Staff';
            $roleId = $roles[$roleName] ?? null;

            User::withTrashed()->updateOrCreate(
                ['email' => $userData['email']],
                array_merge($userData, [
                    'company_id' => $companyId,
                    'role_id' => $roleId,
                    'is_active' => true,
                    'deleted_at' => null,
                ]),
            );
        }

        // Now seed more users in a structured way
        $deptModels = Department::all();

        foreach ($deptModels as $dept) {
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
                        'company_id' => $companyId,
                        'initials' => 'M'.substr($dept->code, 0, 1),
                        'bg_color' => '#f1f5f9',
                        'text_color' => '#0f172a',
                        'is_active' => true,
                        'deleted_at' => null,
                    ],
                );
            }

            // Create 3-5 staff members per department
            $staffCount = mt_rand(3, 5);
            for ($i = 1; $i <= $staffCount; $i++) {
                $name = fake()->name();
                $initials = collect(explode(' ', $name))->map(fn ($n) => strtoupper(substr($n, 0, 1)))->take(2)->join('');

                User::withTrashed()->updateOrCreate(
                    ['email' => "staff{$i}.".strtolower($dept->code).'@example.com'],
                    [
                        'name' => $name,
                        'username' => '3000'.str_pad(mt_rand(1, 99999999), 12, '0', STR_PAD_LEFT),
                        'password' => Hash::make('password'),
                        'role' => 'Staff',
                        'role_id' => $roles['Staff'] ?? null,
                        'position' => 'Staff of '.$dept->name,
                        'phone' => fake()->phoneNumber(),
                        'department_id' => $dept->id,
                        'company_id' => $companyId,
                        'initials' => $initials,
                        'bg_color' => fake()->hexColor(),
                        'text_color' => '#ffffff',
                        'is_active' => true,
                        'deleted_at' => null,
                    ],
                );
            }
        }
    }
}
