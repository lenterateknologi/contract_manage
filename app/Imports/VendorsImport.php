<?php

namespace App\Imports;

use App\Models\Vendor;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class VendorsImport implements ToCollection, WithHeadingRow
{
    public function collection(Collection $rows)
    {
        $rowCount = 1;
        $admin = Auth::id();

        foreach ($rows as $row) {
            $rowCount++;

            $code = isset($row['kode_vendor']) ? trim((string) $row['kode_vendor']) : '';
            $name = isset($row['nama_vendor']) ? trim((string) $row['nama_vendor']) : '';

            if (empty($code) && empty($name)) {
                continue;
            }

            if (empty($code)) {
                throw new \Exception("Kesalahan di baris {$rowCount}: Kode Vendor wajib diisi.");
            }

            if (empty($name)) {
                throw new \Exception("Kesalahan di baris {$rowCount}: Nama Vendor wajib diisi.");
            }

            $isIndividualRaw = isset($row['individu']) ? strtolower(trim((string) $row['individu'])) : '';
            $isIndividual = in_array($isIndividualRaw, ['ya', '1', 'true', 'yes', 'y']);

            $statusRaw = isset($row['status_aktif']) ? strtolower(trim((string) $row['status_aktif'])) : '';
            $isActive = in_array($statusRaw, ['aktif', '1', 'true', 'yes', 'y', '']);

            $id = isset($row['id']) ? trim((string) $row['id']) : '';
            $vendor = null;

            if (! empty($id) && Str::isUuid($id)) {
                $vendor = Vendor::find($id);
            }

            if (! $vendor) {
                $vendor = Vendor::where('code', $code)->first();
            }

            $data = [
                'code' => $code,
                'name' => $name,
                'category' => isset($row['kategori']) ? trim((string) $row['kategori']) : ($vendor ? $vendor->category : null),
                'email' => isset($row['email']) ? trim((string) $row['email']) : ($vendor ? $vendor->email : null),
                'phone' => isset($row['no_telepon']) ? trim((string) $row['no_telepon']) : ($vendor ? $vendor->phone : null),
                'address' => isset($row['alamat']) ? trim((string) $row['alamat']) : ($vendor ? $vendor->address : null),
                'company_type' => isset($row['tipe_perusahaan']) ? trim((string) $row['tipe_perusahaan']) : ($vendor ? $vendor->company_type : null),
                'is_individual' => $isIndividual,
                'website' => isset($row['website']) ? trim((string) $row['website']) : ($vendor ? $vendor->website : null),
                'pic_name' => isset($row['nama_pic']) ? trim((string) $row['nama_pic']) : ($vendor ? $vendor->pic_name : null),
                'pic_position' => isset($row['jabatan_pic']) ? trim((string) $row['jabatan_pic']) : ($vendor ? $vendor->pic_position : null),
                'npwp' => isset($row['npwp']) ? trim((string) $row['npwp']) : ($vendor ? $vendor->npwp : null),
                'nib' => isset($row['nib']) ? trim((string) $row['nib']) : ($vendor ? $vendor->nib : null),
                'siup' => isset($row['siup']) ? trim((string) $row['siup']) : ($vendor ? $vendor->siup : null),
                'director_name' => isset($row['nama_direktur']) ? trim((string) $row['nama_direktur']) : ($vendor ? $vendor->director_name : null),
                'bank_name' => isset($row['nama_bank']) ? trim((string) $row['nama_bank']) : ($vendor ? $vendor->bank_name : null),
                'bank_account_no' => isset($row['no_rekening']) ? trim((string) $row['no_rekening']) : ($vendor ? $vendor->bank_account_no : null),
                'bank_account_name' => isset($row['nama_rekening']) ? trim((string) $row['nama_rekening']) : ($vendor ? $vendor->bank_account_name : null),
                'is_active' => $isActive,
                'updated_by' => $admin,
            ];

            if ($vendor) {
                $vendor->update($data);
            } else {
                $data['created_by'] = $admin;
                Vendor::create($data);
            }
        }
    }
}
