<?php

namespace App\Imports;

use App\Models\BusinessUnit;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class BusinessUnitsImport implements ToCollection, WithHeadingRow
{
    public function collection(Collection $rows)
    {
        $rowCount = 1;
        $admin = Auth::id();

        foreach ($rows as $row) {
            $rowCount++;

            $code = isset($row['kode_bisnis_unit']) ? trim((string) $row['kode_bisnis_unit']) : '';
            $name = isset($row['deskripsi']) ? trim((string) $row['deskripsi']) : '';

            if (empty($code) && empty($name)) {
                continue;
            }

            if (empty($code)) {
                throw new \Exception("Kesalahan di baris {$rowCount}: Kode Bisnis Unit wajib diisi.");
            }

            if (empty($name)) {
                throw new \Exception("Kesalahan di baris {$rowCount}: Deskripsi wajib diisi.");
            }

            $statusRaw = isset($row['portal']) ? strtolower(trim((string) $row['portal'])) : (isset($row['status_aktif']) ? strtolower(trim((string) $row['status_aktif'])) : '');
            $isActive = in_array($statusRaw, ['aktif', '1', 'true', 'yes', 'y', '']);

            $usedRaw = isset($row['sistem']) ? strtolower(trim((string) $row['sistem'])) : (isset($row['digunakan_di_sistem']) ? strtolower(trim((string) $row['digunakan_di_sistem'])) : '');
            $isUsed = $usedRaw !== '' ? in_array($usedRaw, ['ya', '1', 'true', 'yes', 'y', 'aktif']) : false;

            $id = isset($row['id']) ? trim((string) $row['id']) : '';
            $unit = null;

            if (! empty($id) && Str::isUuid($id)) {
                $unit = BusinessUnit::find($id);
            }

            if (! $unit) {
                $unit = BusinessUnit::where('code', $code)->first();
            }

            $attributes = [
                'code' => $code,
                'name' => $name,
                'company_name' => isset($row['company']) ? trim((string) $row['company']) : null,
                'location_name' => isset($row['lokasi']) ? trim((string) $row['lokasi']) : null,
                'company_group_name' => isset($row['group']) ? trim((string) $row['group']) : null,
                'region_name' => isset($row['region']) ? trim((string) $row['region']) : null,
                'komoditi_name' => isset($row['komoditi']) ? trim((string) $row['komoditi']) : null,
                'kebun' => isset($row['kebun']) ? trim((string) $row['kebun']) : null,
                'is_used' => $isUsed,
                'is_active' => $isActive,
                'updated_by' => $admin,
            ];

            if ($unit) {
                $unit->update($attributes);
            } else {
                $attributes['created_by'] = $admin;
                BusinessUnit::create($attributes);
            }
        }
    }
}
