<?php

namespace App\Exports;

use App\Models\User;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class EmployeesExport implements FromCollection, ShouldAutoSize, WithEvents, WithHeadings, WithMapping, WithStyles, WithTitle
{
    private int $rowNumber = 1;

    public function collection()
    {
        // Query users, excluding Admin & Super Admin roles, with eager loaded relations
        $users = User::with(['roleRelation', 'department'])
            ->orderBy('name')
            ->get();

        // Convert to collection
        /** @var Collection<int, User|null> $collection */
        $collection = collect($users->all());

        // Pre-fill 100 empty rows with formulas for new employee additions
        for ($i = 0; $i < 100; $i++) {
            $collection->push(null);
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
            'ID Departemen',
            'Nama Departemen',
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
                '', // ID Departemen
                '=IF(ISBLANK(G'.$this->rowNumber.'), "", IFERROR(VLOOKUP(G'.$this->rowNumber.', \'Unit Departemen\'!A:B, 2, FALSE), "Tidak Ditemukan"))',
                '', // Role
                '', // Status Aktif
            ];
        }

        return [
            $user->id,
            $user->name,
            $user->username,
            $user->email,
            $user->phone_number,
            $user->division_id,
            '=IF(ISBLANK(G'.$this->rowNumber.'), "", IFERROR(VLOOKUP(G'.$this->rowNumber.', \'Unit Departemen\'!A:B, 2, FALSE), "Tidak Ditemukan"))',
            $user->role->name ?? $user->getAttribute('role'),
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

                // Enable AutoFilter for the calculated sheet dimension
                $dimension = $sheet->calculateWorksheetDimension();
                $sheet->setAutoFilter($dimension);

                // Get highest row populated
                $highestRow = $sheet->getHighestRow();

                // Apply dropdown data validation to each row (from row 2 to highestRow)
                for ($row = 2; $row <= $highestRow; $row++) {
                    // ID Departemen dropdown validation (references Unit Departemen sheet, A2:A200)
                    $validationDept = $sheet->getCell("G{$row}")->getDataValidation();
                    $validationDept->setType(DataValidation::TYPE_LIST);
                    $validationDept->setErrorStyle(DataValidation::STYLE_STOP);
                    $validationDept->setAllowBlank(true);
                    $validationDept->setShowInputMessage(true);
                    $validationDept->setShowErrorMessage(true);
                    $validationDept->setShowDropDown(true);
                    $validationDept->setErrorTitle('Peringatan');
                    $validationDept->setError('ID Departemen tidak valid. Silakan pilih dari daftar.');
                    $validationDept->setFormula1('=\'Unit Departemen\'!$A$2:$A$200');

                    // Role dropdown validation (references Master Role sheet, A2:A100)
                    $validationRole = $sheet->getCell("I{$row}")->getDataValidation();
                    $validationRole->setType(DataValidation::TYPE_LIST);
                    $validationRole->setErrorStyle(DataValidation::STYLE_STOP);
                    $validationRole->setAllowBlank(true);
                    $validationRole->setShowInputMessage(true);
                    $validationRole->setShowErrorMessage(true);
                    $validationRole->setShowDropDown(true);
                    $validationRole->setErrorTitle('Peringatan');
                    $validationRole->setError('Role tidak valid. Silakan pilih dari daftar.');
                    $validationRole->setFormula1('=\'Master Role\'!$A$2:$A$100');

                    // Status Aktif dropdown validation (hardcoded list: Aktif, Nonaktif)
                    $validationStatus = $sheet->getCell("J{$row}")->getDataValidation();
                    $validationStatus->setType(DataValidation::TYPE_LIST);
                    $validationStatus->setErrorStyle(DataValidation::STYLE_STOP);
                    $validationStatus->setAllowBlank(true);
                    $validationStatus->setShowInputMessage(true);
                    $validationStatus->setShowErrorMessage(true);
                    $validationStatus->setShowDropDown(true);
                    $validationStatus->setErrorTitle('Peringatan');
                    $validationStatus->setError('Status harus Aktif atau Nonaktif.');
                    $validationStatus->setFormula1('"Aktif,Nonaktif"');
                }
            },
        ];
    }
}
