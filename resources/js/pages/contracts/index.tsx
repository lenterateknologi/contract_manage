import AgreementView from '@/components/contracts/AgreementView';
import ContractAuditTrail from '@/components/contracts/ContractAuditTrail';
import CreateContractModal from '@/components/contracts/CreateContractModal';
import { FormSubmissionTab } from '@/components/contracts/FormSubmissionTab';
import PreviewModal from '@/components/contracts/PreviewModal';
// No RejectModal import needed
import { ToastProvider, useToast } from '@/components/contracts/Toast';
import { Button } from '@/components/ui/base/Button';
import { FilterSheet } from '@/components/ui/data/FilterSheet';
import { SearchInput } from '@/components/ui/forms/SearchInput';
import { LayoutToggle, LayoutType } from '@/components/ui/navigation/LayoutToggle';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/overlays/DropdownMenu';
import { contractApi } from '@/lib/contract-api';
import { cn } from '@/lib/utils';
import { Contract, ContractType, PaginatedData } from '@/types/contracts';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    AlertCircle,
    AlertTriangle,
    Archive,
    Check,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Download,
    Eye,
    FileEdit,
    FileText,
    FileType,
    Filter,
    Layers,
    MoreVertical,
    PlusCircle,
    Save,
    Send,
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
import { Column, DataTable } from '@/components/ui/data/DataTable';
import LoadingLottie from '@/components/ui/feedback/LoadingLottie';
import { ConfirmationModal } from '@/components/ui/overlays/ConfirmationModal';
import { usePermissions } from '@/hooks/use-permissions';

const ensureArray = (val: any): any[] => {
    if (Array.isArray(val)) return val;
    return val ? [val] : [];
};

type View = 'dashboard' | 'contracts' | 'pending' | 'audit' | 'f1' | 'f2' | 'profile' | 'mine' | 'expiry';

function ExpiryBadge({ endDate }: Readonly<{ endDate: string | null }>) {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let color = 'bg-black text-white border-black/10 dark:bg-white dark:text-black';
    let icon = 'fa-circle-check';
    let label = `${diffDays} Hari Lagi`;

    if (diffDays < 0) {
        color = 'bg-black/10 text-black border-black/10 dark:bg-white/10 dark:text-white';
        icon = 'fa-circle-exclamation';
        label = `Expired ${Math.abs(diffDays)} Hari`;
    } else if (diffDays <= 30) {
        color = 'bg-black text-white border-black/10 dark:bg-white dark:text-black';
        icon = 'fa-triangle-exclamation';
    } else if (diffDays <= 90) {
        color = 'text-black dark:text-white border border-black/10';
        icon = 'fa-clock';
    }

    return (
        <div className={cn('inline-flex items-center gap-1.5 text-[11px] font-semibold', color)}>
            <i className={cn('fa-solid text-[10px]', icon)} />
            {label}
        </div>
    );
}

const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { bg: string; dot: string; text: string; label: string }> = {
        draft: { bg: 'bg-slate-100', dot: 'bg-slate-400', text: 'text-slate-600', label: 'Draft' },
        in_review: { bg: 'bg-amber-100', dot: 'bg-amber-500', text: 'text-amber-700', label: 'Review' },
        revision: { bg: 'bg-rose-100', dot: 'bg-rose-500', text: 'text-rose-700', label: 'Revisi' },
        pending: { bg: 'bg-orange-100', dot: 'bg-orange-500', text: 'text-orange-700', label: 'Pending' },
        approved: { bg: 'bg-emerald-100', dot: 'bg-emerald-500', text: 'text-emerald-700', label: 'Disetujui' },
        active: { bg: 'bg-blue-100', dot: 'bg-blue-500', text: 'text-blue-700', label: 'Aktif' },
        expired: { bg: 'bg-red-100', dot: 'bg-red-500', text: 'text-red-700', label: 'Expired' },
        archived: { bg: 'bg-zinc-100', dot: 'bg-zinc-400', text: 'text-zinc-500', label: 'Arsip' },
        rejected: { bg: 'bg-red-100', dot: 'bg-red-500', text: 'text-red-700', label: 'Ditolak' },
    };

    const s = config[status as keyof typeof config] || config.draft;

    return (
        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold', s.bg, s.text)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
            {s.label}
        </span>
    );
};

