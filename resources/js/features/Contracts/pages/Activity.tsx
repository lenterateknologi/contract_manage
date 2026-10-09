import React, { useState, useMemo } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowUpRight,
    Calendar,
    Check,
    Clock,
    Eye,
    FileEdit,
    FilePlus,
    FileText,
    GitBranch,
    Layers,
    Lock,
    MoreVertical,
    Plus,
    RefreshCw,
    Search,
    ShieldAlert,
    Trash2,
    User,
    UserCheck,
    UserPlus,
    X,
    ChevronLeft,
    ChevronRight,
    History,
} from 'lucide-react';
import { Button } from '@/components/ui/buttons/Button';
import { FloatingPanel } from '@/components/ui/navigation/FloatingPanel';
import { ToastProvider, useToast } from '@/components/ui/feedback/Toast';
import { StatusBadge } from '@/components/ui/feedback/StatusBadge';
import { cn, formatDateAndTimeParts } from '@/lib/utils';
import {
    Contract,
    ContractType,
    SubmissionType,
    UserProfile,
    DBContractType,
    Department,
    Division,
    Role,
    Region,
    Location,
    CompanyGroup,
    Company,
} from '@/features/Contracts/types';
import {
    ContractNoAndTitleCell,
    InitiatorCell,
    AssignedPicCell,
    CreatedAtCell,
    StatusAndStepCell,
} from '@/features/Contracts/ContractList/ContractTableCells';
import { ContractDetailView } from '@/features/Contracts/ContractDetail/ContractDetail';
import CreateContractModal from '@/features/Contracts/components/modals/CreateContractModal';
import { EditContractModal } from '@/features/Contracts/components/modals/EditContractModal';
import PreviewModal from '@/features/Contracts/components/modals/PreviewModal';
import { ContractContextMenu } from '@/features/Contracts/components/ContractContextMenu';
import { ConfirmationModal } from '@/components/ui';
import { contractApi } from '@/features/Contracts/utils';

interface PagedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface ActivityPageProps {
    pendingContracts: PagedData<Contract>;
    inProgressContracts: PagedData<Contract>;
    draftContracts: PagedData<Contract>;
    types: DBContractType[];
    submissionTypes?: SubmissionType[];
    counts?: Record<string, any>;
    activityCounts?: {
        pending?: number;
        history?: number;
        in_progress?: number;
        draft?: number;
    };
    pendingCounts?: {
        pending?: number;
        history?: number;
    };
    mineCounts?: Record<string, any>;
    filters?: Record<string, any>;
    breadcrumbs?: Array<{ title: string; href: string; icon?: string; description?: string }>;
    users?: UserProfile[];
    vendors?: any[];
    formTemplates?: any[];
    departments?: Department[];
    divisions?: Division[];
    roles?: Role[];
    regions?: Region[];
    locations?: Location[];
    companyGroups?: CompanyGroup[];
    companies?: Company[];
    contractStatuses?: any[];
}

function PaginationBar({
    paged,
    pageParam,
    onPageChange,
}: {
    paged: PagedData<Contract>;
    pageParam: string;
    onPageChange: (param: string, page: number) => void;
}) {
    if (!paged || paged.total <= paged.per_page) return null;

    return (
        <div className="flex items-center justify-between border-t border-surface-border bg-surface-base/20 px-3 py-1.5 text-[11px] text-text-desc">
            <div className="font-medium">
                Menampilkan <span className="font-bold text-text-main">{paged.from || 0}</span> -{' '}
                <span className="font-bold text-text-main">{paged.to || 0}</span> dari{' '}
                <span className="font-bold text-text-main">{paged.total}</span> data
            </div>
            <div className="flex items-center gap-1">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={paged.current_page <= 1}
                    onClick={() => onPageChange(pageParam, paged.current_page - 1)}
                    className="h-6 w-6 p-0 cursor-pointer shadow-none rounded-[4px]"
                >
                    <ChevronLeft size={12} />
                </Button>
                <span className="px-1.5 font-semibold text-text-main text-[11px]">
                    {paged.current_page} / {paged.last_page}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={paged.current_page >= paged.last_page}
                    onClick={() => onPageChange(pageParam, paged.current_page + 1)}
                    className="h-6 w-6 p-0 cursor-pointer shadow-none rounded-[4px]"
                >
                    <ChevronRight size={12} />
                </Button>
            </div>
        </div>
    );
}

