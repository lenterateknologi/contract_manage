<?php

namespace App\Exports;

use App\Models\Contract;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class AuditReportExport implements FromCollection, ShouldAutoSize, WithEvents, WithHeadings, WithMapping, WithTitle
{
    protected $histories;

    protected $contract;

    private int $rowNumber = 1;

    public function __construct(Collection $histories, ?Contract $contract = null)
    {
        $this->histories = $histories;
        $this->contract = $contract;
    }

    public function collection()
    {
        return $this->histories;
    }

    public function title(): string
    {
        return 'Jejak Audit';
    }

    public function headings(): array
    {
        return [
            'No',
            'Waktu Transaksi',
            'Jenis Aksi',
            'No. Form / Kontrak',
            'Judul Kontrak',
            'Tipe Kontrak',
            'Tahap Alur Kerja',
            'Pelaksana (Actor)',
            'Jabatan / Role',
            'Departemen',
            'Deskripsi / Catatan',
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

        $stepName = $contract?->workflowStep?->label ?? '—';
        $actorRole = $history->actor?->jobtitle_name ?? ($history->actor?->joblevel_name ?? '—');
        $actorDept = $history->actor?->department_name ?? ($history->actor?->org_name ?? '—');

        return [
            $this->rowNumber++,
            $history->created_at ? $history->created_at->format('Y-m-d H:i:s') : '—',
            mb_strtoupper($label),
            $contract?->form_no ?: ($contract?->contract_no ?: '—'),
            $contract?->title ?? '—',
            $contract?->contractType?->name ?? '—',
            $stepName,
            $history->actor?->name ?? 'System',
            $actorRole,
            $actorDept,
            $history->description ?? '—',
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $highestRow = max($sheet->getHighestRow(), 1);
                $highestColumn = $sheet->getHighestColumn();

                // Global Font
                $sheet->getParent()->getDefaultStyle()->getFont()->setName('Segoe UI');
                $sheet->getParent()->getDefaultStyle()->getFont()->setSize(10);

                // Header Row Styling (Row 1) - Theme Primary Blue
                $sheet->getRowDimension(1)->setRowHeight(28);
                $sheet->getStyle("A1:{$highestColumn}1")->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 10.5,
                        'color' => ['rgb' => 'FFFFFF'],
                    ],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => '1E3A8A'], // Theme Primary (Blue-900)
                    ],
                    'alignment' => [
                        'vertical' => Alignment::VERTICAL_CENTER,
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'wrapText' => true,
                    ],
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['rgb' => '172554'], // Blue-950
                        ],
                    ],
                ]);

                // Data Rows Styling
                if ($highestRow > 1) {
                    for ($row = 2; $row <= $highestRow; $row++) {
                        $sheet->getRowDimension($row)->setRowHeight(22);
                        $isEven = ($row % 2 === 0);

                        $sheet->getStyle("A{$row}:{$highestColumn}{$row}")->applyFromArray([
                            'alignment' => [
                                'vertical' => Alignment::VERTICAL_CENTER,
                            ],
                            'borders' => [
                                'allBorders' => [
                                    'borderStyle' => Border::BORDER_THIN,
                                    'color' => ['rgb' => 'E2E8F0'],
                                ],
                            ],
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => $isEven ? 'FFFFFF' : 'F8FAFC'],
                            ],
                        ]);
                    }

                    // Column Alignments
                    $sheet->getStyle("A2:A{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                    $sheet->getStyle("B2:D{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                    $sheet->getStyle("G2:G{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

                    // Bold Action Column
                    $sheet->getStyle("C2:C{$highestRow}")->getFont()->setBold(true);
                }

                // AutoFilter and Freeze Pane
                $sheet->setAutoFilter("A1:{$highestColumn}{$highestRow}");
                $sheet->freezePane('A2');
            },
        ];
    }
}
