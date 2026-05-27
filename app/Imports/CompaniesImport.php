<?php

namespace App\Imports;

use App\Models\Company;
use App\Models\CompanyGroup;
use App\Models\Region;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class CompaniesImport implements ToCollection, WithHeadingRow
{
    public function collection(Collection $rows)
    {
        $rowCount = 1;
        $admin = Auth::id();

        // Pluck maps for resolution
        $groupMap = CompanyGroup::pluck('id', 'code')->all();
        $regionMap = Region::pluck('id', 'code')->all();

        foreach ($rows as $row) {
            $rowCount++;

            $code = isset($row['kode_company']) ? trim((string) $row['kode_company']) : '';
            $name = isset($row['nama_company']) ? trim((string) $row['nama_company']) : '';

            if (empty($code) && empty($name)) {
                continue;
            }

            if (empty($code)) {
                throw new \Exception("Kesalahan di baris {$rowCount}: Kode Company wajib diisi.");
            }

            if (empty($name)) {
                throw new \Exception("Kesalahan di baris {$rowCount}: Nama Company wajib diisi.");
            }

            // Resolve Group
            $groupCode = isset($row['kode_group']) ? trim((string) $row['kode_group']) : '';
            $groupId = null;
            if (! empty($groupCode)) {
                if (isset($groupMap[$groupCode])) {
                    $groupId = $groupMap[$groupCode];
                } else {
                    throw new \Exception("Kesalahan di baris {$rowCount}: Kode Group '{$groupCode}' tidak ditemukan di sistem.");
                }
            } else {
                throw new \Exception("Kesalahan di baris {$rowCount}: Kode Group wajib diisi.");
            }

            // Resolve Region
            $regionCode = isset($row['kode_region']) ? trim((string) $row['kode_region']) : '';
            $regionId = null;
            if (! empty($regionCode)) {
                if (isset($regionMap[$regionCode])) {
                    $regionId = $regionMap[$regionCode];
                } else {
                    throw new \Exception("Kesalahan di baris {$rowCount}: Kode Region '{$regionCode}' tidak ditemukan di sistem.");
                }
            } else {
                throw new \Exception("Kesalahan di baris {$rowCount}: Kode Region wajib diisi.");
            }

            $statusRaw = isset($row['status_aktif']) ? strtolower(trim((string) $row['status_aktif'])) : '';
            $isActive = in_array($statusRaw, ['aktif', '1', 'true', 'yes', 'y', '']);

            $id = isset($row['id']) ? trim((string) $row['id']) : '';
            $company = null;

            if (! empty($id) && Str::isUuid($id)) {
                $company = Company::find($id);
            }

            if (! $company) {
                $company = Company::where('code', $code)->first();
            }

            if ($company) {
                $company->update([
                    'code' => $code,
                    'name' => $name,
                    'alias' => isset($row['alias']) ? trim((string) $row['alias']) : $company->alias,
                    'address' => isset($row['alamat']) ? trim((string) $row['alamat']) : $company->address,
                    'company_group_id' => $groupId,
                    'region_id' => $regionId,
                    'is_active' => $isActive,
                    'updated_by' => $admin,
                ]);
            } else {
                Company::create([
                    'code' => $code,
                    'name' => $name,
                    'alias' => isset($row['alias']) ? trim((string) $row['alias']) : null,
                    'address' => isset($row['alamat']) ? trim((string) $row['alamat']) : null,
                    'company_group_id' => $groupId,
                    'region_id' => $regionId,
                    'is_active' => $isActive,
                    'created_by' => $admin,
                    'updated_by' => $admin,
                ]);
            }
        }
    }
}
