<?php

namespace App\Exports;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class EmployeesExport implements FromCollection, WithColumnWidths, WithEvents, WithHeadings, WithMapping, WithStyles, WithTitle
{
    protected ?Request $request;

    private int $rowNumber = 1;

    public function __construct(?Request $request = null)
    {
        $this->request = $request;
    }

    public function columnWidths(): array
    {
        return [
            'A' => 38, // ID
            'B' => 28, // Nama Lengkap
            'C' => 22, // Username
            'D' => 30, // Email
            'E' => 16, // No Telepon
            'F' => 38, // ID Divisi
            'G' => 28, // Nama Divisi
            'H' => 18, // Role
            'I' => 14, // Status Aktif
        ];
    }

    public function collection()
    {
        $query = User::query()
            ->with([
                'roleRelation',
                'division',
                'department',
            ]);

        $req = $this->request;
        $isFiltering = false;

        if ($req) {
            // 1. Search term filter
            if ($req->filled('search')) {
                $isFiltering = true;
                $search = trim((string) $req->input('search'));
                $searchColumns = ['name', 'nik', 'email', 'username', 'org_name', 'company_name', 'location_name'];
                $terms = array_values(array_filter(explode(' ', $search)));

                $query->where(function ($q) use ($searchColumns, $terms) {
                    foreach ($terms as $term) {
                        $lowerTerm = strtolower($term);
                        $q->where(function ($subQ) use ($searchColumns, $lowerTerm) {
                            foreach ($searchColumns as $column) {
                                $subQ->orWhere(\Illuminate\Support\Facades\DB::raw("LOWER(COALESCE(CAST({$column} AS text), ''))"), 'like', "%{$lowerTerm}%");
                            }
                        });
                    }
                });
            }

            // 2. Relational & Column Filters
            $filterKeys = [
                'division_id',
                'department_id',
                'job_position_id',
                'job_level_id',
                'location_id',
                'company_group_id',
                'region_id',
                'company_id',
                'role_id',
                'gender',
            ];

            foreach ($filterKeys as $key) {
                if ($req->has($key) && $req->input($key) !== '' && $req->input($key) !== null) {
                    $isFiltering = true;
                    $val = $req->input($key);
                    $vals = is_array($val) ? array_values(array_filter($val, fn ($v) => $v !== '' && $v !== null)) : [$val];

                    if (! empty($vals)) {
                        $hasEmpty = in_array('__empty__', $vals, true) || in_array('empty', $vals, true) || in_array('null', $vals, true) || in_array('-', $vals, true);
                        $concreteVals = array_values(array_filter($vals, fn ($v) => ! in_array($v, ['__empty__', 'empty', 'null', '-'], true)));

                        if ($hasEmpty && ! empty($concreteVals)) {
                            $query->where(function ($q) use ($key, $concreteVals) {
                                $q->whereIn($key, $concreteVals)
                                    ->orWhereNull($key)
                                    ->orWhere(\Illuminate\Support\Facades\DB::raw("CAST({$key} AS text)"), '');
                            });
                        } elseif ($hasEmpty) {
                            $query->where(function ($q) use ($key) {
                                $q->whereNull($key)
                                    ->orWhere(\Illuminate\Support\Facades\DB::raw("CAST({$key} AS text)"), '');
                            });
                        } else {
                            $query->whereIn($key, $concreteVals);
                        }
                    }
                }
            }

            // 3. Status is_used
            if ($req->has('is_used')) {
                $val = $req->input('is_used');
                $vals = is_array($val) ? array_values(array_filter($val, fn ($v) => $v !== '' && $v !== null)) : [$val];
                if (! empty($vals)) {
                    $boolVals = array_map(fn ($v) => ($v === '1' || $v === 1 || $v === true || $v === 'true'), $vals);
                    $query->whereIn('is_used', $boolVals);
                }
            } else {
                $query->where('is_used', true);
            }

            // 4. Status is_active
            if ($req->has('is_active')) {
                $val = $req->input('is_active');
                $vals = is_array($val) ? array_values(array_filter($val, fn ($v) => $v !== '' && $v !== null)) : [$val];
                if (! empty($vals)) {
                    $boolVals = array_map(fn ($v) => ($v === '1' || $v === 1 || $v === true || $v === 'true'), $vals);
                    $query->whereIn('is_active', $boolVals);
                }
            } else {
                $query->where('is_active', true);
            }
        } else {
            $query->where('is_used', true)->where('is_active', true);
        }

        $users = $query->orderBy('name')->get();

        /** @var Collection<int, User|null> $collection */
        $collection = collect($users->all());

        // Tambahkan baris kosong template hanya jika user TIDAK sedang memfilter data spesifik
        if (! $isFiltering) {
            for ($i = 0; $i < 5; $i++) {
                $collection->push(null);
            }
        }

        return $collection;
    }

