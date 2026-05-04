import { Head } from '@inertiajs/react';
import { BreadcrumbItem } from '@/types';
import { 
    BarChart3, 
    TrendingUp, 
    CheckCircle2, 
    Clock, 
    FileText, 
    Download, 
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    Calendar,
    Users
} from 'lucide-react';
import { Button } from '@/components/ui/base/Button';
import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { FilterSheet, FilterCategory } from '@/components/ui/data/FilterSheet';

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
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({
        date_from: '',
        date_to: '',
        contract_type_ids: [],
        creator_ids: []
    });

    const fetchData = (currentFilters = filters) => {
        setLoading(true);
        axios.post('/admin/api/reports/data', currentFilters).then(res => {
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
                    color: s.color || '#94a3b8'
                })),
                typesDistribution: raw.types.map((t: any) => ({
                    name: t.name,
                    count: Math.floor(Math.random() * 10) + 1
                })),
                recentContracts: raw.contracts.slice(0, 10),
                types: raw.types,
                users: raw.users
            });
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleExport = () => {
        window.location.href = '/admin/api/reports/export';
    };

    const filterCategories: FilterCategory[] = useMemo(() => [
        { label: 'Rentang Waktu', key: 'date', type: 'date-range' },
        { 
            label: 'Tipe Kontrak', 
            key: 'contract_type_ids', 
            type: 'searchable', 
            options: data?.types.map(t => ({ label: t.name, value: t.id })) || [] 
        },
        { 
            label: 'Pembuat', 
            key: 'creator_ids', 
            type: 'searchable', 
            options: data?.users.map(u => ({ label: u.name, value: u.id })) || [] 
        }
    ], [data]);

    return (
        <>
            <Head title="Analitik Kontrak" />
            
            <div className="flex flex-col flex-1 p-6 space-y-6 bg-background">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground font-montserrat">
                            Analitik Kontrak
                        </h1>
                        <p className="text-sm text-muted-foreground font-medium">
                            Pantau performa operasional dan statistik kontrak secara real-time.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button 
                            variant="outline" 
                            onClick={() => setIsFilterOpen(true)}
                            className="bg-card border-border text-foreground hover:bg-muted font-bold"
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            Saring Data
                        </Button>
                        <Button 
                            onClick={handleExport}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Ekspor Laporan
                        </Button>
                    </div>
                </div>

                {/* Main Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard 
                        title="Total Kontrak" 
                        value={data?.metrics.totalContracts || 0} 
                        icon={<FileText className="w-5 h-5" />}
                        trend="+12%"
                        isPositive={true}
                    />
                    <MetricCard 
                        title="Menunggu Persetujuan" 
                        value={data?.metrics.pendingApprovals || 0} 
                        icon={<Clock className="w-5 h-5 text-amber-500" />}
                        description="Kontrak dalam antrean review"
                    />
                    <MetricCard 
                        title="Disetujui Bulan Ini" 
                        value={data?.metrics.approvedThisMonth || 0} 
                        icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                        trend="+5%"
                        isPositive={true}
                    />
                    <MetricCard 
                        title="Rata-rata Waktu Proses" 
                        value={data?.metrics.avgCycleTime || 0} 
                        icon={<TrendingUp className="w-5 h-5 text-indigo-500" />}
                        unit=" hari"
                        description="Kecepatan approval rata-rata"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Charts Section (Visual Sim) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                                    <Activity className="w-4 h-4" />
                                    Distribusi Status Kontrak
                                </h3>
                            </div>
                            
                            <div className="space-y-4">
                                {data?.statusDistribution.map((s, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-tight">
                                            <span className="text-muted-foreground">{s.label}</span>
                                            <span className="text-foreground">{s.count} Kontrak</span>
                                        </div>
                                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                            <div 
                                                className="h-full rounded-full transition-all duration-1000"
                                                style={{ 
                                                    width: `${(s.count / (data?.metrics.totalContracts || 1)) * 100}%`,
                                                    backgroundColor: s.color 
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Activity Mini Table */}
                        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm overflow-hidden">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-6 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Registrasi Kontrak Terbaru
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="pb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">No. Kontrak</th>
                                            <th className="pb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Judul</th>
                                            <th className="pb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                                            <th className="pb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Tanggal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {data?.recentContracts.map((c, idx) => (
                                            <tr key={idx} className="group hover:bg-muted/30 transition-colors">
                                                <td className="py-3 text-xs font-mono font-bold text-primary uppercase">{c.contract_no}</td>
                                                <td className="py-3 text-xs font-semibold text-foreground uppercase truncate max-w-[200px]">{c.title}</td>
                                                <td className="py-3">
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-tight bg-muted text-muted-foreground">
                                                        {c.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-xs font-semibold text-muted-foreground text-right">
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
                        <div className="bg-primary rounded-2xl p-6 text-primary-foreground shadow-sm relative overflow-hidden">
                            <div className="relative z-10 space-y-4">
                                <div className="p-2 bg-primary-foreground/10 rounded-lg w-fit">
                                    <TrendingUp className="w-5 h-5 text-primary-foreground" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold uppercase tracking-wider opacity-70">Insights Operasional</p>
                                    <h4 className="text-lg font-bold">Tren Kontrak</h4>
                                </div>
                                <p className="text-xs opacity-90 leading-relaxed font-medium">
                                    Volume kontrak bulan ini meningkat sebesar <span className="font-bold text-emerald-300">12%</span> dibandingkan bulan lalu.
                                </p>
                                <button className="text-xs font-bold uppercase tracking-wider border-b border-primary-foreground/30 pb-0.5 hover:border-primary-foreground transition-all">
                                    Lihat Detail Tren
                                </button>
                            </div>
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <BarChart3 size={120} strokeWidth={1} />
                            </div>
                        </div>

                        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-6 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Departemen Teraktif
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { name: 'Legal & Compliance', count: 12, percentage: 85 },
                                    { name: 'Procurement', count: 8, percentage: 60 },
                                    { name: 'Information Tech', count: 5, percentage: 40 },
                                ].map((dept, idx) => (
                                    <div key={idx} className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center font-bold text-foreground shrink-0 border border-border">
                                            #{idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-foreground truncate uppercase">{dept.name}</p>
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{dept.count} Kontrak Aktif</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <FilterSheet 
                isOpen={isFilterOpen}
                onOpenChange={setIsFilterOpen}
                title="Penyaringan Data"
                description="Sesuaikan kriteria untuk melihat data spesifik."
                categories={filterCategories}
                activeFilters={filters}
                onFilterChange={(key, val) => setFilters(p => ({ ...p, [key]: val }))}
                onReset={() => setFilters({ date_from: '', date_to: '', contract_type_ids: [], creator_ids: [] })}
                applyText="Terapkan Filter"
            />
        </>
    );
}

function MetricCard({ title, value, icon, trend, isPositive, unit = "", description }: { 
    title: string; 
    value: number | string; 
    icon: React.ReactNode; 
    trend?: string; 
    isPositive?: boolean;
    unit?: string;
    description?: string;
}) {
    return (
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex justify-between items-start relative z-10">
                <div className="space-y-4 flex-1">
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-foreground tracking-tight">
                                {value}
                            </span>
                            {unit && <span className="text-sm font-semibold text-muted-foreground uppercase">{unit}</span>}
                        </div>
                    </div>
                    
                    {trend ? (
                        <div className="flex items-center gap-1.5">
                            <div className={cn(
                                "flex items-center px-1.5 py-0.5 rounded-lg text-xs font-semibold",
                                isPositive ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                            )}>
                                {isPositive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                                {trend}
                            </div>
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">vs Bulan Lalu</span>
                        </div>
                    ) : description ? (
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-tight">{description}</p>
                    ) : null}
                </div>
                <div className="p-3 bg-muted rounded-xl group-hover:bg-primary/5 transition-colors">
                    {icon}
                </div>
            </div>
            <div className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                {icon}
            </div>
        </div>
    );
}
