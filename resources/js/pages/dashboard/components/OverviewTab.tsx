import { Activity, Clock, FileText, ShieldCheck } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { MetricItem } from './MetricItem';

interface OverviewTabProps {
    data: any;
    onNavigate: (view: string, params?: any) => void;
}

export function OverviewTab({ data, onNavigate }: OverviewTabProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const m = data?.summary || {
        total: 0,
        in_process: 0,
        completed: 0,
        rejected: 0,
        approved: 0,
    };

    const overviewDailyTrend = data?.overviewDailyTrend || [];

    const categoriesList = ['Total Pengajuan', 'Sedang Diproses', 'Diselesaikan', 'Ditolak', 'Approved'];
    const CHART_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#06b6d4'];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-700">
            {/* 5 KPI Metric Rows representing Today's Actions */}
            <div className="grid grid-cols-1 gap-6 select-none md:grid-cols-2 lg:grid-cols-5">
                <MetricItem 
                    label="Pengajuan Per Hari" 
                    value={m.total} 
                    icon={FileText} 
                    color="text-primary" 
                    onClick={() => onNavigate('contracts')} 
                />
                <MetricItem
                    label="Sedang Diproses"
                    value={m.in_process}
                    icon={Clock}
                    color="text-amber-500"
                    onClick={() => onNavigate('pending')}
                />
                <MetricItem
                    label="Diselesaikan Hari Ini"
                    value={m.completed}
                    icon={ShieldCheck}
                    color="text-emerald-500"
                    onClick={() => onNavigate('contracts', { status: 'approved' })}
                />
                <MetricItem
                    label="Ditolak Hari Ini"
                    value={m.rejected}
                    icon={Activity}
                    color="text-rose-500"
                    onClick={() => onNavigate('contracts', { status: 'rejected' })}
                />
                <MetricItem
                    label="Approved Hari Ini"
                    value={m.approved}
                    icon={ShieldCheck}
                    color="text-cyan-500"
                    onClick={() => onNavigate('contracts', { status: 'approved' })}
                />
            </div>

            {/* Daily Trend Line Chart without Card Wrapper */}
            <div className="space-y-4 pt-2">
                <div className="border-b border-surface-border/40 pb-3">
                    <h3 className="text-sm font-bold text-text-main">Tren Pembuatan Kontrak Harian</h3>
                    <p className="text-[10px] text-text-soft">Perkembangan total volume pembuatan kontrak baru per kategori status utama bulan ini</p>
                </div>
                <div className="h-[350px] w-full pt-2">
                    {!isMounted || overviewDailyTrend.length === 0 ? (
                        <div className="text-center py-20 text-xs text-muted-foreground uppercase animate-in fade-in duration-300">Tidak ada data tren harian</div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={overviewDailyTrend} margin={{ top: 15, right: 15, left: -25, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis 
                                    dataKey="date" 
                                    stroke="#888888" 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false} 
                                />
                                <YAxis 
                                    stroke="#888888" 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    allowDecimals={false}
                                />
                                <RechartsTooltip
                                    content={({ active, payload, label }: any) => {
                                        if (active && payload && payload.length) {
                                            const item = payload[0].payload;
                                            return (
                                                <div className="rounded-xl border border-surface-border bg-white dark:bg-zinc-950 p-2.5 shadow-md text-xs space-y-1.5 min-w-[170px]">
                                                    <p className="font-bold text-text-main">{item.full_date}</p>
                                                    <div className="space-y-1 border-t border-surface-border/40 pt-1.5">
                                                        {payload.map((p: any, idx: number) => {
                                                            return (
                                                                <div key={idx} className="flex justify-between items-center gap-4">
                                                                    <span className="text-text-soft flex items-center gap-1.5">
                                                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                                                        {p.name}
                                                                    </span>
                                                                    <span className="font-bold text-text-main">{p.value} Kontrak</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Legend 
                                    verticalAlign="top" 
                                    height={36} 
                                    iconType="circle"
                                    iconSize={8}
                                    formatter={(value) => <span className="text-[9px] text-text-soft font-bold uppercase tracking-wider">{value}</span>}
                                />
                                {categoriesList.map((category: string, idx: number) => (
                                    <Line 
                                        key={category}
                                        type="linear" 
                                        dataKey={category} 
                                        name={category}
                                        stroke={CHART_COLORS[idx % CHART_COLORS.length]} 
                                        strokeWidth={2}
                                        dot={{ r: 2, stroke: CHART_COLORS[idx % CHART_COLORS.length], strokeWidth: 1, fill: '#fff' }}
                                        activeDot={{ r: 4 }}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
}
