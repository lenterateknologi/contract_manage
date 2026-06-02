import { Button } from '@/components/ui/base/Button';
import { FilterCategory, FilterPopover } from '@/components/ui/data/FilterPopover';
import { SearchInput } from '@/components/ui/forms/SearchInput';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { Contract, ContractApproval, UserProfile } from '@/types/contracts';
import axios from 'axios';
import { Check, CheckCircle2, Clock, Download, FileText, Info, ListFilter, Loader2, Send, Upload, X } from 'lucide-react';
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
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [roleFilter, setRoleFilter] = useState<string>('');
    const [deptFilter, setDeptFilter] = useState<string>('');
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);
    const [isExporting, setIsExporting] = useState(false);
    const [jobStatus, setJobStatus] = useState<any>(null);
    const [uploading, setUploading] = useState(false);

    const isP1 = useMemo(() => approvals.some(a => a.role === 'Pihak 1' && a.user_id === meId), [approvals, meId]);
    const isP2 = useMemo(() => approvals.some(a => a.role === 'Pihak 2' && a.user_id === meId), [approvals, meId]);
    const p1Downloaded = contract.metadata?.p1_downloaded_at;
    const p2Downloaded = contract.metadata?.p2_downloaded_at;

    const handleSigningAction = async (action: 'download' | 'upload', file?: File) => {
        if (action === 'download') {
            const versions = contract.versions?.filter((v) => v.document_type === 'agreement') || [];
            if (versions.length === 0) {
                showToast('Tidak ada dokumen agreement yang ditemukan.', 'danger');
                return;
            }
            const latest = versions.sort((a, b) => b.version_no - a.version_no)[0];
            window.open(`/api/contracts/versions/${latest.id}/download`, '_blank');

            const newMeta = { ...contract.metadata };
            const key = isP1 ? 'p1_downloaded_at' : 'p2_downloaded_at';
            newMeta[key] = new Date().toISOString();

            try {
                await axios.patch(`/api/contracts/${contract.id}`, { metadata: newMeta });
                showToast('Dokumen berhasil diunduh.', 'success');
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
        // Sort primarily by sort_order if available, then by creation time or id
        return result.sort((a, b) => {
            if (a.sort_order !== undefined && b.sort_order !== undefined && a.sort_order !== b.sort_order) {
                return (a.sort_order || 0) - (b.sort_order || 0);
            }
            if (a.created_at && b.created_at) {
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            }
            return a.id.localeCompare(b.id);
        });
    }, [approvals, statusFilter, roleFilter, deptFilter, debouncedSearch]);

    // Build a hierarchical tree of steps
    const stepTree = useMemo(() => {
        const blocks: any[] = [];
        let currentBlock: any = null;

        filteredSteps.forEach((a) => {
            const wfId = a.workflow_step?.workflow_id || contract.workflow_id;
            const wfName = a.workflow_step?.workflow?.name || contract.workflow?.name || 'Alur Kerja';

            if (!currentBlock || currentBlock.workflowId !== wfId) {
                currentBlock = {
                    workflowId: wfId,
                    workflowName: wfName,
                    isSubWorkflow: wfId !== contract.workflow_id,
                    groups: [],
                };
                blocks.push(currentBlock);
            }

            const seq = a.sequence;
            let group = currentBlock.groups.find((g: any) => g.sequence === seq);
            if (!group) {
                group = {
                    sequence: seq,
                    stepName: '',
                    stepDescription: '',
                    items: [],
                };
                currentBlock.groups.push(group);
            }
            group.items.push(a);
        });
        
        // After grouping, ensure each group is named correctly and items are sorted properly
        blocks.forEach(block => {
            block.groups.forEach((group: any) => {
                // Find the main step (the one that is not a sub-step, i.e., sub_step is null)
                const mainStep = group.items.find((a: any) => a.sub_step == null) || group.items[0];
                group.stepName = mainStep.step_name || mainStep.role || 'Persetujuan';
                group.stepDescription = mainStep.step_description;
                
                // Sort items so the main step (sub_step == null) is ALWAYS FIRST
                group.items.sort((a: any, b: any) => {
                    if (a.sub_step == null && b.sub_step != null) return -1;
                    if (a.sub_step != null && b.sub_step == null) return 1;
                    
                    if (a.sub_step != null && b.sub_step != null) {
                        return Number(a.sub_step) - Number(b.sub_step);
                    }
                    
                    // Fallback to ID or created_at if both are main steps (shouldn't happen)
                    if (a.created_at && b.created_at) {
                        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                    }
                    return a.id.localeCompare(b.id);
                });
            });
            
            // Also ensure groups are sorted by sequence
            block.groups.sort((a: any, b: any) => Number(a.sequence) - Number(b.sequence));
        });

        return blocks;
    }, [filteredSteps, contract.workflow_id, contract.workflow?.name]);

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

    const renderApprovalCard = (a: ContractApproval, stepNumber: string) => {
        const isStaged = !a.is_active;
        const isApproved = a.status === 'approved';
        const isRejected = a.status === 'rejected';
        const isPending = a.status === 'pending' && a.is_active;
        const isWaiting = a.status === 'waiting';

        return (
            <div
                key={a.id}
                className={cn(
                    'group relative rounded-xl border p-3 transition-all duration-300 bg-surface-base shadow-xs',
                    isApproved && 'border-emerald-500/20 bg-emerald-50/10 dark:bg-emerald-500/5 hover:border-emerald-500/40',
                    isRejected && 'border-rose-500/20 bg-rose-50/10 dark:bg-rose-500/5 hover:border-rose-500/40',
                    isPending && 'border-amber-500/30 bg-amber-50/10 dark:bg-amber-500/5 shadow-md ring-1 ring-amber-500/10 hover:border-amber-500/50',
                    isWaiting && 'border-slate-200 bg-slate-50/50 opacity-70 dark:border-slate-800 dark:bg-slate-900/50',
                    isStaged && 'border-slate-300 border-dashed bg-slate-50/30 opacity-60 grayscale dark:border-slate-700 dark:bg-slate-900/20',
                    'hover:shadow-sm'
                )}
            >
                {/* Visual indicator bar on the left */}
                <div className={cn(
                    "absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-all",
                    isApproved && "bg-emerald-500",
                    isRejected && "bg-rose-500",
                    isPending && "bg-amber-500 animate-pulse",
                    (isWaiting || isStaged) && "bg-slate-300 dark:bg-slate-700"
                )} />

                <div className="flex flex-col gap-2.5">
                    {/* Header: Step & Role */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "flex h-5 min-w-8 items-center justify-center rounded-md px-1.5 text-[9px] font-black tracking-tighter transition-colors",
                                isApproved ? "bg-emerald-500 text-white" :
                                    isRejected ? "bg-rose-500 text-white" :
                                        isPending ? "bg-amber-500 text-white" :
                                            "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                            )}>
                                {stepNumber}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-text-main">
                                {a.role || 'Reviewer'}
                            </span>
                        </div>
                        <div className="flex items-center shrink-0">
                            {isStaged ? (
                                <div className="flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[8px] font-black text-slate-500 uppercase tracking-wider dark:border-slate-700 dark:bg-slate-800">
                                    <Clock size={8} /> Draft
                                </div>
                            ) : (
                                <StatusBadge status={a.status} />
                            )}
                        </div>
                    </div>

                    {/* Approver Details */}
                    <div className={cn(
                        "flex items-center gap-3 rounded-lg border p-2 transition-all",
                        a.approver
                            ? "bg-white/60 border-slate-100 dark:bg-slate-950/40 dark:border-slate-800/50"
                            : "bg-slate-50/50 border-dashed border-slate-200 dark:bg-slate-900/30 dark:border-slate-800"
                    )}>
                        {a.approver ? (
                            <>
                                <Avatar user={a.approver} size="sm" className="ring-2 ring-white dark:ring-slate-900 shadow-sm h-6 w-6" />
                                <div className="flex flex-col overflow-hidden">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-text-main text-[10px] font-black leading-tight truncate">{a.approver.name}</span>
                                        {isApproved && <Check size={10} className="text-emerald-500 shrink-0" strokeWidth={4} />}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-text-soft text-[8.5px] font-medium leading-none truncate">
                                            {a.approver.email}
                                        </span>
                                        {a.decided_at && (
                                            <>
                                                <div className="h-0.5 w-0.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                                                <span className="text-text-soft text-[8.5px] font-bold leading-none flex items-center gap-1 shrink-0">
                                                    <Clock size={8} /> {a.decided_at}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="bg-slate-200/50 text-slate-400 flex h-6 w-6 items-center justify-center rounded-full dark:bg-slate-800/50 dark:text-slate-600">
                                    <Clock size={12} strokeWidth={2.5} />
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-text-soft text-[10px] font-bold leading-tight uppercase tracking-tight">
                                        Menunggu Keputusan
                                    </span>
                                    <span className="text-text-muted text-[8.5px] font-medium leading-none mt-1 truncate">
                                        Target: {a.target_approvers || `Semua ${a.role || 'Approver'}`}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Comment Section */}
                    {a.comment && (
                        <div className="relative mt-0.5">
                            <div className="absolute -left-1 top-2 w-2 h-2 bg-indigo-50 dark:bg-indigo-950/20 rotate-45 border-l border-b border-indigo-100 dark:border-indigo-900/30" />
                            <div className="bg-indigo-50/50 text-indigo-700/90 dark:bg-indigo-950/20 dark:text-indigo-300 border-indigo-100 dark:border-indigo-900/30 rounded-lg border px-3 py-2 text-[9px] font-medium leading-relaxed shadow-xs italic">
                                <span className="text-[12px] font-serif leading-none mr-1 opacity-50">"</span>
                                {a.comment}
                                <span className="text-[12px] font-serif leading-none ml-1 opacity-50">"</span>
                            </div>
                        </div>
                    )}

                    {/* Action Block for Pihak 1 / Pihak 2 */}
                    {a.status === 'pending' && a.user_id === meId && (a.role === 'Pihak 1' || a.role === 'Pihak 2') && (
                        <div className="mt-2 flex flex-col gap-2.5 rounded-xl border border-blue-100 bg-blue-50/50 p-3 dark:border-blue-900/20 dark:bg-blue-950/10">
                            <p className="text-blue-700 text-[10px] font-black uppercase tracking-wider dark:text-blue-400">
                                Aksi Anda ({a.role}):
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleSigningAction('download')}
                                    className="border-blue-200 text-blue-700 hover:bg-blue-100 gap-1.5 text-[9px] font-bold shadow-xs py-1 h-8 flex-1"
                                >
                                    <Download size={12} /> Unduh Draft
                                </Button>
                                
                                <div className="flex-[2] flex gap-2">
                                    <input
                                        type="file"
                                        id={`upload-${a.id}`}
                                        className="hidden"
                                        onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f) handleSigningAction('upload', f);
                                        }}
                                        disabled={!(a.role === 'Pihak 1' ? p1Downloaded : p2Downloaded) || uploading}
                                    />
                                    <Button
                                        size="sm"
                                        variant="primary"
                                        onClick={() => document.getElementById(`upload-${a.id}`)?.click()}
                                        disabled={!(a.role === 'Pihak 1' ? p1Downloaded : p2Downloaded) || uploading}
                                        className="bg-blue-600 hover:bg-blue-700 gap-1.5 text-[9px] font-bold shadow-sm shadow-blue-500/10 py-1 h-8 w-full"
                                    >
                                        {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                                        Unggah & Selesaikan
                                    </Button>
                                </div>
                            </div>
                            {!(a.role === 'Pihak 1' ? p1Downloaded : p2Downloaded) && (
                                <div className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-rose-50 border border-rose-100 mt-1">
                                    <Info size={10} className="text-rose-500 shrink-0" />
                                    <p className="text-rose-600 text-[8px] font-bold italic">
                                        Anda wajib mengunduh draft terlebih dahulu sebelum mengunggah hasil TTD.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderInitiator = (isOnly: boolean) => (
        <div key="initiator" className={cn('flex gap-3', !isOnly ? 'relative pb-4' : '')}>
            {!isOnly && <div className="bg-border/60 absolute top-6 bottom-0 left-[9.5px] w-0.5" />}
            <div className="relative z-10 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-emerald-500 bg-emerald-500 text-white shadow-xs transition-transform duration-300">
                <Send size={9} strokeWidth={3} />
            </div>
            <div className="flex-1 group relative rounded-xl border border-emerald-500/20 bg-emerald-50/10 dark:bg-emerald-500/5 p-3 shadow-xs transition-all duration-300 hover:border-emerald-500/40">
                <div className="absolute left-0 top-3 bottom-3 w-1 bg-emerald-500 rounded-r-full" />

                <div className="flex flex-col gap-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-1.5 text-foreground pl-1">
                        <span className="text-[10px] font-black tracking-widest uppercase leading-tight text-text-main">Pengajuan Awal</span>
                        <div className="flex items-center scale-85 origin-right">
                            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[8px] font-black tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
                                SELESAI
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border border-emerald-100 dark:border-emerald-900/30 bg-white/60 dark:bg-slate-950/40 p-2 transition-all">
                        <Avatar user={creator} size="sm" className="ring-2 ring-white dark:ring-slate-900 shadow-sm h-6 w-6" />
                        <div className="flex flex-col overflow-hidden">
                            <div className="flex items-center gap-1.5">
                                <span className="text-text-main text-[10px] font-black leading-tight truncate">{creator?.name}</span>
                                <Check size={10} className="text-emerald-500 shrink-0" strokeWidth={4} />
                            </div>
                            <span className="text-text-soft text-[8.5px] font-bold leading-none mt-0.5 flex items-center gap-1">
                                <Clock size={8} /> {submittedAt || 'Sudah Diajukan'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderProjected = () => (
        <div key="projected" className="relative flex gap-3 pb-4">
            <div className="bg-border/60 absolute top-6 bottom-0 left-[9.5px] w-0.5" />
            <div className="relative z-10 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-slate-500 shadow-2xs dark:border-slate-700 dark:bg-slate-800">
                <Info size={9} strokeWidth={3} />
            </div>
            <div className="flex-1 group relative rounded-xl border border-dashed border-slate-300 bg-slate-50/50 dark:bg-slate-900/20 p-3 transition-all hover:border-slate-400">
                <div className="absolute left-0 top-3 bottom-3 w-1 bg-slate-300 dark:bg-slate-700 rounded-r-full" />

                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-foreground pl-1">
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase leading-tight">Atasan Langsung</span>
                        <div className="flex items-center scale-85 origin-right">
                            <span className="rounded-full bg-slate-200/50 px-2 py-0.5 text-[8px] font-black tracking-wider text-slate-500 uppercase dark:bg-slate-800">
                                Estimasi
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/20 p-2">
                        <div className="bg-slate-100 text-slate-300 flex h-6 w-6 items-center justify-center rounded-full dark:bg-slate-800 dark:text-slate-700">
                            <i className="fa-solid fa-user-clock text-[10px]" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-slate-400 text-[9px] font-bold leading-none italic uppercase tracking-tighter">
                                {creator.department_id ? 'Pemeriksa Otomatis' : 'Departemen Belum Diatur'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="animate-in fade-in relative flex flex-col gap-4 duration-500">
            <div className="mb-1 flex items-center gap-3">
                <div className="flex-1">
                    <SearchInput
                        placeholder="CARI NAMA / ROLE..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-8.5 text-[9px] uppercase"
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
                                'border-surface-border text-text-main hover:bg-surface-muted h-8.5 gap-1.5 px-3 transition-all',
                                activeCount > 0 && 'border-primary bg-primary text-primary-foreground',
                            )}
                        >
                            <ListFilter size={12} strokeWidth={3} />
                            <span className="text-[9px] uppercase">Filter</span>
                            {activeCount > 0 && (
                                <span className="text-primary ml-1 flex h-3.5 w-3.5 items-center justify-center rounded-md bg-white text-[8px] font-bold">
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
                        className="dark:bg-sidebar border-surface-border bg-surface-base text-text-desc hover:text-text-main h-8.5 w-8.5 p-0 transition-all disabled:opacity-20 animate-in fade-in"
                    >
                        {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} strokeWidth={2.5} />}
                    </Button>
                </div>
            </div>

            <div className="relative px-1 space-y-8">
                {!activeCount &&
                    !search &&
                    !approvals.some((a) => a.sequence === 1) &&
                    renderInitiator(stepTree.length === 0 && !showProjectedManager)}
                {!activeCount && !search && showProjectedManager && renderProjected()}

                {stepTree.map((block, bIdx) => {
                    const isLastBlock = bIdx === stepTree.length - 1;

                    return (
                        <div key={block.workflowId + bIdx} className={cn(
                            "relative space-y-6",
                            block.isSubWorkflow && "ml-4 border-l-2 border-dashed border-indigo-200 pl-4 py-2 bg-indigo-50/20 rounded-r-xl dark:border-indigo-900/40 dark:bg-indigo-950/5"
                        )}>
                            {block.isSubWorkflow && (
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="bg-indigo-500 h-1.5 w-1.5 rounded-full animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-tighter text-indigo-600 dark:text-indigo-400">
                                        Sub-Workflow: {block.workflowName}
                                    </span>
                                </div>
                            )}

                            {block.groups.map((group: { sequence: number; stepName: string; stepDescription?: string; items: ContractApproval[] }, idx: number) => {
                                const isLastGroup = idx === block.groups.length - 1 && isLastBlock;
                                return (
                                    <div key={group.sequence + idx} className="relative pl-7 pb-1.5">
                                        {/* Step connector line */}
                                        {!(idx === block.groups.length - 1 && isLastBlock) && (
                                            <div className="absolute left-[9px] top-5 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800" />
                                        )}

                                        {/* Step Sequence Number Indicator */}
                                        <div className={cn(
                                            "absolute left-0 top-0.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border font-extrabold text-[9px] shadow-2xs",
                                            block.isSubWorkflow
                                                ? "border-indigo-300 bg-indigo-100 text-indigo-600 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-400"
                                                : "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                                        )}>
                                            {group.sequence}
                                        </div>

                                        <div className="space-y-2">
                                            {/* Step Group Title & Details */}
                                            <div className="flex flex-col">
                                                <h3 className="text-[11px] font-black uppercase tracking-wider text-text-main">
                                                    {group.stepName === 'Persetujuan Tambahan' ? 'Persetujuan Tambahan' : `Tahap ${group.sequence}: ${group.stepName}`}
                                                </h3>
                                                {group.stepDescription && group.stepDescription !== group.stepName && (
                                                    <p className="text-[9px] font-medium text-text-soft italic mt-0.5 leading-relaxed">
                                                        {group.stepDescription}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Approvals listed under this group with L-shaped tree branches for ad-hoc items */}
                                            <div className="space-y-1.5">
                                                {(() => {
                                                    const subStepItems = group.items.filter((item: ContractApproval) => item.sub_step != null);
                                                    return group.items.map((a: ContractApproval) => {
                                                        const isSubStep = a.sub_step != null;
                                                        if (!isSubStep) {
                                                            return (
                                                                <div key={a.id} className="relative">
                                                                    {subStepItems.length > 0 && (
                                                                        <div className="absolute left-[9px] top-6 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800" />
                                                                    )}
                                                                    {renderApprovalCard(a, `${group.sequence}`)}
                                                                </div>
                                                            );
                                                        } else {
                                                            const subStepIdx = subStepItems.indexOf(a);
                                                            const isLastSubStep = subStepIdx === subStepItems.length - 1;
                                                            const stepNumber = `${group.sequence}.${a.sub_step}`;
                                                            return (
                                                                <div key={a.id} className="relative pl-6 animate-in fade-in duration-300">
                                                                    {/* Tree connector branch */}
                                                                    <div className="absolute left-[9px] top-0 bottom-0 pointer-events-none">
                                                                        {/* Vertical line segment */}
                                                                        <div className={cn(
                                                                            "absolute left-0 top-0 w-0.5 bg-slate-200 dark:bg-slate-800",
                                                                            isLastSubStep ? "h-[16px]" : "bottom-0"
                                                                        )} />
                                                                        {/* Horizontal branch line segment */}
                                                                        <div className="absolute left-0 top-[16px] w-3.5 h-0.5 bg-slate-200 dark:bg-slate-800" />
                                                                    </div>
                                                                    {renderApprovalCard(a, stepNumber)}
                                                                </div>
                                                            );
                                                        }
                                                    });
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
