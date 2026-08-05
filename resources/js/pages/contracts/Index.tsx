import { ProfileView } from '@/pages/contracts/components/parts/ProfileView';
import { DashboardMetrics, DashboardTab } from '@/pages/dashboard/components/DashboardMetrics';
import { Button } from '@/components/ui/buttons/Button';
import { PageTable } from '@/components/ui/navigation/PageTable';
import { Column, DataTable as TableContract } from '@/components/ui/tables/DataTable';
import { FilterPopover } from '@/components/ui/selection/FilterPopover';
import { StatusBadge } from '@/components/ui/feedback/StatusBadge';
import { ContractCardSkeleton, ContractTableSkeleton } from '@/components/ui/feedback/ContractSkeleton';
import LoadingLottie from '@/components/ui/feedback/LoadingLottie';
import { ToastProvider, useToast } from '@/components/ui/feedback/Toast';
import { SearchInput } from '@/components/ui/inputs/SearchInput';
import { LayoutToggle, LayoutType } from '@/components/ui/navigation/LayoutToggle';
import { ConfirmationModal } from '@/components/ui/dialogs/ConfirmationModal';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuSeparator,
} from '@/components/ui/selection/DropdownMenu';
import { useDebounce } from '@/hooks/use-debounce';
import { usePermissions } from '@/hooks/use-permissions';
import { contractApi } from '@/pages/contracts/utils';
import { cn } from '@/lib/utils';
import { Contract, ContractType, PaginatedData } from '@/pages/contracts/types';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    AlertCircle,
    AlertTriangle,
    Check,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Clock,
    Download,
    Eye,
    FileEdit,
    FileText,
    FileType,
    Filter,
    GitBranch,
    Hash,
    Layers,
    MoreVertical,
    PlusCircle,
    Trash2,
    User,
    UserPlus,
    Calendar,
    Zap,
    X,
    Search,
    History,
    LayoutGrid,
    LayoutDashboard,
    Briefcase,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState, lazy, Suspense, memo } from 'react';
import ContractDetailView from './components/ContractDetailView';
import { DateRangeCalendar } from '@/components/ui/inputs/DateRangeCalendar';
import { PageFilter } from './components/PageFilter';

// Lazy loaded modals for performance
const CreateContractModal = lazy(() => import('@/pages/contracts/components/modals/CreateContractModal'));
const EditContractModal = lazy(() => import('@/pages/contracts/components/modals/EditContractModal').then(m => ({ default: m.EditContractModal })));
const PreviewModal = lazy(() => import('@/pages/contracts/components/modals/PreviewModal'));
const SendApprovalModal = lazy(() => import('@/pages/contracts/components/modals/SendApprovalModal'));

const ensureArray = (val: any): any[] => {
    if (Array.isArray(val)) return val;
    return val ? [val] : [];
};

type View = 'dashboard' | 'contracts' | 'pending' | 'audit' | 'f1' | 'f2' | 'profile' | 'mine' | 'expiry';

import {
    renderAssignedBy,
    renderAssignedPic,
    renderContractNoAndTitle,
    renderInitiator,
    renderStatusAndStep,
    TypeAndVendorCell,
} from './components/ContractTableCells';

