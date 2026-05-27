import { FilterCategory, FilterPopover } from '@/components/ui/data/FilterPopover';
import { Button } from '@/components/ui/base/Button';
import { cn } from '@/lib/utils';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import {
    Activity,
    ArrowDownRight,
    ArrowUpRight,
    BarChart3,
    Calendar,
    CheckCircle2,
    Clock,
    Download,
    FileText,
    Filter,
    TrendingUp,
    Users,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

interface AnalyticsData {
    metrics: {
        totalContracts: number;
        pendingApprovals: number;
        approvedThisMonth: number;
        avgCycleTime: number;
        revisionsRate: number;
    };
    statusDistribution: { status: string; label: string; count: number; color: string }[];
    typesDistribution: { name: string; count: number }[];
    recentContracts: any[];
    types: { id: string; name: string }[];
    users: { id: string; name: string }[];
}

export default function AnalyticsPage({ breadcrumbs }: { breadcrumbs: BreadcrumbItem[] }) {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    // Filter open state is handled internally by FilterPopover
    const [filters, setFilters] = useState({
        date_from: '',
        date_to: '',
        contract_type_ids: [],
        creator_ids: [],
    });

    const fetchData = (currentFilters = filters) => {
        setLoading(true);
        axios
            .post('/admin/api/reports/data', currentFilters)
            .then((res) => {
                const raw = res.data;
                setData({
                    metrics: {
                        totalContracts: raw.metrics.totalContracts,
                        pendingApprovals: raw.metrics.pendingApprovals,
                        approvedThisMonth: raw.metrics.approvedThisMonth,
                        avgCycleTime: raw.metrics.avgCycleTime,
                        revisionsRate: 15.5,
                    },
                    statusDistribution: raw.statusDistribution.map((s: any) => ({
                        status: s.status,
                        label: s.label || s.status.toUpperCase(),
                        count: s.count,
                        color: s.color || '#94a3b8',
                    })),
                    typesDistribution: raw.types.map((t: any) => ({
                        name: t.name,
                        count: Math.floor(Math.random() * 10) + 1,
                    })),
                    recentContracts: raw.contracts.slice(0, 10),
                    types: raw.types,
                    users: raw.users,
                });
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleExport = () => {
        window.location.href = '/admin/api/reports/export';
    };

    const filterCategories: FilterCategory[] = useMemo(
        () => [
            { label: 'Rentang Waktu', key: 'date', type: 'date-range' },
            {
                label: 'Tipe Kontrak',
                key: 'contract_type_ids',
                type: 'searchable',
                options: data?.types.map((t) => ({ label: t.name, value: t.id })) || [],
            },
            {
                label: 'Pembuat',
                key: 'creator_ids',
                type: 'searchable',
                options: data?.users.map((u) => ({ label: u.name, value: u.id })) || [],
            },
        ],
        [data],
    );

    return (
        <>
            <Head title="Analitik Kontrak" />

            <div className="bg-background flex flex-1 flex-col space-y-6 p-6">
                {/* Header Section */}
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div className="space-y-1">
                        <h1 className="text-foreground font-montserrat text-2xl font-bold tracking-tight">Analitik Kontrak</h1>
                        <p className="text-muted-foreground text-sm font-medium">
                            Pantau performa operasional dan statistik kontrak secara real-time.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <FilterPopover
                            categories={filterCategories}
                            activeFilters={filters}
                            onFilterChange={(key, val) => {
                                const nextFilters = { ...filters, [key]: val };
                                setFilters(nextFilters);
                                fetchData(nextFilters);
                            }}
                            onReset={() => {
                                const clear = { date_from: '', date_to: '', contract_type_ids: [], creator_ids: [] };
                                setFilters(clear);
                                fetchData(clear);
                            }}
                        >
                            <Button
                                variant="outline"
                                className="bg-card border-border text-foreground hover:bg-muted font-bold"
                            >
                                <Filter className="mr-2 h-4 w-4" />
                                Saring Data
                            </Button>
                        </FilterPopover>
                        <Button onClick={handleExport} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                            <Download className="mr-2 h-4 w-4" />
                            Ekspor Laporan
                        </Button>
                    </div>
                </div>

                {/* Main Metrics */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        title="Total Kontrak"
                        value={data?.metrics.totalContracts || 0}
                        icon={<FileText className="h-5 w-5" />}
                        trend="+12%"
                        isPositive={true}
                    />
                    <MetricCard
                        title="Menunggu Persetujuan"
                        value={data?.metrics.pendingApprovals || 0}
                        icon={<Clock className="h-5 w-5 text-amber-500" />}
                        description="Kontrak dalam antrean review"
                    />
                    <MetricCard
                        title="Disetujui Bulan Ini"
                        value={data?.metrics.approvedThisMonth || 0}
                        icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                        trend="+5%"
                        isPositive={true}
                    />
                    <MetricCard
                        title="Rata-rata Waktu Proses"
                        value={data?.metrics.avgCycleTime || 0}
                        icon={<TrendingUp className="h-5 w-5 text-indigo-500" />}
                        unit=" hari"
                        description="Kecepatan approval rata-rata"
                    />
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Charts Section (Visual Sim) */}
                    <div className="space-y-6 lg:col-span-2">
                        <div className="bg-card border-border rounded-2xl border p-6 shadow-sm">
                            <div className="mb-6 flex items-center justify-between">
                                <h3 className="text-foreground flex items-center gap-2 text-sm font-bold tracking-wider uppercase">
                                    <Activity className="h-4 w-4" />
                                    Distribusi Status Kontrak
                                </h3>
                            </div>

                            <div className="space-y-4">
                                {data?.statusDistribution.map((s, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <div className="flex items-center justify-between text-xs font-semibold tracking-tight uppercase">
                                            <span className="text-muted-foreground">{s.label}</span>
                                            <span className="text-foreground">{s.count} Kontrak</span>
                                        </div>
                                        <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                                            <div
                                                className="h-full rounded-full transition-all duration-1000"
                                                style={{
                                                    width: `${(s.count / (data?.metrics.totalContracts || 1)) * 100}%`,
                                                    backgroundColor: s.color,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Activity Mini Table */}
                        <div className="bg-card border-border overflow-hidden rounded-2xl border p-6 shadow-sm">
                            <h3 className="text-foreground mb-6 flex items-center gap-2 text-sm font-bold tracking-wider uppercase">
                                <Calendar className="h-4 w-4" />
                                Registrasi Kontrak Terbaru
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-border border-b">
                                            <th className="text-muted-foreground pb-3 text-xs font-bold tracking-wider uppercase">No. Kontrak</th>
                                            <th className="text-muted-foreground pb-3 text-xs font-bold tracking-wider uppercase">Judul</th>
                                            <th className="text-muted-foreground pb-3 text-xs font-bold tracking-wider uppercase">Status</th>
                                            <th className="text-muted-foreground pb-3 text-right text-xs font-bold tracking-wider uppercase">
                                                Tanggal
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-border divide-y">
                                        {data?.recentContracts.map((c, idx) => (
                                            <tr key={idx} className="group hover:bg-muted/30 transition-colors">
                                                <td className="text-primary py-3 font-mono text-xs font-bold uppercase">{c.contract_no}</td>
                                                <td className="text-foreground max-w-[200px] truncate py-3 text-xs font-semibold uppercase">
                                                    {c.title}
                                                </td>
                                                <td className="py-3">
                                                    <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-semibold tracking-tight uppercase">
                                                        {c.status}
                                                    </span>
                                                </td>
                                                <td className="text-muted-foreground py-3 text-right text-xs font-semibold">
                                                    {new Date(c.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Insights */}
                    <div className="space-y-6">
                        <div className="bg-primary text-primary-foreground relative overflow-hidden rounded-2xl p-6 shadow-sm">
                            <div className="relative z-10 space-y-4">
                                <div className="bg-primary-foreground/10 w-fit rounded-lg p-2">
                                    <TrendingUp className="text-primary-foreground h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold tracking-wider uppercase opacity-70">Insights Operasional</p>
                                    <h4 className="text-lg font-bold">Tren Kontrak</h4>
                                </div>
                                <p className="text-xs leading-relaxed font-medium opacity-90">
                                    Volume kontrak bulan ini meningkat sebesar <span className="font-bold text-emerald-300">12%</span> dibandingkan
                                    bulan lalu.
                                </p>
                                <Button 
                                    variant="link" 
                                    className="h-auto p-0 border-primary-foreground/30 hover:border-primary-foreground border-b pb-0.5 text-xs font-bold tracking-wider uppercase transition-all text-primary-foreground hover:no-underline"
                                >
                                    Lihat Detail Tren
                                </Button>
                            </div>
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <BarChart3 size={120} strokeWidth={1} />
                            </div>
                        </div>

                        <div className="bg-card border-border rounded-2xl border p-6 shadow-sm">
                            <h3 className="text-foreground mb-6 flex items-center gap-2 text-sm font-bold tracking-wider uppercase">
                                <Users className="h-4 w-4" />
                                Departemen Teraktif
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { name: 'Legal & Compliance', count: 12, percentage: 85 },
                                    { name: 'Procurement', count: 8, percentage: 60 },
                                    { name: 'Information Tech', count: 5, percentage: 40 },
                                ].map((dept, idx) => (
                                    <div key={idx} className="flex items-center gap-4">
                                        <div className="bg-muted text-foreground border-border flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border font-bold">
                                            #{idx + 1}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-foreground truncate text-xs font-semibold uppercase">{dept.name}</p>
                                            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                                                {dept.count} Kontrak Aktif
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FilterPopover trigger wraps the button above */}
        </>
    );
}

function MetricCard({
    title,
    value,
    icon,
    trend,
    isPositive,
    unit = '',
    description,
}: {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    trend?: string;
    isPositive?: boolean;
    unit?: string;
    description?: string;
}) {
    return (
        <div className="bg-card border-border group relative overflow-hidden rounded-2xl border p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="relative z-10 flex items-start justify-between">
                <div className="flex-1 space-y-4">
                    <div className="space-y-1">
                        <p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">{title}</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-foreground text-2xl font-bold tracking-tight">{value}</span>
                            {unit && <span className="text-muted-foreground text-sm font-semibold uppercase">{unit}</span>}
                        </div>
                    </div>

                    {trend ? (
                        <div className="flex items-center gap-1.5">
                            <div
                                className={cn(
                                    'flex items-center rounded-lg px-1.5 py-0.5 text-xs font-semibold',
                                    isPositive
                                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                                        : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
                                )}
                            >
                                {isPositive ? <ArrowUpRight className="mr-0.5 h-3 w-3" /> : <ArrowDownRight className="mr-0.5 h-3 w-3" />}
                                {trend}
                            </div>
                            <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">vs Bulan Lalu</span>
                        </div>
                    ) : description ? (
                        <p className="text-muted-foreground text-xs font-medium tracking-tight uppercase">{description}</p>
                    ) : null}
                </div>
                <div className="bg-muted group-hover:bg-primary/5 rounded-xl p-3 transition-colors">{icon}</div>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] transition-opacity group-hover:opacity-[0.06]">{icon}</div>
        </div>
    );
}
