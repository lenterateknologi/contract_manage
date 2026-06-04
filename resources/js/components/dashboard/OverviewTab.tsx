import { Activity, Clock, FileText, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { MetricItem } from './MetricItem';

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
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-700">
            {/* 4 KPI Metric Rows */}
            <div className="grid grid-cols-1 gap-6 select-none md:grid-cols-2 lg:grid-cols-4">
                <MetricItem label="Total Kontrak" value={m.total} icon={FileText} color="text-primary" onClick={() => onNavigate('contracts')} />
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
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Distribution Pie */}
                <div className="lg:col-span-4">
                    <div className="dark:bg-surface-base border-surface-border/60 hover:border-primary/20 group flex h-full flex-col rounded-2xl border bg-white p-6 shadow-sm transition-all hover:shadow-xl">
                        <div className="space-y-1 pb-6">
                            <h3 className="text-text-main text-sm font-semibold tracking-[0.2em] uppercase">Proporsi Dokumen</h3>
                            <p className="text-text-soft text-[10px] font-medium tracking-wider uppercase">Berdasarkan Tipe Submission</p>
                        </div>

                        <div className="relative h-[300px] w-full">
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
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COLORS[index % COLORS.length]}
                                                    className="cursor-pointer opacity-80 transition-opacity hover:opacity-100"
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(255,255,255,0.9)',
                                                border: 'none',
                                                borderRadius: '16px',
                                                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                                                padding: '12px',
                                            }}
                                            itemStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-20">
                                    <Activity size={40} strokeWidth={1} />
                                    <p className="text-[10px] font-medium tracking-widest uppercase">Data Kosong</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            {submissionTypeData.map((entry: any, index: number) => (
                                <div
                                    key={index}
                                    className="bg-surface-muted/30 border-surface-border/40 flex items-center gap-2.5 rounded-xl border px-3 py-2"
                                >
                                    <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <div className="flex min-w-0 flex-col">
                                        <span className="text-text-desc truncate text-[9px] font-medium uppercase">{entry.name}</span>
                                        <span className="text-text-main text-xs leading-none font-medium">{entry.value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Distribution Bar */}
                <div className="lg:col-span-8">
                    <div className="dark:bg-surface-base border-surface-border/60 hover:border-primary/20 group flex h-full flex-col rounded-2xl border bg-white p-6 shadow-sm transition-all hover:shadow-xl">
                        <div className="flex items-start justify-between pb-2">
                            <div className="space-y-1">
                                <h3 className="text-text-main text-sm font-semibold tracking-[0.2em] uppercase">Analisis Klasifikasi</h3>
                                <p className="text-text-soft text-[10px] font-medium tracking-wider uppercase">Volume Per Kategori Kontrak</p>
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
                                            tickFormatter={(val) => (val.length > 40 ? val.substring(0, 37) + '...' : val)}
                                        />
                                        <YAxis fontSize={10} fontWeight={500} stroke="#64748b" tickLine={false} axisLine={false} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(79,70,229,0.03)' }}
                                            content={({ active, payload, label }: any) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="dark:bg-surface-base/90 border-surface-border/40 flex flex-col gap-1 rounded-2xl border bg-white/90 p-3 shadow-xl backdrop-blur-sm">
                                                            <p className="text-text-soft text-[10px] leading-none font-semibold tracking-wider uppercase">
                                                                {label}
                                                            </p>
                                                            <p className="text-primary text-xs leading-none font-bold">{payload[0].value}</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={32}>
                                            {contractTypeData.map((entry: any, index: number) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COLORS[(index + 1) % COLORS.length]}
                                                    className="cursor-pointer opacity-80 transition-all hover:opacity-100"
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center gap-4 opacity-20">
                                    <Activity size={48} strokeWidth={1} />
                                    <p className="text-xs font-medium tracking-[0.2em] uppercase">Analisis tidak tersedia</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
