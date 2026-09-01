<?php

namespace App\Imports;

use App\Models\Location;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class LocationsImport implements ToCollection, WithHeadingRow
{
    public function collection(Collection $rows)
    {
        $rowCount = 1;
        $admin = Auth::id();

        foreach ($rows as $row) {
            $rowCount++;

            $code = isset($row['kode_lokasi']) ? trim((string) $row['kode_lokasi']) : '';
            $name = isset($row['nama_lokasi']) ? trim((string) $row['nama_lokasi']) : '';

            if (empty($code) && empty($name)) {
                continue;
            }

            if (empty($code)) {
                throw new \Exception("Kesalahan di baris {$rowCount}: Kode Lokasi wajib diisi.");
            }

            if (empty($name)) {
                throw new \Exception("Kesalahan di baris {$rowCount}: Nama Lokasi wajib diisi.");
            }

            $statusRaw = isset($row['portal']) ? strtolower(trim((string) $row['portal'])) : (isset($row['status_aktif']) ? strtolower(trim((string) $row['status_aktif'])) : '');
            $isActive = in_array($statusRaw, ['aktif', '1', 'true', 'yes', 'y', '']);

            $usedRaw = isset($row['sistem']) ? strtolower(trim((string) $row['sistem'])) : (isset($row['digunakan_di_sistem']) ? strtolower(trim((string) $row['digunakan_di_sistem'])) : '');
            $isUsed = $usedRaw !== '' ? in_array($usedRaw, ['ya', '1', 'true', 'yes', 'y', 'aktif']) : false;

            $id = isset($row['id']) ? trim((string) $row['id']) : '';
            $location = null;

            if (! empty($id) && Str::isUuid($id)) {
                $location = Location::find($id);
            }

            if (! $location) {
                $location = Location::where('code', $code)->first();
            }

            $attributes = [
                'code'                => $code,
                'name'                => $name,
                'location_group_name' => isset($row['group_lokasi']) ? trim((string) $row['group_lokasi']) : null,
                'city_name'           => isset($row['kota_kabupaten']) ? trim((string) $row['kota_kabupaten']) : null,
                'province_name'       => isset($row['provinsi']) ? trim((string) $row['provinsi']) : null,
                'address'             => isset($row['alamat']) ? trim((string) $row['alamat']) : null,
                'zip_code'            => isset($row['kode_pos']) ? trim((string) $row['kode_pos']) : null,
                'oracle_code'         => isset($row['oracle_code']) ? trim((string) $row['oracle_code']) : null,
                'is_used'             => $isUsed,
                'is_active'           => $isActive,
                'updated_by'          => $admin,
            ];

            if ($location) {
                $location->update($attributes);
            } else {
                $attributes['created_by'] = $admin;
                Location::create($attributes);
            }
        }
    }
}
