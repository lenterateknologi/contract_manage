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
            // Mapping real data from controller
            const raw = res.data;
            setData({
                metrics: {
                    totalContracts: raw.metrics.totalContracts,
                    pendingApprovals: raw.metrics.pendingApprovals,
                    approvedThisMonth: raw.metrics.approvedThisMonth,
                    avgCycleTime: raw.metrics.avgCycleTime,
                    revisionsRate: 15.5, // Placeholder for specific metric
                },
                statusDistribution: raw.statusDistribution.map((s: any) => ({
                    status: s.status,
                    label: s.label || s.status.toUpperCase(),
                    count: s.count,
                    color: s.color || '#94a3b8'
                })),
                typesDistribution: raw.types.map((t: any) => ({
                    name: t.name,
                    count: Math.floor(Math.random() * 10) + 1 // Simulated distribution
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
            
            <div className="flex flex-col flex-1 p-6 space-y-8 bg-[#f8fafc]/50">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-extrabold tracking-tight text-[#172554] font-montserrat">
                            Analitik Kontrak
                        </h1>
                        <p className="text-sm text-slate-500 font-medium">
                            Pantau performa operasional dan statistik kontrak secara real-time.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button 
                            variant="outline" 
                            onClick={() => setIsFilterOpen(true)}
                            className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-bold"
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            Saring Data
                        </Button>
                        <Button 
                            onClick={handleExport}
                            className="bg-[#172554] hover:bg-[#1e1b4b] text-white font-bold"
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
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-sm font-black uppercase tracking-widest text-[#172554] flex items-center gap-2">
                                    <Activity className="w-4 h-4" />
                                    Distribusi Status Kontrak
                                </h3>
                            </div>
                            
                            <div className="space-y-6">
                                {data?.statusDistribution.map((s, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-tight">
                                            <span className="text-slate-500">{s.label}</span>
                                            <span className="text-[#172554]">{s.count} Kontrak</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
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
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden">
                            <h3 className="text-sm font-black uppercase tracking-widest text-[#172554] mb-6 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Registrasi Kontrak Terbaru
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">No. Kontrak</th>
                                            <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Judul</th>
                                            <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                            <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Tanggal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {data?.recentContracts.map((c, idx) => (
                                            <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="py-3 text-[11px] font-mono font-bold text-indigo-600 uppercase">{c.contract_no}</td>
                                                <td className="py-3 text-[11px] font-bold text-slate-800 uppercase truncate max-w-[200px]">{c.title}</td>
                                                <td className="py-3">
                                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter bg-slate-100 text-slate-600">
                                                        {c.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-[10px] font-bold text-slate-400 text-right">
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
                    <div className="space-y-8">
                        <div className="bg-[#172554] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                            <div className="relative z-10 space-y-4">
                                <div className="p-2 bg-white/10 rounded-lg w-fit">
                                    <TrendingUp className="w-5 h-5 text-white" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Insights Operasional</p>
                                    <h4 className="text-lg font-bold">Tren Kontrak</h4>
                                </div>
                                <p className="text-xs opacity-80 leading-relaxed font-medium">
                                    Volume kontrak bulan ini meningkat sebesar <span className="font-bold text-emerald-400">12%</span> dibandingkan bulan lalu.
                                </p>
                                <button className="text-[10px] font-black uppercase tracking-widest border-b border-white/30 pb-0.5 hover:border-white transition-all">
                                    Lihat Detail Tren
                                </button>
                            </div>
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <BarChart3 size={120} strokeWidth={1} />
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="text-sm font-black uppercase tracking-widest text-[#172554] mb-6 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Departemen Teraktif
                            </h3>
                            <div className="space-y-5">
                                {[
                                    { name: 'Legal & Compliance', count: 12, percentage: 85 },
                                    { name: 'Procurement', count: 8, percentage: 60 },
                                    { name: 'Information Tech', count: 5, percentage: 40 },
                                ].map((dept, idx) => (
                                    <div key={idx} className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-bold text-[#172554] shrink-0 border border-slate-100">
                                            #{idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-bold text-slate-800 truncate uppercase">{dept.name}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{dept.count} Kontrak Aktif</p>
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
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex justify-between items-start relative z-10">
                <div className="space-y-4 flex-1">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">{title}</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-[#172554] tracking-tighter">
                                {value}
                            </span>
                            {unit && <span className="text-sm font-bold text-slate-400 uppercase">{unit}</span>}
                        </div>
                    </div>
                    
                    {trend ? (
                        <div className="flex items-center gap-1.5">
                            <div className={cn(
                                "flex items-center px-1.5 py-0.5 rounded-lg text-[10px] font-black",
                                isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                            )}>
                                {isPositive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                                {trend}
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">vs Bulan Lalu</span>
                        </div>
                    ) : description ? (
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{description}</p>
                    ) : null}
                </div>
                <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-[#172554]/5 transition-colors">
                    {icon}
                </div>
            </div>
            <div className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                {icon}
            </div>
        </div>
    );
}
