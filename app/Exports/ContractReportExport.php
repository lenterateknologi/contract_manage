<?php

namespace App\Exports;

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

class ContractReportExport implements FromCollection, ShouldAutoSize, WithEvents, WithHeadings, WithMapping, WithTitle
{
    protected $contracts;

    protected $latestHistories;

    private int $rowNumber = 1;

    public function __construct(Collection $contracts, $latestHistories = null)
    {
        $this->contracts = $contracts;
        $this->latestHistories = $latestHistories ?? collect();
    }

    public function collection()
    {
        return $this->contracts;
    }

    public function title(): string
    {
        return 'Rekapitulasi Kontrak';
    }

    public function headings(): array
    {
        return [
            'No',
            'No. Form / Kontrak',
            'Judul Pengajuan / Kontrak',
            'Tipe Kontrak',
            'Tipe Pengajuan',
            'Alur Kerja (Workflow)',
            'Tahap Saat Ini',
            'Aktor / Approver Tahap Ini',
            'Aksi Terakhir',
            'Dilakukan Oleh',
            'Waktu Aksi Terakhir',
            'Status',
            'Pembuat (Pengaju)',
            'Tanggal Dibuat',
            'Versi',
            'Deskripsi',
        ];
    }

    public function map($contract): array
    {
        $pendingApprovals = $contract->approvals ? $contract->approvals->where('status', 'pending') : collect();
        $pendingApproval = $pendingApprovals->first();
        $currentStep = $contract->workflowStep?->label
            ?? $pendingApproval?->role
            ?? ($contract->current_step_number ? "Tahap {$contract->current_step_number}" : '—');

        $actors = [];
        if ($pendingApprovals->isNotEmpty()) {
            $actors = $pendingApprovals->map(function ($a) {
                return $a->approver?->name ?: ($a->approver_name ?: $a->role);
            })->filter()->unique()->values()->all();
        }

        if (empty($actors)) {
            if (in_array(strtolower((string) $contract->status), ['draft', 'revision'])) {
                $actors = array_filter([$contract->creator?->name]);
            } elseif ($contract->assignedPic) {
                $actors = [$contract->assignedPic->name];
            } elseif ($contract->workflowStep?->approver_type === 'assigned_pic' && $contract->assignedPic) {
                $actors = [$contract->assignedPic->name];
            } elseif ($contract->workflowStep?->approver_type === 'creator' || $contract->workflowStep?->approver_type === 'initiator') {
                $actors = array_filter([$contract->creator?->name]);
            }
        }

        $currentActorDisplay = ! empty($actors) ? implode(', ', $actors) : '—';

        $lastHistory = $this->latestHistories->get($contract->id);
        $lastActionBy = $lastHistory?->actor?->name ?? $contract->creator?->name ?? '—';
        $lastAction = $lastHistory?->action ?? 'CREATE';
        $lastActionAt = $lastHistory?->created_at ? $lastHistory->created_at->format('Y-m-d H:i') : ($contract->updated_at ? $contract->updated_at->format('Y-m-d H:i') : '—');

        return [
            $this->rowNumber++,
            $contract->form_no ?: ($contract->contract_no ?: '—'),
            $contract->title ?? '—',
            $contract->contractType?->name ?? '—',
            $contract->submissionType?->name ?? '—',
            $contract->workflow?->name ?? '—',
            $currentStep,
            $currentActorDisplay,
            strtoupper((string) $lastAction),
            $lastActionBy,
            $lastActionAt,
            strtoupper((string) $contract->status),
            $contract->creator?->name ?? '—',
            $contract->created_at ? $contract->created_at->format('Y-m-d H:i') : '—',
            $contract->current_version ?: '1.0',
            $contract->description ?? '—',
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $highestRow = max($sheet->getHighestRow(), 1);
                $highestColumn = $sheet->getHighestColumn();
                $fullRange = "A1:{$highestColumn}{$highestRow}";

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
                    $sheet->getStyle("B2:B{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                    $sheet->getStyle("G2:G{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                    $sheet->getStyle("I2:I{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                    $sheet->getStyle("K2:L{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                    $sheet->getStyle("N2:O{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

                    // Bold Status
                    $sheet->getStyle("L2:L{$highestRow}")->getFont()->setBold(true);
                }

                // AutoFilter and Freeze Pane
                $sheet->setAutoFilter("A1:{$highestColumn}{$highestRow}");
                $sheet->freezePane('A2');
            },
        ];
    }
}
