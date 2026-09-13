import { Archive, ArrowUpRight, Calendar, CheckCircle2, ChevronRight, Clock, FilePlus, FileText, Layers, RotateCcw, Sparkles, Timer, User } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/cards/Card';
import { ChipIcon } from '@/components/ui/feedback/ChipIcon';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';

interface OverviewTabProps {
    data: any;
    onNavigate: (view: string, params?: any) => void;
    meUser?: any;
    onCreateContract?: () => void;
}

export function OverviewTab({ data, onNavigate, meUser, onCreateContract }: OverviewTabProps) {
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
        my_total: 0,
        archived_total: 0,
        pending_for_me: 0,
    };

    const overviewDailyTrend = data?.overviewDailyTrend || [];
    const pendingApprovalsList = data?.pendingApprovalsList || [];
    const upcomingRenewals = data?.upcomingRenewals || [];

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

    const categoriesList = ['Semua Dokumen', 'Menunggu Persetujuan Saya', 'Dokumen Saya', 'Dokumen Arsip', 'On Progress'];
    const CHART_COLORS = ['#06b6d4', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'];

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

    // Calculate days remaining helper
    const getDaysRemaining = (endDateStr: string) => {
        if (!endDateStr) return null;
        const end = new Date(endDateStr).getTime();
        const now = new Date().setHours(0, 0, 0, 0);
        return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    };

    // Formatted current date
    const todayFormatted = useMemo(() => {
        return new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    }, []);

    // SLA calculation helper for pending approvals (days waiting)
    const getWaitingDurationText = (requestedAt: string) => {
        if (!requestedAt) return null;
        const requested = new Date(requestedAt).getTime();
        const now = new Date().getTime();
        const diffHours = Math.floor((now - requested) / (1000 * 60 * 60));
        if (diffHours < 24) {
            return `${Math.max(1, diffHours)} jam lalu`;
        }
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} hari lalu`;
    };

    const firstUrgentApproval = pendingApprovalsList && pendingApprovalsList.length > 0 ? pendingApprovalsList[0] : null;

    const pendingCount = m.pending_for_me || 0;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4 duration-700">
            {/* 1. Contextual Welcome & Quick Action Hero */}
            <div className="relative overflow-hidden rounded-lg border border-surface-border bg-surface-base p-4 shadow-none">
                <div className="flex flex-col gap-3.5 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-sm font-bold text-text-main">
                                Halo, {meUser?.name || 'Rekan Kerja'}
                            </h2>
                            <span className="rounded-md border border-surface-border bg-surface-muted px-2 py-0.5 text-[10px] font-semibold text-text-main">
                                {meUser?.role || 'Pengguna'}
                            </span>
                        </div>
                        <p className="text-[11px] text-text-soft">
                            {todayFormatted} • Ringkasan operasional dan prioritas tugas dokumen Anda
                        </p>
                        <div className="pt-0.5">
                            {pendingCount > 0 ? (
                                <div className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-none">
                                    <Clock size={12} className="text-white" />
                                    <span>
                                        Ada <strong>{pendingCount} dokumen</strong> memerlukan tindakan persetujuan Anda.
                                    </span>
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-none">
                                    <span>Semua persetujuan yang ditugaskan kepada Anda telah selesai.</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Action CTAs */}
                    <div className="flex flex-wrap items-center gap-2">
                        {firstUrgentApproval && (
                            <button
                                type="button"
                                onClick={() => router.get(`/contracts/${firstUrgentApproval.contract_id}`)}
                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-none transition-all hover:bg-amber-700 active:scale-95"
                                title="Langsung tinjau dokumen prioritas teratas"
                            >
                                <Clock size={14} className="text-white" />
                                <span>Tinjau Dokumen ({pendingCount})</span>
                            </button>
                        )}
                        {onCreateContract && (
                            <button
                                type="button"
                                onClick={onCreateContract}
                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-none transition-all hover:opacity-90 active:scale-95"
                            >
                                <FilePlus size={14} strokeWidth={2.2} />
                                <span>Buat Pengajuan</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => onNavigate('pending')}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-surface-border bg-surface-base px-3.5 py-2 text-xs font-bold text-text-main shadow-none transition-all hover:bg-surface-muted active:scale-95"
                        >
                            <span>Daftar Persetujuan</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. 5 KPI Metric Cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {[
                    {
                        label: 'Semua Dokumen',
                        value: data?.metrics?.totalContracts ?? 0,
                        icon: Layers,
                        color: 'bg-cyan-600 text-white border-transparent',
                        badge: 'Aktif',
                        badgeColor: 'bg-cyan-600 text-white border-transparent',
                        description: 'Total seluruh dokumen aktif',
                        nav: () => onNavigate('contracts'),
                    },
                    {
                        label: 'Menunggu Persetujuan',
                        value: pendingCount,
                        icon: Clock,
                        color: pendingCount > 0 ? 'bg-amber-600 text-white border-transparent' : 'bg-slate-700 text-white border-transparent',
                        badge: pendingCount > 0 ? 'Perlu Tindakan' : 'Selesai',
                        badgeColor: pendingCount > 0
                            ? 'bg-amber-600 text-white border-transparent'
                            : 'bg-slate-700 text-white border-transparent',
                        description: 'Kontrak butuh review Anda',
                        nav: () => onNavigate('pending'),
                    },
                    {
                        label: 'Dokumen Saya',
                        value: m.my_total ?? 0,
                        icon: FileText,
                        color: 'bg-blue-600 text-white border-transparent',
                        badge: 'Dibuat Anda',
                        badgeColor: 'bg-blue-600 text-white border-transparent',
                        description: 'Kontrak yang Anda ajukan',
                        nav: () => onNavigate('mine'),
                    },
                    {
                        label: 'Dokumen Arsip',
                        value: m.archived_total ?? 0,
                        icon: Archive,
                        color: 'bg-emerald-600 text-white border-transparent',
                        badge: 'Tersimpan',
                        badgeColor: 'bg-emerald-600 text-white border-transparent',
                        description: 'Kontrak selesai & diarsipkan',
                        nav: () => onNavigate('archived'),
                    },
                    {
                        label: 'On Progress',
                        value: m.in_process ?? 0,
                        icon: Timer,
                        color: 'bg-purple-600 text-white border-transparent',
                        badge: 'Dalam Proses',
                        badgeColor: 'bg-purple-600 text-white border-transparent',
                        description: 'Sedang tahap review / revisi',
                        nav: () => onNavigate('in_progress'),
                    },
                ].map((kpi, idx) => {
                    const Icon = kpi.icon;
                    return (
                        <div
                            key={idx}
                            onClick={kpi.nav}
                            className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-lg border border-surface-border bg-surface-base p-3.5 shadow-none transition-all duration-150 hover:border-primary active:scale-[0.99]"
                            title="Klik untuk membuka daftar kontrak"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <span className="text-[10.5px] font-bold tracking-wider text-text-soft uppercase">
                                    {kpi.label}
                                </span>
                                <span className={cn('rounded border px-1.5 py-0.5 text-[9px] font-bold tracking-tight', kpi.badgeColor)}>
                                    {kpi.badge}
                                </span>
                            </div>

                            <div className="mt-2.5 flex items-baseline justify-between">
                                <span className="text-2xl font-black tracking-tight text-text-main">
                                    {kpi.value}
                                </span>
                                <ChipIcon icon={Icon} size="md" bg={kpi.color} shape="rounded" />
                            </div>

                            <div className="mt-2 flex items-center justify-between border-t border-surface-border pt-1.5 text-[10px] text-text-soft">
                                <span className="truncate">{kpi.description}</span>
                                <ChevronRight size={11} className="shrink-0 opacity-40 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 3. Daily Trend Line Chart (65%) & Category Distribution (35%) */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-10">
                {/* Line Chart Card (65%) */}
                <Card className="flex flex-col justify-between rounded-lg border-surface-border bg-surface-base shadow-none lg:col-span-7">
                    <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-surface-border p-4 pb-3 space-y-0">
                        <div className="flex-1 min-w-[200px]">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-text-main">Tren Pembuatan Kontrak</CardTitle>
                            <p className="text-[10px] text-text-soft">Volume pembuatan kontrak per status dalam rentang waktu terpilih</p>
                        </div>

                        {/* Filter Presets & Custom Date Selector */}
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center rounded-md border border-surface-border bg-surface-base p-0.5">
                                {[
                                    { key: '7d', label: '7 Hari' },
                                    { key: '14d', label: '14 Hari' },
                                    { key: 'this_month', label: 'Bulan Ini' },
                                    { key: 'last_month', label: 'Bulan Lalu' },
                                    { key: 'custom', label: 'Kustom' },
                                ].map((p) => (
                                    <button
                                        key={p.key}
                                        type="button"
                                        onClick={() => setDatePreset(p.key as any)}
                                        className={cn(
                                            'cursor-pointer rounded px-2 py-0.5 text-[10px] font-bold uppercase transition-all',
                                            datePreset === p.key
                                                ? 'bg-primary text-primary-foreground shadow-none'
                                                : 'text-text-soft hover:text-text-main'
                                        )}
                                    >
                                        {p.key === 'custom' ? (
                                            <span className="flex items-center gap-1">
                                                <Calendar size={10} /> Kustom
                                            </span>
                                        ) : (
                                            p.label
                                        )}
                                    </button>
                                ))}
                            </div>

                            {datePreset === 'custom' && (
                                <div className="animate-in fade-in slide-in-from-right-2 flex items-center gap-1.5 duration-200">
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="h-7 rounded-md border border-surface-border bg-surface-base px-2 text-[10px] font-bold text-text-main outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                                    />
                                    <span className="text-[10px] font-bold text-text-soft">s/d</span>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="h-7 rounded-md border border-surface-border bg-surface-base px-2 text-[10px] font-bold text-text-main outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                                    />
                                    {(startDate || endDate) && (
                                        <button
                                            type="button"
                                            onClick={handleResetDateFilter}
                                            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-surface-border bg-surface-base text-text-soft hover:text-rose-500 transition-colors shadow-none"
                                            title="Reset Filter Tanggal"
                                        >
                                            <RotateCcw size={11} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-3">
                        <div className="h-[340px] w-full">
                            {!isMounted || filteredDailyTrend.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center text-center text-xs font-semibold uppercase text-text-soft">
                                    Tidak ada data tren harian untuk rentang tanggal ini
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={filteredDailyTrend} margin={{ top: 15, right: 15, left: -25, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.15)" />
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
                                            content={({ active, payload }: any) => {
                                                if (active && payload && payload.length) {
                                                    const item = payload[0].payload;
                                                    return (
                                                        <div className="rounded-md border border-surface-border bg-surface-base p-2.5 shadow-none text-xs space-y-1.5 min-w-[180px]">
                                                            <p className="font-bold text-text-main border-b border-surface-border pb-1">{item.full_date || item.date}</p>
                                                            <div className="space-y-1">
                                                                {payload.map((p: any, idx: number) => (
                                                                    <div key={idx} className="flex justify-between items-center gap-3">
                                                                        <span className="text-text-soft flex items-center gap-1.5 text-[10.5px]">
                                                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                                                            {p.name}
                                                                        </span>
                                                                        <span className="font-bold text-text-main text-[10.5px]">{p.value} Kontrak</span>
                                                                    </div>
                                                                ))}
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
                                                    type="monotone"
                                                    dataKey={category}
                                                    name={category}
                                                    stroke={strokeColor}
                                                    strokeWidth={2}
                                                    dot={false}
                                                    activeDot={{ r: 4, stroke: '#ffffff', strokeWidth: 1.5 }}
                                                />
                                            );
                                        })}
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Donut Chart & Category Breakdown (35%) */}
                <Card className="flex flex-col justify-between rounded-lg border-surface-border bg-surface-base shadow-none lg:col-span-3">
                    <div>
                        <CardHeader className="border-b border-surface-border p-4 pb-3 space-y-0">
                            <CardTitle className="text-xs font-bold tracking-wider uppercase text-text-main">Ringkasan Distribusi</CardTitle>
                            <p className="text-[10px] text-text-soft">Proporsi seluruh kontrak berdasarkan kategori</p>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            {/* Centered Donut Chart */}
                            <div className="relative flex h-36 w-full items-center justify-center">
                                {isMounted && (
                                    <>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={categoriesList.map((category: string, idx: number) => ({
                                                        name: category,
                                                        value: categoryValues[category] ?? 0,
                                                        color: CHART_COLORS[idx % CHART_COLORS.length],
                                                    })).filter((item: any) => item.value > 0)}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={38}
                                                    outerRadius={58}
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
                                                                <div className="rounded-md border border-surface-border bg-surface-base p-2 shadow-none text-xs">
                                                                    <p className="font-bold text-text-main text-[10px]">{item.name}</p>
                                                                    <p className="font-extrabold text-primary text-[11px] mt-0.5">{item.value} Kontrak</p>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>

                                        {/* Center count overlay */}
                                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-sm font-black leading-none text-text-main">
                                                {data?.metrics?.totalContracts ?? 0}
                                            </span>
                                            <span className="mt-0.5 text-[8px] font-extrabold uppercase tracking-widest text-text-soft">
                                                Total
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Category Items List */}
                            <div className="space-y-1.5 border-t border-surface-border pt-2">
                                {categoriesList.map((category: string, idx: number) => {
                                    const categoryIcons: Record<string, any> = {
                                        'Semua Dokumen': Layers,
                                        'Menunggu Persetujuan Saya': Clock,
                                        'Dokumen Saya': FileText,
                                        'Dokumen Arsip': Archive,
                                        'On Progress': Timer,
                                    };
                                    const CategoryIcon = categoryIcons[category] || FileText;
                                    const val = categoryValues[category] ?? 0;
                                    const total = data?.metrics?.totalContracts || 1;
                                    const pct = Math.round((val / total) * 100);

                                    const categoryNavMap: Record<string, string> = {
                                        'Semua Dokumen': 'contracts',
                                        'Menunggu Persetujuan Saya': 'pending',
                                        'Dokumen Saya': 'mine',
                                        'Dokumen Arsip': 'archived',
                                        'On Progress': 'in_progress',
                                    };

                                    return (
                                        <div
                                            key={category}
                                            onClick={() => onNavigate(categoryNavMap[category] || 'contracts')}
                                            className="flex cursor-pointer items-center justify-between gap-2 rounded-md border border-surface-border bg-surface-base p-1.5 px-2 transition-all hover:bg-surface-muted hover:border-primary active:scale-[0.99]"
                                            title={`Klik untuk membuka ${category}`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <ChipIcon
                                                    icon={CategoryIcon}
                                                    size="xs"
                                                    shape="rounded"
                                                    style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                                                    className="border-transparent"
                                                />
                                                <span className="truncate text-[10px] font-semibold text-text-main">
                                                    {category}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <span className="text-[9px] text-text-soft">
                                                    {pct}%
                                                </span>
                                                <span className="rounded border border-surface-border bg-surface-base px-1.5 py-0.5 text-[9px] font-bold text-text-main">
                                                    {val}
                                                </span>
                                                <ChevronRight size={10} className="text-text-soft opacity-50" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </div>
                </Card>
            </div>

            {/* 4. Action Center Grid: Priority Pending Approvals (50%) & Expiring Contracts (50%) */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Column 1: Priority Pending Approvals */}
                <Card className="flex flex-col justify-between rounded-lg border-surface-border bg-surface-base shadow-none">
                    <div>
                        <CardHeader className="flex flex-row items-center justify-between border-b border-surface-border p-4 pb-3 space-y-0">
                            <div className="flex items-center gap-2">
                                <ChipIcon icon={Clock} size="md" bg="bg-amber-600" shape="rounded" />
                                <div>
                                    <CardTitle className="text-xs font-bold text-text-main">Persetujuan Menunggu Aksi</CardTitle>
                                    <p className="text-[10px] text-text-soft">Dokumen yang memerlukan tanda tangan / persetujuan Anda</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => onNavigate('pending')}
                                className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-bold text-primary hover:underline shadow-none"
                            >
                                <span>Lihat Semua ({pendingCount})</span>
                                <ArrowUpRight size={12} />
                            </button>
                        </CardHeader>
                        <CardContent className="p-4 space-y-2">
                            {pendingApprovalsList.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-7 text-center">
                                    <ChipIcon icon={CheckCircle2} size="lg" bg="bg-emerald-600" shape="circle" className="mb-2" />
                                    <p className="text-xs font-bold text-text-main">Tidak Ada Persetujuan Tertunda</p>
                                    <p className="text-[10px] text-text-soft max-w-xs mt-0.5">
                                         Seluruh pengajuan yang ditujukan ke Anda telah diproses.
                                    </p>
                                </div>
                            ) : (
                                pendingApprovalsList.map((item: any) => {
                                    const waitingText = getWaitingDurationText(item.requested_at);
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => router.get(`/contracts/${item.contract_id}`)}
                                            className="group flex cursor-pointer items-center justify-between gap-3 rounded-md border border-surface-border bg-surface-base p-3 shadow-none transition-all duration-150 hover:border-amber-500 hover:bg-surface-muted"
                                        >
                                            <div className="space-y-1 min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="rounded bg-surface-muted border border-surface-border px-1.5 py-0.5 text-[9px] font-bold text-text-main">
                                                        {item.form_no || item.contract_no || 'DOKUMEN'}
                                                    </span>
                                                    {item.type && (
                                                        <span className="truncate rounded border border-surface-border bg-surface-base px-1.5 py-0.5 text-[9px] font-semibold text-text-soft">
                                                            {item.type}
                                                        </span>
                                                    )}
                                                    {waitingText && (
                                                        <span className="rounded bg-amber-600 px-1.5 py-0.5 text-[8.5px] font-bold text-white shadow-none">
                                                            Menunggu {waitingText}
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="truncate text-xs font-bold text-text-main group-hover:text-primary transition-colors">
                                                    {item.title || 'Tanpa Judul'}
                                                </h4>
                                                <div className="flex items-center gap-2 text-[10px] text-text-soft">
                                                    <span className="flex items-center gap-1">
                                                        <User size={10} />
                                                        {item.creator || 'Pembuat'}
                                                    </span>
                                                    {item.step_name && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="font-semibold text-amber-700 dark:text-amber-300">Tahap: {item.step_name}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-none transition-all group-hover:bg-amber-700"
                                            >
                                                <span>Review</span>
                                                <ChevronRight size={11} />
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </CardContent>
                    </div>
                </Card>

                {/* Column 2: Upcoming Expiring Contracts */}
                <Card className="flex flex-col justify-between rounded-lg border-surface-border bg-surface-base shadow-none">
                    <div>
                        <CardHeader className="flex flex-row items-center justify-between border-b border-surface-border p-4 pb-3 space-y-0">
                            <div className="flex items-center gap-2">
                                <ChipIcon icon={Timer} size="md" bg="bg-rose-600" shape="rounded" />
                                <div>
                                    <CardTitle className="text-xs font-bold text-text-main">Mendekati Masa Berakhir</CardTitle>
                                    <p className="text-[10px] text-text-soft">Kontrak yang akan segera jatuh tempo dalam waktu dekat</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => onNavigate('expiry')}
                                className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-bold text-primary hover:underline shadow-none"
                            >
                                <span>Lihat Semua</span>
                                <ArrowUpRight size={12} />
                            </button>
                        </CardHeader>
                        <CardContent className="p-4 space-y-2">
                            {upcomingRenewals.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-7 text-center">
                                    <ChipIcon icon={Calendar} size="lg" bg="bg-slate-600" shape="circle" className="mb-2" />
                                    <p className="text-xs font-bold text-text-main">Tidak Ada Kontrak Mendekati Jatuh Tempo</p>
                                    <p className="text-[10px] text-text-soft max-w-xs mt-0.5">
                                         Seluruh kontrak aktif memiliki masa berlaku yang masih panjang.
                                    </p>
                                </div>
                            ) : (
                                upcomingRenewals.map((item: any) => {
                                    const daysLeft = getDaysRemaining(item.end_date);
                                    let badgeStyle = 'bg-slate-700 text-white border-transparent';
                                    if (daysLeft !== null && daysLeft <= 14) {
                                        badgeStyle = 'bg-rose-600 text-white border-transparent';
                                    } else if (daysLeft !== null && daysLeft <= 30) {
                                        badgeStyle = 'bg-amber-600 text-white border-transparent';
                                    }

                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => router.get(`/contracts/${item.id}`)}
                                            className="group flex cursor-pointer items-center justify-between gap-3 rounded-md border border-surface-border bg-surface-base p-3 shadow-none transition-all duration-150 hover:border-primary hover:bg-surface-muted"
                                        >
                                            <div className="space-y-1 min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="rounded bg-surface-muted border border-surface-border px-1.5 py-0.5 text-[9px] font-bold text-text-main">
                                                        {item.contract_no || item.form_no || 'KONTRAK'}
                                                    </span>
                                                    {item.vendor_name && (
                                                        <span className="truncate rounded border border-surface-border bg-surface-base px-1.5 py-0.5 text-[9px] font-semibold text-text-soft">
                                                            {item.vendor_name}
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="truncate text-xs font-bold text-text-main group-hover:text-primary transition-colors">
                                                    {item.title || 'Tanpa Judul'}
                                                </h4>
                                                <div className="flex items-center gap-2 text-[10px] text-text-soft">
                                                    <span>Berakhir: {item.end_date ? new Date(item.end_date).toLocaleDateString('id-ID') : '-'}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                {daysLeft !== null && (
                                                    <span className={cn('rounded px-1.5 py-0.5 text-[9px] font-bold shadow-none', badgeStyle)}>
                                                        {daysLeft <= 0 ? 'Hari Ini' : `Sisa ${daysLeft} Hari`}
                                                    </span>
                                                )}
                                                <span className="text-[10px] font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100 flex items-center gap-0.5">
                                                    Lihat <ChevronRight size={10} />
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </CardContent>
                    </div>
                </Card>
            </div>
        </div>
    );
}



