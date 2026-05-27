<?php

namespace App\Imports;

use App\Models\CompanyGroup;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class CompanyGroupsImport implements ToCollection, WithHeadingRow
{
    public function collection(Collection $rows)
    {
        $rowCount = 1;
        $admin = Auth::id();

        foreach ($rows as $row) {
            $rowCount++;

            $code = isset($row['kode_group']) ? trim((string) $row['kode_group']) : '';
            $name = isset($row['nama_group_perusahaan']) ? trim((string) $row['nama_group_perusahaan']) : '';

            if (empty($code) && empty($name)) {
                continue;
            }

            if (empty($code)) {
                throw new \Exception("Kesalahan di baris {$rowCount}: Kode Group wajib diisi.");
            }

            if (empty($name)) {
                throw new \Exception("Kesalahan di baris {$rowCount}: Nama Group Perusahaan wajib diisi.");
            }

            $statusRaw = isset($row['status_aktif']) ? strtolower(trim((string) $row['status_aktif'])) : '';
            $isActive = in_array($statusRaw, ['aktif', '1', 'true', 'yes', 'y', '']);

            $id = isset($row['id']) ? trim((string) $row['id']) : '';
            $group = null;

            if (! empty($id) && Str::isUuid($id)) {
                $group = CompanyGroup::find($id);
            }

            if (! $group) {
                $group = CompanyGroup::where('code', $code)->first();
            }

            if ($group) {
                $group->update([
                    'code' => $code,
                    'name' => $name,
                    'description' => isset($row['deskripsi']) ? trim((string) $row['deskripsi']) : $group->description,
                    'is_active' => $isActive,
                    'updated_by' => $admin,
                ]);
            } else {
                CompanyGroup::create([
                    'code' => $code,
                    'name' => $name,
                    'description' => isset($row['deskripsi']) ? trim((string) $row['deskripsi']) : null,
                    'is_active' => $isActive,
                    'created_by' => $admin,
                    'updated_by' => $admin,
                ]);
            }
        }
    }
}
