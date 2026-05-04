import { Button } from '@/components/ui/base/Button';
import { cn } from '@/lib/utils';
import { Contract, ContractApproval, UserProfile } from '@/types/contracts';
import axios from 'axios';
import { Check, Clock, Download, Info, ListFilter, Loader2, Search, Send, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FilterSheet, FilterCategory } from '@/components/ui/data/FilterSheet';
import { useToast } from './Toast';
import { Avatar, StatusBadge } from './ui';
import { SearchInput } from '@/components/ui/forms/SearchInput';

interface Props {
    contract: Contract;
    approvals: ContractApproval[];
    creator: UserProfile;
    submittedAt?: string;
}

export default function ApprovalSteps({ contract, approvals, creator, submittedAt }: Props) {
    const { showToast, showProgress, hideProgress } = useToast();
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [roleFilter, setRoleFilter] = useState<string>('');
    const [deptFilter, setDeptFilter] = useState<string>('');
    const [search, setSearch] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [jobStatus, setJobStatus] = useState<any>(null);

    const iconMap: Record<string, string> = {
        approved: 'fa-check',
        pending: 'fa-ellipsis',
        rejected: 'fa-xmark',
        waiting: 'fa-minus',
    };
    const dotCls: Record<string, string> = {
        approved: 'bg-emerald-500 border-emerald-500 text-white dark:bg-emerald-600 dark:border-emerald-600 shadow-md',
        pending: 'bg-amber-500 border-amber-500 text-white dark:bg-amber-600 dark:border-amber-600 shadow-md animate-pulse',
        rejected: 'bg-red-500 border-red-500 text-white dark:bg-red-600 dark:border-red-600 shadow-md',
        waiting: 'bg-muted text-muted-foreground border-border dark:bg-white/10 dark:text-white/40 shadow-sm',
    };
    const noteCls: Record<string, string> = {
        approved: 'border-l-emerald-500 bg-emerald-50/10 dark:bg-emerald-500/5 text-foreground',
        rejected: 'border-l-red-500 bg-red-50/10 dark:bg-red-500/5 text-foreground font-semibold',
        pending: 'border-l-amber-500 bg-amber-50/10 dark:bg-amber-500/5 text-foreground',
        waiting: 'border-l-border bg-muted/20 text-muted-foreground/80',
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
        if (search) {
            const s = search.toLowerCase();
            result = result.filter(
                (a) =>
                    a.role?.toLowerCase().includes(s) || a.department_name?.toLowerCase().includes(s) || a.approver?.name?.toLowerCase().includes(s),
            );
        }
        return result.sort((a, b) => a.sequence - b.sequence);
    }, [approvals, statusFilter, roleFilter, deptFilter, search]);

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
                { label: 'APPROVED', value: 'approved' },
                { label: 'REJECTED', value: 'rejected' },
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
            {!isLast && <div className="absolute top-8 bottom-0 left-[13px] w-px bg-black/10 dark:bg-white/10" />}
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
            <div className={cn(
                "flex-1 rounded-xl border p-4 transition-all hover:shadow-md bg-white dark:bg-slate-900/40",
                a.status === 'approved' && "border-emerald-100 bg-emerald-50/10 dark:border-emerald-500/20 dark:bg-emerald-500/5",
                a.status === 'pending' && "border-amber-100 bg-amber-50/10 dark:border-amber-500/20 dark:bg-amber-500/5",
                a.status === 'rejected' && "border-red-100 bg-red-50/10 dark:border-red-500/20 dark:bg-red-500/5",
                a.status === 'waiting' && "border-border/60 bg-muted/5 opacity-75"
            )}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-bold text-foreground dark:text-white">
                        {a.role}
                    </span>
                    <span className="text-[10px] bg-muted/60 dark:bg-white/10 text-muted-foreground font-semibold px-2 py-0.5 rounded-full">
                        SEQ {a.sequence}
                    </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 font-medium">
                    {a.department_name ?? 'Matching Dept'}
                </div>

                {a.comment && (
                    <div className={`mt-3 border-l-2 px-3 py-1.5 text-[11px] leading-relaxed font-medium ${noteCls[a.status] ?? 'border-l-black/20 bg-black/5'}`}>
                        {a.comment}
                    </div>
                )}

                <div className="mt-3 border-t border-border/40 pt-2.5 flex flex-wrap items-center justify-between gap-3">
                    {a.status === 'approved' || a.status === 'rejected' ? (
                        <div className="flex items-center gap-2">
                            <Avatar user={a.approver} size="sm" />
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-foreground">{a.approver?.name}</span>
                                <span className="text-[10px] text-muted-foreground">Oleh {a.role}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <Clock size={14} className="opacity-70" />
                            <span>
                                {a.target_approvers ? `Penanggung Jawab: ${a.target_approvers}` : `Menunggu persetujuan ${a.role}`}
                            </span>
                        </div>
                    )}

                    {a.decided_at ? (
                        <div className="flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground dark:bg-white/5">
                            <Clock size={12} /> {a.decided_at}
                        </div>
                    ) : (
                        <StatusBadge status={a.status} />
                    )}
                </div>
            </div>
        </div>
    );

    const renderInitiator = (isOnly: boolean) => (
        <div key="initiator" className={`flex gap-4 ${!isOnly ? 'relative pb-8' : ''}`}>
            {!isOnly && <div className="absolute top-8 bottom-0 left-[13px] w-px bg-black/10 dark:bg-white/10" />}
            <div className="relative z-10 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-emerald-500 bg-emerald-500 text-white shadow-md dark:border-white dark:bg-white dark:text-[#172554]">
                <Send size={12} />
            </div>
            <div className="flex-1 rounded-xl border border-border/60 p-4 bg-muted/10 dark:bg-white/5 transition-all hover:shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-bold text-foreground">Pengajuan Awal</span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                        SELESAI
                    </span>
                </div>
                <div className="mt-3 border-t border-border/40 pt-2.5 flex items-center gap-2">
                    <Avatar user={creator} size="sm" />
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-foreground">{creator?.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                            {submittedAt ? `Diajukan: ${submittedAt}` : 'Belum diajukan'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderProjected = () => (
        <div key="projected" className="relative flex gap-4 pb-8">
            <div className="absolute top-8 bottom-0 left-[13px] w-px bg-black/10 dark:bg-white/10" />
            <div className="relative z-10 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted text-muted-foreground shadow-sm dark:bg-white/5 dark:text-white/40">
                <Info size={12} />
            </div>
            <div className="flex-1 rounded-xl border border-dashed border-border/80 p-4 bg-muted/5 dark:bg-white/[0.02] transition-all">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground/60">Atasan Langsung (Manager Dept)</span>
                    <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-bold text-muted-foreground dark:bg-white/10">Fase 1</span>
                </div>
                <div className="mt-2 text-xs font-medium text-muted-foreground">
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
                        className="h-10 text-[10px] tracking-widest uppercase"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsFilterOpen(true)}
                        className={cn(
                            'h-10 gap-2 rounded-xl border-black/10 px-4 font-bold text-black shadow-sm transition-all hover:bg-black/5 dark:border-white/10 dark:text-white dark:hover:bg-white/5',
                            activeCount > 0 && 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black',
                        )}
                    >
                        <ListFilter size={14} strokeWidth={3} />
                        <span className="text-[10px] tracking-widest uppercase">Filter</span>
                        {activeCount > 0 && (
                            <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-md bg-white text-[8px] font-bold text-black dark:bg-black dark:text-white">
                                {activeCount}
                            </span>
                        )}
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportPdf}
                        disabled={isExporting}
                        className="dark:bg-sidebar h-10 w-10 rounded-xl border-black/10 bg-white p-0 text-black/40 shadow-sm transition-all hover:text-black disabled:opacity-20 dark:border-white/10 dark:text-white/40 dark:hover:text-white"
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
                {!activeCount && !search && renderInitiator(filteredSteps.length === 0 && !showProjectedManager)}
                {!activeCount && !search && showProjectedManager && renderProjected()}
                {filteredSteps.map((a, i) => renderStep(a, i, i === filteredSteps.length - 1))}
            </div>
        </div>
    );
}
