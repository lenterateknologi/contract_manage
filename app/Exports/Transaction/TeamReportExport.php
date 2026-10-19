<?php

namespace App\Exports\Transaction;

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

class TeamReportExport implements FromCollection, ShouldAutoSize, WithEvents, WithHeadings, WithMapping, WithTitle
{
    protected int $year;

    protected string $roleType;

    protected string $orgGroupName;

    protected array $matrix;

    protected array $monthlyTotals;

    protected int $totalSubmissions;

    protected array $periods;

    protected ?string $dateFrom;

    protected ?string $dateTo;

    private int $rowNumber = 1;

    public function __construct(
        int $year,
        string $roleType,
        string $orgGroupName,
        array $matrix,
        array $monthlyTotals,
        int $totalSubmissions,
        array $periods = [],
        ?string $dateFrom = null,
        ?string $dateTo = null
    ) {
        $this->year = $year;
        $this->roleType = $roleType;
        $this->orgGroupName = $orgGroupName;
        $this->matrix = $matrix;
        $this->monthlyTotals = $monthlyTotals;
        $this->totalSubmissions = $totalSubmissions;
        $this->periods = $periods;
        $this->dateFrom = $dateFrom;
        $this->dateTo = $dateTo;
    }

    public function collection(): Collection
    {
        return collect($this->matrix);
    }

    public function title(): string
    {
        $roleLabel = $this->roleType === 'pic' ? 'PIC' : 'Pengaju';
        if ($this->dateFrom && $this->dateTo) {
            return "Tim ({$roleLabel}) {$this->dateFrom} - {$this->dateTo}";
        }

        return "Tim ({$roleLabel}) {$this->year}";
    }

    public function headings(): array
    {
        $headers = [
            'No',
            'Nama Anggota Tim',
            'Departemen',
            'Organization Group',
            'NIK / Email',
        ];

        if (! empty($this->periods)) {
            foreach ($this->periods as $p) {
                $headers[] = $p['short'];
            }
        } else {
            $monthShorts = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
            foreach ($monthShorts as $m) {
                $headers[] = $m;
            }
        }

        $headers[] = 'Total';

        return $headers;
    }

    public function map($item): array
    {
        $userName = $item['user_name'] ?? '-';
        $departmentName = $item['department_name'] ?? '-';
        $orgGroupName = $item['org_group_name'] ?? $this->orgGroupName;
        $identifier = $item['user_nik'] ?: ($item['user_email'] ?: '-');
        $total = $item['total'] ?? 0;

        $row = [
            $this->rowNumber++,
            $userName,
            $departmentName,
            $orgGroupName,
            $identifier,
        ];

        if (! empty($this->periods)) {
            foreach ($this->periods as $p) {
                $row[] = (int) ($item['months'][$p['key']] ?? 0);
            }
        } else {
            for ($m = 1; $m <= 12; $m++) {
                $row[] = (int) ($item['months'][$m] ?? 0);
            }
        }

        $row[] = (int) $total;

        return $row;
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $dataRowCount = count($this->matrix);
                $totalRowIndex = $dataRowCount + 2;

                // Append Total Row
                $totalRowData = ['', 'TOTAL KESELURUHAN', '', '', ''];
                if (! empty($this->periods)) {
                    foreach ($this->periods as $p) {
                        $totalRowData[] = (int) ($this->monthlyTotals[$p['key']] ?? 0);
                    }
                } else {
                    for ($m = 1; $m <= 12; $m++) {
                        $totalRowData[] = (int) ($this->monthlyTotals[$m] ?? 0);
                    }
                }
                $totalRowData[] = (int) $this->totalSubmissions;

                $sheet->fromArray([$totalRowData], null, "A{$totalRowIndex}");

                $highestRow = $totalRowIndex;
                $colCount = count($this->headings());
                $highestColumn = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colCount);

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
                if ($dataRowCount > 0) {
                    for ($row = 2; $row <= $dataRowCount + 1; $row++) {
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
                    $sheet->getStyle('A2:A'.($dataRowCount + 1))->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                    $sheet->getStyle('E2:E'.($dataRowCount + 1))->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                    $sheet->getStyle("F2:{$highestColumn}".($dataRowCount + 1))->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

                    // Bold Totals
                    $sheet->getStyle("{$highestColumn}2:{$highestColumn}".($dataRowCount + 1))->getFont()->setBold(true);
                }

                // Total Row Styling - Primary Muted Tint
                $sheet->getRowDimension($totalRowIndex)->setRowHeight(26);
                $sheet->getStyle("A{$totalRowIndex}:{$highestColumn}{$totalRowIndex}")->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 10.5,
                        'color' => ['rgb' => '1E3A8A'], // Primary Blue
                    ],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => 'DBEAFE'], // Primary Muted (Blue-100)
                    ],
                    'alignment' => [
                        'vertical' => Alignment::VERTICAL_CENTER,
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                    ],
                    'borders' => [
                        'top' => [
                            'borderStyle' => Border::BORDER_MEDIUM,
                            'color' => ['rgb' => '93C5FD'],
                        ],
                        'bottom' => [
                            'borderStyle' => Border::BORDER_DOUBLE,
                            'color' => ['rgb' => '1E40AF'],
                        ],
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['rgb' => 'BFDBFE'],
                        ],
                    ],
                ]);
                $sheet->getStyle("B{$totalRowIndex}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

                // AutoFilter and Freeze Pane
                $sheet->setAutoFilter("A1:{$highestColumn}".($dataRowCount + 1));
                $sheet->freezePane('A2');
            },
        ];
    }
}
