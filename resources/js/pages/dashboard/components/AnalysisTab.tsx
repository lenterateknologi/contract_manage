import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/base/Card';
import { cn } from '@/lib/utils';
import { Activity, Award, Building2, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

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
                        <CardTitle className="text-text-main flex items-center gap-2 text-xs font-semibold  uppercase">
                            <ShieldAlert className="text-danger h-4 w-4" />
                            Matriks Risiko Masa Berlaku per Divisi
                        </CardTitle>
                        <p className="text-text-desc mt-0.5 text-[9px] font-semibold">
                            Analisis risiko kontrak aktif berdasarkan waktu sisa (High: &lt; 30 hari, Med: 30-90 hari, Low: &gt; 90 hari).
                        </p>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left">
                                <thead>
                                    <tr className="border-surface-border/10 border-b">
                                        <th className="text-text-desc py-2 text-[8.5px] font-medium  uppercase">Divisi / Departemen</th>
                                        <th className="text-text-desc py-2 text-center text-[8.5px] font-medium  uppercase">
                                            Risiko Tinggi
                                        </th>
                                        <th className="text-text-desc py-2 text-center text-[8.5px] font-medium  uppercase">
                                            Risiko Sedang
                                        </th>
                                        <th className="text-text-desc py-2 text-center text-[8.5px] font-medium  uppercase">
                                            Risiko Rendah
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expiryRiskHeatmap.map((item: any, idx: number) => (
                                        <tr key={idx} className="border-surface-border/5 hover:bg-surface-muted/30 border-b transition-colors">
                                            <td className="text-text-main flex items-center gap-2 py-2.5 text-[10px] font-medium">
                                                <Building2 size={11} className="text-text-desc" />
                                                {item.department}
                                            </td>
                                            <td className="py-2.5 text-center">
                                                <span
                                                    className={cn(
                                                        'inline-flex h-5 w-8 items-center justify-center rounded-md text-[10px] font-medium tabular-nums',
                                                        item.high > 0
                                                            ? 'bg-danger/15 text-danger border-danger/10 animate-pulse border'
                                                            : 'bg-surface-muted text-text-desc',
                                                    )}
                                                >
                                                    {item.high}
                                                </span>
                                            </td>
                                            <td className="py-2.5 text-center">
                                                <span
                                                    className={cn(
                                                        'inline-flex h-5 w-8 items-center justify-center rounded-md text-[10px] font-medium tabular-nums',
                                                        item.medium > 0
                                                            ? 'bg-warning/15 text-warning border-warning/10 border'
                                                            : 'bg-surface-muted text-text-desc',
                                                    )}
                                                >
                                                    {item.medium}
                                                </span>
                                            </td>
                                            <td className="py-2.5 text-center">
                                                <span
                                                    className={cn(
                                                        'inline-flex h-5 w-8 items-center justify-center rounded-md text-[10px] font-medium tabular-nums',
                                                        item.low > 0
                                                            ? 'bg-success/15 text-success border-success/10 border'
                                                            : 'bg-surface-muted text-text-desc',
                                                    )}
                                                >
                                                    {item.low}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {expiryRiskHeatmap.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="text-text-desc py-8 text-center text-[10px] font-medium  uppercase"
                                            >
                                                Tidak ada data risiko
                                            </td>
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
                        <CardTitle className="text-text-main text-xs font-semibold  uppercase">
                            Laju Kegagalan Perpanjangan per Kategori
                        </CardTitle>
                        <p className="text-text-desc mt-0.5 text-[9px] font-semibold">
                            Analisis jumlah kontrak jatuh tempo yang diperpanjang (sukses) vs dibiarkan berakhir (gagal) per kategori.
                        </p>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="h-[220px] w-full select-none">
                            {isMounted ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={renewalFailureByCategory} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--surface-border)" />
                                        <XAxis
                                            dataKey="category"
                                            fontSize={9}
                                            stroke="var(--text-desc)"
                                            tickLine={false}
                                            axisLine={false}
                                            opacity={0.5}
                                        />
                                        <YAxis fontSize={10} fontWeight={500} stroke="#64748b" tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--surface-base)',
                                                border: '1px solid var(--surface-border)',
                                                borderRadius: '8px',
                                                fontSize: '10px',
                                                color: 'var(--text-main)',
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
                                        <Bar
                                            dataKey="renewed"
                                            name="Diperpanjang (Sukses)"
                                            fill="var(--success)"
                                            radius={[4, 4, 0, 0]}
                                            barSize={10}
                                        />
                                        <Bar
                                            dataKey="failed"
                                            name="Dibiarkan Selesai (Failure)"
                                            fill="var(--danger)"
                                            radius={[4, 4, 0, 0]}
                                            barSize={10}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center gap-2 text-center opacity-30">
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
                        <CardTitle className="text-text-main flex items-center gap-2 text-xs font-semibold  uppercase">
                            <Award className="text-primary h-4 w-4" />
                            Matriks Kinerja Kerja Sama Vendor
                        </CardTitle>
                        <p className="text-text-desc mt-0.5 text-[9px] font-semibold">
                            Analisis efektivitas vendor berdasarkan rasio perpanjangan dan waktu penyusunan kontrak.
                        </p>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left">
                                <thead>
                                    <tr className="border-surface-border/10 border-b">
                                        <th className="text-text-desc py-2 text-[8.5px] font-medium  uppercase">Mitra / Vendor</th>
                                        <th className="text-text-desc py-2 text-center text-[8.5px] font-medium  uppercase">
                                            Total Kontrak
                                        </th>
                                        <th className="text-text-desc py-2 text-center text-[8.5px] font-medium  uppercase">
                                            Rasio Renewal
                                        </th>
                                        <th className="text-text-desc py-2 text-center text-[8.5px] font-medium  uppercase">
                                            Waktu Siklus Avg
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vendorPerformance.map((v: any, idx: number) => (
                                        <tr key={idx} className="border-surface-border/5 hover:bg-surface-muted/30 border-b transition-colors">
                                            <td className="text-text-main max-w-[150px] truncate py-2.5 text-[10px] font-medium">{v.name}</td>
                                            <td className="text-text-main py-2.5 text-center text-[10px] font-medium tabular-nums">{v.total}</td>
                                            <td className="py-2.5 text-center">
                                                <span
                                                    className={cn(
                                                        'inline-flex rounded px-1.5 py-0.5 text-[8.5px] font-medium uppercase',
                                                        v.renewal_rate >= 80
                                                            ? 'bg-success/10 text-success border-success/10 border'
                                                            : v.renewal_rate >= 40
                                                                ? 'bg-warning/10 text-warning border-warning/10 border'
                                                                : 'bg-danger/10 text-danger border-danger/10 border',
                                                    )}
                                                >
                                                    {v.renewal_rate}%
                                                </span>
                                            </td>
                                            <td className="text-text-desc py-2.5 text-center text-[10px] font-medium tabular-nums">
                                                {v.avg_cycle_time} Hari
                                            </td>
                                        </tr>
                                    ))}
                                    {vendorPerformance.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="text-text-desc py-8 text-center text-[10px] font-medium font-semibold  uppercase"
                                            >
                                                Tidak ada data vendor
                                            </td>
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
                        <CardTitle className="text-text-main text-xs font-semibold  uppercase">
                            Distribusi Rentang Nilai Kontrak
                        </CardTitle>
                        <p className="text-text-desc mt-0.5 text-[9px] font-semibold">Pengelompokkan kontrak berdasarkan nilai finansialnya.</p>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="h-[200px] w-full select-none">
                            {isMounted ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={valueDistribution} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--surface-border)" />
                                        <XAxis
                                            dataKey="range"
                                            fontSize={9}
                                            stroke="var(--text-desc)"
                                            tickLine={false}
                                            axisLine={false}
                                            opacity={0.5}
                                        />
                                        <YAxis fontSize={10} fontWeight={500} stroke="#64748b" tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--surface-base)',
                                                border: '1px solid var(--surface-border)',
                                                borderRadius: '8px',
                                                fontSize: '10px',
                                                color: 'var(--text-main)',
                                            }}
                                            itemStyle={{ color: 'var(--text-main)' }}
                                        />
                                        <Bar dataKey="count" name="Jumlah Kontrak" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={32} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center gap-2 text-center opacity-30">
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
