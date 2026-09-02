<?php

namespace App\Imports;

use App\Models\JobLevel;
use App\Models\JobTitle;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class JobTitlesImport implements ToCollection, WithHeadingRow
{
    public function collection(Collection $rows)
    {
        $rowCount = 1;
        $admin = Auth::id();

        // Preload job levels by name
        $jobLevels = JobLevel::all()->keyBy(fn ($jl) => strtolower(trim($jl->name)));

        foreach ($rows as $row) {
            $rowCount++;

            $code = isset($row['kode_posisi']) ? trim((string) $row['kode_posisi']) : (isset($row['kode']) ? trim((string) $row['kode']) : '');
            $name = isset($row['nama_posisi_jabatan']) ? trim((string) $row['nama_posisi_jabatan']) : (isset($row['nama_posisi']) ? trim((string) $row['nama_posisi']) : (isset($row['nama']) ? trim((string) $row['nama']) : ''));

            if (empty($code) && empty($name)) {
                continue;
            }

            if (empty($code)) {
                throw new \Exception("Kesalahan di baris {$rowCount}: Kode Posisi wajib diisi.");
            }

            if (empty($name)) {
                throw new \Exception("Kesalahan di baris {$rowCount}: Nama Posisi / Jabatan wajib diisi.");
            }

            $jobLevelName = isset($row['job_level']) ? trim((string) $row['job_level']) : (isset($row['nama_level']) ? trim((string) $row['nama_level']) : '');
            $jobLevelId = null;
            if (! empty($jobLevelName) && isset($jobLevels[strtolower($jobLevelName)])) {
                $jobLevelId = $jobLevels[strtolower($jobLevelName)]->id;
            }

            $statusRaw = isset($row['portal']) ? strtolower(trim((string) $row['portal'])) : (isset($row['status_aktif']) ? strtolower(trim((string) $row['status_aktif'])) : '');
            $isActive = in_array($statusRaw, ['aktif', '1', 'true', 'yes', 'y', '']);

            $usedRaw = isset($row['sistem']) ? strtolower(trim((string) $row['sistem'])) : (isset($row['digunakan_di_sistem']) ? strtolower(trim((string) $row['digunakan_di_sistem'])) : '');
            $isUsed = $usedRaw !== '' ? in_array($usedRaw, ['ya', '1', 'true', 'yes', 'y', 'aktif']) : false;

            $id = isset($row['id']) ? trim((string) $row['id']) : '';
            $jobTitle = null;

            if (! empty($id) && Str::isUuid($id)) {
                $jobTitle = JobTitle::find($id);
            }

            if (! $jobTitle) {
                $jobTitle = JobTitle::where('code', $code)->first();
            }

            $idjobtitle = isset($row['id_job_portal']) ? $row['id_job_portal'] : (isset($row['idjobtitle']) ? $row['idjobtitle'] : null);

            $attributes = [
                'idjobtitle'      => ! empty($idjobtitle) ? (int) $idjobtitle : null,
                'code'            => $code,
                'name'            => $name,
                'job_level_id'    => $jobLevelId,
                'job_level_name'  => ! empty($jobLevelName) ? $jobLevelName : null,
                'is_used'         => $isUsed,
                'is_active'       => $isActive,
                'updated_by'      => $admin,
            ];

            if ($jobTitle) {
                $jobTitle->update($attributes);
            } else {
                $attributes['created_by'] = $admin;
                JobTitle::create($attributes);
            }
        }
    }
}
