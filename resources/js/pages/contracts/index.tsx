import AgreementView from '@/components/contracts/AgreementView';
import CompareModal from '@/components/contracts/CompareModal';
import CreateContractModal from '@/components/contracts/CreateContractModal';
import FloatingChat from '@/components/contracts/FloatingChat';
import { FormSubmissionTab } from '@/components/contracts/FormSubmissionTab';
import PreviewModal from '@/components/contracts/PreviewModal';
import RejectModal from '@/components/contracts/RejectModal';
import { ToastProvider, useToast } from '@/components/contracts/Toast';
import UploadRevisionModal from '@/components/contracts/UploadRevisionModal';
import { Avatar, StatusBadge } from '@/components/contracts/ui';
import { FilterDialog } from '@/components/ui/FilterDialog';
import { contractApi } from '@/lib/contract-api';
import { cn } from '@/lib/utils';
import { Contract, ContractType, PaginatedData } from '@/types/contracts';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { AlertCircle, Clock, LayoutGrid, User } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import ApprovalSteps from '@/components/contracts/ApprovalSteps';
import ContractAttachments from '@/components/contracts/ContractAttachments';
import ContractChat from '@/components/contracts/ContractChat';
import SendApprovalModal from '@/components/contracts/SendApprovalModal';
import { Column, DataTable } from '@/components/ui/DataTable';
import { usePermissions } from '@/hooks/use-permissions';
import { BreadcrumbItem } from '@/types';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { DashboardMetrics } from '@/components/contracts/DashboardMetrics';
import { ProfileView } from '@/components/contracts/ProfileView';
import { EditContractModal } from '@/components/contracts/EditContractModal';
import { DraftEditableInfoCard } from '@/components/contracts/DraftEditableInfoCard';

type View = 'dashboard' | 'contracts' | 'pending' | 'audit' | 'f1' | 'f2' | 'profile' | 'mine' | 'expiry';

function ProgressCell({ c }: { c: Contract }) {
    const { done, total, pct } = c.progress;
    return (
        <div style={{ padding: '0 12px', minWidth: 80 }}>
            <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 4 }}>
                {done}/{total}
            </div>
            <div style={{ height: 4, background: 'var(--muted)', borderRadius: 99, overflow: 'hidden', width: '100%' }}>
                <div style={{ height: '100%', background: 'var(--primary)', borderRadius: 99, width: `${pct}%` }} />
            </div>
        </div>
    );
}

function ExpiryBadge({ endDate }: { endDate: string | null }) {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0); 
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let color = 'bg-green-500/10 text-green-600 border-green-200';
    let icon = 'fa-circle-check';
    let label = `${diffDays} Hari Lagi`;

    if (diffDays < 0) {
        color = 'bg-red-500/10 text-red-600 border-red-200';
        icon = 'fa-circle-exclamation';
        label = `Expired ${Math.abs(diffDays)} Hari`;
    } else if (diffDays <= 30) {
        color = 'bg-red-500/10 text-red-600 border-red-200';
        icon = 'fa-triangle-exclamation';
    } else if (diffDays <= 90) {
        color = 'bg-amber-500/10 text-amber-600 border-amber-200';
        icon = 'fa-clock';
    }

    return (
        <div className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase', color)}>
            <i className={cn('fa-solid', icon)} />
            {label}
        </div>
    );
}

