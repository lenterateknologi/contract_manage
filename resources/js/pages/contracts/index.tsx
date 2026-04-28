import AgreementView from '@/components/contracts/AgreementView';
import ContractAuditTrail from '@/components/contracts/ContractAuditTrail';
import CreateContractModal from '@/components/contracts/CreateContractModal';
import FloatingChat from '@/components/contracts/FloatingChat';
import { FormSubmissionTab } from '@/components/contracts/FormSubmissionTab';
import PreviewModal from '@/components/contracts/PreviewModal';
// No RejectModal import needed
import { ToastProvider, useToast } from '@/components/contracts/Toast';
import { StatusBadge } from '@/components/contracts/ui';
import { FilterSheet } from '@/components/ui/FilterSheet';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { contractApi } from '@/lib/contract-api';
import { cn } from '@/lib/utils';
import { Contract, ContractType, PaginatedData } from '@/types/contracts';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    AlertCircle,
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    Clock,
    Eye,
    FileEdit,
    FileType,
    Filter,
    Layers,
    LayoutGrid,
    MoreVertical,
    Search,
    Trash2,
    Zap,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import ApprovalSteps from '@/components/contracts/ApprovalSteps';
import ContractAttachments from '@/components/contracts/ContractAttachments';
import ContractChat from '@/components/contracts/ContractChat';
import { ContractReferenceCard } from '@/components/contracts/ContractReferenceCard';
import { DashboardMetrics } from '@/components/contracts/DashboardMetrics';
import { DraftEditableInfoCard } from '@/components/contracts/DraftEditableInfoCard';
import { EditContractModal } from '@/components/contracts/EditContractModal';
import { ProfileView } from '@/components/contracts/ProfileView';
import SendApprovalModal from '@/components/contracts/SendApprovalModal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Column, DataTable } from '@/components/ui/DataTable';
import { usePermissions } from '@/hooks/use-permissions';

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
    submissionTypes = [],
    currentView,
    metrics,
    filters,
    formTemplates = [],
    users = [],
    vendors = [],
    departments = [],
    roles = [],
}: {
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
    const [approvalNote, setApprovalNote] = useState('');
    const [filterOpen, setFilterOpen] = useState(false);
    const [layout, setLayout] = useState<'table' | 'grid'>('table');

    const handleFilterChange = useCallback(
        (newFilters: any) => {
            const merged = {
                ...filters,
                ...newFilters,
            };
            const query = Object.fromEntries(
                Object.entries(merged).filter(([_, v]) => v !== undefined && v !== '' && (Array.isArray(v) ? v.length > 0 : true)),
            ) as any;
            router.get(window.location.pathname, query, { preserveState: true, preserveScroll: true, replace: true });
        },
        [filters],
    );

    const handleSingleFilterToggle = (key: string, value: any) => {
        const f = filters as any;
        const current: any[] = f[key] ? (Array.isArray(f[key]) ? f[key] : [f[key]]) : [];
        const stringValue = String(value);
        const newValues = current.includes(stringValue) ? current.filter((v: any) => String(v) !== stringValue) : [...current, stringValue];
        handleFilterChange({ [key]: newValues });
    };

    const handleClearAllFilters = () => {
        router.get(window.location.pathname, { view: currentView }, { preserveState: true, preserveScroll: true });
    };

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
            {
                header: 'No. Pengajuan',
                accessorKey: 'contract_no',
                sortable: true,
                className: 'font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground',
            },
            {
                header: 'Judul Kontrak',
                accessorKey: 'title',
                sortable: true,
                cell: (c) => (
                    <div className="flex flex-col">
                        <span className="text-foreground line-clamp-1 font-bold">{c.title}</span>
                        <span className="text-muted-foreground text-[10px] font-medium tracking-tight uppercase">{c.contract_type}</span>
                    </div>
                ),
            },
            {
                header: 'Departemen',
                accessorKey: 'initiator.department_name',
                cell: (c) => (
                    <span className="rounded-md border border-slate-100 bg-slate-50 px-2 py-0.5 text-[10px] font-bold tracking-tight text-slate-500 uppercase">
                        {c.initiator?.department_name || 'UMUM'}
                    </span>
                ),
            },
            { header: 'Status', accessorKey: 'status', cell: (c) => <StatusBadge status={c.status} /> },
            {
                header: 'Versi',
                accessorKey: 'current_version',
                cell: (c) => (
                    <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase">
                        v{c.current_version}
                    </span>
                ),
            },
            { header: 'Progress', accessorKey: 'progress.pct', cell: (c) => <ProgressCell c={c} /> },
            {
                header: 'Masa Berlaku',
                accessorKey: 'end_date',
                cell: (c) => {
                    const formatDate = (dateStr: string | null) => {
                        if (!dateStr) return '—';
                        try {
                            const d = new Date(dateStr);
                            if (isNaN(d.getTime())) return dateStr;
                            return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
                        } catch {
                            return '—';
                        }
                    };
                    return (
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                            <span>{formatDate(c.contract_date)}</span>
                            <ArrowRight size={10} className="text-slate-300" />
                            <span className="font-bold text-slate-800">{formatDate(c.end_date)}</span>
                        </div>
                    );
                },
            },
            { header: 'SLA Sisa', accessorKey: 'sla_deadline', cell: (c) => <SLACountdown deadline={c.sla_deadline ?? null} status={c.status} /> },
        ];
        baseColumns.push({
            header: 'Tgl Dibuat',
            accessorKey: 'created_at',
            className: 'text-muted-foreground text-[10px] font-medium',
            cell: (c) => c.created_at,
        });
        return baseColumns;
    }, [view]);

    const renderRowActions = useCallback(
        (c: Contract) => (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 rounded-lg border border-slate-100 bg-white p-0 hover:bg-slate-50">
                        <MoreVertical size={14} className="text-slate-400" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 rounded-xl border-slate-100 p-1.5 shadow-xl">
                    <DropdownMenuItem
                        onClick={() => openDetail(c)}
                        className="flex cursor-pointer items-center gap-2 rounded-lg text-[11px] font-bold tracking-tight text-slate-600 uppercase"
                    >
                        <Eye size={14} /> Lihat Detail
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => {
                            setSelected(c);
                            setEditOpen(true);
                        }}
                        className="flex cursor-pointer items-center gap-2 rounded-lg text-[11px] font-bold tracking-tight text-slate-600 uppercase"
                    >
                        <FileEdit size={14} /> Perbarui
                    </DropdownMenuItem>
                    <div className="my-1 h-px bg-slate-50" />
                    <DropdownMenuItem
                        onClick={() => {
                            setSelected(c);
                            setDeleteOpen(true);
                        }}
                        className="flex cursor-pointer items-center gap-2 rounded-lg text-[11px] font-bold tracking-tight text-rose-600 uppercase focus:bg-rose-50 focus:text-rose-600"
                    >
                        <Trash2 size={14} /> Hapus Data
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        ),
        [],
    );

    const updateContract = useCallback(
        (c: Contract) => {
            router.reload({ preserveScroll: true, preserveState: true } as any);
            if (selected?.id === c.id) setSelected(c);
        },
        [selected?.id],
    );

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
    const [approversExpanded, setApproversExpanded] = useState(false);
    const canApprove = (selected?.status === 'in_review' || selected?.status === 'revision') && !!pendingApprovalForMe;

    const handleCreate = async (fd: FormData) => {
        try {
            const newContract = await contractApi.create(fd);
            router.visit(route('contracts.show', { id: newContract.id }));
            showToast('Kontrak berhasil dibuat!', 'success');
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Gagal membuat kontrak.', 'danger');
        }
    };

    const handleApprove = async () => {
        if (!selected) return;
        if (approvalNote.length < 10) {
            showToast('Catatan wajib diisi minimal 10 karakter.', 'info');
            return;
        }
        try {
            const c = await contractApi.approve(selected.id, approvalNote);
            updateContract(c);
            setApprovalNote('');
            showToast('Kontrak berhasil disetujui!', 'success');
        } catch {
            showToast('Gagal approve.', 'danger');
        }
    };

    const handleReject = async () => {
        if (!selected) return;
        if (approvalNote.length < 10) {
            showToast('Catatan penolakan wajib diisi minimal 10 karakter.', 'info');
            return;
        }
        try {
            const c = await contractApi.reject(selected.id, approvalNote);
            updateContract(c);
            setApprovalNote('');
            showToast('Kontrak ditolak.', 'info');
        } catch {
            showToast('Gagal reject.', 'danger');
        }
    };

    const handleUpdate = async (data: any) => {
        if (!selected) return;
        setProcessing(true);
        try {
            const c = await contractApi.update(selected.id, data);
            updateContract(c);
            setEditOpen(false);
            showToast('Informasi kontrak diperbarui.', 'success');
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
            router.reload({ preserveScroll: true } as any);
            setSelected(null);
            setDeleteOpen(false);
            showToast('Kontrak berhasil dihapus.', 'success');
        } catch {
            showToast('Gagal menghapus kontrak.', 'danger');
        } finally {
            setProcessing(false);
        }
    };

    const handleSendSubmit = async (data: any) => {
        if (!selected) return;
        try {
            const c = await contractApi.send(selected.id, data);
            updateContract(c);
            showToast('Kontrak berhasil dikirim untuk approval!', 'success');
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Gagal mengirim kontrak.', 'danger');
        }
    };

    return (
        <>
            <Head title={currentView} />
            <div className="bg-background/20 flex min-h-0 flex-1 flex-col gap-4 p-4">
                {selected ? (
                    <div className="flex flex-1 flex-col gap-4">
                        <div className="flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={closeDetail}
                                    className="text-muted-foreground hover:text-foreground mb-1 flex w-fit items-center gap-2 text-[10px] font-black tracking-widest uppercase transition-colors"
                                >
                                    <i className="fa-solid fa-arrow-left" /> Kembali
                                </button>
                                <div className="flex flex-col gap-3">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h2 className="text-foreground text-2xl font-black tracking-tight">{selected.title}</h2>
                                        <StatusBadge status={selected.status} />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <span className="flex w-fit items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-500 ring-1 ring-slate-200">
                                            <i className="fa-solid fa-hashtag text-[8px]" /> {selected.contract_no || 'NO REQ'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* {canUpdate && selected.status === 'draft' && (
                                    <button onClick={() => setEditOpen(true)} className="bg-card border-border hover:bg-muted inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-bold transition-all active:scale-95 shadow-sm">
                                        <i className="fa-solid fa-pen-to-square" /> Edit Kontrak
                                    </button>
                                )} */}
                                {selected.status === 'draft' && (
                                    <button
                                        onClick={() => setSendOpen(true)}
                                        className="bg-primary text-primary-foreground shadow-primary/20 hover:shadow-primary/30 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold shadow-md transition-all active:scale-95"
                                    >
                                        <i className="fa-solid fa-paper-plane" /> Kirim Approval
                                    </button>
                                )}
                                <button
                                    onClick={() => setDeleteOpen(true)}
                                    className="border-border bg-card text-muted-foreground inline-flex h-9 w-9 items-center justify-center rounded-lg border shadow-sm transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-95"
                                >
                                    <i className="fa-solid fa-trash-can" />
                                </button>
                            </div>
                        </div>

                        <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
                            <div className="flex flex-col gap-6">
                                <div className="bg-card border-border overflow-hidden rounded-xl border shadow-sm">
                                    <div className="border-border/50 flex flex-wrap border-b bg-slate-50/50 p-0.5">
                                        <button
                                            onClick={() => setDetailTab('form_template')}
                                            className={cn(
                                                'rounded-md px-4 py-2 text-[10px] font-black tracking-widest uppercase transition-all',
                                                detailTab === 'form_template'
                                                    ? 'text-primary bg-white shadow-sm'
                                                    : 'text-muted-foreground hover:bg-white/50',
                                            )}
                                        >
                                            Formulir F1
                                        </button>
                                        <button
                                            onClick={() => setDetailTab('f2')}
                                            className={cn(
                                                'rounded-md px-4 py-2 text-[10px] font-black tracking-widest uppercase transition-all',
                                                detailTab === 'f2' ? 'text-primary bg-white shadow-sm' : 'text-muted-foreground hover:bg-white/50',
                                            )}
                                        >
                                            Formulir F2
                                        </button>
                                        <button
                                            onClick={() => setDetailTab('agreement')}
                                            className={cn(
                                                'rounded-md px-4 py-2 text-[10px] font-black tracking-widest uppercase transition-all',
                                                detailTab === 'agreement'
                                                    ? 'text-primary bg-white shadow-sm'
                                                    : 'text-muted-foreground hover:bg-white/50',
                                            )}
                                        >
                                            Agreement
                                        </button>
                                        <button
                                            onClick={() => setDetailTab('attachments')}
                                            className={cn(
                                                'rounded-md px-4 py-2 text-[10px] font-black tracking-widest uppercase transition-all',
                                                detailTab === 'attachments'
                                                    ? 'text-primary bg-white shadow-sm'
                                                    : 'text-muted-foreground hover:bg-white/50',
                                            )}
                                        >
                                            Lampiran
                                        </button>
                                        <button
                                            onClick={() => setDetailTab('audit')}
                                            className={cn(
                                                'rounded-md px-4 py-2 text-[10px] font-black tracking-widest uppercase transition-all',
                                                detailTab === 'audit' ? 'text-primary bg-white shadow-sm' : 'text-muted-foreground hover:bg-white/50',
                                            )}
                                        >
                                            Audit Trail
                                        </button>
                                        <button
                                            onClick={() => setDetailTab('chat')}
                                            className={cn(
                                                'rounded-md px-4 py-2 text-[10px] font-black tracking-widest uppercase transition-all',
                                                detailTab === 'chat' ? 'text-primary bg-white shadow-sm' : 'text-muted-foreground hover:bg-white/50',
                                            )}
                                        >
                                            Chat
                                        </button>
                                    </div>
                                    <div className={cn("flex-1 flex flex-col min-h-[1000px]", detailTab !== 'agreement' && "p-4")}>
                                        {detailTab === 'form_template' && (
                                            <FormSubmissionTab
                                                docType="f1"
                                                selected={selected}
                                                formTemplates={formTemplates}
                                                onContractUpdated={updateContract}
                                            />
                                        )}
                                        {detailTab === 'f2' && (
                                            <FormSubmissionTab
                                                docType="f2"
                                                selected={selected}
                                                formTemplates={formTemplates}
                                                onContractUpdated={updateContract}
                                            />
                                        )}
                                        {detailTab === 'agreement' && <AgreementView contract={selected} onUpdate={updateContract} />}
                                        {detailTab === 'attachments' && (
                                            <ContractAttachments contract={selected} onUpdated={updateContract} showToast={showToast} />
                                        )}
                                        {detailTab === 'audit' && <ContractAuditTrail contract={selected} />}
                                        {detailTab === 'chat' && <ContractChat contract={selected} meId={meId} onNewMessage={updateContract} />}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-4">
                                <DraftEditableInfoCard
                                    selected={selected}
                                    types={types}
                                    submissionTypes={submissionTypes}
                                    vendors={vendors}
                                    formTemplates={formTemplates}
                                    canUpdate={!!canUpdate}
                                    onUpdate={handleUpdate}
                                    processing={processing}
                                    setPreviewTitle={setPreviewTitle}
                                    setPreviewUrl={setPreviewUrl}
                                    setPreviewHasFile={setPreviewHasFile}
                                    setPreviewOpen={setPreviewOpen}
                                />
                                <ContractReferenceCard selected={selected} canUpdate={!!canUpdate} onUpdate={handleUpdate} processing={processing} />

                                <div className="bg-card border-border overflow-hidden rounded-xl border shadow-sm">
                                    <div className="border-border/50 flex items-center gap-2 border-b bg-slate-50/50 p-3.5 text-[10px] font-black tracking-[0.2em] uppercase">
                                        <i className="fa-solid fa-timeline text-primary" /> Alur Approval
                                    </div>
                                    <div className="p-4">
                                        <ApprovalSteps
                                            approvals={selected.approvals}
                                            creator={selected.creator}
                                            submittedAt={selected.submitted_at ?? undefined}
                                        />
                                    </div>
                                </div>

                                {hasAnyPending && (
                                    <div className="bg-card border-border overflow-hidden rounded-xl border shadow-sm">
                                        <div className="border-border/50 flex items-center gap-2 border-b bg-slate-50/50 p-3.5 text-[10px] font-black tracking-[0.2em] uppercase">
                                            <i className="fa-solid fa-bolt text-amber-500" /> Aksi Approval
                                        </div>
                                        <div className="p-4">
                                            {canApprove ? (
                                                <div className="flex flex-col gap-3">
                                                    <div className="relative">
                                                        <textarea
                                                            value={approvalNote}
                                                            onChange={(e) => setApprovalNote(e.target.value)}
                                                            rows={3}
                                                            placeholder="Tambahkan catatan (Minimal 10 karakter)..."
                                                            className={cn(
                                                                'border-border focus:border-primary/50 w-full resize-none rounded-xl bg-slate-50/50 p-3 text-sm font-medium transition-all outline-none',
                                                                approvalNote.length > 0 && approvalNote.length < 10
                                                                    ? 'border-amber-200 ring-1 ring-amber-100'
                                                                    : '',
                                                            )}
                                                        />
                                                        {approvalNote.length > 0 && approvalNote.length < 10 && (
                                                            <div className="absolute right-3 bottom-2 animate-pulse text-[9px] font-bold text-amber-500">
                                                                {10 - approvalNote.length} karakter lagi
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={handleApprove}
                                                            disabled={approvalNote.length < 10}
                                                            className="bg-primary text-primary-foreground flex-3 rounded-lg py-2.5 text-xs font-bold shadow-md transition-all active:scale-95 disabled:scale-100 disabled:opacity-30 disabled:grayscale"
                                                        >
                                                            <i className="fa-solid fa-check mr-1.5" /> Setujui
                                                        </button>
                                                        <button
                                                            onClick={handleReject}
                                                            disabled={approvalNote.length < 10}
                                                            className="flex-2 rounded-lg bg-rose-600 py-2.5 text-xs font-bold text-white shadow-md transition-all active:scale-95 disabled:scale-100 disabled:opacity-30 disabled:grayscale"
                                                        >
                                                            <i className="fa-solid fa-xmark mr-1.5" /> Tolak
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-1">
                                                    <div className="mb-4 ml-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase italic">
                                                        Menunggu Approval Dari
                                                    </div>
                                                    <div className="space-y-4">
                                                        {selected?.approvals
                                                            .filter((a) => a.status === 'pending')
                                                            .slice(0, approversExpanded ? undefined : 1)
                                                            .map((a, i, arr) => (
                                                                <div key={i} className="animate-in fade-in slide-in-from-top-1 relative flex gap-3">
                                                                    {((!approversExpanded && i < 0) ||
                                                                        (approversExpanded &&
                                                                            i <
                                                                                selected.approvals.filter((a) => a.status === 'pending').length -
                                                                                    1)) && (
                                                                        <div className="absolute top-8 bottom-0 left-3.5 w-px bg-slate-100" />
                                                                    )}
                                                                    <div className="relative z-10 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-600 shadow-sm">
                                                                        <i className="fa-solid fa-clock text-[10px]" />
                                                                    </div>
                                                                    <div className="flex-1 pt-0.5">
                                                                        <div className="text-xs leading-tight font-bold text-slate-900">
                                                                            {a.approver?.name || a.approver_name}
                                                                        </div>
                                                                        <div className="mt-1 text-[10px] leading-none font-medium tracking-wider whitespace-nowrap text-slate-400 uppercase">
                                                                            {a.role || 'Approver'}{' '}
                                                                            {a.approver?.department?.name ? `· ${a.approver.department.name}` : ''}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                    </div>

                                                    {selected?.approvals.filter((a) => a.status === 'pending').length > 1 && (
                                                        <button
                                                            onClick={() => setApproversExpanded(!approversExpanded)}
                                                            className="text-primary hover:text-primary/70 mt-5 w-full border-t border-slate-50 py-2 text-center text-[9px] font-black tracking-widest uppercase transition-colors"
                                                        >
                                                            {approversExpanded
                                                                ? 'Sembunyikan'
                                                                : `Lihat ${selected.approvals.filter((a) => a.status === 'pending').length - 1} Orang Lainnya`}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {view === 'dashboard' && <DashboardMetrics metrics={metrics} roles={roles} departments={departments} filters={filters} />}
                        {view === 'profile' && <ProfileView meUser={meUser} showToast={showToast} />}
                        {view !== 'profile' && view !== 'dashboard' && (
                            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden rounded-2xl border border-slate-100 bg-white">
                                {/* Unified Toolbar — Identical for both modes */}
                                <div className="sticky top-0 z-20 flex items-center gap-6 border-b border-slate-100 bg-white px-5 py-4">
                                    <div className="relative max-w-sm flex-1">
                                        <Search className="absolute top-1/2 left-3.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            placeholder="Cari berdasarkan judul atau nomor..."
                                            className="h-10 rounded-none border-r-0 border-slate-100 bg-slate-50/50 pl-10 text-[11px] font-medium transition-all placeholder:text-slate-400 focus:border-black focus-visible:ring-0 focus-visible:ring-offset-0"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                    </div>

                                    <div className="ml-auto flex items-center gap-1.5">
                                        {/* Layout Toggle — Monochrome Compact */}
                                        <div className="mr-2 flex rounded-none border border-slate-100 bg-slate-50 p-0.5">
                                            <button
                                                onClick={() => setLayout('table')}
                                                className={cn(
                                                    'flex h-8 w-8 items-center justify-center transition-all',
                                                    (layout as string) === 'table' ? 'bg-black text-white' : 'text-slate-400 hover:text-black',
                                                )}
                                            >
                                                <MoreVertical size={14} className="rotate-90" />
                                            </button>
                                            <button
                                                onClick={() => setLayout('grid')}
                                                className={cn(
                                                    'flex h-8 w-8 items-center justify-center transition-all',
                                                    (layout as string) === 'grid' ? 'bg-black text-white' : 'text-slate-400 hover:text-black',
                                                )}
                                            >
                                                <LayoutGrid size={14} />
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => setFilterOpen(true)}
                                            className={cn(
                                                'relative flex h-10 items-center gap-2 rounded-none border border-slate-100 bg-white px-4 text-[10px] font-black tracking-widest uppercase transition-all hover:bg-slate-50 active:scale-95',
                                                filters.status?.length || filters.contract_type_id?.length
                                                    ? 'border-black bg-black text-white'
                                                    : 'text-slate-500',
                                            )}
                                        >
                                            <Filter size={14} />
                                            Filter
                                            {(Array.isArray(filters.status) ? filters.status.length : filters.status ? 1 : 0) +
                                                (Array.isArray(filters.contract_type_id)
                                                    ? filters.contract_type_id.length
                                                    : filters.contract_type_id
                                                      ? 1
                                                      : 0) >
                                                0 && (
                                                <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-none bg-white text-[9px] font-black text-black">
                                                    {(Array.isArray(filters.status) ? filters.status.length : filters.status ? 1 : 0) +
                                                        (Array.isArray(filters.contract_type_id)
                                                            ? filters.contract_type_id.length
                                                            : filters.contract_type_id
                                                              ? 1
                                                              : 0)}
                                                </span>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setCreateOpen(true)}
                                            className="flex h-10 items-center gap-2 rounded-none bg-black px-6 text-[10px] font-black tracking-widest text-white uppercase transition-all hover:bg-slate-800 active:scale-95"
                                        >
                                            <i className="fa-solid fa-plus text-[10px]" /> Kontrak Baru
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-auto">
                                    {layout === 'table' ? (
                                        <DataTable
                                            columns={columns}
                                            data={contracts}
                                            onRowClick={openDetail}
                                            pagination={{
                                                currentPage: contractsPaged.current_page,
                                                lastPage: contractsPaged.last_page,
                                                total: contractsPaged.total,
                                                from: contractsPaged.from,
                                                to: contractsPaged.to,
                                                perPage: contractsPaged.per_page,
                                                onPageChange: (page) =>
                                                    router.get(
                                                        window.location.pathname,
                                                        { ...filters, page },
                                                        { preserveState: true, preserveScroll: true },
                                                    ),
                                                onPerPageChange: (pp) =>
                                                    router.get(
                                                        window.location.pathname,
                                                        { ...filters, per_page: pp, page: 1 },
                                                        { preserveState: true, preserveScroll: true },
                                                    ),
                                            }}
                                        />
                                    ) : (
                                        <div className="flex flex-col gap-6 p-5">
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                                {contracts.map((c) => (
                                                    <div
                                                        key={c.id}
                                                        onClick={() => openDetail(c)}
                                                        className="group flex cursor-pointer flex-col gap-3 border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-black hover:shadow-md"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex min-w-0 flex-col">
                                                                <span className="font-mono text-[9px] font-bold tracking-tight text-slate-400 uppercase transition-all group-hover:text-slate-600">
                                                                    {c.contract_no || 'NO NUMBER'}
                                                                </span>
                                                                <h3 className="line-clamp-1 text-sm leading-tight font-black tracking-tight transition-all group-hover:text-black">
                                                                    {c.title}
                                                                </h3>
                                                            </div>
                                                            <div className="flex-shrink-0">
                                                                <StatusBadge status={c.status} />
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-4 overflow-hidden border-y border-slate-50 py-1.5 transition-all group-hover:border-slate-200">
                                                            <div className="flex min-w-[90px] flex-col gap-0">
                                                                <span className="text-[8px] font-black text-slate-300 uppercase group-hover:text-slate-400">
                                                                    Departemen
                                                                </span>
                                                                <span className="truncate text-[9px] font-bold text-slate-600 transition-all group-hover:text-black">
                                                                    {c.initiator?.department_name || 'UMUM'}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-1 flex-col gap-1 pr-1">
                                                                <div className="h-1 w-full overflow-hidden rounded-none bg-slate-100">
                                                                    <div className="h-full bg-black" style={{ width: `${c.progress.pct}%` }} />
                                                                </div>
                                                                <span className="self-end text-[8px] font-black text-slate-400 transition-all group-hover:text-black">
                                                                    {c.progress.pct}%
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="mt-auto flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[9px] font-black text-slate-300 uppercase group-hover:text-slate-400">
                                                                    Masa Berlaku:
                                                                </span>
                                                                <span className="text-[10px] font-bold text-slate-700 transition-all group-hover:text-black">
                                                                    {c.end_date || '—'}
                                                                </span>
                                                            </div>
                                                            <div className="origin-right scale-90">
                                                                <SLACountdown deadline={c.sla_deadline ?? null} status={c.status} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Grid Pagination Footer — Standardizing with DataTable logic */}
                                            <div className="mt-8 flex w-full flex-col items-center justify-between gap-4 border-t border-slate-100 pt-6 pb-10 sm:flex-row">
                                                <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                                    Showing <span className="text-black">{contractsPaged.from}</span> to{' '}
                                                    <span className="text-black">{contractsPaged.to}</span> of{' '}
                                                    <span className="text-black">{contractsPaged.total}</span> Results
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        disabled={contractsPaged.current_page === 1}
                                                        onClick={() =>
                                                            router.get(
                                                                window.location.pathname,
                                                                { ...filters, page: contractsPaged.current_page - 1 },
                                                                { preserveState: true },
                                                            )
                                                        }
                                                        className="h-8 rounded border border-slate-100 px-3 text-[10px] font-black uppercase active:scale-95 disabled:opacity-30"
                                                    >
                                                        Prev
                                                    </button>
                                                    <button
                                                        disabled={contractsPaged.current_page === contractsPaged.last_page}
                                                        onClick={() =>
                                                            router.get(
                                                                window.location.pathname,
                                                                { ...filters, page: contractsPaged.current_page + 1 },
                                                                { preserveState: true },
                                                            )
                                                        }
                                                        className="h-8 rounded border border-slate-100 px-3 text-[10px] font-black uppercase active:scale-95 disabled:opacity-30"
                                                    >
                                                        Next
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
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
            />
            <EditContractModal
                open={editOpen}
                onClose={() => setEditOpen(false)}
                onSubmit={handleUpdate}
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
                    status: filters.status ? (Array.isArray(filters.status) ? filters.status : [filters.status]) : [],
                    contract_type_id: filters.contract_type_id
                        ? Array.isArray(filters.contract_type_id)
                            ? filters.contract_type_id
                            : [filters.contract_type_id]
                        : [],
                    department_id: filters.department_id
                        ? Array.isArray(filters.department_id)
                            ? filters.department_id
                            : [filters.department_id]
                        : [],
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
                            { label: 'Pending', value: 'pending', icon: Clock, color: 'bg-amber-50 text-amber-500' },
                            { label: 'In Review', value: 'in_review', icon: Zap, color: 'bg-blue-50 text-blue-500' },
                            { label: 'Revision', value: 'revision', icon: AlertTriangle, color: 'bg-rose-50 text-rose-500' },
                            { label: 'Approved', value: 'approved', icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-500' },
                            { label: 'Rejected', value: 'rejected', icon: AlertCircle, color: 'bg-rose-50 text-rose-500' },
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
            <FloatingChat contracts={contracts} meId={meId} onContractUpdated={updateContract} />
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
}: any) {
    const { auth, contractId: initialId } = usePage<{ auth: { user: any }; contractId?: string }>().props;
    const meId = auth?.user?.id ?? '';
    const meUser = auth?.user ?? null;
    const [contractsPaged, setContractsPaged] = useState<PaginatedData<Contract>>(initialContractsPaged);
    const [types, setTypes] = useState<ContractType[]>(initialTypes);
    const [submissionTypes, setSubmissionTypes] = useState<any[]>(initialSubmissionTypes);
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
            axios
                .get('/admin/api/contracts/submission-types')
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
                setSubmissionTypes(sData as any);
                setMetrics(mData);

                if (initialSelectedProp) {
                    setInitialSelected(initialSelectedProp);
                } else if (initialId) {
                    setInitialSelected(cData.data.find((c: Contract) => c.id === initialId) ?? null);
                }

                setBootLoading(false);
            })
            .catch(() => setBootLoading(false));
    }, [initialContractsPaged?.total, initialTypes?.length, initialId, currentView, initialSelectedProp?.id]);

    return (
        <>
            <Head title="Contract Manager" />
            <ToastProvider>
                {bootLoading ? (
                    <div className="text-muted-foreground flex h-screen items-center justify-center">
                        <i className="fa-solid fa-spinner fa-spin text-primary mr-3 text-3xl" />
                        <span>Memuat data kontrak...</span>
                    </div>
                ) : (
                    <ContractPage
                        contracts={contractsPaged}
                        meId={meId}
                        meUser={meUser}
                        initialSelected={initialSelected}
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
