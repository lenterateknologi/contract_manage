import { Button } from '@/components/ui/buttons/Button';
import { useToast } from '@/components/ui/feedback/Toast';
import { Icons } from '@/components/ui/icons';
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
import { Contract, ContractType, PaginatedData, UserFilterSettings, UserProfile } from '@/features/Contracts/types';
import { usePov } from '@/stores/usePovStore';
import { Head, router, usePage } from '@inertiajs/react';
import { lazy, memo, Suspense, useCallback, useEffect, useMemo, useState } from 'react';

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
    MoreVertical,
    Trash2,
    User,
    UserPlus,
    Calendar,
    Zap,
    History,
    LayoutGrid,
    ExternalLink,
} = Icons;

// Lazy loaded views and modals for fast initial page render
const ContractDetailView = lazy(() => import('@/features/Contracts/ContractDetail/ContractDetail'));
const CreateContractModal = lazy(() => import('@/features/Contracts/components/modals/CreateContractModal'));
const EditContractModal = lazy(() => import('@/features/Contracts/components/modals/EditContractModal').then((m) => ({ default: m.EditContractModal })));
const PreviewModal = lazy(() => import('@/features/Contracts/components/modals/PreviewModal'));
const SendApprovalModal = lazy(() => import('@/features/Contracts/components/modals/SendApprovalModal'));

type View =
    'contracts' | 'organization' | 'pending' | 'audit' | 'f1' | 'f2' | 'profile' | 'mine' | 'expiry' | 'archived' | 'in_progress';

import { ConfirmationModal, StatusBadge } from '@/components/ui';
import { ContractCardSkeleton, ContractTableSkeleton } from './ContractSkeleton';
import LoadingLottie from '@/components/ui/feedback/LoadingLottie';
import { FloatingPanel } from '@/components/ui/navigation/FloatingPanel';
import { LayoutToggle, type LayoutType } from '@/components/ui/navigation/LayoutToggle';
import { MasterPageLayout } from '@/components/ui/navigation/MasterPageLayout';
import { PageTable } from '@/components/ui/navigation/PageTable';
import { Building2 } from 'lucide-react';
import {
    ContractNoAndTitleCell,
    ExpiryBadge,
    renderAssignedPic,
    renderContractPeriod,
    renderInitiator,
    renderStatusAndStep,
    renderVendor,
} from './ContractTableCells';
import { ContractFilterBar as PageFilter } from './ContractFilterBar';
import { ProfileView } from '@/features/Contracts/components/parts/ProfileView';
import { contractApi } from '@/features/Contracts/utils';

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

