import { useEffect, useState } from 'react';
import {
    TrendingUp,
    BarChart3,
    Layers,
    Users,
    Activity,
    ArrowUpRight,
    Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';

interface TrendTabProps {
    data: any;
}

export function TrendTab({ data }: TrendTabProps) {
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

    const monthlyTrendData = data?.monthlyTrend || [];
    const renewalVsExpiredData = data?.renewalVsExpiredTrend || [];
    const monthlyApprovalData = data?.monthlyApprovalTrend || [];
    const topVendorsData = data?.topVendors || [];
    const categoryTrendData = data?.categoryTrend || [];

    // Dynamically retrieve category keys for Category Trend Line Chart
    const categoryKeys = isMounted && categoryTrendData.length > 0
        ? Object.keys(categoryTrendData[0]).filter(k => k !== 'month')
        : [];

    const categoryColors = [
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
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* 1. Monthly Volume Growth */}
                <div className="border border-border/60 bg-card/45 backdrop-blur-md rounded-2xl p-5 shadow-xs transition-all duration-300 dark:border-slate-800/60 dark:bg-slate-900/15 flex flex-col justify-between">
                    <div>
                        <h3 className="text-foreground text-xs font-extrabold tracking-wider uppercase">Pertumbuhan Kontrak Bulanan</h3>
                        <p className="text-muted-foreground text-[9px] font-semibold mt-0.5">Tren penambahan volume kontrak baru selama 6 bulan terakhir.</p>
                    </div>
                    <div className="h-[220px] w-full mt-4 select-none">
                        {isMounted ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={monthlyTrendData}
                                    margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120, 120, 120, 0.05)" />
                                    <XAxis dataKey="month" fontSize={9} stroke="rgba(120, 120, 120, 0.5)" tickLine={false} axisLine={false} />
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
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        name="Jumlah Kontrak"
                                        stroke="#6366f1"
                                        strokeWidth={2}
                                        dot={{ r: 4, strokeWidth: 1 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-xs text-muted-foreground flex items-center justify-center h-full">Memuat...</div>
                        )}
                    </div>
                </div>

                {/* 2. Monthly Value Trend */}
                <div className="border border-border/60 bg-card/45 backdrop-blur-md rounded-2xl p-5 shadow-xs transition-all duration-300 dark:border-slate-800/60 dark:bg-slate-900/15 flex flex-col justify-between">
                    <div>
                        <h3 className="text-foreground text-xs font-extrabold tracking-wider uppercase">Tren Nilai Kontrak Bulanan</h3>
                        <p className="text-muted-foreground text-[9px] font-semibold mt-0.5">Akumulasi finansial dari kontrak-kontrak baru yang masuk per bulan.</p>
                    </div>
                    <div className="h-[220px] w-full mt-4 select-none">
                        {isMounted ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={monthlyTrendData}
                                    margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                                >
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120, 120, 120, 0.05)" />
                                    <XAxis dataKey="month" fontSize={9} stroke="rgba(120, 120, 120, 0.5)" tickLine={false} axisLine={false} />
                                    <YAxis
                                        fontSize={9}
                                        stroke="rgba(120, 120, 120, 0.5)"
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(v) => formatIDR(v)}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                            borderColor: 'rgba(255, 255, 255, 0.1)',
                                            borderRadius: '12px',
                                            fontSize: '10px',
                                            color: '#f8fafc'
                                        }}
                                        formatter={(v: any) => [formatIDR(v), "Nilai"]}
                                    />
                                    <Legend
                                        verticalAlign="top"
                                        height={36}
                                        iconSize={8}
                                        iconType="circle"
                                        wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        name="Nilai Kontrak"
                                        stroke="#10b981"
                                        fillOpacity={1}
                                        fill="url(#colorValue)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-xs text-muted-foreground flex items-center justify-center h-full">Memuat...</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* 3. Renewal vs Expired Trend */}
                <div className="border border-border/60 bg-card/45 backdrop-blur-md rounded-2xl p-5 shadow-xs transition-all duration-300 dark:border-slate-800/60 dark:bg-slate-900/15 flex flex-col justify-between">
                    <div>
                        <h3 className="text-foreground text-xs font-extrabold tracking-wider uppercase">Perbandingan Renewal vs Kadaluarsa</h3>
                        <p className="text-muted-foreground text-[9px] font-semibold mt-0.5">Analisis laju perpanjangan kontrak dibanding jumlah kontrak yang berakhir.</p>
                    </div>
                    <div className="h-[220px] w-full mt-4 select-none">
                        {isMounted ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={renewalVsExpiredData}
                                    margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120, 120, 120, 0.05)" />
                                    <XAxis dataKey="month" fontSize={9} stroke="rgba(120, 120, 120, 0.5)" tickLine={false} axisLine={false} />
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
                                    <Line type="monotone" dataKey="renewed" name="Diperpanjang (Renewal)" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                                    <Line type="monotone" dataKey="expired" name="Habis Masa Berlaku" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-xs text-muted-foreground flex items-center justify-center h-full">Memuat...</div>
                        )}
                    </div>
                </div>

                {/* 4. Approval Outcomes (Stacked Area) */}
                <div className="border border-border/60 bg-card/45 backdrop-blur-md rounded-2xl p-5 shadow-xs transition-all duration-300 dark:border-slate-800/60 dark:bg-slate-900/15 flex flex-col justify-between">
                    <div>
                        <h3 className="text-foreground text-xs font-extrabold tracking-wider uppercase">Output Hasil Kelayakan Kontrak</h3>
                        <p className="text-muted-foreground text-[9px] font-semibold mt-0.5">Distribusi penyelesaian status persetujuan kontrak bulanan.</p>
                    </div>
                    <div className="h-[220px] w-full mt-4 select-none">
                        {isMounted ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={monthlyApprovalData}
                                    margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120, 120, 120, 0.05)" />
                                    <XAxis dataKey="month" fontSize={9} stroke="rgba(120, 120, 120, 0.5)" tickLine={false} axisLine={false} />
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
                                    <Area type="monotone" dataKey="approved" stackId="1" name="Disetujui" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                                    <Area type="monotone" dataKey="pending" stackId="1" name="Pending" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} />
                                    <Area type="monotone" dataKey="revision" stackId="1" name="Revisi" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} />
                                    <Area type="monotone" dataKey="rejected" stackId="1" name="Ditolak" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.15} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-xs text-muted-foreground flex items-center justify-center h-full">Memuat...</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* 5. Top Vendor Activity */}
                <div className="lg:col-span-5 border border-border/60 bg-card/45 backdrop-blur-md rounded-2xl p-5 shadow-xs transition-all duration-300 dark:border-slate-800/60 dark:bg-slate-900/15 flex flex-col justify-between">
                    <div>
                        <h3 className="text-foreground text-xs font-extrabold tracking-wider uppercase">Mitra / Vendor Utama</h3>
                        <p className="text-muted-foreground text-[9px] font-semibold mt-0.5">Top 5 vendor berdasarkan nilai kumulatif kerja sama.</p>
                    </div>
                    <div className="h-[240px] w-full mt-4 select-none">
                        {isMounted ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={topVendorsData}
                                    layout="vertical"
                                    margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(120, 120, 120, 0.05)" />
                                    <XAxis type="number" fontSize={9} stroke="rgba(120, 120, 120, 0.5)" tickLine={false} axisLine={false} tickFormatter={(v) => formatIDR(v)} />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        fontSize={9}
                                        stroke="rgba(120, 120, 120, 0.7)"
                                        tickLine={false}
                                        axisLine={false}
                                        width={100}
                                        tickFormatter={(v) => v.length > 15 ? `${v.substring(0, 13)}...` : v}
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
                                        formatter={(v: any) => [formatIDR(v), "Total Nilai"]}
                                    />
                                    <Bar dataKey="value" name="Total Nilai" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={12} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-xs text-muted-foreground flex items-center justify-center h-full">Memuat...</div>
                        )}
                    </div>
                </div>

                {/* 6. Category Volume Trend */}
                <div className="lg:col-span-7 border border-border/60 bg-card/45 backdrop-blur-md rounded-2xl p-5 shadow-xs transition-all duration-300 dark:border-slate-800/60 dark:bg-slate-900/15 flex flex-col justify-between">
                    <div>
                        <h3 className="text-foreground text-xs font-extrabold tracking-wider uppercase">Tren Volume Kategori Kontrak</h3>
                        <p className="text-muted-foreground text-[9px] font-semibold mt-0.5">Perkembangan jumlah kontrak masuk dikelompokkan per kategori.</p>
                    </div>
                    <div className="h-[240px] w-full mt-4 select-none">
                        {isMounted ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={categoryTrendData}
                                    margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120, 120, 120, 0.05)" />
                                    <XAxis dataKey="month" fontSize={9} stroke="rgba(120, 120, 120, 0.5)" tickLine={false} axisLine={false} />
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
                                    {categoryKeys.map((catKey, idx) => (
                                        <Line
                                            key={catKey}
                                            type="monotone"
                                            dataKey={catKey}
                                            stroke={categoryColors[idx % categoryColors.length]}
                                            strokeWidth={1.8}
                                            dot={{ r: 2 }}
                                        />
                                    ))}
                                </LineChart>
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
