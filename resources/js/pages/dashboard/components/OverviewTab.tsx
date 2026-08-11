import { Archive, Calendar, Clock, FileText, Layers, RotateCcw, Timer } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { MetricItem } from './MetricItem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/cards/Card';

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
            return { semua: 0, pending: 0, mine: 0, arsip: 0, inProgress: 0 };
        }
        return filteredDailyTrend.reduce(
            (acc: any, item: any) => ({
                semua:      acc.semua      + (item['Semua Dokumen']             || 0),
                pending:    acc.pending    + (item['Menunggu Persetujuan Saya'] || 0),
                mine:       acc.mine       + (item['Dokumen Saya']              || 0),
                arsip:      acc.arsip      + (item['Dokumen Arsip']             || 0),
                inProgress: acc.inProgress + (item['On Progress']              || 0),
            }),
            { semua: 0, pending: 0, mine: 0, arsip: 0, inProgress: 0 }
        );
    }, [filteredDailyTrend]);

    const categoriesList = ['Semua Dokumen', 'Menunggu Persetujuan Saya', 'Dokumen Saya', 'Dokumen Arsip', 'On Progress'];
    const CHART_COLORS = ['#06b6d4', '#f59e0b', '#6366f1', '#10b981', '#8b5cf6'];

    // All-time values — same source as KPI cards, used for pie chart & legend
    const categoryValues: Record<string, number> = {
        'Semua Dokumen':             data?.metrics?.totalContracts ?? 0,
        'Menunggu Persetujuan Saya': m.pending_for_me             ?? 0,
        'Dokumen Saya':              m.my_total                   ?? 0,
        'Dokumen Arsip':             m.archived_total             ?? 0,
        'On Progress':               m.in_process                 ?? 0,
    };

    const handleResetDateFilter = () => {
        setDatePreset('7d');
        setStartDate('');
        setEndDate('');
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4 duration-700">
            {/* 5 KPI Metric Cards */}
            <div className="grid grid-cols-1 gap-4 select-none sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {[
                    {
                        label: 'Semua Dokumen',
                        value: data?.metrics?.totalContracts ?? 0,
                        icon: Layers,
                        color: 'text-cyan-500',
                        description: 'Seluruh dokumen kontrak terotorisasi',
                        nav: () => onNavigate('contracts')
                    },
                    {
                        label: 'Menunggu Persetujuan',
                        value: m.pending_for_me !== undefined ? m.pending_for_me : (data?.metrics?.pendingApprovals || 0),
                        icon: Clock,
                        color: 'text-amber-500',
                        description: 'Kontrak butuh persetujuan Anda',
                        nav: () => onNavigate('pending')
                    },
                    {
                        label: 'Dokumen Saya',
                        value: m.my_total ?? 0,
                        icon: FileText,
                        color: 'text-primary',
                        description: 'Kontrak yang Anda buat (tidak termasuk draft)',
                        nav: () => onNavigate('mine')
                    },
                    {
                        label: 'Dokumen Arsip',
                        value: m.archived_total ?? 0,
                        icon: Archive,
                        color: 'text-emerald-500',
                        description: 'Kontrak yang telah diarsipkan',
                        nav: () => onNavigate('archived')
                    },
                    {
                        label: 'On Progress',
                        value: m.in_process ?? 0,
                        icon: Timer,
                        color: 'text-violet-500',
                        description: 'Kontrak dalam proses review/revisi',
                        nav: () => onNavigate('in_progress')
                    },
                ].map((kpi, idx) => (
                    <Card 
                        key={idx} 
                        className="relative cursor-pointer transition-all duration-200 overflow-hidden border border-surface-border/60 hover:border-primary/40 hover:shadow-xs bg-white dark:bg-zinc-900/50"
                        onClick={kpi.nav}
                        title="Klik untuk melihat detail tiket"
                    >
                        <CardContent className="p-4 pt-4 space-y-2">
                            <MetricItem 
                                label={kpi.label} 
                                value={kpi.value} 
                                icon={kpi.icon}
                                color={kpi.color}
                            />
                            <p className="text-[10px] text-text-soft font-medium opacity-80 mt-1">
                                {kpi.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Daily Trend Line Chart with Separate Legend Card (70% / 30% split) */}
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 items-stretch">
                {/* Line Chart Card (70%) */}
                <Card className="lg:col-span-7 bg-white dark:bg-zinc-900/50 border border-surface-border/60 shadow-xs flex flex-col justify-between">
                    <CardHeader className="p-4 pb-2 border-b border-surface-border/40 flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
                        <div className="text-left flex-1 min-w-[200px]">
                            <CardTitle className="text-sm font-bold text-text-main text-left">Tren Pembuatan Kontrak Harian</CardTitle>
                            <p className="text-[10px] text-text-soft text-left">Perkembangan total volume pembuatan kontrak baru per kategori status utama</p>
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
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <div className="h-[385px] w-full pt-2">
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
                                        {categoriesList.map((category: string, idx: number) => {
                                            const strokeColor = CHART_COLORS[idx % CHART_COLORS.length];
                                            return (
                                                <Line 
                                                    key={category}
                                                    type="linear" 
                                                    dataKey={category} 
                                                    name={category}
                                                    stroke={strokeColor} 
                                                    strokeWidth={2}
                                                    dot={(props: any) => {
                                                        const { cx, cy, index, dataKey } = props;
                                                        const isLast = index === filteredDailyTrend.length - 1;
                                                        if (isLast) {
                                                            return (
                                                                <g key={`last-dot-${dataKey}-${index}`}>
                                                                    <circle cx={cx} cy={cy} r={8.5} fill={strokeColor} stroke="#fff" strokeWidth={1.5} />
                                                                    {/* Render SVG Icon Paths according to category */}
                                                                    {category === 'Semua Dokumen' && (
                                                                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" transform={`translate(${cx - 5}, ${cy - 5}) scale(0.42)`} fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                                    )}
                                                                    {category === 'Menunggu Persetujuan Saya' && (
                                                                        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 6v6l4 2" transform={`translate(${cx - 5}, ${cy - 5}) scale(0.42)`} fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                                    )}
                                                                    {category === 'Dokumen Saya' && (
                                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6" transform={`translate(${cx - 5}, ${cy - 5}) scale(0.42)`} fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                                    )}
                                                                    {category === 'On Progress' && (
                                                                        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z M12 6v6l4 2" transform={`translate(${cx - 5}, ${cy - 5}) scale(0.42)`} fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                                    )}
                                                                </g>
                                                            );
                                                        }
                                                        return <circle key={`dot-${dataKey}-${index}`} cx={cx} cy={cy} r={2} fill="#fff" stroke={strokeColor} strokeWidth={1} />;
                                                    }}
                                                    activeDot={{ r: 4 }}
                                                />
                                            );
                                        })}
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Separate Legend & Pie Chart Card (30%) */}
                <Card className="lg:col-span-3 bg-white dark:bg-zinc-900/50 border border-surface-border/60 shadow-xs flex flex-col justify-between">
                    <div>
                        <CardHeader className="p-4 pb-2 border-b border-surface-border/40 space-y-0">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-text-main">Ringkasan Kategori</CardTitle>
                            <p className="text-[9.5px] text-text-soft">Distribusi total keseluruhan kontrak per kategori</p>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            {/* Pie Chart Component displaying identical Line Chart Data */}
                            <div className="h-40 w-full relative flex items-center justify-center">
                                {isMounted && categoriesList.length > 0 && (
                                    <>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={categoriesList.map((category: string, idx: number) => ({
                                                        name: category,
                                                        value: categoryValues[category] ?? 0,
                                                        color: CHART_COLORS[idx % CHART_COLORS.length]
                                                    })).filter((item: any) => item.value > 0)}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={35}
                                                    outerRadius={55}
                                                    paddingAngle={3}
                                                    dataKey="value"
                                                >
                                                    {categoriesList.map((category: string, idx: number) => (
                                                        <Cell key={`cell-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip
                                                    content={({ active, payload }: any) => {
                                                        if (active && payload && payload.length) {
                                                            const item = payload[0];
                                                            return (
                                                                <div className="rounded-lg border border-surface-border bg-surface-base p-2 shadow-md text-xs space-y-0.5">
                                                                    <p className="font-bold text-text-main text-[10px]">{item.name}</p>
                                                                    <p className="font-extrabold text-primary text-[11px]">{item.value} Kontrak</p>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>

                                        {/* Centered Total Count Overlay — show Semua Dokumen total */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-[13px] font-black leading-none text-text-main">
                                                {data?.metrics?.totalContracts ?? 0}
                                            </span>
                                            <span className="text-[7.5px] font-extrabold uppercase tracking-widest text-text-soft mt-0.5">
                                                Dokumen
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Category List Items with matching Lucide icons */}
                            <div className="space-y-2 pt-1 border-t border-surface-border/40">
                                {categoriesList.map((category: string, idx: number) => {
                                    const categoryIcons: Record<string, any> = {
                                        'Semua Dokumen': Layers,
                                        'Menunggu Persetujuan Saya': Clock,
                                        'Dokumen Saya': FileText,
                                        'Dokumen Arsip': Archive,
                                        'On Progress': Timer,
                                    };
                                    const CategoryIcon = categoryIcons[category] || FileText;

                                    return (
                                        <div key={category} className="flex items-center justify-between gap-2 p-1.5 rounded-lg border border-surface-border/40 bg-surface-muted/20 hover:bg-surface-muted/40 transition-colors">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div 
                                                    className="w-5 h-5 rounded-full shrink-0 shadow-xs flex items-center justify-center text-white" 
                                                    style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                                                >
                                                    <CategoryIcon size={10} strokeWidth={2.5} />
                                                </div>
                                                <span className="text-[10px] font-bold text-text-main truncate">
                                                    {category}
                                                </span>
                                            </div>
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-surface-base border border-surface-border/60 text-text-soft shrink-0">
                                                {categoryValues[category] ?? 0}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </div>
                    <div className="p-3 pt-0 text-[8.5px] text-text-soft text-center border-t border-surface-border/30 mt-1">
                        Total volume dari {filteredDailyTrend.length} titik data harian
                    </div>
                </Card>
            </div>
    </div>
);
}
