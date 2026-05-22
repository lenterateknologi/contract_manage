import { useState, useEffect, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    TrendingUp,
    BarChart3,
    Briefcase,
    SlidersHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FilterSheet, FilterCategory } from '@/components/ui/data/FilterSheet';
import { OverviewTab } from '@/components/dashboard/OverviewTab';
import { TrendTab } from '@/components/dashboard/TrendTab';
import { AnalysisTab } from '@/components/dashboard/AnalysisTab';
import { WorkloadTab } from '@/components/dashboard/WorkloadTab';
import { Button } from '@/components/ui/base/Button';
import { Badge } from '@/components/ui/base/Badge';

const ensureArrayFilter = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val.map(String);
    return String(val).split(',').filter(Boolean);
};

export function DashboardMetrics({ metrics }: { metrics: any }) {
    if (!metrics) return null;

    const {
        filters = {},
        regions = [],
        vendors = [],
        departments = [],
        types = [],
        users = [],
        auth
    } = usePage<any>().props;

    const isAdmin = auth?.user?.role === 'Admin';

    // Filter Sheet State
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Filter values mapped from Inertia props
    const activeFilters = useMemo(() => ({
        period: filters.period || 'all',
        created: {
            from: filters.created_from || '',
            to: filters.created_to || ''
        },
        region_ids: ensureArrayFilter(filters.region_ids),
        vendor_ids: ensureArrayFilter(filters.vendor_ids),
        contract_type_ids: ensureArrayFilter(filters.contract_type_ids),
        pic_ids: ensureArrayFilter(filters.pic_ids),
        department_ids: ensureArrayFilter(filters.department_ids),
        statuses: ensureArrayFilter(filters.statuses),
    }), [filters]);

    const filterCategories = useMemo<FilterCategory[]>(() => {
        const cats: FilterCategory[] = [
            {
                label: 'Periode Laporan',
                key: 'period',
                type: 'grid',
                options: [
                    { value: 'all', label: 'Semua Waktu' },
                    { value: 'last_30_days', label: '30 Hari Terakhir' },
                    { value: 'last_6_months', label: '6 Bulan Terakhir' },
                    { value: 'last_year', label: '1 Tahun Terakhir' },
                    { value: 'current_year', label: 'Tahun Berjalan' },
                ]
            },
            {
                label: 'Rentang Kustom',
                key: 'created',
                type: 'date-range'
            },
            {
                label: 'Wilayah (Region)',
                key: 'region_ids',
                type: 'searchable',
                options: regions.map((r: any) => ({ value: String(r.id), label: r.name }))
            },
            {
                label: 'Vendor / Partner',
                key: 'vendor_ids',
                type: 'searchable',
                options: vendors.map((v: any) => ({ value: String(v.id), label: v.name }))
            },
            {
                label: 'Tipe Kontrak',
                key: 'contract_type_ids',
                type: 'searchable',
                options: types.map((t: any) => ({ value: String(t.id), label: t.name }))
            },
            {
                label: 'PIC / Person In Charge',
                key: 'pic_ids',
                type: 'searchable',
                options: users.map((u: any) => ({ value: String(u.id), label: u.name }))
            },
            {
                label: 'Status Progres',
                key: 'statuses',
                type: 'grid',
                options: [
                    { value: 'in_review', label: 'Review' },
                    { value: 'revision', label: 'Revisi' },
                    { value: 'pending', label: 'Pending Approval' },
                    { value: 'approved', label: 'Disetujui' },
                    { value: 'locked', label: 'Terkunci' },
                ]
            }
        ];

        if (isAdmin) {
            cats.splice( cats.length - 1, 0, {
                label: 'Departemen / Divisi',
                key: 'department_ids',
                type: 'searchable',
                options: departments.map((d: any) => ({ value: String(d.id), label: d.name }))
            });
        }

        return cats;
    }, [regions, vendors, types, users, departments, isAdmin]);

    const activeCount = useMemo(() => {
        let count = 0;
        if (filters.period && filters.period !== 'all') count++;
        if (filters.created_from) count++;
        if (filters.created_to) count++;
        if (filters.region_ids) count++;
        if (filters.vendor_ids) count++;
        if (filters.contract_type_ids) count++;
        if (filters.pic_ids) count++;
        if (filters.department_ids) count++;
        if (filters.statuses) count++;
        return count;
    }, [filters]);

    const handleFilterChange = (key: string, value: any) => {
        const newParams: any = { ...filters, view: 'dashboard' };
        
        if (key === 'created_from' || key === 'created_to') {
            newParams[key] = value;
            if (value) newParams.period = 'all';
        } else if (Array.isArray(value)) {
            newParams[key] = value.join(',');
        } else {
            newParams[key] = value;
        }

        router.get('/contracts', newParams, { preserveState: true, preserveScroll: true });
    };

    const handleReset = () => {
        router.get('/contracts', { view: 'dashboard', period: 'all' }, { replace: true });
    };

    const [activeTab, setActiveTab] = useState<'overview' | 'trend' | 'analysis' | 'workload'>('overview');
    const handleNavigate = (targetView: string) => router.get('/contracts', { view: targetView });

    return (
        <div className="animate-in fade-in slide-in-from-top-4 space-y-6 duration-500 select-none">
            
            {/* Dashboard Header with Filter Trigger */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/10">
                        <LayoutDashboard size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Dashboard Kontrak</h1>
                        <p className="text-muted-foreground text-xs">Sentralisasi Pemantauan Aset Hukum & Pengadaan</p>
                    </div>
                </div>

                <Button
                    variant={activeCount > 0 ? "primary" : "outline"}
                    size="lg"
                    onClick={() => setIsFilterOpen(true)}
                    className="gap-2.5 font-bold"
                >
                    <SlidersHorizontal size={16} />
                    Filter Data
                    {activeCount > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] rounded-full px-1.5 bg-white text-primary">
                            {activeCount}
                        </Badge>
                    )}
                </Button>
            </div>

            <FilterSheet
                isOpen={isFilterOpen}
                onOpenChange={setIsFilterOpen}
                title="Parameter Analitik"
                description="Gunakan filter di bawah untuk menyesuaikan cakupan data pada seluruh laporan dashboard."
                categories={filterCategories}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                onReset={handleReset}
                applyText="Terapkan"
            />

            {/* Premium Tab Switcher */}
            <div className="flex border-b border-border/40 gap-6">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={cn(
                        'relative pb-3 text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer',
                        activeTab === 'overview'
                            ? 'text-foreground font-extrabold'
                            : 'text-muted-foreground hover:text-foreground',
                    )}
                >
                    <LayoutDashboard size={14} />
                    Ringkasan
                    {activeTab === 'overview' && (
                        <div className="absolute right-0 bottom-0 left-0 h-0.5 bg-primary rounded-full animate-in fade-in zoom-in-95 duration-300" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('trend')}
                    className={cn(
                        'relative pb-3 text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer',
                        activeTab === 'trend'
                            ? 'text-foreground font-extrabold'
                            : 'text-muted-foreground hover:text-foreground',
                    )}
                >
                    <TrendingUp size={14} />
                    Tren
                    {activeTab === 'trend' && (
                        <div className="absolute right-0 bottom-0 left-0 h-0.5 bg-primary rounded-full animate-in fade-in zoom-in-95 duration-300" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('analysis')}
                    className={cn(
                        'relative pb-3 text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer',
                        activeTab === 'analysis'
                            ? 'text-foreground font-extrabold'
                            : 'text-muted-foreground hover:text-foreground',
                    )}
                >
                    <BarChart3 size={14} />
                    Analisis
                    {activeTab === 'analysis' && (
                        <div className="absolute right-0 bottom-0 left-0 h-0.5 bg-primary rounded-full animate-in fade-in zoom-in-95 duration-300" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('workload')}
                    className={cn(
                        'relative pb-3 text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer',
                        activeTab === 'workload'
                            ? 'text-foreground font-extrabold'
                            : 'text-muted-foreground hover:text-foreground',
                    )}
                >
                    <Briefcase size={14} />
                    Beban Kerja
                    {activeTab === 'workload' && (
                        <div className="absolute right-0 bottom-0 left-0 h-0.5 bg-primary rounded-full animate-in fade-in zoom-in-95 duration-300" />
                    )}
                </button>
            </div>

            {/* Tab Contents with Transition Animations */}
            <div className="transition-all duration-300">
                {activeTab === 'overview' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <OverviewTab data={metrics} onNavigate={handleNavigate} />
                    </div>
                )}

                {activeTab === 'trend' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <TrendTab data={metrics} />
                    </div>
                )}

                {activeTab === 'analysis' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <AnalysisTab data={metrics} />
                    </div>
                )}

                {activeTab === 'workload' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <WorkloadTab data={metrics} />
                    </div>
                )}
            </div>
        </div>
    );
}

