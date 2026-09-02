<?php

namespace App\Exports;

use App\Models\JobLevel;
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

class JobLevelsExport implements FromCollection, ShouldAutoSize, WithEvents, WithHeadings, WithMapping, WithStyles, WithTitle
{
    private int $rowNumber = 1;

    public function collection()
    {
        $jobLevels = JobLevel::orderBy('name')->get();
        /** @var Collection<int, JobLevel|null> $collection */
        $collection = collect($jobLevels->all());

        for ($i = 0; $i < 100; $i++) {
            $collection->push(null);
        }

        return $collection;
    }

    public function headings(): array
    {
        return [
            'ID',
            'Kode Level',
            'Nama Level',
            'Grup Level',
            'Sistem',
            'Portal',
        ];
    }

    public function map($jobLevel): array
    {
        $this->rowNumber++;

        if ($jobLevel === null) {
            return ['', '', '', '', '', ''];
        }

        return [
            $jobLevel->id,
            $jobLevel->code,
            $jobLevel->name,
            $jobLevel->group_name,
            $jobLevel->is_used ? 'Ya' : 'Tidak',
            $jobLevel->is_active ? 'Aktif' : 'Nonaktif',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['argb' => 'FF1E293B'],
                ],
            ],
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $maxRow = max($this->rowNumber, 100);

                // Data validation for Sistem (column E)
                for ($row = 2; $row <= $maxRow; $row++) {
                    $validation = $sheet->getCell("E{$row}")->getDataValidation();
                    $validation->setType(DataValidation::TYPE_LIST);
                    $validation->setErrorStyle(DataValidation::STYLE_INFORMATION);
                    $validation->setAllowBlank(true);
                    $validation->setShowInputMessage(true);
                    $validation->setShowErrorMessage(true);
                    $validation->setShowDropDown(true);
                    $validation->setFormula1('"Ya,Tidak"');

                    // Data validation for Portal (column F)
                    $validationActive = $sheet->getCell("F{$row}")->getDataValidation();
                    $validationActive->setType(DataValidation::TYPE_LIST);
                    $validationActive->setErrorStyle(DataValidation::STYLE_INFORMATION);
                    $validationActive->setAllowBlank(true);
                    $validationActive->setShowInputMessage(true);
                    $validationActive->setShowErrorMessage(true);
                    $validationActive->setShowDropDown(true);
                    $validationActive->setFormula1('"Aktif,Nonaktif"');
                }
            },
        ];
    }

    public function title(): string
    {
        return 'Data Job Level';
    }
}
