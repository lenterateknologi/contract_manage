import { Button } from '@/components/ui/base/Button';
import { FilterCategory, FilterPopover } from '@/components/ui/data/FilterPopover';
import { SearchInput } from '@/components/ui/forms/SearchInput';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { Contract, ContractApproval, UserProfile } from '@/types/contracts';
import axios from 'axios';
import { Check, Clock, Download, FileText, Info, ListFilter, Loader2, Send, Upload, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useToast } from './Toast';
import { Avatar, StatusBadge } from './ui';

interface Props {
    contract: Contract;
    approvals: ContractApproval[];
    creator: UserProfile;
    submittedAt?: string;
    meId?: string;
    onApprove: (note: string, attachment?: File) => Promise<void>;
}

export default function ApprovalSteps({ contract, approvals, creator, submittedAt, meId, onApprove }: Props) {
    const { showToast, showProgress, hideProgress } = useToast();
    // Filter open state is handled internally by FilterPopover
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [roleFilter, setRoleFilter] = useState<string>('');
    const [deptFilter, setDeptFilter] = useState<string>('');
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);
    const [isExporting, setIsExporting] = useState(false);
    const [jobStatus, setJobStatus] = useState<any>(null);
    const [uploading, setUploading] = useState(false);

    const signingState = contract.metadata?.signing_state;
    const signingPhase = signingState?.phase || 'SETUP';
    const isP1 = signingState?.p1_user_id === meId;
    const isP2 = signingState?.p2_user_id === meId;
    const p1Downloaded = signingState?.p1_downloaded_at;
    const p2Downloaded = signingState?.p2_downloaded_at;

    const handleSigningAction = async (action: 'download' | 'upload', file?: File) => {
        if (action === 'download') {
            // Trigger actual download from the latest agreement version
            const versions = contract.versions?.filter((v) => v.document_type === 'agreement') || [];
            if (versions.length === 0) {
                showToast('Tidak ada dokumen agreement yang ditemukan.', 'danger');
                return;
            }
            const latest = versions.sort((a, b) => b.version_no - a.version_no)[0];
            window.open(`/api/contracts/versions/${latest.id}/download`, '_blank');

            // Mark as downloaded in metadata (local update then refresh)
            const newMeta = { ...contract.metadata };
            if (!newMeta.signing_state) newMeta.signing_state = {};
            const key = isP1 ? 'p1_downloaded_at' : 'p2_downloaded_at';
            newMeta.signing_state[key] = new Date().toISOString();

            try {
                await axios.patch(`/api/contracts/${contract.id}`, { metadata: newMeta });
                showToast('Dokumen berhasil diunduh.', 'success');
                // Component will refresh via parent's onUpdate if we emit it,
                // but for now let's hope the user refreshes or we find a way.
                // Actually we should probably call a refresh function.
            } catch (e) {
                console.error(e);
            }
        } else if (action === 'upload' && file) {
            setUploading(true);
            try {
                await onApprove('Pembaruan Dokumen TTD', file);
            } finally {
                setUploading(false);
            }
        }
    };

    const iconMap: Record<string, string> = {
        approved: 'fa-check',
        pending: 'fa-ellipsis',
        rejected: 'fa-xmark',
        waiting: 'fa-minus',
    };
    const dotCls: Record<string, string> = {
        approved: 'bg-success border-success text-white shadow-md',
        pending: 'bg-warning border-warning text-white shadow-md animate-pulse',
        rejected: 'bg-danger border-danger text-white shadow-md',
        waiting: 'bg-muted text-text-desc border-border shadow-sm',
    };
    const noteCls: Record<string, string> = {
        approved: 'border-l-success bg-success/10 text-foreground',
        rejected: 'border-l-danger bg-danger/10 text-foreground font-semibold',
        pending: 'border-l-warning bg-warning/10 text-foreground',
        waiting: 'border-l-border bg-muted/20 text-text-desc/80',
    };

    const roles = useMemo(
        () =>
            Array.from(new Set(approvals.map((a) => a.role)))
                .filter(Boolean)
                .sort(),
        [approvals],
    );
    const depts = useMemo(
        () =>
            Array.from(new Set(approvals.map((a) => a.department_name)))
                .filter(Boolean)
                .sort(),
        [approvals],
    );

    const filteredSteps = useMemo(() => {
        let result = [...approvals];
        if (statusFilter) result = result.filter((a) => a.status === statusFilter);
        if (roleFilter) result = result.filter((a) => a.role === roleFilter);
        if (deptFilter) result = result.filter((a) => a.department_name === deptFilter);
        if (debouncedSearch) {
            const s = debouncedSearch.toLowerCase();
            result = result.filter(
                (a) =>
                    a.role?.toLowerCase().includes(s) || a.department_name?.toLowerCase().includes(s) || a.approver?.name?.toLowerCase().includes(s),
            );
        }
        return result.sort((a, b) => a.sequence - b.sequence);
    }, [approvals, statusFilter, roleFilter, deptFilter, debouncedSearch]);

    const showProjectedManager = approvals.length === 0 && creator.role?.toLowerCase() === 'staff';

    const handleExportPdf = async () => {
        setIsExporting(true);
        setJobStatus({ progress: 0, status: 'pending' });

        const win = window.open('about:blank', '_blank');
        try {
            if (win) {
                win.document.write(
                    '<html><head><title>Mempersiapkan PDF...</title><style>body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fff; color: #000; } .card { padding: 40px; border: 1px solid #ddd; text-align: center; } .loader { border: 2px solid #eee; border-top: 2px solid #000; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin: 0 auto 15px; } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } h2 { font-size: 13px; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; }</style></head><body><div class="card"><div class="loader"></div><h2>Mempersiapkan Dokumen</h2><p style="font-size: 11px; color: #666;">Data sedang diproses...</p></div></body></html>',
                );
                win.document.close();
            }

            const res = await axios.get(`/api/contracts/${contract.id}/approval/pdf/queue`, {
                params: {
                    status: statusFilter || undefined,
                    role: roleFilter || undefined,
                    department: deptFilter || undefined,
                },
            });

            const jobId = res.data.job_id;
            const interval = setInterval(async () => {
                const statusRes = await axios.get(`/admin/form-templates/pdf-status/${jobId}`);
                const data = statusRes.data;
                setJobStatus(data);
                showProgress(jobId, 'Mempersiapkan PDF...', data.progress || 0);

                if (data.status === 'completed') {
                    clearInterval(interval);
                    if (win) win.location.href = data.url;
                    setIsExporting(false);
                    hideProgress(jobId);
                } else if (data.status === 'failed') {
                    clearInterval(interval);
                    if (win) win.close();
                    setIsExporting(false);
                    hideProgress(jobId);
                    showToast('Gagal ekspor PDF', 'danger');
                }
            }, 2000);
        } catch (err) {
            if (win) win.close();
            setIsExporting(false);
            showToast('Gagal ekspor PDF', 'danger');
        }
    };

    const filterCategories: FilterCategory[] = [
        {
            label: 'STATUS',
            key: 'status',
            options: [
                { label: 'DISETUJUI', value: 'approved' },
                { label: 'DITOLAK', value: 'rejected' },
                { label: 'PENDING', value: 'pending' },
                { label: 'WAITING', value: 'waiting' },
            ],
        },
        {
            label: 'ROLE',
            key: 'role',
            type: 'searchable',
            options: roles.map((r) => ({ label: r || 'UNNAMED ROLE', value: r || '' })),
        },
        {
            label: 'DEPARTEMEN',
            key: 'department',
            type: 'searchable',
            options: depts.map((d) => ({ label: d || 'UMUM', value: d || '' })),
        },
    ];

    const activeCount = (statusFilter ? 1 : 0) + (roleFilter ? 1 : 0) + (deptFilter ? 1 : 0);

    const renderStep = (a: ContractApproval, i: number, isLast: boolean) => (
        <div key={a.id} className={cn('flex gap-3', !isLast ? 'relative pb-5' : '')}>
            {!isLast && <div className="bg-border/60 absolute top-7 bottom-0 left-[11.5px] w-0.5" />}
            <div
                className={cn(
                    'relative z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-transform duration-300',
                    dotCls[a.status] ?? dotCls.waiting,
                    a.status === 'pending' && 'scale-105 shadow-md ring-2 ring-warning/20',
                )}
            >
                {a.status === 'approved' ? (
                    <Check size={10} strokeWidth={4} />
                ) : a.status === 'rejected' ? (
                    <X size={10} strokeWidth={4} />
                ) : (
                    <Clock size={10} strokeWidth={3} />
                )}
            </div>
            <div
                className={cn(
                    'flex-1 rounded-xl border p-2.5 px-3 transition-all duration-300',
                    a.status === 'approved' && 'border-success/30 bg-success/5',
                    a.status === 'pending' && 'border-warning/40 bg-warning/5 shadow-sm ring-1 ring-warning/10',
                    a.status === 'rejected' && 'border-danger/30 bg-danger/5',
                    a.status === 'waiting' && 'border-border/50 bg-muted/5 opacity-60',
                )}
            >
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-col gap-0">
                        <span className={cn(
                            "text-[11px] font-black tracking-tight uppercase leading-tight",
                            a.status === 'pending' ? "text-warning-foreground" : "text-foreground"
                        )}>
                            {a.sequence === 1 ? 'PENGIRIMAN AWAL' : a.step_name || a.role || 'Unnamed Step'}
                        </span>
                        {a.step_description && a.step_description !== a.step_name && (
                            <span className="text-muted-foreground text-[9px] font-medium italic leading-none opacity-80">{a.step_description}</span>
                        )}
                    </div>
                    <div className="flex items-center">
                        <StatusBadge status={a.status} className="scale-90 origin-right" />
                    </div>
                </div>

                <div className={cn(
                    "mt-2 flex items-center gap-2 rounded-lg border border-transparent py-1.5 px-2 transition-colors",
                    a.approver ? "bg-background/40 border-border/20" : "bg-muted/20 border-dashed border-border/40"
                )}>
                    {a.approver ? (
                        <>
                            <Avatar user={a.approver} size="xs" className="ring-1 ring-background shadow-sm h-5 w-5" />
                            <div className="flex flex-col">
                                <span className="text-foreground text-[10px] font-bold leading-none">{a.approver.name}</span>
                                <span className="text-muted-foreground text-[9px] font-medium leading-tight">
                                    {a.decided_at || a.approver.email}
                                </span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="bg-muted-foreground/10 text-muted-foreground flex h-5 w-5 items-center justify-center rounded-full">
                                <i className="fa-solid fa-user-clock text-[8px]" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-muted-foreground text-[10px] font-bold leading-none">
                                    {a.target_approvers || `Menunggu ${a.role || 'Approver'}`}
                                </span>
                            </div>
                        </>
                    )}
                </div>

                {a.comment && (
                    <div className="bg-muted/30 text-muted-foreground border-border/40 mt-2 rounded-lg border p-2 text-[9px] font-medium italic leading-snug">
                        "{a.comment}"
                    </div>
                )}

                {a.step_type === 'SIGNING' && a.status === 'pending' && (
                    <div className="mt-4 space-y-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/20 dark:bg-blue-950/10 text-foreground">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/20">
                                    <i className="fa-solid fa-pen-nib text-sm" />
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-black tracking-widest text-blue-700 uppercase dark:text-blue-400">
                                        Progres Penandatanganan
                                    </h4>
                                    <p className="text-[10px] font-bold text-blue-600/70 dark:text-blue-400/60">Fase: {signingPhase.replace('_', ' ')}</p>
                                </div>
                            </div>
                            <span className="text-sm font-black text-blue-600 dark:text-blue-400">{signingState?.progress || 0}%</span>
                        </div>

                        <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200/50 dark:bg-blue-900/20">
                            <div className="h-full bg-blue-500 transition-all duration-700 ease-out" style={{ width: `${signingState?.progress || 0}%` }} />
                        </div>

                        <div className="space-y-2">
                            {signingPhase === 'SETUP' && (
                                <div className="text-blue-600/60 flex items-center gap-2 text-[10px] italic">
                                    <Loader2 size={12} className="animate-spin" />
                                    <span>Menunggu Staff Legal melakukan konfigurasi delegasi...</span>
                                </div>
                            )}

                            {signingPhase === 'P1_PENDING' && (
                                <>
                                    {!isP1 ? (
                                        <p className="text-blue-600/60 text-[10px] italic">
                                            Menunggu Pihak 1 mengunggah dokumen yang telah ditandatangani.
                                        </p>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            <p className="text-blue-700 text-[10px] font-black uppercase tracking-wider">Aksi Pihak 1:</p>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleSigningAction('download')}
                                                    className="border-blue-200 text-blue-700 hover:bg-blue-100 gap-2 text-[10px] font-bold shadow-sm"
                                                >
                                                    <Download size={12} /> Unduh Draft
                                                </Button>
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        id="p1-upload"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const f = e.target.files?.[0];
                                                            if (f) handleSigningAction('upload', f);
                                                        }}
                                                        disabled={!p1Downloaded || uploading}
                                                    />
                                                    <Button
                                                        size="sm"
                                                        variant="primary"
                                                        onClick={() => document.getElementById('p1-upload')?.click()}
                                                        disabled={!p1Downloaded || uploading}
                                                        className="bg-blue-600 hover:bg-blue-700 gap-2 text-[10px] font-bold shadow-md shadow-blue-500/20"
                                                    >
                                                        {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                                                        Unggah TTD P1
                                                    </Button>
                                                </div>
                                            </div>
                                            {!p1Downloaded && (
                                                <p className="text-red-500 text-[9px] font-bold italic">* Anda wajib mengunduh draft terlebih dahulu.</p>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                            {signingPhase === 'P2_PENDING' && (
                                <>
                                    {!isP2 ? (
                                        <p className="text-blue-600/60 text-[10px] italic">
                                            Menunggu Pihak 2 melakukan finalisasi penandatanganan.
                                        </p>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            <p className="text-blue-700 text-[10px] font-black uppercase tracking-wider">Aksi Pihak 2:</p>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleSigningAction('download')}
                                                    className="border-blue-200 text-blue-700 hover:bg-blue-100 gap-2 text-[10px] font-bold shadow-sm"
                                                >
                                                    <Download size={12} /> Unduh TTD P1
                                                </Button>
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        id="p2-upload"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const f = e.target.files?.[0];
                                                            if (f) handleSigningAction('upload', f);
                                                        }}
                                                        disabled={!p2Downloaded || uploading}
                                                    />
                                                    <Button
                                                        size="sm"
                                                        variant="primary"
                                                        onClick={() => document.getElementById('p2-upload')?.click()}
                                                        disabled={!p2Downloaded || uploading}
                                                        className="bg-blue-600 hover:bg-blue-700 gap-2 text-[10px] font-bold shadow-md shadow-blue-500/20"
                                                    >
                                                        {uploading ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                                                        Unggah Final Agreement
                                                    </Button>
                                                </div>
                                            </div>
                                            {!p2Downloaded && (
                                                <p className="text-red-500 text-[9px] font-bold italic">
                                                    * Anda wajib mengunduh dokumen TTD Pihak 1 terlebih dahulu.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const renderInitiator = (isOnly: boolean) => (
        <div key="initiator" className={cn('flex gap-3', !isOnly ? 'relative pb-5' : '')}>
            {!isOnly && <div className="bg-border/60 absolute top-7 bottom-0 left-[11.5px] w-0.5" />}
            <div className="relative z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 border-success bg-success text-white shadow-md transition-transform duration-300">
                <Send size={10} strokeWidth={3} />
            </div>
            <div className="flex-1 rounded-xl border border-success/20 bg-success/5 p-2.5 px-3 shadow-sm transition-all duration-300">
                <div className="flex flex-wrap items-center justify-between gap-2 text-foreground">
                    <span className="text-[11px] font-black tracking-tight uppercase leading-tight">Pengajuan Awal</span>
                    <span className="rounded-full bg-success/20 px-2 py-0.5 text-[9px] font-black tracking-wider text-success uppercase">
                        SELESAI
                    </span>
                </div>
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-border/20 bg-background/40 py-1.5 px-2">
                    <Avatar user={creator} size="xs" className="ring-1 ring-background shadow-sm h-5 w-5" />
                    <div className="flex flex-col">
                        <span className="text-foreground text-[10px] font-bold leading-none">{creator?.name}</span>
                        <span className="text-muted-foreground text-[9px] font-medium">
                            {submittedAt || 'Sudah Diajukan'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderProjected = () => (
        <div key="projected" className="relative flex gap-3 pb-5">
            <div className="bg-border/60 absolute top-7 bottom-0 left-[11.5px] w-0.5" />
            <div className="relative z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 border-border bg-muted text-muted-foreground shadow-sm">
                <Info size={10} strokeWidth={3} />
            </div>
            <div className="flex-1 rounded-xl border border-dashed border-border/40 bg-muted/5 p-2.5 px-3 transition-all">
                <div className="flex items-center justify-between text-foreground">
                    <span className="text-[11px] font-black tracking-tight text-foreground/40 uppercase leading-tight">Atasan Langsung</span>
                    <span className="rounded-full bg-muted-foreground/10 px-2 py-0.5 text-[9px] font-black tracking-wider text-muted-foreground uppercase">
                        Estimasi
                    </span>
                </div>
                <div className="mt-1 text-[9px] font-semibold text-muted-foreground/60 italic">Status: {creator.department_id ? 'Pemeriksa Tersedia' : 'Dept Belum Diatur'}</div>
            </div>
        </div>
    );

    return (
        <div className="animate-in fade-in relative flex flex-col gap-6 duration-500">
            <div className="mb-2 flex items-center gap-4">
                <div className="flex-1">
                    <SearchInput
                        placeholder="CARI NAMA / ROLE..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-10 text-[10px] uppercase"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <FilterPopover
                        categories={filterCategories}
                        activeFilters={{
                            status: statusFilter ? [statusFilter] : [],
                            role: roleFilter ? [roleFilter] : [],
                            department: deptFilter ? [deptFilter] : [],
                        }}
                        onFilterChange={(key, val) => {
                            const firstVal = Array.isArray(val) ? (val[0] || '') : val;
                            if (key === 'status') setStatusFilter(statusFilter === firstVal ? '' : firstVal);
                            if (key === 'role') setRoleFilter(roleFilter === firstVal ? '' : firstVal);
                            if (key === 'department') setDeptFilter(deptFilter === firstVal ? '' : firstVal);
                        }}
                        onReset={() => {
                            setStatusFilter('');
                            setRoleFilter('');
                            setDeptFilter('');
                        }}
                        totalResults={filteredSteps.length}
                    >
                        <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                                'border-surface-border text-text-main hover:bg-surface-muted h-10 gap-2 px-4 transition-all',
                                activeCount > 0 && 'border-primary bg-primary text-primary-foreground',
                            )}
                        >
                            <ListFilter size={14} strokeWidth={3} />
                            <span className="text-[10px] uppercase">Filter</span>
                            {activeCount > 0 && (
                                <span className="text-primary ml-1 flex h-4 w-4 items-center justify-center rounded-md bg-white text-[8px] font-bold">
                                    {activeCount}
                                </span>
                            )}
                        </Button>
                    </FilterPopover>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportPdf}
                        disabled={isExporting}
                        className="dark:bg-sidebar border-surface-border bg-surface-base text-text-desc hover:text-text-main h-10 w-10 p-0 transition-all disabled:opacity-20"
                    >
                        {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} strokeWidth={2.5} />}
                    </Button>
                </div>
            </div>

            {/* FilterPopover trigger wraps the button above */}

            <div className="relative px-2">
                {!activeCount &&
                    !search &&
                    !approvals.some((a) => a.sequence === 1) &&
                    renderInitiator(filteredSteps.length === 0 && !showProjectedManager)}
                {!activeCount && !search && showProjectedManager && renderProjected()}
                {filteredSteps.map((a, i) => renderStep(a, i, i === filteredSteps.length - 1))}
            </div>
        </div>
    );
}
