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
    onClick?: () => void;
}

function KpiCard({ label, value, subtext, icon, accentClass, onClick }: KpiCardProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                'group border-border/60 bg-card/40 relative flex flex-col gap-4 overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/20',
                onClick && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]',
            )}
        >
            <div className="flex items-start justify-between">
                <div
                    className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 shadow-xs border border-border/10',
                        accentClass,
                    )}
                >
                    {icon}
                </div>
                <span className="text-muted-foreground text-[9px] font-bold tracking-wider uppercase">{subtext}</span>
            </div>
            <div>
                <p className="text-muted-foreground mb-0.5 text-[10px] font-bold tracking-wider uppercase">{label}</p>
                <span className="text-foreground text-2xl font-extrabold tracking-tight tabular-nums">{value}</span>
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
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 select-none">
            <KpiCard
                label="Total Kontrak"
                value={m.totalContracts}
                subtext="Keseluruhan"
                icon={<FileText className="h-4.5 w-4.5" />}
                accentClass="bg-primary/10 text-primary dark:bg-slate-800 dark:text-slate-200"
                onClick={() => onNavigate('contracts')}
            />
            <KpiCard
                label="Menunggu Saya"
                value={m.pendingApprovals}
                subtext="Perlu Tindakan"
                icon={<Clock className="h-4.5 w-4.5" />}
                accentClass="bg-amber-500/10 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                onClick={() => onNavigate('pending')}
            />
            <KpiCard
                label="Disetujui Bulan Ini"
                value={m.approvedThisMonth}
                subtext="Output Bulanan"
                icon={<ShieldCheck className="h-4.5 w-4.5" />}
                accentClass="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
            />
            <KpiCard
                label="Butuh Perhatian"
                value={m.attentionCount}
                subtext="Revisi & Segera Berakhir"
                icon={<AlertTriangle className="h-4.5 w-4.5" />}
                accentClass={
                    m.attentionCount > 0
                        ? 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                        : 'bg-muted/60 text-muted-foreground dark:bg-slate-800'
                }
            />
        </div>
    );
}

