<?php

namespace App\Exports;

use App\Models\Department;
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

class DepartmentsExport implements FromCollection, ShouldAutoSize, WithEvents, WithHeadings, WithMapping, WithStyles, WithTitle
{
    private int $rowNumber = 1;

    public function collection()
    {
        $departments = Department::orderBy('name')->get();
        /** @var Collection<int, Department|null> $collection */
        $collection = collect($departments->all());

        for ($i = 0; $i < 100; $i++) {
            $collection->push(null);
        }

        return $collection;
    }

    public function headings(): array
    {
        return [
            'ID',
            'Kode Organisasi',
            'Nama Departemen',
            'Group Organisasi',
            'Level Organisasi',
            'Deskripsi',
            'Sistem',
            'Portal',
        ];
    }

    public function map($dept): array
    {
        $this->rowNumber++;

        if ($dept === null) {
            return ['', '', '', '', '', '', '', ''];
        }

        return [
            $dept->id,
            $dept->code,
            $dept->name,
            $dept->org_group_name ?? '',
            $dept->org_level_name ?? '',
            $dept->description ?? '',
            $dept->is_used ? 'Ya' : 'Tidak',
            $dept->is_active ? 'Aktif' : 'Nonaktif',
        ];
    }

    public function title(): string
    {
        return 'Data Departemen';
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
                $dimension = $sheet->calculateWorksheetDimension();
                $sheet->setAutoFilter($dimension);
                $highestRow = $sheet->getHighestRow();

                for ($row = 2; $row <= $highestRow; $row++) {
                    $validationSistem = $sheet->getCell("G{$row}")->getDataValidation();
                    $validationSistem->setType(DataValidation::TYPE_LIST);
                    $validationSistem->setErrorStyle(DataValidation::STYLE_STOP);
                    $validationSistem->setAllowBlank(true);
                    $validationSistem->setShowInputMessage(true);
                    $validationSistem->setShowErrorMessage(true);
                    $validationSistem->setShowDropDown(true);
                    $validationSistem->setErrorTitle('Peringatan');
                    $validationSistem->setError('Status Sistem harus Ya atau Tidak.');
                    $validationSistem->setFormula1('"Ya,Tidak"');

                    $validationStatus = $sheet->getCell("H{$row}")->getDataValidation();
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
