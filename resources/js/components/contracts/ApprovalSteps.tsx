import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Contract, ContractApproval, UserProfile } from '@/types/contracts';
import axios from 'axios';
import { Check, Clock, Download, Info, ListFilter, Loader2, Search, Send, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FilterCategory, FilterSheet } from '../ui/FilterSheet';
import { useToast } from './Toast';
import { Avatar, StatusBadge } from './ui';

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
        approved: 'bg-[#172554] text-white border-[#172554] dark:bg-white dark:text-[#172554] dark:border-white',
        pending: 'bg-white text-black border-black/20 dark:bg-sidebar dark:text-white dark:border-white/20',
        rejected: 'bg-white text-black border-rose-500 dark:bg-sidebar dark:text-rose-500 dark:border-rose-500',
        waiting: 'bg-white text-black/20 border-black/10 dark:bg-sidebar dark:text-white/20 dark:border-white/10',
    };
    const noteCls: Record<string, string> = {
        approved: 'border-l-[#172554] dark:border-l-white bg-[#172554]/5 dark:bg-white/5 text-[#172554] dark:text-white',
        rejected: 'border-l-rose-500 bg-rose-50 dark:bg-rose-950/20 text-rose-600',
        pending: 'border-l-black/20 dark:border-l-white/20 bg-black/5 dark:bg-white/5 text-black dark:text-white',
        waiting: 'border-l-black/10 dark:border-l-white/10 bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40',
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
        <div key={a.id} className={`flex gap-4 ${!isLast ? 'relative pb-6' : ''}`}>
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
            <div className="flex-1 pt-0.5">
                <div className="flex flex-wrap items-center gap-2 text-[12px] leading-tight font-bold tracking-wider text-black uppercase dark:text-white">
                    {a.role} <span className="opacity-20">/</span> {a.department_name ?? 'Matching Dept'}
                    <span className="ml-auto text-[9px] font-bold text-black/30 dark:text-white/30">SEQ {a.sequence}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                    {a.status === 'approved' || a.status === 'rejected' ? (
                        <div className="flex items-center gap-1.5 rounded border border-black/10 bg-black/5 px-2 py-1 text-[11px] font-bold text-black dark:border-white/10 dark:bg-white/5 dark:text-white">
                            <Avatar user={a.approver} size="sm" />
                            {a.approver?.name}
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-black/40 dark:text-white/40">
                            <Clock size={12} className="opacity-50" />
                            <span>{a.target_approvers ? `Penanggung Jawab: ${a.target_approvers}` : `Menunggu ${a.role}`}</span>
                        </div>
                    )}
                </div>
                {a.comment && (
                    <div
                        className={`mt-2 border-l-2 px-3 py-1.5 text-[11px] leading-relaxed font-medium ${noteCls[a.status] ?? 'border-l-black/20 bg-black/5'}`}
                    >
                        {a.comment}
                    </div>
                )}
                <div className="mt-2 flex items-center gap-2">
                    {a.decided_at ? (
                        <div className="flex items-center gap-1.5 rounded bg-black/5 px-2 py-1 text-[10px] font-bold tracking-widest text-black/50 uppercase dark:bg-white/5 dark:text-white/50">
                            <Clock size={10} /> {a.decided_at}
                        </div>
                    ) : (
                        <StatusBadge status={a.status} />
                    )}
                </div>
            </div>
        </div>
    );

    const renderInitiator = (isOnly: boolean) => (
        <div key="initiator" className={`flex gap-4 ${!isOnly ? 'relative pb-6' : ''}`}>
            {!isOnly && <div className="absolute top-8 bottom-0 left-[13px] w-px bg-black/10 dark:bg-white/10" />}
            <div className="relative z-10 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-[#172554] bg-[#172554] text-white shadow-sm dark:border-white dark:bg-white dark:text-[#172554]">
                <Send size={12} />
            </div>
            <div className="flex-1 pt-0.5">
                <div className="text-[12px] font-bold tracking-wider text-black uppercase dark:text-white">Pengajuan Awal</div>
                <div className="mt-1 flex w-fit items-center gap-1.5 rounded border border-black/10 bg-black/5 px-2 py-1 text-[11px] font-bold text-black dark:border-white/10 dark:bg-white/5 dark:text-white">
                    <Avatar user={creator} size="sm" /> {creator?.name}
                </div>
                <div className="mt-1.5 text-[9px] font-bold tracking-widest text-black/40 uppercase dark:text-white/40">
                    {submittedAt ? `DIAJUKAN: ${submittedAt}` : 'BELUM DIAJUKAN'}
                </div>
            </div>
        </div>
    );

    const renderProjected = () => (
        <div key="projected" className="relative flex gap-4 pb-6">
            <div className="absolute top-8 bottom-0 left-[13px] w-px bg-black/10 dark:bg-white/10" />
            <div className="relative z-10 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-black/10 bg-black/5 text-black shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white">
                <Info size={12} />
            </div>
            <div className="flex-1 pt-0.5">
                <div className="text-[12px] font-bold tracking-wider text-black uppercase dark:text-white">
                    Atasan Langsung <span className="ml-1 text-[10px] tracking-normal opacity-20">· Fase 1</span>
                </div>
                <div className="mt-1 inline-block rounded border border-dashed border-black/10 bg-black/5 px-2 py-1 text-[11px] font-medium text-black/50 dark:border-white/10 dark:bg-white/5 dark:text-white/50">
                    Manager Dept: {creator.department_id ? 'Tersedia' : 'Belum Ditentukan'}
                </div>
            </div>
        </div>
    );
    return (
        <div className="animate-in fade-in relative flex flex-col gap-6 duration-500">
            <div className="mb-2 flex items-center gap-4">
                <div className="group relative flex-1">
                    <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-black/40 transition-colors dark:text-white/40" />
                    <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#172554]/40 transition-colors dark:text-white/40" />
                    <input
                        type="text"
                        placeholder="CARI NAMA / ROLE..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-xl bg-[#172554]/[0.03] py-2.5 pr-4 pl-10 text-[10px] font-bold tracking-widest uppercase transition-all outline-none placeholder:text-[#172554]/20 focus:bg-white dark:bg-white/[0.03] dark:placeholder:text-white/20 dark:focus:bg-sidebar shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsFilterOpen(true)}
                        className={cn(
                            'h-10 gap-2 rounded-xl px-4 font-bold text-[#172554]/60 shadow-sm transition-all hover:bg-[#172554] hover:text-white dark:text-white/60 dark:hover:bg-white dark:hover:text-[#172554]',
                            activeCount > 0 && 'bg-[#172554] text-white dark:bg-white dark:text-[#172554]',
                        )}
                    >
                        <ListFilter size={14} strokeWidth={3} />
                        <span className="text-[10px] tracking-widest uppercase">Filter</span>
                        {activeCount > 0 && (
                            <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-md bg-white text-[8px] font-bold text-[#172554] dark:bg-[#172554] dark:text-white">
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
