<?php

namespace App\Exports;

use App\Models\Vendor;
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

class VendorsExport implements FromCollection, ShouldAutoSize, WithEvents, WithHeadings, WithMapping, WithStyles, WithTitle
{
    private int $rowNumber = 1;

    public function collection()
    {
        $vendors = Vendor::orderBy('name')->get();
        /** @var Collection<int, Vendor|null> $collection */
        $collection = collect($vendors->all());

        for ($i = 0; $i < 100; $i++) {
            $collection->push(null);
        }

        return $collection;
    }

    public function headings(): array
    {
        return [
            'ID',
            'Kode Vendor',
            'Nama Vendor',
            'Kategori',
            'Email',
            'No Telepon',
            'Alamat',
            'Tipe Perusahaan',
            'Individu',
            'Website',
            'Nama PIC',
            'Jabatan PIC',
            'NPWP',
            'NIB',
            'SIUP',
            'Nama Direktur',
            'Nama Bank',
            'No Rekening',
            'Nama Rekening',
            'Status Aktif',
        ];
    }

    public function map($vendor): array
    {
        $this->rowNumber++;

        if ($vendor === null) {
            return ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
        }

        return [
            $vendor->id,
            $vendor->code,
            $vendor->name,
            $vendor->category ?? '',
            $vendor->email ?? '',
            $vendor->phone ?? '',
            $vendor->address ?? '',
            $vendor->company_type ?? '',
            $vendor->is_individual ? 'Ya' : 'Tidak',
            $vendor->website ?? '',
            $vendor->pic_name ?? '',
            $vendor->pic_position ?? '',
            $vendor->npwp ?? '',
            $vendor->nib ?? '',
            $vendor->siup ?? '',
            $vendor->director_name ?? '',
            $vendor->bank_name ?? '',
            $vendor->bank_account_no ?? '',
            $vendor->bank_account_name ?? '',
            $vendor->is_active ? 'Aktif' : 'Nonaktif',
        ];
    }

    public function title(): string
    {
        return 'Daftar Vendor';
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
                    // Individu (Ya/Tidak) validation
                    $validationInd = $sheet->getCell("I{$row}")->getDataValidation();
                    $validationInd->setType(DataValidation::TYPE_LIST);
                    $validationInd->setErrorStyle(DataValidation::STYLE_STOP);
                    $validationInd->setAllowBlank(true);
                    $validationInd->setShowInputMessage(true);
                    $validationInd->setShowErrorMessage(true);
                    $validationInd->setShowDropDown(true);
                    $validationInd->setErrorTitle('Peringatan');
                    $validationInd->setError('Harus Ya atau Tidak.');
                    $validationInd->setFormula1('"Ya,Tidak"');

                    // Status Aktif validation
                    $validationStatus = $sheet->getCell("T{$row}")->getDataValidation();
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
