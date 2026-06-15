import { Input } from '@/components/ui/base/Input';
import { ScrollArea } from '@/components/ui/base/ScrollArea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/overlays/Popover';
import { cn } from '@/lib/utils';
import { router, usePage } from '@inertiajs/react';
import { Briefcase, Check, ChevronDown, LayoutDashboard, Search, X, Loader2 } from 'lucide-react';
import React, { useMemo, useState, lazy, Suspense } from 'react';

// Lazy load heavy dashboard tabs
const OverviewTab = lazy(() => import('@/pages/dashboard/components/OverviewTab').then(m => ({ default: m.OverviewTab })));
const WorkloadTab = lazy(() => import('@/pages/dashboard/components/WorkloadTab').then(m => ({ default: m.WorkloadTab })));

const TabLoading = () => (
    <div className="flex h-[400px] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
            <Loader2 className="text-primary h-8 w-8 animate-spin opacity-20" />
            <p className="text-text-soft text-[10px] font-bold tracking-widest uppercase">Memuat Analisis...</p>
        </div>
    </div>
);

const ensureArrayFilter = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val.map(String);
    return String(val).split(',').filter(Boolean);
};

interface DropdownSearchFilterProps {
    label: string;
    options: Array<{ value: string; label: string }>;
    selectedValues: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
}

