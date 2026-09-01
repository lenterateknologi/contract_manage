<?php

namespace App\Imports;

use App\Models\Department;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class DepartmentsImport implements ToCollection, WithHeadingRow
{
    public function collection(Collection $rows)
    {
        $rowCount = 1;
        $admin = Auth::id();

        foreach ($rows as $row) {
            $rowCount++;

            $code = isset($row['kode_organisasi']) ? trim((string) $row['kode_organisasi']) : (isset($row['kode_departemen']) ? trim((string) $row['kode_departemen']) : (isset($row['kode']) ? trim((string) $row['kode']) : ''));
            $name = isset($row['nama_departemen']) ? trim((string) $row['nama_departemen']) : (isset($row['nama_organisasi']) ? trim((string) $row['nama_organisasi']) : (isset($row['nama']) ? trim((string) $row['nama']) : ''));

            if (empty($code) && empty($name)) {
                continue;
            }

            if (empty($code)) {
                throw new \Exception("Kesalahan di baris {$rowCount}: Kode Organisasi wajib diisi.");
            }

            if (empty($name)) {
                throw new \Exception("Kesalahan di baris {$rowCount}: Nama Departemen wajib diisi.");
            }

            $groupName = isset($row['group_organisasi']) ? trim((string) $row['group_organisasi']) : null;
            $levelName = isset($row['level_organisasi']) ? trim((string) $row['level_organisasi']) : null;
            $description = isset($row['deskripsi']) ? trim((string) $row['deskripsi']) : null;

            $sistemRaw = isset($row['sistem']) ? strtolower(trim((string) $row['sistem'])) : (isset($row['status_sistem']) ? strtolower(trim((string) $row['status_sistem'])) : '');
            $isUsed = in_array($sistemRaw, ['ya', '1', 'true', 'yes', 'y', 'aktif', 'digunakan', 'digunakan (ya)']);

            $statusRaw = isset($row['portal']) ? strtolower(trim((string) $row['portal'])) : (isset($row['status_aktif']) ? strtolower(trim((string) $row['status_aktif'])) : '');
            $isActive = in_array($statusRaw, ['aktif', '1', 'true', 'yes', 'y', '']);

            $id = isset($row['id']) ? trim((string) $row['id']) : '';
            $dept = null;

            if (! empty($id) && Str::isUuid($id)) {
                $dept = Department::find($id);
            }

            if (! $dept) {
                $dept = Department::where('code', $code)->first();
            }

            $attributes = [
                'code' => $code,
                'name' => $name,
                'org_group_name' => $groupName,
                'org_level_name' => $levelName,
                'description' => $description,
                'is_used' => $isUsed,
                'is_active' => $isActive,
                'updated_by' => $admin,
            ];

            if ($dept) {
                $dept->update($attributes);
            } else {
                $attributes['created_by'] = $admin;
                Department::create($attributes);
            }
        }
    }
}
