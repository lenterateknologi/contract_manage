<?php

namespace App\Exports;

use App\Models\Department;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class DepartmentMainExport implements FromCollection, ShouldAutoSize, WithEvents, WithHeadings, WithMapping, WithStyles, WithTitle
{
    private int $rowNumber = 1;

    public function collection()
    {
        $depts = Department::with('company')->orderBy('name')->get();
        $collection = collect($depts);

        for ($i = 0; $i < 100; $i++) {
            $collection->push(null);
        }

        return $collection;
    }

    public function headings(): array
    {
        return [
            'ID',
            'Kode Departemen',
            'Nama Departemen',
            'Deskripsi',
            'Kode Company',
            'Nama Company',
            'Status Aktif',
        ];
    }

    public function map($dept): array
    {
        $this->rowNumber++;

        if ($dept === null) {
            return [
                '', // ID
                '', // Kode Departemen
                '', // Nama Departemen
                '', // Deskripsi
                '', // Kode Company
                '=IF(ISBLANK(E' . $this->rowNumber . '), "", IFERROR(VLOOKUP(E' . $this->rowNumber . ', \'Data Perusahaan\'!A:B, 2, FALSE), "Tidak Ditemukan"))',
                '', // Status Aktif
            ];
        }

        return [
            $dept->id,
            $dept->code,
            $dept->name,
            $dept->description ?? '',
            $dept->company->code ?? '',
            '=IF(ISBLANK(E' . $this->rowNumber . '), "", IFERROR(VLOOKUP(E' . $this->rowNumber . ', \'Data Perusahaan\'!A:B, 2, FALSE), "Tidak Ditemukan"))',
            $dept->is_active ? 'Aktif' : 'Nonaktif',
        ];
    }

    public function title(): string
    {
        return 'Unit Departemen';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
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
                $dimension = $sheet->calculateWorksheetDimension();
                $sheet->setAutoFilter($dimension);
                $highestRow = $sheet->getHighestRow();

                for ($row = 2; $row <= $highestRow; $row++) {
                    // Kode Company dropdown validation (references Data Perusahaan sheet, A2:A200)
                    $validationCompany = $sheet->getCell("E{$row}")->getDataValidation();
                    $validationCompany->setType(DataValidation::TYPE_LIST);
                    $validationCompany->setErrorStyle(DataValidation::STYLE_STOP);
                    $validationCompany->setAllowBlank(true);
                    $validationCompany->setShowInputMessage(true);
                    $validationCompany->setShowErrorMessage(true);
                    $validationCompany->setShowDropDown(true);
                    $validationCompany->setErrorTitle('Peringatan');
                    $validationCompany->setError('Kode Company tidak valid. Silakan pilih dari daftar.');
                    $validationCompany->setFormula1('=\'Data Perusahaan\'!$A$2:$A$200');

                    // Status Aktif dropdown validation
                    $validationStatus = $sheet->getCell("G{$row}")->getDataValidation();
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
