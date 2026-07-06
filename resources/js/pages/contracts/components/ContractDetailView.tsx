import { Button } from '@/components/ui/buttons/Button';
import { StatusBadge } from '@/components/ui/feedback/StatusBadge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/selection/DropdownMenu';
import { contractApi } from '@/pages/contracts/utils';
import { cn } from '@/lib/utils';
import { Contract, ContractType } from '@/pages/contracts/types';
import { router } from '@inertiajs/react';
import {
    AlertCircle,
    Archive,
    CheckCircle2,
    ChevronLeft,
    Clock,
    Download,
    FileText,
    Loader2,
    MoreVertical,
    PenTool,
    Save,
    Trash2,
    Upload,
    UserCheck,
    UserPlus,
    Zap,
} from 'lucide-react';
import React, { useMemo, useState, lazy, Suspense } from 'react';

import { DraftEditableInfoCard } from '@/pages/contracts/components/parts/DraftEditableInfoCard';

// Lazy load modals
const SharedAddhocModal = lazy(() => import('@/pages/contracts/components/modals/shared/SharedAddhocModal').then(m => ({ default: m.SharedAddhocModal })));
const SharedApproveModal = lazy(() => import('@/pages/contracts/components/modals/shared/SharedApproveModal').then(m => ({ default: m.SharedApproveModal })));
const SharedAssignModal = lazy(() => import('@/pages/contracts/components/modals/shared/SharedAssignModal').then(m => ({ default: m.SharedAssignModal })));
const SharedSignerModal = lazy(() => import('@/pages/contracts/components/modals/shared/SharedSignerModal').then(m => ({ default: m.SharedSignerModal })));
const SharedRejectModal = lazy(() => import('@/pages/contracts/components/modals/shared/SharedRejectModal').then(m => ({ default: m.SharedRejectModal })));

// Lazy load Tab Components for performance
const AgreementTab = lazy(() => import('../show/tabs/AgreementTab').then(m => ({ default: m.AgreementTab })));
const AttachmentsTab = lazy(() => import('../show/tabs/AttachmentsTab').then(m => ({ default: m.AttachmentsTab })));
const AuditTrailTab = lazy(() => import('../show/tabs/AuditTrailTab').then(m => ({ default: m.AuditTrailTab })));
const ChatTab = lazy(() => import('../show/tabs/ChatTab').then(m => ({ default: m.ChatTab })));
const F1Tab = lazy(() => import('../show/tabs/F1Tab').then(m => ({ default: m.F1Tab })));
const F2Tab = lazy(() => import('../show/tabs/F2Tab').then(m => ({ default: m.F2Tab })));
const MembersTab = lazy(() => import('../show/tabs/MembersTab').then(m => ({ default: m.MembersTab })));
const ReferencesTab = lazy(() => import('../show/tabs/ReferencesTab').then(m => ({ default: m.ReferencesTab })));
const TimelineTab = lazy(() => import('../show/tabs/TimelineTab').then(m => ({ default: m.TimelineTab })));

