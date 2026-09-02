<?php

namespace Database\Seeders\Business;

use App\Models\Company;
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

                // Di database ini:
                // - Tabel `m_departments` berisi data divisi dari `department.json` (select * from m_division).
                // - Tabel `m_division` berisi data kloningan dari `m_departments`.
                // Jadi, kolom `department_id` di user diisi dengan $u['division_id'] (dari JSON helpdesk).
                // Dan kolom `division_id` di user diisi dengan ID dari tabel `m_division` yang ber-relasi ke department_id tersebut.
                $deptId = null;
                if (! empty($u['division_id'])) {
                    $deptId = isset($validDepartments[$u['division_id']]) ? $u['division_id'] : null;
                } elseif (! empty($u['division_name'])) {
                    $deptId = Department::whereRaw('lower(name) = ?', [strtolower($u['division_name'])])->value('id');
                }

                $divisionId = null;
                if ($deptId) {
                    $divisionId = DB::table('m_division')->where('department_id', $deptId)->value('id');
                }

                // Dapatkan detail company secara dinamis untuk konsistensi group & region
                $companyId = $u['company_id'] ?? null;
                $companyGroupId = $u['company_group_id'] ?? null;
                $regionId = $u['region_id'] ?? null;

                if ($companyId) {
                    $company = Company::find($companyId);
                    if ($company) {
                        $companyGroupId = $company->company_group_id;
                        $regionId = $company->region_id;
                    }
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
                        'company_id' => $companyId,
                        'company_group_id' => $companyGroupId,
                        'department_id' => $deptId,
                        'division_id' => $divisionId,
                        'region_id' => $regionId,
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
