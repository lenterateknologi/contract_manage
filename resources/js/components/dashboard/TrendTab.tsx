import { useEffect, useState } from 'react';
import {
    Activity,
} from 'lucide-react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/base/Card';

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

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* 1. Monthly Volume Growth */}
                <Card>
                    <CardHeader className="p-5 pb-0">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider">Pertumbuhan Kontrak Bulanan</CardTitle>
                        <p className="text-muted-foreground text-[9px] font-semibold mt-0.5">Tren penambahan volume kontrak baru selama 6 bulan terakhir.</p>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="h-[220px] w-full select-none">
                            {isMounted ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={monthlyTrendData}
                                        margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0, 0, 0, 0.05)" />
                                        <XAxis dataKey="month" fontSize={9} stroke="rgba(120, 120, 120, 0.5)" tickLine={false} axisLine={false} />
                                        <YAxis fontSize={9} stroke="rgba(120, 120, 120, 0.5)" tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontSize: '10px',
                                                color: '#fff'
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
                                <div className="flex flex-col items-center gap-2 opacity-30 text-center justify-center h-full">
                                    <Activity size={32} />
                                    <p className="text-[10px] font-bold uppercase">Memuat...</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Monthly Value Trend */}
                <Card>
                    <CardHeader className="p-5 pb-0">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider">Tren Nilai Kontrak Bulanan</CardTitle>
                        <p className="text-muted-foreground text-[9px] font-semibold mt-0.5">Akumulasi finansial dari kontrak-kontrak baru yang masuk per bulan.</p>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="h-[220px] w-full select-none">
                            {isMounted ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={monthlyTrendData}
                                        margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                                    >
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0, 0, 0, 0.05)" />
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
                                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontSize: '10px',
                                                color: '#fff'
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
                                <div className="flex flex-col items-center gap-2 opacity-30 text-center justify-center h-full">
                                    <Activity size={32} />
                                    <p className="text-[10px] font-bold uppercase">Memuat...</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* 3. Renewal vs Expired Trend */}
                <Card>
                    <CardHeader className="p-5 pb-0">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider">Perbandingan Renewal vs Kadaluarsa</CardTitle>
                        <p className="text-muted-foreground text-[9px] font-semibold mt-0.5">Analisis laju perpanjangan kontrak dibanding jumlah kontrak yang berakhir.</p>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="h-[220px] w-full select-none">
                            {isMounted ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={renewalVsExpiredData}
                                        margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0, 0, 0, 0.05)" />
                                        <XAxis dataKey="month" fontSize={9} stroke="rgba(120, 120, 120, 0.5)" tickLine={false} axisLine={false} />
                                        <YAxis fontSize={9} stroke="rgba(120, 120, 120, 0.5)" tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontSize: '10px',
                                                color: '#fff'
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
                                <div className="flex flex-col items-center gap-2 opacity-30 text-center justify-center h-full">
                                    <Activity size={32} />
                                    <p className="text-[10px] font-bold uppercase">Memuat...</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Approval Outcomes (Stacked Area) */}
                <Card>
                    <CardHeader className="p-5 pb-0">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider">Output Hasil Kelayakan Kontrak</CardTitle>
                        <p className="text-muted-foreground text-[9px] font-semibold mt-0.5">Distribusi penyelesaian status persetujuan kontrak bulanan.</p>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="h-[220px] w-full select-none">
                            {isMounted ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={monthlyApprovalData}
                                        margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0, 0, 0, 0.05)" />
                                        <XAxis dataKey="month" fontSize={9} stroke="rgba(120, 120, 120, 0.5)" tickLine={false} axisLine={false} />
                                        <YAxis fontSize={9} stroke="rgba(120, 120, 120, 0.5)" tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontSize: '10px',
                                                color: '#fff'
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
                                <div className="flex flex-col items-center gap-2 opacity-30 text-center justify-center h-full">
                                    <Activity size={32} />
                                    <p className="text-[10px] font-bold uppercase">Memuat...</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
