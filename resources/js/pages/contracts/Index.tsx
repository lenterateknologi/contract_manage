import { Icons } from '@/components/ui';
import { Button } from '@/components/ui/buttons/Button';
import { ConfirmationModal } from '@/components/ui/dialogs/ConfirmationModal';
import { ContractCardSkeleton, ContractTableSkeleton } from '@/components/ui/feedback/ContractSkeleton';
import { DashboardSkeleton } from '@/components/ui/feedback/DashboardSkeleton';
import LoadingLottie from '@/components/ui/feedback/LoadingLottie';
import { StatusBadge } from '@/components/ui/feedback/StatusBadge';
import { ToastProvider, useToast } from '@/components/ui/feedback/Toast';
import { FloatingPanel } from '@/components/ui/navigation/FloatingPanel';
import { LayoutToggle, LayoutType } from '@/components/ui/navigation/LayoutToggle';
import { MasterPageLayout } from '@/components/ui/navigation/MasterPageLayout';
import { PageTable } from '@/components/ui/navigation/PageTable';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/selection/DropdownMenu';
import { Column, DataTable as TableContract } from '@/components/ui/tables/DataTable';
import { useDebounce } from '@/hooks/use-debounce';
import { usePermissions } from '@/hooks/use-permissions';
import { getClientPref, setClientPref } from '@/lib/clientStorage';
import { cn, formatDate } from '@/lib/utils';
import { ProfileView } from '@/pages/contracts/components/parts/ProfileView';
import { Contract, ContractType, PaginatedData } from '@/pages/contracts/types';
import { DashboardMetrics, DashboardTab } from '@/pages/dashboard/components/DashboardMetrics';
import { usePov } from '@/stores/usePovStore';
import { Head, router, usePage } from '@inertiajs/react';
import { Building2 } from 'lucide-react';
import { lazy, memo, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { PageFilter } from './components/PageFilter';

const {
    Archive,
    Check,
    ChevronDown,
    Clock,
    Download,
    Eye,
    FileEdit,
    FileText,
    FileType,
    FilePlus,
    FileCheck,
    Filter,
    GitBranch,
    Hash,
    Layers,
    MoreVertical,
    Trash2,
    User,
    UserPlus,
    Calendar,
    Zap,
    History,
    LayoutGrid,
    LayoutDashboard,
    Briefcase,
    ExternalLink,
} = Icons;

// Lazy loaded views and modals for fast initial page render
const ContractDetailView = lazy(() => import('./components/ContractDetailView'));
const CreateContractModal = lazy(() => import('@/pages/contracts/components/modals/CreateContractModal'));
const EditContractModal = lazy(() => import('@/pages/contracts/components/modals/EditContractModal').then(m => ({ default: m.EditContractModal })));
const PreviewModal = lazy(() => import('@/pages/contracts/components/modals/PreviewModal'));
const SendApprovalModal = lazy(() => import('@/pages/contracts/components/modals/SendApprovalModal'));


type View = 'dashboard' | 'contracts' | 'pending' | 'audit' | 'f1' | 'f2' | 'profile' | 'mine' | 'expiry' | 'archived' | 'in_progress';

import {
    ContractNoAndTitleCell,
    ExpiryBadge,
    renderAssignedPic,
    renderContractPeriod,
    renderInitiator,
    renderStatusAndStep,
    renderVendor,
} from './components/ContractTableCells';
import { contractApi } from './utils';

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
    companyGroups = [],
    companies = [],
    regions = [],
    divisions = [],
    mineCounts,
    parentCategoryCounts,
    pendingCounts,
    expiryCategoryCounts,
}: Readonly<{
    contracts: PaginatedData<Contract>;
    meId: string;
    meUser: any;
    initialSelected?: Contract | null;
    types: ContractType[];
    submissionTypes: any[];
    currentView: View;
    metrics: any;
    mineCounts?: {
        all: number;
        kontrak: number;
        non_kontrak: number;
        nda: number;
        in_progress: number;
        archived: number;
    };
    parentCategoryCounts?: {
        all: number;
        kontrak: number;
        non_kontrak: number;
        nda: number;
        in_progress: number;
        archived: number;
    };
    pendingCounts?: {
        pending: number;
        history: number;
    };
    expiryCategoryCounts?: {
        all: number;
        kontrak: number;
        non_kontrak: number;
        nda: number;
    };
    filters: {
        search?: string;
        status?: string;
        contract_type_id?: string;
        submission_type_id?: string;
        per_page?: number;
        mine_tab?: string;
        parent_tab?: string;
        pending_tab?: string;
        expiry_tab?: string;
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
    locations?: any[];
    divisions?: any[];
    organizationTree?: any[];
}>) {
    const { showToast } = useToast();
    const { masterContractStatuses } = usePage<any>().props;
    const { canUpdate } = usePermissions('CONTRACTS');
    const pov = usePov();
    const [view, setView] = useState<View>(currentView);
    const [dashboardTab, setDashboardTab] = useState<'overview' | 'overview_contract' | 'overview_non_contract' | 'overview_nda' | 'workload' | 'master_data'>(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const tabParam = urlParams.get('dashboard_tab') || urlParams.get('tab');
            const validTabs = ['overview', 'overview_contract', 'overview_non_contract', 'overview_nda', 'workload', 'master_data'];
            if (tabParam && validTabs.includes(tabParam)) {
                return tabParam as any;
            }
            const saved = getClientPref<string>('dashboard_active_tab', '');
            if (saved && validTabs.includes(saved)) {
                return saved as any;
            }
        }
        return 'overview_contract';
    });

    const handleDashboardTabChange = (newTab: 'overview' | 'overview_contract' | 'overview_non_contract' | 'overview_nda' | 'workload' | 'master_data') => {
        setDashboardTab(newTab);
        setClientPref('dashboard_active_tab', newTab);
    };

    const effectiveDashboardConfig = useMemo(() => {
        const baseConfig = metrics?.dashboardConfig || {
            show_overview: false,
            show_overview_contract: true,
            show_overview_non_contract: true,
            show_overview_nda: true,
            show_workload: true,
            show_master_data: true,
            has_setting: true,
        };
        if (pov.activeDashboardPov.config !== undefined) {
            return {
                ...baseConfig,
                ...pov.activeDashboardPov.config,
                has_setting: true,
            };
        }
        return baseConfig;
    }, [metrics?.dashboardConfig, pov.activeDashboardPov]);

    useEffect(() => {
        const config = effectiveDashboardConfig;
        if (config) {
            const isCurrentTabEnabled =
                (dashboardTab === 'overview' && config.show_overview) ||
                (dashboardTab === 'overview_contract' && config.show_overview_contract) ||
                (dashboardTab === 'overview_non_contract' && config.show_overview_non_contract) ||
                (dashboardTab === 'overview_nda' && config.show_overview_nda) ||
                (dashboardTab === 'workload' && config.show_workload) ||
                (dashboardTab === 'master_data' && config.show_master_data);

            if (!isCurrentTabEnabled) {
                if (config.show_overview_contract) handleDashboardTabChange('overview_contract');
                else if (config.show_overview_non_contract) handleDashboardTabChange('overview_non_contract');
                else if (config.show_overview_nda) handleDashboardTabChange('overview_nda');
                else if (config.show_overview) handleDashboardTabChange('overview');
                else if (config.show_workload) handleDashboardTabChange('workload');
                else if (config.show_master_data) handleDashboardTabChange('master_data');
            }
        }
    }, [effectiveDashboardConfig, dashboardTab]);
    const [selected, setSelected] = useState<Contract | null>(initialSelected ?? null);
    const viewTitleMap: Record<string, string> = {
        dashboard: 'Dashboard Kontrak',
        contracts: filters?.parent_tab === 'kontrak'
            ? 'Semua Pengajuan - Kontrak'
            : filters?.parent_tab === 'non_kontrak'
                ? 'Semua Pengajuan - Non Kontrak'
                : filters?.parent_tab === 'nda'
                    ? 'Semua Pengajuan - NDA'
                    : 'Semua Pengajuan',
        mine: filters?.mine_tab === 'kontrak'
            ? 'Pengajuan Saya - Kontrak'
            : filters?.mine_tab === 'non_kontrak'
                ? 'Pengajuan Saya - Non Kontrak'
                : filters?.mine_tab === 'nda'
                    ? 'Pengajuan Saya - NDA'
                    : 'Pengajuan Saya',
        pending: filters?.pending_tab === 'history' ? 'Persetujuan Saya - Riwayat Persetujuan' : 'Persetujuan Saya - Perlu Persetujuan',
        expiry: filters?.expiry_tab === 'kontrak'
            ? 'Masa Berlaku - Kontrak'
            : filters?.expiry_tab === 'non_kontrak'
                ? 'Masa Berlaku - Non Kontrak'
                : filters?.expiry_tab === 'nda'
                    ? 'Masa Berlaku - NDA'
                    : 'Masa Berlaku Kontrak',
        archived: 'Arsip Dokumen',
        in_progress: 'On Progress',
        f1: 'Dokumen Formulir F1',
        f2: 'Dokumen Formulir F2',
        profile: 'Profil Saya',
    };
    const viewDescMap: Record<string, string> = {
        dashboard: 'Statistik dan ringkasan aktivitas kontrak.',
        contracts: 'Daftar seluruh arsip dokumen pengajuan dalam sistem.',
        mine: 'Daftar dokumen pengajuan yang Anda buat.',
        pending: filters?.pending_tab === 'history' ? 'Riwayat dokumen pengajuan yang pernah Anda proses.' : 'Dokumen pengajuan yang menunggu persetujuan Anda.',
        expiry: filters?.expiry_tab === 'kontrak'
            ? 'Daftar dokumen kontrak yang akan atau telah berakhir masa berlakunya.'
            : filters?.expiry_tab === 'non_kontrak'
                ? 'Daftar dokumen non kontrak yang akan atau telah berakhir masa berlakunya.'
                : filters?.expiry_tab === 'nda'
                    ? 'Daftar dokumen NDA yang akan atau telah berakhir masa berlakunya.'
                    : 'Kontrak yang akan atau telah berakhir.',
        archived: 'Daftar seluruh dokumen kontrak yang diarsipkan.',
        in_progress: 'Daftar seluruh kontrak dalam proses pengerjaan.',
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
        archived: Archive,
        in_progress: Clock,
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
            router.get(globalThis.location.pathname, cleaned, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['contracts', 'filters', 'parentCategoryCounts', 'mineCounts', 'pendingCounts', 'expiryCategoryCounts'],
            });
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

    const [layout, setLayout] = useState<'table' | 'grid'>(() => {
        return getClientPref<'table' | 'grid'>('view_layout', 'table');
    });

    const handleLayoutChange = useCallback((val: 'table' | 'grid') => {
        setLayout(val);
        setClientPref('view_layout', val);
    }, []);

    const [selectedRows, setSelectedRows] = useState<Contract[]>([]);

    const [isFilterExpanded, setIsFilterExpanded] = useState<boolean>(() => {
        return getClientPref<boolean>('filter_expanded', false);
    });

    const toggleFilterExpanded = useCallback(() => {
        setIsFilterExpanded((prev) => {
            const next = !prev;
            setClientPref('filter_expanded', next);
            return next;
        });
    }, []);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filters) {
            const arrayKeys = [
                'company_group_id',
                'region_id',
                'company_id',
                'division_id',
                'department_id',
                'contract_type_id',
                'status',
            ];
            arrayKeys.forEach((k) => {
                const v = (filters as any)[k];
                if (Array.isArray(v)) {
                    count += v.filter((item) => item !== '' && item !== null && item !== undefined).length;
                } else if (v !== '' && v !== null && v !== undefined) {
                    count += 1;
                }
            });
            if (filters.created_from || filters.created_to) {
                count += 1;
            }
        }
        return count;
    }, [filters]);

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
        const removeStartListener = router.on('start', () => setProcessing(true));
        const removeFinishListener = router.on('finish', () => setProcessing(false));

        return () => {
            removeStartListener();
            removeFinishListener();
        };
    }, []);

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
        const targetId = (c as any).short_id || c.id;
        router.get(route('contracts.show', targetId), {}, { preserveState: true, preserveScroll: true });
    }, []);

    const closeDetail = useCallback(() => {
        setSelected(null);
        router.get(route('contracts'), {}, { preserveState: true, preserveScroll: true });
    }, []);

    const canChangeCompanyGroup = useMemo(() => {
        if (pov.activeFilterPov.permissions !== undefined) {
            return pov.activeFilterPov.permissions.can_change_company_group;
        }
        const settings = meUser?.filter_settings;
        if (settings && typeof settings.can_change_company_group !== 'undefined') {
            return !!settings.can_change_company_group;
        }
        const role = meUser?.role;
        return role === 'Admin' || role === 'Super Admin' || !!meUser?.is_admin;
    }, [meUser, pov.activeFilterPov]);

    const canChangeRegion = useMemo(() => {
        if (pov.activeFilterPov.permissions !== undefined) {
            return pov.activeFilterPov.permissions.can_change_region;
        }
        const settings = meUser?.filter_settings;
        if (settings && typeof settings.can_change_region !== 'undefined') {
            return !!settings.can_change_region;
        }
        const role = meUser?.role;
        return role === 'Admin' || role === 'Super Admin' || !!meUser?.is_admin;
    }, [meUser, pov.activeFilterPov]);

    const canChangeCompany = useMemo(() => {
        if (pov.activeFilterPov.permissions !== undefined) {
            return pov.activeFilterPov.permissions.can_change_company;
        }
        const settings = meUser?.filter_settings;
        if (settings && typeof settings.can_change_company !== 'undefined') {
            return !!settings.can_change_company;
        }
        const role = meUser?.role;
        return role === 'Admin' || role === 'Super Admin' || !!meUser?.is_admin;
    }, [meUser, pov.activeFilterPov]);

    const canChangeDivision = useMemo(() => {
        if (pov.activeFilterPov.permissions !== undefined) {
            return pov.activeFilterPov.permissions.can_change_division;
        }
        const settings = meUser?.filter_settings;
        if (settings && typeof settings.can_change_division !== 'undefined') {
            return !!settings.can_change_division;
        }
        const role = meUser?.role;
        return role === 'Admin' || role === 'Super Admin' || !!meUser?.is_admin;
    }, [meUser, pov.activeFilterPov]);

    const canChangeDepartment = useMemo(() => {
        if (pov.activeFilterPov.permissions !== undefined) {
            return pov.activeFilterPov.permissions.can_change_department;
        }
        const settings = meUser?.filter_settings;
        if (settings && typeof settings.can_change_department !== 'undefined') {
            return !!settings.can_change_department;
        }
        const role = meUser?.role;
        return role === 'Admin' || role === 'Super Admin' || !!meUser?.is_admin;
    }, [meUser, pov.activeFilterPov]);

    const filterCategories = useMemo(() => {
        const list: any[] = [];

        if (canChangeCompanyGroup && companyGroups && companyGroups.length > 0) {
            list.push({
                label: 'Grup Perusahaan',
                key: 'company_group_id',
                type: 'searchable',
                options: companyGroups.map((g: any) => ({
                    label: g.name,
                    value: g.id,
                })),
            });
        }

        if (canChangeRegion && regions && regions.length > 0) {
            list.push({
                label: 'Regional',
                key: 'region_id',
                type: 'searchable',
                options: regions.map((r: any) => ({
                    label: r.name,
                    value: r.id,
                })),
            });
        }

        if (canChangeCompany && companies && companies.length > 0) {
            list.push({
                label: 'Perusahaan',
                key: 'company_id',
                type: 'searchable',
                options: companies.map((c: any) => ({
                    label: c.name,
                    value: c.id,
                })),
            });
        }

        if (canChangeDivision && divisions && divisions.length > 0) {
            list.push({
                label: 'Divisi',
                key: 'division_id',
                type: 'searchable',
                options: divisions.map((d: any) => ({
                    label: d.name,
                    value: d.id,
                })),
            });
        }

        if (canChangeDepartment && departments && departments.length > 0) {
            list.push({
                label: 'Departemen',
                key: 'department_id',
                type: 'searchable',
                options: departments.map((d: any) => ({
                    label: d.name,
                    value: d.id,
                })),
            });
        }

        if (types && types.length > 0) {
            list.push({
                label: 'Kategori Kontrak',
                key: 'contract_type_id',
                type: 'searchable',
                options: types.map((t: any) => ({
                    label: t.name,
                    value: t.id,
                })),
            });
        }

        list.push({
            label: 'Status Pengajuan',
            key: 'status',
            type: 'multiselect',
            options: (masterContractStatuses || []).map((s: any) => ({
                label: s.label || s.code,
                value: s.code,
            })),
        });

        list.push({
            label: 'Rentang Tanggal',
            key: 'created',
            type: 'date-range',
        });

        return list;
    }, [companyGroups, regions, companies, divisions, departments, types, masterContractStatuses]);


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

    const currentModuleKey = useMemo(() => {
        if (currentView === 'mine') return 'MY_CTC';
        if (currentView === 'pending') return 'PENDING';
        if (currentView === 'expiry') return 'EXPIRY';
        return 'CONTRACTS';
    }, [currentView]);

    const { canBulkApprove, canBulkDelete } = usePermissions(currentModuleKey);
    const hasAnyBulkAction = Boolean(canBulkApprove || canBulkDelete);

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



    const renderBulkActions = useCallback(
        (selectedRows: Contract[]) => {
            if (!hasAnyBulkAction) return null;
            return (
                <BulkActions
                    selectedRows={selectedRows}
                    canBulkApprove={!!canBulkApprove}
                    handleBulkApprove={handleBulkApprove}
                    canBulkDelete={!!canBulkDelete}
                    handleBulkDelete={handleBulkDelete}
                />
            );
        },
        [hasAnyBulkAction, canBulkApprove, handleBulkApprove, canBulkDelete, handleBulkDelete],
    );

    const renderContractWithTypes = useCallback((c: Contract) => <ContractNoAndTitleCell c={c} types={types} />, [types]);
    const isExpiryView = currentView === 'expiry' || view === 'expiry';
    const renderPeriodWithExpiry = useCallback((c: Contract) => renderContractPeriod(c, isExpiryView), [isExpiryView]);

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
                cell: renderContractWithTypes,
                sortable: true,
            },
            {
                accessorKey: 'vendor',
                header: (
                    <div className="flex items-center gap-2">
                        <FileType size={14} className="text-text-desc" />
                        <span>Vendor</span>
                    </div>
                ),
                cell: renderVendor,
                sortable: true,
            },
            {
                accessorKey: 'period',
                header: (
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-text-desc" />
                        <span>{isExpiryView ? 'Masa Berlaku & Kedaluwarsa' : 'Masa Berlaku'}</span>
                    </div>
                ),
                cell: renderPeriodWithExpiry,
                sortable: true,
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
                sortable: true,
            },
            {
                accessorKey: 'status',
                header: (
                    <div className="flex items-center gap-2">
                        <GitBranch size={14} className="text-text-desc" />
                        <span>Status</span>
                    </div>
                ),
                cell: renderStatusAndStep,
                sortable: true,
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
                sortable: true,
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
                sortable: true,
            },
            {
                accessorKey: 'actions',
                header: (
                    <div className="flex items-center justify-center">
                        <span>Aksi</span>
                    </div>
                ),
                align: 'center',
                className: 'w-16 text-center px-2 py-1.5',
                cell: (c: Contract) => (
                    <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <a
                            href={`/contracts/${c.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all cursor-pointer"
                            title="Buka di Tab Baru"
                        >
                            <ExternalLink size={14} />
                        </a>
                    </div>
                ),
            },
        ],
        [renderContractWithTypes, renderPeriodWithExpiry, isExpiryView],
    );

    const renderCategoryTabs = () => {
        let tabs: { key: string; label: string; count: number; icon?: any; isActive: boolean }[] = [];
        const activeView = (currentView || view) as string;

        if (activeView === 'contracts' || activeView === 'admin.contracts' || activeView === 'admin/contracts') {
            const activeKey = filters?.parent_tab || '';
            tabs = [
                { key: '', label: 'Semua', count: parentCategoryCounts?.all ?? 0, icon: LayoutGrid, isActive: !activeKey },
                { key: 'kontrak', label: 'Kontrak', count: parentCategoryCounts?.kontrak ?? 0, icon: FileText, isActive: activeKey === 'kontrak' },
                { key: 'non_kontrak', label: 'Non Kontrak', count: parentCategoryCounts?.non_kontrak ?? 0, icon: FileCheck, isActive: activeKey === 'non_kontrak' },
                { key: 'nda', label: 'NDA', count: parentCategoryCounts?.nda ?? 0, icon: Zap, isActive: activeKey === 'nda' },
            ];
        } else if (activeView === 'mine') {
            const activeKey = filters?.mine_tab || '';
            tabs = [
                { key: '', label: 'Semua', count: mineCounts?.all ?? 0, icon: LayoutGrid, isActive: !activeKey },
                { key: 'kontrak', label: 'Kontrak', count: mineCounts?.kontrak ?? 0, icon: FileText, isActive: activeKey === 'kontrak' },
                { key: 'non_kontrak', label: 'Non Kontrak', count: mineCounts?.non_kontrak ?? 0, icon: FileCheck, isActive: activeKey === 'non_kontrak' },
                { key: 'nda', label: 'NDA', count: mineCounts?.nda ?? 0, icon: Zap, isActive: activeKey === 'nda' },
            ];
        } else if (activeView === 'pending') {
            const activeKey = filters?.pending_tab === 'history' ? 'history' : 'pending';
            tabs = [
                { key: 'pending', label: 'Perlu Persetujuan', count: pendingCounts?.pending ?? 0, icon: Clock, isActive: activeKey === 'pending' },
                { key: 'history', label: 'Riwayat Persetujuan', count: pendingCounts?.history ?? 0, icon: History, isActive: activeKey === 'history' },
            ];
        } else if (activeView === 'expiry') {
            const activeKey = filters?.expiry_tab || '';
            tabs = [
                { key: '', label: 'Semua', count: expiryCategoryCounts?.all ?? 0, icon: LayoutGrid, isActive: !activeKey },
                { key: 'kontrak', label: 'Kontrak', count: expiryCategoryCounts?.kontrak ?? 0, icon: FileText, isActive: activeKey === 'kontrak' },
                { key: 'non_kontrak', label: 'Non Kontrak', count: expiryCategoryCounts?.non_kontrak ?? 0, icon: FileCheck, isActive: activeKey === 'non_kontrak' },
                { key: 'nda', label: 'NDA', count: expiryCategoryCounts?.nda ?? 0, icon: Zap, isActive: activeKey === 'nda' },
            ];
        }

        if (tabs.length === 0) return null;

        const onTabClick = (tabKey: string) => {
            if (activeView === 'contracts' || activeView === 'admin.contracts' || activeView === 'admin/contracts') {
                handleFilterChange({ parent_tab: tabKey || '', page: 1 });
            } else if (activeView === 'mine') {
                handleFilterChange({ mine_tab: tabKey || '', page: 1 });
            } else if (activeView === 'pending') {
                handleFilterChange({ pending_tab: tabKey, page: 1 });
            } else if (activeView === 'expiry') {
                handleFilterChange({ expiry_tab: tabKey || '', page: 1 });
            }
        };

        return (
            <div className="flex items-center gap-1.5 px-4 h-12 border-b border-surface-border bg-card shrink-0 overflow-x-auto custom-scrollbar">
                {tabs.map((tab) => {
                    const TabIcon = tab.icon;
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => onTabClick(tab.key)}
                            className={cn(
                                'group relative flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer shrink-0 select-none',
                                tab.isActive
                                    ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/70',
                            )}
                        >
                            {TabIcon && (
                                <TabIcon
                                    size={14}
                                    className={cn(
                                        'shrink-0 transition-colors',
                                        tab.isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground',
                                    )}
                                />
                            )}
                            <span>{tab.label}</span>
                            <span
                                className={cn(
                                    'text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums shrink-0 transition-colors',
                                    tab.isActive
                                        ? 'bg-white text-primary dark:bg-black dark:text-white'
                                        : 'bg-muted text-muted-foreground group-hover:text-foreground',
                                )}
                            >
                                {tab.count}
                            </span>
                        </button>
                    );
                })}
            </div>
        );
    };

    return (
        <>
            <Head title={view} />
            <div className="flex min-h-0 flex-1 flex-col w-full h-full bg-slate-100/60 dark:bg-zinc-950 overflow-hidden">
                {selected ? (
                    <div className="animate-in fade-in slide-in-from-bottom-3 flex w-full flex-1 min-h-0 flex-col duration-300 ease-in-out h-full overflow-hidden">
                        <Suspense
                            fallback={
                                <div className="flex flex-1 items-center justify-center min-h-[400px] w-full p-6">
                                    <LoadingLottie width={140} height={140} />
                                </div>
                            }
                        >
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
                        </Suspense>
                    </div>
                ) : (
                    <MasterPageLayout>
                        <FloatingPanel className="flex-1 min-w-0 flex flex-col">
                            <PageTable
                                standalone={false}
                                title={viewTitleMap[view] || 'Manajemen Kontrak'}
                                subtitle={viewDescMap[view] || 'Daftar seluruh kontrak dalam sistem.'}
                                icon={viewIconMap[view] || FileText}
                                {...(view === 'dashboard' ? {
                                    actions: (() => {
                                        const config = effectiveDashboardConfig;
                                        const showOverview = config ? !!config.show_overview : false;
                                        const showOverviewContract = config ? !!config.show_overview_contract : false;
                                        const showOverviewNonContract = config ? !!config.show_overview_non_contract : false;
                                        const showOverviewNda = config ? !!config.show_overview_nda : false;
                                        const showWorkload = config ? !!config.show_workload : false;
                                        const showMasterData = config ? !!config.show_master_data : false;

                                        if (!showOverview && !showOverviewContract && !showOverviewNonContract && !showOverviewNda && !showWorkload && !showMasterData) return null;

                                        return (
                                            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-0.5">
                                                {showOverview && (
                                                    <DashboardTab
                                                        active={dashboardTab === 'overview'}
                                                        onClick={() => handleDashboardTabChange('overview')}
                                                        label="Ringkasan"
                                                        icon={LayoutDashboard}
                                                    />
                                                )}
                                                {showOverviewContract && (
                                                    <DashboardTab
                                                        active={dashboardTab === 'overview_contract'}
                                                        onClick={() => handleDashboardTabChange('overview_contract')}
                                                        label="Ringkasan Kontrak"
                                                        icon={FileText}
                                                    />
                                                )}
                                                {showOverviewNonContract && (
                                                    <DashboardTab
                                                        active={dashboardTab === 'overview_non_contract'}
                                                        onClick={() => handleDashboardTabChange('overview_non_contract')}
                                                        label="Ringkasan Non Kontrak"
                                                        icon={FileType}
                                                    />
                                                )}
                                                {showOverviewNda && (
                                                    <DashboardTab
                                                        active={dashboardTab === 'overview_nda'}
                                                        onClick={() => handleDashboardTabChange('overview_nda')}
                                                        label="Ringkasan NDA"
                                                        icon={FileCheck}
                                                    />
                                                )}
                                                {showWorkload && (
                                                    <DashboardTab
                                                        active={dashboardTab === 'workload'}
                                                        onClick={() => handleDashboardTabChange('workload')}
                                                        label="Beban Kerja"
                                                        icon={Briefcase}
                                                    />
                                                )}
                                                {showMasterData && (
                                                    <DashboardTab
                                                        active={dashboardTab === 'master_data'}
                                                        onClick={() => handleDashboardTabChange('master_data')}
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
                                            <LayoutToggle value={layout as LayoutType} onChange={handleLayoutChange} />
                                            <Button
                                                variant={isFilterExpanded || activeFilterCount > 0 ? 'primary' : 'white'}
                                                fontSize="11px"
                                                className={cn(
                                                    'h-9 px-3 gap-1.5 rounded-xl border shadow-none font-semibold transition-all cursor-pointer',
                                                    isFilterExpanded
                                                        ? 'bg-primary text-primary-foreground border-primary'
                                                        : activeFilterCount > 0
                                                            ? 'border-primary text-primary bg-primary/5 hover:bg-primary/10'
                                                            : 'border-border text-foreground hover:bg-surface-muted',
                                                )}
                                                onClick={toggleFilterExpanded}
                                                title={isFilterExpanded ? 'Sembunyikan Filter' : 'Buka Filter'}
                                            >
                                                <Filter size={14} className={isFilterExpanded ? 'text-primary-foreground' : activeFilterCount > 0 ? 'text-primary' : 'text-text-desc'} />
                                                <span>Filter</span>
                                                {activeFilterCount > 0 && (
                                                    <span
                                                        className={cn(
                                                            'flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-black',
                                                            isFilterExpanded ? 'bg-white text-primary' : 'bg-primary text-white',
                                                        )}
                                                    >
                                                        {activeFilterCount}
                                                    </span>
                                                )}
                                                <ChevronDown
                                                    size={13}
                                                    className={cn('transition-transform duration-200 opacity-70', isFilterExpanded && 'rotate-180')}
                                                />
                                            </Button>
                                            <Button variant="primary" fontSize="11px" className="shadow-none" onClick={() => setCreateOpen(true)}>
                                                <FilePlus size={16} strokeWidth={2.2} /> Buat Pengajuan
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
                                        router.get(globalThis.location.pathname, { ...filters, page }, {
                                            preserveState: true,
                                            preserveScroll: true,
                                            only: ['contracts', 'filters', 'parentCategoryCounts', 'mineCounts', 'pendingCounts', 'expiryCategoryCounts'],
                                        }),
                                    onPerPageChange: (perPage: number) =>
                                        router.get(globalThis.location.pathname, { ...filters, page: 1, per_page: perPage }, {
                                            preserveState: true,
                                            preserveScroll: true,
                                            only: ['contracts', 'filters', 'parentCategoryCounts', 'mineCounts', 'pendingCounts', 'expiryCategoryCounts'],
                                        }),
                                } : undefined}
                                showFooter={view !== 'dashboard'}
                            >
                                <div className="flex-1 min-h-0 h-full overflow-hidden flex flex-col">
                                    {view === 'dashboard' && (
                                        <div className="flex-1 min-h-0 h-full overflow-y-auto custom-scrollbar p-5">
                                            {metrics ? (
                                                <DashboardMetrics
                                                    metrics={{ ...metrics, dashboardConfig: effectiveDashboardConfig }}
                                                    activeTab={dashboardTab}
                                                    meUser={meUser}
                                                    onCreateContract={() => setCreateOpen(true)}
                                                />
                                            ) : (
                                                <DashboardSkeleton />
                                            )}
                                        </div>
                                    )}
                                    {view === 'profile' && <ProfileView meUser={meUser} showToast={showToast} />}
                                    {view !== 'profile' && view !== 'dashboard' && (
                                        <div className="bg-surface-base/20 border-surface-border flex min-h-0 flex-1 flex-col gap-0 overflow-hidden h-full">
                                            {renderCategoryTabs()}
                                            {isFilterExpanded && (
                                                <PageFilter
                                                    categories={filterCategories}
                                                    activeFilters={filters}
                                                    onFilterChange={(keyOrObj, value) => {
                                                        if (typeof keyOrObj === 'object') {
                                                            handleFilterChange(keyOrObj);
                                                        } else {
                                                            handleFilterChange({ [keyOrObj]: value, page: 1 });
                                                        }
                                                    }}
                                                    onReset={() =>
                                                        handleFilterChange(
                                                            Object.keys(filters).reduce((acc, k) => ({ ...acc, [k]: [] }), { page: 1 }),
                                                        )
                                                    }
                                                    totalResults={contractsPaged.total}
                                                />
                                            )}
                                            <div className={cn('custom-scrollbar flex-1 overflow-auto', layout === 'grid' && 'p-4')}>
                                                {layout === 'table' ? (
                                                    <TableContract
                                                        columns={columns}
                                                        data={contractsPaged.data}
                                                        loading={processing}
                                                        skeleton={<ContractTableSkeleton />}
                                                        onRowClick={openDetail}
                                                        onSelectionChange={hasAnyBulkAction ? setSelectedRows : undefined}
                                                        selectedRows={hasAnyBulkAction ? selectedRows : []}
                                                        bulkActions={hasAnyBulkAction ? renderBulkActions(selectedRows) : undefined}
                                                        sortBy={filters?.sort_by || filters?.sortBy || 'created_at'}
                                                        sortDir={(filters?.sort_dir || filters?.sortDir || 'desc') as 'asc' | 'desc'}
                                                        onSortChange={(newSortBy, newSortDir) => {
                                                            handleFilterChange({ sort_by: newSortBy, sort_dir: newSortDir, page: 1 });
                                                        }}
                                                    />
                                                ) : processing ? (
                                                    <ContractCardSkeleton />
                                                ) : (
                                                    <div className="flex flex-col gap-6">
                                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                                                            {contractsPaged.data.map((c) => {
                                                                const type = types?.find((t) => t.id === c.contract_type_id);
                                                                const typeName = type?.name || c.contract_type || '';
                                                                const cleanTypeName = typeName ? typeName.replace('Perjanjian ', '').replace('Addendum / ', '') : '';
                                                                const progressPercent = c.progress?.total > 0 ? Math.round((c.progress.done / c.progress.total) * 100) : 0;
                                                                const currentStepName = c.workflow_step?.description || c.workflow_step?.role || (c.status === 'draft' ? 'Pengajuan Draft' : null);

                                                                return (
                                                                    <div
                                                                        key={c.id}
                                                                        onClick={() => openDetail(c)}
                                                                        className="group relative flex flex-col justify-between rounded-xl border border-border/70 bg-card hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden text-left"
                                                                    >
                                                                        {/* Top Section: Header & Numbers */}
                                                                        <div className="p-4 pb-3 space-y-2.5">
                                                                            {/* Top Row: Form/Contract No + Status Badge */}
                                                                            <div className="flex items-center justify-between gap-2">
                                                                                <div className="flex items-center gap-1.5 min-w-0">
                                                                                    <span className="font-mono text-[11px] font-bold text-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/50 truncate">
                                                                                        {c.form_no || c.contract_no || 'DRAFT'}
                                                                                    </span>
                                                                                    {!!c.current_version && c.current_version > 0 && (
                                                                                        <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-primary/10 text-primary border border-primary/20">
                                                                                            v{c.current_version}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <div className="shrink-0">
                                                                                    <StatusBadge status={c.status} statusInfo={(c as any).status_info} size="sm" />
                                                                                </div>
                                                                            </div>

                                                                            {/* Title & Type */}
                                                                            <div className="space-y-1">
                                                                                <h3
                                                                                    className="text-[13px] font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug"
                                                                                    title={c.title}
                                                                                >
                                                                                    {c.title}
                                                                                </h3>
                                                                                {cleanTypeName && (
                                                                                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                                                                                        <span className="inline-block px-1.5 py-0.5 rounded bg-surface-muted border border-border/60 text-text-desc">
                                                                                            {cleanTypeName}
                                                                                        </span>
                                                                                        {c.contract_no && c.contract_no !== c.form_no && (
                                                                                            <span className="font-mono text-muted-foreground truncate" title={`No. Kontrak: ${c.contract_no}`}>
                                                                                                • {c.contract_no}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            {/* Vendor / Pihak Kedua */}
                                                                            <div className="flex items-center gap-2 text-xs py-1.5 px-2.5 rounded-lg bg-muted/30 border border-border/40 text-foreground">
                                                                                <Building2 size={13} className="text-primary shrink-0" />
                                                                                <span className="font-medium truncate text-[11px]" title={c.vendor?.name || 'Pihak Kedua'}>
                                                                                    {c.vendor?.name || 'Pihak Kedua Tidak Terdaftar'}
                                                                                </span>
                                                                            </div>

                                                                            {/* People: Inisiator & PIC */}
                                                                            <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-border/40 text-[11px]">
                                                                                {/* Inisiator */}
                                                                                <div className="flex flex-col min-w-0">
                                                                                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Pengaju</span>
                                                                                    <span className="font-semibold text-foreground truncate text-[11px]" title={c.initiator?.name}>
                                                                                        {c.initiator?.name || '—'}
                                                                                    </span>
                                                                                    {c.initiator?.department_name && (
                                                                                        <span className="text-[9.5px] text-muted-foreground truncate" title={c.initiator.department_name}>
                                                                                            {c.initiator.department_name}
                                                                                        </span>
                                                                                    )}
                                                                                </div>

                                                                                {/* PIC */}
                                                                                <div className="flex flex-col min-w-0">
                                                                                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">PIC</span>
                                                                                    <span className="font-semibold text-foreground truncate text-[11px]" title={c.assigned_pic?.name || 'Belum Ada'}>
                                                                                        {c.assigned_pic?.name || 'Belum Ada'}
                                                                                    </span>
                                                                                    {c.assigned_pic?.department_name && (
                                                                                        <span className="text-[9.5px] text-muted-foreground truncate" title={c.assigned_pic.department_name}>
                                                                                            {c.assigned_pic.department_name}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            {/* Periode Kontrak / Expiry (if applicable) */}
                                                                            {(c.start_date || c.end_date) && (
                                                                                <div className="flex items-center justify-between gap-1 text-[10.5px] text-muted-foreground pt-1 border-t border-border/40">
                                                                                    <div className="flex items-center gap-1.5 truncate">
                                                                                        <Calendar size={11} className="shrink-0 text-muted-foreground/70" />
                                                                                        <span className="truncate">
                                                                                            {c.start_date ? formatDate(c.start_date, { day: 'numeric', month: 'short', year: '2-digit' }) : '—'} s/d{' '}
                                                                                            {c.end_date ? formatDate(c.end_date, { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                                                                                        </span>
                                                                                    </div>
                                                                                    {c.end_date && (
                                                                                        <div className="shrink-0 scale-90 origin-right">
                                                                                            <ExpiryBadge endDate={c.end_date} />
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Bottom Section: Workflow Progress & SLA Bar */}
                                                                        <div className="p-3 bg-muted/20 border-t border-border/50 flex items-center justify-between gap-2 text-xs">
                                                                            {/* Workflow Step & Progress Track */}
                                                                            <div className="flex flex-col gap-1 min-w-0 max-w-[65%]">
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <span className="text-[10px] font-bold text-foreground truncate" title={currentStepName || `Tahap ${c.progress?.done || 0}/${c.progress?.total || 0}`}>
                                                                                        {currentStepName || `Tahap ${c.progress?.done || 0}/${c.progress?.total || 0}`}
                                                                                    </span>
                                                                                    {c.progress?.total > 0 && (
                                                                                        <span className="text-[9.5px] font-bold text-primary font-mono shrink-0">
                                                                                            ({c.progress.done}/{c.progress.total})
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                {/* Mini Progress Bar */}
                                                                                {c.progress?.total > 0 && (
                                                                                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                                                        <div
                                                                                            className="h-full bg-primary rounded-full transition-all duration-300"
                                                                                            style={{ width: `${progressPercent}%` }}
                                                                                        />
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            {/* SLA Countdown */}
                                                                            <div className="shrink-0 flex items-center gap-1">
                                                                                <SLACountdown deadline={c.sla_deadline ?? null} status={c.status} />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </PageTable>
                        </FloatingPanel>
                    </MasterPageLayout>
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
    contracts: initialContractsPaged = { data: [], links: [], current_page: 1, last_page: 1, total: 0, from: 0, to: 0, per_page: 15 } as any,
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
    mineCounts,
    parentCategoryCounts,
    pendingCounts,
    expiryCategoryCounts,
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
    mineCounts?: any;
    parentCategoryCounts?: any;
    pendingCounts?: any;
    expiryCategoryCounts?: any;
}>) {
    const { auth } = usePage<{ auth: { user: any } }>().props;
    const meId = auth?.user?.id ?? '';
    const meUser = auth?.user ?? null;

    return (
        <>
            <Head title="Contract Manager" />
            <ToastProvider>
                <ContractPage
                    contracts={initialContractsPaged}
                    meId={meId}
                    meUser={meUser}
                    initialSelected={initialSelectedProp}
                    types={initialTypes}
                    submissionTypes={initialSubmissionTypes}
                    vendors={vendors}
                    formTemplates={initialFormTemplates}
                    currentView={currentView}
                    metrics={initialMetrics}
                    filters={filters}
                    users={users}
                    departments={departments}
                    roles={roles}
                    companyGroups={companyGroups}
                    regions={regions}
                    companies={companies}
                    organizationTree={organizationTree}
                    mineCounts={mineCounts}
                    parentCategoryCounts={parentCategoryCounts}
                    pendingCounts={pendingCounts}
                    expiryCategoryCounts={expiryCategoryCounts}
                />
            </ToastProvider>
        </>
    );
}
