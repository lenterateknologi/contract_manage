import { Input } from '@/components/ui/inputs/Input';
import { ScrollArea } from '@/components/ui/utilities/ScrollArea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/dialogs/Popover';
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
                    'hover:bg-muted/10 flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-[11px] font-semibold shadow-xs transition-all outline-none select-none',
                    selectedValues.length > 0
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-transparent border-surface-border text-text-main hover:bg-surface-muted/50',
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
                className="border-surface-border dark:bg-surface-base absolute top-full z-[999] mt-2 w-[240px] overflow-hidden rounded-lg border bg-white p-0 shadow-xl"
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
                                            isSelected ? 'bg-primary text-primary-foreground' : 'bg-transparent text-text-main hover:bg-surface-muted/50',
                                        )}
                                    >
                                        <span className="truncate pr-2">{opt.label}</span>
                                        <div
                                            className={cn(
                                                'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-all',
                                                isSelected
                                                    ? 'border-primary-foreground bg-primary-foreground text-primary'
                                                    : 'border-surface-border bg-transparent',
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
        <div className="animate-in fade-in slide-in-from-top-4 space-y-6 duration-500 select-none">
            {/* Premium Chip Navigation */}
            <div className="flex flex-col justify-between gap-4 pb-2 md:flex-row md:items-center">
                <div className="flex scrollbar-none items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                    <DashboardTab
                        active={activeTab === 'overview'}
                        onClick={() => setActiveTab('overview')}
                        label="Ringkasan"
                        icon={LayoutDashboard}
                    />
                    <DashboardTab active={activeTab === 'workload'} onClick={() => setActiveTab('workload')} label="Beban Kerja" icon={Briefcase} />
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
                'group relative flex cursor-pointer items-center gap-2 rounded-lg border px-3.5 py-1.5 text-[10px] font-bold tracking-[0.1em] whitespace-nowrap uppercase transition-all duration-300 outline-none',
                active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-transparent text-primary border-primary/50 hover:bg-primary/10 hover:border-primary',
            )}
        >
            <Icon
                size={12}
                className={cn('transition-colors', active ? 'text-primary-foreground' : 'text-primary opacity-70 group-hover:opacity-100')}
            />
            {label}
        </button>
    );
}