const BulkActions = memo(
    ({
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
    ),
);

BulkActions.displayName = 'BulkActions';

const RowActions = memo(
    ({
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
    ),
);

RowActions.displayName = 'RowActions';

export interface DashboardConfig {
    show_overview?: boolean;
    show_overview_contract?: boolean;
    show_overview_non_contract?: boolean;
    show_overview_nda?: boolean;
    show_workload?: boolean;
    show_master_data?: boolean;
    has_setting?: boolean;
    [key: string]: unknown;
}

export interface ContractListProps {
    contracts?: PaginatedData<Contract>;
    meId?: string;
    meUser?: UserProfile | null;
    initialSelected?: Contract | null;
    types?: ContractType[];
    submissionTypes?: Array<{ id: string; name: string }>;
    currentView?: View;
    currentDashboardTab?: string | null;
    metrics?: {
        dashboardConfig?: DashboardConfig;
        [key: string]: unknown;
    } | null;
    dashboardConfig?: DashboardConfig;
    userFilterSettings?: UserFilterSettings | null;
    mineCounts?: {
        all: number;
        kontrak: number;
        non_kontrak: number;
        nda: number;
        in_progress: number;
        archived: number;
    };
    orgCategoryCounts?: {
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
    filters?: {
        search?: string;
        status?: string;
        contract_type_id?: string;
        submission_type_id?: string;
        per_page?: number;
        sortBy?: string;
        sort_by?: string;
        sortDir?: 'asc' | 'desc' | string;
        sort_dir?: 'asc' | 'desc' | string;
        mine_tab?: string;
        org_tab?: string;
        parent_tab?: string;
        pending_tab?: string;
        expiry_tab?: string;
        role_id?: string;
        department_id?: string;
        created_from?: string;
        created_to?: string;
        company_group_id?: string | number | string[];
        region_id?: string | number | string[];
        company_id?: string | number | string[];
        division_id?: string | number | string[];
        company_group_ids?: string[] | string;
        region_ids?: string[] | string;
        company_ids?: string[] | string;
        department_ids?: string[] | string;
    };
    formTemplates?: Array<{ id: string; name: string }>;
    users?: UserProfile[];
    vendors?: Array<{ id: string; name: string }>;
    departments?: Array<{ id: string; name: string }>;
    roles?: Array<{ id: string; name: string }>;
    companyGroups?: Array<{ id: string; name: string }>;
    companies?: Array<{ id: string; name: string }>;
    regions?: Array<{ id: string; name: string }>;
    locations?: Array<{ id: string; name: string }>;
    divisions?: Array<{ id: string; name: string }>;
    organizationTree?: Array<Record<string, unknown>>;
}

export type IndexProps = ContractListProps;

export function ContractList({
    contracts: contractsPaged = { data: [], links: [], current_page: 1, last_page: 1, total: 0, from: 0, to: 0, per_page: 25 },
    meId = '',
    meUser,
    initialSelected,
    types = [],
    submissionTypes = [],
    currentView = 'contracts',
    metrics,
    dashboardConfig,
    filters = {},
    formTemplates = [],
    users = [],
    vendors = [],
    departments = [],
    companyGroups = [],
    companies = [],
    regions = [],
    divisions = [],
    mineCounts,
    orgCategoryCounts,
    parentCategoryCounts,
    pendingCounts,
    expiryCategoryCounts,
    userFilterSettings = {},
}: Readonly<IndexProps>) {
    const { showToast } = useToast();
    const { masterContractStatuses } = usePage<{ masterContractStatuses?: Array<{ label?: string; code: string }> }>().props;
    const { canUpdate } = usePermissions('CONTRACTS');
    const pov = usePov();
    const [view, setView] = useState<View>(currentView);

    const effectiveDashboardConfig = useMemo(() => {
        // 1. Simulation POV
        if (pov.isSimulatingDashboard && pov.activeDashboardPov?.config !== undefined) {
            return {
                show_overview: !!pov.activeDashboardPov.config.show_overview,
                show_overview_contract: pov.activeDashboardPov.config.show_overview_contract !== false,
                show_overview_non_contract: pov.activeDashboardPov.config.show_overview_non_contract !== false,
                show_overview_nda: pov.activeDashboardPov.config.show_overview_nda !== false,
                show_workload: !!pov.activeDashboardPov.config.show_workload,
                show_master_data: !!pov.activeDashboardPov.config.show_master_data,
                has_setting: true,
            };
        }

        // 2. Direct dashboard config or metrics
        const cfg = dashboardConfig || metrics?.dashboardConfig;

        // 3. User filter settings
        const ufs = userFilterSettings;
        const ufsCats = Array.isArray(ufs?.categories) ? ufs.categories : [];
        const hasUfsCategories = ufsCats.length > 0;
        const hasNonContractFromUfs = !hasUfsCategories || ufsCats.includes('non-contract') || ufsCats.includes('non_kontrak');
        const hasContractFromUfs = !hasUfsCategories || ufsCats.includes('contract') || ufsCats.includes('kontrak');
        const hasNdaFromUfs = !hasUfsCategories || ufsCats.includes('nda');

        const showContract =
            cfg?.show_overview_contract !== undefined
                ? Boolean(cfg.show_overview_contract)
                : ufs?.show_overview_contract !== undefined
                  ? Boolean(ufs.show_overview_contract)
                  : hasContractFromUfs;

        const showNonContract =
            cfg?.show_overview_non_contract !== undefined
                ? Boolean(cfg.show_overview_non_contract)
                : ufs?.show_overview_non_contract !== undefined
                  ? Boolean(ufs.show_overview_non_contract)
                  : hasNonContractFromUfs;

        const showNda =
            cfg?.show_overview_nda !== undefined
                ? Boolean(cfg.show_overview_nda)
                : ufs?.show_overview_nda !== undefined
                  ? Boolean(ufs.show_overview_nda)
                  : hasNdaFromUfs;

        return {
            show_overview: Boolean(cfg?.show_overview ?? true),
            show_overview_contract: showContract,
            show_overview_non_contract: showNonContract,
            show_overview_nda: showNda,
            show_workload: Boolean(cfg?.show_workload ?? true),
            show_master_data: Boolean(cfg?.show_master_data ?? false),
            has_setting: Boolean(cfg?.has_setting ?? true),
        };
    }, [metrics?.dashboardConfig, dashboardConfig, userFilterSettings, pov.isSimulatingDashboard, pov.activeDashboardPov]);

    const [selected, setSelected] = useState<Contract | null>(initialSelected ?? null);
    const viewTitleMap: Record<string, string> = {
        dashboard: 'Dashboard Kontrak',
        organization:
            filters?.org_tab === 'kontrak'
                ? 'Semua Pengajuan - Kontrak'
                : filters?.org_tab === 'non_kontrak'
                  ? 'Semua Pengajuan - Non Kontrak'
                  : filters?.org_tab === 'nda'
                    ? 'Semua Pengajuan - NDA'
                    : 'Semua Pengajuan',
        contracts:
            filters?.parent_tab === 'kontrak'
                ? 'Semua Pengajuan - Kontrak'
                : filters?.parent_tab === 'non_kontrak'
                  ? 'Semua Pengajuan - Non Kontrak'
                  : filters?.parent_tab === 'nda'
                    ? 'Semua Pengajuan - NDA'
                    : 'Semua Pengajuan',
        mine:
            filters?.mine_tab === 'kontrak'
                ? 'Pengajuan Saya - Kontrak'
                : filters?.mine_tab === 'non_kontrak'
                  ? 'Pengajuan Saya - Non Kontrak'
                  : filters?.mine_tab === 'nda'
                    ? 'Pengajuan Saya - NDA'
                    : 'Pengajuan Saya',
        pending: filters?.pending_tab === 'history' ? 'Persetujuan Saya - Riwayat Persetujuan' : 'Persetujuan Saya - Perlu Persetujuan',
        expiry:
            filters?.expiry_tab === 'kontrak'
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
        organization: 'Daftar seluruh dokumen pengajuan dalam lingkup Organization Group Anda.',
        contracts: 'Daftar seluruh arsip dokumen pengajuan dalam sistem.',
        mine: 'Daftar dokumen pengajuan yang Anda buat.',
        pending:
            filters?.pending_tab === 'history'
                ? 'Riwayat dokumen pengajuan yang pernah Anda proses.'
                : 'Dokumen pengajuan yang menunggu persetujuan Anda.',
        expiry:
            filters?.expiry_tab === 'kontrak'
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
    const viewIconMap: Record<string, React.ComponentType<{ className?: string; size?: number | string; strokeWidth?: number }>> = {
        dashboard: LayoutGrid,
        organization: FileText,
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
        (newFilters: Record<string, unknown>) => {
            const merged = { ...filters, ...newFilters };
            const cleaned: Record<string, string | number> = {};

            for (const [k, v] of Object.entries(merged)) {
                if (v === undefined || v === null || v === '' || v === 'all') {
                    continue;
                }
                // Omit default page 1 to keep URL clean
                if (k === 'page' && (v === 1 || v === '1')) {
                    continue;
                }
                if (k === 'per_page' && (v === 10 || v === '10' || v === 25 || v === '25')) {
                    continue;
                }
                if (Array.isArray(v)) {
                    const validItems = v.filter((item) => item !== undefined && item !== null && item !== '' && item !== 'all');
                    if (validItems.length > 0) {
                        cleaned[k] = validItems.join(',');
                    }
                } else {
                    cleaned[k] = v as string | number;
                }
            }

            router.get(globalThis.location.pathname, cleaned, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['contracts', 'filters', 'parentCategoryCounts', 'orgCategoryCounts', 'mineCounts', 'pendingCounts', 'expiryCategoryCounts'],
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
            const arrayKeys = ['company_group_id', 'region_id', 'company_id', 'division_id', 'department_id', 'contract_type_id', 'status'];
            arrayKeys.forEach((k) => {
                const v = (filters as Record<string, unknown>)[k];
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
        parent_id?: string | number | null;
        level?: number;
    }

    const isDescendantOrSelf = useCallback(
        (targetId: string | number | (string | number)[] | undefined, parentId: string | number): boolean => {
            if (!targetId) return false;
            if (Array.isArray(targetId)) {
                return targetId.some((id) => isDescendantOrSelf(id, parentId));
            }
            if (String(targetId) === String(parentId)) return true;
            const target = types.find((t) => String(t.id) === String(targetId)) as DBContractType | undefined;
            if (target && target.parent_id) {
                return isDescendantOrSelf(target.parent_id, parentId);
            }
            return false;
        },
        [types],
    );

    const renderDropdownItems = useCallback(
        (parentId: string | number | null) => {
            const children = (types as DBContractType[]).filter((t) => (parentId === null ? !t.parent_id : String(t.parent_id) === String(parentId)));
            if (children.length === 0) return null;

            return children.map((child) => {
                const hasChildren = (types as DBContractType[]).some((t) => String(t.parent_id) === String(child.id));
                if (hasChildren) {
                    return (
                        <DropdownMenuSub key={String(child.id)}>
                            <DropdownMenuSubTrigger className="flex cursor-pointer items-center justify-between px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800">
                                {child.name}
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="min-w-[180px] rounded-md border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                                <DropdownMenuItem
                                    onClick={() => handleFilterChange({ contract_type_id: String(child.id), page: 1 })}
                                    className="text-primary cursor-pointer px-3 py-2 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
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
                        key={String(child.id)}
                        onClick={() => handleFilterChange({ contract_type_id: String(child.id), page: 1 })}
                        className="cursor-pointer px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        {child.name}
                    </DropdownMenuItem>
                );
            });
        },
        [types, handleFilterChange],
    );

    useEffect(() => {
        const removeStartListener = router.on('start', (event) => {
            const visit = event?.detail?.visit;
            // Ignore deferred/partial visits so the existing table remains interactive with zero shimmer flicker
            if (visit?.only?.length || (visit?.headers as Record<string, string> | undefined)?.['X-Inertia-Partial-Component']) {
                return;
            }
            setProcessing(true);
        });
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

    const updateContract = useCallback((c: Contract) => {
        setSelected(c);
    }, []);

    const openDetail = useCallback((c: Contract) => {
        setSelected(c);
        const targetId = (c as unknown as { short_id?: string }).short_id || c.id;
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
        const list: Array<{
            label: string;
            key: string;
            type: string;
            options?: Array<{ label: string; value: string | number }>;
        }> = [];

        if (canChangeCompanyGroup && companyGroups && companyGroups.length > 0) {
            list.push({
                label: 'Grup Perusahaan',
                key: 'company_group_id',
                type: 'searchable',
                options: companyGroups.map((g) => ({
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
                options: regions.map((r) => ({
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
                options: companies.map((c) => ({
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
                options: divisions.map((d) => ({
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
                options: departments.map((d) => ({
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
                options: (types as DBContractType[]).map((t) => ({
                    label: t.name,
                    value: t.id,
                })),
            });
        }

        list.push({
            label: 'Status Pengajuan',
            key: 'status',
            type: 'multiselect',
            options: (masterContractStatuses || []).map((s) => ({
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
    }, [
        canChangeCompany,
        canChangeCompanyGroup,
        canChangeDepartment,
        canChangeDivision,
        canChangeRegion,
        companyGroups,
        regions,
        companies,
        divisions,
        departments,
        types,
        masterContractStatuses,
    ]);

    // ponytail: derive active tab category for filtering creation modal types
    const activeCategoryTab = useMemo(() => {
        switch (view) {
            case 'contracts':
            case 'admin.contracts':
            case 'admin/contracts':
                return filters?.parent_tab || '';
            case 'mine':
                return filters?.mine_tab || '';
            case 'organization':
            case 'contracts.organization':
            case 'contracts/organization':
                return filters?.org_tab || filters?.parent_tab || '';
            case 'expiry':
                return filters?.expiry_tab || '';
            default:
                return '';
        }
    }, [view, filters?.parent_tab, filters?.mine_tab, filters?.org_tab, filters?.expiry_tab]);

    const handleCreate = async (data: Parameters<typeof contractApi.create>[0]) => {
        setProcessing(true);
        try {
            const newContract = await contractApi.create(data);
            showToast('Pengajuan baru berhasil dibuat.', 'success');
            setCreateOpen(false);
            if (newContract && newContract.id) {
                openDetail(newContract);
            } else {
                router.reload();
            }
        } catch {
            showToast('Gagal membuat pengajuan.', 'danger');
        } finally {
            setProcessing(false);
        }
    };

    const handleUpdateFromList = async (data: Parameters<typeof contractApi.update>[1]) => {
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

    const handleSendSubmit = async (data: Parameters<typeof contractApi.send>[1]) => {
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

    const { canBulkApprove, canBulkDelete } = usePermissions();
    const hasAnyBulkAction = Boolean(canBulkApprove || canBulkDelete);

    const handleBulkApprove = useCallback(
        async (rows: Contract[]) => {
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
        },
        [showToast],
    );

    const handleBulkDelete = useCallback(
        async (rows: Contract[]) => {
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
        },
        [showToast],
    );

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
                pinned: 'right',
                className: 'w-16 text-center px-2 py-1.5',
                cell: (c: Contract) => (
                    <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <a
                            href={`/contracts/${c.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-text-muted hover:text-primary hover:bg-primary/10 hover:border-primary/20 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-transparent transition-all"
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
        let tabs: {
            key: string;
            label: string;
            count: number;
            icon?: React.ComponentType<{ className?: string; size?: number | string }> | React.ReactNode;
            isActive: boolean;
        }[] = [];
        const activeView = (currentView || view) as string;

        const buildTabs = (
            counts: { all?: number; kontrak?: number; non_kontrak?: number; nda?: number } | undefined,
            activeKey: string,
            isHistoryPending: boolean = false,
        ) => {
            if (isHistoryPending) {
                return [
                    {
                        key: 'pending',
                        label: 'Perlu Persetujuan',
                        count: pendingCounts?.pending ?? 0,
                        icon: Clock,
                        isActive: activeKey === 'pending',
                    },
                    {
                        key: 'history',
                        label: 'Riwayat Persetujuan',
                        count: pendingCounts?.history ?? 0,
                        icon: History,
                        isActive: activeKey === 'history',
                    },
                ];
            }

            const rootTypes = ((types as DBContractType[]) || []).filter((t) => !t.parent_id || String(t.parent_id) === String(t.id));

            const tabsList = [{ key: '', label: 'Semua', count: counts?.all ?? 0, icon: LayoutGrid, isActive: !activeKey }];

            if (rootTypes.length > 0) {
                rootTypes.forEach((rt) => {
                    const code = (rt.code || '').toLowerCase();
                    const name = (rt.name || '').toLowerCase();
                    const id = String(rt.id);

                    let tabKey = id;
                    let countKey = id;
                    if (code === 'a-1' || (!name.includes('non') && name.includes('kontrak'))) {
                        tabKey = 'kontrak';
                        countKey = counts?.kontrak !== undefined ? 'kontrak' : id;
                    } else if (code === 'a-2' || name.includes('non')) {
                        tabKey = 'non_kontrak';
                        countKey = counts?.non_kontrak !== undefined ? 'non_kontrak' : id;
                    } else if (code === 'nda' || name.includes('nda') || name.includes('kerahasiaan')) {
                        tabKey = 'nda';
                        countKey = counts?.nda !== undefined ? 'nda' : id;
                    }

                    const tabCount = counts?.[countKey] ?? counts?.[id] ?? 0;

                    tabsList.push({
                        key: tabKey,
                        label: rt.name,
                        count: tabCount,
                        icon: name.includes('nda') ? Zap : FileText,
                        isActive: activeKey === tabKey || activeKey === id,
                    });
                });
            } else {
                const showContract = effectiveDashboardConfig?.show_overview_contract !== false;
                const showNonContract = effectiveDashboardConfig?.show_overview_non_contract !== false;
                const showNda = effectiveDashboardConfig?.show_overview_nda !== false;

                if (showContract) {
                    tabsList.push({
                        key: 'kontrak',
                        label: 'Kontrak',
                        count: counts?.kontrak ?? 0,
                        icon: FileText,
                        isActive: activeKey === 'kontrak',
                    });
                }

                if (showNonContract) {
                    tabsList.push({
                        key: 'non_kontrak',
                        label: 'Non Kontrak',
                        count: counts?.non_kontrak ?? 0,
                        icon: FileCheck,
                        isActive: activeKey === 'non_kontrak',
                    });
                }

                if (showNda) {
                    tabsList.push({
                        key: 'nda',
                        label: 'NDA',
                        count: counts?.nda ?? 0,
                        icon: Zap,
                        isActive: activeKey === 'nda',
                    });
                }
            }

            return tabsList;
        };

        switch (activeView) {
            case 'contracts':
            case 'admin.contracts':
            case 'admin/contracts': {
                const activeKey = filters?.parent_tab || '';
                tabs = buildTabs(parentCategoryCounts, activeKey);
                break;
            }
            case 'organization':
            case 'contracts.organization':
            case 'contracts/organization': {
                const activeKey = filters?.org_tab || filters?.parent_tab || '';
                tabs = buildTabs(orgCategoryCounts || parentCategoryCounts, activeKey);
                break;
            }
            case 'mine': {
                const activeKey = filters?.mine_tab || '';
                tabs = buildTabs(mineCounts, activeKey);
                break;
            }
            case 'pending': {
                const activeKey = filters?.pending_tab === 'history' ? 'history' : 'pending';
                tabs = buildTabs(undefined, activeKey, true);
                break;
            }
            case 'expiry': {
                const activeKey = filters?.expiry_tab || '';
                tabs = buildTabs(expiryCategoryCounts, activeKey);
                break;
            }
            default:
                break;
        }

        if (tabs.length === 0) return null;

        const onTabClick = (tabKey: string) => {
            switch (activeView) {
                case 'contracts':
                case 'admin.contracts':
                case 'admin/contracts':
                    handleFilterChange({ parent_tab: tabKey || '', page: 1 });
                    break;
                case 'organization':
                case 'contracts.organization':
                case 'contracts/organization':
                    handleFilterChange({ org_tab: tabKey || '', page: 1 });
                    break;
                case 'mine':
                    handleFilterChange({ mine_tab: tabKey || '', page: 1 });
                    break;
                case 'pending':
                    handleFilterChange({ pending_tab: tabKey, page: 1 });
                    break;
                case 'expiry':
                    handleFilterChange({ expiry_tab: tabKey || '', page: 1 });
                    break;
                default:
                    break;
            }
        };

        return (
            <div className="border-surface-border bg-card custom-scrollbar flex h-11 shrink-0 items-center gap-6 overflow-x-auto border-b px-5 select-none">
                {tabs.map((tab) => {
                    const TabIcon = tab.icon;
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => onTabClick(tab.key)}
                            className={cn(
                                'group relative -mb-px flex h-full shrink-0 cursor-pointer items-center gap-2 border-b-2 text-xs font-bold transition-all duration-150 select-none',
                                tab.isActive
                                    ? 'border-primary text-primary'
                                    : 'text-muted-foreground hover:border-border hover:text-foreground border-transparent',
                            )}
                        >
                            {TabIcon && (
                                <TabIcon
                                    size={14}
                                    className={cn(
                                        'shrink-0 transition-colors',
                                        tab.isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                                    )}
                                />
                            )}
                            <span>{tab.label}</span>
                            <span
                                className={cn(
                                    'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums transition-colors',
                                    tab.isActive
                                        ? 'bg-primary/10 text-primary dark:bg-primary/20'
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
            <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-slate-100/60 dark:bg-zinc-950">
                {selected ? (
                    <div className="animate-in fade-in slide-in-from-bottom-3 flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden duration-300 ease-in-out">
                        <Suspense
                            fallback={
                                <div className="flex min-h-[400px] w-full flex-1 items-center justify-center p-6">
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
                        <FloatingPanel className="flex min-w-0 flex-1 flex-col">
                            <PageTable
                                standalone={false}
                                title={viewTitleMap[view] || 'Manajemen Kontrak'}
                                subtitle={viewDescMap[view] || 'Daftar seluruh kontrak dalam sistem.'}
                                icon={viewIconMap[view] || FileText}
                                searchValue={view !== 'profile' ? search : undefined}
                                onSearchChange={view !== 'profile' ? setSearch : undefined}
                                searchPlaceholder="Cari kontrak..."
                                actions={
                                    view !== 'profile' ? (
                                        <>
                                            <LayoutToggle value={layout as LayoutType} onChange={handleLayoutChange} />
                                            <Button
                                                variant={isFilterExpanded || activeFilterCount > 0 ? 'primary' : 'white'}
                                                fontSize="11px"
                                                className={cn(
                                                    'h-9 cursor-pointer gap-1.5 rounded-xl border px-3 font-semibold shadow-none transition-all',
                                                    isFilterExpanded
                                                        ? 'bg-primary text-primary-foreground border-primary'
                                                        : activeFilterCount > 0
                                                          ? 'border-primary text-primary bg-primary/5 hover:bg-primary/10'
                                                          : 'border-border text-foreground hover:bg-surface-muted',
                                                )}
                                                onClick={toggleFilterExpanded}
                                                title={isFilterExpanded ? 'Sembunyikan Filter' : 'Buka Filter'}
                                            >
                                                <Filter
                                                    size={14}
                                                    className={
                                                        isFilterExpanded
                                                            ? 'text-primary-foreground'
                                                            : activeFilterCount > 0
                                                              ? 'text-primary'
                                                              : 'text-text-desc'
                                                    }
                                                />
                                                <span>Filter</span>
                                                {activeFilterCount > 0 && (
                                                    <span
                                                        className={cn(
                                                            'flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-black',
                                                            isFilterExpanded ? 'text-primary bg-white' : 'bg-primary text-white',
                                                        )}
                                                    >
                                                        {activeFilterCount}
                                                    </span>
                                                )}
                                                <ChevronDown
                                                    size={13}
                                                    className={cn(
                                                        'opacity-70 transition-transform duration-200',
                                                        isFilterExpanded && 'rotate-180',
                                                    )}
                                                />
                                            </Button>
                                            <Button
                                                variant="primary"
                                                fontSize="11px"
                                                className="shadow-none"
                                                onClick={() => setCreateOpen(true)}
                                            >
                                                <FilePlus size={16} strokeWidth={2.2} /> Buat Pengajuan
                                            </Button>
                                        </>
                                    ) : undefined
                                }
                                pagination={
                                    view !== 'profile'
                                        ? {
                                              currentPage: contractsPaged.current_page,
                                              lastPage: contractsPaged.last_page,
                                              total: contractsPaged.total,
                                              from: contractsPaged.from,
                                              to: contractsPaged.to,
                                              perPage: contractsPaged.per_page,
                                              onPageChange: (page: number) =>
                                                  router.get(
                                                      globalThis.location.pathname,
                                                      { ...filters, page },
                                                      {
                                                          preserveState: true,
                                                          preserveScroll: true,
                                                          only: [
                                                              'contracts',
                                                              'filters',
                                                              'parentCategoryCounts',
                                                              'mineCounts',
                                                              'pendingCounts',
                                                              'expiryCategoryCounts',
                                                          ],
                                                      },
                                                  ),
                                              onPerPageChange: (perPage: number) =>
                                                  router.get(
                                                      globalThis.location.pathname,
                                                      { ...filters, page: 1, per_page: perPage },
                                                      {
                                                          preserveState: true,
                                                          preserveScroll: true,
                                                          only: [
                                                              'contracts',
                                                              'filters',
                                                              'parentCategoryCounts',
                                                              'mineCounts',
                                                              'pendingCounts',
                                                              'expiryCategoryCounts',
                                                          ],
                                                      },
                                                  ),
                                          }
                                        : undefined
                                }
                                showFooter={view !== 'profile'}
                            >
                                <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
                                    {view === 'profile' ? (
                                        <ProfileView meUser={meUser} showToast={showToast} />
                                    ) : (
                                        <div className="bg-surface-base/20 border-surface-border flex h-full min-h-0 flex-1 flex-col gap-0 overflow-hidden">
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
                                                                const cleanTypeName = typeName
                                                                    ? typeName.replace('Perjanjian ', '').replace('Addendum / ', '')
                                                                    : '';
                                                                const progressPercent =
                                                                    c.progress?.total > 0
                                                                        ? Math.round((c.progress.done / c.progress.total) * 100)
                                                                        : 0;
                                                                const currentStepName =
                                                                    c.workflow_step?.description ||
                                                                    c.workflow_step?.role ||
                                                                    (c.status === 'draft' ? 'Pengajuan Draft' : null);

                                                                return (
                                                                    <div
                                                                        key={c.id}
                                                                        onClick={() => openDetail(c)}
                                                                        className="group border-border/70 bg-card hover:border-primary/50 relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-xl border text-left transition-all duration-200 hover:shadow-md"
                                                                    >
                                                                        {/* Top Section: Header & Numbers */}
                                                                        <div className="space-y-2.5 p-4 pb-3">
                                                                            {/* Top Row: Form/Contract No + Status Badge */}
                                                                            <div className="flex items-center justify-between gap-2">
                                                                                <div className="flex min-w-0 items-center gap-1.5">
                                                                                    <span className="text-foreground bg-muted/60 border-border/50 truncate rounded border px-2 py-0.5 font-mono text-[11px] font-bold">
                                                                                        {c.form_no || c.contract_no || 'DRAFT'}
                                                                                    </span>
                                                                                    {!!c.current_version && c.current_version > 0 && (
                                                                                        <span className="bg-primary/10 text-primary border-primary/20 shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold">
                                                                                            v{c.current_version}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <div className="shrink-0">
                                                                                    <StatusBadge
                                                                                        status={c.status}
                                                                                        statusInfo={c.status_info}
                                                                                        size="sm"
                                                                                    />
                                                                                </div>
                                                                            </div>

                                                                            {/* Title & Type */}
                                                                            <div className="space-y-1">
                                                                                <h3
                                                                                    className="text-foreground group-hover:text-primary line-clamp-2 text-[13px] leading-snug font-bold transition-colors"
                                                                                    title={c.title}
                                                                                >
                                                                                    {c.title}
                                                                                </h3>
                                                                                {cleanTypeName && (
                                                                                    <div className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-semibold tracking-wide uppercase">
                                                                                        <span className="bg-surface-muted border-border/60 text-text-desc inline-block rounded border px-1.5 py-0.5">
                                                                                            {cleanTypeName}
                                                                                        </span>
                                                                                        {c.contract_no && c.contract_no !== c.form_no && (
                                                                                            <span
                                                                                                className="text-muted-foreground truncate font-mono"
                                                                                                title={`No. Kontrak: ${c.contract_no}`}
                                                                                            >
                                                                                                • {c.contract_no}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            {/* Vendor / Pihak Kedua */}
                                                                            <div className="bg-muted/30 border-border/40 text-foreground flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs">
                                                                                <Building2 size={13} className="text-primary shrink-0" />
                                                                                <span
                                                                                    className="truncate text-[11px] font-medium"
                                                                                    title={c.vendor?.name || 'Pihak Kedua'}
                                                                                >
                                                                                    {c.vendor?.name || 'Pihak Kedua Tidak Terdaftar'}
                                                                                </span>
                                                                            </div>

                                                                            {/* People: Inisiator & PIC */}
                                                                            <div className="border-border/40 grid grid-cols-2 gap-2 border-t pt-1.5 text-[11px]">
                                                                                {/* Inisiator */}
                                                                                <div className="flex min-w-0 flex-col">
                                                                                    <span className="text-muted-foreground text-[9px] font-semibold tracking-wider uppercase">
                                                                                        Pengaju
                                                                                    </span>
                                                                                    <span
                                                                                        className="text-foreground truncate text-[11px] font-semibold"
                                                                                        title={c.initiator?.name}
                                                                                    >
                                                                                        {c.initiator?.name || '—'}
                                                                                    </span>
                                                                                    {c.initiator?.department_name && (
                                                                                        <span
                                                                                            className="text-muted-foreground truncate text-[9.5px]"
                                                                                            title={c.initiator.department_name}
                                                                                        >
                                                                                            {c.initiator.department_name}
                                                                                        </span>
                                                                                    )}
                                                                                </div>

                                                                                {/* PIC */}
                                                                                <div className="flex min-w-0 flex-col">
                                                                                    <span className="text-muted-foreground text-[9px] font-semibold tracking-wider uppercase">
                                                                                        PIC
                                                                                    </span>
                                                                                    <span
                                                                                        className="text-foreground truncate text-[11px] font-semibold"
                                                                                        title={c.assigned_pic?.name || 'Belum Ada'}
                                                                                    >
                                                                                        {c.assigned_pic?.name || 'Belum Ada'}
                                                                                    </span>
                                                                                    {c.assigned_pic?.department_name && (
                                                                                        <span
                                                                                            className="text-muted-foreground truncate text-[9.5px]"
                                                                                            title={c.assigned_pic.department_name}
                                                                                        >
                                                                                            {c.assigned_pic.department_name}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            {/* Periode Kontrak / Expiry (if applicable) */}
                                                                            {(c.start_date || c.end_date) && (
                                                                                <div className="text-muted-foreground border-border/40 flex items-center justify-between gap-1 border-t pt-1 text-[10.5px]">
                                                                                    <div className="flex items-center gap-1.5 truncate">
                                                                                        <Calendar
                                                                                            size={11}
                                                                                            className="text-muted-foreground/70 shrink-0"
                                                                                        />
                                                                                        <span className="truncate">
                                                                                            {c.start_date
                                                                                                ? formatDate(c.start_date, {
                                                                                                      day: 'numeric',
                                                                                                      month: 'short',
                                                                                                      year: '2-digit',
                                                                                                  })
                                                                                                : '—'}{' '}
                                                                                            s/d{' '}
                                                                                            {c.end_date
                                                                                                ? formatDate(c.end_date, {
                                                                                                      day: 'numeric',
                                                                                                      month: 'short',
                                                                                                      year: '2-digit',
                                                                                                  })
                                                                                                : '—'}
                                                                                        </span>
                                                                                    </div>
                                                                                    {c.end_date && (
                                                                                        <div className="shrink-0 origin-right scale-90">
                                                                                            <ExpiryBadge endDate={c.end_date} />
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Bottom Section: Workflow Progress & SLA Bar */}
                                                                        <div className="bg-muted/20 border-border/50 flex items-center justify-between gap-2 border-t p-3 text-xs">
                                                                            {/* Workflow Step & Progress Track */}
                                                                            <div className="flex max-w-[65%] min-w-0 flex-col gap-1">
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <span
                                                                                        className="text-foreground truncate text-[10px] font-bold"
                                                                                        title={
                                                                                            currentStepName ||
                                                                                            `Tahap ${c.progress?.done || 0}/${c.progress?.total || 0}`
                                                                                        }
                                                                                    >
                                                                                        {currentStepName ||
                                                                                            `Tahap ${c.progress?.done || 0}/${c.progress?.total || 0}`}
                                                                                    </span>
                                                                                    {c.progress?.total > 0 && (
                                                                                        <span className="text-primary shrink-0 font-mono text-[9.5px] font-bold">
                                                                                            ({c.progress.done}/{c.progress.total})
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                {/* Mini Progress Bar */}
                                                                                {c.progress?.total > 0 && (
                                                                                    <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                                                                                        <div
                                                                                            className="bg-primary h-full rounded-full transition-all duration-300"
                                                                                            style={{ width: `${progressPercent}%` }}
                                                                                        />
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            {/* SLA Countdown */}
                                                                            <div className="flex shrink-0 items-center gap-1">
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
                    activeTab={activeCategoryTab}
                    activeContractTypeId={filters?.contract_type_id}
                    dashboardConfig={effectiveDashboardConfig}
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
                <PreviewModal
                    open={previewOpen}
                    onClose={() => setPreviewOpen(false)}
                    title={previewTitle}
                    url={previewUrl}
                    hasFile={previewHasFile}
                />
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

export default ContractList;

