<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ContractReportExport implements FromCollection, ShouldAutoSize, WithHeadings, WithMapping, WithStyles
{
    protected $contracts;

    public function __construct(Collection $contracts)
    {
        $this->contracts = $contracts;
    }

    public function collection()
    {
        return $this->contracts;
    }

    public function headings(): array
    {
        return [
            'ID',
            'No. Kontrak',
            'Judul',
            'Tipe',
            'Perjanjian',
            'Status',
            'Pembuat',
            'Tgl Dibuat',
            'Versi Terakhir',
            'Deskripsi',
        ];
    }

    public function map($contract): array
    {
        return [
            $contract->id,
            $contract->contract_no,
            $contract->title,
            $contract->contractType->name ?? '—',
            $contract->submissionType->name ?? '—',
            strtoupper($contract->status),
            $contract->creator->name ?? '—',
            $contract->created_at->toDateString(),
            $contract->current_version,
            $contract->description,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['argb' => 'FF4F46E5'], // Indigo color
                ],
            ],
        ];
    }
}