const SLACountdown = ({ deadline, status }: Readonly<{ deadline: string | null; status: string }>) => {
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
        <div className={cn('flex w-fit items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold ring-1', getUrgencyStyles())}>
            <Clock size={10} className={urgency === 'danger' ? 'animate-pulse' : ''} />
            {timeLeft}
        </div>
    );
};
const ContractInfoCell = ({ c }: Readonly<{ c: Contract }>) => (
    <div className="flex flex-col">
        <div className="flex items-center gap-2">
            <span className="text-[13px] leading-tight font-bold text-sidebar-foreground">{c.title}</span>
            {!!c.current_version && (
                <div className="flex-shrink-0 rounded bg-sidebar-primary px-1.5 py-0.5">
                    <span className="text-[9px] font-black text-white uppercase">V{c.current_version}</span>
                </div>
            )}
        </div>
        <div className="mt-1.5 flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-wide text-sidebar-foreground/40 uppercase">{c.contract_type}</span>
            <span className="h-1 w-1 rounded-full bg-sidebar-foreground/20" />
            <span className="text-[10px] font-bold tracking-wide text-sidebar-foreground/40 uppercase">{c.vendor?.name || 'No Vendor'}</span>
        </div>
    </div>
);

const DepartmentCell = ({ c }: Readonly<{ c: Contract }>) => (
    <span className="text-[11px] font-semibold tracking-wide text-sidebar-foreground/50 uppercase">
        {c.initiator?.department_name || 'UMUM'}
    </span>
);

const ProgressCell = ({ c }: Readonly<{ c: Contract }>) => (
    <span className="text-sidebar-foreground/90 text-[10px] font-bold tracking-tight">
        {c.progress.done}/{c.progress.total}
    </span>
);

const CreatedAtCell = ({ c }: Readonly<{ c: Contract }>) => (
    <span className="text-[11px] font-medium text-sidebar-foreground/40">{c.created_at}</span>
);

const ContractNoCell = ({ c }: Readonly<{ c: Contract }>) => (
    <span className="font-mono text-[10px] font-bold text-sidebar-primary/70">{c.contract_no || 'N/A'}</span>
);

const TitleCell = ({ c }: Readonly<{ c: Contract }>) => (
    <span className="line-clamp-1 text-[11px] font-bold text-sidebar-foreground">{c.title}</span>
);

const TypeCell = ({ c, types }: Readonly<{ c: Contract; types: ContractType[] }>) => {
    const TYPE_COLORS = [
        'bg-violet-100 text-violet-700',
        'bg-blue-100 text-blue-700',
        'bg-cyan-100 text-cyan-700',
        'bg-teal-100 text-teal-700',
        'bg-indigo-100 text-indigo-700',
        'bg-purple-100 text-purple-700',
    ];
    const type = types.find((t) => t.id === c.contract_type_id);
    const colorIdx = type ? type.name.charCodeAt(0) % TYPE_COLORS.length : 0;
    return (
        <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide', TYPE_COLORS[colorIdx])}>
            {(type?.name || 'N/A').replace('Perjanjian ', '').replace('Addendum / ', '')}
        </span>
    );
};

// Stable cell renderers to satisfy linting
const renderContractNo = (c: Contract) => <ContractNoCell c={c} />;
const renderTitle = (c: Contract) => <TitleCell c={c} />;
const renderStatus = (c: Contract) => <StatusBadge status={c.status} />;
const renderCreatedAt = (c: Contract) => <CreatedAtCell c={c} />;

const BulkActions = ({
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
            <Button
                variant="outline"
                size="sm"
                className="h-8 border-black/10 px-3 dark:border-white/10"
                onClick={() => handleBulkApprove(selectedRows)}
            >
                <Check className="mr-1.5 h-3 w-3" /> Approve
            </Button>
        )}
        {canBulkDelete && (
            <Button
                variant="outline"
                size="sm"
                className="h-8 border-rose-500/20 px-3 text-rose-600 hover:bg-rose-600 hover:text-white"
                onClick={() => handleBulkDelete(selectedRows)}
            >
                <Trash2 className="mr-1.5 h-3 w-3" /> Hapus
            </Button>
        )}
    </div>
);

