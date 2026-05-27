import { useToast } from '@/components/contracts/Toast';
import { Button } from '@/components/ui/base/Button';
import { StatusBadge } from '@/components/ui/data/StatusBadge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/overlays/DropdownMenu';
import { contractApi } from '@/lib/contract-api';
import { cn } from '@/lib/utils';
import { Contract, ContractType } from '@/types/contracts';
import axios from 'axios';
import { AlertCircle, Archive, CheckCircle2, ChevronLeft, Clock, FileText, MoreVertical, Save, Trash2, UserPlus, Zap } from 'lucide-react';
import { useState, useCallback } from 'react';

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
                            h2 { font-size: 14px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; margin: 0 0 12px; }
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

    return (
        <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-6 p-4">
            <div className="flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-6">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="flex h-auto items-center gap-2 px-0 text-text-main transition-all hover:bg-transparent hover:opacity-70 active:scale-95"
                    >
                        <ChevronLeft size={20} strokeWidth={2.5} />
                        <span className="text-[10px] font-semibold uppercase">Kembali</span>
                    </Button>
                    <div className="h-10 w-px bg-surface-border" />
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg leading-none font-semibold tracking-tight text-text-main uppercase italic">{contract.title}</h2>
                            <StatusBadge status={contract.status} />
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-3">
                            <span className="text-[10px] font-semibold tracking-[0.2em] text-text-soft uppercase">
                                #{contract.contract_no || 'NO-REQ'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-10 w-10 border-surface-border bg-surface-base active:scale-95 shadow-sm">
                                <MoreVertical size={18} className="text-text-soft" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="border-surface-border w-56 rounded-xl bg-surface-base p-1.5 shadow-2xl backdrop-blur-xl"
                        >
                            <div className="mb-1 px-2 py-1.5">
                                <p className="text-[10px] font-semibold text-text-soft uppercase tracking-wider">Opsi Kontrak</p>
                            </div>
                            <DropdownMenuItem
                                onClick={() => handleUpdate({}, true)}
                                className="flex cursor-pointer items-center gap-2 rounded-xl text-[11px] font-semibold tracking-tight text-text-main uppercase transition-all"
                            >
                                <Save size={14} className="text-primary" /> Paksa Simpan (Force Sync)
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex cursor-pointer items-center gap-2 rounded-xl text-[11px] font-semibold tracking-tight text-text-main uppercase transition-all">
                                <Archive size={14} className="text-text-soft" /> Arsipkan Kontrak
                            </DropdownMenuItem>
                            <div className="my-1.5 h-px bg-surface-border/40" />
                            <DropdownMenuItem
                                onClick={() => setDeleteOpen(true)}
                                className="flex cursor-pointer items-center gap-2 rounded-xl text-[11px] font-semibold tracking-tight text-danger uppercase transition-all focus:bg-danger/5 focus:text-danger"
                            >
                                <Trash2 size={14} /> Hapus Kontrak
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[1fr_400px]">
                <div className="flex flex-col gap-6">
                    <div className="overflow-hidden rounded-2xl bg-surface-base border border-surface-border shadow-sm">
                        <div className="bg-primary flex h-12 items-center justify-between border-b border-surface-border px-4">
                            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary-foreground">
                                <FileText size={16} className="text-primary-foreground/70" /> Detail Dokumen & Alur Kerja
                            </div>
                            <div className="flex items-center gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-primary-foreground/40 hover:bg-white/10 hover:text-white active:scale-95"
                                        >
                                            <MoreVertical size={14} />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="border-surface-border w-56 rounded-xl bg-surface-base p-1.5 shadow-2xl backdrop-blur-xl">
                                        <div className="mb-1 px-2 py-1.5 text-[10px] font-semibold tracking-wider text-text-soft uppercase">
                                            Menu Tambahan
                                        </div>
                                        <DropdownMenuItem
                                            onClick={() => setDetailTab('audit')}
                                            className={cn(
                                                'flex cursor-pointer items-center gap-2 rounded-lg text-xs font-semibold tracking-tight uppercase transition-all',
                                                detailTab === 'audit'
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'text-text-main hover:bg-surface-muted',
                                            )}
                                        >
                                            <Clock
                                                size={14}
                                                className={cn(detailTab === 'audit' ? 'text-primary-foreground' : 'text-text-soft')}
                                            />{' '}
                                            Audit Trail
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => setDetailTab('timeline')}
                                            className={cn(
                                                'flex cursor-pointer items-center gap-2 rounded-lg text-xs font-semibold tracking-tight uppercase transition-all',
                                                detailTab === 'timeline'
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'text-text-main hover:bg-surface-muted',
                                            )}
                                        >
                                            <CheckCircle2
                                                size={14}
                                                className={cn(detailTab === 'timeline' ? 'text-primary-foreground' : 'text-text-soft')}
                                            />{' '}
                                            Alur Persetujuan
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => setDetailTab('members')}
                                            className={cn(
                                                'flex cursor-pointer items-center gap-2 rounded-lg text-xs font-semibold tracking-tight uppercase transition-all',
                                                detailTab === 'members'
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'text-text-main hover:bg-surface-muted',
                                            )}
                                        >
                                            <UserPlus size={14} className={cn(detailTab === 'members' ? 'text-primary-foreground' : 'text-text-soft')} /> Daftar
                                            Member
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        <div className="border-b border-surface-border bg-surface-muted/30 flex flex-wrap gap-1.5 px-4 py-2">
                            {[
                                { id: 'form_template', label: 'F1 (Permohonan)' },
                                { id: 'f2', label: 'F2 (Ringkasan)' },
                                { id: 'agreement', label: 'Draft Perjanjian' },
                                { id: 'attachments', label: 'Lampiran' },
                                { id: 'chat', label: 'Chat' },
                                { id: 'references', label: 'Kontrak Referensi' },
                            ].map((tab) => (
                                <Button
                                    key={tab.id}
                                    variant={detailTab === tab.id ? 'primary' : 'ghost'}
                                    onClick={() => setDetailTab(tab.id as any)}
                                    className={cn(
                                        'h-8 px-3 text-[11px] font-semibold uppercase transition-all',
                                        detailTab === tab.id
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'text-text-soft hover:bg-primary/5 hover:text-text-main',
                                    )}
                                >
                                    {tab.label}
                                </Button>
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
                        <div className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-primary/20 bg-surface-base p-6 shadow-xl ring-1 ring-primary/5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-inner">
                                    <Zap size={20} />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <h3 className="text-sm font-semibold text-text-main uppercase tracking-tight">Approval Dibutuhkan</h3>
                                    <p className="text-[10px] font-medium text-text-soft uppercase tracking-wide">
                                        Anda terdaftar sebagai salah satu reviewer
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 pt-2">
                                <Button
                                    variant="primary"
                                    onClick={() => setApproveOpen(true)}
                                    className="w-full uppercase text-xs tracking-wider shadow-lg shadow-primary/20"
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
                                    className="w-full border-danger/20 uppercase text-xs tracking-wider hover:bg-danger hover:text-white transition-all shadow-sm"
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
