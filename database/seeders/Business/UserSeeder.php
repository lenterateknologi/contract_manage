<?php

namespace Database\Seeders\Business;

use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed the default System Administrator
        $adminRole = Role::where('name', 'Admin')->first();

        User::updateOrCreate(['email' => 'admin@example.com'], [
            'name' => 'System Administrator',
            'username' => 'admin',
            'password' => Hash::make('password'),
            'role_id' => $adminRole?->id,
            'is_active' => true,
        ]);

        // 2. Import users from user helpdesk.json
        $jsonPath = database_path('from_tiket/user helpdesk.json');
        if (! file_exists($jsonPath)) {
            return;
        }

        try {
            $jsonData = json_decode(file_get_contents($jsonPath), true);

            $usersData = null;
            foreach ($jsonData as $key => $val) {
                if (str_contains($key, 'select * from users') && is_array($val)) {
                    $usersData = $val;
                    break;
                }
            }

            if (empty($usersData)) {
                return;
            }

            $validDepartments = array_flip(DB::table('m_departments')->pluck('id')->toArray());
            $validRoles = array_flip(Role::pluck('id')->toArray());
            $defaultRole = Role::whereRaw('lower(name) = ?', ['staff'])->first();

            foreach ($usersData as $u) {
                if (empty($u['name']) && empty($u['username']) && empty($u['email'])) {
                    continue;
                }

                if (($u['email'] ?? '') === 'admin@example.com' || ($u['username'] ?? '') === 'admin') {
                    continue;
                }

                $email = filter_var($u['email'] ?? '', FILTER_VALIDATE_EMAIL) ? $u['email'] : null;
                $password = $u['password'] ?? bcrypt('Karyawan123!');

                $roleId = null;
                if (! empty($u['role_name'])) {
                    $roleId = Role::whereRaw('lower(name) = ?', [strtolower($u['role_name'])])->value('id');
                } elseif (! empty($u['role_id'])) {
                    $roleId = isset($validRoles[$u['role_id']]) ? $u['role_id'] : null;
                }

                if (! $roleId && $defaultRole) {
                    $roleId = $defaultRole->id;
                }

                $deptId = null;
                if (! empty($u['department_name'])) {
                    $deptId = Department::whereRaw('lower(name) = ?', [strtolower($u['department_name'])])->value('id');
                } elseif (! empty($u['department_id'])) {
                    $deptId = isset($validDepartments[$u['department_id']]) ? $u['department_id'] : null;
                }

                User::updateOrCreate(
                    ! empty($u['id']) ? ['id' => $u['id']] : ['username' => $u['username']],
                    [
                        'username' => $u['username'] ?? null,
                        'code' => $u['code'] ?? null,
                        'name' => $u['name'] ?? null,
                        'email' => $email,
                        'password' => $password,
                        'phone_number' => $u['phone_number'] ?? null,
                        'company_id' => $u['company_id'] ?? null,
                        'company_group_id' => $u['company_group_id'] ?? null,
                        'department_id' => $deptId,
                        'division_id' => $u['division_id'] ?? null,
                        'region_id' => $u['region_id'] ?? null,
                        'role_id' => $roleId,
                        'is_active' => $u['is_active'] ?? true,
                        'is_employee' => $u['is_employee'] ?? true,
                    ]
                );
            }
        } catch (\Exception $e) {
            Log::error('Seeder User Helpdesk Error: '.$e->getMessage());
        }
    }
}
