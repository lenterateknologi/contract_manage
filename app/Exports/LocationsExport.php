<?php

namespace App\Exports;

use App\Models\Location;
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

class LocationsExport implements FromCollection, ShouldAutoSize, WithEvents, WithHeadings, WithMapping, WithStyles, WithTitle
{
    private int $rowNumber = 1;

    public function collection()
    {
        $locations = Location::orderBy('name')->get();
        /** @var Collection<int, Location|null> $collection */
        $collection = collect($locations->all());

        for ($i = 0; $i < 100; $i++) {
            $collection->push(null);
        }

        return $collection;
    }

    public function headings(): array
    {
        return [
            'ID',
            'Kode Lokasi',
            'Nama Lokasi',
            'Group Lokasi',
            'Kota / Kabupaten',
            'Provinsi',
            'Alamat',
            'Kode Pos',
            'Oracle Code',
            'Sistem',
            'Portal',
        ];
    }

    public function map($location): array
    {
        $this->rowNumber++;

        if ($location === null) {
            return ['', '', '', '', '', '', '', '', '', '', ''];
        }

        return [
            $location->id,
            $location->code,
            $location->name,
            $location->location_group_name ?? '',
            $location->city_name ?? '',
            $location->province_name ?? '',
            $location->address ?? '',
            $location->zip_code ?? '',
            $location->oracle_code ?? '',
            $location->is_used ? 'Ya' : 'Tidak',
            $location->is_active ? 'Aktif' : 'Nonaktif',
        ];
    }

    public function title(): string
    {
        return 'Data Lokasi';
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
