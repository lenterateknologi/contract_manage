import { ContractApproval, UserProfile, Contract } from '@/types/contracts';
import { Avatar, StatusBadge } from './ui';
import React, { useState, useMemo } from 'react';
import { Filter, Search, X, Check, ListFilter, FileText, Loader2, Download, Clock, Send, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FilterSheet, FilterCategory } from '../ui/FilterSheet';
import { cn } from '@/lib/utils';
import { useToast } from './Toast';
import axios from 'axios';

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
        approved: 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white',
        pending: 'bg-white text-black border-black/20 dark:bg-sidebar dark:text-white dark:border-white/20',
        rejected: 'bg-white text-black border-rose-500 dark:bg-sidebar dark:text-rose-500 dark:border-rose-500',
        waiting: 'bg-white text-black/20 border-black/10 dark:bg-sidebar dark:text-white/20 dark:border-white/10',
    };
    const noteCls: Record<string, string> = {
        approved: 'border-l-black dark:border-l-white bg-black/5 dark:bg-white/5 text-black dark:text-white',
        rejected: 'border-l-rose-500 bg-rose-50 dark:bg-rose-950/20 text-rose-600',
        pending: 'border-l-black/20 dark:border-l-white/20 bg-black/5 dark:bg-white/5 text-black dark:text-white',
        waiting: 'border-l-black/10 dark:border-l-white/10 bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40',
    };

    const roles = useMemo(() => Array.from(new Set(approvals.map(a => a.role))).filter(Boolean).sort(), [approvals]);
    const depts = useMemo(() => Array.from(new Set(approvals.map(a => a.department_name))).filter(Boolean).sort(), [approvals]);

    const filteredSteps = useMemo(() => {
        let result = [...approvals];
        if (statusFilter) result = result.filter(a => a.status === statusFilter);
        if (roleFilter) result = result.filter(a => a.role === roleFilter);
        if (deptFilter) result = result.filter(a => a.department_name === deptFilter);
        if (search) {
            const s = search.toLowerCase();
            result = result.filter(a => 
                (a.role?.toLowerCase().includes(s)) || 
                (a.department_name?.toLowerCase().includes(s)) ||
                (a.approver?.name?.toLowerCase().includes(s))
            );
        }
        return result.sort((a, b) => a.sequence - b.sequence);
    }, [approvals, statusFilter, roleFilter, deptFilter, search]);

    const showProjectedManager = approvals.length === 0 && (creator.role?.toLowerCase() === 'staff');

    const handleExportPdf = async () => {
        setIsExporting(true);
        setJobStatus({ progress: 0, status: 'pending' });

        const win = window.open('about:blank', '_blank');
        try {
            if (win) {
                win.document.write('<html><head><title>Mempersiapkan PDF...</title><style>body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fff; color: #000; } .card { padding: 40px; border: 1px solid #ddd; text-align: center; } .loader { border: 2px solid #eee; border-top: 2px solid #000; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin: 0 auto 15px; } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } h2 { font-size: 13px; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; }</style></head><body><div class="card"><div class="loader"></div><h2>Mempersiapkan Dokumen</h2><p style="font-size: 11px; color: #666;">Data sedang diproses...</p></div></body></html>');
                win.document.close();
            }

            const res = await axios.get(`/api/contracts/${contract.id}/approval/pdf/queue`, {
                params: {
                    status: statusFilter || undefined,
                    role: roleFilter || undefined,
                    department: deptFilter || undefined
                }
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
            ]
        },
        {
            label: 'ROLE',
            key: 'role',
            type: 'searchable',
            options: roles.map(r => ({ label: r || 'UNNAMED ROLE', value: r || '' }))
        },
        {
            label: 'DEPARTEMEN',
            key: 'department',
            type: 'searchable',
            options: depts.map(d => ({ label: d || 'UMUM', value: d || '' }))
        }
    ];

    const activeCount = (statusFilter ? 1 : 0) + (roleFilter ? 1 : 0) + (deptFilter ? 1 : 0);

    const renderStep = (a: ContractApproval, i: number, isLast: boolean) => (
        <div key={a.id} className={`flex gap-4 ${!isLast ? 'relative pb-6' : ''}`}>
            {!isLast && <div className="bg-black/10 dark:bg-white/10 absolute top-8 bottom-0 left-[13px] w-px" />}
            <div className={`relative z-10 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border shadow-sm ${dotCls[a.status] ?? dotCls.waiting}`}>
                {a.status === 'approved' ? <Check size={12} strokeWidth={3} /> : 
                 a.status === 'rejected' ? <X size={12} strokeWidth={3} /> : 
                 <Clock size={12} />}
            </div>
            <div className="flex-1 pt-0.5">
                <div className="text-black dark:text-white text-[12px] font-bold flex items-center gap-2 flex-wrap leading-tight uppercase tracking-wider">
                    {a.role} <span className="opacity-20">/</span> {a.department_name ?? 'Matching Dept'}
                    <span className="text-black/30 dark:text-white/30 text-[9px] font-bold ml-auto">SEQ {a.sequence}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                    {a.status === 'approved' || a.status === 'rejected' ? (
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-black dark:text-white border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-2 py-1 rounded">
                            <Avatar user={a.approver} size="sm" /> 
                            {a.approver?.name}
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-[11px] text-black/40 dark:text-white/40 font-medium">
                            <Clock size={12} className="opacity-50" />
                            <span>{a.target_approvers ? `Penanggung Jawab: ${a.target_approvers}` : `Menunggu ${a.role}`}</span>
                        </div>
                    )}
                </div>
                {a.comment && (
                    <div className={`mt-2 border-l-2 px-3 py-1.5 text-[11px] font-medium leading-relaxed ${noteCls[a.status] ?? 'border-l-black/20 bg-black/5'}`}>
                        {a.comment}
                    </div>
                )}
                <div className="mt-2 flex items-center gap-2">
                    {a.decided_at ? (
                        <div className="text-[10px] font-bold text-black/50 dark:text-white/50 flex items-center gap-1.5 px-2 py-1 bg-black/5 dark:bg-white/5 rounded uppercase tracking-widest">
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
            {!isOnly && <div className="bg-black/10 dark:bg-white/10 absolute top-8 bottom-0 left-[13px] w-px" />}
            <div className="relative z-10 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-sm">
                <Send size={12} />
            </div>
            <div className="flex-1 pt-0.5">
                <div className="text-black dark:text-white text-[12px] font-bold uppercase tracking-wider">Pengajuan Awal</div>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-black dark:text-white border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-2 py-1 rounded w-fit">
                    <Avatar user={creator} size="sm" /> {creator?.name}
                </div>
                <div className="text-black/40 dark:text-white/40 mt-1.5 text-[9px] font-bold uppercase tracking-widest">
                    {submittedAt ? `DIAJUKAN: ${submittedAt}` : 'BELUM DIAJUKAN'}
                </div>
            </div>
        </div>
    );

    const renderProjected = () => (
        <div key="projected" className="flex gap-4 relative pb-6">
            <div className="bg-black/10 dark:bg-white/10 absolute top-8 bottom-0 left-[13px] w-px" />
            <div className="relative z-10 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border bg-black/5 dark:bg-white/5 text-black dark:text-white border-black/10 dark:border-white/10 shadow-sm">
                <Info size={12} />
            </div>
            <div className="flex-1 pt-0.5">
                <div className="text-black dark:text-white text-[12px] font-bold uppercase tracking-wider">Atasan Langsung <span className="opacity-20 text-[10px] ml-1 tracking-normal">· Fase 1</span></div>
                <div className="mt-1 text-black/50 dark:text-white/50 text-[11px] font-medium bg-black/5 dark:bg-white/5 px-2 py-1 rounded inline-block border border-dashed border-black/10 dark:border-white/10">
                    Manager Dept: {creator.department_id ? 'Tersedia' : 'Belum Ditentukan'}
                </div>
            </div>
        </div>
    );
    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500 relative bg-white dark:bg-sidebar rounded-xl border border-black/10 dark:border-white/10 overflow-hidden">
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 bg-[#0f172a] dark:bg-white p-4">
                <div className="flex items-center gap-2">
                    <Clock size={14} className="text-white dark:text-[#0f172a]" />
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-white dark:text-[#0f172a]">
                        Alur Approval Kontrak
                    </h3>
                </div>

                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsFilterOpen(true)}
                        className={cn(
                            "h-8 px-3 gap-2 border-white/20 dark:border-black/20 text-white dark:text-[#0f172a] font-bold rounded-lg hover:bg-white hover:text-[#0f172a] dark:hover:bg-[#0f172a] dark:hover:text-white transition-all shadow-sm",
                            activeCount > 0 && "border-white bg-white text-[#0f172a] dark:bg-[#0f172a] dark:text-white"
                        )}
                    >
                        <ListFilter size={12} strokeWidth={3} />
                        <span className="text-[9px] uppercase tracking-widest">Filter</span>
                        {activeCount > 0 && (
                            <span className="bg-[#0f172a] text-white dark:bg-white dark:text-[#0f172a] w-4 h-4 flex items-center justify-center rounded-md text-[8px] font-bold">
                                {activeCount}
                            </span>
                        )}
                    </Button>

                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleExportPdf}
                        disabled={isExporting}
                        className="h-8 w-8 p-0 text-white/40 dark:text-[#0f172a]/40 hover:text-white dark:hover:text-[#0f172a] transition-all disabled:opacity-20"
                    >
                        {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} strokeWidth={2.5} />}
                    </Button>
                </div>
            </div>

            <div className="px-6 pb-6">
                <div className="mb-8 flex items-center gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40 dark:text-white/40 transition-colors" />
                        <input 
                            type="text"
                            placeholder="CARI NAMA / ROLE..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-[10px] font-bold uppercase tracking-widest outline-none transition-all placeholder:text-black/20 dark:placeholder:text-white/20 focus:bg-white dark:focus:bg-sidebar focus:border-black dark:focus:border-white"
                        />
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
                    department: deptFilter ? [deptFilter] : []
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
                {(!activeCount && !search) && renderInitiator(filteredSteps.length === 0 && !showProjectedManager)}
                {(!activeCount && !search && showProjectedManager) && renderProjected()}
                {filteredSteps.map((a, i) => renderStep(a, i, i === filteredSteps.length - 1))}
                {filteredSteps.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] rounded-xl">
                        <Search className="text-black/10 dark:text-white/10 mb-4" size={32} />
                        <p className="text-black/20 dark:text-white/20 text-[10px] font-bold uppercase tracking-widest">Tidak ada data ditemukan</p>
                    </div>
                )}
            </div>
        </div>
    </div>
    );
}
