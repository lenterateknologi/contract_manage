<?php

namespace App\Imports;

use App\Models\JobLevel;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class JobLevelsImport implements ToCollection, WithHeadingRow
{
    public function collection(Collection $rows)
    {
        $rowCount = 1;
        $admin = Auth::id();

        foreach ($rows as $row) {
            $rowCount++;

            $code = isset($row['kode_level']) ? trim((string) $row['kode_level']) : (isset($row['kode']) ? trim((string) $row['kode']) : '');
            $name = isset($row['nama_level']) ? trim((string) $row['nama_level']) : (isset($row['nama']) ? trim((string) $row['nama']) : '');

            if (empty($code) && empty($name)) {
                continue;
            }

            if (empty($code)) {
                throw new \Exception("Kesalahan di baris {$rowCount}: Kode Level wajib diisi.");
            }

            if (empty($name)) {
                throw new \Exception("Kesalahan di baris {$rowCount}: Nama Level wajib diisi.");
            }

            $statusRaw = isset($row['portal']) ? strtolower(trim((string) $row['portal'])) : (isset($row['status_aktif']) ? strtolower(trim((string) $row['status_aktif'])) : '');
            $isActive = in_array($statusRaw, ['aktif', '1', 'true', 'yes', 'y', '']);

            $usedRaw = isset($row['sistem']) ? strtolower(trim((string) $row['sistem'])) : (isset($row['digunakan_di_sistem']) ? strtolower(trim((string) $row['digunakan_di_sistem'])) : '');
            $isUsed = $usedRaw !== '' ? in_array($usedRaw, ['ya', '1', 'true', 'yes', 'y', 'aktif']) : false;

            $id = isset($row['id']) ? trim((string) $row['id']) : '';
            $jobLevel = null;

            if (! empty($id) && Str::isUuid($id)) {
                $jobLevel = JobLevel::find($id);
            }

            if (! $jobLevel) {
                $jobLevel = JobLevel::where('code', $code)->first();
            }

            $attributes = [
                'code'        => $code,
                'name'        => $name,
                'group_name'  => isset($row['grup_level']) ? trim((string) $row['grup_level']) : (isset($row['group_name']) ? trim((string) $row['group_name']) : null),
                'is_used'     => $isUsed,
                'is_active'   => $isActive,
                'updated_by'  => $admin,
            ];

            if ($jobLevel) {
                $jobLevel->update($attributes);
            } else {
                $attributes['created_by'] = $admin;
                JobLevel::create($attributes);
            }
        }
    }
}
