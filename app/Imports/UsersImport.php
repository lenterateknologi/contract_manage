<?php

namespace App\Imports;

use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class UsersImport implements ToCollection, WithHeadingRow
{
    public function collection(Collection $rows)
    {
        $rowCount = 1; // Row 1 is headings

        foreach ($rows as $row) {
            $rowCount++;

            // Clean inputs
            $name = isset($row['nama_lengkap']) ? trim((string) $row['nama_lengkap']) : '';
            $email = isset($row['email']) ? trim((string) $row['email']) : '';
            $username = isset($row['username']) ? trim((string) $row['username']) : '';

            // Skip completely empty rows
            if (empty($name) && empty($email) && empty($username)) {
                continue;
            }

            // Validation: Name is required
            if (empty($name)) {
                throw new \Exception("Kesalahan di baris {$rowCount}: Nama Lengkap wajib diisi.");
            }

            // Validation: Username is required
            if (empty($username)) {
                throw new \Exception("Kesalahan di baris {$rowCount}: Username wajib diisi.");
            }

            // Validation: Email is required
            if (empty($email)) {
                throw new \Exception("Kesalahan di baris {$rowCount}: Email wajib diisi.");
            }

            // Security constraint: Block admin roles
            $roleName = isset($row['role']) ? trim((string) $row['role']) : '';
            if (in_array(strtolower($roleName), ['admin', 'super admin', 'superadmin'])) {
                throw new \Exception("Kesalahan di baris {$rowCount}: Tidak dapat membuat/mengubah pengguna dengan role Admin atau Super Admin.");
            }

            // Resolve Role
            $roleObj = null;
            if (! empty($roleName)) {
                $roleObj = Role::whereRaw('lower(name) = ?', [strtolower($roleName)])->first();
                if (! $roleObj) {
                    throw new \Exception("Kesalahan di baris {$rowCount}: Role '{$roleName}' tidak ditemukan.");
                }
            }

            // Resolve Department
            $deptId = isset($row['id_departemen']) ? trim((string) $row['id_departemen']) : '';
            $deptName = isset($row['nama_departemen']) ? trim((string) $row['nama_departemen']) : '';
            $department = null;

            if (! empty($deptId) && Str::isUuid($deptId)) {
                $department = Department::find($deptId);
            }

            if (! $department && ! empty($deptName)) {
                $department = Department::whereRaw('lower(name) = ?', [strtolower($deptName)])->first();
            }

            // Resolve status_aktif to boolean
            $statusRaw = isset($row['status_aktif']) ? strtolower(trim((string) $row['status_aktif'])) : '';
            $isActive = in_array($statusRaw, ['aktif', '1', 'true', 'yes', 'y']);

            // Find existing user by ID (if valid UUID), or email, or username
            $userId = isset($row['id']) ? trim((string) $row['id']) : '';
            $user = null;

            if (! empty($userId) && Str::isUuid($userId)) {
                $user = User::find($userId);
            }

            if (! $user) {
                $user = User::where('email', $email)
                    ->orWhere('username', $username)
                    ->first();
            }

            // Security constraint: Do not allow modifying existing admin users via Excel
            if ($user && in_array(strtolower($user->role), ['admin', 'super admin', 'superadmin'])) {
                continue;
            }

            if ($user) {
                // Update existing user
                $updateData = [
                    'name' => $name,
                    'username' => $username,
                    'email' => $email,
                    'phone_number' => isset($row['no_telepon']) ? trim((string) $row['no_telepon']) : $user->phone_number,
                    'is_active' => $isActive,
                ];

                if ($roleObj) {
                    $updateData['role_id'] = $roleObj->id;
                }

                if ($department) {
                    $updateData['department_id'] = $department->id;
                } elseif (empty($deptId) && empty($deptName)) {
                    $updateData['department_id'] = null;
                }

                $user->update($updateData);
            } else {
                // Determine default role if not provided
                if (! $roleObj) {
                    $roleObj = Role::whereRaw('lower(name) = ?', ['staff'])->first();
                }

                // Create new user
                User::create([
                    'name' => $name,
                    'username' => $username,
                    'email' => $email,
                    'phone_number' => isset($row['no_telepon']) ? trim((string) $row['no_telepon']) : null,
                    'is_active' => $isActive,
                    'role_id' => $roleObj ? $roleObj->id : null,
                    'department_id' => $department ? $department->id : null,
                    'password' => bcrypt('Karyawan123!'), // Default password
                ]);
            }
        }
    }
}
