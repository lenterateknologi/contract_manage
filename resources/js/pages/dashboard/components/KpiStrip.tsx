import { ChipIcon } from '@/components/ui/feedback/ChipIcon';
import { cn } from '@/lib/utils';
import { AlertTriangle, Clock, FileText, ShieldCheck } from 'lucide-react';
import React from 'react';
import { DashboardMetrics } from './types';

interface KpiCardProps {
    label: string;
    value: number | string;
    subtext: string;
    icon: any;
    accentClass: string;
    bgClass: string;
    onClick?: () => void;
}

function KpiCard({ label, value, subtext, icon, accentClass, bgClass, onClick }: KpiCardProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                'group bg-white dark:bg-surface-base border border-surface-border/60 relative flex flex-col gap-4 overflow-hidden rounded-lg p-5 transition-all duration-300',
                onClick && 'cursor-pointer hover:bg-muted/10',
            )}
        >
            <div className="flex items-start justify-between">
                <ChipIcon
                    icon={icon}
                    size="md"
                    bg={accentClass}
                    shape="rounded"
                    className="shadow-none group-hover:scale-105"
                />
                <span className="text-text-desc text-[9px] font-medium  uppercase">{subtext}</span>
            </div>
            <div>
                <p className="text-text-desc mb-0.5 text-[10px] font-medium  uppercase">{label}</p>
                <span className="text-text-main text-2xl font-extrabold tracking-tight tabular-nums">{value}</span>
            </div>
        </div>
    );
}

interface KpiStripProps {
    metrics: DashboardMetrics;
    onNavigate: (view: string) => void;
}

export function KpiStrip({ metrics: m, onNavigate }: KpiStripProps) {
    return (
        <div className="grid grid-cols-2 gap-4 select-none lg:grid-cols-4">
            <KpiCard
                label="Total Kontrak"
                value={m.totalContracts}
                subtext="Keseluruhan"
                icon={FileText}
                accentClass="bg-primary text-white border-transparent"
                bgClass="bg-primary/5 dark:bg-primary/10"
                onClick={() => onNavigate('contracts')}
            />
            <KpiCard
                label="Menunggu Saya"
                value={m.pendingApprovals}
                subtext="Perlu Tindakan"
                icon={Clock}
                accentClass="bg-amber-600 text-white border-transparent"
                bgClass="bg-warning/5 dark:bg-warning/10"
                onClick={() => onNavigate('pending')}
            />
            <KpiCard
                label="Disetujui Bulan Ini"
                value={m.approvedThisMonth}
                subtext="Output Bulanan"
                icon={ShieldCheck}
                accentClass="bg-emerald-600 text-white border-transparent"
                bgClass="bg-success/5 dark:bg-success/10"
            />
            <KpiCard
                label="Butuh Perhatian"
                value={m.attentionCount}
                subtext="Revisi & Segera Berakhir"
                icon={AlertTriangle}
                accentClass={m.attentionCount > 0 ? 'bg-rose-600 text-white border-transparent' : 'bg-slate-600 text-white border-transparent'}
                bgClass={m.attentionCount > 0 ? 'bg-danger/5 dark:bg-danger/10' : 'bg-surface-muted/20'}
            />
        </div>
    );
}
