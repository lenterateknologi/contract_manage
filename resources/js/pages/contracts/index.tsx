import CreateContractModal from '@/components/contracts/CreateContractModal';
import PreviewModal from '@/components/contracts/PreviewModal';
// No RejectModal import needed
import { ToastProvider, useToast } from '@/components/contracts/Toast';
import { Button } from '@/components/ui/base/Button';
import { FilterSheet } from '@/components/ui/data/FilterSheet';
import { SearchInput } from '@/components/ui/forms/SearchInput';
import { LayoutToggle, LayoutType } from '@/components/ui/navigation/LayoutToggle';
import { contractApi } from '@/lib/contract-api';
import { cn } from '@/lib/utils';
import { Contract, ContractType, PaginatedData } from '@/types/contracts';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    AlertCircle,
    AlertTriangle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Download,
    FileType,
    Filter,
    Layers,
    PlusCircle,
    Zap,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { DashboardMetrics } from '@/components/contracts/DashboardMetrics';
import { EditContractModal } from '@/components/contracts/EditContractModal';
import { ProfileView } from '@/components/contracts/ProfileView';
import SendApprovalModal from '@/components/contracts/SendApprovalModal';
import { Column, TableContract } from '@/components/ui/data/TableContract';
import LoadingLottie from '@/components/ui/feedback/LoadingLottie';
import { ConfirmationModal } from '@/components/ui/overlays/ConfirmationModal';
import { usePermissions } from '@/hooks/use-permissions';

import ContractDetailView from './components/ContractDetailView';
const ensureArray = (val: any): any[] => {
    if (Array.isArray(val)) return val;
    return val ? [val] : [];
};

type View = 'dashboard' | 'contracts' | 'pending' | 'audit' | 'f1' | 'f2' | 'profile' | 'mine' | 'expiry';

