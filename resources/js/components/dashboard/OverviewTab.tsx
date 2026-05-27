import { useEffect, useMemo, useState } from 'react';
import {
    FileText,
    ShieldCheck,
    Clock,
    Activity,
    Calendar,
    ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { MetricItem } from './MetricItem';
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
    onNavigate: (view: string, params?: any) => void;
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

    const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#f43f5e', '#0ea5e9', '#8b5cf6'];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* 4 KPI Metric Rows */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
                <MetricItem
                    label="Total Kontrak"
                    value={m.total}
                    icon={FileText}
                    color="text-primary"
                    onClick={() => onNavigate('contracts')}
                />
                <MetricItem
                    label="Perlu Persetujuan"
                    value={m.in_process}
                    icon={Clock}
                    color="text-amber-500"
                    onClick={() => onNavigate('pending')}
                />
                <MetricItem
                    label="Kontrak Aktif"
                    value={m.active}
                    icon={ShieldCheck}
                    color="text-emerald-500"
                    onClick={() => onNavigate('contracts', { status: 'approved' })}
                />
                <MetricItem
                    label="Segera Berakhir"
                    value={m.expiring_soon}
                    icon={Activity}
                    color="text-rose-500"
                    onClick={() => onNavigate('expiry')}
                    isAlert
                />
            </div>

            {/* Visual Analytics Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Distribution Pie */}
                <div className="lg:col-span-4">
                    <div className="bg-white dark:bg-surface-base border border-surface-border/60 rounded-2xl p-6 shadow-sm transition-all hover:shadow-xl hover:border-primary/20 group h-full flex flex-col">
                        <div className="space-y-1 pb-6">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-text-main">Proporsi Dokumen</h3>
                            <p className="text-[10px] font-medium text-text-soft uppercase tracking-wider">Berdasarkan Tipe Submission</p>
                        </div>

                        <div className="h-[300px] w-full relative">
                            {isMounted && submissionTypeData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart style={{ outline: 'none' }}>
                                        <Pie
                                            data={submissionTypeData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={95}
                                            paddingAngle={8}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {submissionTypeData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="opacity-80 hover:opacity-100 transition-opacity cursor-pointer" />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                                            itemStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 gap-3">
                                    <Activity size={40} strokeWidth={1} />
                                    <p className="text-[10px] font-medium uppercase tracking-widest">Data Kosong</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            {submissionTypeData.map((entry: any, index: number) => (
                                <div key={index} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-surface-muted/30 border border-surface-border/40">
                                    <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[9px] font-medium text-text-desc uppercase truncate">{entry.name}</span>
                                        <span className="text-xs font-medium text-text-main leading-none">{entry.value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Distribution Bar */}
                <div className="lg:col-span-8">
                    <div className="bg-white dark:bg-surface-base border border-surface-border/60 rounded-2xl p-6 shadow-sm transition-all hover:shadow-xl hover:border-primary/20 group h-full flex flex-col">
                        <div className="flex items-start justify-between pb-2">
                            <div className="space-y-1">
                                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-text-main">Analisis Klasifikasi</h3>
                                <p className="text-[10px] font-medium text-text-soft uppercase tracking-wider">Volume Per Kategori Kontrak</p>
                            </div>

                        </div>

                        <div className="h-[400px] w-full">
                            {isMounted && contractTypeData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={contractTypeData} margin={{ top: 10, right: 10, left: 40, bottom: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                        <XAxis
                                            dataKey="name"
                                            stroke="#64748b"
                                            tickLine={false}
                                            axisLine={false}
                                            fontSize={10}
                                            fontWeight={500}
                                            angle={-45}
                                            textAnchor="end"
                                            height={110}
                                            tickFormatter={(val) => val.length > 40 ? val.substring(0, 37) + '...' : val}
                                        />
                                        <YAxis
                                            fontSize={10}
                                            fontWeight={500}
                                            stroke="#64748b"
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(79,70,229,0.03)' }}
                                            content={({ active, payload, label }: any) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-white/90 dark:bg-surface-base/90 border border-surface-border/40 rounded-2xl shadow-xl p-3 backdrop-blur-sm flex flex-col gap-1">
                                                            <p className="text-[10px] font-semibold text-text-soft uppercase tracking-wider leading-none">{label}</p>
                                                            <p className="text-xs font-bold text-primary leading-none">{payload[0].value}</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={32}>
                                            {contractTypeData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} className="opacity-80 hover:opacity-100 transition-all cursor-pointer" />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center opacity-20 gap-4">
                                    <Activity size={48} strokeWidth={1} />
                                    <p className="text-xs font-medium uppercase tracking-[0.2em]">Analisis tidak tersedia</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


