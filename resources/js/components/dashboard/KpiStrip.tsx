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
                'group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-sidebar-border/60 bg-white p-5 shadow-sm transition-all duration-300',
                onClick && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5',
            )}
        >
            <div className="flex items-start justify-between">
                <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110', accentClass)}>
                    {icon}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/30">{subtext}</span>
            </div>
            <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50 mb-1">{label}</p>
                <span className="text-3xl font-bold tracking-tight text-sidebar-foreground">{value}</span>
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
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard
                label="Total Kontrak"
                value={m.totalContracts}
                subtext="Keseluruhan"
                icon={<FileText className="h-5 w-5" />}
                accentClass="bg-sidebar-accent text-sidebar-primary"
                onClick={() => onNavigate('contracts')}
            />
            <KpiCard
                label="Menunggu Saya"
                value={m.pendingApprovals}
                subtext="Perlu Tindakan"
                icon={<Clock className="h-5 w-5" />}
                accentClass="bg-amber-50 text-amber-600"
                onClick={() => onNavigate('pending')}
            />
            <KpiCard
                label="Disetujui Bulan Ini"
                value={m.approvedThisMonth}
                subtext="Output Bulanan"
                icon={<ShieldCheck className="h-5 w-5" />}
                accentClass="bg-emerald-50 text-emerald-600"
            />
            <KpiCard
                label="Butuh Perhatian"
                value={m.attentionCount}
                subtext="Revisi + Segera Berakhir"
                icon={<AlertTriangle className="h-5 w-5" />}
                accentClass={m.attentionCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}
            />
        </div>
    );
}
