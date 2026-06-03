<?php

namespace App\Exports;

use App\Models\Contract;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Relation;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ContractExport implements FromQuery, ShouldAutoSize, WithHeadings, WithMapping, WithStyles
{
    use Exportable;

    protected $query;

    public function __construct($query = null)
    {
        $this->query = $query;
    }

    /**
     * @return Builder|Relation|\Illuminate\Database\Query\Builder
     */
    public function query()
    {
        return $this->query ?: Contract::query()->with(['contractType', 'submissionType', 'creator', 'vendor']);
    }

    public function headings(): array
    {
        return [
            'ID',
            'No. Kontrak',
            'Judul',
            'No. Crown',
            'Tipe Kontrak',
            'Tipe Pengajuan',
            'Status',
            'Vendor',
            'Tgl Kontrak',
            'Tgl Berakhir',
            'Pembuat',
            'Tgl Dibuat',
            'Deskripsi',
        ];
    }

    public function map($contract): array
    {
        return [
            $contract->id,
            $contract->contract_no,
            $contract->title,
            $contract->crown_no,
            $contract->contractType->name ?? '—',
            $contract->submissionType->name ?? '—',
            strtoupper($contract->status),
            $contract->vendor->name ?? '—',
            $contract->contract_date ? $contract->contract_date->toDateString() : '—',
            $contract->end_date ? $contract->end_date->toDateString() : '—',
            $contract->creator->name ?? '—',
            $contract->created_at->toDateTimeString(),
            $contract->description,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['argb' => 'FF4F46E5'], // Indigo color
                ],
            ],
        ];
    }
}
