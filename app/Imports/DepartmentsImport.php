<?php

namespace App\Imports;

use App\Models\Company;
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

        // Pluck maps for resolution
        $companyMap = Company::pluck('id', 'code')->all();

        foreach ($rows as $row) {
            $rowCount++;

            $code = isset($row['kode_departemen']) ? trim((string) $row['kode_departemen']) : '';
            $name = isset($row['nama_departemen']) ? trim((string) $row['nama_departemen']) : '';

            if (empty($code) && empty($name)) {
                continue;
            }

            if (empty($code)) {
                throw new \Exception("Kesalahan di baris {$rowCount}: Kode Departemen wajib diisi.");
            }

            if (empty($name)) {
                throw new \Exception("Kesalahan di baris {$rowCount}: Nama Departemen wajib diisi.");
            }

            // Resolve Company
            $companyCode = isset($row['kode_company']) ? trim((string) $row['kode_company']) : '';
            $companyId = null;
            if (! empty($companyCode)) {
                if (isset($companyMap[$companyCode])) {
                    $companyId = $companyMap[$companyCode];
                } else {
                    throw new \Exception("Kesalahan di baris {$rowCount}: Kode Company '{$companyCode}' tidak ditemukan di sistem.");
                }
            } else {
                throw new \Exception("Kesalahan di baris {$rowCount}: Kode Company wajib diisi.");
            }

            $statusRaw = isset($row['status_aktif']) ? strtolower(trim((string) $row['status_aktif'])) : '';
            $isActive = in_array($statusRaw, ['aktif', '1', 'true', 'yes', 'y', '']);

            $id = isset($row['id']) ? trim((string) $row['id']) : '';
            $dept = null;

            if (! empty($id) && Str::isUuid($id)) {
                $dept = Department::find($id);
            }

            if (! $dept) {
                $dept = Department::where('code', $code)->first();
            }

            if ($dept) {
                $dept->update([
                    'code' => $code,
                    'name' => $name,
                    'description' => isset($row['deskripsi']) ? trim((string) $row['deskripsi']) : $dept->description,
                    'company_id' => $companyId,
                    'is_active' => $isActive,
                    'updated_by' => $admin,
                ]);
            } else {
                Department::create([
                    'code' => $code,
                    'name' => $name,
                    'description' => isset($row['deskripsi']) ? trim((string) $row['deskripsi']) : null,
                    'company_id' => $companyId,
                    'is_active' => $isActive,
                    'created_by' => $admin,
                    'updated_by' => $admin,
                ]);
            }
        }
    }
}
