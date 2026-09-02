<?php

namespace App\Exports;

use App\Models\JobLevel;
use App\Models\JobTitle;
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

class JobTitlesExport implements FromCollection, ShouldAutoSize, WithEvents, WithHeadings, WithMapping, WithStyles, WithTitle
{
    private int $rowNumber = 1;

    public function collection()
    {
        $jobTitles = JobTitle::with('jobLevel')->orderBy('name')->get();
        /** @var Collection<int, JobTitle|null> $collection */
        $collection = collect($jobTitles->all());

        for ($i = 0; $i < 100; $i++) {
            $collection->push(null);
        }

        return $collection;
    }

    public function headings(): array
    {
        return [
            'ID',
            'ID Job Portal',
            'Kode Posisi',
            'Nama Posisi / Jabatan',
            'Job Level',
            'Sistem',
            'Portal',
        ];
    }

    public function map($jobTitle): array
    {
        $this->rowNumber++;

        if ($jobTitle === null) {
            return ['', '', '', '', '', '', ''];
        }

        return [
            $jobTitle->id,
            $jobTitle->idjobtitle,
            $jobTitle->code,
            $jobTitle->name,
            $jobTitle->jobLevel?->name ?? $jobTitle->job_level_name,
            $jobTitle->is_used ? 'Ya' : 'Tidak',
            $jobTitle->is_active ? 'Aktif' : 'Nonaktif',
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
        return 'Data Job Title';
    }
}
