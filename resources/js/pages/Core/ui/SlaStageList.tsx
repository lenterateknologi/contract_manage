import { Button } from '@/components/ui/buttons/Button';
import { FormInput } from '@/components/ui/inputs/FormInput';
import LucideIcons from '@/lib/lucide-dynamic';
import { cn } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';
import React from 'react';
import { SlaStage } from '../utils/types';

interface SlaStageListProps {
    stages: SlaStage[];
    onChange: (stages: SlaStage[], totalHours: number) => void;
}

const CONTRACT_STATUSES = [
    { value: 'all', label: 'Semua Status (Global)' },
    { value: 'draft', label: 'Draft (Pengajuan Awal)' },
    { value: 'in_review', label: 'Dalam Review (Umum)' },
    { value: 'review_f1', label: 'Review F1 (Formulir 1)' },
    { value: 'review_f2', label: 'Review F2 (Formulir 2)' },
    { value: 'review_agreement', label: 'Review Agreement (Draft Perjanjian)' },
    { value: 'review_legal', label: 'Review Legal (Hukum & Kepatuhan)' },
    { value: 'review_finance', label: 'Review Keuangan & Pajak' },
    { value: 'review_compliance', label: 'Review Kepatuhan & Risiko' },
    { value: 'review_vendor', label: 'Review Mitra / Vendor' },
    { value: 'pending', label: 'Menunggu Persetujuan (Approval)' },
    { value: 'revision', label: 'Revisi Dokumen (Revision)' },
    { value: 'approved', label: 'Disetujui (Approved)' },
    { value: 'signed', label: 'Proses Tanda Tangan (Signing)' },
    { value: 'queue', label: 'Antrian Pemrosesan (Queue)' },
    { value: 'active', label: 'Kontrak Aktif (Active)' },
    { value: 'completed', label: 'Selesai (Completed)' },
    { value: 'closed', label: 'Ditutup (Closed)' },
    { value: 'rejected', label: 'Ditolak (Rejected)' },
    { value: 'cancelled', label: 'Dibatalkan (Cancelled)' },
    { value: 'expired', label: 'Kedaluwarsa (Expired)' },
];

