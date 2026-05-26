import { Button } from '@/components/ui/base/Button';
import { FilterCategory, FilterSheet } from '@/components/ui/data/FilterSheet';
import { SearchInput } from '@/components/ui/forms/SearchInput';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { Contract, ContractApproval, UserProfile } from '@/types/contracts';
import axios from 'axios';
import { Check, Clock, Download, Info, ListFilter, Loader2, Send, X } from 'lucide-react';
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
    const [isFilterOpen, setIsFilterOpen] = useState(false);
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
        <div key={a.id} className={`flex gap-4 ${!isLast ? 'relative pb-8' : ''}`}>
            {!isLast && <div className="absolute top-8 bottom-0 left-[13px] w-px bg-surface-border" />}
            <div
                className={`relative z-10 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border shadow-sm ${dotCls[a.status] ?? dotCls.waiting}`}
            >
                {a.status === 'approved' ? (
                    <Check size={12} strokeWidth={3} />
                ) : a.status === 'rejected' ? (
                    <X size={12} strokeWidth={3} />
                ) : (
                    <Clock size={12} />
                )}
            </div>
            <div
                className={cn(
                    'flex-1 rounded-xl border bg-surface-base transition-all hover:shadow-md dark:bg-slate-900/40',
                    a.status === 'approved' && 'border-success/20 bg-success/5',
                    a.status === 'pending' && 'border-warning/20 bg-warning/5',
                    a.status === 'rejected' && 'border-danger/20 bg-danger/5',
                    a.status === 'waiting' && 'border-surface-border bg-surface-muted/5 opacity-75',
                )}
            >
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-col">
                        <span className="text-text-main text-sm font-bold">
                            {a.sequence === 1 ? 'Pengajuan Awal (Drafting)' : a.step_name || a.role || 'Unnamed Step'}
                        </span>
                        {a.step_description && a.step_description !== a.step_name && (
                            <span className="text-text-desc line-clamp-1 text-[10px] italic">{a.step_description}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <StatusBadge status={a.status} />
                    </div>
                </div>

                <div className="border-surface-border/40 mt-3 border-t pt-2.5">
                    {a.approver ? (
                        <div className="flex items-center gap-2">
                            <Avatar user={a.approver} size="sm" />
                            <div className="flex flex-col">
                                <span className="text-text-main text-xs font-semibold">{a.approver.name}</span>
                                <span className="text-text-desc text-[10px]">
                                    {a.approver.email} {a.decided_at ? ` • ${a.decided_at}` : ''}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <div className="bg-surface-muted text-text-desc flex h-6 w-6 items-center justify-center rounded-lg">
                                <i className="fa-solid fa-user-clock text-[10px]" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-text-main/70 text-xs font-medium">
                                    {a.target_approvers || `Menunggu ${a.role || 'Approver'}`}
                                </span>
                                {a.target_emails && <span className="text-text-desc/60 text-[10px]">{a.target_emails}</span>}
                            </div>
                        </div>
                    )}
                </div>

                {a.comment && (
                    <div className="bg-surface-muted/30 text-text-desc border-surface-border mt-2 rounded-lg border-l-2 p-2 text-[10px] italic">
                        "{a.comment}"
                    </div>
                )}

                {a.step_type === 'SIGNING' && a.status === 'pending' && (
                    <div className="mt-4 space-y-4 rounded-xl border border-info/20 bg-info/5 p-4 dark:border-info/20 dark:bg-info/5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-info text-white shadow-lg shadow-info/20">
                                    <i className="fa-solid fa-pen-nib text-xs" />
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-bold tracking-wider text-info uppercase dark:text-info">
                                        Progres Penandatanganan
                                    </h4>
                                    <p className="text-[10px] font-medium text-info/70 dark:text-info/60">
                                        Fase: {signingPhase.replace('_', ' ')}
                                    </p>
                                </div>
                            </div>
                            <span className="text-sm font-black text-info dark:text-info">{signingState?.progress || 0}%</span>
                        </div>

                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-info/20 dark:bg-info/10">
                            <div className="h-full bg-info transition-all duration-500" style={{ width: `${signingState?.progress || 0}%` }} />
                        </div>

                        <div className="space-y-2">
                            {signingPhase === 'SETUP' && (
                                <div className="flex items-center gap-2 text-[10px] text-info/60 italic">
                                    <Loader2 size={12} className="animate-spin" />
                                    <span>Menunggu Staff Legal melakukan konfigurasi delegasi...</span>
                                </div>
                            )}

                            {signingPhase === 'P1_PENDING' && (
                                <>
                                    {!isP1 ? (
                                        <p className="text-muted-foreground text-[10px] italic">
                                            Menunggu Pihak 1 mengunggah dokumen yang telah ditandatangani.
                                        </p>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            <p className="text-[10px] font-bold text-primary uppercase">Aksi Pihak 1:</p>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleSigningAction('download')}
                                                    className="gap-2 border-primary/20 text-[10px] text-primary hover:bg-primary/5"
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
                                                        className="gap-2 text-[10px]"
                                                    >
                                                        {uploading ? (
                                                            <Loader2 size={12} className="animate-spin" />
                                                        ) : (
                                                            <Upload size={12} />
                                                        )}
                                                        Unggah TTD P1
                                                    </Button>
                                                </div>
                                            </div>
                                            {!p1Downloaded && (
                                                <p className="text-[9px] font-medium text-danger">* Anda wajib mengunduh draft terlebih dahulu.</p>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                            {signingPhase === 'P2_PENDING' && (
                                <>
                                    {!isP2 ? (
                                        <p className="text-muted-foreground text-[10px] italic">
                                            Menunggu Pihak 2 melakukan finalisasi penandatanganan.
                                        </p>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            <p className="text-[10px] font-bold text-primary uppercase">Aksi Pihak 2:</p>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleSigningAction('download')}
                                                    className="gap-2 border-primary/20 text-[10px] text-primary hover:bg-primary/5"
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
                                                        className="gap-2 text-[10px]"
                                                    >
                                                        {uploading ? (
                                                            <Loader2 size={12} className="animate-spin" />
                                                        ) : (
                                                            <FileText size={12} />
                                                        )}
                                                        Unggah Final Agreement
                                                    </Button>
                                                </div>
                                            </div>
                                            {!p2Downloaded && (
                                                <p className="text-[9px] font-medium text-danger">
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
        <div key="initiator" className={`flex gap-4 ${!isOnly ? 'relative pb-8' : ''}`}>
            {!isOnly && <div className="absolute top-8 bottom-0 left-[13px] w-px bg-surface-border" />}
            <div className="relative z-10 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-success bg-success text-white shadow-md dark:border-white dark:bg-white dark:text-primary">
                <Send size={12} />
            </div>
            <div className="border-border/60 bg-muted/10 flex-1 rounded-xl border p-4 transition-all hover:shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-text-main text-sm font-bold">Pengajuan Awal</span>
                    <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success uppercase">
                        SELESAI
                    </span>
                </div>
                <div className="border-border/40 mt-3 flex items-center gap-2 border-t pt-2.5">
                    <Avatar user={creator} size="sm" />
                    <div className="flex flex-col">
                        <span className="text-text-main text-xs font-semibold">{creator?.name}</span>
                        <span className="text-text-desc text-[10px]">
                            {creator?.email} • {submittedAt ? `Diajukan: ${submittedAt}` : 'Belum diajukan'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderProjected = () => (
        <div key="projected" className="relative flex gap-4 pb-8">
            <div className="absolute top-8 bottom-0 left-[13px] w-px bg-surface-border" />
            <div className="border-surface-border bg-surface-muted text-text-desc relative z-10 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border shadow-sm">
                <Info size={12} />
            </div>
            <div className="border-surface-border bg-surface-muted/5 flex-1 rounded-xl border border-dashed p-4 transition-all">
                <div className="flex items-center justify-between">
                    <span className="text-text-main/60 text-sm font-bold">Atasan Langsung (Manager Dept)</span>
                    <span className="bg-surface-muted text-text-desc rounded-full px-2 py-0.5 text-[10px] font-bold">Fase 1</span>
                </div>
                <div className="text-text-desc mt-2 text-xs font-medium">
                    Status: {creator.department_id ? 'Tersedia' : 'Belum Ditentukan'}
                </div>
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
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsFilterOpen(true)}
                        className={cn(
                            'h-10 gap-2 border-surface-border px-4 text-text-main transition-all hover:bg-surface-muted',
                            activeCount > 0 && 'border-primary bg-primary text-primary-foreground',
                        )}
                    >
                        <ListFilter size={14} strokeWidth={3} />
                        <span className="text-[10px] uppercase">Filter</span>
                        {activeCount > 0 && (
                            <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-md bg-white text-[8px] font-bold text-primary">
                                {activeCount}
                            </span>
                        )}
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportPdf}
                        disabled={isExporting}
                        className="dark:bg-sidebar h-10 w-10 border-surface-border bg-surface-base p-0 text-text-desc transition-all hover:text-text-main disabled:opacity-20"
                    >
                        {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} strokeWidth={2.5} />}
                    </Button>
                </div>
            </div>

            <FilterSheet
                isOpen={isFilterOpen}
                onOpenChange={setIsFilterOpen}
                title="FILTER ALUR"
                description="Saring tahapan persetujuan berdasarkan kriteria"
                categories={filterCategories}
                activeFilters={{
                    status: statusFilter ? [statusFilter] : [],
                    role: roleFilter ? [roleFilter] : [],
                    department: deptFilter ? [deptFilter] : [],
                }}
                onFilterChange={(key, val) => {
                    if (key === 'status') setStatusFilter(statusFilter === val ? '' : val);
                    if (key === 'role') setRoleFilter(roleFilter === val ? '' : val);
                    if (key === 'department') setDeptFilter(deptFilter === val ? '' : val);
                }}
                onReset={() => {
                    setStatusFilter('');
                    setRoleFilter('');
                    setDeptFilter('');
                }}
                totalResults={filteredSteps.length}
            />

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