function SortableHeaderCell({
    title,
    columnKey,
    currentSort,
    currentDir = 'desc',
    onSort,
    className,
    align = 'left',
}: {
    title: string;
    columnKey?: string;
    currentSort?: string;
    currentDir?: 'asc' | 'desc' | string;
    onSort?: (columnKey: string) => void;
    className?: string;
    align?: 'left' | 'center' | 'right';
}) {
    const isSortable = !!columnKey && !!onSort;
    const isSorted = isSortable && currentSort === columnKey;

    return (
        <th
            className={cn(
                'px-3 py-2 text-[10px] font-bold uppercase tracking-wider select-none text-white dark:text-zinc-200 align-middle whitespace-nowrap',
                isSortable && 'cursor-pointer hover:bg-white/10 transition-colors',
                align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left',
                className
            )}
            onClick={() => {
                if (isSortable && onSort) {
                    onSort(columnKey);
                }
            }}
        >
            <div
                className={cn(
                    'flex items-center gap-1.5',
                    align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'
                )}
            >
                <span className="text-white dark:text-zinc-200">{title}</span>
                {isSortable && (
                    <span className="flex flex-col text-[7.5px] leading-[5.5px]">
                        <span className={cn(isSorted && currentDir === 'asc' ? 'text-white font-black scale-110' : 'text-white/40 dark:text-zinc-500')}>
                            ▲
                        </span>
                        <span className={cn(isSorted && currentDir === 'desc' ? 'text-white font-black scale-110' : 'text-white/40 dark:text-zinc-500')}>
                            ▼
                        </span>
                    </span>
                )}
            </div>
        </th>
    );
}

