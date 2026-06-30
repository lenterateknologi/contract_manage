import { cn } from '@/lib/utils';
import { AlertTriangle, Clock, FileText, ShieldCheck } from 'lucide-react';
import React from 'react';
import { DashboardMetrics } from './types';

interface KpiCardProps {
    label: string;
    value: number | string;
    subtext: string;
    icon: React.ReactNode;
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
                <div
                    className={cn(
                        'border-surface-border/10 flex h-10 w-10 items-center justify-center rounded-lg border shadow-xs transition-transform duration-300 group-hover:scale-105',
                        accentClass,
                    )}
                >
                    {icon}
                </div>
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
                icon={<FileText className="h-4.5 w-4.5" />}
                accentClass="bg-primary/10 text-primary"
                bgClass="bg-primary/5 dark:bg-primary/10"
                onClick={() => onNavigate('contracts')}
            />
            <KpiCard
                label="Menunggu Saya"
                value={m.pendingApprovals}
                subtext="Perlu Tindakan"
                icon={<Clock className="h-4.5 w-4.5" />}
                accentClass="bg-warning/10 text-warning"
                bgClass="bg-warning/5 dark:bg-warning/10"
                onClick={() => onNavigate('pending')}
            />
            <KpiCard
                label="Disetujui Bulan Ini"
                value={m.approvedThisMonth}
                subtext="Output Bulanan"
                icon={<ShieldCheck className="h-4.5 w-4.5" />}
                accentClass="bg-success/10 text-success"
                bgClass="bg-success/5 dark:bg-success/10"
            />
            <KpiCard
                label="Butuh Perhatian"
                value={m.attentionCount}
                subtext="Revisi & Segera Berakhir"
                icon={<AlertTriangle className="h-4.5 w-4.5" />}
                accentClass={m.attentionCount > 0 ? 'bg-danger/10 text-danger' : 'bg-surface-muted/60 text-text-desc'}
                bgClass={m.attentionCount > 0 ? 'bg-danger/5 dark:bg-danger/10' : 'bg-surface-muted/20'}
            />
        </div>
    );
}
