<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ContractReportExport implements FromCollection, ShouldAutoSize, WithHeadings, WithMapping, WithStyles
{
    protected $contracts;
    protected $latestHistories;

    public function __construct(Collection $contracts, $latestHistories = null)
    {
        $this->contracts = $contracts;
        $this->latestHistories = $latestHistories ?? collect();
    }

    public function collection()
    {
        return $this->contracts;
    }

    public function headings(): array
    {
        return [
            'ID',
            'No. Form / Kontrak',
            'Judul',
            'Tipe',
            'Perjanjian',
            'Alur Kerja (Workflow)',
            'Tahap Saat Ini (Current Step)',
            'Aktor / Approver Tahap Ini',
            'Aksi Terakhir',
            'Dilakukan Oleh (Last Action By)',
            'Waktu Aksi Terakhir',
            'Status',
            'Pembuat',
            'Tgl Dibuat',
            'Versi Terakhir',
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
            $contract->id,
            $contract->form_no ?: ($contract->contract_no ?: '—'),
            $contract->title,
            $contract->contractType->name ?? '—',
            $contract->submissionType->name ?? '—',
            $contract->workflow->name ?? '—',
            $currentStep,
            $currentActorDisplay,
            $lastAction,
            $lastActionBy,
            $lastActionAt,
            strtoupper($contract->status),
            $contract->creator->name ?? '—',
            $contract->created_at ? $contract->created_at->format('Y-m-d H:i') : '—',
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
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['argb' => 'FF4F46E5'], // Indigo color
                ],
            ],
        ];
    }
}
