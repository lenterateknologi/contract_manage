import { Activity, Calendar, Clock, FileText, RotateCcw, ShieldCheck } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { MetricItem } from './MetricItem';

interface OverviewTabProps {
    data: any;
    onNavigate: (view: string, params?: any) => void;
}

export function OverviewTab({ data, onNavigate }: OverviewTabProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [datePreset, setDatePreset] = useState<'7d' | '14d' | 'this_month' | 'last_month' | 'custom'>('7d');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

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

    const filteredDailyTrend = useMemo(() => {
        if (!overviewDailyTrend || overviewDailyTrend.length === 0) return [];

        if (datePreset === '7d') {
            return overviewDailyTrend.slice(-7);
        }
        if (datePreset === '14d') {
            return overviewDailyTrend.slice(-14);
        }
        if (datePreset === 'this_month') {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const thisMonthKey = `${year}-${month}`;
            return overviewDailyTrend.filter((item: any) => item.month_key === thisMonthKey || (item.raw_date && item.raw_date.startsWith(thisMonthKey)));
        }
        if (datePreset === 'last_month') {
            const now = new Date();
            now.setMonth(now.getMonth() - 1);
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const lastMonthKey = `${year}-${month}`;
            return overviewDailyTrend.filter((item: any) => item.month_key === lastMonthKey || (item.raw_date && item.raw_date.startsWith(lastMonthKey)));
        }
        if (datePreset === 'custom') {
            if (!startDate && !endDate) return overviewDailyTrend;
            return overviewDailyTrend.filter((item: any) => {
                const rawDate = item.raw_date;
                if (!rawDate) return true;
                if (startDate && endDate) {
                    return rawDate >= startDate && rawDate <= endDate;
                }
                if (startDate) {
                    return rawDate >= startDate;
                }
                if (endDate) {
                    return rawDate <= endDate;
                }
                return true;
            });
        }
        return overviewDailyTrend;
    }, [overviewDailyTrend, datePreset, startDate, endDate]);

    // Dynamically calculate summary KPI metrics from the selected date range
    const summaryMetrics = useMemo(() => {
        if (!filteredDailyTrend || filteredDailyTrend.length === 0) {
            return { total: 0, in_process: 0, completed: 0, rejected: 0, approved: 0 };
        }
        return filteredDailyTrend.reduce(
            (acc: any, item: any) => ({
                total: acc.total + (item['Total Pengajuan'] || 0),
                in_process: Math.max(acc.in_process, item['Sedang Diproses'] || 0),
                completed: acc.completed + (item['Diselesaikan'] || 0),
                rejected: acc.rejected + (item['Ditolak'] || 0),
                approved: acc.approved + (item['Approved'] || 0),
            }),
            { total: 0, in_process: 0, completed: 0, rejected: 0, approved: 0 }
        );
    }, [filteredDailyTrend]);

    const categoriesList = ['Total Pengajuan', 'Sedang Diproses', 'Diselesaikan', 'Ditolak', 'Approved'];
    const CHART_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#06b6d4'];

    const handleResetDateFilter = () => {
        setDatePreset('7d');
        setStartDate('');
        setEndDate('');
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-700">
            {/* 5 KPI Metric Rows representing Selected Date Range Actions */}
            <div className="grid grid-cols-1 gap-6 select-none md:grid-cols-2 lg:grid-cols-5">
                <MetricItem 
                    label={
                        datePreset === '7d' 
                            ? 'Pengajuan (7 Hari)' 
                            : datePreset === '14d' 
                                ? 'Pengajuan (14 Hari)' 
                                : datePreset === 'this_month'
                                    ? 'Pengajuan (Bulan Ini)'
                                    : datePreset === 'last_month'
                                        ? 'Pengajuan (Bulan Lalu)'
                                        : 'Pengajuan Total'
                    } 
                    value={summaryMetrics.total} 
                    icon={FileText} 
                    color="text-primary" 
                    onClick={() => onNavigate('contracts')} 
                />
                <MetricItem
                    label="Sedang Diproses"
                    value={summaryMetrics.in_process}
                    icon={Clock}
                    color="text-amber-500"
                    onClick={() => onNavigate('pending')}
                />
                <MetricItem
                    label="Diselesaikan"
                    value={summaryMetrics.completed}
                    icon={ShieldCheck}
                    color="text-emerald-500"
                    onClick={() => onNavigate('contracts', { status: 'approved' })}
                />
                <MetricItem
                    label="Ditolak"
                    value={summaryMetrics.rejected}
                    icon={Activity}
                    color="text-rose-500"
                    onClick={() => onNavigate('contracts', { status: 'rejected' })}
                />
                <MetricItem
                    label="Approved"
                    value={summaryMetrics.approved}
                    icon={ShieldCheck}
                    color="text-cyan-500"
                    onClick={() => onNavigate('contracts', { status: 'approved' })}
                />
            </div>

            {/* Daily Trend Line Chart with Date Filtering Options */}
            <div className="space-y-4 pt-2">
                <div className="border-b border-surface-border/40 pb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-bold text-text-main">Tren Pembuatan Kontrak Harian</h3>
                        <p className="text-[10px] text-text-soft">Perkembangan total volume pembuatan kontrak baru per kategori status utama</p>
                    </div>

                    {/* Filter Presets & Custom Date Selector */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center rounded-lg border border-surface-border bg-surface-muted/30 p-0.5">
                            <button
                                type="button"
                                onClick={() => setDatePreset('7d')}
                                className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase transition-all ${
                                    datePreset === '7d'
                                        ? 'bg-primary text-primary-foreground shadow-xs'
                                        : 'text-text-soft hover:text-text-main'
                                }`}
                            >
                                7 Hari
                            </button>
                            <button
                                type="button"
                                onClick={() => setDatePreset('14d')}
                                className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase transition-all ${
                                    datePreset === '14d'
                                        ? 'bg-primary text-primary-foreground shadow-xs'
                                        : 'text-text-soft hover:text-text-main'
                                }`}
                            >
                                14 Hari
                            </button>
                            <button
                                type="button"
                                onClick={() => setDatePreset('this_month')}
                                className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase transition-all ${
                                    datePreset === 'this_month'
                                        ? 'bg-primary text-primary-foreground shadow-xs'
                                        : 'text-text-soft hover:text-text-main'
                                }`}
                            >
                                Bulan Ini
                            </button>
                            <button
                                type="button"
                                onClick={() => setDatePreset('last_month')}
                                className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase transition-all ${
                                    datePreset === 'last_month'
                                        ? 'bg-primary text-primary-foreground shadow-xs'
                                        : 'text-text-soft hover:text-text-main'
                                }`}
                            >
                                Bulan Lalu
                            </button>
                            <button
                                type="button"
                                onClick={() => setDatePreset('custom')}
                                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase transition-all ${
                                    datePreset === 'custom'
                                        ? 'bg-primary text-primary-foreground shadow-xs'
                                        : 'text-text-soft hover:text-text-main'
                                }`}
                            >
                                <Calendar size={11} /> Kustom
                            </button>
                        </div>

                        {/* Custom Date Range Inputs */}
                        {datePreset === 'custom' && (
                            <div className="animate-in fade-in slide-in-from-right-2 flex items-center gap-1.5 duration-200">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="h-7.5 rounded-lg border border-surface-border bg-surface-base px-2 text-[10px] font-bold text-text-main outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                                />
                                <span className="text-[10px] font-bold text-text-soft">s/d</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="h-7.5 rounded-lg border border-surface-border bg-surface-base px-2 text-[10px] font-bold text-text-main outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                                />
                                {(startDate || endDate) && (
                                    <button
                                        type="button"
                                        onClick={handleResetDateFilter}
                                        className="flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-surface-border bg-surface-base text-text-soft hover:text-rose-500 transition-colors"
                                        title="Reset Filter Tanggal"
                                    >
                                        <RotateCcw size={12} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="h-[495px] w-full pt-2">
                    {!isMounted || filteredDailyTrend.length === 0 ? (
                        <div className="text-center py-20 text-xs text-text-soft uppercase animate-in fade-in duration-300 font-semibold">
                            Tidak ada data tren harian untuk rentang tanggal ini
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={filteredDailyTrend} margin={{ top: 15, right: 15, left: -25, bottom: 5 }}>
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
                                                <div className="rounded-xl border border-surface-border bg-surface-base p-2.5 shadow-md text-xs space-y-1.5 min-w-[170px]">
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
