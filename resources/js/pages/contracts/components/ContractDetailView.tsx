import { Button } from '@/components/ui/base/Button';
import { StatusBadge } from '@/components/ui/data/StatusBadge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/overlays/DropdownMenu';
import { contractApi } from '@/lib/contract-api';
import { cn } from '@/lib/utils';
import { Contract, ContractType } from '@/types/contracts';
import { router } from '@inertiajs/react';
import { AlertCircle, Archive, CheckCircle2, ChevronLeft, Clock, FileText, MoreVertical, Save, Trash2, UserPlus, X, Zap, UserCheck, Upload, PenTool, Users, Send } from 'lucide-react';
import { useState, useMemo } from 'react';

import { SharedApproveModal } from '@/components/contracts/modals/shared/SharedApproveModal';
import { SharedRejectModal } from '@/components/contracts/modals/shared/SharedRejectModal';
import { SharedAddhocModal } from '@/components/contracts/modals/shared/SharedAddhocModal';
import { DraftEditableInfoCard } from '@/components/contracts/DraftEditableInfoCard';
import { UserAvatar } from '@/components/user/UserAvatar';

// Tab Components
import { F1Tab } from '../show/tabs/F1Tab';
import { F2Tab } from '../show/tabs/F2Tab';
import { AgreementTab } from '../show/tabs/AgreementTab';
import { TimelineTab } from '../show/tabs/TimelineTab';
import { AttachmentsTab } from '../show/tabs/AttachmentsTab';
import { ChatTab } from '../show/tabs/ChatTab';
import { ReferencesTab } from '../show/tabs/ReferencesTab';
import { MembersTab } from '../show/tabs/MembersTab';
import { AuditTrailTab } from '../show/tabs/AuditTrailTab';

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
    setDeleteOpen: (open: boolean) => void;
    setPreviewTitle: (title: string) => void;
    setPreviewUrl: (url: string) => void;
    setPreviewHasFile: (has: boolean) => void;
    setPreviewOpen: (open: boolean) => void;
    users: any[];
}) => {
    const params = new URLSearchParams(window.location.search);
    const detailTab = (params.get('tab') as any) || 'form_template';

    const setDetailTab = (tab: string) => {
        const newParams = new URLSearchParams(window.location.search);
        newParams.set('tab', tab);
        router.get(`${window.location.pathname}?${newParams.toString()}`, {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const [processing, setProcessing] = useState(false);
    const [approveOpen, setApproveOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [addhocOpen, setAddhocOpen] = useState(false);

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
        p1UserId?: string | string[],
        p2UserId?: string | string[],
        actionCode?: string,
        isFinal?: boolean,
    ) => {
        try {
            const c = await contractApi.approve(contract.id, note, attachment, assignedPicId, executionOrder, p1UserId, p2UserId, actionCode || activeActionCode, isFinal);
            onUpdate(c);

            let msg = 'Kontrak disetujui.';
            if (assignedPicId) msg = 'PIC ditugaskan dan kontrak disetujui.';
            if (p1UserId || p2UserId) msg = 'Delegasi penandatanganan berhasil dikonfigurasi.';
            if (isFinal) msg = 'Penandatanganan selesai dikonfigurasi sebagai final.';

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
    const currentStepAdhocApprovals = useMemo(() => (contract.approvals || [])
        .filter((a: any) => a.role === 'Persetujuan Tambahan' && Number(a.sequence) === Number(currentStepSequence))
        .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)), [contract.approvals, currentStepSequence]);

    const tabs = useMemo(() => [
        { id: 'form_template', label: 'F1 (Permohonan)', mode: (contract as any).f1_mode || 'upload' },
        { id: 'f2', label: 'F2 (Ringkasan)', mode: (contract as any).f2_mode || 'upload' },
        { id: 'agreement', label: 'Draft Perjanjian', mode: (contract as any).contract_mode || 'upload' },
        { id: 'timeline', label: 'Alur Persetujuan', mode: 'always' },
        { id: 'attachments', label: 'Lampiran', mode: 'always' },
        { id: 'chat', label: 'Chat', mode: 'always' },
        { id: 'references', label: 'Kontrak Referensi', mode: 'always' },
    ].filter((tab) => tab.mode !== 'none'), [contract]);

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
                            {tabs.map((tab) => (
                                <Button
                                    key={tab.id}
                                    variant={detailTab === tab.id ? 'primary' : 'ghost'}
                                    onClick={() => setDetailTab(tab.id)}
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
                                <F1Tab
                                    contract={contract}
                                    formTemplates={formTemplates}
                                    vendors={vendors}
                                    meUser={meUser}
                                    onUpdate={onUpdate}
                                />
                            )}
                            {detailTab === 'f2' && (
                                <F2Tab
                                    contract={contract}
                                    formTemplates={formTemplates}
                                    vendors={vendors}
                                    meUser={meUser}
                                    onUpdate={onUpdate}
                                />
                            )}
                            {detailTab === 'agreement' && (
                                <AgreementTab
                                    contract={contract}
                                    formTemplates={formTemplates}
                                    vendors={vendors}
                                    meUser={meUser}
                                    onUpdate={onUpdate}
                                />
                            )}
                            {detailTab === 'attachments' && (
                                <AttachmentsTab
                                    contract={contract}
                                    onUpdate={onUpdate}
                                    showToast={showToast}
                                />
                            )}
                            {detailTab === 'audit' && (
                                <AuditTrailTab contract={contract} />
                            )}
                            {detailTab === 'timeline' && (
                                <TimelineTab
                                    contract={contract}
                                    meId={meId}
                                    onApprove={(note, file) => handleApprove(note, file)}
                                    showToast={showToast}
                                />
                            )}
                            {detailTab === 'references' && (
                                <ReferencesTab
                                    contract={contract}
                                    canUpdate={canUpdate}
                                    onUpdate={(d) => handleUpdate(d, true)}
                                    processing={processing}
                                />
                            )}
                            {detailTab === 'chat' && (
                                <ChatTab
                                    contract={contract}
                                    meId={meId}
                                    users={vendors}
                                    onUpdate={onUpdate}
                                />
                            )}
                            {detailTab === 'members' && (
                                <MembersTab
                                    contract={contract}
                                    users={users}
                                />
                            )}
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
                                                        : ['signature', 'sign'].includes(action.action_code?.toLowerCase())
                                                          ? 'Tanda Tangan'
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
                        meId={meId}
                    />
                </div>
            </div>

            <SharedApproveModal
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

            <SharedRejectModal
                open={rejectOpen}
                onClose={() => {
                    setRejectOpen(false);
                    setActiveActionCode(undefined);
                }}
                onSubmit={handleReject}
                actionAlias={contract.workflow_step?.actions?.find((a: any) => a.action_code === activeActionCode)?.alias ?? undefined}
            />
            <SharedAddhocModal
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
