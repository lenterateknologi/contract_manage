import { useState, useEffect, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    TrendingUp,
    BarChart3,
    Briefcase,
    Filter,
    RotateCcw,
    ChevronDown,
    ChevronUp,
    Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchableMultiSelect } from '@/components/ui/forms/SearchableMultiSelect';
import { OverviewTab } from '@/components/dashboard/OverviewTab';
import { TrendTab } from '@/components/dashboard/TrendTab';
import { AnalysisTab } from '@/components/dashboard/AnalysisTab';
import { WorkloadTab } from '@/components/dashboard/WorkloadTab';

const ensureArrayFilter = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val.map(String);
    return String(val).split(',').filter(Boolean);
};

export function DashboardMetrics({ metrics }: { metrics: any }) {
    if (!metrics) return null;

    // Retrieve global options and filters from Inertia page props
    const {
        filters = {},
        regions = [],
        vendors = [],
        departments = [],
        types = [],
        users = [],
        auth
    } = usePage<any>().props;

    const loginUser = auth?.user;
    const isAdmin = loginUser?.role === 'Admin';
    const userDeptId = loginUser?.department_id;

    // Filter Area Collapsible State
    const [isFilterExpanded, setIsFilterExpanded] = useState(true);

    // Local Filter States
    const [createdFrom, setCreatedFrom] = useState(filters.created_from || '');
    const [createdTo, setCreatedTo] = useState(filters.created_to || '');
    const [regionIds, setRegionIds] = useState<string[]>(ensureArrayFilter(filters.region_ids));
    const [vendorIds, setVendorIds] = useState<string[]>(ensureArrayFilter(filters.vendor_ids));
    const [contractTypeIds, setContractTypeIds] = useState<string[]>(ensureArrayFilter(filters.contract_type_ids));
    const [picIds, setPicIds] = useState<string[]>(ensureArrayFilter(filters.pic_ids));
    const [departmentIds, setDepartmentIds] = useState<string[]>(
        !isAdmin && userDeptId ? [String(userDeptId)] : ensureArrayFilter(filters.department_ids)
    );
    const [statuses, setStatuses] = useState<string[]>(ensureArrayFilter(filters.statuses));

    // Sync state with incoming filters from Inertia (handles back/forward or resets)
    useEffect(() => {
        setCreatedFrom(filters.created_from || '');
        setCreatedTo(filters.created_to || '');
        setRegionIds(ensureArrayFilter(filters.region_ids));
        setVendorIds(ensureArrayFilter(filters.vendor_ids));
        setContractTypeIds(ensureArrayFilter(filters.contract_type_ids));
        setPicIds(ensureArrayFilter(filters.pic_ids));
        setDepartmentIds(!isAdmin && userDeptId ? [String(userDeptId)] : ensureArrayFilter(filters.department_ids));
        setStatuses(ensureArrayFilter(filters.statuses));
    }, [filters, isAdmin, userDeptId]);

    // Format options for SearchableMultiSelect
    const regionOptions = useMemo(() => regions.map((r: any) => ({ value: String(r.id), label: r.name })), [regions]);
    const vendorOptions = useMemo(() => vendors.map((v: any) => ({ value: String(v.id), label: v.name })), [vendors]);
    const departmentOptions = useMemo(() => departments.map((d: any) => ({ value: String(d.id), label: d.name })), [departments]);
    const typeOptions = useMemo(() => types.map((t: any) => ({ value: String(t.id), label: t.name })), [types]);
    const userOptions = useMemo(() => users.map((u: any) => ({ value: String(u.id), label: u.name })), [users]);
    const statusOptions = [
        { value: 'in_review', label: 'Review' },
        { value: 'revision', label: 'Revisi' },
        { value: 'pending', label: 'Pending Approval' },
        { value: 'approved', label: 'Disetujui' },
        { value: 'locked', label: 'Terkunci' },
    ];

    // Count active filters
    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (createdFrom) count++;
        if (createdTo) count++;
        if (regionIds.length > 0) count++;
        if (vendorIds.length > 0) count++;
        if (contractTypeIds.length > 0) count++;
        if (picIds.length > 0) count++;
        if (isAdmin && departmentIds.length > 0) count++;
        if (statuses.length > 0) count++;
        return count;
    }, [createdFrom, createdTo, regionIds, vendorIds, contractTypeIds, picIds, departmentIds, statuses, isAdmin]);

    const [activeTab, setActiveTab] = useState<'overview' | 'trend' | 'analysis' | 'workload'>('overview');

    const handleNavigate = (targetView: string) => {
        router.get('/contracts', { view: targetView });
    };

    const handleApplyFilters = () => {
        router.get('/contracts', {
            view: 'dashboard',
            created_from: createdFrom,
            created_to: createdTo,
            region_ids: regionIds.join(','),
            vendor_ids: vendorIds.join(','),
            contract_type_ids: contractTypeIds.join(','),
            pic_ids: picIds.join(','),
            department_ids: departmentIds.join(','),
            statuses: statuses.join(','),
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleResetFilters = () => {
        router.get('/contracts', {
            view: 'dashboard',
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <div className="animate-in fade-in slide-in-from-top-4 space-y-6 duration-500 select-none">

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

