import { ProfileView } from '@/pages/contracts/components/parts/ProfileView';
import { DashboardMetrics } from '@/pages/dashboard/components/DashboardMetrics';
import { Button } from '@/components/ui/buttons/Button';
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
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState, lazy, Suspense, memo } from 'react';
import ContractDetailView from './components/ContractDetailView';

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
    };
    formTemplates?: any[];
    users?: any[];
    vendors?: any[];
    departments?: any[];
    roles?: any[];
}>) {
    const { showToast } = useToast();
    const { canUpdate } = usePermissions('CONTRACTS');
    const [view, setView] = useState<View>(currentView);
    const [selected, setSelected] = useState<Contract | null>(initialSelected ?? null);
    const [search, setSearch] = useState(filters?.search || '');
    const debouncedSearch = useDebounce(search, 500);

    const handleFilterChange = useCallback(
        (newFilters: any) => {
            const merged = { ...filters, ...newFilters };
            const query = Object.fromEntries(
                Object.entries(merged).filter(([_, v]) => v !== undefined && v !== '' && (Array.isArray(v) ? v.length > 0 : true)),
            ) as any;
            router.get(globalThis.location.pathname, query, { preserveState: true, preserveScroll: true, replace: true });
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

    const isDescendantOrSelf = useCallback((targetId: string, parentId: string): boolean => {
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

    const activeFiltersCount = useMemo(() => {
        const getCount = (val: any) => {
            if (Array.isArray(val)) return val.length;
            return val ? 1 : 0;
        };
        return getCount(filters.status) + getCount(filters.contract_type_id);
    }, [filters.status, filters.contract_type_id]);

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
        handleFilterChange({ status: [], contract_type_id: [], department_id: [], created_from: '', created_to: '' });
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
                    <div className="animate-in fade-in slide-in-from-bottom-3 flex w-full flex-1 flex-col duration-300 ease-in-out">
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
                    <div className="animate-in fade-in slide-in-from-top-3 flex w-full flex-1 flex-col duration-300 ease-in-out">
                        <div className="flex flex-col gap-4">
                            {view === 'dashboard' && (
                                <div className="p-5">
                                    <DashboardMetrics metrics={metrics} />
                                </div>
                            )}
                            {view === 'profile' && <ProfileView meUser={meUser} showToast={showToast} />}
                            {view !== 'profile' && view !== 'dashboard' && (
                                <div className="bg-surface-base/20 border-surface-border flex min-h-0 flex-1 flex-col gap-0 overflow-hidden">
                                    <div className="border-surface-border bg-surface-base/80 sticky top-0 z-[50] flex items-center gap-6 border-b px-5 py-4 backdrop-blur-md">
                                        <div className="flex max-w-sm flex-1 items-center gap-2">
                                            <SearchInput
                                                containerClassName="flex-1"
                                                placeholder="Cari kontrak..."
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                            />
                                            <FilterPopover
                                                totalResults={contractsPaged.total}
                                                activeFilters={{
                                                    status: ensureArray(filters.status),
                                                    contract_type_id: ensureArray(filters.contract_type_id),
                                                    department_id: ensureArray(filters.department_id),
                                                    created_from: filters.created_from || '',
                                                    created_to: filters.created_to || '',
                                                }}
                                                onFilterChange={handleSingleFilterToggle}
                                                onReset={handleClearAllFilters}
                                                categories={[
                                                    {
                                                        label: 'Status Dokumen',
                                                        key: 'status',
                                                        type: 'searchable',
                                                        options: [
                                                            {
                                                                label: 'Draft',
                                                                value: 'draft',
                                                                icon: Layers,
                                                                color: 'bg-surface-muted text-text-soft',
                                                            },
                                                            { label: 'Pending', value: 'pending', icon: Clock, color: 'bg-warning/10 text-warning' },
                                                            {
                                                                label: 'In Review',
                                                                value: 'in_review',
                                                                icon: Zap,
                                                                color: 'bg-warning/10 text-warning',
                                                            },
                                                            {
                                                                label: 'Revision',
                                                                value: 'revision',
                                                                icon: AlertTriangle,
                                                                color: 'bg-danger/10 text-danger',
                                                            },
                                                            {
                                                                label: 'Approved',
                                                                value: 'approved',
                                                                icon: CheckCircle2,
                                                                color: 'bg-primary text-primary-foreground',
                                                            },
                                                            {
                                                                label: 'Rejected',
                                                                value: 'rejected',
                                                                icon: AlertCircle,
                                                                color: 'bg-danger/10 text-danger',
                                                            },
                                                        ],
                                                    },
                                                    {
                                                        label: 'Departemen',
                                                        key: 'department_id',
                                                        type: 'searchable',
                                                        options: departments.map((d) => ({
                                                            label: d.name,
                                                            value: d.id,
                                                        })),
                                                    },
                                                    {
                                                        label: 'Kategori Kontrak',
                                                        key: 'contract_type_id',
                                                        type: 'searchable',
                                                        options: types.map((t) => ({
                                                            label: t.name,
                                                            value: t.id,
                                                            icon: FileType,
                                                        })),
                                                    },
                                                    {
                                                        label: 'Rentang Tanggal Dibuat',
                                                        key: 'created',
                                                        type: 'date-range',
                                                    },
                                                ]}
                                            >
                                                <Button
                                                    variant={activeFiltersCount > 0 ? 'primary' : 'white'}
                                                    className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl p-0"
                                                >
                                                    <Filter size={14} strokeWidth={2.5} />
                                                    {activeFiltersCount > 0 && (
                                                        <span className="bg-primary absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-md border border-white px-1 text-[9px] font-semibold text-white shadow-sm dark:border-black">
                                                            {activeFiltersCount}
                                                        </span>
                                                    )}
                                                </Button>
                                            </FilterPopover>
                                        </div>
                                        <div className="ml-auto flex items-center gap-2">
                                            <LayoutToggle value={layout as LayoutType} onChange={(val) => setLayout(val)} />
                                            <Button variant="white" fontSize="11px" onClick={() => setCreateOpen(true)}>
                                                <PlusCircle size={16} strokeWidth={2.5} /> Kontrak Baru
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="border-surface-border bg-surface-base/40 sticky top-[73px] z-10 flex scrollbar-none items-center gap-1.5 overflow-x-auto border-b px-5 py-2 backdrop-blur-md">
                                        <Button
                                            onClick={() => handleFilterChange({ contract_type_id: undefined, page: 1 })}
                                            variant={!filters.contract_type_id ? 'primary' : 'ghost'}
                                            size="sm"
                                            fontSize="11px"
                                            className="whitespace-nowrap"
                                        >
                                            Semua Kontrak
                                        </Button>
                                        {rootTypes.map((type) => {
                                            const isActive = filters.contract_type_id && isDescendantOrSelf(filters.contract_type_id, type.id);
                                            return (
                                                <div key={type.id} className="inline-flex items-center rounded-xl overflow-hidden border border-surface-border bg-surface-base/20 shrink-0">
                                                    <button
                                                        onClick={() => handleFilterChange({ contract_type_id: type.id, page: 1 })}
                                                        className={cn(
                                                            "h-8 px-3 text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap outline-hidden",
                                                            isActive ? "bg-primary text-primary-foreground dark:bg-white dark:text-black font-semibold" : "hover:bg-surface-muted text-text-main dark:text-white"
                                                        )}
                                                    >
                                                        {type.name}
                                                    </button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button
                                                                className={cn(
                                                                    "h-8 px-2 border-l border-surface-border transition-all cursor-pointer outline-hidden flex items-center justify-center",
                                                                    isActive ? "bg-primary text-primary-foreground dark:bg-white dark:text-black" : "hover:bg-surface-muted text-text-main dark:text-white"
                                                                )}
                                                            >
                                                                <ChevronDown size={12} />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 shadow-lg rounded-md min-w-[200px]">
                                                            <DropdownMenuItem
                                                                onClick={() => handleFilterChange({ contract_type_id: type.id, page: 1 })}
                                                                className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-xs px-3 py-2 font-semibold text-primary"
                                                            >
                                                                Semua {type.name}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                                            {renderDropdownItems(type.id)}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            );
                                        })}
                                    </div>

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
                                                pagination={{
                                                    currentPage: contractsPaged.current_page,
                                                    lastPage: contractsPaged.last_page,
                                                    total: contractsPaged.total,
                                                    onPageChange: (page: number) =>
                                                        router.get(globalThis.location.pathname, { ...filters, page }, { preserveState: true }),
                                                }}
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
                                                                    <StatusBadge status={c.status} />
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

                                                <div className="mt-8 mb-10 flex w-full items-center justify-between px-2 text-xs select-none">
                                                    <span className="text-text-soft">
                                                        Menampilkan <span className="font-semibold text-text-main">{contractsPaged.from || 0} - {contractsPaged.to || 0}</span> dari <span className="font-semibold text-text-main">{contractsPaged.total || 0}</span> kontrak
                                                    </span>

                                                    <div className="flex items-center gap-1.5">
                                                        <Button
                                                            variant="white"
                                                            size="icon"
                                                            disabled={contractsPaged.current_page === 1}
                                                            onClick={() =>
                                                                router.get(
                                                                    globalThis.location.pathname,
                                                                    { ...filters, page: contractsPaged.current_page - 1 },
                                                                    { preserveState: true },
                                                                )
                                                            }
                                                            className="h-8 w-8 rounded-lg border border-surface-border bg-surface-base"
                                                        >
                                                            <ChevronLeft className="text-text-main h-4 w-4" />
                                                        </Button>
                                                        <div className="flex h-8 items-center gap-1 rounded-lg border border-surface-border bg-surface-base px-3 text-[11px] font-semibold">
                                                            <span className="text-primary font-bold">{contractsPaged.current_page}</span>
                                                            <span className="text-text-soft/60">/</span>
                                                            <span className="text-text-main">
                                                                {contractsPaged.last_page || 1}
                                                            </span>
                                                        </div>
                                                        <Button
                                                            variant="white"
                                                            size="icon"
                                                            disabled={contractsPaged.current_page === contractsPaged.last_page}
                                                            onClick={() =>
                                                                router.get(
                                                                    globalThis.location.pathname,
                                                                    { ...filters, page: contractsPaged.current_page + 1 },
                                                                    { preserveState: true },
                                                                )
                                                            }
                                                            className="h-8 w-8 rounded-lg border border-surface-border bg-surface-base"
                                                        >
                                                            <ChevronRight className="text-text-main h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
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
                    />
                )}
            </ToastProvider>
        </>
    );
}
