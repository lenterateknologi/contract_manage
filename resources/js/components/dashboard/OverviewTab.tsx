import { useEffect, useState } from 'react';
import {
    FileText,
    ShieldCheck,
    AlertTriangle,
    Clock,
    RotateCw,
    TrendingUp,
    DollarSign,
    Calendar,
    Activity,
    ArrowUpRight,
    CheckCircle2,
    Eye,
    Building2,
    Mail
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';

interface OverviewTabProps {
    data: any;
    onNavigate: (view: string) => void;
}

export function OverviewTab({ data, onNavigate }: OverviewTabProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const m = data?.metrics || {
        totalContracts: 0,
        activeContracts: 0,
        expiringContracts: 0,
        expiredContracts: 0,
        pendingContracts: 0,
        renewalRate: 0,
        totalValue: 0,
        avgCycleTime: 0,
    };

    // Helper for currency formatting
    const formatIDR = (value: number): string => {
        if (value >= 1_000_000_000_000) {
            return `Rp ${(value / 1_000_000_000_000).toFixed(2)} T`;
        }
        if (value >= 1_000_000_000) {
            return `Rp ${(value / 1_000_000_000).toFixed(2)} M`;
        }
        if (value >= 1_000_000) {
            return `Rp ${(value / 1_000_000).toFixed(2)} Jt`;
        }
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(value);
    };

    const statusDistributionData = (data?.statusDistribution || []).map((item: any) => {
        let label = item.status;
        if (item.status === 'approved') label = 'Disetujui';
        if (item.status === 'in_review') label = 'Review';
        if (item.status === 'revision') label = 'Revisi';
        if (item.status === 'draft') label = 'Draft';
        if (item.status === 'rejected') label = 'Ditolak';
        return {
            name: label,
            value: item.count,
            key: item.status
        };
    });

    const PIE_COLORS = {
        approved: '#10b981',  // emerald
        in_review: '#f59e0b', // amber
        revision: '#f43f5e',  // rose
        draft: '#64748b',     // slate
        rejected: '#ef4444',  // red
    };

    // Expiry Timeline horizontal bar data
    const rawExpiry = data?.expiryTimeline || { under30: 0, under60: 0, under90: 0, above90: 0 };
    const expiryTimelineData = [
        { name: '< 30 Hari', count: rawExpiry.under30, fill: '#f43f5e' },
        { name: '30 - 60 Hari', count: rawExpiry.under60, fill: '#fb923c' },
        { name: '60 - 90 Hari', count: rawExpiry.under90, fill: '#fbbf24' },
        { name: '> 90 Hari', count: rawExpiry.above90, fill: '#10b981' },
    ];

    const getStatusStyle = (status: string) => {
        const config: Record<string, { bg: string; text: string; dot: string; label: string }> = {
            draft: { bg: 'bg-slate-100 dark:bg-slate-900/50', text: 'text-slate-600 dark:text-slate-400', dot: 'bg-slate-400', label: 'Draft' },
            in_review: { bg: 'bg-amber-50 dark:bg-amber-950/20', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500', label: 'Review' },
            revision: { bg: 'bg-rose-50 dark:bg-rose-950/20', text: 'text-rose-700 dark:text-rose-400', dot: 'bg-rose-500', label: 'Revisi' },
            approved: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', label: 'Disetujui' },
            rejected: { bg: 'bg-red-50 dark:bg-red-950/20', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500', label: 'Ditolak' }
        };
        return config[status] || { bg: 'bg-slate-50 dark:bg-slate-900/20', text: 'text-slate-600 dark:text-slate-400', dot: 'bg-slate-400', label: status };
    };

    return (
        <div className="space-y-6">
            {/* 8 KPI Cards Grid */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 select-none">
                <div
                    onClick={() => onNavigate('contracts')}
                    className="group border border-border/60 bg-card/45 hover:bg-card/65 relative flex flex-col gap-3 overflow-hidden rounded-2xl p-4 shadow-xs transition-all duration-300 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/15 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-500/10 shadow-xs">
                            <FileText className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-muted-foreground text-[8px] font-extrabold tracking-wider uppercase">Total Kontrak</span>
                    </div>
                    <div>
                        <p className="text-muted-foreground mb-0.5 text-[9px] font-bold tracking-wider uppercase">Volume Kontrak</p>
                        <span className="text-foreground text-xl font-extrabold tracking-tight tabular-nums">{m.totalContracts}</span>
                    </div>
                </div>

                <div className="group border border-border/60 bg-card/45 relative flex flex-col gap-3 overflow-hidden rounded-2xl p-4 shadow-xs transition-all duration-300 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/15">
                    <div className="flex items-center justify-between">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-500/10 shadow-xs">
                            <ShieldCheck className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-muted-foreground text-[8px] font-extrabold tracking-wider uppercase">Aktif</span>
                    </div>
                    <div>
                        <p className="text-muted-foreground mb-0.5 text-[9px] font-bold tracking-wider uppercase">Kontrak Aktif</p>
                        <span className="text-foreground text-xl font-extrabold tracking-tight tabular-nums">{m.activeContracts}</span>
                    </div>
                </div>

                <div className="group border border-border/60 bg-card/45 relative flex flex-col gap-3 overflow-hidden rounded-2xl p-4 shadow-xs transition-all duration-300 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/15">
                    <div className="flex items-center justify-between">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-500/10 shadow-xs animate-pulse">
                            <Clock className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-muted-foreground text-[8px] font-extrabold tracking-wider uppercase">Segera Berakhir</span>
                    </div>
                    <div>
                        <p className="text-muted-foreground mb-0.5 text-[9px] font-bold tracking-wider uppercase">Masa Berlaku &lt; 30 Hari</p>
                        <span className="text-foreground text-xl font-extrabold tracking-tight tabular-nums">{m.expiringContracts}</span>
                    </div>
                </div>

                <div className="group border border-border/60 bg-card/45 relative flex flex-col gap-3 overflow-hidden rounded-2xl p-4 shadow-xs transition-all duration-300 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/15">
                    <div className="flex items-center justify-between">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-500/10 shadow-xs">
                            <AlertTriangle className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-muted-foreground text-[8px] font-extrabold tracking-wider uppercase">Kadaluarsa</span>
                    </div>
                    <div>
                        <p className="text-muted-foreground mb-0.5 text-[9px] font-bold tracking-wider uppercase">Telah Habis Kontrak</p>
                        <span className="text-foreground text-xl font-extrabold tracking-tight tabular-nums">{m.expiredContracts}</span>
                    </div>
                </div>

                <div
                    onClick={() => onNavigate('pending')}
                    className="group border border-border/60 bg-card/45 hover:bg-card/65 relative flex flex-col gap-3 overflow-hidden rounded-2xl p-4 shadow-xs transition-all duration-300 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/15 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 border border-orange-500/10 shadow-xs">
                            <Clock className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-muted-foreground text-[8px] font-extrabold tracking-wider uppercase">Persetujuan</span>
                    </div>
                    <div>
                        <p className="text-muted-foreground mb-0.5 text-[9px] font-bold tracking-wider uppercase">Pending Approval</p>
                        <span className="text-foreground text-xl font-extrabold tracking-tight tabular-nums">{m.pendingContracts}</span>
                    </div>
                </div>

                <div className="group border border-border/60 bg-card/45 relative flex flex-col gap-3 overflow-hidden rounded-2xl p-4 shadow-xs transition-all duration-300 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/15">
                    <div className="flex items-center justify-between">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400 border border-teal-500/10 shadow-xs">
                            <RotateCw className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-muted-foreground text-[8px] font-extrabold tracking-wider uppercase">Rasio Renewal</span>
                    </div>
                    <div>
                        <p className="text-muted-foreground mb-0.5 text-[9px] font-bold tracking-wider uppercase">Tingkat Perpanjangan</p>
                        <span className="text-foreground text-xl font-extrabold tracking-tight tabular-nums">{m.renewalRate}%</span>
                    </div>
                </div>

                <div className="group border border-border/60 bg-card/45 relative flex flex-col gap-3 overflow-hidden rounded-2xl p-4 shadow-xs transition-all duration-300 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/15">
                    <div className="flex items-center justify-between">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400 border border-sky-500/10 shadow-xs">
                            <DollarSign className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-muted-foreground text-[8px] font-extrabold tracking-wider uppercase">Nilai Kontrak</span>
                    </div>
                    <div>
                        <p className="text-muted-foreground mb-0.5 text-[9px] font-bold tracking-wider uppercase">Akumulasi Nilai</p>
                        <span className="text-foreground text-xl font-extrabold tracking-tight tabular-nums truncate block max-w-full" title={formatIDR(m.totalValue)}>
                            {formatIDR(m.totalValue)}
                        </span>
                    </div>
                </div>

                <div className="group border border-border/60 bg-card/45 relative flex flex-col gap-3 overflow-hidden rounded-2xl p-4 shadow-xs transition-all duration-300 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/15">
                    <div className="flex items-center justify-between">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400 border border-violet-500/10 shadow-xs">
                            <TrendingUp className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-muted-foreground text-[8px] font-extrabold tracking-wider uppercase">Cycle Time</span>
                    </div>
                    <div>
                        <p className="text-muted-foreground mb-0.5 text-[9px] font-bold tracking-wider uppercase">Rata-rata Waktu Siklus</p>
                        <span className="text-foreground text-xl font-extrabold tracking-tight tabular-nums">{m.avgCycleTime} Hari</span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Donut Chart: Status Distribution */}
                <div className="lg:col-span-5 border border-border/60 bg-card/45 backdrop-blur-md rounded-2xl p-5 shadow-xs transition-all duration-300 dark:border-slate-800/60 dark:bg-slate-900/15 flex flex-col">
                    <div>
                        <h3 className="text-foreground text-xs font-extrabold tracking-wider uppercase">Distribusi Status Kontrak</h3>
                        <p className="text-muted-foreground text-[9px] font-semibold mt-0.5">Proporsi kontrak berdasarkan fase alur kerja saat ini.</p>
                    </div>
                    <div className="h-[200px] w-full mt-4 flex items-center justify-center relative select-none">
                        {isMounted && statusDistributionData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusDistributionData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={75}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {statusDistributionData.map((entry: any) => (
                                            <Cell
                                                key={`cell-${entry.key}`}
                                                fill={PIE_COLORS[entry.key as keyof typeof PIE_COLORS] || '#cbd5e1'}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                            borderColor: 'rgba(255, 255, 255, 0.1)',
                                            borderRadius: '12px',
                                            fontSize: '10px',
                                            color: '#f8fafc'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-xs text-muted-foreground">Tidak ada data</div>
                        )}
                        <div className="absolute flex flex-col items-center justify-center">
                            <span className="text-muted-foreground text-[8px] font-bold uppercase tracking-wider">Total</span>
                            <span className="text-foreground text-xl font-extrabold tracking-tight tabular-nums">{m.totalContracts}</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2 border-t border-border/20 pt-4 dark:border-slate-800/40">
                        {statusDistributionData.map((item: any) => (
                            <div key={item.key} className="flex items-center gap-2">
                                <span
                                    className="h-2 w-2 rounded-full shrink-0"
                                    style={{ backgroundColor: PIE_COLORS[item.key as keyof typeof PIE_COLORS] || '#cbd5e1' }}
                                />
                                <span className="text-muted-foreground text-[9px] font-semibold truncate flex-1">{item.name}</span>
                                <span className="text-foreground text-[10px] font-extrabold tabular-nums">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Horizontal Bar Chart: Expiry Timeline */}
                <div className="lg:col-span-7 border border-border/60 bg-card/45 backdrop-blur-md rounded-2xl p-5 shadow-xs transition-all duration-300 dark:border-slate-800/60 dark:bg-slate-900/15 flex flex-col justify-between">
                    <div>
                        <h3 className="text-foreground text-xs font-extrabold tracking-wider uppercase">Jadwal Jatuh Tempo Kontrak</h3>
                        <p className="text-muted-foreground text-[9px] font-semibold mt-0.5">Jumlah kontrak disetujui yang mendekati atau telah melewati batas akhir masa berlaku.</p>
                    </div>
                    <div className="h-[220px] w-full mt-4 select-none">
                        {isMounted ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={expiryTimelineData}
                                    layout="vertical"
                                    margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(120, 120, 120, 0.05)" />
                                    <XAxis type="number" fontSize={9} stroke="rgba(120, 120, 120, 0.5)" tickLine={false} axisLine={false} />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        fontSize={9}
                                        stroke="rgba(120, 120, 120, 0.7)"
                                        tickLine={false}
                                        axisLine={false}
                                        width={75}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(120, 120, 120, 0.04)' }}
                                        contentStyle={{
                                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                            borderColor: 'rgba(255, 255, 255, 0.1)',
                                            borderRadius: '12px',
                                            fontSize: '10px',
                                            color: '#f8fafc'
                                        }}
                                    />
                                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={12}>
                                        {expiryTimelineData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-xs text-muted-foreground flex items-center justify-center h-full">Memuat...</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tables Area */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {/* Recent Contracts */}
                <div className="border border-border/60 bg-card/45 backdrop-blur-md rounded-2xl p-5 shadow-xs transition-all duration-300 dark:border-slate-800/60 dark:bg-slate-900/15">
                    <div className="flex items-center justify-between border-b border-border/20 pb-3 mb-4 dark:border-slate-800/40">
                        <div>
                            <h3 className="text-foreground text-xs font-extrabold tracking-wider uppercase">Kontrak Terbaru</h3>
                            <p className="text-muted-foreground text-[9px] font-semibold mt-0.5">Daftar kontrak yang baru saja ditambahkan ke sistem.</p>
                        </div>
                        <button
                            onClick={() => onNavigate('contracts')}
                            className="text-primary hover:text-primary/80 text-[10px] font-bold uppercase tracking-tight flex items-center gap-1 cursor-pointer transition-colors"
                        >
                            Lihat Semua <ArrowUpRight size={12} />
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border/10">
                                    <th className="py-2.5 text-[8.5px] font-extrabold uppercase text-muted-foreground tracking-wider">No. Kontrak & Judul</th>
                                    <th className="py-2.5 text-[8.5px] font-extrabold uppercase text-muted-foreground tracking-wider">Kategori</th>
                                    <th className="py-2.5 text-[8.5px] font-extrabold uppercase text-muted-foreground tracking-wider">Nilai</th>
                                    <th className="py-2.5 text-[8.5px] font-extrabold uppercase text-muted-foreground tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data?.recentContracts || []).slice(0, 5).map((c: any) => {
                                    const st = getStatusStyle(c.status);
                                    return (
                                        <tr key={c.id} className="border-b border-border/5 hover:bg-muted/20 dark:hover:bg-slate-900/10 transition-colors">
                                            <td className="py-3 pr-4 max-w-[200px]">
                                                <span className="text-[10px] font-extrabold text-foreground block truncate">{c.title}</span>
                                                <span className="text-[8px] font-semibold text-muted-foreground block mt-0.5">{c.contract_no || 'DRAF'}</span>
                                            </td>
                                            <td className="py-3 text-[10px] font-bold text-muted-foreground">{c.type || '-'}</td>
                                            <td className="py-3 text-[10px] font-extrabold text-foreground tabular-nums">{c.price || '-'}</td>
                                            <td className="py-3">
                                                <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-extrabold border border-black/5 dark:border-white/5', st.bg, st.text)}>
                                                    <span className={cn('h-1 w-1 rounded-full', st.dot)} />
                                                    {st.label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {(data?.recentContracts || []).length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground italic">Tidak ada kontrak terbaru</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Upcoming Renewals */}
                <div className="border border-border/60 bg-card/45 backdrop-blur-md rounded-2xl p-5 shadow-xs transition-all duration-300 dark:border-slate-800/60 dark:bg-slate-900/15">
                    <div className="flex items-center justify-between border-b border-border/20 pb-3 mb-4 dark:border-slate-800/40">
                        <div>
                            <h3 className="text-foreground text-xs font-extrabold tracking-wider uppercase">Jadwal Perpanjangan Terdekat</h3>
                            <p className="text-muted-foreground text-[9px] font-semibold mt-0.5">Kontrak aktif yang paling mendekati batas berakhir masa berlaku.</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border/10">
                                    <th className="py-2.5 text-[8.5px] font-extrabold uppercase text-muted-foreground tracking-wider">No. Kontrak & Judul</th>
                                    <th className="py-2.5 text-[8.5px] font-extrabold uppercase text-muted-foreground tracking-wider">Vendor/Mitra</th>
                                    <th className="py-2.5 text-[8.5px] font-extrabold uppercase text-muted-foreground tracking-wider">Tanggal Selesai</th>
                                    <th className="py-2.5 text-[8.5px] font-extrabold uppercase text-muted-foreground tracking-wider">Sisa Hari</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data?.upcomingRenewals || []).slice(0, 5).map((c: any) => {
                                    const diffDays = Math.ceil((new Date(c.end_date).getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
                                    const isExpired = diffDays < 0;
                                    return (
                                        <tr key={c.id} className="border-b border-border/5 hover:bg-muted/20 dark:hover:bg-slate-900/10 transition-colors">
                                            <td className="py-3 pr-4 max-w-[200px]">
                                                <span className="text-[10px] font-extrabold text-foreground block truncate">{c.title}</span>
                                                <span className="text-[8px] font-semibold text-muted-foreground block mt-0.5">{c.contract_no}</span>
                                            </td>
                                            <td className="py-3 text-[10px] font-bold text-muted-foreground truncate max-w-[120px]" title={c.vendor_name}>{c.vendor_name || '-'}</td>
                                            <td className="py-3 text-[10px] font-extrabold text-foreground tabular-nums">
                                                {new Date(c.end_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="py-3">
                                                <span className={cn(
                                                    'inline-flex px-1.5 py-0.5 rounded text-[8.5px] font-extrabold uppercase',
                                                    isExpired 
                                                        ? 'bg-rose-500/10 text-rose-600 border border-rose-500/10'
                                                        : diffDays <= 30
                                                            ? 'bg-amber-500/10 text-amber-600 border border-amber-500/10'
                                                            : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/10'
                                                )}>
                                                    {isExpired ? `Expired` : `${diffDays} Hari`}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {(data?.upcomingRenewals || []).length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground italic">Tidak ada jadwal perpanjangan terdekat</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Pending Approvals & Activity Feed Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Pending Approvals list */}
                <div className="lg:col-span-6 border border-border/60 bg-card/45 backdrop-blur-md rounded-2xl p-5 shadow-xs transition-all duration-300 dark:border-slate-800/60 dark:bg-slate-900/15">
                    <div className="flex items-center justify-between border-b border-border/20 pb-3 mb-4 dark:border-slate-800/40">
                        <div>
                            <h3 className="text-foreground text-xs font-extrabold tracking-wider uppercase">Menunggu Persetujuan Anda</h3>
                            <p className="text-muted-foreground text-[9px] font-semibold mt-0.5">Daftar kontrak yang membutuhkan tindakan persetujuan dari Anda.</p>
                        </div>
                        <button
                            onClick={() => onNavigate('pending')}
                            className="text-primary hover:text-primary/80 text-[10px] font-bold uppercase tracking-tight flex items-center gap-1 cursor-pointer transition-colors"
                        >
                            Lihat Antrean <ArrowUpRight size={12} />
                        </button>
                    </div>
                    <div className="space-y-2.5">
                        {(data?.pendingApprovalsList || []).slice(0, 5).map((app: any) => (
                            <div
                                key={app.id}
                                className="flex items-start justify-between p-3 border border-border/40 bg-card/50 hover:bg-card/90 dark:bg-slate-900/5 dark:hover:bg-slate-900/20 rounded-xl transition-all duration-200"
                            >
                                <div className="min-w-0 pr-3">
                                    <h4 className="text-foreground text-[10.5px] font-extrabold truncate">{app.title}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[8px] font-semibold text-muted-foreground">{app.contract_no || 'Tanpa No.'}</span>
                                        <span className="text-muted-foreground/30 text-[8px]">•</span>
                                        <span className="text-[8.5px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tight">{app.type}</span>
                                    </div>
                                    <span className="text-muted-foreground text-[8px] font-bold block mt-1">
                                        Diajukan oleh: <span className="text-foreground">{app.creator}</span>
                                    </span>
                                </div>
                                <span className="text-muted-foreground text-[8px] font-semibold tabular-nums shrink-0 whitespace-nowrap">
                                    {new Date(app.requested_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                </span>
                            </div>
                        ))}
                        {(data?.pendingApprovalsList || []).length === 0 && (
                            <div className="py-8 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground italic">
                                Selesai! Tidak ada persetujuan yang tertunda.
                            </div>
                        )}
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="lg:col-span-6 border border-border/60 bg-card/45 backdrop-blur-md rounded-2xl p-5 shadow-xs transition-all duration-300 dark:border-slate-800/60 dark:bg-slate-900/15">
                    <div className="border-b border-border/20 pb-3 mb-4 dark:border-slate-800/40">
                        <h3 className="text-foreground text-xs font-extrabold tracking-wider uppercase">Log Aktivitas Terbaru</h3>
                        <p className="text-muted-foreground text-[9px] font-semibold mt-0.5">Riwayat tindakan, persetujuan, dan perubahan status kontrak.</p>
                    </div>
                    <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1.5 custom-scrollbar">
                        {(data?.recentActivity || []).map((act: any) => (
                            <div key={act.id} className="flex gap-3 items-start text-xs border-b border-border/5 pb-2.5 last:border-0 last:pb-0">
                                <div className="h-6 w-6 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground border border-border/20">
                                    <Activity size={12} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-foreground text-[9.5px] font-semibold leading-relaxed">
                                        <span className="font-extrabold">{act.actor}</span> {act.description}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        {act.contract_no && (
                                            <span className="text-muted-foreground text-[8px] font-semibold">{act.contract_no}</span>
                                        )}
                                        {act.contract_no && <span className="text-muted-foreground/30 text-[8px]">•</span>}
                                        <span className="text-muted-foreground text-[8px] font-medium">
                                            {new Date(act.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(data?.recentActivity || []).length === 0 && (
                            <div className="py-8 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground italic">
                                Belum ada aktivitas tercatat
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
