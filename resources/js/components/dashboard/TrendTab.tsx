import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/base/Card';
import { Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { formatCurrency } from '@/lib/utils';

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
        return formatCurrency(value);
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
                        <CardTitle className="text-text-main text-xs font-semibold tracking-wider uppercase">Pertumbuhan Kontrak Bulanan</CardTitle>
                        <p className="text-text-desc mt-0.5 text-[9px] font-semibold">Tren penambahan volume kontrak baru selama 6 bulan terakhir.</p>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="h-[220px] w-full select-none">
                            {isMounted ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        style={{ outline: 'none' }}
                                        data={monthlyTrendData}
                                        margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--surface-border)" />
                                        <XAxis dataKey="month" fontSize={9} stroke="var(--text-desc)" tickLine={false} axisLine={false} />
                                        <YAxis fontSize={9} stroke="var(--text-desc)" tickLine={false} axisLine={false} />
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
                                        <Line
                                            type="monotone"
                                            dataKey="count"
                                            name="Jumlah Kontrak"
                                            stroke="var(--primary)"
                                            strokeWidth={2}
                                            dot={{ r: 4, strokeWidth: 1 }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center gap-2 text-center opacity-30">
                                    <Activity size={32} />
                                    <p className="text-[10px] font-semibold uppercase">Memuat...</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Monthly Value Trend */}
                <Card>
                    <CardHeader className="p-5 pb-0">
                        <CardTitle className="text-text-main text-xs font-semibold tracking-wider uppercase">Tren Nilai Kontrak Bulanan</CardTitle>
                        <p className="text-text-desc mt-0.5 text-[9px] font-semibold">
                            Akumulasi finansial dari kontrak-kontrak baru yang masuk per bulan.
                        </p>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="h-[220px] w-full select-none">
                            {isMounted ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={monthlyTrendData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--surface-border)" />
                                        <XAxis dataKey="month" fontSize={9} stroke="var(--text-desc)" tickLine={false} axisLine={false} />
                                        <YAxis
                                            fontSize={10}
                                            fontWeight={500}
                                            stroke="#64748b"
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(v) => formatIDR(v)}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--surface-base)',
                                                border: '1px solid var(--surface-border)',
                                                borderRadius: '8px',
                                                fontSize: '10px',
                                                color: 'var(--text-main)',
                                            }}
                                            itemStyle={{ color: 'var(--text-main)' }}
                                            formatter={(v: any) => [formatIDR(v), 'Nilai']}
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
                                <div className="flex h-full flex-col items-center justify-center gap-2 text-center opacity-30">
                                    <Activity size={32} />
                                    <p className="text-[10px] font-semibold uppercase">Memuat...</p>
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
                        <CardTitle className="text-text-main text-xs font-semibold tracking-wider uppercase">
                            Perbandingan Renewal vs Kadaluarsa
                        </CardTitle>
                        <p className="text-text-desc mt-0.5 text-[9px] font-semibold">
                            Analisis laju perpanjangan kontrak dibanding jumlah kontrak yang berakhir.
                        </p>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="h-[220px] w-full select-none">
                            {isMounted ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        style={{ outline: 'none' }}
                                        data={renewalVsExpiredData}
                                        margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--surface-border)" />
                                        <XAxis dataKey="month" fontSize={9} stroke="var(--text-desc)" tickLine={false} axisLine={false} />
                                        <YAxis fontSize={9} stroke="var(--text-desc)" tickLine={false} axisLine={false} />
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
                                        <Line
                                            type="monotone"
                                            dataKey="renewed"
                                            name="Diperpanjang (Renewal)"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            dot={{ r: 3 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="expired"
                                            name="Habis Masa Berlaku"
                                            stroke="#f43f5e"
                                            strokeWidth={2}
                                            dot={{ r: 3 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center gap-2 text-center opacity-30">
                                    <Activity size={32} />
                                    <p className="text-[10px] font-semibold uppercase">Memuat...</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Approval Outcomes (Stacked Area) */}
                <Card>
                    <CardHeader className="p-5 pb-0">
                        <CardTitle className="text-text-main text-xs font-semibold tracking-wider uppercase">
                            Output Hasil Kelayakan Kontrak
                        </CardTitle>
                        <p className="text-text-desc mt-0.5 text-[9px] font-semibold">Distribusi penyelesaian status persetujuan kontrak bulanan.</p>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="h-[220px] w-full select-none">
                            {isMounted ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={monthlyApprovalData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--surface-border)" />
                                        <XAxis dataKey="month" fontSize={9} stroke="var(--text-desc)" tickLine={false} axisLine={false} />
                                        <YAxis fontSize={9} stroke="var(--text-desc)" tickLine={false} axisLine={false} />
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
                                        <Area
                                            type="monotone"
                                            dataKey="approved"
                                            stackId="1"
                                            name="Disetujui"
                                            stroke="#10b981"
                                            fill="#10b981"
                                            fillOpacity={0.15}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="pending"
                                            stackId="1"
                                            name="Tertunda"
                                            stroke="#f59e0b"
                                            fill="#f59e0b"
                                            fillOpacity={0.15}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="revision"
                                            stackId="1"
                                            name="Revisi"
                                            stroke="var(--info)"
                                            fill="var(--info)"
                                            fillOpacity={0.15}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="rejected"
                                            stackId="1"
                                            name="Ditolak"
                                            stroke="#f43f5e"
                                            fill="#f43f5e"
                                            fillOpacity={0.15}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center gap-2 text-center opacity-30">
                                    <Activity size={32} />
                                    <p className="text-[10px] font-semibold uppercase">Memuat...</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
