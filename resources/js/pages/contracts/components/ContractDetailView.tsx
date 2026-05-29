import { useToast } from '@/components/contracts/Toast';
import { Button } from '@/components/ui/base/Button';
import { StatusBadge } from '@/components/ui/data/StatusBadge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/overlays/DropdownMenu';
import { contractApi } from '@/lib/contract-api';
import { cn } from '@/lib/utils';
import { Contract, ContractType } from '@/types/contracts';
import axios from 'axios';
import { AlertCircle, Archive, CheckCircle2, ChevronLeft, Clock, FileText, MoreVertical, Save, Send, Trash2, UserPlus, X, Zap, UserCheck, Upload, PenTool, Users } from 'lucide-react';
import { useState } from 'react';

import AddhocApproverModal from '@/components/contracts/AddhocApproverModal';
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
import { UserAvatar } from '@/components/user/UserAvatar';

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
    const [addhocOpen, setAddhocOpen] = useState(false);

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

    const [activeActionCode, setActiveActionCode] = useState<string | undefined>(undefined);

    const handleApprove = async (
        note: string,
        attachment?: File,
        assignedPicId?: string,
        executionOrder?: string,
        p1UserId?: string,
        p2UserId?: string,
        actionCode?: string,
    ) => {
        try {
            const c = await contractApi.approve(contract.id, note, attachment, assignedPicId, executionOrder, p1UserId, p2UserId, actionCode || activeActionCode);
            onUpdate(c);

            let msg = 'Kontrak disetujui.';
            if (assignedPicId) msg = 'PIC ditugaskan dan kontrak disetujui.';
            if (p1UserId || p2UserId) msg = 'Delegasi penandatanganan berhasil dikonfigurasi.';

            showToast(msg, 'success');
            setActiveActionCode(undefined);
        } catch {
            showToast('Gagal approve.', 'danger');
        }
    };

    const handleReject = async (reason: string, attachment?: File) => {
        try {
            const updated = await contractApi.reject(contract.id, reason, attachment);
            onUpdate(updated);
            showToast('Kontrak ditolak.', 'info');
        } catch {
            showToast('Gagal reject.', 'danger');
        }
    };

    const handleDeleteAdhoc = async (approvalId: string) => {
        try {
            const updated = await contractApi.removeAdhocApprover(contract.id, approvalId);
            onUpdate(updated);
            showToast('Persetujuan tambahan dihapus.', 'success');
        } catch {
            showToast('Gagal menghapus persetujuan.', 'danger');
        }
    };

    const handleSubmitAdhoc = async () => {
        try {
            const updated = await contractApi.submitAdhocApprovers(contract.id);
            onUpdate(updated);
            showToast('Persetujuan tambahan diajukan.', 'success');
        } catch (e: any) {
            showToast(e.response?.data?.message || 'Gagal mengajukan persetujuan.', 'danger');
        }
    };

    const canApprove = !!contract.can_approve;

    const currentStepSequence = contract.workflow_step?.step;
    const currentStepAdhocApprovals = (contract.approvals || [])
        .filter((a: any) => a.role === 'Persetujuan Tambahan' && Number(a.sequence) === Number(currentStepSequence))
        .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));

    return (
        <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-6 p-4">
            <div className="flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-6">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-text-main flex h-auto items-center gap-2 px-0 transition-all hover:bg-transparent hover:opacity-70 active:scale-95"
                    >
                        <ChevronLeft size={20} strokeWidth={2.5} />
                        <span className="text-[10px] font-semibold uppercase">Kembali</span>
                    </Button>
                    <div className="bg-surface-border h-10 w-px" />
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <h2 className="text-text-main text-lg leading-none font-semibold tracking-tight uppercase italic">{contract.title}</h2>
                            <StatusBadge status={contract.status} />
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-3">
                            <span className="text-text-soft text-[10px] font-semibold tracking-[0.2em] uppercase">
                                #{contract.contract_no || 'NO-REQ'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="border-surface-border bg-surface-base h-10 w-10 shadow-sm active:scale-95"
                            >
                                <MoreVertical size={18} className="text-text-soft" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="border-surface-border bg-surface-base w-56 rounded-xl p-1.5 shadow-2xl backdrop-blur-xl"
                        >
                            <div className="mb-1 px-2 py-1.5">
                                <p className="text-text-soft text-[10px] font-semibold tracking-wider uppercase">Opsi Kontrak</p>
                            </div>
                            <DropdownMenuItem
                                onClick={() => handleUpdate({}, true)}
                                className="text-text-main flex cursor-pointer items-center gap-2 rounded-xl text-[11px] font-semibold tracking-tight uppercase transition-all"
                            >
                                <Save size={14} className="text-primary" /> Paksa Simpan (Force Sync)
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-text-main flex cursor-pointer items-center gap-2 rounded-xl text-[11px] font-semibold tracking-tight uppercase transition-all">
                                <Archive size={14} className="text-text-soft" /> Arsipkan Kontrak
                            </DropdownMenuItem>
                            <div className="bg-surface-border/40 my-1.5 h-px" />
                            <DropdownMenuItem
                                onClick={() => setDeleteOpen(true)}
                                className="text-danger focus:bg-danger/5 focus:text-danger flex cursor-pointer items-center gap-2 rounded-xl text-[11px] font-semibold tracking-tight uppercase transition-all"
                            >
                                <Trash2 size={14} /> Hapus Kontrak
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[1fr_400px]">
                <div className="flex flex-col gap-6">
                    <div className="bg-surface-base border-surface-border overflow-hidden rounded-2xl border shadow-sm">
                        <div className="bg-primary border-surface-border flex h-12 items-center justify-between border-b px-4">
                            <div className="text-primary-foreground flex items-center gap-2 text-sm font-semibold tracking-wider uppercase">
                                <FileText size={16} className="text-primary-foreground/70" /> Detail Dokumen & Alur Kerja
                            </div>
                            <div className="flex items-center gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-primary-foreground/40 h-7 w-7 hover:bg-white/10 hover:text-white active:scale-95"
                                        >
                                            <MoreVertical size={14} />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        className="border-surface-border bg-surface-base w-56 rounded-xl p-1.5 shadow-2xl backdrop-blur-xl"
                                    >
                                        <div className="text-text-soft mb-1 px-2 py-1.5 text-[10px] font-semibold tracking-wider uppercase">
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
                                            <Clock size={14} className={cn(detailTab === 'audit' ? 'text-primary-foreground' : 'text-text-soft')} />{' '}
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
                                            <UserPlus
                                                size={14}
                                                className={cn(detailTab === 'members' ? 'text-primary-foreground' : 'text-text-soft')}
                                            />{' '}
                                            Daftar Member
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        <div className="border-surface-border bg-surface-muted/30 flex flex-wrap gap-1.5 border-b px-4 py-2">
                            {[
                                { id: 'form_template', label: 'F1 (Permohonan)' },
                                { id: 'f2', label: 'F2 (Ringkasan)' },
                                { id: 'agreement', label: 'Draft Perjanjian' },
                                { id: 'timeline', label: 'Alur Persetujuan' },
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
                        <div className="border-primary/20 bg-surface-base ring-primary/5 flex flex-col gap-4 overflow-hidden rounded-2xl border p-6 shadow-xl ring-1">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl shadow-inner">
                                    <Zap size={20} />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <h3 className="text-text-main text-sm font-semibold tracking-tight uppercase">Approval Dibutuhkan</h3>
                                    <p className="text-text-soft text-[10px] font-medium tracking-wide uppercase">
                                        Anda terdaftar sebagai salah satu reviewer
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 pt-2">
                                {(contract.workflow_step?.actions || []).map((action: any) => {
                                    const isApproveType = ['approve', 'assign', 'upload', 'review', 'sign', 'signature'].includes(
                                        action.action_code?.toLowerCase(),
                                    );
                                    const isRejectType = ['reject', 'return'].includes(action.action_code?.toLowerCase());
                                    const isForwardType = ['forward', 'add_adhoc'].includes(action.action_code?.toLowerCase());

                                    let variant: 'primary' | 'outline' | 'ghost' = 'outline';
                                    let Icon = CheckCircle2;

                                    if (isApproveType) {
                                        variant = 'primary';
                                        Icon = CheckCircle2;
                                        if (action.action_code === 'assign') Icon = UserCheck;
                                        if (action.action_code === 'upload') Icon = Upload;
                                        if (['sign', 'signature'].includes(action.action_code)) Icon = PenTool;
                                    } else if (isRejectType) {
                                        variant = 'outline';
                                        Icon = AlertCircle;
                                    } else if (isForwardType) {
                                        variant = 'ghost';
                                        Icon = UserPlus;
                                    }

                                    return (
                                        <Button
                                            key={action.id}
                                            variant={variant}
                                            onClick={() => {
                                                setActiveActionCode(action.action_code);
                                                if (isApproveType) setApproveOpen(true);
                                                else if (isRejectType) setRejectOpen(true);
                                                else if (isForwardType) setAddhocOpen(true);
                                            }}
                                            className={cn(
                                                'w-full text-xs tracking-wider uppercase shadow-sm transition-all',
                                                isApproveType && 'shadow-primary/20 shadow-lg',
                                                isRejectType && 'border-danger/20 hover:bg-danger hover:text-white',
                                                isForwardType && 'border-indigo-500/20 text-indigo-600 hover:bg-indigo-500/10 border',
                                            )}
                                        >
                                            <Icon size={16} />{' '}
                                            {action.alias ||
                                                (action.action_code === 'approve'
                                                    ? contract.workflow_step?.step === 1
                                                        ? 'Kirim Persetujuan'
                                                        : contract.requires_pic_assignment
                                                          ? 'Tugaskan PIC'
                                                          : contract.workflow_step?.step_type === 'UPLOAD'
                                                            ? 'Upload Dokumen TTD'
                                                            : 'Setujui Kontrak'
                                                    : action.action_code === 'forward'
                                                      ? 'Approval Tambahan'
                                                      : action.action_code === 'reject'
                                                        ? 'Tolak Kontrak'
                                                        : action.action_code)}
                                        </Button>
                                    );
                                })}

                                {/* Fallback if no actions defined (Backward compatibility or safety) */}
                                {(!contract.workflow_step?.actions || contract.workflow_step.actions.length === 0) && (
                                    <>
                                        <Button
                                            variant="primary"
                                            onClick={() => {
                                                setActiveActionCode('approve');
                                                setApproveOpen(true);
                                            }}
                                            className="shadow-primary/20 w-full text-xs tracking-wider uppercase shadow-lg"
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
                                            onClick={() => {
                                                setActiveActionCode('reject');
                                                setRejectOpen(true);
                                            }}
                                            className="border-danger/20 hover:bg-danger w-full text-xs tracking-wider uppercase shadow-sm transition-all hover:text-white"
                                        >
                                            <AlertCircle size={16} /> Tolak Kontrak
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Show current step ad-hoc approvers list if any */}
                    {['draft', 'in_review', 'revision'].includes(contract.status) && currentStepAdhocApprovals.length > 0 && (
                        <div className="border-surface-border bg-surface-base flex flex-col gap-4 overflow-hidden rounded-2xl border p-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 shadow-inner dark:bg-indigo-500/20">
                                    <Users size={20} />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <h3 className="text-text-main text-sm font-semibold tracking-tight uppercase">Persetujuan Tambahan</h3>
                                    <p className="text-text-soft text-[10px] font-medium tracking-wide uppercase">
                                        Reviewer aktif di luar alur kerja utama
                                    </p>
                                </div>
                            </div>
                            
                            <div className="border-surface-border/60 space-y-2 border-t pt-3">
                                <div className="flex items-center justify-between px-1">
                                    <h4 className="text-text-soft text-[10px] font-black tracking-wider uppercase">
                                        Reviewer Aktif ({currentStepAdhocApprovals.length})
                                    </h4>
                                    {currentStepAdhocApprovals.some((a: any) => !a.is_active) && (
                                        <Button
                                            size="sm"
                                            variant="primary"
                                            onClick={handleSubmitAdhoc}
                                            className="h-6 gap-1 px-2 text-[9px] uppercase tracking-tighter"
                                        >
                                            <Send size={10} /> Ajukan
                                        </Button>
                                    )}
                                </div>
                                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                                    {currentStepAdhocApprovals.map((a: any, idx: number) => (
                                        <div
                                            key={a.id}
                                            className="border-surface-border/50 bg-surface-muted/20 flex items-center justify-between gap-3 rounded-xl border p-2.5"
                                        >
                                            <div className="flex items-center gap-2.5 overflow-hidden">
                                                <span className="flex h-5 w-7 shrink-0 items-center justify-center rounded-md border border-indigo-100/50 bg-indigo-50 px-1 text-[9px] font-black text-indigo-600 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-400">
                                                    {currentStepSequence}.{idx + 1}
                                                </span>
                                                <UserAvatar user={a.approver || { name: a.approver_name }} size="sm" />
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="text-text-main truncate text-[11px] leading-tight font-bold">
                                                        {a.approver_name}
                                                    </span>
                                                    <span className="text-text-soft mt-0.5 truncate text-[9px] leading-none font-medium">
                                                        {a.approver?.role || 'VP'}
                                                        {a.department_name ? ` - ${a.department_name}` : ''}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2">
                                                {!a.is_active ? (
                                                    <span className="rounded-full border border-slate-500/20 bg-slate-500/10 px-2 py-0.5 text-[8px] font-black tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                                        Inactive
                                                    </span>
                                                ) : a.status === 'approved' ? (
                                                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[8px] font-black tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
                                                        Setuju
                                                    </span>
                                                ) : a.status === 'rejected' ? (
                                                    <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[8px] font-black tracking-wider text-rose-600 uppercase dark:text-rose-400">
                                                        Ditolak
                                                    </span>
                                                ) : a.status === 'waiting' ? (
                                                    <span className="rounded-full border border-slate-500/20 bg-slate-500/10 px-2 py-0.5 text-[8px] font-black tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                                        Menunggu
                                                    </span>
                                                ) : (
                                                    <span className="animate-pulse rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[8px] font-black tracking-wider text-amber-600 uppercase dark:text-amber-400">
                                                        Pending
                                                    </span>
                                                )}

                                                {['pending', 'waiting'].includes(a.status) && (
                                                    <button
                                                        onClick={() => handleDeleteAdhoc(a.id)}
                                                        className="hover:bg-danger/10 hover:text-danger text-text-soft flex h-5 w-5 items-center justify-center rounded-md transition-colors"
                                                        title="Hapus Approver Tambahan"
                                                    >
                                                        <X size={12} strokeWidth={3} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
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
                onClose={() => {
                    setApproveOpen(false);
                    setActiveActionCode(undefined);
                }}
                onSubmit={handleApprove}
                isAssign={!!contract.requires_pic_assignment}
                contract={contract}
                actionCode={activeActionCode}
                actionAlias={contract.workflow_step?.actions?.find((a: any) => a.action_code === activeActionCode)?.alias ?? undefined}
            />

            <RejectModal
                open={rejectOpen}
                onClose={() => {
                    setRejectOpen(false);
                    setActiveActionCode(undefined);
                }}
                onSubmit={handleReject}
                actionAlias={contract.workflow_step?.actions?.find((a: any) => a.action_code === activeActionCode)?.alias ?? undefined}
            />
            <AddhocApproverModal
                open={addhocOpen}
                onClose={() => {
                    setAddhocOpen(false);
                    setActiveActionCode(undefined);
                }}
                contract={contract}
                onUpdate={onUpdate}
                showToast={showToast}
                actionCode={activeActionCode}
                actionAlias={contract.workflow_step?.actions?.find((a: any) => a.action_code === activeActionCode)?.alias ?? undefined}
            />
        </div>
    );
};

export default ContractDetailView;
