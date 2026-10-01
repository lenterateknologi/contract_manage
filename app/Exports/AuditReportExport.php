<?php

namespace App\Exports;

use App\Models\Contract;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class AuditReportExport implements FromCollection, ShouldAutoSize, WithEvents, WithHeadings, WithMapping, WithStyles
{
    protected $histories;

    protected $contract;

    public function __construct(Collection $histories, ?Contract $contract = null)
    {
        $this->histories = $histories;
        $this->contract = $contract;
    }

    public function collection()
    {
        return $this->histories;
    }

    public function headings(): array
    {
        return [
            'Waktu',
            'No. Form / Kontrak',
            'Judul Kontrak',
            'Tipe',
            'Tahap (Workflow Step)',
            'Aksi',
            'Deskripsi / Catatan',
            'Aktor',
            'IP Address',
        ];
    }

    public function map($history): array
    {
        $contract = $history->contract ?? $this->contract;
        $desc = $history->description ?? '';
        $customLabel = null;
        if (preg_match('/^([^\n]+?)(?:\s+pada\s+\[|\s+oleh\s+:?)/iu', $desc, $matches)) {
            $candidate = trim($matches[1]);
            if (mb_strlen($candidate) <= 35) {
                $customLabel = $candidate;
            }
        }
        $actionStr = is_object($history->action) ? ($history->action->value ?? (string) $history->action) : (string) ($history->action ?? '');
        $label = $customLabel ?: ucwords(str_replace('_', ' ', strtolower($actionStr)));

        $stepName = $history->step_name
            ?? $contract?->workflowStep?->label
            ?? ($history->step_number ? "Tahap {$history->step_number}" : '—');

        return [
            $history->created_at ? $history->created_at->format('Y-m-d H:i:s') : '—',
            $contract?->form_no ?: ($contract?->contract_no ?: '—'),
            $contract?->title ?? '—',
            $contract?->contractType?->name ?? '—',
            $stepName,
            mb_strtoupper($label),
            $history->description,
            $history->actor?->name ?? 'System',
            $history->ip_address ?? '—',
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

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $sheet->setAutoFilter($sheet->calculateWorksheetDimension());
            },
        ];
    }
}
