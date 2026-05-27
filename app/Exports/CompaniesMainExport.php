<?php

namespace App\Exports;

use App\Models\Company;
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

class CompaniesMainExport implements FromCollection, ShouldAutoSize, WithEvents, WithHeadings, WithMapping, WithStyles, WithTitle
{
    private int $rowNumber = 1;

    public function collection()
    {
        $companies = Company::with(['group', 'region'])->orderBy('name')->get();
        $collection = collect($companies);

        for ($i = 0; $i < 100; $i++) {
            $collection->push(null);
        }

        return $collection;
    }

    public function headings(): array
    {
        return [
            'ID',
            'Kode Company',
            'Nama Company',
            'Alias',
            'Alamat',
            'Kode Group',
            'Nama Group Perusahaan',
            'Kode Region',
            'Nama Region',
            'Status Aktif',
        ];
    }

    public function map($company): array
    {
        $this->rowNumber++;

        if ($company === null) {
            return [
                '', // ID
                '', // Kode Company
                '', // Nama Company
                '', // Alias
                '', // Alamat
                '', // Kode Group
                '=IF(ISBLANK(F' . $this->rowNumber . '), "", IFERROR(VLOOKUP(F' . $this->rowNumber . ', \'Group Perusahaan\'!A:B, 2, FALSE), "Tidak Ditemukan"))',
                '', // Kode Region
                '=IF(ISBLANK(H' . $this->rowNumber . '), "", IFERROR(VLOOKUP(H' . $this->rowNumber . ', \'Wilayah Region\'!A:B, 2, FALSE), "Tidak Ditemukan"))',
                '', // Status Aktif
            ];
        }

        return [
            $company->id,
            $company->code,
            $company->name,
            $company->alias ?? '',
            $company->address ?? '',
            $company->group->code ?? '',
            '=IF(ISBLANK(F' . $this->rowNumber . '), "", IFERROR(VLOOKUP(F' . $this->rowNumber . ', \'Group Perusahaan\'!A:B, 2, FALSE), "Tidak Ditemukan"))',
            $company->region->code ?? '',
            '=IF(ISBLANK(H' . $this->rowNumber . '), "", IFERROR(VLOOKUP(H' . $this->rowNumber . ', \'Wilayah Region\'!A:B, 2, FALSE), "Tidak Ditemukan"))',
            $company->is_active ? 'Aktif' : 'Nonaktif',
        ];
    }

    public function title(): string
    {
        return 'Data Perusahaan';
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
                    // Kode Group dropdown validation (references Group Perusahaan sheet, A2:A200)
                    $validationGroup = $sheet->getCell("F{$row}")->getDataValidation();
                    $validationGroup->setType(DataValidation::TYPE_LIST);
                    $validationGroup->setErrorStyle(DataValidation::STYLE_STOP);
                    $validationGroup->setAllowBlank(true);
                    $validationGroup->setShowInputMessage(true);
                    $validationGroup->setShowErrorMessage(true);
                    $validationGroup->setShowDropDown(true);
                    $validationGroup->setErrorTitle('Peringatan');
                    $validationGroup->setError('Kode Group tidak valid. Silakan pilih dari daftar.');
                    $validationGroup->setFormula1('=\'Group Perusahaan\'!$A$2:$A$200');

                    // Kode Region dropdown validation (references Wilayah Region sheet, A2:A200)
                    $validationRegion = $sheet->getCell("H{$row}")->getDataValidation();
                    $validationRegion->setType(DataValidation::TYPE_LIST);
                    $validationRegion->setErrorStyle(DataValidation::STYLE_STOP);
                    $validationRegion->setAllowBlank(true);
                    $validationRegion->setShowInputMessage(true);
                    $validationRegion->setShowErrorMessage(true);
                    $validationRegion->setShowDropDown(true);
                    $validationRegion->setErrorTitle('Peringatan');
                    $validationRegion->setError('Kode Region tidak valid. Silakan pilih dari daftar.');
                    $validationRegion->setFormula1('=\'Wilayah Region\'!$A$2:$A$200');

                    // Status Aktif dropdown validation
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