const SLACountdown = memo(({ deadline, status }: Readonly<{ deadline: string | null; status: string }>) => {
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [urgency, setUrgency] = useState<'normal' | 'warning' | 'danger'>('normal');

    useEffect(() => {
        if (!deadline || status === 'archived' || status === 'approved') {
            setTimeLeft('-');
            return;
        }

        const tick = () => {
            const now = Date.now();
            const target = new Date(deadline).getTime();
            const diff = target - now;

            if (diff <= 0) {
                setTimeLeft('OVERDUE');
                setUrgency('danger');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            if (days > 0) {
                setTimeLeft(`${days}d ${hours}h`);
                setUrgency(days < 1 ? 'warning' : 'normal');
            } else {
                setTimeLeft(`${hours}h ${minutes}m`);
                setUrgency(hours < 4 ? 'danger' : 'warning');
            }
        };

        tick();
        const timer = setInterval(tick, 1000 * 60);
        return () => clearInterval(timer);
    }, [deadline, status]);

    if (!deadline || status === 'archived' || status === 'approved') return <span className="text-[10px] text-black/40 dark:text-white/40">—</span>;

    const getUrgencyStyles = () => {
        if (urgency === 'danger') {
            return 'bg-rose-500 text-white ring-rose-400/40';
        }
        if (urgency === 'warning') {
            return 'bg-amber-100 text-amber-700 ring-amber-300/40';
        }
        return 'bg-sidebar-accent text-sidebar-foreground/60 ring-sidebar-border/40';
    };

    return (
        <div className={cn('flex w-fit items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1', getUrgencyStyles())}>
            <Clock size={10} className={urgency === 'danger' ? 'animate-pulse' : ''} />
            {timeLeft}
        </div>
    );
});

SLACountdown.displayName = 'SLACountdown';

const CreatedAtCell = memo(({ c }: Readonly<{ c: Contract }>) => (
    <span className="text-sidebar-foreground/40 text-[11px] font-medium">{c.created_at}</span>
));

CreatedAtCell.displayName = 'CreatedAtCell';

const renderCreatedAt = (c: Contract) => <CreatedAtCell c={c} />;

const BulkActions = memo(({
    selectedRows,
    canBulkApprove,
    handleBulkApprove,
    canBulkDelete,
    handleBulkDelete,
}: Readonly<{
    selectedRows: Contract[];
    canBulkApprove: boolean;
    handleBulkApprove: (rows: Contract[]) => void;
    canBulkDelete: boolean;
    handleBulkDelete: (rows: Contract[]) => void;
}>) => (
    <div className="flex items-center gap-2">
        {canBulkApprove && (
            <Button variant="outline" size="sm" onClick={() => handleBulkApprove(selectedRows)}>
                <Check className="mr-1.5 h-3 w-3" /> Approve
            </Button>
        )}
        {canBulkDelete && (
            <Button variant="outline" size="sm" onClick={() => handleBulkDelete(selectedRows)}>
                <Trash2 className="mr-1.5 h-3 w-3" /> Hapus
            </Button>
        )}
    </div>
));

BulkActions.displayName = 'BulkActions';

const RowActions = memo(({
    c,
    openDetail,
    setSelected,
    setEditOpen,
    setDeleteOpen,
}: Readonly<{
    c: Contract;
    openDetail: (c: Contract) => void;
    setSelected: (c: Contract) => void;
    setEditOpen: (open: boolean) => void;
    setDeleteOpen: (open: boolean) => void;
}>) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="group">
                <MoreVertical size={14} className="text-sidebar-foreground/40 group-hover:text-sidebar-primary" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
            align="end"
            className="border-sidebar-border dark:bg-sidebar-accent/90 w-52 rounded-xl bg-white p-1.5 shadow-2xl backdrop-blur-md"
        >
            <DropdownMenuItem
                onClick={() => openDetail(c)}
                className="flex cursor-pointer items-center gap-2 rounded-lg text-[11px] font-semibold tracking-tight text-slate-600 uppercase"
            >
                <Eye size={14} /> Lihat Detail
            </DropdownMenuItem>
            <DropdownMenuItem
                onClick={() => {
                    setSelected(c);
                    setEditOpen(true);
                }}
                className="flex cursor-pointer items-center gap-2 rounded-lg text-[11px] font-semibold tracking-tight text-slate-600 uppercase"
            >
                <FileEdit size={14} /> Perbarui
            </DropdownMenuItem>
            <div className="my-1 h-px bg-slate-50" />
            <DropdownMenuItem
                onClick={() => {
                    setSelected(c);
                    setDeleteOpen(true);
                }}
                className="flex cursor-pointer items-center gap-2 rounded-lg text-[11px] font-semibold tracking-tight text-rose-600 uppercase focus:bg-rose-50 focus:text-rose-600"
            >
                <Trash2 size={14} /> Hapus Data
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
));

RowActions.displayName = 'RowActions';

// ─── Multi Select Filter Dropdown (Divisi / Departemen) ─────────────────────
function MultiSelectFilterDropdown({
    label, hasActive, options, activeIds, onToggle, onReset
}: {
    label: string;
    hasActive: boolean;
    options: { id: string; name: string }[];
    activeIds: string[];
    onToggle: (id: string) => void;
    onReset: () => void;
}) {
    const [search, setSearch] = useState('');
    const filtered = options.filter(opt => 
        opt.name.toLowerCase().includes(search.toLowerCase())
    );

    const Cb = ({ checked }: { checked: boolean }) => (
        <span className={cn(
            'w-[14px] h-[14px] rounded border flex items-center justify-center shrink-0 transition-all',
            checked
                ? 'bg-primary border-primary'
                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
        )}>
            {checked && <Check size={8} strokeWidth={4} className="text-white" />}
        </span>
    );

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant={hasActive ? 'primary' : 'white'}
                    className="relative flex h-9 items-center justify-center gap-1.5 rounded-xl px-3 text-[11px] font-semibold border"
                >
                    <span>{label}</span>
                    <ChevronDown size={12} className="opacity-60" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl p-3 w-[260px] flex flex-col gap-2 max-h-[380px]">
                {/* Search */}
                <div className="relative">
                    <Search size={11} className="absolute left-2.5 top-2.5 text-text-desc" />
                    <input
                        type="text"
                        placeholder="Cari..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-7 pr-2 py-1.5 text-[10px] outline-none focus:border-primary text-text-main"
                    />
                </div>

                <div className="h-px bg-surface-border my-0.5" />

                {/* Items List */}
                <div className="flex-1 overflow-y-auto max-h-[220px] pr-1 flex flex-col gap-0.5">
                    {filtered.map(opt => {
                        const isChecked = activeIds.includes(String(opt.id));
                        return (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => onToggle(String(opt.id))}
                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] text-left text-text-desc hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-text-main transition-all cursor-pointer font-medium"
                            >
                                <Cb checked={isChecked} />
                                <span className="truncate">{opt.name}</span>
                            </button>
                        );
                    })}
                    {filtered.length === 0 && (
                        <span className="text-[10px] text-text-desc text-center py-4">Tidak ada data</span>
                    )}
                </div>

                {hasActive && (
                    <>
                        <div className="h-px bg-surface-border my-0.5" />
                        <button
                            type="button"
                            onClick={onReset}
                            className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] text-danger hover:bg-danger/10 transition-all font-semibold cursor-pointer"
                        >
                            Reset Filter
                        </button>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}



