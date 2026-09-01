<?php

namespace App\Exports;

use App\Models\BusinessUnit;
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

class BusinessUnitsExport implements FromCollection, ShouldAutoSize, WithEvents, WithHeadings, WithMapping, WithStyles, WithTitle
{
    private int $rowNumber = 1;

    public function collection()
    {
        $units = BusinessUnit::orderBy('name')->get();
        /** @var Collection<int, BusinessUnit|null> $collection */
        $collection = collect($units->all());

        for ($i = 0; $i < 100; $i++) {
            $collection->push(null);
        }

        return $collection;
    }

    public function headings(): array
    {
        return [
            'ID',
            'Kode Bisnis Unit',
            'Deskripsi',
            'Company',
            'Lokasi',
            'Group',
            'Region',
            'Komoditi',
            'Kebun',
            'Sistem',
            'Portal',
        ];
    }

    public function map($unit): array
    {
        $this->rowNumber++;

        if ($unit === null) {
            return ['', '', '', '', '', '', '', '', '', '', ''];
        }

        return [
            $unit->id,
            $unit->code,
            $unit->name,
            $unit->company_name ?? '',
            $unit->location_name ?? '',
            $unit->company_group_name ?? '',
            $unit->region_name ?? '',
            $unit->komoditi_name ?? '',
            $unit->kebun ?? '',
            $unit->is_used ? 'Ya' : 'Tidak',
            $unit->is_active ? 'Aktif' : 'Nonaktif',
        ];
    }

    public function title(): string
    {
        return 'Data Bisnis Unit';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['argb' => 'FF4F46E5'],
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
                    $validationStatus = $sheet->getCell("K{$row}")->getDataValidation();
                    $validationStatus->setType(DataValidation::TYPE_LIST);
                    $validationStatus->setErrorStyle(DataValidation::STYLE_STOP);
                    $validationStatus->setAllowBlank(true);
                    $validationStatus->setShowInputMessage(true);
                    $validationStatus->setShowErrorMessage(true);
                    $validationStatus->setShowDropDown(true);
                    $validationStatus->setErrorTitle('Peringatan');
                    $validationStatus->setError('Status harus Aktif atau Nonaktif.');
                    $validationStatus->setFormula1('"Aktif,Nonaktif"');

                    $validationUsed = $sheet->getCell("J{$row}")->getDataValidation();
                    $validationUsed->setType(DataValidation::TYPE_LIST);
                    $validationUsed->setErrorStyle(DataValidation::STYLE_STOP);
                    $validationUsed->setAllowBlank(true);
                    $validationUsed->setShowInputMessage(true);
                    $validationUsed->setShowErrorMessage(true);
                    $validationUsed->setShowDropDown(true);
                    $validationUsed->setErrorTitle('Peringatan');
                    $validationUsed->setError('Pilihan harus Ya atau Tidak.');
                    $validationUsed->setFormula1('"Ya,Tidak"');
                }
            },
        ];
    }
}