function DropdownSearchFilter({ label, options, selectedValues, onChange, placeholder = 'Cari...' }: DropdownSearchFilterProps) {
    const [search, setSearch] = useState('');
    const filteredOptions = useMemo(() => {
        return options.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase()));
    }, [options, search]);

    const handleToggle = (value: string) => {
        const next = selectedValues.includes(value) ? selectedValues.filter((v) => v !== value) : [...selectedValues, value];
        onChange(next);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange([]);
    };

    const selectedLabels = useMemo(() => {
        return options.filter((opt) => selectedValues.includes(opt.value)).map((opt) => opt.label);
    }, [options, selectedValues]);

    return (
        <Popover className="relative">
            <PopoverTrigger
                className={cn(
                    'hover:bg-muted/10 flex h-10 cursor-pointer items-center gap-2 rounded-xl border px-4 text-xs font-semibold shadow-sm transition-all outline-none select-none',
                    selectedValues.length > 0
                        ? 'bg-primary/5 text-primary border-primary/50'
                        : 'dark:bg-surface-base border-surface-border text-text-soft hover:text-text-main bg-white',
                )}
            >
                <span className="max-w-[120px] truncate">{selectedValues.length > 0 ? `${label}: ${selectedLabels.join(', ')}` : label}</span>
                {selectedValues.length > 0 && (
                    <span className="bg-primary flex h-3.5 min-w-[14px] items-center justify-center rounded-full px-0.5 text-[8px] font-bold text-white">
                        {selectedValues.length}
                    </span>
                )}
                {selectedValues.length > 0 ? (
                    <span onClick={handleClear} className="rounded p-0.5 transition-colors hover:text-rose-500">
                        <X size={10} strokeWidth={2.5} />
                    </span>
                ) : (
                    <ChevronDown size={12} className="opacity-60" />
                )}
            </PopoverTrigger>

            <PopoverContent
                align="start"
                className="border-surface-border dark:bg-surface-base absolute top-full z-[999] mt-2 w-[240px] overflow-hidden rounded-xl border bg-white p-0 shadow-xl"
            >
                <div className="border-surface-border bg-muted/10 border-b p-2">
                    <div className="relative">
                        <Search className="text-text-soft absolute top-1/2 left-2.5 -translate-y-1/2" size={12} />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={placeholder}
                            className="bg-surface-muted/30 border-surface-border h-8 rounded-lg pl-8 text-xs"
                        />
                    </div>
                </div>

                <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                    <div className="space-y-0.5 p-1">
                        {filteredOptions.length === 0 ? (
                            <div className="py-6 text-center">
                                <p className="text-text-soft text-[10px] font-bold uppercase">Tidak ditemukan</p>
                            </div>
                        ) : (
                            filteredOptions.map((opt) => {
                                const isSelected = selectedValues.includes(opt.value);
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => handleToggle(opt.value)}
                                        className={cn(
                                            'flex w-full items-center justify-between rounded-md p-2 text-left text-xs font-semibold transition-all select-none',
                                            isSelected ? 'bg-primary-muted text-primary' : 'text-text-main hover:bg-surface-muted',
                                        )}
                                    >
                                        <span className="truncate pr-2">{opt.label}</span>
                                        <div
                                            className={cn(
                                                'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-all',
                                                isSelected
                                                    ? 'border-primary bg-primary text-white'
                                                    : 'border-surface-border dark:bg-surface-base bg-white',
                                            )}
                                        >
                                            {isSelected && <Check size={10} strokeWidth={3} />}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

export function DashboardMetrics({ metrics }: { metrics: any }) {
    if (!metrics) return null;

    const {
        filters = {},
        regions = [],
        vendors = [],
        departments = [],
        types = [],
        users = [],
        companyGroups = [],
        companies = [],
        auth,
    } = usePage<any>().props;

    const roleName = auth?.user?.role || 'Staff';
    const hasFullAccess = ['Admin', 'Super Admin', 'Director', 'CEO', 'VP'].includes(roleName);
    const isManager = roleName === 'Manager';
    const hasDepartmentAccess = !hasFullAccess && !isManager;

    const isAdmin = hasFullAccess;

    // Filter values mapped from Inertia props
    const activeFilters = useMemo(
        () => ({
            region_ids: ensureArrayFilter(filters.region_ids),
            company_group_ids: ensureArrayFilter(filters.company_group_ids),
            company_ids: ensureArrayFilter(filters.company_ids),
            department_ids: ensureArrayFilter(filters.department_ids),
        }),
        [filters],
    );

    const handleFilterChange = (key: string, value: any) => {
        const newParams: any = { ...filters, view: 'dashboard' };

        if (Array.isArray(value)) {
            newParams[key] = value.join(',');
        } else {
            newParams[key] = value;
        }

        router.get('/contracts', newParams, { preserveState: true, preserveScroll: true });
    };

    const [activeTab, setActiveTab] = useState<'overview' | 'workload'>('overview');
    const handleNavigate = (targetView: string, params?: any) => {
        if (targetView === 'pending') {
            router.get('/contracts/pending', params);
        } else if (targetView === 'expiry') {
            router.get('/contracts/expiry', params);
        } else if (targetView === 'mine') {
            router.get('/contracts/mine', params);
        } else {
            router.get('/contracts', params);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-top-4 space-y-8 duration-500 select-none">
            {/* Premium Chip Navigation */}
            <div className="flex flex-col justify-between gap-6 pb-2 md:flex-row md:items-center">
                <div className="flex scrollbar-none items-center gap-3 overflow-x-auto pb-2 md:pb-0">
                    <DashboardTab
                        active={activeTab === 'overview'}
                        onClick={() => setActiveTab('overview')}
                        label="Ringkasan"
                        icon={LayoutDashboard}
                    />
                    <DashboardTab active={activeTab === 'workload'} onClick={() => setActiveTab('workload')} label="Beban Kerja" icon={Briefcase} />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {hasFullAccess && (
                        <>
                            <DropdownSearchFilter
                                label="Wilayah"
                                options={regions.map((r: any) => ({ value: String(r.id), label: r.name }))}
                                selectedValues={activeFilters.region_ids}
                                onChange={(vals) => handleFilterChange('region_ids', vals)}
                                placeholder="Cari wilayah..."
                            />
                            <DropdownSearchFilter
                                label="Grup"
                                options={companyGroups.map((g: any) => ({ value: String(g.id), label: g.name }))}
                                selectedValues={activeFilters.company_group_ids}
                                onChange={(vals) => handleFilterChange('company_group_ids', vals)}
                                placeholder="Cari grup..."
                            />
                            <DropdownSearchFilter
                                label="Perusahaan"
                                options={companies.map((c: any) => ({ value: String(c.id), label: c.name }))}
                                selectedValues={activeFilters.company_ids}
                                onChange={(vals) => handleFilterChange('company_ids', vals)}
                                placeholder="Cari perusahaan..."
                            />
                            <DropdownSearchFilter
                                label="Divisi"
                                options={departments.map((d: any) => ({ value: String(d.id), label: d.name }))}
                                selectedValues={activeFilters.department_ids}
                                onChange={(vals) => handleFilterChange('department_ids', vals)}
                                placeholder="Cari divisi..."
                            />
                        </>
                    )}

                    {isManager && (
                        <>
                            <DropdownSearchFilter
                                label="Perusahaan"
                                options={companies.map((c: any) => ({ value: String(c.id), label: c.name }))}
                                selectedValues={activeFilters.company_ids}
                                onChange={(vals) => handleFilterChange('company_ids', vals)}
                                placeholder="Cari perusahaan..."
                            />
                            <DropdownSearchFilter
                                label="Divisi"
                                options={departments.map((d: any) => ({ value: String(d.id), label: d.name }))}
                                selectedValues={activeFilters.department_ids}
                                onChange={(vals) => handleFilterChange('department_ids', vals)}
                                placeholder="Cari divisi..."
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Tab Contents with Premium Transitions */}
            <div className="transition-all duration-300">
                <Suspense fallback={<TabLoading />}>
                    {activeTab === 'overview' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <OverviewTab data={metrics} onNavigate={handleNavigate} />
                        </div>
                    )}

                    {activeTab === 'workload' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <WorkloadTab data={metrics} />
                        </div>
                    )}
                </Suspense>
            </div>
        </div>
    );
}

function DashboardTab({ active, onClick, label, icon: Icon }: { active: boolean; onClick: () => void; label: string; icon: any }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'group relative flex cursor-pointer items-center gap-2.5 rounded-2xl border px-5 py-2.5 text-[11px] font-semibold tracking-[0.15em] whitespace-nowrap uppercase transition-all duration-300 outline-none',
                active
                    ? 'bg-primary text-primary-foreground border-primary shadow-[0_8px_20px_-8px_rgba(79,70,229,0.5)]'
                    : 'bg-surface-muted/30 text-text-soft border-surface-border/60 hover:bg-surface-muted/60 hover:text-text-main',
            )}
        >
            <Icon
                size={14}
                className={cn('transition-colors', active ? 'text-primary-foreground' : 'text-text-soft group-hover:text-primary opacity-60')}
            />
            {label}
        </button>
    );
}