function ContractPage({
    contracts: contractsPaged,
    meId,
    meUser,
    initialSelected,
    types,
    submissionTypes = [],
    currentView,
    metrics,
    filters,
    formTemplates = [],
    users = [],
    vendors = [],
    departments = [],
    roles = [],
    companyGroups = [],
    companies = [],
    regions = [],
    divisions = [],
    organizationTree = [],
}: Readonly<{
    contracts: PaginatedData<Contract>;
    meId: string;
    meUser: any;
    initialSelected?: Contract | null;
    types: ContractType[];
    submissionTypes: any[];
    currentView: View;
    metrics: any;
    filters: {
        search?: string;
        status?: string;
        contract_type_id?: string;
        submission_type_id?: string;
        per_page?: number;
        role_id?: string;
        department_id?: string;
        created_from?: string;
        created_to?: string;
        company_group_id?: any;
        region_id?: any;
        company_id?: any;
        division_id?: any;
        company_group_ids?: any;
        region_ids?: any;
        company_ids?: any;
        department_ids?: any;
    };
    formTemplates?: any[];
    users?: any[];
    vendors?: any[];
    departments?: any[];
    roles?: any[];
    companyGroups?: any[];
    companies?: any[];
    regions?: any[];
    divisions?: any[];
    organizationTree?: any[];
}>) {
    const { showToast } = useToast();
    const { canUpdate } = usePermissions('CONTRACTS');
    const [view, setView] = useState<View>(currentView);
    const [dashboardTab, setDashboardTab] = useState<'overview' | 'workload' | 'master_data'>('overview');

    useEffect(() => {
        const config = metrics?.dashboardConfig;
        if (config) {
            if (dashboardTab === 'overview' && !config.show_overview) {
                if (config.show_workload) setDashboardTab('workload');
                else if (config.show_master_data) setDashboardTab('master_data');
            } else if (dashboardTab === 'workload' && !config.show_workload) {
                if (config.show_overview) setDashboardTab('overview');
                else if (config.show_master_data) setDashboardTab('master_data');
            } else if (dashboardTab === 'master_data' && !config.show_master_data) {
                if (config.show_overview) setDashboardTab('overview');
                else if (config.show_workload) setDashboardTab('workload');
            }
        }
    }, [metrics?.dashboardConfig, dashboardTab]);
    const [selected, setSelected] = useState<Contract | null>(initialSelected ?? null);
    const viewTitleMap: Record<string, string> = {
        dashboard: 'Dashboard Kontrak',
        contracts: 'Daftar Kontrak',
        mine: 'Kontrak Saya',
        pending: 'Persetujuan Tertunda',
        expiry: 'Masa Berlaku Kontrak',
        f1: 'Dokumen Formulir F1',
        f2: 'Dokumen Formulir F2',
        profile: 'Profil Saya',
    };
    const viewDescMap: Record<string, string> = {
        dashboard: 'Statistik dan ringkasan aktivitas kontrak.',
        contracts: 'Daftar seluruh kontrak dalam sistem.',
        mine: 'Daftar kontrak yang Anda buat.',
        pending: 'Kontrak yang menunggu persetujuan Anda.',
        expiry: 'Kontrak yang akan atau telah berakhir.',
        f1: 'Daftar kontrak dengan dokumen F1.',
        f2: 'Daftar kontrak dengan dokumen F2.',
        profile: 'Informasi akun dan pengaturan profil.',
    };
    const viewIconMap: Record<string, any> = {
        dashboard: LayoutGrid,
        contracts: FileText,
        mine: FileEdit,
        pending: Clock,
        expiry: History,
        f1: FileText,
        f2: FileText,
        profile: User,
    };
    const [search, setSearch] = useState(filters?.search || '');
    const debouncedSearch = useDebounce(search, 500);

    const handleFilterChange = useCallback(
        (newFilters: any) => {
            const merged = { ...filters, ...newFilters };
            const cleaned = Object.fromEntries(
                Object.entries(merged)
                    .map(([k, v]) => {
                        if (Array.isArray(v)) {
                            return [k, v.filter((item) => item !== undefined && item !== null && item !== '')];
                        }
                        return [k, v];
                    })
                    .filter(([k, v]) => {
                        if ((['company_group_id', 'region_id', 'company_id', 'division_id', 'department_id'] as string[]).includes(k as string)) {
                            return v !== undefined && v !== null;
                        }
                        return v !== undefined && v !== null && v !== '' && (Array.isArray(v) ? v.length > 0 : true);
                    })
            ) as any;
            router.get(globalThis.location.pathname, cleaned, { preserveState: true, preserveScroll: true, replace: true });
        },
        [filters],
    );

    // Trigger search when debounced value changes
    useEffect(() => {
        if (debouncedSearch !== (filters?.search || '')) {
            handleFilterChange({ search: debouncedSearch, page: 1 });
        }
    }, [debouncedSearch, handleFilterChange, filters?.search]);

    // Filter open state is handled internally by FilterPopover
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [sendOpen, setSendOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewTitle, setPreviewTitle] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const [previewHasFile, setPreviewHasFile] = useState(false);
    const [timelinePdfPreviewUrl, setTimelinePdfPreviewUrl] = useState<string | null>(null);

    const [layout, setLayout] = useState<'table' | 'grid'>('table');
    const [selectedRows, setSelectedRows] = useState<Contract[]>([]);

    interface DBContractType extends ContractType {
        parent_id?: string | null;
        level?: number;
    }

    const isDescendantOrSelf = useCallback((targetId: string | string[] | undefined, parentId: string): boolean => {
        if (!targetId) return false;
        if (Array.isArray(targetId)) {
            return targetId.some(id => isDescendantOrSelf(id, parentId));
        }
        if (targetId === parentId) return true;
        const target = types.find(t => t.id === targetId) as DBContractType | undefined;
        if (target && target.parent_id) {
            return isDescendantOrSelf(target.parent_id, parentId);
        }
        return false;
    }, [types]);

    const rootTypes = useMemo(() => {
        return (types as DBContractType[]).filter(t => !t.parent_id || t.level === 0);
    }, [types]);

    const renderDropdownItems = useCallback((parentId: string | null) => {
        const children = (types as DBContractType[]).filter(t => t.parent_id === parentId);
        if (children.length === 0) return null;

        return children.map(child => {
            const hasChildren = (types as DBContractType[]).some(t => t.parent_id === child.id);
            if (hasChildren) {
                return (
                    <DropdownMenuSub key={child.id}>
                        <DropdownMenuSubTrigger className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-xs px-3 py-2 flex items-center justify-between">
                            {child.name}
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 shadow-lg rounded-md min-w-[180px]">
                            <DropdownMenuItem
                                onClick={() => handleFilterChange({ contract_type_id: child.id, page: 1 })}
                                className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-xs px-3 py-2 font-semibold text-primary"
                            >
                                Semua {child.name}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1 border-t border-slate-100 dark:border-slate-800" />
                            {renderDropdownItems(child.id)}
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                );
            }

            return (
                <DropdownMenuItem
                    key={child.id}
                    onClick={() => handleFilterChange({ contract_type_id: child.id, page: 1 })}
                    className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-xs px-3 py-2"
                >
                    {child.name}
                </DropdownMenuItem>
            );
        });
    }, [types, handleFilterChange]);

    useEffect(() => {
        if (currentView && currentView !== view) setView(currentView);
    }, [currentView, view]);

    useEffect(() => {
        setSelected(initialSelected ?? null);
    }, [initialSelected]);

    const updateContract = useCallback(
        (c: Contract, silent = false) => {
            if (!silent) {
                // Always reload to sync Inertia props, but preserve state/scroll for smoothness
                router.reload({ preserveScroll: true, preserveState: true } as any);
            }
            if (selected?.id === c.id) setSelected(c);
        },
        [selected?.id],
    );

    const openDetail = useCallback((c: Contract) => {
        setSelected(c);
        router.get(route('contracts.show', c.id), {}, { preserveState: true, preserveScroll: true });
    }, []);

    const closeDetail = useCallback(() => {
        setSelected(null);
        router.get(route('contracts'), {}, { preserveState: true, preserveScroll: true });
    }, []);

    const canChangeCompanyGroup = useMemo(() => {
        const settings = meUser?.filter_settings;
        if (settings && typeof settings.can_change_company_group !== 'undefined') {
            return !!settings.can_change_company_group;
        }
        const role = meUser?.role;
        return role === 'Admin' || role === 'Super Admin' || !!meUser?.is_admin;
    }, [meUser]);

    const canChangeRegion = useMemo(() => {
        const settings = meUser?.filter_settings;
        if (settings && typeof settings.can_change_region !== 'undefined') {
            return !!settings.can_change_region;
        }
        const role = meUser?.role;
        return role === 'Admin' || role === 'Super Admin' || !!meUser?.is_admin;
    }, [meUser]);

    const canChangeCompany = useMemo(() => {
        const settings = meUser?.filter_settings;
        if (settings && typeof settings.can_change_company !== 'undefined') {
            return !!settings.can_change_company;
        }
        const role = meUser?.role;
        return role === 'Admin' || role === 'Super Admin' || !!meUser?.is_admin;
    }, [meUser]);

    const canChangeDivision = useMemo(() => {
        const settings = meUser?.filter_settings;
        if (settings && typeof settings.can_change_division !== 'undefined') {
            return !!settings.can_change_division;
        }
        const role = meUser?.role;
        return role === 'Admin' || role === 'Super Admin' || !!meUser?.is_admin;
    }, [meUser]);

    const filterCategories = useMemo(() => {
        const list: any[] = [
            {
                label: 'Departemen',
                key: 'department_id',
                type: 'searchable',
                options: (departments ?? []).map((d: any) => ({
                    label: d.name,
                    value: d.id,
                })),
            },
        ];
        return list;
    }, [departments]);

    const activeFiltersCount = useMemo(() => {
        const getCount = (val: any) => {
            if (Array.isArray(val)) return val.length;
            return val ? 1 : 0;
        };
        return getCount(filters.department_id);
    }, [filters]);

    const handleCreate = async (data: any) => {
        setProcessing(true);
        try {
            const newContract = await contractApi.create(data);
            showToast('Kontrak baru berhasil dibuat.', 'success');
            setCreateOpen(false);
            if (newContract && newContract.id) {
                openDetail(newContract);
            } else {
                router.reload();
            }
        } catch {
            showToast('Gagal membuat kontrak.', 'danger');
        } finally {
            setProcessing(false);
        }
    };

    const handleUpdateFromList = async (data: any) => {
        if (!selected) return;
        setProcessing(true);
        try {
            await contractApi.update(selected.id, data);
            showToast('Kontrak berhasil diperbarui.', 'success');
            setEditOpen(false);
            router.reload();
        } catch {
            showToast('Gagal memperbarui kontrak.', 'danger');
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async () => {
        if (!selected) return;
        setProcessing(true);
        try {
            await contractApi.delete(selected.id);
            showToast('Kontrak berhasil dihapus.', 'success');
            setDeleteOpen(false);
            setSelected(null);
            router.reload();
        } catch {
            showToast('Gagal menghapus kontrak.', 'danger');
        } finally {
            setProcessing(false);
        }
    };

    const handleSendSubmit = async (data: any) => {
        if (!selected) return;
        setProcessing(true);
        try {
            await contractApi.send(selected.id, data);
            showToast('Kontrak berhasil dikirim untuk approval.', 'success');
            setSendOpen(false);
            router.reload();
        } catch {
            showToast('Gagal mengirim approval.', 'danger');
        } finally {
            setProcessing(false);
        }
    };

    const canBulkApprove = useMemo(() => meUser?.role === 'Admin' || meUser?.role === 'Super Admin' || !!meUser?.is_admin, [meUser]);
    const canBulkDelete = useMemo(() => meUser?.role === 'Admin' || meUser?.role === 'Super Admin' || !!meUser?.is_admin, [meUser]);

    const handleBulkApprove = useCallback(async (rows: Contract[]) => {
        if (!confirm(`Setujui ${rows.length} kontrak terpilih?`)) return;
        setProcessing(true);
        try {
            await Promise.all(rows.map((r) => contractApi.approve(r.id, 'Bulk Approval')));
            showToast('Bulk approval berhasil.', 'success');
            router.reload();
        } catch {
            showToast('Gagal melakukan bulk approval.', 'danger');
        } finally {
            setProcessing(false);
        }
    }, [showToast]);

    const handleBulkDelete = useCallback(async (rows: Contract[]) => {
        if (!confirm(`Hapus ${rows.length} kontrak terpilih?`)) return;
        setProcessing(true);
        try {
            await Promise.all(rows.map((r) => contractApi.delete(r.id)));
            showToast('Bulk delete berhasil.', 'success');
            router.reload();
        } catch {
            showToast('Gagal melakukan bulk delete.', 'danger');
        } finally {
            setProcessing(false);
        }
    }, [showToast]);

    const handleSingleFilterToggle = (key: string, value: any) => {
        if (key === 'created_from' || key === 'created_to') {
            handleFilterChange({ [key]: value || '' });
            return;
        }

        const f = filters as any;
        const currentValues = ensureArray(f[key]);
        let newValues: any[];
        if (Array.isArray(value)) {
            newValues = value;
        } else {
            const stringValue = String(value);
            newValues = currentValues.map(String).includes(stringValue)
                ? currentValues.filter((v: any) => String(v) !== stringValue)
                : [...currentValues, stringValue];
        }

        handleFilterChange({ [key]: newValues });
    };

    const handleClearAllFilters = () => {
        handleFilterChange({
            status: [],
            contract_type_id: [],
            department_id: [],
            created_from: '',
            created_to: '',
            company_group_id: [],
            region_id: [],
            company_id: [],
            division_id: [],
        });
    };

    const renderBulkActions = useCallback(
        (selectedRows: Contract[]) => (
            <BulkActions
                selectedRows={selectedRows}
                canBulkApprove={canBulkApprove}
                handleBulkApprove={handleBulkApprove}
                canBulkDelete={canBulkDelete}
                handleBulkDelete={handleBulkDelete}
            />
        ),
        [canBulkApprove, handleBulkApprove, canBulkDelete, handleBulkDelete],
    );

    const renderTypeAndVendor = useCallback((c: Contract) => <TypeAndVendorCell c={c} types={types} />, [types]);

    const columns: Column<Contract>[] = useMemo(
        () => [
            {
                accessorKey: 'contract_no_title',
                header: (
                    <div className="flex items-center gap-2">
                        <Hash size={14} className="text-text-desc" />
                        <span>No. & Judul Kontrak</span>
                    </div>
                ),
                cell: renderContractNoAndTitle,
            },
            {
                accessorKey: 'contract_type_id',
                header: (
                    <div className="flex items-center gap-2">
                        <FileType size={14} className="text-text-desc" />
                        <span>Tipe & Vendor</span>
                    </div>
                ),
                cell: renderTypeAndVendor,
            },
            {
                accessorKey: 'initiator',
                header: (
                    <div className="flex items-center gap-2">
                        <User size={14} className="text-text-desc" />
                        <span>Pembuat</span>
                    </div>
                ),
                cell: renderInitiator,
            },
            {
                accessorKey: 'status',
                header: (
                    <div className="flex items-center gap-2">
                        <GitBranch size={14} className="text-text-desc" />
                        <span>Status & Step</span>
                    </div>
                ),
                cell: renderStatusAndStep,
            },
            {
                accessorKey: 'assigned_by',
                header: (
                    <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-text-desc" />
                        <span>Disetujui Oleh</span>
                    </div>
                ),
                cell: renderAssignedBy,
            },
            {
                accessorKey: 'assigned_pic',
                header: (
                    <div className="flex items-center gap-2">
                        <UserPlus size={14} className="text-text-desc" />
                        <span>Ditugaskan</span>
                    </div>
                ),
                cell: renderAssignedPic,
            },
            {
                accessorKey: 'created_at',
                header: (
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-text-desc" />
                        <span>Dibuat</span>
                    </div>
                ),
                cell: renderCreatedAt,
            },
        ],
        [types, renderTypeAndVendor],
    );

    return (
        <>
            <Head title={view} />
            <div className="bg-background dark:bg-background/50 flex min-h-0 flex-1 flex-col">
                {selected ? (
                    <div className="animate-in fade-in slide-in-from-bottom-3 flex w-full flex-1 flex-col overflow-y-auto duration-300 ease-in-out">
                        <ContractDetailView
                            contract={selected}
                            meId={meId}
                            types={types}
                            submissionTypes={submissionTypes}
                            vendors={vendors}
                            formTemplates={formTemplates}
                            users={users}
                            canUpdate={!!canUpdate || selected?.created_by === meId}
                            onClose={closeDetail}
                            onUpdate={updateContract}
                            showToast={showToast}
                            setDeleteOpen={setDeleteOpen}
                            setPreviewTitle={setPreviewTitle}
                            setPreviewUrl={setPreviewUrl}
                            setPreviewHasFile={setPreviewHasFile}
                            setPreviewOpen={setPreviewOpen}
                            meUser={meUser}
                        />
                    </div>
                ) : (
                    <PageTable
                        title={viewTitleMap[view] || 'Manajemen Kontrak'}
                        subtitle={viewDescMap[view] || 'Daftar seluruh kontrak dalam sistem.'}
                        icon={viewIconMap[view] || FileText}
                        {...(view === 'dashboard' ? {
                            actions: (() => {
                                const config = metrics?.dashboardConfig;
                                const showOverview = config ? !!config.show_overview : false;
                                const showWorkload = config ? !!config.show_workload : false;
                                const showMasterData = config ? !!config.show_master_data : false;

                                if (!showOverview && !showWorkload && !showMasterData) return null;

                                return (
                                    <div className="flex items-center gap-2">
                                        {showOverview && (
                                            <DashboardTab
                                                active={dashboardTab === 'overview'}
                                                onClick={() => setDashboardTab('overview')}
                                                label="Ringkasan"
                                                icon={LayoutDashboard}
                                            />
                                        )}
                                        {showWorkload && (
                                            <DashboardTab
                                                active={dashboardTab === 'workload'}
                                                onClick={() => setDashboardTab('workload')}
                                                label="Beban Kerja"
                                                icon={Briefcase}
                                            />
                                        )}
                                        {showMasterData && (
                                            <DashboardTab
                                                active={dashboardTab === 'master_data'}
                                                onClick={() => setDashboardTab('master_data')}
                                                label="Master Data"
                                                icon={Layers}
                                            />
                                        )}
                                    </div>
                                );
                            })()
                        } : (view !== 'profile' ? {
                            searchValue: search,
                            onSearchChange: setSearch,
                            searchPlaceholder: "Cari kontrak...",
                            actions: (
                                <>
                                    <LayoutToggle value={layout as LayoutType} onChange={(val) => setLayout(val)} />
                                    <Button variant="white" fontSize="11px" onClick={() => setCreateOpen(true)}>
                                        <PlusCircle size={16} strokeWidth={2.5} /> Kontrak Baru
                                    </Button>
                                </>
                            )
                        } : {}))}
                        pagination={view !== 'profile' && view !== 'dashboard' ? {
                            currentPage: contractsPaged.current_page,
                            lastPage: contractsPaged.last_page,
                            total: contractsPaged.total,
                            from: contractsPaged.from,
                            to: contractsPaged.to,
                            perPage: contractsPaged.per_page,
                            onPageChange: (page: number) =>
                                router.get(globalThis.location.pathname, { ...filters, page }, { preserveState: true }),
                            onPerPageChange: (perPage: number) =>
                                router.get(globalThis.location.pathname, { ...filters, page: 1, per_page: perPage }, { preserveState: true }),
                        } : undefined}
                    >
                        <div className="flex-1 overflow-auto">
                            {view === 'dashboard' && (
                                <div className="p-5">
                                    <DashboardMetrics metrics={metrics} activeTab={dashboardTab} />
                                </div>
                            )}
                            {view === 'profile' && <ProfileView meUser={meUser} showToast={showToast} />}
                            {view !== 'profile' && view !== 'dashboard' && (
                                <div className="bg-surface-base/20 border-surface-border flex min-h-0 flex-1 flex-col gap-0 overflow-hidden h-full">
                                    <PageFilter
                                        filters={filters}
                                        types={types}
                                        departments={departments}
                                        divisions={divisions}
                                        regions={regions}
                                        companies={companies}
                                        companyGroups={companyGroups}
                                        meUser={meUser}
                                        handleFilterChange={handleFilterChange}
                                    />

                                    <div className={cn('custom-scrollbar flex-1 overflow-auto', layout === 'grid' && 'p-4')}>
                                        {layout === 'table' ? (
                                            <TableContract
                                                columns={columns}
                                                data={contractsPaged.data}
                                                loading={processing}
                                                skeleton={<ContractTableSkeleton />}
                                                onRowClick={openDetail}
                                                onSelectionChange={setSelectedRows}
                                                selectedRows={selectedRows}
                                                bulkActions={renderBulkActions(selectedRows)}
                                            />
                                        ) : processing ? (
                                            <ContractCardSkeleton />
                                        ) : (
                                            <div className="flex flex-col gap-8">
                                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                                                    {contractsPaged.data.map((c) => (
                                                        <button
                                                            key={c.id}
                                                            onClick={() => openDetail(c)}
                                                            className="group border-surface-border bg-surface-base/60 hover:border-primary hover:shadow-primary/5 focus:ring-primary relative flex cursor-pointer flex-col gap-2.5 rounded-xl border p-3 text-left backdrop-blur-sm transition-all hover:shadow-md focus:ring-2 focus:outline-none"
                                                        >
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="group-hover:text-primary text-text-soft text-[9px] font-bold tracking-wider uppercase transition-all">
                                                                    {c.form_no || 'No Req'}
                                                                </span>
                                                                <div className="flex-shrink-0 origin-right scale-[0.75]">
                                                                    <StatusBadge status={c.status} statusInfo={(c as any).status_info} />
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-col gap-0.5">
                                                                <h3 className="group-hover:text-primary text-text-main truncate text-xs font-semibold tracking-tight uppercase transition-colors">
                                                                    {c.title}
                                                                </h3>
                                                                <span className="text-text-desc text-[9px] font-medium uppercase italic truncate">
                                                                    {c.contract_type}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center justify-between border-t border-surface-border/40 pt-2.5 text-[9px] font-semibold text-text-soft uppercase">
                                                                <div className="flex items-center gap-1.5 truncate max-w-[60%]">
                                                                    <span className="truncate">{c.initiator?.department_name || 'Umum'}</span>
                                                                    <span className="text-text-soft/40">•</span>
                                                                    <span className="truncate font-normal">{c.assigned_pic?.name || 'No PIC'}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 shrink-0">
                                                                    <span className="text-primary bg-primary/5 rounded-md px-1.5 py-0.5 font-bold">
                                                                        {c.progress.done}/{c.progress.total}
                                                                    </span>
                                                                    <div className="origin-right scale-[0.65]">
                                                                        <SLACountdown deadline={c.sla_deadline ?? null} status={c.status} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </PageTable>
                )}
            </div>

            <Suspense fallback={null}>
                <CreateContractModal
                    open={createOpen}
                    onClose={() => setCreateOpen(false)}
                    onSubmit={handleCreate}
                    types={types}
                    submissionTypes={submissionTypes}
                    users={users}
                    vendors={vendors}
                />
            </Suspense>
            <Suspense fallback={null}>
                <SendApprovalModal
                    open={sendOpen}
                    onClose={() => setSendOpen(false)}
                    onSubmit={handleSendSubmit}
                    contractType={selected?.contract_type ?? undefined}
                    users={users}
                />
            </Suspense>
            <Suspense fallback={null}>
                <EditContractModal
                    open={editOpen}
                    onClose={() => setEditOpen(false)}
                    onSubmit={handleUpdateFromList}
                    contract={selected}
                    types={types}
                    submissionTypes={submissionTypes}
                    vendors={vendors}
                    processing={processing}
                />
            </Suspense>
            {/* FilterSheet is removed and replaced by FilterPopover trigger above */}
            <ConfirmationModal
                open={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                onConfirm={handleDelete}
                title="Hapus Kontrak?"
                description="Seluruh data dokumen, riwayat, dan chat terkait kontrak ini akan dihapus secara permanen."
                processing={processing}
            />
            <Suspense fallback={null}>
                <PreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} title={previewTitle} url={previewUrl} hasFile={previewHasFile} />
            </Suspense>
            {timelinePdfPreviewUrl && (
                <div className="bg-surface-base/90 animate-in fade-in zoom-in-95 fixed inset-0 z-[100] flex flex-col backdrop-blur-xl duration-300">
                    <div className="border-surface-border bg-surface-muted flex h-16 items-center justify-between border-b px-6">
                        <div className="flex flex-col">
                            <h3 className="text-text-main flex items-center gap-2 text-sm font-semibold tracking-wider uppercase">
                                <FileText className="text-primary size-4" /> Export Alur Approval
                            </h3>
                            <span className="text-text-soft text-[10px] font-semibold tracking-wider uppercase">
                                {selected?.form_no} — Generation Complete
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button asChild variant="primary" className="h-9">
                                <a href={timelinePdfPreviewUrl} download={`Alur_Approval_${selected?.id}.pdf`}>
                                    <Download size={14} /> Download PDF
                                </a>
                            </Button>
                            <Button variant="outline" className="h-9" onClick={() => setTimelinePdfPreviewUrl(null)}>
                                Tutup
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-1 justify-center overflow-hidden p-8">
                        <div className="ring-surface-border animate-in slide-in-from-bottom-5 fill-mode-both h-full w-full max-w-[210mm] overflow-hidden rounded-xl bg-white shadow-2xl ring-1 delay-150 duration-500">
                            <iframe
                                src={`${timelinePdfPreviewUrl}#toolbar=0&navpanes=0`}
                                className="h-full w-full border-none"
                                title="Approval Timeline Preview"
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default function ContractsIndex({
    currentView = 'dashboard',
    contracts: initialContractsPaged = { data: [], links: [], current_page: 1, last_page: 1, total: 0, from: 0, to: 0, per_page: 10 } as any,
    types: initialTypes = [],
    submissionTypes: initialSubmissionTypes = [],
    formTemplates: initialFormTemplates = [],
    metrics: initialMetrics = null,
    initialSelected: initialSelectedProp = null,
    filters = {},
    users = [],
    vendors = [],
    departments = [],
    roles = [],
    companyGroups = [],
    regions = [],
    companies = [],
    organizationTree = [],
}: Readonly<{
    currentView?: View;
    contracts?: PaginatedData<Contract>;
    types?: ContractType[];
    submissionTypes?: any[];
    formTemplates?: any[];
    metrics?: any;
    initialSelected?: Contract | null;
    filters?: any;
    users?: any[];
    vendors?: any[];
    departments?: any[];
    roles?: any[];
    companyGroups?: any[];
    regions?: any[];
    companies?: any[];
    organizationTree?: any[];
}>) {
    const { auth } = usePage<{ auth: { user: any } }>().props;
    const meId = auth?.user?.id ?? '';
    const meUser = auth?.user ?? null;

    const [contractsPaged, setContractsPaged] = useState<PaginatedData<Contract>>(initialContractsPaged);
    const [types, setTypes] = useState<ContractType[]>(initialTypes);
    const [submissionTypes, setSubmissionTypes] = useState<any[]>(initialSubmissionTypes);
    const [metrics, setMetrics] = useState<any>(initialMetrics);

    const [bootLoading, setBootLoading] = useState(
        initialContractsPaged.data.length === 0 && !initialMetrics && !initialSelectedProp && initialTypes.length === 0,
    );

    useEffect(() => {
        setContractsPaged(initialContractsPaged);
    }, [initialContractsPaged]);
    useEffect(() => {
        if (initialTypes.length > 0) setTypes(initialTypes);
    }, [initialTypes]);
    useEffect(() => {
        if (initialSubmissionTypes.length > 0) setSubmissionTypes(initialSubmissionTypes);
    }, [initialSubmissionTypes]);
    useEffect(() => {
        if (initialMetrics) setMetrics(initialMetrics);
    }, [initialMetrics]);

    useEffect(() => {
        const hasCriticalData = initialContractsPaged.data.length > 0 || initialSelectedProp || initialMetrics;
        if (hasCriticalData && initialTypes.length > 0) {
            setBootLoading(false);
            return;
        }
        if (hasCriticalData) {
            setBootLoading(false);
        } else {
            setBootLoading(true);
            Promise.all([
                contractApi.list({ view: currentView }),
                contractApi.getTypes(),
                axios
                    .get('/api/contracts/submission-types')
                    .then((res) => res.data)
                    .catch(() => []),
                axios
                    .post('/admin/reports/api/data', {})
                    .then((res) => res.data)
                    .catch(() => null),
            ])
                .then(([cData, tData, sData, mData]) => {
                    setContractsPaged(cData as any);
                    setTypes(tData);
                    setSubmissionTypes(sData);
                    setMetrics(mData);
                    setBootLoading(false);
                })
                .catch(() => setBootLoading(false));
        }
    }, [currentView]);

    return (
        <>
            <Head title="Contract Manager" />
            <ToastProvider>
                {bootLoading ? (
                    <div className="bg-background flex h-screen flex-col items-center justify-center gap-6">
                        <div className="relative flex items-center justify-center">
                            <LoadingLottie width={180} height={180} />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="border-primary h-32 w-32 animate-spin rounded-full border-b-2 opacity-20" />
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-text-desc animate-pulse text-xs font-semibold tracking-wider uppercase">Memuat Sistem Kontrak</span>
                            <div className="bg-surface-muted h-0.5 w-48 overflow-hidden rounded-full">
                                <div className="animate-progress bg-primary h-full w-full origin-left" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <ContractPage
                        contracts={contractsPaged}
                        meId={meId}
                        meUser={meUser}
                        initialSelected={initialSelectedProp}
                        types={types}
                        submissionTypes={submissionTypes}
                        vendors={vendors}
                        formTemplates={initialFormTemplates}
                        currentView={currentView}
                        metrics={metrics}
                        filters={filters}
                        users={users}
                        departments={departments}
                        roles={roles}
                        companyGroups={companyGroups}
                        regions={regions}
                        companies={companies}
                        organizationTree={organizationTree}
                    />
                )}
            </ToastProvider>
        </>
    );
}
