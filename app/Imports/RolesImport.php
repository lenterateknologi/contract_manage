<?php

namespace App\Imports;

use App\Models\Role;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class RolesImport implements ToCollection, WithHeadingRow
{
    public function collection(Collection $rows)
    {
        $rowCount = 1;

        foreach ($rows as $row) {
            $rowCount++;

            $name = isset($row['nama_role']) ? trim((string) $row['nama_role']) : '';
            if (empty($name)) {
                continue;
            }

            // Security constraint: Do not allow modifying or importing admin roles via Excel import
            if (in_array(strtolower($name), ['admin', 'super admin', 'superadmin'])) {
                continue;
            }

            Role::updateOrCreate(
                ['name' => $name],
                ['description' => isset($row['deskripsi']) ? trim((string) $row['deskripsi']) : null],
            );
        }
    }
}