    public function headings(): array
    {
        return [
            'ID',
            'Nama Lengkap',
            'Username',
            'Email',
            'No Telepon',
            'ID Divisi',
            'Nama Divisi',
            'Role',
            'Status Aktif',
        ];
    }

    public function map($user): array
    {
        $this->rowNumber++;

        if ($user === null) {
            return [
                '', // ID
                '', // Nama Lengkap
                '', // Username
                '', // Email
                '', // No Telepon
                '=IF(ISBLANK(G'.$this->rowNumber.'), "", IFERROR(INDEX(\'Master Divisi\'!A:A, MATCH(G'.$this->rowNumber.', \'Master Divisi\'!B:B, 0)), ""))', // ID Divisi
                '', // Nama Divisi
                '', // Role
                '', // Status Aktif
            ];
        }

        $divName = $user->division_name ?? ($user->division?->name ?? '');

        return [
            $user->id,
            $user->name,
            $user->username,
            $user->email,
            $user->phone_number ?: $user->mobile_no,
            $user->division_id,
            $divName,
            $user->role_name ?? ($user->roleRelation?->name ?? ($user->role ?? 'Staff')),
            $user->is_active ? 'Aktif' : 'Nonaktif',
        ];
    }

    public function title(): string
    {
        return 'Data Karyawan';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['argb' => 'FF4F46E5'], // Indigo theme
                ],
            ],
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();

                // Sembunyikan kolom teknis UUID (Kolom A: ID User, Kolom F: ID Divisi) agar UI Excel bersih & ramah pengguna
                $sheet->getColumnDimension('A')->setVisible(false);
                $sheet->getColumnDimension('F')->setVisible(false);

                // Enable AutoFilter for the calculated sheet dimension
                $dimension = $sheet->calculateWorksheetDimension();
                $sheet->setAutoFilter($dimension);

                $highestRow = $sheet->getHighestRow();

                // Apply dropdown data validation to rows
                for ($row = 2; $row <= $highestRow; $row++) {
                    // Nama Divisi dropdown validation (references Master Divisi sheet, B2:B100)
                    $validationDiv = $sheet->getCell("G{$row}")->getDataValidation();
                    $validationDiv->setType(DataValidation::TYPE_LIST);
                    $validationDiv->setErrorStyle(DataValidation::STYLE_STOP);
                    $validationDiv->setAllowBlank(true);
                    $validationDiv->setShowDropDown(true);
                    $validationDiv->setErrorTitle('Peringatan');
                    $validationDiv->setError('Nama Divisi tidak valid. Silakan pilih dari daftar.');
                    $validationDiv->setFormula1('=\'Master Divisi\'!$B$2:$B$100');

                    // Role dropdown validation (references Master Role sheet, A2:A100)
                    $validationRole = $sheet->getCell("H{$row}")->getDataValidation();
                    $validationRole->setType(DataValidation::TYPE_LIST);
                    $validationRole->setErrorStyle(DataValidation::STYLE_STOP);
                    $validationRole->setAllowBlank(true);
                    $validationRole->setShowDropDown(true);
                    $validationRole->setErrorTitle('Peringatan');
                    $validationRole->setError('Role tidak valid. Silakan pilih dari daftar.');
                    $validationRole->setFormula1('=\'Master Role\'!$A$2:$A$100');

                    // Status Aktif dropdown validation
                    $validationStatus = $sheet->getCell("I{$row}")->getDataValidation();
                    $validationStatus->setType(DataValidation::TYPE_LIST);
                    $validationStatus->setErrorStyle(DataValidation::STYLE_STOP);
                    $validationStatus->setAllowBlank(true);
                    $validationStatus->setShowDropDown(true);
                    $validationStatus->setErrorTitle('Peringatan');
                    $validationStatus->setError('Status harus Aktif atau Nonaktif.');
                    $validationStatus->setFormula1('"Aktif,Nonaktif"');
                }
            },
        ];
    }
}
