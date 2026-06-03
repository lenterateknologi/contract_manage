<?php

namespace App\Exports;

use App\Models\Role;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class RolesExport implements FromCollection, ShouldAutoSize, WithHeadings, WithMapping, WithStyles, WithTitle
{
    public function collection()
    {
        return Role::whereRaw('lower(name) not in (?, ?, ?)', ['admin', 'super admin', 'superadmin'])
            ->orderBy('name')
            ->get();
    }

    public function headings(): array
    {
        return [
            'Nama Role',
            'Deskripsi',
        ];
    }

    public function map($role): array
    {
        return [
            $role->name,
            $role->description ?? '',
        ];
    }

    public function title(): string
    {
        return 'Master Role';
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
}
