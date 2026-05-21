import { useEffect, useState } from 'react';
import {
    Activity,
    ShieldAlert,
    Clock,
    RefreshCw,
    TrendingUp,
    FileSpreadsheet,
    Building2,
    DollarSign,
    Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell
} from 'recharts';

interface AnalysisTabProps {
    data: any;
}

export function AnalysisTab({ data }: AnalysisTabProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

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

    const expiryRiskHeatmap = data?.expiryRiskHeatmap || [];
    const renewalFailureByCategory = data?.renewalFailureByCategory || [];
    const vendorPerformance = data?.vendorPerformance || [];
    const valueDistribution = data?.valueDistribution || [];
    const budgetAllocation = data?.budgetAllocation || [];
    const approvalDurationByDept = data?.approvalDurationByDept || [];

    const BUDGET_COLORS = [
        '#6366f1', // indigo
        '#10b981', // emerald
        '#f59e0b', // amber
        '#f43f5e', // rose
        '#06b6d4', // cyan
        '#8b5cf6', // violet
        '#ec4899', // pink
        '#3b82f6'  // blue
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* 1. Expiry Risk Heatmap */}
                <div className="lg:col-span-6 border border-border/60 bg-card/45 backdrop-blur-md rounded-2xl p-5 shadow-xs transition-all duration-300 dark:border-slate-800/60 dark:bg-slate-900/15 flex flex-col justify-between">
                    <div>
                        <h3 className="text-foreground text-xs font-extrabold tracking-wider uppercase flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 text-rose-500" />
                            Matriks Risiko Masa Berlaku per Divisi
                        </h3>
                        <p className="text-muted-foreground text-[9px] font-semibold mt-0.5">Analisis risiko kontrak aktif berdasarkan waktu sisa (High: &lt;30 hari, Med: 30-90 hari, Low: &gt;90 hari).</p>
                    </div>
                    <div className="overflow-x-auto mt-4">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border/10">
                                    <th className="py-2 text-[8.5px] font-extrabold uppercase text-muted-foreground tracking-wider">Divisi / Departemen</th>
                                    <th className="py-2 text-[8.5px] font-extrabold uppercase text-muted-foreground tracking-wider text-center">Risiko Tinggi</th>
                                    <th className="py-2 text-[8.5px] font-extrabold uppercase text-muted-foreground tracking-wider text-center">Risiko Sedang</th>
                                    <th className="py-2 text-[8.5px] font-extrabold uppercase text-muted-foreground tracking-wider text-center">Risiko Rendah</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expiryRiskHeatmap.map((item: any, idx: number) => (
                                    <tr key={idx} className="border-b border-border/5 hover:bg-muted/15 dark:hover:bg-slate-900/10 transition-colors">
                                        <td className="py-2.5 text-[10px] font-bold text-foreground flex items-center gap-2">
                                            <Building2 size={11} className="text-muted-foreground" />
                                            {item.department}
                                        </td>
                                        <td className="py-2.5 text-center">
                                            <span className={cn(
                                                "inline-flex justify-center items-center h-5 w-8 rounded-md text-[10px] font-extrabold tabular-nums",
                                                item.high > 0 
                                                    ? "bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 font-black border border-rose-500/10 animate-pulse" 
                                                    : "bg-slate-100 text-slate-400 dark:bg-slate-900 dark:text-slate-600"
                                            )}>
                                                {item.high}
                                            </span>
                                        </td>
                                        <td className="py-2.5 text-center">
                                            <span className={cn(
                                                "inline-flex justify-center items-center h-5 w-8 rounded-md text-[10px] font-extrabold tabular-nums",
                                                item.medium > 0 
                                                    ? "bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/10" 
                                                    : "bg-slate-100 text-slate-400 dark:bg-slate-900 dark:text-slate-600"
                                            )}>
                                                {item.medium}
                                            </span>
                                        </td>
                                        <td className="py-2.5 text-center">
                                            <span className={cn(
                                                "inline-flex justify-center items-center h-5 w-8 rounded-md text-[10px] font-extrabold tabular-nums",
                                                item.low > 0 
                                                    ? "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/10" 
                                                    : "bg-slate-100 text-slate-400 dark:bg-slate-900 dark:text-slate-600"
                                            )}>
                                                {item.low}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {expiryRiskHeatmap.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground italic">Tidak ada data risiko</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 2. Renewal Success vs Failure by Category */}
                <div className="lg:col-span-6 border border-border/60 bg-card/45 backdrop-blur-md rounded-2xl p-5 shadow-xs transition-all duration-300 dark:border-slate-800/60 dark:bg-slate-900/15 flex flex-col justify-between">
                    <div>
                        <h3 className="text-foreground text-xs font-extrabold tracking-wider uppercase">Laju Kegagalan Perpanjangan per Kategori</h3>
                        <p className="text-muted-foreground text-[9px] font-semibold mt-0.5">Analisis jumlah kontrak jatuh tempo yang diperpanjang (sukses) vs dibiarkan berakhir (gagal) per kategori.</p>
                    </div>
                    <div className="h-[220px] w-full mt-4 select-none">
                        {isMounted ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={renewalFailureByCategory}
                                    margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120, 120, 120, 0.05)" />
                                    <XAxis dataKey="category" fontSize={9} stroke="rgba(120, 120, 120, 0.5)" tickLine={false} axisLine={false} />
                                    <YAxis fontSize={9} stroke="rgba(120, 120, 120, 0.5)" tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                            borderColor: 'rgba(255, 255, 255, 0.1)',
                                            borderRadius: '12px',
                                            fontSize: '10px',
                                            color: '#f8fafc'
                                        }}
                                    />
                                    <Legend
                                        verticalAlign="top"
                                        height={36}
                                        iconSize={8}
                                        iconType="circle"
                                        wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }}
                                    />
                                    <Bar dataKey="renewed" name="Diperpanjang (Sukses)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={10} />
                                    <Bar dataKey="failed" name="Dibiarkan Selesai (Failure)" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={10} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-xs text-muted-foreground flex items-center justify-center h-full">Memuat...</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* 3. Vendor Performance Matriks */}
                <div className="lg:col-span-7 border border-border/60 bg-card/45 backdrop-blur-md rounded-2xl p-5 shadow-xs transition-all duration-300 dark:border-slate-800/60 dark:bg-slate-900/15 flex flex-col justify-between">
                    <div>
                        <h3 className="text-foreground text-xs font-extrabold tracking-wider uppercase flex items-center gap-2">
                            <Award className="h-4 w-4 text-primary" />
                            Matriks Kinerja Kerja Sama Vendor
                        </h3>
                        <p className="text-muted-foreground text-[9px] font-semibold mt-0.5">Analisis efektivitas vendor berdasarkan rasio perpanjangan dan waktu penyusunan kontrak.</p>
                    </div>
                    <div className="overflow-x-auto mt-4">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border/10">
                                    <th className="py-2 text-[8.5px] font-extrabold uppercase text-muted-foreground tracking-wider">Mitra / Vendor</th>
                                    <th className="py-2 text-[8.5px] font-extrabold uppercase text-muted-foreground tracking-wider text-center">Total Kontrak</th>
                                    <th className="py-2 text-[8.5px] font-extrabold uppercase text-muted-foreground tracking-wider text-center">Rasio Renewal</th>
                                    <th className="py-2 text-[8.5px] font-extrabold uppercase text-muted-foreground tracking-wider text-center">Waktu Siklus Avg</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vendorPerformance.map((v: any, idx: number) => (
                                    <tr key={idx} className="border-b border-border/5 hover:bg-muted/15 dark:hover:bg-slate-900/10 transition-colors">
                                        <td className="py-2.5 text-[10px] font-bold text-foreground truncate max-w-[150px]">{v.name}</td>
                                        <td className="py-2.5 text-center text-[10px] font-extrabold text-foreground tabular-nums">{v.total}</td>
                                        <td className="py-2.5 text-center">
                                            <span className={cn(
                                                "inline-flex px-1.5 py-0.5 rounded text-[8.5px] font-extrabold uppercase",
                                                v.renewal_rate >= 80 
                                                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/10'
                                                    : v.renewal_rate >= 40
                                                        ? 'bg-amber-500/10 text-amber-600 border border-amber-500/10'
                                                        : 'bg-rose-500/10 text-rose-600 border border-rose-500/10'
                                            )}>
                                                {v.renewal_rate}%
                                            </span>
                                        </td>
                                        <td className="py-2.5 text-center text-[10px] font-extrabold text-muted-foreground tabular-nums">{v.avg_cycle_time} Hari</td>
                                    </tr>
                                ))}
                                {vendorPerformance.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground italic">Tidak ada data vendor</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 4. Value Distribution Histogram */}
                <div className="lg:col-span-5 border border-border/60 bg-card/45 backdrop-blur-md rounded-2xl p-5 shadow-xs transition-all duration-300 dark:border-slate-800/60 dark:bg-slate-900/15 flex flex-col justify-between">
                    <div>
                        <h3 className="text-foreground text-xs font-extrabold tracking-wider uppercase">Distribusi Rentang Nilai Kontrak</h3>
                        <p className="text-muted-foreground text-[9px] font-semibold mt-0.5">Pengelompokkan kontrak berdasarkan nilai finansialnya.</p>
                    </div>
                    <div className="h-[200px] w-full mt-4 select-none">
                        {isMounted ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={valueDistribution}
                                    margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120, 120, 120, 0.05)" />
                                    <XAxis dataKey="range" fontSize={9} stroke="rgba(120, 120, 120, 0.5)" tickLine={false} axisLine={false} />
                                    <YAxis fontSize={9} stroke="rgba(120, 120, 120, 0.5)" tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                            borderColor: 'rgba(255, 255, 255, 0.1)',
                                            borderRadius: '12px',
                                            fontSize: '10px',
                                            color: '#f8fafc'
                                        }}
                                    />
                                    <Bar dataKey="count" name="Jumlah Kontrak" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-xs text-muted-foreground flex items-center justify-center h-full">Memuat...</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* 5. Budget Allocation Treemap/Pie */}
                <div className="lg:col-span-5 border border-border/60 bg-card/45 backdrop-blur-md rounded-2xl p-5 shadow-xs transition-all duration-300 dark:border-slate-800/60 dark:bg-slate-900/15 flex flex-col justify-between">
                    <div>
                        <h3 className="text-foreground text-xs font-extrabold tracking-wider uppercase">Alokasi Anggaran per Kategori</h3>
                        <p className="text-muted-foreground text-[9px] font-semibold mt-0.5">Proporsi total nilai finansial kontrak berdasarkan kategori.</p>
                    </div>
                    <div className="h-[200px] w-full mt-4 flex items-center justify-center relative select-none">
                        {isMounted && budgetAllocation.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={budgetAllocation}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={45}
                                        outerRadius={65}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {budgetAllocation.map((entry: any, index: number) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={BUDGET_COLORS[index % BUDGET_COLORS.length]}
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
                                        formatter={(v: any) => [formatIDR(v), "Total Anggaran"]}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-xs text-muted-foreground">Tidak ada data alokasi</div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2 border-t border-border/20 pt-4 dark:border-slate-800/40">
                        {budgetAllocation.map((item: any, index: number) => (
                            <div key={item.name} className="flex items-center gap-1.5">
                                <span
                                    className="h-2 w-2 rounded-full shrink-0"
                                    style={{ backgroundColor: BUDGET_COLORS[index % BUDGET_COLORS.length] }}
                                />
                                <span className="text-muted-foreground text-[9px] font-semibold truncate flex-1">{item.name}</span>
                                <span className="text-foreground text-[9.5px] font-extrabold tabular-nums">{formatIDR(item.value)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 6. Average Department Approval Duration */}
                <div className="lg:col-span-7 border border-border/60 bg-card/45 backdrop-blur-md rounded-2xl p-5 shadow-xs transition-all duration-300 dark:border-slate-800/60 dark:bg-slate-900/15 flex flex-col justify-between">
                    <div>
                        <h3 className="text-foreground text-xs font-extrabold tracking-wider uppercase flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-500" />
                            Rata-rata Durasi Persetujuan per Divisi
                        </h3>
                        <p className="text-muted-foreground text-[9px] font-semibold mt-0.5">Analisis efisiensi birokrasi per divisi dihitung sejak pembuatan hingga disetujui penuh.</p>
                    </div>
                    <div className="h-[240px] w-full mt-4 select-none">
                        {isMounted ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={approvalDurationByDept}
                                    margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120, 120, 120, 0.05)" />
                                    <XAxis dataKey="department" fontSize={9} stroke="rgba(120, 120, 120, 0.5)" tickLine={false} axisLine={false} tickFormatter={(v) => v.length > 15 ? `${v.substring(0, 13)}...` : v} />
                                    <YAxis fontSize={9} stroke="rgba(120, 120, 120, 0.5)" tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                            borderColor: 'rgba(255, 255, 255, 0.1)',
                                            borderRadius: '12px',
                                            fontSize: '10px',
                                            color: '#f8fafc'
                                        }}
                                        formatter={(v: any) => [`${v} Hari`, "Rata-rata Durasi"]}
                                    />
                                    <Bar dataKey="avg_days" name="Rata-rata Hari" fill="#fb923c" radius={[4, 4, 0, 0]} barSize={16} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-xs text-muted-foreground flex items-center justify-center h-full">Memuat...</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