export function SlaStageList({ stages: rawStages, onChange }: SlaStageListProps) {
    const stages: SlaStage[] =
        Array.isArray(rawStages) && rawStages.length > 0
            ? rawStages
            : [
                  { contract_status: 'draft', duration_hours: 24, is_active: true },
                  { contract_status: 'in_review', duration_hours: 48, is_active: true },
                  { contract_status: 'pending', duration_hours: 48, is_active: true },
              ];

    const calculateTotalHours = (newStages: SlaStage[]) => {
        return newStages.reduce(
            (sum, item) => sum + (item.is_active !== false ? Number(item.duration_hours) || 0 : 0),
            0,
        );
    };

    const handleStageChange = (idx: number, key: string, val: any) => {
        const newStages = [...stages];
        newStages[idx] = { ...newStages[idx], [key]: val };
        if (key === 'duration_days') {
            const days = parseFloat(val) || 0;
            newStages[idx].duration_hours = Math.round(days * 24);
        }
        const totalH = calculateTotalHours(newStages);
        onChange(newStages, totalH);
    };

    const handleAddStage = () => {
        const newStages: SlaStage[] = [
            ...stages,
            { contract_status: 'in_review', duration_hours: 24, duration_days: 1, is_active: true },
        ];
        const totalH = calculateTotalHours(newStages);
        onChange(newStages, totalH);
    };

    const handleRemoveStage = (idx: number) => {
        if (stages.length <= 1) return;
        const newStages = stages.filter((_, i) => i !== idx);
        const totalH = calculateTotalHours(newStages);
        onChange(newStages, totalH);
    };

    const activeStagesCount = stages.filter((st) => st.is_active !== false).length;
    const totalAccumulatedHours = calculateTotalHours(stages);
    const totalDaysFormatted = (totalAccumulatedHours / 24).toFixed(1).replace(/\.0$/, '');

    return (
        <div className="w-full space-y-2.5">
            {/* Action & Summary Header */}
            <div className="flex items-center justify-between gap-3 pb-1">
                <div className="flex items-center gap-2">
                    <span className="text-primary bg-primary/10 border-primary/20 rounded-full border px-2.5 py-0.5 text-[11px] font-bold">
                        {activeStagesCount}/{stages.length} Tahap Aktif
                    </span>
                    <span className="text-muted-foreground hidden text-xs sm:inline">
                        Total Target SLA: <strong className="text-foreground font-semibold">{totalDaysFormatted} Hari</strong>
                    </span>
                </div>
                <div className="flex items-center gap-2.5">
                    <span className="text-muted-foreground text-xs font-semibold sm:hidden">{totalDaysFormatted} Hari</span>
                    <Button
                        type="button"
                        variant="white"
                        className="border-primary/30 text-primary hover:bg-primary/10 h-8 cursor-pointer gap-1 rounded-lg text-xs font-bold shadow-none"
                        onClick={handleAddStage}
                    >
                        <Plus className="h-3.5 w-3.5" /> Tambah Status
                    </Button>
                </div>
            </div>

            {/* Column Header for Desktop */}
            <div className="border-border/60 text-muted-foreground hidden gap-3 border-b px-1 pb-1.5 text-[10px] font-bold tracking-wider uppercase md:grid md:grid-cols-12">
                <div className="col-span-7">Status Kontrak</div>
                <div className="col-span-3">Target Durasi</div>
                <div className="col-span-2 pr-1 text-right">Status & Aksi</div>
            </div>

            {/* Item List Rows */}
            <div className="divide-border/40 border-border/40 divide-y border-b">
                {stages.map((st, idx) => {
                    const rawH = Number(st.duration_hours) || 0;
                    const dVal = (st as any).duration_days ?? (rawH > 0 ? (rawH / 24).toFixed(1).replace(/\.0$/, '') : '');
                    const isStageActive = st.is_active !== false;

                    const currentContractStatus =
                        st.contract_status ||
                        ([
                            'draft',
                            'in_review',
                            'review_f1',
                            'review_f2',
                            'review_agreement',
                            'review_legal',
                            'review_finance',
                            'review_compliance',
                            'review_vendor',
                            'pending',
                            'revision',
                            'approved',
                            'signed',
                            'queue',
                            'active',
                            'completed',
                            'closed',
                            'rejected',
                            'cancelled',
                            'expired',
                            'all',
                        ].includes(st.status || '')
                            ? st.status
                            : 'draft');

                    return (
                        <div
                            key={idx}
                            className={cn(
                                'grid grid-cols-1 items-center gap-3 px-1 py-2 transition-colors md:grid-cols-12',
                                isStageActive ? 'hover:bg-surface-muted/30' : 'opacity-60 hover:opacity-80',
                            )}
                        >
                            {/* 1. Status Kontrak */}
                            <div className="md:col-span-7">
                                <span className="text-muted-foreground mb-1 block text-[10px] font-bold uppercase md:hidden">
                                    #{idx + 1} Status Kontrak
                                </span>
                                <div className="relative flex items-center">
                                    <span className="text-muted-foreground mr-1.5 hidden w-4 shrink-0 text-right font-mono text-[10px] font-bold md:inline-flex">
                                        {idx + 1}.
                                    </span>
                                    <div className="relative w-full">
                                        <div className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 flex -translate-y-1/2 items-center">
                                            <LucideIcons.FileText className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-zinc-400" />
                                        </div>
                                        <select
                                            value={currentContractStatus}
                                            onChange={(e) => handleStageChange(idx, 'contract_status', e.target.value)}
                                            className="border-border/80 bg-background text-foreground focus:ring-primary h-8.5 w-full cursor-pointer rounded-md border pr-3 pl-8 text-xs font-semibold focus:ring-1 focus:outline-none"
                                        >
                                            {CONTRACT_STATUSES.map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Duration Days Input */}
                            <div className="md:col-span-3">
                                <span className="text-muted-foreground mb-1 block text-[10px] font-bold uppercase md:hidden">
                                    Target Durasi (Hari)
                                </span>
                                <FormInput
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    placeholder="0"
                                    value={dVal}
                                    onChange={(e) => {
                                        const days = parseFloat(e.target.value);
                                        handleStageChange(idx, 'duration_days', isNaN(days) ? '' : days);
                                    }}
                                    rightAction={<span className="text-muted-foreground pr-2 text-[11px] font-medium">Hari</span>}
                                />
                            </div>

                            {/* 3. Status Toggle & Delete Action */}
                            <div className="flex items-center justify-end gap-1.5 pt-1 md:col-span-2 md:pt-0">
                                <button
                                    type="button"
                                    onClick={() => handleStageChange(idx, 'is_active', !isStageActive)}
                                    className={cn(
                                        'flex h-8 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold transition-all select-none',
                                        isStageActive
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400'
                                            : 'bg-surface-muted border-border text-muted-foreground hover:bg-surface-border',
                                    )}
                                    title={isStageActive ? 'Tahap Aktif (Dihitung)' : 'Tahap Nonaktif'}
                                >
                                    <span
                                        className={cn(
                                            'h-1.5 w-1.5 rounded-full',
                                            isStageActive ? 'bg-emerald-500' : 'bg-muted-foreground/50',
                                        )}
                                    />
                                    <span>{isStageActive ? 'Aktif' : 'Off'}</span>
                                </button>

                                <button
                                    type="button"
                                    disabled={stages.length <= 1}
                                    onClick={() => handleRemoveStage(idx)}
                                    className={cn(
                                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-all',
                                        stages.length <= 1
                                            ? 'border-border text-muted-foreground cursor-not-allowed opacity-25'
                                            : 'border-border text-muted-foreground cursor-pointer hover:border-rose-300 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30',
                                    )}
                                    title={stages.length <= 1 ? 'Minimal 1 status SLA' : 'Hapus status ini'}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Summary Footer */}
            <div className="text-muted-foreground flex flex-col items-start justify-between gap-1 px-1 pt-1 text-[11px] sm:flex-row sm:items-center">
                <span>* Klik &ldquo;Tambah Status&rdquo; untuk menambah tahapan alur kontrak.</span>
                <span className="text-foreground font-semibold">
                    Total Target SLA: <span className="text-primary font-bold">{totalDaysFormatted} Hari</span>
                </span>
            </div>
        </div>
    );
}
export default SlaStageList;