const SLACountdown = ({ deadline, status }: { deadline: string | null; status: string }) => {
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [urgency, setUrgency] = useState<'normal' | 'warning' | 'danger'>('normal');

    useEffect(() => {
        if (!deadline || status === 'archived' || status === 'approved') {
            setTimeLeft('-');
            return;
        }

        const tick = () => {
            const now = new Date().getTime();
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

    if (!deadline || status === 'archived' || status === 'approved') return <span className="text-muted-foreground text-[10px]">—</span>;

    return (
        <div
            className={cn(
                'flex w-fit items-center gap-1.5 rounded-md px-2 py-0.5 font-mono text-[10px] font-bold tracking-tight ring-1',
                urgency === 'danger'
                    ? 'animate-pulse bg-rose-50 text-rose-600 ring-rose-200'
                    : urgency === 'warning'
                      ? 'bg-amber-50 text-amber-600 ring-amber-200'
                      : 'bg-emerald-50 text-emerald-600 ring-emerald-200',
            )}
        >
            <Clock size={10} className={urgency === 'danger' ? 'animate-spin-slow' : ''} />
            {timeLeft}
        </div>
    );
};

function ContractPage({
    contracts: contractsPaged,
    meId,
    meUser,
    initialSelected,
    types,
    currentView,
    metrics,
    filters,
    formTemplates = [],
    users = [],
}: {
    contracts: PaginatedData<Contract>;
    meId: string;
    meUser: any;
    initialSelected?: Contract | null;
    types: ContractType[];
    currentView: View;
    metrics: any;
    filters: { search?: string; status?: string; contract_type_id?: string; per_page?: number };
    formTemplates?: any[];
    users?: any[];
}) {
    const contracts = contractsPaged.data;
    const { showToast } = useToast();
    const { canUpdate } = usePermissions('CONTRACTS');
    const [view, setView] = useState<View>(currentView);

    useEffect(() => {
        if (currentView && currentView !== view) {
            setView(currentView);
            // Only clear selection if we're not explicitly trying to show a contract (from /contracts/{id})
            if (!initialSelected) {
                setSelected(null);
            }
        }
    }, [currentView, view, initialSelected]);

    const [selected, setSelected] = useState<Contract | null>(initialSelected ?? null);
    
    // Sync state when initialSelected prop changes (Inertia updates)
    useEffect(() => {
        if (initialSelected) {
            setSelected(initialSelected);
        }
    }, [initialSelected]);

    const [detailTab, setDetailTab] = useState<'form_template' | 'f2' | 'agreement' | 'attachments' | 'audit' | 'chat'>('form_template');
    const [search, setSearch] = useState(filters?.search || '');
    const [statusFilter, setStatusFilter] = useState<string[]>(
        Array.isArray(filters?.status) ? filters.status : filters?.status && filters.status !== 'all' ? [filters.status] : [],
    );
    const [typeFilter, setTypeFilter] = useState<string[]>(
        Array.isArray(filters?.contract_type_id) ? filters.contract_type_id : filters?.contract_type_id && filters.contract_type_id !== 'all' ? [filters.contract_type_id] : [],
    );
    const [approvalNote, setApprovalNote] = useState('');
    const [filterOpen, setFilterOpen] = useState(false);

    const handleFilterChange = useCallback((newFilters: any) => {
        const merged = {
            search: newFilters.search !== undefined ? newFilters.search : search,
            status: newFilters.status !== undefined ? newFilters.status : statusFilter,
            contract_type_id: newFilters.contract_type_id !== undefined ? newFilters.contract_type_id : typeFilter,
        };
        const query = Object.fromEntries(Object.entries(merged).filter(([_, v]) => v !== undefined && v !== '' && (Array.isArray(v) ? v.length > 0 : true)));
        router.get(window.location.pathname, query, { preserveState: true, preserveScroll: true, replace: true } as any);
    }, [search, statusFilter, typeFilter]);

    useEffect(() => {
        if (search === (filters?.search || '')) return;
        const timer = setTimeout(() => handleFilterChange({ search }), 500);
        return () => clearTimeout(timer);
    }, [search, handleFilterChange, filters?.search]);

    const [createOpen, setCreateOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [sendOpen, setSendOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewTitle, setPreviewTitle] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const [previewHasFile, setPreviewHasFile] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    const columns = useMemo<Column<Contract>[]>(() => {
        const baseColumns: Column<Contract>[] = [
            { header: 'No. Kontrak', accessorKey: 'contract_no', sortable: true, className: 'font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground' },
            { header: 'Judul Kontrak', accessorKey: 'title', sortable: true, cell: (c) => (<div className="flex flex-col"><span className="text-foreground line-clamp-1 font-bold">{c.title}</span><span className="text-muted-foreground text-[10px] font-medium tracking-tight uppercase">{c.contract_type}</span></div>) },
            { header: 'Dibuat Oleh', accessorKey: 'creator.name', cell: (c) => (<div className="flex items-center gap-2"><Avatar user={c.creator} size="sm" /><span className="text-foreground/80 text-[12px] font-medium">{c.creator?.name}</span></div>) },
            { header: 'Status', accessorKey: 'status', cell: (c) => <StatusBadge status={c.status} /> },
            { header: 'Versi', accessorKey: 'current_version', cell: (c) => (<span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase">v{c.current_version}</span>) },
            { header: 'Progress', accessorKey: 'progress.pct', cell: (c) => <ProgressCell c={c} /> },
            { header: 'Fase', accessorKey: 'workflow_phase', cell: (c) => (<div className="flex flex-col gap-1"><span className={cn('w-fit rounded-full px-1.5 py-0.5 text-[9px] font-black tracking-widest uppercase', c.workflow_phase === 'Drafting' ? 'bg-sky-100 text-sky-700' : 'bg-indigo-100 text-indigo-700')}>{c.workflow_phase}</span></div>) },
            { header: 'SLA Sisa', accessorKey: 'sla_deadline', cell: (c) => <SLACountdown deadline={c.sla_deadline ?? null} status={c.status} /> },
        ];
        if (view === 'expiry') baseColumns.push({ header: 'Masa Berlaku', accessorKey: 'end_date', cell: (c) => <ExpiryBadge endDate={c.end_date} /> });
        baseColumns.push({ header: 'Tgl Dibuat', accessorKey: 'created_at', className: 'text-muted-foreground text-[11px] font-medium', cell: (c) => c.created_at });
        return baseColumns;
    }, [view]);

    const renderRowActions = useCallback((c: Contract) => (
        <button onClick={(e) => { e.stopPropagation(); openDetail(c); }} className="hover:text-primary hover:border-primary/30 border-border bg-card text-muted-foreground flex h-8 w-8 items-center justify-center rounded-lg border shadow-sm transition-all active:scale-95" title="Lihat Detail">
            <i className="fa-solid fa-eye text-[11px]" />
        </button>
    ), []);

    const updateContract = useCallback((c: Contract) => {
        router.reload({ preserveScroll: true, preserveState: true } as any);
        if (selected?.id === c.id) setSelected(c);
    }, [selected?.id]);

    const openDetail = (c: Contract) => {
        setSelected(c);
        router.get(route('contracts.show', c.id), {}, { preserveState: true, preserveScroll: true });
        setDetailTab('form_template');
        setApprovalNote('');
    };

    const closeDetail = () => {
        setSelected(null);
        router.get(route('contracts'), {}, { preserveState: true, preserveScroll: true });
        setDetailTab('form_template');
    };

    const pendingApprovalForMe = selected?.approvals.find((a) => a.status === 'pending' && a.user_id === meId);
    const firstPending = selected?.approvals.find((a) => a.status === 'pending');
    const hasAnyPending = !!firstPending;
    const canApprove = (selected?.status === 'in_review' || selected?.status === 'revision') && !!pendingApprovalForMe;

    const handleCreate = async (fd: FormData) => {
        try { await contractApi.create(fd); router.reload({ preserveScroll: true } as any); showToast('Kontrak berhasil dibuat!', 'success'); } 
        catch (err: any) { showToast(err.response?.data?.message || 'Gagal membuat kontrak.', 'danger'); }
    };

    const handleApprove = async () => {
        if (!selected) return;
        try { const c = await contractApi.approve(selected.id, approvalNote); updateContract(c); setApprovalNote(''); showToast('Kontrak berhasil disetujui!', 'success'); } 
        catch { showToast('Gagal approve.', 'danger'); }
    };

    const handleReject = async (reason: string) => {
        if (!selected) return;
        try { const c = await contractApi.reject(selected.id, reason); updateContract(c); showToast('Kontrak ditolak.', 'info'); } 
        catch { showToast('Gagal reject.', 'danger'); }
    };

    const handleUpdate = async (data: any) => {
        if (!selected) return;
        setProcessing(true);
        try { const c = await contractApi.update(selected.id, data); updateContract(c); setEditOpen(false); showToast('Informasi kontrak diperbarui.', 'success'); } 
        catch { showToast('Gagal memperbarui kontrak.', 'danger'); } 
        finally { setProcessing(false); }
    };

    const handleDelete = async () => {
        if (!selected) return;
        setProcessing(true);
        try { await contractApi.delete(selected.id); router.reload({ preserveScroll: true } as any); setSelected(null); setDeleteOpen(false); showToast('Kontrak berhasil dihapus.', 'success'); } 
        catch { showToast('Gagal menghapus kontrak.', 'danger'); } 
        finally { setProcessing(false); }
    };

    const handleSendSubmit = async (data: any) => {
        if (!selected) return;
        try { const c = await contractApi.send(selected.id, data); updateContract(c); showToast('Kontrak berhasil dikirim untuk approval!', 'success'); } 
        catch (err: any) { showToast(err.response?.data?.message || 'Gagal mengirim kontrak.', 'danger'); }
    };

    return (
        <>
            <Head title={currentView} />
            <div className="bg-background/50 flex min-h-0 flex-1 flex-col gap-6 p-6">
                {selected ? (
                    <div className="flex flex-1 flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <button onClick={closeDetail} className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm font-bold uppercase transition-colors">
                                <i className="fa-solid fa-arrow-left" /> Kembali
                            </button>
                            <div className="flex items-center gap-3">
                                {canUpdate && selected.status === 'draft' && (
                                    <button onClick={() => setEditOpen(true)} className="bg-card border-border hover:bg-muted inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-bold transition-all active:scale-95">
                                        <i className="fa-solid fa-pen-to-square" /> Edit Kontrak
                                    </button>
                                )}
                                {selected.status === 'draft' && selected.versions?.length > 0 && (
                                    <button onClick={() => setSendOpen(true)} className="bg-primary text-primary-foreground shadow-primary/20 hover:shadow-primary/30 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold shadow-md transition-all active:scale-95">
                                        <i className="fa-solid fa-paper-plane" /> Kirim Approval
                                    </button>
                                )}
                                <button onClick={() => setDeleteOpen(true)} className="hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 border-border bg-card text-muted-foreground inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-all active:scale-95">
                                    <i className="fa-solid fa-trash-can" />
                                </button>
                            </div>
                        </div>

                        <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
                            <div className="flex flex-col gap-6">
                                <div className="bg-card border-border overflow-hidden rounded-xl border shadow-sm">
                                    <div className="border-border/50 flex flex-wrap border-b bg-slate-50/50 p-1">
                                        <button onClick={() => setDetailTab('form_template')} className={cn('px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-md', detailTab === 'form_template' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:bg-white/50')}>
                                            Formulir F1
                                        </button>
                                        <button onClick={() => setDetailTab('f2')} className={cn('px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-md', detailTab === 'f2' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:bg-white/50')}>
                                            Formulir F2
                                        </button>
                                        <button onClick={() => setDetailTab('agreement')} className={cn('px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-md', detailTab === 'agreement' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:bg-white/50')}>
                                            Agreement
                                        </button>
                                        <button onClick={() => setDetailTab('attachments')} className={cn('px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-md', detailTab === 'attachments' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:bg-white/50')}>
                                            Lampiran
                                        </button>
                                        <button onClick={() => setDetailTab('audit')} className={cn('px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-md', detailTab === 'audit' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:bg-white/50')}>
                                            Audit Trail
                                        </button>
                                        <button onClick={() => setDetailTab('chat')} className={cn('px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-md', detailTab === 'chat' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:bg-white/50')}>
                                            Chat
                                        </button>
                                    </div>
                                    <div className="p-6">
                                        {detailTab === 'form_template' && <FormSubmissionTab docType="f1" selected={selected} formTemplates={formTemplates} onContractUpdated={updateContract} />}
                                        {detailTab === 'f2' && <FormSubmissionTab docType="f2" selected={selected} formTemplates={formTemplates} onContractUpdated={updateContract} />}
                                        {detailTab === 'agreement' && <AgreementView contract={selected} onUpdate={updateContract} />}
                                        {detailTab === 'attachments' && <ContractAttachments contract={selected} onUpdated={updateContract} showToast={showToast} onPreview={(at) => { setPreviewTitle(at.label); setPreviewUrl(contractApi.attachmentDownloadUrl(selected.id, at.id)); setPreviewHasFile(true); setPreviewOpen(true); }} />}
                                        {detailTab === 'audit' && (
                                            <div className="flex flex-col gap-4">
                                                {(selected as any).history?.map((h: any) => (
                                                    <div key={h.id} className="flex gap-4">
                                                        <div className="w-1 h-1 rounded-full mt-1.5" style={{ background: 'var(--primary)' }} />
                                                        <div>
                                                            <div className="text-foreground font-medium text-sm">{h.description}</div>
                                                            <div className="text-muted-foreground text-xs mt-1">{h.actor?.name} · {h.created_at}</div>
                                                        </div>
                                                    </div>
                                                )) || <div className="text-center text-muted-foreground text-xs py-8">Belum ada riwayat audit.</div>}
                                            </div>
                                        )}
                                        {detailTab === 'chat' && <ContractChat contract={selected} meId={meId} onNewMessage={updateContract} />}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-6">
                                <DraftEditableInfoCard selected={selected} types={types} formTemplates={formTemplates} canUpdate={!!canUpdate} onUpdate={handleUpdate} processing={processing} setPreviewTitle={setPreviewTitle} setPreviewUrl={setPreviewUrl} setPreviewHasFile={setPreviewHasFile} setPreviewOpen={setPreviewOpen} />
                                <div className="bg-card border-border overflow-hidden rounded-xl border shadow-sm">
                                    <div className="border-border/50 flex items-center gap-2 border-b p-4 font-bold text-xs uppercase tracking-widest bg-slate-50/50"><i className="fa-solid fa-arrow-right-arrow-left" /> Alur Approval</div>
                                    <div className="p-4"><ApprovalSteps approvals={selected.approvals} creator={selected.creator} submittedAt={selected.submitted_at ?? undefined} /></div>
                                </div>
                                {hasAnyPending && (
                                    <div className="bg-card border-border overflow-hidden rounded-xl border shadow-sm">
                                        <div className="border-border/50 flex items-center gap-2 border-b p-4 font-bold text-xs uppercase tracking-widest bg-slate-50/50"><i className="fa-solid fa-bolt" /> Aksi Approval</div>
                                        <div className="p-4">
                                            {canApprove ? (
                                                <div className="flex flex-col gap-4">
                                                    <textarea value={approvalNote} onChange={(e) => setApprovalNote(e.target.value)} rows={3} placeholder="Tambahkan catatan..." className="w-full text-sm border-border bg-slate-50/50 rounded-lg p-3 outline-none focus:border-primary/50 transition-all resize-none" />
                                                    <div className="flex gap-2">
                                                        <button onClick={handleApprove} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-xs font-bold shadow-md active:scale-95 transition-all"><i className="fa-solid fa-check" /> Setujui</button>
                                                        <button onClick={() => setRejectOpen(true)} className="flex-1 bg-rose-600 text-white rounded-lg py-2 text-xs font-bold shadow-md active:scale-95 transition-all"><i className="fa-solid fa-xmark" /> Tolak</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center p-4 border border-dashed border-border rounded-lg bg-slate-50/30">
                                                    <p className="text-muted-foreground text-xs">Menunggu approval dari <br/><span className="font-bold text-foreground">{firstPending?.approver?.name || firstPending?.approver_name}</span></p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {view === 'dashboard' && <DashboardMetrics metrics={metrics} />}
                        {view === 'profile' && <ProfileView meUser={meUser} showToast={showToast} />}
                        {view !== 'profile' && (
                            <div className="flex flex-col gap-4">
                                <DataTable 
                                    columns={columns} 
                                    data={contracts} 
                                    onRowClick={openDetail} 
                                    rowActions={renderRowActions}
                                    searchKey="title"
                                    searchPlaceholder="Cari kontrak..."
                                    searchValue={search}
                                    onSearchChange={setSearch}
                                    headerActions={
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => setFilterOpen(true)} className="bg-card border-border hover:bg-muted relative flex h-9 w-9 items-center justify-center rounded-lg border transition-all active:scale-95">
                                                <i className="fa-solid fa-filter text-xs" />
                                                {(statusFilter.length > 0 || typeFilter.length > 0) && <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] font-black text-white">!</span>}
                                            </button>
                                            <button onClick={() => setCreateOpen(true)} className="bg-primary text-primary-foreground shadow-primary/20 hover:shadow-primary/30 flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-black uppercase shadow-lg transition-all active:scale-95">
                                                <i className="fa-solid fa-plus" /> Kontrak Baru
                                            </button>
                                        </div>
                                    }
                                    pagination={{
                                        currentPage: contractsPaged.current_page,
                                        lastPage: contractsPaged.last_page,
                                        total: contractsPaged.total,
                                        from: contractsPaged.from,
                                        to: contractsPaged.to,
                                        perPage: contractsPaged.per_page,
                                        onPageChange: (page) => router.get(window.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                                        onPerPageChange: (pp) => router.get(window.location.pathname, { ...filters, per_page: pp, page: 1 }, { preserveState: true, preserveScroll: true }),
                                    }}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            <CreateContractModal open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={handleCreate} types={types} users={users} />
            <RejectModal open={rejectOpen} onClose={() => setRejectOpen(false)} onSubmit={handleReject} />
            <SendApprovalModal open={sendOpen} onClose={() => setSendOpen(false)} onSubmit={handleSendSubmit} contractType={selected?.contract_type ?? undefined} />
            <EditContractModal open={editOpen} onClose={() => setEditOpen(false)} onSubmit={handleUpdate} contract={selected} types={types} processing={processing} />
            <FilterDialog open={filterOpen} onOpenChange={setFilterOpen} types={types} activeFilters={{ status: statusFilter, contract_type_id: typeFilter }} onFilterChange={(fs) => { if (fs.status) setStatusFilter(fs.status); if (fs.contract_type_id) setTypeFilter(fs.contract_type_id); handleFilterChange(fs); }} onClearAll={() => { setStatusFilter([]); setTypeFilter([]); handleFilterChange({ status: [], contract_type_id: [] }); }} />
            <ConfirmationModal open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete} title="Hapus Kontrak?" description="Seluruh data dokumen, riwayat, dan chat terkait kontrak ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan." processing={processing} />
            <PreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} title={previewTitle} url={previewUrl} hasFile={previewHasFile} />
            <FloatingChat contracts={contracts} meId={meId} onContractUpdated={updateContract} />
        </>
    );
}

export default function ContractsIndex({
    currentView = 'dashboard',
    contracts: initialContractsPaged = { data: [], links: [], current_page: 1, last_page: 1, total: 0, from: 0, to: 0, per_page: 10 } as any,
    types: initialTypes = [],
    formTemplates: initialFormTemplates = [],
    metrics: initialMetrics = null,
    initialSelected: initialSelectedProp = null,
    filters = {},
    users = [],
}: any) {
    const { auth, contractId: initialId } = usePage<{ auth: { user: any }; contractId?: string }>().props;
    const meId = auth?.user?.id ?? '';
    const meUser = auth?.user ?? null;
    const [contractsPaged, setContractsPaged] = useState<PaginatedData<Contract>>(initialContractsPaged);
    const [types, setTypes] = useState<ContractType[]>(initialTypes);
    const [bootLoading, setBootLoading] = useState(initialContractsPaged.data.length === 0 && !initialMetrics && !initialSelectedProp);
    const [initialSelected, setInitialSelected] = useState<Contract | null>(initialSelectedProp);
    const [metrics, setMetrics] = useState<any>(initialMetrics);

    // Sync state when props change (for navigation between views)
    useEffect(() => {
        if (initialSelectedProp) {
            setInitialSelected(initialSelectedProp);
        }
    }, [initialSelectedProp]);

    useEffect(() => {
        if (initialContractsPaged.data.length > 0 || currentView === 'pending' || currentView === 'mine') {
            setContractsPaged(initialContractsPaged);
        }
    }, [initialContractsPaged, currentView]);

    useEffect(() => {
        const hasInitialData = initialContractsPaged.data.length > 0 || initialContractsPaged.total > 0;
        
        if (initialSelectedProp) {
            setInitialSelected(initialSelectedProp);
            setBootLoading(false);
            if (hasInitialData && initialTypes.length > 0) return;
        } else if (initialId && hasInitialData) {
            const found = initialContractsPaged.data.find((c: Contract) => c.id === initialId);
            if (found) {
                setInitialSelected(found);
                setBootLoading(false);
                if (initialTypes.length > 0) return;
            }
        } else if (hasInitialData && initialTypes.length > 0) {
            setBootLoading(false);
            return;
        }

        setBootLoading(true);
        Promise.all([
            contractApi.list({ view: currentView }),
            contractApi.getTypes(),
            axios.post('/admin/api/reports/data', {}).then((res) => res.data).catch(() => null),
        ]).then(([cData, tData, mData]) => {
            setContractsPaged(cData as any);
            setTypes(tData);
            setMetrics(mData);
            
            if (initialSelectedProp) {
                setInitialSelected(initialSelectedProp);
            } else if (initialId) {
                setInitialSelected(cData.data.find((c: Contract) => c.id === initialId) ?? null);
            }
            
            setBootLoading(false);
        }).catch(() => setBootLoading(false));
    }, [initialContractsPaged, initialTypes, initialId, currentView, initialSelectedProp]);

    return (
        <>
            <Head title="Contract Manager" />
            <ToastProvider>
                {bootLoading ? (
                    <div className="flex h-screen items-center justify-center text-muted-foreground">
                        <i className="fa-solid fa-spinner fa-spin mr-3 text-3xl text-primary" />
                        <span>Memuat data kontrak...</span>
                    </div>
                ) : (
                    <ContractPage contracts={contractsPaged} meId={meId} meUser={meUser} initialSelected={initialSelected} types={types} formTemplates={initialFormTemplates} currentView={currentView} metrics={metrics} filters={filters} users={users} />
                )}
            </ToastProvider>
        </>
    );
}
