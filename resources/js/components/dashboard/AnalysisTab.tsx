import { useEffect, useState } from 'react';
import {
    Activity,
    ShieldAlert,
    Building2,
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
    Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/base/Card';

interface AnalysisTabProps {
    data: any;
}

export function AnalysisTab({ data }: AnalysisTabProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const expiryRiskHeatmap = data?.expiryRiskHeatmap || [];
    const renewalFailureByCategory = data?.renewalFailureByCategory || [];
    const vendorPerformance = data?.vendorPerformance || [];
    const valueDistribution = data?.valueDistribution || [];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* 1. Expiry Risk Heatmap */}
                <Card className="lg:col-span-6">
                    <CardHeader className="p-5 pb-0">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2 text-text-main">
                            <ShieldAlert className="h-4 w-4 text-danger" />
                            Matriks Risiko Masa Berlaku per Divisi
                        </CardTitle>
                        <p className="text-text-desc text-[9px] font-semibold mt-0.5">Analisis risiko kontrak aktif berdasarkan waktu sisa (High: &lt; 30 hari, Med: 30-90 hari, Low: &gt; 90 hari).</p>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-surface-border/10">
                                        <th className="py-2 text-[8.5px] font-medium uppercase text-text-desc tracking-wider">Divisi / Departemen</th>
                                        <th className="py-2 text-[8.5px] font-medium uppercase text-text-desc tracking-wider text-center">Risiko Tinggi</th>
                                        <th className="py-2 text-[8.5px] font-medium uppercase text-text-desc tracking-wider text-center">Risiko Sedang</th>
                                        <th className="py-2 text-[8.5px] font-medium uppercase text-text-desc tracking-wider text-center">Risiko Rendah</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expiryRiskHeatmap.map((item: any, idx: number) => (
                                        <tr key={idx} className="border-b border-surface-border/5 hover:bg-surface-muted/30 transition-colors">
                                            <td className="py-2.5 text-[10px] font-medium text-text-main flex items-center gap-2">
                                                <Building2 size={11} className="text-text-desc" />
                                                {item.department}
                                            </td>
                                            <td className="py-2.5 text-center">
                                                <span className={cn(
                                                    "inline-flex justify-center items-center h-5 w-8 rounded-md text-[10px] font-medium tabular-nums",
                                                    item.high > 0
                                                        ? "bg-danger/15 text-danger border border-danger/10 animate-pulse"
                                                        : "bg-surface-muted text-text-desc"
                                                )}>
                                                    {item.high}
                                                </span>
                                            </td>
                                            <td className="py-2.5 text-center">
                                                <span className={cn(
                                                    "inline-flex justify-center items-center h-5 w-8 rounded-md text-[10px] font-medium tabular-nums",
                                                    item.medium > 0
                                                        ? "bg-warning/15 text-warning border border-warning/10"
                                                        : "bg-surface-muted text-text-desc"
                                                )}>
                                                    {item.medium}
                                                </span>
                                            </td>
                                            <td className="py-2.5 text-center">
                                                <span className={cn(
                                                    "inline-flex justify-center items-center h-5 w-8 rounded-md text-[10px] font-medium tabular-nums",
                                                    item.low > 0
                                                        ? "bg-success/15 text-success border border-success/10"
                                                        : "bg-surface-muted text-text-desc"
                                                )}>
                                                    {item.low}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {expiryRiskHeatmap.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-[10px] font-medium uppercase tracking-wider text-text-desc">Tidak ada data risiko</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Renewal Success vs Failure by Category */}
                <Card className="lg:col-span-6">
                    <CardHeader className="p-5 pb-0">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-text-main">Laju Kegagalan Perpanjangan per Kategori</CardTitle>
                        <p className="text-text-desc text-[9px] font-semibold mt-0.5">Analisis jumlah kontrak jatuh tempo yang diperpanjang (sukses) vs dibiarkan berakhir (gagal) per kategori.</p>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="h-[220px] w-full select-none">
                            {isMounted ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={renewalFailureByCategory}
                                        margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--surface-border)" />
                                        <XAxis dataKey="category" fontSize={9} stroke="var(--text-desc)" tickLine={false} axisLine={false} opacity={0.5} />
                                        <YAxis fontSize={10} fontWeight={500} stroke="#64748b" tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--surface-base)',
                                                border: '1px solid var(--surface-border)',
                                                borderRadius: '8px',
                                                fontSize: '10px',
                                                color: 'var(--text-main)'
                                            }}
                                            itemStyle={{ color: 'var(--text-main)' }}
                                        />
                                        <Legend
                                            verticalAlign="top"
                                            height={36}
                                            iconSize={8}
                                            iconType="circle"
                                            wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }}
                                        />
                                        <Bar dataKey="renewed" name="Diperpanjang (Sukses)" fill="var(--success)" radius={[4, 4, 0, 0]} barSize={10} />
                                        <Bar dataKey="failed" name="Dibiarkan Selesai (Failure)" fill="var(--danger)" radius={[4, 4, 0, 0]} barSize={10} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center gap-2 opacity-30 text-center justify-center h-full">
                                    <Activity size={32} />
                                    <p className="text-[10px] font-medium uppercase">Memuat...</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* 3. Vendor Performance Matriks */}
                <Card className="lg:col-span-7">
                    <CardHeader className="p-5 pb-0">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2 text-text-main">
                            <Award className="h-4 w-4 text-primary" />
                            Matriks Kinerja Kerja Sama Vendor
                        </CardTitle>
                        <p className="text-text-desc text-[9px] font-semibold mt-0.5">Analisis efektivitas vendor berdasarkan rasio perpanjangan dan waktu penyusunan kontrak.</p>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-surface-border/10">
                                        <th className="py-2 text-[8.5px] font-medium uppercase text-text-desc tracking-wider">Mitra / Vendor</th>
                                        <th className="py-2 text-[8.5px] font-medium uppercase text-text-desc tracking-wider text-center">Total Kontrak</th>
                                        <th className="py-2 text-[8.5px] font-medium uppercase text-text-desc tracking-wider text-center">Rasio Renewal</th>
                                        <th className="py-2 text-[8.5px] font-medium uppercase text-text-desc tracking-wider text-center">Waktu Siklus Avg</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vendorPerformance.map((v: any, idx: number) => (
                                        <tr key={idx} className="border-b border-surface-border/5 hover:bg-surface-muted/30 transition-colors">
                                            <td className="py-2.5 text-[10px] font-medium text-text-main truncate max-w-[150px]">{v.name}</td>
                                            <td className="py-2.5 text-center text-[10px] font-medium text-text-main tabular-nums">{v.total}</td>
                                            <td className="py-2.5 text-center">
                                                <span className={cn(
                                                    "inline-flex px-1.5 py-0.5 rounded text-[8.5px] font-medium uppercase",
                                                    v.renewal_rate >= 80
                                                        ? 'bg-success/10 text-success border border-success/10'
                                                        : v.renewal_rate >= 40
                                                            ? 'bg-warning/10 text-warning border border-warning/10'
                                                            : 'bg-danger/10 text-danger border border-danger/10'
                                                )}>
                                                    {v.renewal_rate}%
                                                </span>
                                            </td>
                                            <td className="py-2.5 text-center text-[10px] font-medium text-text-desc tabular-nums">{v.avg_cycle_time} Hari</td>
                                        </tr>
                                    ))}
                                    {vendorPerformance.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-[10px] font-medium uppercase tracking-wider text-text-desc font-semibold">Tidak ada data vendor</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Value Distribution Histogram */}
                <Card className="lg:col-span-5">
                    <CardHeader className="p-5 pb-0">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-text-main">Distribusi Rentang Nilai Kontrak</CardTitle>
                        <p className="text-text-desc text-[9px] font-semibold mt-0.5">Pengelompokkan kontrak berdasarkan nilai finansialnya.</p>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="h-[200px] w-full select-none">
                            {isMounted ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={valueDistribution}
                                        margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--surface-border)" />
                                        <XAxis dataKey="range" fontSize={9} stroke="var(--text-desc)" tickLine={false} axisLine={false} opacity={0.5} />
                                        <YAxis fontSize={10} fontWeight={500} stroke="#64748b" tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--surface-base)',
                                                border: '1px solid var(--surface-border)',
                                                borderRadius: '8px',
                                                fontSize: '10px',
                                                color: 'var(--text-main)'
                                            }}
                                            itemStyle={{ color: 'var(--text-main)' }}
                                        />
                                        <Bar dataKey="count" name="Jumlah Kontrak" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={32} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center gap-2 opacity-30 text-center justify-center h-full">
                                    <Activity size={32} />
                                    <p className="text-[10px] font-medium uppercase">Memuat...</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

