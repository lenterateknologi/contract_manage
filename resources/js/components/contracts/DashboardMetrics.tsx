import React from 'react';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface MetricCardProps {
    title: string;
    value: string;
    icon: string;
    color: 'blue' | 'green' | 'amber' | 'purple';
}

function MetricCard({ title, value, icon, color }: MetricCardProps) {
    const bgMap = {
        blue: 'bg-blue-500/10 text-blue-600 border-blue-200/50',
        green: 'bg-green-500/10 text-green-600 border-green-200/50',
        amber: 'bg-amber-500/10 text-amber-600 border-amber-200/50',
        purple: 'bg-purple-500/10 text-purple-600 border-purple-200/50',
    };
    
    return (
        <div className="bg-card border-border hover:bg-muted/5 group relative overflow-hidden rounded-xl border p-5 transition-colors">
            <div className="relative z-10 flex items-start justify-between">
                <div className="space-y-1">
                    <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">{title}</p>
                    <p className="text-2xl leading-tight font-bold text-foreground">{value}</p>
                </div>
                <div className={cn('border-border/10 flex h-10 w-10 items-center justify-center rounded-lg border', bgMap[color])}>
                    <i className={cn('fa-solid', icon)} style={{ fontSize: 16 }} />
                </div>
            </div>
        </div>
    );
}

export function DashboardMetrics({ metrics }: { metrics: any }) {
    if (!metrics) return null;
    const { metrics: m, monthlyTrend } = metrics;

    const allCounts = Array.isArray(monthlyTrend) ? monthlyTrend.flatMap((mo: any) => mo.types?.map((ti: any) => ti.count) || []) : [0];
    const rawMax = Math.max(...allCounts, 5);
    const yMax = Math.ceil(rawMax / 5) * 5 || 5;
    const steps = 5;
    const yLabels = Array.from({ length: steps + 1 }, (_, i) => Math.round(yMax - i * (yMax / steps)));

    const metricsData = m || {
        avgCycleTime: 0,
        totalContracts: 0,
        pendingApprovals: 0,
        approvedThisMonth: 0,
    };

    const CHART_COLORS = [
        { bg: 'bg-sky-400', stroke: 'stroke-sky-400' },
        { bg: 'bg-emerald-400', stroke: 'stroke-emerald-400' },
        { bg: 'bg-amber-400', stroke: 'stroke-amber-400' },
        { bg: 'bg-rose-400', stroke: 'stroke-rose-400' },
        { bg: 'bg-indigo-400', stroke: 'stroke-indigo-400' },
    ];

    return (
        <div className="animate-in fade-in slide-in-from-top-4 mb-8 space-y-6 duration-700">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard title="Rata-rata SLA" value={`${metricsData.avgCycleTime} Hari`} icon="fa-clock" color="blue" />
                <MetricCard title="Total Kontrak" value={String(metricsData.totalContracts)} icon="fa-file-signature" color="green" />
                <MetricCard title="Approval Pending" value={String(metricsData.pendingApprovals)} icon="fa-triangle-exclamation" color="amber" />
                <MetricCard title="Approved (Bulan Ini)" value={String(metricsData.approvedThisMonth)} icon="fa-calendar-check" color="purple" />
            </div>

            <div className="bg-card border-border flex flex-col overflow-hidden rounded-xl border">
                <div className="border-border bg-muted/20 flex items-center justify-between border-b px-5 py-4 font-semibold">
                    <div className="flex items-center gap-2">
                        <i className="fa-solid fa-chart-line text-muted-foreground mr-1" />
                        <span style={{ fontSize: 13 }}>Tren Pertumbuhan Kontrak</span>
                    </div>
                </div>
                <div className="flex min-h-[380px] flex-col justify-end p-6">
                    <div className="relative flex h-[220px] items-end gap-2">
                        <div className="text-muted-foreground/60 border-border/50 flex h-full min-w-[24px] flex-col justify-between border-r pr-2 pb-6 text-[10px] font-bold select-none">
                            {yLabels.map((v) => (
                                <span key={v} className="flex h-0 items-center justify-end">{v}</span>
                            ))}
                        </div>
                        <div className="relative flex h-full flex-1 items-end justify-around px-8 pb-6">
                            <div className="pointer-events-none absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between">
                                {yLabels.map((_, i) => (
                                    <div key={i} className="border-muted-foreground/5 last:border-muted-foreground/10 w-full border-t" />
                                ))}
                            </div>
                            {Array.isArray(monthlyTrend) &&
                                monthlyTrend.map((mo: any) => (
                                    <div key={mo.month} className="group relative z-10 mx-2 flex h-full flex-1 flex-col items-center justify-end gap-4">
                                        <div className="relative flex h-full w-full items-end justify-center gap-1.5">
                                            {mo.types.map((t: any, idx: number) => {
                                                const typePct = (t.count / yMax) * 100;
                                                return (
                                                    <div
                                                        key={t.name}
                                                        className={cn('w-full max-w-[14px] min-w-[8px] cursor-help rounded-t-sm transition-all duration-300 hover:opacity-80', CHART_COLORS[idx % CHART_COLORS.length].bg)}
                                                        style={{ height: `${typePct}%`, minHeight: t.count > 0 ? 4 : 0 }}
                                                        title={`${t.name}: ${t.count}`}
                                                    />
                                                );
                                            })}
                                            <div className="bg-popover text-popover-foreground border-border pointer-events-none absolute -top-12 left-1/2 z-20 -translate-x-1/2 scale-95 rounded-lg border px-3 py-1.5 text-[10px] font-black whitespace-nowrap opacity-0 shadow-xl transition-all group-hover:scale-100 group-hover:opacity-100">
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="text-muted-foreground text-[9px] font-bold tracking-widest uppercase">{mo.month}</div>
                                                    <div className="text-foreground">{mo.total} Kontrak Total</div>
                                                </div>
                                                <div className="border-t-border absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent" />
                                            </div>
                                        </div>
                                        <div className="absolute -bottom-7 flex flex-col items-center">
                                            <span className="group-hover:text-primary text-muted-foreground text-[10px] font-black tracking-tighter whitespace-nowrap uppercase transition-colors">{mo.month}</span>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                    <div className="mt-8 flex flex-wrap justify-center gap-4 px-4">
                        {Array.from(new Set(monthlyTrend?.flatMap((m: any) => m.types.map((t: any) => t.name)) || [])).map((name: any, idx) => (
                            <div key={name} className="flex items-center gap-2">
                                <div className={cn('h-2 w-2 rounded-full', CHART_COLORS[idx % CHART_COLORS.length].bg)} />
                                <span className="text-muted-foreground text-[10px] font-bold uppercase">{name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
