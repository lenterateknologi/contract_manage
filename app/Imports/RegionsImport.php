<?php

namespace App\Imports;

use App\Models\Region;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class RegionsImport implements ToCollection, WithHeadingRow
{
    public function collection(Collection $rows)
    {
        $rowCount = 1;
        $admin = Auth::id();

        foreach ($rows as $row) {
            $rowCount++;

            $code = isset($row['kode_region']) ? trim((string) $row['kode_region']) : '';
            $name = isset($row['nama_region']) ? trim((string) $row['nama_region']) : '';

            if (empty($code) && empty($name)) {
                continue;
            }

            if (empty($code)) {
                throw new \Exception("Kesalahan di baris {$rowCount}: Kode Region wajib diisi.");
            }

            if (empty($name)) {
                throw new \Exception("Kesalahan di baris {$rowCount}: Nama Region wajib diisi.");
            }

            $statusRaw = isset($row['status_aktif']) ? strtolower(trim((string) $row['status_aktif'])) : '';
            $isActive = in_array($statusRaw, ['aktif', '1', 'true', 'yes', 'y', '']);

            $id = isset($row['id']) ? trim((string) $row['id']) : '';
            $region = null;

            if (! empty($id) && Str::isUuid($id)) {
                $region = Region::find($id);
            }

            if (! $region) {
                $region = Region::where('code', $code)->first();
            }

            if ($region) {
                $region->update([
                    'code' => $code,
                    'name' => $name,
                    'alias' => isset($row['alias']) ? trim((string) $row['alias']) : $region->alias,
                    'description' => isset($row['deskripsi']) ? trim((string) $row['deskripsi']) : $region->description,
                    'is_active' => $isActive,
                    'updated_by' => $admin,
                ]);
            } else {
                Region::create([
                    'code' => $code,
                    'name' => $name,
                    'alias' => isset($row['alias']) ? trim((string) $row['alias']) : null,
                    'description' => isset($row['deskripsi']) ? trim((string) $row['deskripsi']) : null,
                    'is_active' => $isActive,
                    'created_by' => $admin,
                    'updated_by' => $admin,
                ]);
            }
        }
    }
}
