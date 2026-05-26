import { useEffect, useMemo, useState } from 'react';
import {
    FileText,
    ShieldCheck,
    Clock,
    Activity,
    Calendar,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/base/Card';

interface OverviewTabProps {
    data: any;
    onNavigate: (view: string) => void;
}

export function OverviewTab({ data, onNavigate }: OverviewTabProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const m = data?.summary || {
        total: 0,
        in_process: 0,

        active: 0,
        expiring_soon: 0,
    };

    const submissionTypeData = (data?.submissionTypeDistribution || []).map((item: any) => ({
        name: item.label,
        value: item.count,
    }));

    const contractTypeData = (data?.contractTypeDistribution || []).map((item: any) => ({
        name: item.label,
        value: item.count,
    }));

    const COLORS = ['var(--success)', 'var(--warning)', 'var(--danger)', 'var(--text-desc)', 'var(--info)', 'var(--primary)'];

    return (
        <div className="space-y-6">
            {/* 4 KPI Cards Grid */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 select-none">
                <Card
                    onClick={() => onNavigate('contracts')}
                    className="cursor-pointer hover:bg-surface-muted/50 transition-all active:scale-[0.99]"
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-text-desc">Volume Kontrak</CardTitle>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/10">
                            <FileText className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-black">{m.total}</div>
                        <p className="text-[9px] font-bold text-text-desc uppercase tracking-wider mt-1">Total Kontrak</p>
                    </CardContent>
                </Card>

                <Card
                    onClick={() => onNavigate('pending')}
                    className="cursor-pointer hover:bg-surface-muted/50 transition-all active:scale-[0.99]"
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-text-desc">Workflow Pending</CardTitle>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-info/10 text-info border border-info/10">
                            <Clock className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-black">{m.in_process}</div>
                        <p className="text-[9px] font-bold text-text-desc uppercase tracking-wider mt-1">Sedang Diproses</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-text-desc">Approved & Valid</CardTitle>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 text-success border border-success/10">
                            <ShieldCheck className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-black">{m.active}</div>
                        <p className="text-[9px] font-bold text-text-desc uppercase tracking-wider mt-1">Kontrak Aktif</p>
                    </CardContent>
                </Card>

                <Card className="border-warning/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-text-desc">Kurang dari 30 Hari</CardTitle>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10 text-warning border border-warning/10 animate-pulse">
                            <Clock className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-black">{m.expiring_soon}</div>
                        <p className="text-[9px] font-bold text-text-desc uppercase tracking-wider mt-1">Segera Berakhir</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section - Side by Side (Horizontal Layout) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-10">
                <Card className="lg:col-span-3">
                    <CardHeader className="p-5 pb-0">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider">Distribusi Submission</CardTitle>
                        <p className="text-[9px] font-semibold text-text-desc mt-0.5">Proporsi kontrak berdasarkan tipe submission (F1, F2, dsb).</p>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="h-[350px] w-full flex items-center justify-center relative select-none">
                            {isMounted && submissionTypeData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={submissionTypeData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={65}
                                            outerRadius={90}
                                            paddingAngle={4}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {submissionTypeData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'var(--surface-base)', border: '1px solid var(--surface-border)', borderRadius: '8px', padding: '8px' }}
                                            itemStyle={{ fontSize: '10px', color: 'var(--text-main)', fontWeight: 'bold' }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            align="center"
                                            iconType="circle"
                                            iconSize={8}
                                            wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', paddingTop: '20px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center gap-2 opacity-30 text-center">
                                    <Activity size={32} />
                                    <p className="text-[10px] font-bold uppercase">Data tidak tersedia</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-7">
                    <CardHeader className="p-5 pb-0">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider">Distribusi Tipe Kontrak</CardTitle>
                        <p className="text-[9px] font-semibold text-text-desc mt-0.5">Analisis proporsi volume berdasarkan klasifikasi kontrak.</p>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="h-[350px] w-full flex items-center justify-center relative select-none">
                            {isMounted && contractTypeData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={contractTypeData} margin={{ top: 10, right: 5, left: -20, bottom: 90 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--surface-border)" />
                                        <XAxis
                                            dataKey="name"
                                            stroke="var(--text-desc)"
                                            tickLine={false}
                                            axisLine={false}
                                            interval={0}
                                            height={55}
                                            tick={{
                                                angle: -45,
                                                textAnchor: 'end',
                                                fontSize: 8,
                                                fontWeight: 'bold',
                                                fill: 'currentColor',
                                                opacity: 0.7
                                            }}
                                        />
                                        <YAxis
                                            fontSize={8}
                                            stroke="var(--text-desc)"
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'var(--surface-muted)', opacity: 0.1 }}
                                            contentStyle={{ backgroundColor: 'var(--surface-base)', border: '1px solid var(--surface-border)', borderRadius: '8px', padding: '8px' }}
                                            itemStyle={{ fontSize: '10px', color: 'var(--text-main)', fontWeight: 'bold' }}
                                        />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={24}>
                                            {contractTypeData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center gap-2 opacity-30 text-center">
                                    <Activity size={32} />
                                    <p className="text-[10px] font-bold uppercase">Data tidak tersedia</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
