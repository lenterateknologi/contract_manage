import { useToast } from '@/components/contracts/Toast';
import { Button } from '@/components/ui/base/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/overlays/DropdownMenu';
import { contractApi } from '@/lib/contract-api';
import { cn } from '@/lib/utils';
import { Contract, ContractType } from '@/types/contracts';
import axios from 'axios';
import { AlertCircle, Archive, CheckCircle2, ChevronLeft, Clock, FileText, MoreVertical, Save, Trash2, UserPlus, Zap } from 'lucide-react';
import { useState } from 'react';

import AgreementView from '@/components/contracts/AgreementView';
import ApprovalSteps from '@/components/contracts/ApprovalSteps';
import ApproveModal from '@/components/contracts/ApproveModal';
import ContractAttachments from '@/components/contracts/ContractAttachments';
import ContractAuditTrail from '@/components/contracts/ContractAuditTrail';
import ContractChat from '@/components/contracts/ContractChat';
import { ContractMembersTab } from '@/components/contracts/ContractMembersTab';
import { ContractReferenceCard } from '@/components/contracts/ContractReferenceCard';
import { DraftEditableInfoCard } from '@/components/contracts/DraftEditableInfoCard';
import { FormSubmissionTab } from '@/components/contracts/FormSubmissionTab';
import RejectModal from '@/components/contracts/RejectModal';

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
    meUser,
    users,
}: {
    contract: Contract;
    meId: string;
    types: ContractType[];
    submissionTypes: any[];
    vendors: any[];
    meUser: any;
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
    users: any[];
}) => {
    const [detailTab, setDetailTab] = useState<
        'form_template' | 'f2' | 'agreement' | 'attachments' | 'audit' | 'chat' | 'timeline' | 'references' | 'members'
    >('form_template');
    const [processing, setProcessing] = useState(false);
    const { showProgress, hideProgress } = useToast();
    const [approveOpen, setApproveOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);

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

    const handleApprove = async (
        note: string,
        attachment?: File,
        assignedPicId?: string,
        executionOrder?: string,
        p1UserId?: string,
        p2UserId?: string,
    ) => {
        try {
            const c = await contractApi.approve(contract.id, note, attachment, assignedPicId, executionOrder, p1UserId, p2UserId);
            onUpdate(c);

            let msg = 'Kontrak disetujui.';
            if (assignedPicId) msg = 'PIC ditugaskan dan kontrak disetujui.';
            if (p1UserId || p2UserId) msg = 'Delegasi penandatanganan berhasil dikonfigurasi.';

            showToast(msg, 'success');
        } catch {
            showToast('Gagal approve.', 'danger');
        }
    };

    const handleReject = async (reason: string, attachment?: File) => {
        try {
            const c = await contractApi.reject(contract.id, reason, attachment);
            onUpdate(c);
            showToast('Kontrak ditolak.', 'info');
        } catch {
            showToast('Gagal reject.', 'danger');
        }
    };

    const canApprove = !!contract.can_approve;
    const pendingApprovalForMe = contract.pending_approval_id;

    return (
        <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-6 p-4">
            <div className="flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-6">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 text-black transition-all hover:opacity-70 active:scale-95 dark:text-white"
                    >
                        <ChevronLeft size={20} strokeWidth={2.5} />
                        <span className="text-[10px] font-bold uppercase">Kembali</span>
                    </button>
                    <div className="h-10 w-px bg-black/10 dark:bg-white/10" />
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg leading-none font-bold tracking-tight text-black uppercase dark:text-white">{contract.title}</h2>
                            <StatusBadge status={contract.status} />
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-3">
                            <span className="text-[10px] font-bold tracking-[0.2em] text-black/40 uppercase dark:text-white/40">
                                #{contract.contract_no || 'NO-REQ'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
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
                                <p className="text-[10px] font-bold text-black/40 uppercase dark:text-white/40">Opsi Kontrak</p>
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
                                className="flex cursor-pointer items-center gap-2 rounded-lg text-[11px] font-bold tracking-tight text-black uppercase focus:bg-black focus:text-white dark:text-white dark:focus:bg-white dark:focus:text-black"
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
                        <div className="bg-primary flex h-12 items-center justify-between border-b border-black/10 px-4 dark:border-white/10 dark:bg-white">
                            <div className="flex items-center gap-2 text-sm font-semibold text-white dark:text-black">
                                <FileText size={16} className="text-white/70 dark:text-black/70" /> Detail Dokumen & Alur Kerja
                            </div>
                            <div className="flex items-center gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 transition-all hover:text-white active:scale-95 dark:text-black/40 dark:hover:text-black">
                                            <MoreVertical size={14} />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5">
                                        <div className="mb-1 px-2 py-1.5 text-[10px] font-bold tracking-wider text-black/40 uppercase dark:text-white/40">
                                            Menu Tambahan
                                        </div>
                                        <DropdownMenuItem
                                            onClick={() => setDetailTab('audit')}
                                            className={cn(
                                                'flex cursor-pointer items-center gap-2 rounded-lg text-xs font-semibold tracking-tight uppercase transition-all',
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
                                        <DropdownMenuItem
                                            onClick={() => setDetailTab('members')}
                                            className={cn(
                                                'flex cursor-pointer items-center gap-2 rounded-lg text-xs font-semibold tracking-tight uppercase transition-all',
                                                detailTab === 'members'
                                                    ? 'bg-sidebar-primary text-white'
                                                    : 'text-slate-600 hover:bg-slate-50 dark:text-white/70 dark:hover:bg-white/5',
                                            )}
                                        >
                                            <UserPlus size={14} className={cn(detailTab === 'members' ? 'text-white' : 'text-slate-400')} /> Daftar
                                            Member
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        <div className="border-border bg-muted/30 flex flex-wrap gap-1.5 border-b px-4 py-2 dark:bg-black/10">
                            {[
                                { id: 'form_template', label: 'F1 (Permohonan)' },
                                { id: 'f2', label: 'F2 (Ringkasan)' },
                                { id: 'agreement', label: 'Draft Perjanjian' },
                                { id: 'attachments', label: 'Lampiran' },
                                { id: 'timeline', label: 'Alur Persetujuan' },
                                { id: 'members', label: 'Daftar Member' },
                                { id: 'chat', label: 'Chat' },
                                { id: 'references', label: 'Kontrak Referensi' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setDetailTab(tab.id as any)}
                                    className={cn(
                                        'rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
                                        detailTab === tab.id
                                            ? 'bg-primary text-white shadow dark:bg-white dark:text-black'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5',
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <div className={cn('flex min-h-[600px] flex-1 flex-col')}>
                            {detailTab === 'form_template' && (
                                <FormSubmissionTab
                                    docType="f1"
                                    selected={contract}
                                    formTemplates={formTemplates}
                                    onContractUpdated={onUpdate}
                                    users={vendors}
                                    meUser={meUser}
                                />
                            )}
                            {detailTab === 'f2' && (
                                <FormSubmissionTab
                                    docType="f2"
                                    selected={contract}
                                    formTemplates={formTemplates}
                                    onContractUpdated={onUpdate}
                                    users={vendors}
                                    meUser={meUser}
                                />
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
                                        meId={meId}
                                        onApprove={(note, file) => handleApprove(note, file)}
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
                            {detailTab === 'members' && <ContractMembersTab contract={contract} users={users} />}
                        </div>
                    </div>
                </div>
                <div className="sticky top-6 flex flex-col gap-4 self-start">
                    {canApprove && (
                        <div className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-black/10 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-black">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/5 text-black dark:bg-white/10 dark:text-white">
                                    <Zap size={20} />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <h3 className="text-sm font-bold text-black uppercase dark:text-white">Approval Dibutuhkan</h3>
                                    <p className="text-[10px] font-medium text-black/40 dark:text-white/40">
                                        Anda terdaftar sebagai salah satu reviewer
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 pt-2">
                                <Button
                                    variant="primary"
                                    onClick={() => setApproveOpen(true)}
                                    className="h-11 w-full font-bold shadow-lg shadow-blue-500/20"
                                >
                                    <CheckCircle2 size={16} />{' '}
                                    {contract.workflow_step?.step === 1
                                        ? 'Kirim Persetujuan'
                                        : contract.requires_pic_assignment
                                          ? 'Tugaskan PIC'
                                          : contract.workflow_step?.step_type === 'UPLOAD'
                                            ? 'Upload Dokumen TTD'
                                            : 'Setujui Kontrak'}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setRejectOpen(true)}
                                    className="h-11 w-full border-black/10 font-bold hover:bg-rose-500 hover:text-white dark:border-white/10"
                                >
                                    <AlertCircle size={16} /> Tolak Kontrak
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
                        onUpdate={(d: any) => handleUpdate(d, true)}
                        processing={processing}
                        setPreviewTitle={setPreviewTitle}
                        setPreviewUrl={setPreviewUrl}
                        setPreviewHasFile={setPreviewHasFile}
                        setPreviewOpen={setPreviewOpen}
                    />
                </div>
            </div>

            <ApproveModal
                open={approveOpen}
                onClose={() => setApproveOpen(false)}
                onSubmit={handleApprove}
                isAssign={!!contract.requires_pic_assignment}
                contract={contract}
            />
            <RejectModal open={rejectOpen} onClose={() => setRejectOpen(false)} onSubmit={handleReject} />
        </div>
    );
};

export default ContractDetailView;