import {
    BulkActions,
    renderAssignedBy,
    renderAssignedPic,
    renderContractNoAndTitle,
    renderCreatedAt,
    renderInitiator,
    renderStatusAndStep,
    RowActions,
    SLACountdown,
    StatusBadge,
    TypeAndVendorCell,
} from './components/ContractTableCells';

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
    const [filterOpen, setFilterOpen] = useState(false);
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

    useEffect(() => {
        if (currentView && currentView !== view) setView(currentView);
    }, [currentView, view]);

    useEffect(() => {
        setSelected(initialSelected ?? null);
    }, [initialSelected]);

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

    const updateContract = useCallback(
        (c: Contract, silent = false) => {
            if (!silent) router.reload({ preserveScroll: true, preserveState: true } as any);
            if (selected?.id === c.id) setSelected(c);
        },
        [selected?.id],
    );

    const openDetail = (c: Contract) => {
        setSelected(c);
        router.get(route('contracts.show', c.id), {}, { preserveState: true, preserveScroll: true });
    };

    const closeDetail = () => {
        setSelected(null);
        router.get(route('contracts'), {}, { preserveState: true, preserveScroll: true });
    };

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

    const canBulkApprove = !!meUser?.is_admin;
    const canBulkDelete = !!meUser?.is_admin;

    const handleBulkApprove = async (rows: Contract[]) => {
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
    };

    const handleBulkDelete = async (rows: Contract[]) => {
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
    };

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

    const renderRowActions = useCallback(
        (row: Contract) => (
            <RowActions c={row} openDetail={openDetail} setSelected={setSelected} setEditOpen={setEditOpen} setDeleteOpen={setDeleteOpen} />
        ),
        [openDetail, setSelected, setEditOpen, setDeleteOpen],
    );

    const renderTypeAndVendor = useCallback((c: Contract) => <TypeAndVendorCell c={c} types={types} />, [types]);

    const columns: Column<Contract>[] = useMemo(
        () => [
            {
                accessorKey: 'contract_no_title',
                header: 'No. & Judul Kontrak',
                cell: renderContractNoAndTitle,
            },
            {
                accessorKey: 'contract_type_id',
                header: 'Tipe & Vendor',
                cell: renderTypeAndVendor,
            },
            {
                accessorKey: 'initiator',
                header: 'Pembuat',
                cell: renderInitiator,
            },
            {
                accessorKey: 'status',
                header: 'Status & Step',
                cell: renderStatusAndStep,
            },
            {
                accessorKey: 'assigned_by',
                header: 'Disetujui Oleh',
                cell: renderAssignedBy,
            },
            {
                accessorKey: 'assigned_pic',
                header: 'Ditugaskan',
                cell: renderAssignedPic,
            },
            {
                accessorKey: 'created_at',
                header: 'Dibuat',
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
                            setSendOpen={setSendOpen}
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
                                <div className="border-sidebar-border bg-sidebar flex min-h-0 flex-1 flex-col gap-0 overflow-hidden">
                                    {/* Unified Toolbar — Identical for both modes */}
                                    <div className="border-sidebar-border bg-background sticky top-0 z-20 flex items-center gap-6 border-b px-5 py-4">
                                        <SearchInput
                                            containerClassName="max-w-sm flex-1"
                                            placeholder="Cari kontrak..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />

                                        <div className="ml-auto flex items-center gap-2">
                                            <LayoutToggle value={layout as LayoutType} onChange={(val) => setLayout(val)} />

                                            <Button
                                                variant="outline"
                                                onClick={() => setFilterOpen(true)}
                                                className={cn(
                                                    'relative h-10 px-4 transition-all active:scale-95',
                                                    activeFiltersCount > 0 && 'border-[var(--primary)] bg-[var(--primary)] text-white',
                                                )}
                                            >
                                                <Filter size={14} />
                                                Filter
                                                {activeFiltersCount > 0 && (
                                                    <span
                                                        className={cn(
                                                            'ml-1 flex h-4 min-w-[16px] items-center justify-center rounded-md px-1 text-[9px] font-bold',
                                                            filters.status?.length || filters.contract_type_id?.length
                                                                ? 'bg-white text-[var(--primary)]'
                                                                : 'bg-[var(--primary)] text-white',
                                                        )}
                                                    >
                                                        {activeFiltersCount}
                                                    </span>
                                                )}
                                            </Button>
                                            <Button variant="primary" onClick={() => setCreateOpen(true)} className="h-10 px-6 active:scale-95">
                                                <PlusCircle size={16} /> Kontrak Baru
                                            </Button>
                                        </div>
                                    </div>

                                    <div className={cn('flex-1 overflow-auto', layout === 'grid' && 'p-4')}>
                                        {layout === 'table' ? (
                                            <TableContract
                                                columns={columns}
                                                data={contractsPaged.data}
                                                loading={processing}
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
                                        ) : (
                                            <div className="flex flex-col gap-8">
                                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                                    {contractsPaged.data.map((c) => (
                                                        <button
                                                            key={c.id}
                                                            onClick={() => openDetail(c)}
                                                            className="group border-sidebar-border bg-sidebar hover:border-sidebar-primary hover:shadow-sidebar-primary/10 dark:hover:bg-sidebar-accent/10 relative flex cursor-pointer flex-col gap-4 rounded-xl border p-5 text-left transition-all hover:shadow-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none"
                                                        >
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="flex min-w-0 flex-col gap-1">
                                                                    <span className="group-hover:text-sidebar-primary text-xs font-medium text-black/40 transition-all dark:text-white/40">
                                                                        {c.contract_no || 'No Req'}
                                                                    </span>
                                                                    <h3 className="group-hover:text-sidebar-primary line-clamp-2 text-sm leading-tight font-semibold text-black transition-colors dark:text-white">
                                                                        {c.title}
                                                                    </h3>
                                                                    <span className="mt-0.5 text-xs font-medium text-black/30 dark:text-white/30">
                                                                        {c.contract_type}
                                                                    </span>
                                                                </div>
                                                                <div className="flex-shrink-0 origin-top-right scale-90">
                                                                    <StatusBadge status={c.status} />
                                                                </div>
                                                            </div>

                                                            <div className="border-sidebar-border/50 bg-sidebar-accent/30 dark:bg-sidebar-accent/10 group-hover:border-sidebar-primary/20 flex flex-col gap-3 rounded-lg border p-3 transition-all">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-xs font-medium text-black/40 dark:text-white/40">
                                                                        Departemen
                                                                    </span>
                                                                    <span className="truncate text-xs font-semibold text-black dark:text-white">
                                                                        {c.initiator?.department_name || 'Umum'}
                                                                    </span>
                                                                </div>
                                                                {c.assigned_pic && (
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-xs font-medium text-black/40 dark:text-white/40">
                                                                            PJ Legal
                                                                        </span>
                                                                        <span className="truncate text-xs font-semibold text-black dark:text-white">
                                                                            {c.assigned_pic.name}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center justify-between pt-1 text-xs font-medium">
                                                                    <span className="text-black/40 dark:text-white/40">Progress</span>
                                                                    <span className="font-semibold text-black dark:text-white">
                                                                        {c.progress.done}/{c.progress.total}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="border-sidebar-border/50 mt-auto flex items-center justify-end border-t pt-4">
                                                                <div className="origin-right scale-75">
                                                                    <SLACountdown deadline={c.sla_deadline ?? null} status={c.status} />
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>

                                                <div className="mt-8 mb-10 flex w-full items-center justify-between">
                                                    <div className="flex items-center gap-4 rounded-xl border border-[#0f2a4a]/10 bg-[#0f2a4a]/[0.03] px-6 py-2 shadow-sm transition-all duration-500 dark:border-white/10 dark:bg-white/[0.03]">
                                                        <div className="flex items-center gap-4 text-xs font-semibold whitespace-nowrap text-slate-700 dark:text-slate-300">
                                                            <span className="hidden sm:inline">Menampilkan</span>
                                                            <span>
                                                                {contractsPaged.from} - {contractsPaged.to} / {contractsPaged.total}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1 shadow-sm transition-all duration-500 dark:border-white/10 dark:bg-white/[0.03]">
                                                        <button
                                                            disabled={contractsPaged.current_page === 1}
                                                            onClick={() =>
                                                                router.get(
                                                                    globalThis.location.pathname,
                                                                    { ...filters, page: contractsPaged.current_page - 1 },
                                                                    { preserveState: true },
                                                                )
                                                            }
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-all hover:bg-slate-100 disabled:opacity-20 dark:text-white/60 dark:hover:bg-white/10"
                                                        >
                                                            <ChevronLeft className="h-4 w-4" />
                                                        </button>

                                                        <div className="mx-1 flex items-center gap-1">
                                                            <div className="flex h-8 min-w-[32px] items-center justify-center rounded-lg bg-[#0f2a4a] px-3 text-xs font-bold text-white shadow-sm">
                                                                {contractsPaged.current_page}
                                                            </div>
                                                            <span className="mx-1 text-xs font-medium text-slate-400">/</span>
                                                            <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                                                {contractsPaged.last_page}
                                                            </div>
                                                        </div>

                                                        <button
                                                            disabled={contractsPaged.current_page === contractsPaged.last_page}
                                                            onClick={() =>
                                                                router.get(
                                                                    globalThis.location.pathname,
                                                                    { ...filters, page: contractsPaged.current_page + 1 },
                                                                    { preserveState: true },
                                                                )
                                                            }
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#0f2a4a]/60 transition-all hover:bg-[#0f2a4a]/5 disabled:opacity-20 dark:text-white/60 dark:hover:bg-white/10"
                                                        >
                                                            <ChevronRight className="h-4 w-4" />
                                                        </button>
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

            <CreateContractModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onSubmit={handleCreate}
                types={types}
                submissionTypes={submissionTypes}
                users={users}
                vendors={vendors}
            />
            {/* RejectModal was here */}
            <SendApprovalModal
                open={sendOpen}
                onClose={() => setSendOpen(false)}
                onSubmit={handleSendSubmit}
                contractType={selected?.contract_type ?? undefined}
                users={users}
            />
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
            <FilterSheet
                isOpen={filterOpen}
                onOpenChange={setFilterOpen}
                title="Filter Kontrak"
                description="Saring data kontrak berdasarkan status dan tipe dokumen"
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
                            { label: 'Draft', value: 'draft', icon: Layers, color: 'bg-slate-50 text-slate-400' },
                            { label: 'Pending', value: 'pending', icon: Clock, color: 'bg-black/5 text-black' },
                            { label: 'In Review', value: 'in_review', icon: Zap, color: 'bg-black/5 text-black' },
                            { label: 'Revision', value: 'revision', icon: AlertTriangle, color: 'bg-black/5 text-black' },
                            { label: 'Approved', value: 'approved', icon: CheckCircle2, color: 'bg-black text-white' },
                            { label: 'Rejected', value: 'rejected', icon: AlertCircle, color: 'bg-black/5 text-black' },
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
            />
            <ConfirmationModal
                open={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                onConfirm={handleDelete}
                title="Hapus Kontrak?"
                description="Seluruh data dokumen, riwayat, dan chat terkait kontrak ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan."
                processing={processing}
            />
            <PreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} title={previewTitle} url={previewUrl} hasFile={previewHasFile} />
            {timelinePdfPreviewUrl && (
                <div className="bg-background/90 animate-in fade-in zoom-in-95 fixed inset-0 z-[100] flex flex-col backdrop-blur-xl duration-300">
                    <div className="border-border flex h-16 items-center justify-between border-b bg-slate-50 px-6">
                        <div className="flex flex-col">
                            <h3 className="text-foreground flex items-center gap-2 text-sm font-bold uppercase">
                                <i className="fa-solid fa-file-pdf text-black dark:text-white" /> Export Alur Approval
                            </h3>
                            <span className="text-muted-foreground text-[10px] font-bold">{selected?.contract_no} — Generation Complete</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <a
                                href={timelinePdfPreviewUrl}
                                download={`Alur_Approval_${selected?.id}.pdf`}
                                className="flex items-center gap-2 rounded-md bg-indigo-600 px-6 py-2 text-xs font-bold text-white uppercase shadow-xl shadow-indigo-500/20 transition-all hover:bg-indigo-700"
                            >
                                <Download size={14} /> Download PDF
                            </a>
                            <button
                                onClick={() => setTimelinePdfPreviewUrl(null)}
                                className="text-foreground rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase transition-all hover:bg-slate-50"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-1 justify-center overflow-hidden p-8">
                        <div className="ring-border animate-in slide-in-from-bottom-5 fill-mode-both h-full w-full max-w-[210mm] overflow-hidden rounded-sm bg-white shadow-2xl ring-1 delay-150 duration-500">
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

    // Use state to manage current data, but sync with props from Inertia
    const [contractsPaged, setContractsPaged] = useState<PaginatedData<Contract>>(initialContractsPaged);
    const [types, setTypes] = useState<ContractType[]>(initialTypes);
    const [submissionTypes, setSubmissionTypes] = useState<any[]>(initialSubmissionTypes);
    const [metrics, setMetrics] = useState<any>(initialMetrics);

    // Boot loading state: only true if we have NO data AND we are not already showing a specific contract
    const [bootLoading, setBootLoading] = useState(
        initialContractsPaged.data.length === 0 && !initialMetrics && !initialSelectedProp && initialTypes.length === 0,
    );

    // Sync props to state when they change (Inertia partial reloads or navigation)
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

    // Initial data fetch ONLY if props are truly missing and we are on a list view
    useEffect(() => {
        const hasCriticalData = initialContractsPaged.data.length > 0 || initialSelectedProp || initialMetrics;

        if (hasCriticalData && initialTypes.length > 0) {
            setBootLoading(false);
            return;
        }

        // If we really need to fetch (e.g. direct URL visit with partial props)
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
                    .post('/admin/api/reports/data', {})
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
    }, [currentView]); // Only re-run if view changes drastically

    return (
        <>
            <Head title="Contract Manager" />
            <ToastProvider>
                {bootLoading ? (
                    <div className="bg-background flex h-screen flex-col items-center justify-center gap-6">
                        <div className="relative flex items-center justify-center">
                            <LoadingLottie width={180} height={180} />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-slate-800 opacity-20 dark:border-white" />
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <span className="animate-pulse text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                Memuat Sistem Kontrak
                            </span>
                            <div className="h-0.5 w-48 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                                <div className="animate-progress h-full w-full origin-left bg-black dark:bg-white" />
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