const TabSkeleton = () => (
    <div className="flex flex-1 flex-col space-y-4 p-6">
        <div className="bg-sidebar-accent h-8 w-1/3 animate-pulse rounded-md" />
        <div className="bg-sidebar-accent h-64 w-full animate-pulse rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-sidebar-accent h-32 w-full animate-pulse rounded-xl" />
            <div className="bg-sidebar-accent h-32 w-full animate-pulse rounded-xl" />
        </div>
    </div>
);

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
        router.get(
            `${window.location.pathname}?${newParams.toString()}`,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const [processing, setProcessing] = useState(false);
    const [approveOpen, setApproveOpen] = useState(false);
    const [assignOpen, setAssignOpen] = useState(false);
    const [signerOpen, setSignerOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [addhocOpen, setAddhocOpen] = useState(false);

    const handleUpdate = async (data: any, silent = false) => {
        if (!silent) setProcessing(true);
        try {
            const c = await contractApi.update(contract.id, data);
            onUpdate(c, silent);
            if (!silent) showToast('Informasi kontrak diperbarui.', 'success');
            return c;
        } catch (error) {
            if (!silent) showToast('Gagal memperbarui kontrak.', 'danger');
            throw error;
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
        signerUserIds?: string[],
        actionCode?: string,
        isFinal?: boolean,
        targetStepId?: string,
    ) => {
        try {
            const c = await contractApi.approve(
                contract.id,
                note,
                attachment,
                assignedPicId,
                executionOrder,
                signerUserIds,
                actionCode || activeActionCode,
                isFinal,
                targetStepId,
            );
            onUpdate(c);

            let msg = 'Kontrak disetujui.';
            if (assignedPicId) msg = 'PIC ditugaskan dan kontrak disetujui.';
            if (signerUserIds && signerUserIds.length > 0) msg = 'Delegasi penandatanganan berhasil dikonfigurasi.';
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

    const activeSignerApproval = useMemo(() => {
        return (contract.approvals || []).find(
            (a: any) => a.status === 'pending' && a.user_id === meId && (a.role === 'Pihak 1' || a.role === 'Pihak 2' || a.role === 'Penandatangan'),
        );
    }, [contract.approvals, meId]);

    const isSigner = !!activeSignerApproval;

    const isP1 = useMemo(() => (contract.approvals || []).some((a) => a.role === 'Pihak 1' && a.user_id === meId), [contract.approvals, meId]);
    const p1Downloaded = contract.metadata?.p1_downloaded_at;
    const p2Downloaded = contract.metadata?.p2_downloaded_at;
    const stepDownloaded = activeSignerApproval ? contract.metadata?.[`downloaded_step_${activeSignerApproval.id}`] : null;

    const [signingUploading, setSigningUploading] = useState(false);

    const handleSigningAction = async (action: 'download' | 'upload', file?: File) => {
        if (action === 'download') {
            const versions = contract.versions?.filter((v) => v.document_type === 'agreement') || [];
            if (versions.length === 0) {
                showToast('Tidak ada dokumen agreement yang ditemukan.', 'danger');
                return;
            }
            const latest = versions.sort((a, b) => b.version_no - a.version_no)[0];
            window.open(`/api/contracts/${contract.id}/file/${latest.version_no}?type=agreement`, '_blank');

            const newMeta = { ...contract.metadata };

            // Track globally for legacy P1/P2
            if (activeSignerApproval?.role === 'Pihak 1') newMeta['p1_downloaded_at'] = new Date().toISOString();
            if (activeSignerApproval?.role === 'Pihak 2') newMeta['p2_downloaded_at'] = new Date().toISOString();

            // Track specifically for this approval step (Used by the UI check)
            if (activeSignerApproval?.id) {
                newMeta[`downloaded_step_${activeSignerApproval.id}`] = new Date().toISOString();
            }

            try {
                const res = await contractApi.update(contract.id, { metadata: newMeta });
                onUpdate(res);
                showToast('Dokumen berhasil diunduh.', 'success');
            } catch (e) {
                console.error(e);
            }
        } else if (action === 'upload' && file) {
            setSigningUploading(true);
            try {
                const res = await contractApi.approve(contract.id, 'Pembaruan Dokumen TTD', file);
                onUpdate(res);
                showToast('Pembaruan Dokumen TTD berhasil diunggah.', 'success');
            } catch (e: any) {
                showToast(e.response?.data?.message || 'Gagal mengunggah dokumen.', 'danger');
            } finally {
                setSigningUploading(false);
            }
        }
    };

    const currentStepSequence = contract.workflow_step?.step;
    const currentStepAdhocApprovals = useMemo(
        () =>
            (contract.approvals || [])
                .filter((a: any) => a.role === 'Persetujuan Tambahan' && Number(a.sequence) === Number(currentStepSequence))
                .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)),
        [contract.approvals, currentStepSequence],
    );

    const tabs = useMemo(
        () =>
            [
                { id: 'form_template', label: 'F1 (Permohonan)', mode: (contract as any).f1_mode || 'upload' },
                { id: 'f2', label: 'F2 (Ringkasan)', mode: (contract as any).f2_mode || 'upload' },
                { id: 'agreement', label: 'Draft Perjanjian', mode: (contract as any).contract_mode || 'upload' },
                { id: 'timeline', label: 'Alur Persetujuan', mode: 'always' },
                { id: 'attachments', label: 'Lampiran', mode: 'always' },
                { id: 'chat', label: 'Chat', mode: 'always' },
                { id: 'references', label: 'Kontrak Referensi', mode: 'always' },
            ].filter((tab) => tab.mode !== 'none'),
        [contract],
    );

    return (
        <div className="mx-auto flex w-full max-w-full flex-1 flex-col gap-6 p-4">
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
                            <h2 className="text-text-main text-lg leading-none font-semibold">{contract.title}</h2>
                            <StatusBadge status={contract.status} />
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-3">
                            <span className="text-text-soft text-[10px] font-semibold tracking-[0.2em] uppercase">
                                #{contract.form_no || 'NO-REQ'}
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
                                <p className="text-text-soft text-[10px] font-semibold  uppercase">Opsi Kontrak</p>
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
                            <div className="text-primary-foreground flex items-center gap-2 text-sm font-semibold  uppercase">
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
                                        <div className="text-text-soft mb-1 px-2 py-1.5 text-[10px] font-semibold  uppercase">
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
                        <div className={cn(
                            'flex flex-1 flex-col',
                            ['chat', 'attachments', 'timeline'].includes(detailTab)
                                ? 'h-[calc(100vh-180px)] min-h-[600px]'
                                : 'min-h-[600px]'
                        )}>
                            <Suspense fallback={<TabSkeleton />}>
                                {detailTab === 'form_template' && (
                                    <F1Tab contract={contract} formTemplates={formTemplates} vendors={vendors} meUser={meUser} onUpdate={onUpdate} />
                                )}
                                {detailTab === 'f2' && (
                                    <F2Tab contract={contract} formTemplates={formTemplates} vendors={vendors} meUser={meUser} onUpdate={onUpdate} />
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
                                    <AttachmentsTab contract={contract} canUpdate={canUpdate} onUpdate={onUpdate} showToast={showToast} meUser={meUser} />
                                )}

                                {detailTab === 'audit' && <AuditTrailTab contract={contract} />}
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
                                        onUpdate={async (d: any) => {
                                            await handleUpdate(d);
                                        }}
                                        processing={processing}
                                        meId={meId}
                                    />
                                )}

                                {detailTab === 'chat' && <ChatTab contract={contract} meId={meId} users={vendors} onUpdate={onUpdate} />}
                                {detailTab === 'members' && <MembersTab contract={contract} users={users} />}
                            </Suspense>
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
                                    <h3 className="text-text-main text-sm font-semibold tracking-tight uppercase">
                                        {isSigner ? 'Upload Tanda Tangan Dibutuhkan' : 'Approval Dibutuhkan'}
                                    </h3>
                                    <p className="text-text-soft text-[10px] font-medium tracking-wide uppercase">
                                        {isSigner
                                            ? `Anda terdaftar sebagai ${activeSignerApproval?.role}`
                                            : 'Anda terdaftar sebagai salah satu reviewer'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 pt-2">
                                {isSigner ? (
                                    <div className="flex flex-col gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => handleSigningAction('download')}
                                            className="w-full gap-1.5 border-blue-200 text-xs  text-blue-700 uppercase shadow-sm hover:bg-blue-100/50 dark:border-blue-900/30 dark:text-blue-400"
                                        >
                                            <Download size={16} /> Download
                                        </Button>

                                        <div>
                                            <input
                                                type="file"
                                                id="sidebar-upload-draft"
                                                className="hidden"
                                                accept=".docx,.DOCX"
                                                onChange={(e) => {
                                                    const f = e.target.files?.[0];
                                                    if (f) handleSigningAction('upload', f);
                                                }}
                                                disabled={!stepDownloaded || signingUploading}
                                            />
                                            <Button
                                                variant="primary"
                                                onClick={() => document.getElementById('sidebar-upload-draft')?.click()}
                                                disabled={!stepDownloaded || signingUploading}
                                                className="shadow-primary/20 w-full gap-1.5 bg-blue-600 text-xs  text-white uppercase shadow-lg hover:bg-blue-700 hover:text-white"
                                            >
                                                {signingUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                                Upload
                                            </Button>
                                        </div>

                                        {!stepDownloaded && (
                                            <div className="mt-1 flex items-start gap-1.5 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 dark:border-rose-900/30 dark:bg-rose-950/20">
                                                <AlertCircle size={14} className="mt-0.5 shrink-0 text-rose-500" />
                                                <p className="text-[9px] leading-relaxed font-medium text-rose-600 italic dark:text-rose-400">
                                                    Anda wajib mengunduh draft terlebih dahulu sebelum mengunggah hasil TTD.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        {(contract.workflow_step?.actions || []).map((action: any) => {
                                            const isApproveType = ['approve', 'assign', 'sign', 'signature'].includes(
                                                action.action_code?.toLowerCase(),
                                            );
                                            const isRejectType = ['reject'].includes(action.action_code?.toLowerCase());
                                            const isForwardType = ['forward', 'add_adhoc'].includes(action.action_code?.toLowerCase());

                                            let variant: 'primary' | 'outline' | 'ghost' = 'outline';
                                            let Icon = CheckCircle2;

                                            if (isApproveType) {
                                                variant = 'primary';
                                                Icon = CheckCircle2;
                                                if (action.action_code === 'assign') Icon = UserCheck;
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
                                                        const code = action.action_code?.toLowerCase();
                                                        setActiveActionCode(action.action_code);

                                                        if (isForwardType) {
                                                            setAddhocOpen(true);
                                                        } else if (isRejectType) {
                                                            setRejectOpen(true);
                                                        } else if (code === 'assign' || code === 'assign_pic') {
                                                            setAssignOpen(true);
                                                        } else if (code === 'sign' || code === 'signature') {
                                                            setSignerOpen(true);
                                                        } else {
                                                            setApproveOpen(true);
                                                        }
                                                    }}
                                                    className={cn(
                                                        'w-full text-xs  uppercase shadow-sm transition-all',
                                                        isApproveType && 'shadow-primary/20 shadow-lg',
                                                        isRejectType && 'border-danger/20 hover:bg-danger hover:text-white',
                                                        isForwardType && 'border border-indigo-500/20 text-indigo-600 hover:bg-indigo-500/10',
                                                    )}
                                                >
                                                    <Icon size={16} />{' '}
                                                    {action.alias ||
                                                        (action.action_code === 'approve'
                                                            ? contract.workflow_step?.step === 1
                                                                ? 'Kirim Persetujuan'
                                                                : contract.requires_pic_assignment
                                                                    ? 'Tugaskan PIC'
                                                                    : 'Setujui Kontrak'
                                                            : action.action_code === 'forward'
                                                                ? 'Approval Tambahan'
                                                                : action.action_code === 'reject'
                                                                    ? 'Tolak Kontrak'
                                                                    : ['signature', 'sign'].includes(action.action_code?.toLowerCase())
                                                                        ? 'Upload Tanda Tangan'
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
                                                        if (contract.requires_pic_assignment) {
                                                            setAssignOpen(true);
                                                        } else {
                                                            setApproveOpen(true);
                                                        }
                                                    }}
                                                    className="shadow-primary/20 w-full text-xs  uppercase shadow-lg"
                                                >
                                                    <CheckCircle2 size={16} />{' '}
                                                    {contract.workflow_step?.step === 1
                                                        ? 'Kirim Persetujuan'
                                                        : contract.requires_pic_assignment
                                                            ? 'Tugaskan PIC'
                                                            : 'Setujui Kontrak'}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setActiveActionCode('reject');
                                                        setRejectOpen(true);
                                                    }}
                                                    className="border-danger/20 hover:bg-danger w-full text-xs  uppercase shadow-sm transition-all hover:text-white"
                                                >
                                                    <AlertCircle size={16} /> Tolak Kontrak
                                                </Button>
                                            </>
                                        )}
                                    </>
                                )}
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

                    {/* Debug Access Control Panel */}
                    {/* <div className="text-text-main rounded-2xl border border-black/5 bg-black/5 p-4 opacity-60 transition-opacity hover:opacity-100 dark:border-white/5 dark:bg-white/5">
                        <div className="mb-3 flex items-center justify-between border-b border-black/10 pb-2">
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                                <h4 className="text-text-soft text-[10px] font-semibold tracking-[0.2em] uppercase">Debug Access Control</h4>
                            </div>
                            <div className="rounded bg-black px-2 py-0.5 text-[9px] font-bold text-white">
                                STEP {contract.workflow_step?.step || 'N/A'}
                            </div>
                        </div>

                        <div className="mb-3 border-b border-black/5 pb-2 text-[10px] font-bold">
                            <span className="text-text-soft mr-2 font-normal">Active Step:</span>
                            {contract.workflow_step?.description || 'No Step Assigned'}
                        </div>

                        <div className="grid grid-cols-1 gap-1.5 font-mono text-[9px]">
                            <div className="mb-1 flex justify-between border-b border-black/10 pb-1 text-[8px] font-bold">
                                <span className="text-text-soft">FEATURE flag</span>
                                <div className="flex gap-4">
                                    <span>RESOLVED</span>
                                    <span className="text-amber-600">STEP_RAW</span>
                                </div>
                            </div>
                            <div className="flex justify-between border-b border-black/5 pb-1">
                                <span className="text-text-soft uppercase">Info Edit</span>
                                <div className="flex gap-4">
                                    <span className={contract.allow_info_edit ? 'font-bold text-green-600' : 'font-bold text-rose-600'}>
                                        {contract.allow_info_edit ? 'T' : 'F'}
                                    </span>
                                    <span className="text-amber-600">
                                        {(contract.workflow_step as any)?.meta?.allow_info_edit !== false ? 'T' : 'F'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between border-b border-black/5 pb-1">
                                <span className="text-text-soft uppercase">F1 Edit</span>
                                <div className="flex gap-4">
                                    <span className={contract.allow_f1_edit ? 'font-bold text-green-600' : 'font-bold text-rose-600'}>
                                        {contract.allow_f1_edit ? 'T' : 'F'}
                                    </span>
                                    <span className="text-amber-600">
                                        {(contract.workflow_step as any)?.meta?.allow_f1_edit !== false ? 'T' : 'F'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between border-b border-black/5 pb-1">
                                <span className="text-text-soft uppercase">F2 Edit</span>
                                <div className="flex gap-4">
                                    <span className={contract.allow_f2_edit ? 'font-bold text-green-600' : 'font-bold text-rose-600'}>
                                        {contract.allow_f2_edit ? 'T' : 'F'}
                                    </span>
                                    <span className="text-amber-600">
                                        {(contract.workflow_step as any)?.meta?.allow_f2_edit !== false ? 'T' : 'F'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between border-b border-black/5 pb-1">
                                <span className="text-text-soft uppercase">Draft Edit</span>
                                <div className="flex gap-4">
                                    <span className={contract.allow_agreement_edit ? 'font-bold text-green-600' : 'font-bold text-rose-600'}>
                                        {contract.allow_agreement_edit ? 'T' : 'F'}
                                    </span>
                                    <span className="text-amber-600">
                                        {(contract.workflow_step as any)?.meta?.allow_agreement_edit !== false ? 'T' : 'F'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between border-b border-black/5 pb-1">
                                <span className="text-text-soft uppercase">Attachment</span>
                                <div className="flex gap-4">
                                    <span className={contract.allow_attachment_edit ? 'font-bold text-green-600' : 'font-bold text-rose-600'}>
                                        {contract.allow_attachment_edit ? 'T' : 'F'}
                                    </span>
                                    <span className="text-amber-600">
                                        {(contract.workflow_step as any)?.meta?.allow_attachment_edit !== false ? 'T' : 'F'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between border-b border-black/5 pb-1">
                                <span className="text-text-soft uppercase">Reference</span>
                                <div className="flex gap-4">
                                    <span className={contract.allow_reference ? 'font-bold text-green-600' : 'font-bold text-rose-600'}>
                                        {contract.allow_reference ? 'T' : 'F'}
                                    </span>
                                    <span className="text-amber-600">
                                        {(contract.workflow_step as any)?.meta?.allow_reference !== false ? 'T' : 'F'}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-1 flex justify-between border-b border-black/5 pb-1">
                                <span className="text-text-soft uppercase">Can Approve (Actor)</span>
                                <span className={contract.can_approve ? 'font-bold text-green-600' : 'font-bold text-rose-600'}>
                                    {contract.can_approve ? 'TRUE' : 'FALSE'}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-black/5 pb-1">
                                <span className="text-text-soft uppercase">Is Creator (Actor)</span>
                                <span className={contract.created_by === meId ? 'font-bold text-green-600' : 'font-bold text-rose-600'}>
                                    {contract.created_by === meId ? 'TRUE' : 'FALSE'}
                                </span>
                            </div>
                            <div className="text-text-soft/50 mt-2 rounded bg-black/5 p-2 text-[8px] break-all">
                                STEP_ID: {contract.workflow_step_id || 'N/A'}
                            </div>
                        </div>
                    </div> */}
                </div>
            </div>

            <Suspense fallback={null}>
                <SharedApproveModal
                    open={approveOpen}
                    onClose={() => {
                        setApproveOpen(false);
                        setActiveActionCode(undefined);
                    }}
                    onSubmit={handleApprove}
                    contract={contract}
                    onUpdate={onUpdate}
                    actionCode={activeActionCode}
                    actionAlias={contract.workflow_step?.actions?.find((a: any) => a.action_code === activeActionCode)?.alias ?? undefined}
                />
            </Suspense>

            <Suspense fallback={null}>
                <SharedAssignModal
                    open={assignOpen}
                    onClose={() => {
                        setAssignOpen(false);
                        setActiveActionCode(undefined);
                    }}
                    contract={contract}
                    onUpdate={onUpdate}
                    showToast={showToast}
                    actionCode={activeActionCode}
                    actionAlias={contract.workflow_step?.actions?.find((a: any) => a.action_code === activeActionCode)?.alias ?? undefined}
                />
            </Suspense>

            <Suspense fallback={null}>
                <SharedSignerModal
                    open={signerOpen}
                    onClose={() => {
                        setSignerOpen(false);
                        setActiveActionCode(undefined);
                    }}
                    contract={contract}
                    onUpdate={onUpdate}
                    showToast={showToast}
                    actionCode={activeActionCode}
                    actionAlias={contract.workflow_step?.actions?.find((a: any) => a.action_code === activeActionCode)?.alias ?? undefined}
                />
            </Suspense>

            <Suspense fallback={null}>
                <SharedRejectModal
                    open={rejectOpen}
                    onClose={() => {
                        setRejectOpen(false);
                        setActiveActionCode(undefined);
                    }}
                    onSubmit={handleReject}
                    actionAlias={contract.workflow_step?.actions?.find((a: any) => a.action_code === activeActionCode)?.alias ?? undefined}
                />
            </Suspense>
            <Suspense fallback={null}>
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
            </Suspense>
        </div>
    );
};

export default ContractDetailView;