const RowActions = ({
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
            <Button
                variant="ghost"
                className="border-sidebar-border dark:bg-sidebar-accent/50 hover:bg-sidebar-accent group h-8 w-8 rounded-lg border bg-white p-0 transition-all"
            >
                <MoreVertical size={14} className="text-sidebar-foreground/40 group-hover:text-sidebar-primary" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
            align="end"
            className="border-sidebar-border dark:bg-sidebar-accent/90 w-52 rounded-xl bg-white p-1.5 shadow-2xl backdrop-blur-md"
        >
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
);
const ContractDetailView = ({
    contract,
    meId,
    types,
    submissionTypes,
    vendors,
    formTemplates,
    canUpdate,
    onClose,
    onUpdate,
    showToast,
    setSendOpen,
    setDeleteOpen,
    setPreviewTitle,
    setPreviewUrl,
    setPreviewHasFile,
    setPreviewOpen,
}: {
    contract: Contract;
    meId: string;
    types: ContractType[];
    submissionTypes: any[];
    vendors: any[];
    formTemplates: any[];
    canUpdate: boolean;
    onClose: () => void;
    onUpdate: (c: Contract, silent?: boolean) => void;
    showToast: (msg: string, type: any) => void;
    setSendOpen: (open: boolean) => void;
    setDeleteOpen: (open: boolean) => void;
    setPreviewTitle: (title: string) => void;
    setPreviewUrl: (url: string) => void;
    setPreviewHasFile: (has: boolean) => void;
    setPreviewOpen: (open: boolean) => void;
}) => {
    const [detailTab, setDetailTab] = useState<'form_template' | 'f2' | 'agreement' | 'attachments' | 'audit' | 'chat' | 'timeline' | 'references'>(
        'form_template',
    );
    const [processing, setProcessing] = useState(false);
    const { showProgress, hideProgress } = useToast();

    // Export Logic
    const [isExportingTimeline, setIsExportingTimeline] = useState(false);

    const handleExportTimelinePdf = async () => {
        setIsExportingTimeline(true);

        // Open window immediately to avoid pop-up blocker
        const win = globalThis.window.open('about:blank', '_blank');
        if (win) {
            win.document.writeln(`
                <html>
                    <head>
                        <title>Mempersiapkan Alur Approval...</title>
                        <style>
                            body { font-family: 'Inter', sans-serif; background: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; color: #1e293b; }
                            .card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1); text-align: center; border: 1px solid #e2e8f0; max-width: 400px; }
                            .loader { width: 48px; height: 48px; border: 5px solid #f1f5f9; border-top: 5px solid #0f172a; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 24px; }
                            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                            h2 { font-size: 14px; font-weight: 900; letter-spacing: 0.15em; text-transform: uppercase; margin: 0 0 12px; }
                            p { font-size: 11px; color: #64748b; font-weight: 500; line-height: 1.6; }
                        </style>
                    </head>
                    <body>
                        <div class="card">
                            <div class="loader"></div>
                            <h2>Mempersiapkan Laporan Approval</h2>
                            <p>Mohon tunggu sebentar, data alur approval sedang dikonversi menjadi PDF. Halaman ini akan otomatis beralih ke dokumen setelah siap.</p>
                        </div>
                    </body>
                </html>
            `);
            win.document.close();
        }

        try {
            const res = await axios.get(`/api/contracts/${contract.id}/approval/pdf/queue`, {
                headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
                withCredentials: true,
            });

            const jobId = res.data.job_id;

            const interval = setInterval(async () => {
                try {
                    const statusRes = await axios.get(`/admin/form-templates/pdf-status/${jobId}`, {
                        headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
                        withCredentials: true,
                    });
                    const statusData = statusRes.data;

                    showProgress(jobId, 'Mempersiapkan Laporan Approval...', statusData.progress || 0);

                    if (statusData.status === 'completed') {
                        clearInterval(interval);
                        if (win) {
                            win.location.href = statusData.url;
                        } else {
                            globalThis.window.open(statusData.url, '_blank');
                        }
                        hideProgress(jobId);
                        setIsExportingTimeline(false);
                    } else if (statusData.status === 'failed') {
                        clearInterval(interval);
                        hideProgress(jobId);
                        showToast('Export PDF gagal: ' + (statusData.error || 'Unknown error'), 'danger');
                        if (win) win.close();
                        setIsExportingTimeline(false);
                    }
                } catch (pollErr) {
                    console.error('Polling error', pollErr);
                }
            }, 2000);
        } catch (err: any) {
            console.error('Export failed', err);
            showToast('Gagal mengekspor PDF.', 'danger');
            setIsExportingTimeline(false);
            if (win) win.close();
        }
    };

    const handleUpdate = async (data: any, silent = false) => {
        if (!silent) setProcessing(true);
        try {
            const c = await contractApi.update(contract.id, data);
            onUpdate(c, silent);
            if (!silent) showToast('Informasi kontrak diperbarui.', 'success');
        } catch {
            if (!silent) showToast('Gagal memperbarui kontrak.', 'danger');
        } finally {
            if (!silent) setProcessing(false);
        }
    };

    const handleApprove = async () => {
        const note = prompt('Masukkan catatan approval (opsional):');
        if (note === null) return;
        try {
            const c = await contractApi.approve(contract.id, note);
            onUpdate(c);
            showToast('Kontrak disetujui.', 'success');
        } catch {
            showToast('Gagal approve.', 'danger');
        }
    };

    const handleReject = async () => {
        const note = prompt('Masukkan alasan penolakan (wajib):');
        if (!note) return;
        try {
            const c = await contractApi.reject(contract.id, note);
            onUpdate(c);
            showToast('Kontrak ditolak.', 'info');
        } catch {
            showToast('Gagal reject.', 'danger');
        }
    };

    const pendingApprovalForMe = contract.approvals.find((a) => a.status === 'pending' && a.user_id === meId);
    const canApprove = (contract.status === 'in_review' || contract.status === 'revision') && !!pendingApprovalForMe;

    return (
        <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-6 p-4">
            <div className="flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-6">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 text-black transition-all hover:opacity-70 active:scale-95 dark:text-white"
                    >
                        <ChevronLeft size={20} strokeWidth={2.5} />
                        <span className="text-[10px] font-bold tracking-widest uppercase">Kembali</span>
                    </button>
                    <div className="h-10 w-px bg-black/10 dark:bg-white/10" />
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg leading-none font-bold tracking-tight text-black uppercase dark:text-white">{contract.title}</h2>
                            <StatusBadge status={contract.status} />
                        </div>
                        <span className="mt-1.5 text-[10px] font-bold tracking-[0.2em] text-black/40 uppercase dark:text-white/40">
                            #{contract.contract_no || 'NO-REQ'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {contract.status === 'draft' && (
                        <Button
                            variant="primary"
                            onClick={() => setSendOpen(true)}
                            className="h-10 px-6 active:scale-95 dark:bg-white dark:text-black dark:hover:bg-white/90"
                        >
                            <Send size={14} /> Kirim Approval
                        </Button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-10 w-10 active:scale-95">
                                <MoreVertical size={18} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="dark:bg-sidebar w-56 rounded-xl border-black/10 bg-white p-1.5 shadow-2xl dark:border-white/10"
                        >
                            <div className="mb-1 px-2 py-1.5">
                                <p className="text-[10px] font-bold tracking-widest text-black/40 uppercase dark:text-white/40">Opsi Kontrak</p>
                            </div>
                            <DropdownMenuItem
                                onClick={() => handleUpdate({}, true)}
                                className="flex cursor-pointer items-center gap-2 rounded-lg text-[11px] font-bold tracking-tight text-black uppercase focus:bg-black/5 dark:text-white dark:focus:bg-white/5"
                            >
                                <Save size={14} className="text-black dark:text-white" /> Paksa Simpan (Force Sync)
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex cursor-pointer items-center gap-2 rounded-lg text-[11px] font-bold tracking-tight text-black uppercase focus:bg-black/5 dark:text-white dark:focus:bg-white/5">
                                <Archive size={14} className="text-black/40 dark:text-white/40" /> Arsipkan Kontrak
                            </DropdownMenuItem>
                            <div className="my-1.5 h-px bg-black/10 dark:bg-white/10" />
                            <DropdownMenuItem
                                onClick={() => setDeleteOpen(true)}
                                className="flex cursor-pointer items-center gap-2 rounded-lg text-[11px] font-bold tracking-tight text-black dark:text-white uppercase focus:bg-black focus:text-white dark:focus:bg-white dark:focus:text-black"
                            >
                                <Trash2 size={14} /> Hapus Kontrak
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[1fr_400px]">
                <div className="flex flex-col gap-6">
                    <div className="dark:bg-sidebar overflow-hidden rounded-xl bg-white shadow-sm">
                        <div className="bg-primary flex h-14 items-center justify-between px-4 dark:bg-white">
                            <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-white uppercase dark:text-black">
                                <FileText size={14} className="text-white/40 dark:text-black/40" /> Detail Dokumen & Alur Kerja
                            </div>
                            <div className="flex items-center gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 transition-all hover:text-white active:scale-95 dark:text-black/40 dark:hover:text-black">
                                            <MoreVertical size={14} />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5">
                                        <div className="mb-1 px-2 py-1.5 text-[9px] font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                                            Menu Tambahan
                                        </div>
                                        <DropdownMenuItem
                                            onClick={() => setDetailTab('audit')}
                                            className={cn(
                                                'flex cursor-pointer items-center gap-2 rounded-lg text-[11px] font-black tracking-tight uppercase transition-all',
                                                detailTab === 'audit'
                                                    ? 'bg-sidebar-primary text-white'
                                                    : 'text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/5',
                                            )}
                                        >
                                            <Clock
                                                size={14}
                                                className={cn(detailTab === 'audit' ? 'text-white' : 'text-black/40 dark:text-white/40')}
                                            />{' '}
                                            Audit Trail
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 border-b border-black/5 bg-black/[0.01] px-4 py-2 dark:border-white/5 dark:bg-white/[0.01]">
                            {[
                                { id: 'form_template', label: 'F1' },
                                { id: 'f2', label: 'F2' },
                                { id: 'agreement', label: 'Agreement' },
                                { id: 'attachments', label: 'Lampiran' },
                                { id: 'timeline', label: 'Alur Approval' },
                                { id: 'chat', label: 'Chat' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setDetailTab(tab.id as any)}
                                    className={cn(
                                        'relative px-3 py-2 text-[10px] font-bold tracking-tight uppercase transition-all',
                                        detailTab === tab.id
                                            ? 'text-black dark:text-white'
                                            : 'text-black/40 hover:text-black/60 dark:text-white/40 dark:hover:text-white/60',
                                    )}
                                >
                                    {tab.label}
                                    {detailTab === tab.id && (
                                        <div className="absolute right-0 bottom-0 left-0 h-0.5 bg-black dark:bg-white" />
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className={cn('flex min-h-[600px] flex-1 flex-col')}>
                            {detailTab === 'form_template' && (
                                <FormSubmissionTab docType="f1" selected={contract} formTemplates={formTemplates} onContractUpdated={onUpdate} />
                            )}
                            {detailTab === 'f2' && (
                                <FormSubmissionTab docType="f2" selected={contract} formTemplates={formTemplates} onContractUpdated={onUpdate} />
                            )}
                            {detailTab === 'agreement' && <AgreementView contract={contract} onUpdate={onUpdate} />}
                            {detailTab === 'attachments' && <ContractAttachments contract={contract} onUpdated={onUpdate} showToast={showToast} />}
                            {detailTab === 'audit' && <ContractAuditTrail contract={contract} />}
                            {detailTab === 'timeline' && (
                                <div className="mb-10 flex flex-col gap-8 p-5">
                                    <ApprovalSteps
                                        contract={contract}
                                        approvals={contract.approvals}
                                        creator={contract.creator}
                                        submittedAt={contract.submitted_at ?? undefined}
                                    />
                                </div>
                            )}
                            {detailTab === 'references' && (
                                <ContractReferenceCard
                                    selected={contract}
                                    canUpdate={canUpdate}
                                    onUpdate={(d) => handleUpdate(d, true)}
                                    processing={processing}
                                />
                            )}
                            {detailTab === 'chat' && <ContractChat contract={contract} meId={meId} users={vendors} onNewMessage={onUpdate} />}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-4">
                    {canApprove && (
                        <div className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-black/10 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-black">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/5 text-black dark:bg-white/10 dark:text-white">
                                    <Zap size={20} />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <h3 className="text-[12px] font-black tracking-tight text-black uppercase dark:text-white">
                                        Approval Dibutuhkan
                                    </h3>
                                    <p className="text-[10px] font-medium text-black/40 dark:text-white/40">
                                        Anda terdaftar sebagai salah satu reviewer
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 pt-2">
                                <Button variant="primary" onClick={handleApprove} className="h-11 w-full font-bold shadow-lg shadow-blue-500/20">
                                    <CheckCircle2 size={16} /> Setujui Kontrak
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleReject}
                                    className="h-11 w-full border-black/10 font-bold hover:bg-rose-500 hover:text-white dark:border-white/10"
                                >
                                    <AlertCircle size={16} /> Kembalikan / Tolak
                                </Button>
                            </div>
                        </div>
                    )}
                    <DraftEditableInfoCard
                        selected={contract}
                        types={types}
                        submissionTypes={submissionTypes}
                        vendors={vendors}
                        formTemplates={formTemplates}
                        canUpdate={canUpdate}
                        onUpdate={(d) => handleUpdate(d, true)}
                        processing={processing}
                        setPreviewTitle={setPreviewTitle}
                        setPreviewUrl={setPreviewUrl}
                        setPreviewHasFile={setPreviewHasFile}
                        setPreviewOpen={setPreviewOpen}
                    />
                </div>
            </div>
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
            await contractApi.create(data);
            showToast('Kontrak baru berhasil dibuat.', 'success');
            setCreateOpen(false);
            router.reload();
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
        const stringValue = String(value);
        const newValues = currentValues.includes(stringValue)
            ? currentValues.filter((v: any) => String(v) !== stringValue)
            : [...currentValues, stringValue];
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

    const renderType = useCallback((c: Contract) => <TypeCell c={c} types={types} />, [types]);

    const columns: Column<Contract>[] = useMemo(
        () => [
            {
                accessorKey: 'contract_no',
                header: 'No. Kontrak',
                cell: renderContractNo,
            },
            {
                accessorKey: 'title',
                header: 'Judul Kontrak',
                cell: renderTitle,
            },
            {
                accessorKey: 'contract_type_id',
                header: 'Tipe',
                cell: renderType,
            },
            {
                accessorKey: 'status',
                header: 'Status',
                cell: renderStatus,
            },
            {
                accessorKey: 'created_at',
                header: 'Dibuat',
                cell: renderCreatedAt,
            },
            {
                accessorKey: 'actions',
                header: '',
                cell: renderRowActions,
                className: 'w-10 text-right',
            },
        ],
        [types, renderRowActions],
    );

    return (
        <>
            <Head title={view} />
            <div className="bg-background dark:bg-background/50 flex min-h-0 flex-1 flex-col">
                {selected ? (
                    <ContractDetailView
                        contract={selected}
                        meId={meId}
                        types={types}
                        submissionTypes={submissionTypes}
                        vendors={vendors}
                        formTemplates={formTemplates}
                        canUpdate={!!canUpdate}
                        onClose={closeDetail}
                        onUpdate={updateContract}
                        showToast={showToast}
                        setSendOpen={setSendOpen}
                        setDeleteOpen={setDeleteOpen}
                        setPreviewTitle={setPreviewTitle}
                        setPreviewUrl={setPreviewUrl}
                        setPreviewHasFile={setPreviewHasFile}
                        setPreviewOpen={setPreviewOpen}
                    />
                ) : (
                    <div className="flex flex-col gap-4">
                        {view === 'dashboard' && <div className="p-5"><DashboardMetrics metrics={metrics} /></div>}
                        {view === 'profile' && <ProfileView meUser={meUser} showToast={showToast} />}
                        {view !== 'profile' && view !== 'dashboard' && (
                            <div className="border-sidebar-border bg-sidebar flex min-h-0 flex-1 flex-col gap-0 overflow-hidden">
                                {/* Unified Toolbar — Identical for both modes */}
                                <div className="border-sidebar-border bg-sidebar sticky top-0 z-20 flex items-center gap-6 border-b px-5 py-4">
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

                                <div className="flex-1 overflow-auto">
                                    {layout === 'table' ? (
                                        <DataTable
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
                                        <div className="flex flex-col gap-8 p-6">
                                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                                {contractsPaged.data.map((c) => (
                                                    <button
                                                        key={c.id}
                                                        onClick={() => openDetail(c)}
                                                        className="group border-sidebar-border bg-sidebar hover:border-sidebar-primary hover:shadow-sidebar-primary/10 dark:hover:bg-sidebar-accent/10 relative flex cursor-pointer flex-col gap-4 rounded-xl border p-5 text-left transition-all hover:shadow-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex min-w-0 flex-col gap-1">
                                                                <span className="group-hover:text-sidebar-primary text-[10px] font-medium text-black/40 transition-all dark:text-white/40">
                                                                    {c.contract_no || 'No Req'}
                                                                </span>
                                                                <h3 className="group-hover:text-sidebar-primary line-clamp-2 text-[12px] leading-tight font-semibold text-black transition-colors dark:text-white">
                                                                    {c.title}
                                                                </h3>
                                                                <span className="mt-0.5 text-[10px] font-medium text-black/30 dark:text-white/30">
                                                                    {c.contract_type}
                                                                </span>
                                                            </div>
                                                            <div className="flex-shrink-0 origin-top-right scale-90">
                                                                <StatusBadge status={c.status} />
                                                            </div>
                                                        </div>

                                                        <div className="border-sidebar-border/50 bg-sidebar-accent/30 dark:bg-sidebar-accent/10 group-hover:border-sidebar-primary/20 flex flex-col gap-3 rounded-lg border p-3 transition-all">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[10px] font-medium text-black/40 dark:text-white/40">
                                                                    Departemen
                                                                </span>
                                                                <span className="truncate text-[11px] font-semibold text-black dark:text-white">
                                                                    {c.initiator?.department_name || 'Umum'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between pt-1 text-[11px] font-medium">
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

                                            {/* Grid Pagination Footer — Standardizing with DataTable logic */}
                                            <div className="mt-8 mb-10 flex w-full items-center justify-between">
                                                {/* Left Pill: Info */}
                                                <div className="flex items-center gap-4 rounded-xl border border-[#0f2a4a]/10 bg-[#0f2a4a]/[0.03] px-6 py-2 shadow-sm transition-all duration-500 dark:border-white/10 dark:bg-white/[0.03]">
                                                    <div className="flex items-center gap-4 text-[10px] font-black tracking-widest whitespace-nowrap text-[#0f2a4a]/60 uppercase dark:text-white/60">
                                                        <span className="hidden text-[9px] opacity-40 sm:inline">Menampilkan</span>
                                                        <span>
                                                            {contractsPaged.from} - {contractsPaged.to} / {contractsPaged.total}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Right Pill: Navigation */}
                                                <div className="flex items-center gap-1 rounded-xl border border-[#0f2a4a]/10 bg-[#0f2a4a]/[0.03] px-3 py-1 shadow-sm transition-all duration-500 dark:border-white/10 dark:bg-white/[0.03]">
                                                    <button
                                                        disabled={contractsPaged.current_page === 1}
                                                        onClick={() =>
                                                            router.get(
                                                                globalThis.location.pathname,
                                                                { ...filters, page: contractsPaged.current_page - 1 },
                                                                { preserveState: true },
                                                            )
                                                        }
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#0f2a4a]/60 transition-all hover:bg-[#0f2a4a]/5 disabled:opacity-20 dark:text-white/60 dark:hover:bg-white/10"
                                                    >
                                                        <ChevronLeft className="h-4 w-4" />
                                                    </button>

                                                    <div className="mx-1 flex items-center gap-1">
                                                        <div className="flex h-8 min-w-[32px] items-center justify-center rounded-lg bg-[#0f2a4a] px-3 text-[10px] font-black text-white shadow-md shadow-[#0f2a4a]/20">
                                                            {contractsPaged.current_page}
                                                        </div>
                                                        <span className="mx-1 text-[10px] font-black text-black/20 dark:text-white/20">/</span>
                                                        <div className="text-[10px] font-black text-[#0f2a4a]/40 dark:text-white/40">
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
                            <h3 className="text-foreground flex items-center gap-2 text-sm font-bold tracking-widest uppercase">
                                <i className="fa-solid fa-file-pdf text-black dark:text-white" /> Export Alur Approval
                            </h3>
                            <span className="text-muted-foreground text-[10px] font-bold">{selected?.contract_no} — Generation Complete</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <a
                                href={timelinePdfPreviewUrl}
                                download={`Alur_Approval_${selected?.id}.pdf`}
                                className="flex items-center gap-2 rounded-md bg-indigo-600 px-6 py-2 text-xs font-bold tracking-widest text-white uppercase shadow-xl shadow-indigo-500/20 transition-all hover:bg-indigo-700"
                            >
                                <Download size={14} /> Download PDF
                            </a>
                            <button
                                onClick={() => setTimelinePdfPreviewUrl(null)}
                                className="text-foreground rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-bold tracking-widest uppercase transition-all hover:bg-slate-50"
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
                    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-white dark:bg-[#09090b]">
                        <div className="relative flex items-center justify-center">
                            <LoadingLottie width={180} height={180} />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-slate-800 opacity-20 dark:border-white" />
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <span className="animate-pulse text-[11px] font-black tracking-[0.5em] text-black uppercase dark:text-white">
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