export function ActivityViewContent({
    pendingContracts,
    inProgressContracts,
    draftContracts,
    types = [],
    submissionTypes = [],
    counts,
    activityCounts,
    pendingCounts,
    mineCounts,
    filters = {},
    breadcrumbs,
    users = [],
    vendors = [],
    formTemplates = [],
    departments = [],
    divisions = [],
    roles = [],
    regions = [],
    locations = [],
    companyGroups = [],
    companies = [],
    contractStatuses = [],
}: ActivityPageProps) {
    const { auth } = usePage<{ auth: { user: UserProfile | null } }>().props;
    const { showToast } = useToast();

    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [contractToEdit, setContractToEdit] = useState<Contract | null>(null);
    const [processing, setProcessing] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewTitle, setPreviewTitle] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const [previewHasFile, setPreviewHasFile] = useState(false);
    const [contextMenu, setContextMenu] = useState<{
        contract: Contract;
        position: { x: number; y: number };
    } | null>(null);

    const handleRowContextMenu = (c: Contract, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            contract: c,
            position: { x: e.clientX, y: e.clientY },
        });
    };

    // Search state per table
    const [searchPending, setSearchPending] = useState(filters.search_pending || '');
    const [searchProgress, setSearchProgress] = useState(filters.search_progress || '');
    const [searchDraft, setSearchDraft] = useState(filters.search_draft || '');

    const handleSearchSubmit = (key: string, value: string) => {
        router.get(
            window.location.pathname,
            {
                ...filters,
                [key]: value,
                ...(key === 'search_pending' ? { page_pending: 1 } : {}),
                ...(key === 'search_progress' ? { page_progress: 1 } : {}),
                ...(key === 'search_draft' ? { page_draft: 1 } : {}),
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleSort = (tableKey: 'pending' | 'progress' | 'draft', columnKey: string) => {
        const sortKey = `sort_${tableKey}`;
        const dirKey = `dir_${tableKey}`;
        const pageKey = `page_${tableKey}`;

        const currentSort = filters[sortKey] || 'updated_at';
        const currentDir = (filters[dirKey] || 'desc').toLowerCase();

        let nextDir = 'desc';
        if (currentSort === columnKey) {
            nextDir = currentDir === 'desc' ? 'asc' : 'desc';
        } else {
            nextDir = columnKey === 'created_at' || columnKey === 'updated_at' ? 'desc' : 'asc';
        }

        router.get(
            window.location.pathname,
            {
                ...filters,
                [sortKey]: columnKey,
                [dirKey]: nextDir,
                [pageKey]: 1,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handlePageChange = (pageParam: string, page: number) => {
        router.get(
            window.location.pathname,
            { ...filters, [pageParam]: page },
            { preserveState: true, preserveScroll: true }
        );
    };

    const openDetail = (contract: Contract) => {
        setSelectedContract(contract);
    };

    const openEdit = (contract: Contract, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setContractToEdit(contract);
        setEditOpen(true);
    };

    const handleDeleteDraft = async (contract: Contract, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(`Apakah Anda yakin ingin menghapus draft "${contract.title}"?`)) return;

        setProcessing(true);
        try {
            await contractApi.delete(contract.id);
            showToast('Draft pengajuan berhasil dihapus.', 'success');
            router.reload();
        } catch {
            showToast('Gagal menghapus draft pengajuan.', 'danger');
        } finally {
            setProcessing(false);
        }
    };

    const handleCreate = async (data: Parameters<typeof contractApi.create>[0]) => {
        setProcessing(true);
        try {
            const newContract = await contractApi.create(data);
            showToast('Pengajuan baru berhasil dibuat.', 'success');
            setCreateOpen(false);
            if (newContract?.id) {
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

    const handleUpdate = async (data: Parameters<typeof contractApi.update>[1]) => {
        if (!contractToEdit) return;
        setProcessing(true);
        try {
            await contractApi.update(contractToEdit.id, data);
            showToast('Pengajuan berhasil diperbarui.', 'success');
            setEditOpen(false);
            router.reload();
        } catch {
            showToast('Gagal memperbarui pengajuan.', 'danger');
        } finally {
            setProcessing(false);
        }
    };

    if (selectedContract) {
        return (
            <>
                <Head title={`Detail - ${selectedContract.title || selectedContract.form_no || 'Pengajuan'}`} />
                <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-slate-100/60 dark:bg-zinc-950">
                    <ContractDetailView
                        contract={selectedContract}
                        meId={auth?.user?.id}
                        types={types as any}
                        submissionTypes={submissionTypes}
                        vendors={vendors}
                        formTemplates={formTemplates}
                        users={users}
                        canUpdate={true}
                        onClose={() => {
                            setSelectedContract(null);
                            router.reload();
                        }}
                        onUpdate={(updated) => {
                            setSelectedContract((prev) => (prev ? { ...prev, ...updated } : updated));
                        }}
                        showToast={showToast}
                        setDeleteOpen={setDeleteOpen}
                        setPreviewTitle={setPreviewTitle}
                        setPreviewUrl={setPreviewUrl}
                        setPreviewHasFile={setPreviewHasFile}
                        setPreviewOpen={setPreviewOpen}
                        meUser={auth?.user}
                    />
                </div>
                <ConfirmationModal
                    open={deleteOpen}
                    onClose={() => setDeleteOpen(false)}
                    onConfirm={async () => {
                        if (!selectedContract) return;
                        setProcessing(true);
                        try {
                            await contractApi.delete(selectedContract.id);
                            showToast('Pengajuan berhasil dihapus.', 'success');
                            setDeleteOpen(false);
                            setSelectedContract(null);
                            router.reload();
                        } catch {
                            showToast('Gagal menghapus pengajuan.', 'danger');
                        } finally {
                            setProcessing(false);
                        }
                    }}
                    title="Hapus Kontrak?"
                    description="Seluruh data dokumen, riwayat, dan chat terkait kontrak ini akan dihapus secara permanen."
                    processing={processing}
                />
                <PreviewModal
                    open={previewOpen}
                    onClose={() => setPreviewOpen(false)}
                    title={previewTitle}
                    url={previewUrl}
                    hasFile={previewHasFile}
                />
            </>
        );
    }

    return (
        <>
            <Head title="Aktivitas Pengajuan" />

            <div className="flex h-full max-h-full w-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
                <div className="custom-scrollbar h-full min-h-0 flex-1 overflow-y-auto p-3 md:p-4 space-y-3 w-full">
                    {/* Top Banner Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-card border border-surface-border rounded-[4px] p-3">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-7 items-center justify-center rounded-[4px] bg-primary/10 text-primary">
                                <Layers size={15} />
                            </div>
                            <div>
                                <h1 className="text-xs font-bold text-text-main tracking-tight">
                                    Aktivitas Pengajuan Saya
                                </h1>
                                <p className="text-[11px] text-text-desc">
                                    Pantau dan kelola seluruh pengajuan Anda: tindakan persetujuan, progres aktif, dan draft.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 gap-1 rounded-[4px] text-[11px] cursor-pointer shadow-none"
                                onClick={() => router.reload()}
                            >
                                <RefreshCw size={11} className={processing ? 'animate-spin' : ''} />
                                <span>Segarkan</span>
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                className="h-7 gap-1.5 rounded-[4px] text-[11px] font-semibold shadow-none cursor-pointer"
                                onClick={() => setCreateOpen(true)}
                            >
                                <FilePlus size={12} />
                                <span>Buat Pengajuan Baru</span>
                            </Button>
                        </div>
                    </div>

                    {/* Quick KPI Stats (Seragam & 4px Radius) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        <Link
                            href="/contracts/pending?approval_status=pending"
                            className="group bg-surface-card hover:bg-surface-muted/30 border border-surface-border hover:border-primary/40 rounded-[4px] p-2.5 flex items-center justify-between transition-colors cursor-pointer"
                        >
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-bold text-text-desc group-hover:text-primary uppercase tracking-wider transition-colors">
                                        Perlu Tindakan Anda
                                    </span>
                                    <ArrowUpRight size={11} className="text-text-desc opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all" />
                                </div>
                                <div className="text-lg font-black text-text-main">
                                    {activityCounts?.pending ?? counts?.pending ?? pendingCounts?.pending ?? pendingContracts?.total ?? 0}
                                </div>
                                <p className="text-[10px] text-text-desc">
                                    Menunggu persetujuan
                                </p>
                            </div>
                            <div className="size-8 rounded-[4px] bg-surface-muted group-hover:bg-primary/10 group-hover:text-primary flex items-center justify-center text-text-desc transition-colors">
                                <Clock size={16} />
                            </div>
                        </Link>

                        <Link
                            href="/contracts/pending?approval_status=history"
                            className="group bg-surface-card hover:bg-surface-muted/30 border border-surface-border hover:border-primary/40 rounded-[4px] p-2.5 flex items-center justify-between transition-colors cursor-pointer"
                        >
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-bold text-text-desc group-hover:text-primary uppercase tracking-wider transition-colors">
                                        Pernah Ditindaklanjuti
                                    </span>
                                    <ArrowUpRight size={11} className="text-text-desc opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all" />
                                </div>
                                <div className="text-lg font-black text-text-main">
                                    {activityCounts?.history ?? counts?.history ?? pendingCounts?.history ?? 0}
                                </div>
                                <p className="text-[10px] text-text-desc">
                                    Riwayat persetujuan Anda
                                </p>
                            </div>
                            <div className="size-8 rounded-[4px] bg-surface-muted group-hover:bg-primary/10 group-hover:text-primary flex items-center justify-center text-text-desc transition-colors">
                                <History size={16} />
                            </div>
                        </Link>

                        <Link
                            href="/contracts/mine?parent_tab=in_progress"
                            className="group bg-surface-card hover:bg-surface-muted/30 border border-surface-border hover:border-primary/40 rounded-[4px] p-2.5 flex items-center justify-between transition-colors cursor-pointer"
                        >
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-bold text-text-desc group-hover:text-primary uppercase tracking-wider transition-colors">
                                        Sedang Diproses
                                    </span>
                                    <ArrowUpRight size={11} className="text-text-desc opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all" />
                                </div>
                                <div className="text-lg font-black text-text-main">
                                    {activityCounts?.in_progress ?? counts?.in_progress ?? mineCounts?.in_progress ?? inProgressContracts?.total ?? 0}
                                </div>
                                <p className="text-[10px] text-text-desc">
                                    Pengajuan aktif Anda
                                </p>
                            </div>
                            <div className="size-8 rounded-[4px] bg-surface-muted group-hover:bg-primary/10 group-hover:text-primary flex items-center justify-center text-text-desc transition-colors">
                                <GitBranch size={16} />
                            </div>
                        </Link>

                        <Link
                            href="/contracts/mine?status=draft"
                            className="group bg-surface-card hover:bg-surface-muted/30 border border-surface-border hover:border-primary/40 rounded-[4px] p-2.5 flex items-center justify-between transition-colors cursor-pointer"
                        >
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-bold text-text-desc group-hover:text-primary uppercase tracking-wider transition-colors">
                                        Draft Pengajuan
                                    </span>
                                    <ArrowUpRight size={11} className="text-text-desc opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all" />
                                </div>
                                <div className="text-lg font-black text-text-main">
                                    {activityCounts?.draft ?? counts?.draft ?? mineCounts?.draft ?? draftContracts?.total ?? 0}
                                </div>
                                <p className="text-[10px] text-text-desc">
                                    Belum diajukan
                                </p>
                            </div>
                            <div className="size-8 rounded-[4px] bg-surface-muted group-hover:bg-primary/10 group-hover:text-primary flex items-center justify-center text-text-desc transition-colors">
                                <FileEdit size={16} />
                            </div>
                        </Link>
                    </div>

                    {/* ========================================================================= */}
                    {/* TABLE 1: PERLU TINDAKAN (MENUNGGU PERSETUJUAN SAYA) - PALING ATAS         */}
                    {/* ========================================================================= */}
                    <div className="overflow-hidden border border-surface-border rounded-[4px] bg-surface-card">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border bg-surface-muted/30 px-3 py-2">
                            <div className="flex items-center gap-2">
                                <div className="flex size-6 items-center justify-center rounded-[4px] bg-surface-muted text-text-desc">
                                    <Clock size={13} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xs font-bold text-text-main">
                                        Perlu Tindakan / Menunggu Persetujuan
                                    </h2>
                                    <span className="rounded-[4px] bg-surface-muted px-1.5 py-0.2 text-[10px] font-extrabold text-text-main">
                                        {pendingContracts?.total || 0}
                                    </span>
                                </div>
                            </div>

                            {/* Search bar & See More */}
                            <div className="flex items-center gap-1.5 w-full sm:w-auto">
                                <div className="relative w-full sm:w-56">
                                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-desc opacity-60" />
                                    <input
                                        type="text"
                                        value={searchPending}
                                        onChange={(e) => setSearchPending(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit('search_pending', searchPending)}
                                        placeholder="Cari judul / no. form..."
                                        className="h-7 w-full rounded-[4px] border border-surface-border bg-surface-base pl-7 pr-6 text-[11px] text-text-main placeholder:text-text-desc outline-none focus:border-primary"
                                    />
                                    {searchPending && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearchPending('');
                                                handleSearchSubmit('search_pending', '');
                                            }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-desc hover:text-text-main cursor-pointer"
                                        >
                                            <X size={11} />
                                        </button>
                                    )}
                                </div>
                                <Link
                                    href="/contracts/pending"
                                    className="inline-flex h-7 items-center justify-center gap-1 rounded-[4px] border border-surface-border bg-surface-base px-2 text-[11px] font-medium text-text-desc hover:border-primary hover:text-primary transition-colors shrink-0 shadow-none cursor-pointer"
                                    title="Lihat semua dokumen yang perlu tindakan"
                                >
                                    <span>Lihat Semua</span>
                                    <ArrowUpRight size={12} />
                                </Link>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full border-collapse text-left text-[11px]">
                                <thead className="bg-primary dark:bg-zinc-800/90 text-white dark:text-zinc-200">
                                    <tr className="border-b border-primary/20 dark:border-zinc-700/80">
                                        <SortableHeaderCell
                                            title="No. Dokumen & Judul"
                                            columnKey="title"
                                            currentSort={filters.sort_pending || 'updated_at'}
                                            currentDir={filters.dir_pending || 'desc'}
                                            onSort={(col) => handleSort('pending', col)}
                                        />
                                        <SortableHeaderCell
                                            title="Requestor"
                                            columnKey="requestor"
                                            currentSort={filters.sort_pending || 'updated_at'}
                                            currentDir={filters.dir_pending || 'desc'}
                                            onSort={(col) => handleSort('pending', col)}
                                        />
                                        <SortableHeaderCell
                                            title="Tahap & Status"
                                            columnKey="status"
                                            currentSort={filters.sort_pending || 'updated_at'}
                                            currentDir={filters.dir_pending || 'desc'}
                                            onSort={(col) => handleSort('pending', col)}
                                        />
                                        <SortableHeaderCell
                                            title="PIC"
                                            columnKey="pic"
                                            currentSort={filters.sort_pending || 'updated_at'}
                                            currentDir={filters.dir_pending || 'desc'}
                                            onSort={(col) => handleSort('pending', col)}
                                        />
                                        <SortableHeaderCell
                                            title="Tanggal Masuk"
                                            columnKey="updated_at"
                                            currentSort={filters.sort_pending || 'updated_at'}
                                            currentDir={filters.dir_pending || 'desc'}
                                            onSort={(col) => handleSort('pending', col)}
                                        />
                                        <SortableHeaderCell
                                            title="Aksi"
                                            align="center"
                                            className="w-[80px] min-w-[80px] max-w-[80px] text-center"
                                        />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-border">
                                    {pendingContracts?.data?.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-6 text-center text-text-desc">
                                                <div className="flex flex-col items-center justify-center gap-1">
                                                    <Clock size={16} className="text-text-desc opacity-50" />
                                                    <span className="text-[11px] font-medium text-text-desc">
                                                        Tidak ada dokumen yang menunggu tindakan Anda
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        pendingContracts?.data?.map((c) => (
                                            <tr
                                                key={c.id}
                                                onClick={() => openDetail(c)}
                                                onContextMenu={(e) => handleRowContextMenu(c, e)}
                                                className="group hover:bg-surface-muted/20 transition-colors cursor-pointer"
                                            >
                                                <td className="px-3 py-1.5">
                                                    <ContractNoAndTitleCell c={c} types={types as any} />
                                                </td>
                                                <td className="px-3 py-1.5">
                                                    <InitiatorCell c={c} />
                                                </td>
                                                <td className="px-3 py-1.5">
                                                    <StatusAndStepCell c={c} />
                                                </td>
                                                <td className="px-3 py-1.5">
                                                    <AssignedPicCell c={c} />
                                                </td>
                                                <td className="px-3 py-1.5">
                                                    <CreatedAtCell c={c} />
                                                </td>
                                                <td className="w-[80px] min-w-[80px] max-w-[80px] px-3 py-1.5 text-center" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center justify-center">
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            onClick={() => openDetail(c)}
                                                            className="h-6 w-6 p-0 rounded-[4px] shadow-none cursor-pointer"
                                                            title="Tindak Lanjuti"
                                                        >
                                                            <Eye size={12} />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <PaginationBar
                            paged={pendingContracts}
                            pageParam="page_pending"
                            onPageChange={handlePageChange}
                        />
                    </div>

                    {/* ========================================================================= */}
                    {/* TABLE 2: SEDANG DIPROSES (IN PROGRESS) - TENGAH                            */}
                    {/* ========================================================================= */}
                    <div className="overflow-hidden border border-surface-border rounded-[4px] bg-surface-card">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border bg-surface-muted/30 px-3 py-2">
                            <div className="flex items-center gap-2">
                                <div className="flex size-6 items-center justify-center rounded-[4px] bg-surface-muted text-text-desc">
                                    <GitBranch size={13} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xs font-bold text-text-main">
                                        Pengajuan Sedang Diproses
                                    </h2>
                                    <span className="rounded-[4px] bg-surface-muted px-1.5 py-0.2 text-[10px] font-extrabold text-text-main">
                                        {inProgressContracts?.total || 0}
                                    </span>
                                </div>
                            </div>

                            {/* Search bar & See More */}
                            <div className="flex items-center gap-1.5 w-full sm:w-auto">
                                <div className="relative w-full sm:w-56">
                                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-desc opacity-60" />
                                    <input
                                        type="text"
                                        value={searchProgress}
                                        onChange={(e) => setSearchProgress(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit('search_progress', searchProgress)}
                                        placeholder="Cari judul / no. form..."
                                        className="h-7 w-full rounded-[4px] border border-surface-border bg-surface-base pl-7 pr-6 text-[11px] text-text-main placeholder:text-text-desc outline-none focus:border-primary"
                                    />
                                    {searchProgress && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearchProgress('');
                                                handleSearchSubmit('search_progress', '');
                                            }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-desc hover:text-text-main cursor-pointer"
                                        >
                                            <X size={11} />
                                        </button>
                                    )}
                                </div>
                                <Link
                                    href="/contracts/mine?parent_tab=in_progress"
                                    className="inline-flex h-7 items-center justify-center gap-1 rounded-[4px] border border-surface-border bg-surface-base px-2 text-[11px] font-medium text-text-desc hover:border-primary hover:text-primary transition-colors shrink-0 shadow-none cursor-pointer"
                                    title="Lihat semua pengajuan yang sedang diproses"
                                >
                                    <span>Lihat Semua</span>
                                    <ArrowUpRight size={12} />
                                </Link>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full border-collapse text-left text-[11px]">
                                <thead className="bg-primary dark:bg-zinc-800/90 text-white dark:text-zinc-200">
                                    <tr className="border-b border-primary/20 dark:border-zinc-700/80">
                                        <SortableHeaderCell
                                            title="No. Dokumen & Judul"
                                            columnKey="title"
                                            currentSort={filters.sort_progress || 'updated_at'}
                                            currentDir={filters.dir_progress || 'desc'}
                                            onSort={(col) => handleSort('progress', col)}
                                        />
                                        <SortableHeaderCell
                                            title="Status & Tahap"
                                            columnKey="status"
                                            currentSort={filters.sort_progress || 'updated_at'}
                                            currentDir={filters.dir_progress || 'desc'}
                                            onSort={(col) => handleSort('progress', col)}
                                        />
                                        <SortableHeaderCell
                                            title="PIC Legal"
                                            columnKey="pic"
                                            currentSort={filters.sort_progress || 'updated_at'}
                                            currentDir={filters.dir_progress || 'desc'}
                                            onSort={(col) => handleSort('progress', col)}
                                        />
                                        <SortableHeaderCell
                                            title="Tanggal Pengajuan"
                                            columnKey="created_at"
                                            currentSort={filters.sort_progress || 'updated_at'}
                                            currentDir={filters.dir_progress || 'desc'}
                                            onSort={(col) => handleSort('progress', col)}
                                        />
                                        <SortableHeaderCell
                                            title="Aksi"
                                            align="center"
                                            className="w-[80px] min-w-[80px] max-w-[80px] text-center"
                                        />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-border">
                                    {inProgressContracts?.data?.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-6 text-center text-text-desc">
                                                <div className="flex flex-col items-center justify-center gap-1">
                                                    <GitBranch size={16} className="text-text-desc opacity-50" />
                                                    <span className="text-[11px] font-medium text-text-desc">
                                                        Tidak ada pengajuan yang sedang diproses
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        inProgressContracts?.data?.map((c) => (
                                            <tr
                                                key={c.id}
                                                onClick={() => openDetail(c)}
                                                onContextMenu={(e) => handleRowContextMenu(c, e)}
                                                className="group hover:bg-surface-muted/20 transition-colors cursor-pointer"
                                            >
                                                <td className="px-3 py-1.5">
                                                    <ContractNoAndTitleCell c={c} types={types as any} />
                                                </td>
                                                <td className="px-3 py-1.5">
                                                    <StatusAndStepCell c={c} />
                                                </td>
                                                <td className="px-3 py-1.5">
                                                    <AssignedPicCell c={c} />
                                                </td>
                                                <td className="px-3 py-1.5">
                                                    <CreatedAtCell c={c} />
                                                </td>
                                                <td className="w-[80px] min-w-[80px] max-w-[80px] px-3 py-1.5 text-center" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center justify-center">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => openDetail(c)}
                                                            className="h-6 w-6 p-0 rounded-[4px] shadow-none cursor-pointer"
                                                            title="Lihat Detail / Status"
                                                        >
                                                            <Eye size={12} />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <PaginationBar
                            paged={inProgressContracts}
                            pageParam="page_progress"
                            onPageChange={handlePageChange}
                        />
                    </div>

                    {/* ========================================================================= */}
                    {/* TABLE 3: DRAFT PENGAJUAN - PALING BAWAH                                   */}
                    {/* ========================================================================= */}
                    <div className="overflow-hidden border border-surface-border rounded-[4px] bg-surface-card">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border bg-surface-muted/30 px-3 py-2">
                            <div className="flex items-center gap-2">
                                <div className="flex size-6 items-center justify-center rounded-[4px] bg-surface-muted text-text-desc">
                                    <FileEdit size={13} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xs font-bold text-text-main">
                                        Draft Pengajuan
                                    </h2>
                                    <span className="rounded-[4px] bg-surface-muted px-1.5 py-0.2 text-[10px] font-extrabold text-text-main">
                                        {draftContracts?.total || 0}
                                    </span>
                                </div>
                            </div>

                            {/* Search bar & See More */}
                            <div className="flex items-center gap-1.5 w-full sm:w-auto">
                                <div className="relative w-full sm:w-56">
                                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-desc opacity-60" />
                                    <input
                                        type="text"
                                        value={searchDraft}
                                        onChange={(e) => setSearchDraft(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit('search_draft', searchDraft)}
                                        placeholder="Cari judul draft..."
                                        className="h-7 w-full rounded-[4px] border border-surface-border bg-surface-base pl-7 pr-6 text-[11px] text-text-main placeholder:text-text-desc outline-none focus:border-primary"
                                    />
                                    {searchDraft && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearchDraft('');
                                                handleSearchSubmit('search_draft', '');
                                            }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-desc hover:text-text-main cursor-pointer"
                                        >
                                            <X size={11} />
                                        </button>
                                    )}
                                </div>
                                <Link
                                    href="/contracts/mine?status=draft"
                                    className="inline-flex h-7 items-center justify-center gap-1 rounded-[4px] border border-surface-border bg-surface-base px-2 text-[11px] font-medium text-text-desc hover:border-primary hover:text-primary transition-colors shrink-0 shadow-none cursor-pointer"
                                    title="Lihat semua draft pengajuan"
                                >
                                    <span>Lihat Semua</span>
                                    <ArrowUpRight size={12} />
                                </Link>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full border-collapse text-left text-[11px]">
                                <thead className="bg-primary dark:bg-zinc-800/90 text-white dark:text-zinc-200">
                                    <tr className="border-b border-primary/20 dark:border-zinc-700/80">
                                        <SortableHeaderCell
                                            title="Judul Dokumen"
                                            columnKey="title"
                                            currentSort={filters.sort_draft || 'updated_at'}
                                            currentDir={filters.dir_draft || 'desc'}
                                            onSort={(col) => handleSort('draft', col)}
                                        />
                                        <SortableHeaderCell
                                            title="Kategori / Tipe"
                                            columnKey="type"
                                            currentSort={filters.sort_draft || 'updated_at'}
                                            currentDir={filters.dir_draft || 'desc'}
                                            onSort={(col) => handleSort('draft', col)}
                                        />
                                        <SortableHeaderCell
                                            title="Terakhir Disimpan"
                                            columnKey="updated_at"
                                            currentSort={filters.sort_draft || 'updated_at'}
                                            currentDir={filters.dir_draft || 'desc'}
                                            onSort={(col) => handleSort('draft', col)}
                                        />
                                        <SortableHeaderCell
                                            title="Aksi"
                                            align="center"
                                            className="w-[80px] min-w-[80px] max-w-[80px] text-center"
                                        />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-border">
                                    {draftContracts?.data?.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-6 text-center text-text-desc">
                                                <div className="flex flex-col items-center justify-center gap-1">
                                                    <FileEdit size={16} className="text-text-desc opacity-50" />
                                                    <span className="text-[11px] font-medium text-text-desc">
                                                        Tidak ada draft pengajuan
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        draftContracts?.data?.map((c) => {
                                            const type = types?.find((t) => t.id === c.contract_type_id);
                                            return (
                                                <tr
                                                    key={c.id}
                                                    onClick={() => openDetail(c)}
                                                    onContextMenu={(e) => handleRowContextMenu(c, e)}
                                                    className="group hover:bg-surface-muted/20 transition-colors cursor-pointer"
                                                >
                                                    <td className="px-3 py-1.5 font-semibold text-text-main">
                                                        <div className="flex items-center gap-1.5">
                                                            <span>{c.title}</span>
                                                            <span className="px-1.5 py-0.2 rounded-[4px] bg-surface-muted text-text-desc text-[9.5px] font-bold">
                                                                Draft
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-1.5 text-text-desc font-medium">
                                                        {type?.name || c.contract_type || '—'}
                                                    </td>
                                                    <td className="px-3 py-1.5">
                                                        <CreatedAtCell c={c} />
                                                    </td>
                                                    <td className="w-[80px] min-w-[80px] max-w-[80px] px-3 py-1.5 text-center" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center justify-center gap-1">
                                                            <Button
                                                                variant="primary"
                                                                size="sm"
                                                                onClick={(e) => openEdit(c, e)}
                                                                className="h-6 w-6 p-0 rounded-[4px] shadow-none cursor-pointer"
                                                                title="Lanjutkan Edit"
                                                            >
                                                                <FileEdit size={12} />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(e) => handleDeleteDraft(c, e)}
                                                                className="h-6 w-6 p-0 text-danger hover:bg-danger/10 cursor-pointer rounded-[4px] shadow-none"
                                                                title="Hapus Draft"
                                                            >
                                                                <Trash2 size={12} />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <PaginationBar
                            paged={draftContracts}
                            pageParam="page_draft"
                            onPageChange={handlePageChange}
                        />
                    </div>
                </div>
            </div>

            {/* Modals */}

            {createOpen && (
                <CreateContractModal
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                    onSubmit={handleCreate}
                    processing={processing}
                    types={types}
                    users={users}
                    departments={departments}
                    divisions={divisions}
                    roles={roles}
                    regions={regions}
                    locations={locations}
                    companyGroups={companyGroups}
                    companies={companies}
                />
            )}

            {editOpen && contractToEdit && (
                <EditContractModal
                    contract={contractToEdit}
                    open={editOpen}
                    onClose={() => {
                        setEditOpen(false);
                        setContractToEdit(null);
                    }}
                    onSubmit={handleUpdate}
                    processing={processing}
                    types={types as any}
                    submissionTypes={submissionTypes}
                    vendors={vendors}
                />
            )}

            {contextMenu && (
                <ContractContextMenu
                    contract={contextMenu.contract}
                    position={contextMenu.position}
                    onClose={() => setContextMenu(null)}
                    onOpenDetail={openDetail}
                    onEdit={openEdit}
                />
            )}
        </>
    );
}

export default function Activity(props: ActivityPageProps) {
    return (
        <ToastProvider>
            <ActivityViewContent {...props} />
        </ToastProvider>
    );
}
