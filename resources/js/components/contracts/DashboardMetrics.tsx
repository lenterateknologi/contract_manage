import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { BarChart3, Clock, FileText, Filter, Shield, X } from 'lucide-react';
import React from 'react';
import { Area, Bar, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// Data Tetap Sama
const workflowVelocity = [
    { stage: 'Penyusunan', days: 1.2, color: '#94a3b8' },
    { stage: 'Tinjauan Hukum', days: 4.8, color: '#ef4444' },
    { stage: 'Tinjauan Keuangan', days: 2.1, color: '#3b82f6' },
    { stage: 'Tanda Tangan Direktur', days: 1.5, color: '#10b981' },
];

const contractCategories = [
    { name: 'Perjanjian Vendor', value: 45, color: '#2563eb' },
    { name: 'Kontrak Penjualan', value: 30, color: '#6366f1' },
    { name: 'Kerahasiaan (NDA)', value: 15, color: '#f59e0b' },
    { name: 'Ketenagakerjaan', value: 10, color: '#94a3b8' },
];

const throughputData = [
    { month: 'Jan', received: 110, completed: 95 },
    { month: 'Feb', received: 130, completed: 120 },
    { month: 'Mar', received: 120, completed: 115 },
    { month: 'Apr', received: 160, completed: 140 },
    { month: 'Mei', received: 190, completed: 185 },
    { month: 'Jun', received: 170, completed: 160 },
    { month: 'Jul', received: 210, completed: 195 },
];

interface MetricProps {
    label: string;
    value: string | number;
    subValue: string;
    icon: React.ReactNode;
    color: string;
}

function SimpleMetricCard({ label, value, subValue, icon, color }: MetricProps) {
    return (
        <Card className="overflow-hidden rounded-lg border border-sidebar-border bg-white shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center gap-4 p-5">
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg transition-transform group-hover:scale-110 duration-300', color)}>
                    {React.cloneElement(icon as React.ReactElement<any>, { size: 22, className: 'stroke-[2.5px]' })}
                </div>
                <div className="flex flex-col">
                    <p className="text-[10px] font-bold tracking-wider text-sidebar-foreground/40 uppercase leading-none mb-2">{label}</p>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold tracking-tight text-sidebar-foreground">{value}</span>
                        <span className="text-[10px] font-bold text-sidebar-foreground/30 uppercase tracking-wider">{subValue}</span>
                    </div>
                </div>
            </div>
        </Card>
    );
}

export function DashboardMetrics({ 
    metrics, 
    roles = [], 
    departments = [], 
    filters = {} 
}: { 
    metrics: any;
    roles?: any[];
    departments?: any[];
    filters?: any;
}) {
    if (!metrics) return null;
    const { metrics: m } = metrics;

    const metricsData = m || {
        avgCycleTime: 0,
        totalContracts: 0,
        pendingApprovals: 0,
        approvedThisMonth: 0,
    };

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        if (!value) delete newFilters[key];
        
        router.get(route(route().current() as string), newFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        router.get(route(route().current() as string), { view: 'dashboard' }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <div className="animate-in fade-in slide-in-from-top-4 space-y-6 duration-500">
            
            {/* Filter Dashboard */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-lg border border-sidebar-border shadow-sm mb-6">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-sidebar-accent flex items-center justify-center text-sidebar-primary">
                        <Filter size={16} className="stroke-[2.5px]" />
                    </div>
                    <span className="text-[11px] font-bold text-sidebar-foreground uppercase tracking-wider">Filter Laporan</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                    {/* Filter Role */}
                    <select 
                        value={filters.role_id || ''}
                        onChange={(e) => handleFilterChange('role_id', e.target.value)}
                        className="h-9 rounded-md border-sidebar-border bg-sidebar-accent/50 px-3 text-[11px] font-bold text-sidebar-foreground outline-none transition-all focus:ring-2 focus:ring-sidebar-primary/20 min-w-[140px] border"
                    >
                        <option value="">Semua Peran</option>
                        {roles.map((role: any) => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                    </select>

                    {/* Filter Departemen */}
                    <select 
                        value={filters.department_id || ''}
                        onChange={(e) => handleFilterChange('department_id', e.target.value)}
                        className="h-9 rounded-md border-sidebar-border bg-sidebar-accent/50 px-3 text-[11px] font-bold text-sidebar-foreground outline-none transition-all focus:ring-2 focus:ring-sidebar-primary/20 min-w-[160px] border"
                    >
                        <option value="">Semua Departemen</option>
                        {departments.map((dept: any) => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                    </select>

                    {(filters.role_id || filters.department_id) && (
                        <button 
                            onClick={clearFilters}
                            className="flex h-9 items-center gap-2 rounded-md bg-rose-50 px-4 text-[10px] font-bold text-rose-600 transition-all hover:bg-rose-100 border border-rose-100"
                        >
                            <X size={14} /> BERSIHKAN
                        </button>
                    )}
                </div>
            </div>

            {/* Kartu Ringkasan (Simple Style) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SimpleMetricCard
                    label="Bank Kontrak"
                    value={metricsData.totalContracts}
                    subValue="Aktif"
                    icon={<FileText />}
                    color="bg-sidebar-accent text-sidebar-primary"
                />
                <SimpleMetricCard
                    label="Antrean Tugas"
                    value={metricsData.pendingApprovals}
                    subValue="Menunggu"
                    icon={<Clock />}
                    color="bg-amber-50 text-amber-600"
                />
                <SimpleMetricCard
                    label="Output Bulanan"
                    value={metricsData.approvedThisMonth}
                    subValue="Selesai"
                    icon={<Shield />}
                    color="bg-emerald-50 text-emerald-600"
                />
                <SimpleMetricCard
                    label="Waktu Siklus"
                    value={metricsData.avgCycleTime}
                    subValue="Hari"
                    icon={<BarChart3 />}
                    color="bg-neutral-50 text-neutral-600"
                />
            </div>

            {/* Konten Analitik (Simple Style) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Analisis Kecepatan Tahapan */}
                <Card className="rounded-2xl border border-slate-100 bg-white shadow-none lg:col-span-12">
                    <CardHeader className="px-6 py-6">
                        <div className="space-y-1">
                            <CardTitle className="text-sm font-bold tracking-tight text-slate-800 uppercase">
                                Jalur Kritis | Kecepatan Tahapan
                            </CardTitle>
                            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Analisis hambatan real-time</p>
                        </div>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                            {workflowVelocity.map((stage) => (
                                <div
                                    key={stage.stage}
                                    className="space-y-3 rounded-xl border border-slate-50 bg-slate-50/30 p-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">{stage.stage}</span>
                                        <Badge className="bg-white text-slate-500 border-slate-100 shadow-none text-[9px] font-bold h-5 px-1.5">
                                            {stage.days}h
                                        </Badge>
                                    </div>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${Math.min((stage.days / 6) * 100, 100)}%`,
                                                backgroundColor: stage.color,
                                            }}
                                        />
                                    </div>
                                    <p className="text-[9px] font-medium text-slate-400">Rata-rata Hari</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Throughput Sistem */}
                <Card className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-none lg:col-span-8">
                    <CardHeader className="flex flex-row items-center justify-between px-6 py-6">
                        <div className="space-y-1">
                            <CardTitle className="text-sm font-bold tracking-tight text-slate-800 uppercase">Throughput Sistem</CardTitle>
                            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Masuk vs Selesai</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-slate-200" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Diterima</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                <span className="text-[9px] font-bold text-slate-800 uppercase">Selesai</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[220px] px-6 pb-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={throughputData}>
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    content={({ active, payload }) => {
                                        if (active && payload) {
                                            return (
                                                <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-none">
                                                    <p className="mb-2 text-[10px] font-bold text-slate-800 uppercase">
                                                        {payload[0].payload.month}
                                                    </p>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between gap-6">
                                                            <span className="text-[9px] font-medium text-slate-400 uppercase">Masuk</span>
                                                            <span className="text-[10px] font-bold">{payload[0].value}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between gap-6">
                                                            <span className="text-[9px] font-medium text-blue-500 uppercase">Selesai</span>
                                                            <span className="text-[10px] font-bold text-blue-500">{payload[1].value}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="received" fill="#f8fafc" radius={[4, 4, 4, 4]} barSize={30} />
                                <Area
                                    type="monotone"
                                    dataKey="completed"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fill="transparent"
                                    dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Intensitas Kontrak */}
                <Card className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-none lg:col-span-4">
                    <CardHeader className="px-6 py-6">
                        <CardTitle className="text-sm font-bold tracking-tight text-slate-800 uppercase">Intensitas</CardTitle>
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Beban Kerja Per Tipe</p>
                    </CardHeader>
                    <CardContent className="space-y-6 px-6 pb-6">
                        {contractCategories.map((cat) => (
                            <div key={cat.name} className="space-y-1.5">
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
                                    <span className="text-slate-500">{cat.name}</span>
                                    <span className="text-slate-800">{cat.value}%</span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-50">
                                    <div
                                        className="h-full rounded-full"
                                        style={{ width: `${cat.value}%`, backgroundColor: cat.color }}
                                    />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
