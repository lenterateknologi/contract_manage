import { detailSidebarStore, type DetailSidebarTabItem, type DetailSidebarTabChild } from '@/stores/useDetailSidebarStore';
import { Button } from '@/components/ui/buttons/Button';
import { StatusBadge } from '@/components/ui/feedback/StatusBadge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/navigation/Tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/selection/DropdownMenu';
import { contractApi } from '@/pages/contracts/utils';
import { cn } from '@/lib/utils';
import { Contract, ContractType } from '@/pages/contracts/types';
import { router } from '@inertiajs/react';
import {
    AlertCircle,
    Archive,
    Building2,
    Check,
    CheckCircle2,
    ChevronLeft,
    Clock,
    Download,
    FileCheck,
    FileText,
    GitCommit,
    History,
    Link2,
    Loader2,
    MessageSquare,
    MoreVertical,
    Paperclip,
    PenTool,
    Save,
    ShieldCheck,
    Trash2,
    Upload,
    User,
    UserCheck,
    UserPlus,
    Users,
    Zap,
} from 'lucide-react';
import React, { useMemo, useState, lazy, Suspense, useEffect } from 'react';

import { DraftEditableInfoCard, RequesterInfoCard, VendorInfoCard } from '@/pages/contracts/components/parts/DraftEditableInfoCard';

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

import LoadingLottie from '@/components/ui/feedback/LoadingLottie';

const TabSkeleton = () => (
    <div className="flex flex-1 items-center justify-center min-h-[400px] w-full p-6">
        <LoadingLottie width={120} height={120} />
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
}) => {
    const params = new URLSearchParams(window.location.search);
    const [detailTab, setDetailTabState] = useState((params.get('tab') as any) || 'documents');
    const [docSubTab, setDocSubTabState] = useState<'f1' | 'f2' | 'agreement'>((params.get('subtab') as any) || 'f1');
    const [partySubTab, setPartySubTabState] = useState<'requester' | 'vendor'>((params.get('partysubtab') as any) || 'requester');
    const [discSubTab, setDiscSubTabState] = useState<'chat' | 'members'>((params.get('discsubtab') as any) || 'chat');
    const [historySubTab, setHistorySubTabState] = useState<'timeline' | 'audit'>((params.get('histsubtab') as any) || 'timeline');

    const setDetailTab = (tab: string) => {
        setDetailTabState(tab);
        const newParams = new URLSearchParams(window.location.search);
        newParams.set('tab', tab);
        window.history.replaceState({}, '', `${window.location.pathname}?${newParams.toString()}`);
    };

    const setPartySubTab = (sub: 'requester' | 'vendor') => {
        setPartySubTabState(sub);
        const newParams = new URLSearchParams(window.location.search);
        newParams.set('partysubtab', sub);
        window.history.replaceState({}, '', `${window.location.pathname}?${newParams.toString()}`);
    };

    const setDocSubTab = (sub: 'f1' | 'f2' | 'agreement') => {
        setDocSubTabState(sub);
        const newParams = new URLSearchParams(window.location.search);
        newParams.set('subtab', sub);
        window.history.replaceState({}, '', `${window.location.pathname}?${newParams.toString()}`);
    };

    const setDiscSubTab = (sub: 'chat' | 'members') => {
        setDiscSubTabState(sub);
        const newParams = new URLSearchParams(window.location.search);
        newParams.set('discsubtab', sub);
        window.history.replaceState({}, '', `${window.location.pathname}?${newParams.toString()}`);
    };

    const setHistorySubTab = (sub: 'timeline' | 'audit') => {
        setHistorySubTabState(sub);
        const newParams = new URLSearchParams(window.location.search);
        newParams.set('histsubtab', sub);
        window.history.replaceState({}, '', `${window.location.pathname}?${newParams.toString()}`);
    };

    const [processing, setProcessing] = useState(false);
    const [approveOpen, setApproveOpen] = useState(false);
    const [assignOpen, setAssignOpen] = useState(false);
    const [signerOpen, setSignerOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [addhocOpen, setAddhocOpen] = useState(false);

    const [headerTitle, setHeaderTitle] = useState(contract.title);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const isDraftTitle = contract.status === 'draft' && contract.workflow_step?.meta?.allow_info_edit !== false && (contract.can_approve || contract.created_by === meId);

    const [hasInfoChanges, setHasInfoChanges] = useState(false);
    const [infoSaving, setInfoSaving] = useState(false);
    const saveInfoRef = React.useRef<(() => Promise<void>) | null>(null);
    const resetInfoRef = React.useRef<(() => void) | null>(null);

    const onSaveInfoChanges = () => saveInfoRef.current?.();
    const onResetInfoChanges = () => resetInfoRef.current?.();

    useEffect(() => {
        setHeaderTitle(contract.title);
    }, [contract.title]);

    const handleTitleBlur = () => {
        setIsEditingTitle(false);
        if (headerTitle.trim() && headerTitle !== contract.title) {
            handleUpdate({ title: headerTitle }, true);
        } else {
            setHeaderTitle(contract.title);
        }
    };

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
        () => {
            const meta = contract.workflow_step?.meta || {};
            const hasF1 = meta.show_tab_f1 !== false && ((contract as any).f1_mode || 'upload') !== 'none';
            const hasF2 = meta.show_tab_f2 !== false && ((contract as any).f2_mode || 'upload') !== 'none';
            const hasAgreement = meta.show_tab_agreement !== false && ((contract as any).contract_mode || 'upload') !== 'none';
            const hasDocuments = hasF1 || hasF2 || hasAgreement;

            const hasChat = meta.show_tab_chat !== false;
            const hasMembers = meta.show_tab_members !== false;
            const hasDiscussion = hasChat || hasMembers;

            const hasTimeline = meta.show_tab_timeline !== false;
            const hasHistory = hasTimeline || true; // Audit log is always available

            return [
                { id: 'documents', label: 'Dokumen', icon: FileText, mode: hasDocuments ? 'always' : 'none' },
                { id: 'history', label: 'Riwayat & Alur', icon: History, mode: hasHistory ? 'always' : 'none' },
                { id: 'attachments', label: 'Lampiran', icon: Paperclip, mode: meta.show_tab_attachments === false ? 'none' : 'always' },
                { id: 'discussion', label: 'Diskusi & Member', icon: MessageSquare, mode: hasDiscussion ? 'always' : 'none' },
                { id: 'references', label: 'Referensi', icon: Link2, mode: meta.show_tab_references === false ? 'none' : 'always' },
                { id: 'parties', label: 'Pihak & Pengaju', icon: Users, mode: 'always' },
            ].filter((tab) => tab.mode !== 'none');
        },
        [contract],
    );

    // Build hierarchical tree tabs for sub-sidebar
    const detailSidebarTabs: DetailSidebarTabItem[] = useMemo(() => {
        const meta = contract.workflow_step?.meta || {};
        const result: DetailSidebarTabItem[] = [];

        // 1. Dokumen Tab (with subtabs f1, f2, agreement)
        const hasF1 = meta.show_tab_f1 !== false && ((contract as any).f1_mode || 'upload') !== 'none';
        const hasF2 = meta.show_tab_f2 !== false && ((contract as any).f2_mode || 'upload') !== 'none';
        const hasAgreement = meta.show_tab_agreement !== false && ((contract as any).contract_mode || 'upload') !== 'none';

        if (hasF1 || hasF2 || hasAgreement) {
            const children: DetailSidebarTabChild[] = [];
            if (hasF1) children.push({ id: 'f1', label: 'F1 (Permohonan)', icon: FileText });
            if (hasF2) children.push({ id: 'f2', label: 'F2 (Ringkasan)', icon: FileCheck });
            if (hasAgreement) children.push({ id: 'agreement', label: 'Draft Perjanjian', icon: PenTool });

            result.push({
                id: 'documents',
                label: 'Dokumen',
                icon: FileText,
                children: children.length > 1 ? children : undefined,
            });
        }

        // 2. Pihak Terkait Tab (with subtabs Informasi Pengaju & Pihak Kedua / Vendor)
        result.push({
            id: 'parties',
            label: 'Pihak Terkait',
            icon: Users,
            children: [
                { id: 'requester', label: 'Informasi Pengaju', icon: User },
                { id: 'vendor', label: 'Pihak Kedua / Vendor', icon: Building2 },
            ],
        });

        // 3. Riwayat & Alur Tab
        const hasTimeline = meta.show_tab_timeline !== false;
        result.push({
            id: 'history',
            label: 'Riwayat & Alur',
            icon: History,
            children: [
                ...(hasTimeline ? [{ id: 'timeline', label: 'Alur Approval & Proses', icon: GitCommit }] : []),
                { id: 'audit', label: 'Audit Log & Activity', icon: ShieldCheck },
            ],
        });

        // 4. Lampiran Tab
        if (meta.show_tab_attachments !== false) {
            result.push({
                id: 'attachments',
                label: 'Lampiran',
                icon: Paperclip,
            });
        }

        // 5. Diskusi & Member Tab
        const hasChat = meta.show_tab_chat !== false;
        const hasMembers = meta.show_tab_members !== false;
        if (hasChat || hasMembers) {
            const children: DetailSidebarTabChild[] = [];
            if (hasChat) children.push({ id: 'chat', label: 'Chat & Diskusi', icon: MessageSquare });
            if (hasMembers) children.push({ id: 'members', label: 'Member / Anggota Tim', icon: Users });

            result.push({
                id: 'discussion',
                label: 'Diskusi & Member',
                icon: MessageSquare,
                children: children.length > 1 ? children : undefined,
            });
        }

        // 6. Referensi Tab
        if (meta.show_tab_references !== false) {
            result.push({
                id: 'references',
                label: 'Referensi',
                icon: Link2,
            });
        }

        return result;
    }, [contract]);

    // Synchronize detail state with sub-side menu
    useEffect(() => {
        let currentSub: string | undefined = undefined;
        if (detailTab === 'documents') currentSub = docSubTab;
        else if (detailTab === 'parties') currentSub = partySubTab;
        else if (detailTab === 'history') currentSub = historySubTab;
        else if (detailTab === 'discussion') currentSub = discSubTab;

        detailSidebarStore.setState({
            isActive: true,
            contract: contract,
            contractTitle: contract.title,
            contractNumber: contract.form_no,
            activeTab: detailTab,
            activeSubTab: currentSub,
            tabs: detailSidebarTabs,
            onSelectTab: (tabId: string, subtabId?: string) => {
                setDetailTab(tabId);
                if (subtabId) {
                    if (tabId === 'documents') setDocSubTab(subtabId as any);
                    else if (tabId === 'parties') setPartySubTab(subtabId as any);
                    else if (tabId === 'history') setHistorySubTab(subtabId as any);
                    else if (tabId === 'discussion') setDiscSubTab(subtabId as any);
                }
            },
            onClose: onClose,
        });

        return () => {
            detailSidebarStore.setState(null);
        };
    }, [detailTab, docSubTab, partySubTab, discSubTab, historySubTab, detailSidebarTabs, contract, onClose]);

    useEffect(() => {
        const meta = contract.workflow_step?.meta || {};
        const isAudit = detailTab === 'audit';
        const isMembers = detailTab === 'members' && meta.show_tab_members !== false;
        const isParty = detailTab === 'parties' || detailTab === 'requester' || detailTab === 'vendor';
        const isExternalTab = isAudit || isMembers || isParty;

        if (tabs.length > 0 && !tabs.some(t => t.id === detailTab) && !isExternalTab) {
            setDetailTab(tabs[0].id);
        } else if (tabs.length === 0 && !isExternalTab) {
            setDetailTab('empty');
        }
    }, [tabs, detailTab, contract.workflow_step?.meta]);

    const currentActiveTab = tabs.find((t) => t.id === detailTab) || detailSidebarTabs.find((t) => t.id === detailTab);
    const currentActiveSubLabel = useMemo(() => {
        if (detailTab === 'documents') {
            if (docSubTab === 'f1') return 'F1 (Permohonan)';
            if (docSubTab === 'f2') return 'F2 (Ringkasan)';
            if (docSubTab === 'agreement') return 'Draft Perjanjian';
        }
        if (detailTab === 'parties') {
            if (partySubTab === 'requester') return 'Informasi Pengaju';
            if (partySubTab === 'vendor') return 'Pihak Kedua / Vendor';
        }
        if (detailTab === 'requester') return 'Informasi Pengaju';
        if (detailTab === 'vendor') return 'Pihak Kedua / Vendor';
        if (detailTab === 'history') {
            if (historySubTab === 'timeline') return 'Alur Approval & Proses';
            if (historySubTab === 'audit') return 'Audit Log & Activity';
        }
        if (detailTab === 'discussion') {
            if (discSubTab === 'chat') return 'Chat & Diskusi';
            if (discSubTab === 'members') return 'Member / Anggota Tim';
        }
        return undefined;
    }, [detailTab, docSubTab, partySubTab, historySubTab, discSubTab]);


    return (
        <div className="mx-auto flex w-full max-w-full flex-1 flex-col relative h-full overflow-hidden">
            {/* Action & Status Header Bar (h-16 matching sub side nav, no shadow) */}
            <div className="sticky top-0 z-50 flex h-16 min-h-[64px] max-h-[64px] shrink-0 items-center justify-between px-5 bg-background border-b border-border transition-all duration-200 box-border">
                {/* Left Side: Document Title (Editable) + Section Breadcrumb */}
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex flex-col justify-center min-w-0">
                        {isEditingTitle && isDraftTitle ? (
                            <input
                                autoFocus
                                value={headerTitle}
                                onChange={(e) => setHeaderTitle(e.target.value)}
                                onBlur={handleTitleBlur}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleTitleBlur(); }}
                                className="text-foreground text-[14px] font-bold bg-muted border-b border-primary focus:outline-none min-w-[280px] md:min-w-[450px] px-2 py-0.5 rounded leading-tight"
                                placeholder="Masukkan judul dokumen..."
                            />
                        ) : (
                            <div className="flex items-center gap-2 min-w-0">
                                <h1 
                                    className={cn(
                                        'text-foreground text-[14px] font-bold tracking-tight truncate max-w-[360px] md:max-w-[550px] leading-tight',
                                        isDraftTitle && 'cursor-pointer hover:text-primary transition-colors'
                                    )}
                                    onClick={() => { if (isDraftTitle) setIsEditingTitle(true); }}
                                    title={isDraftTitle ? "Klik untuk mengedit judul" : contract.title}
                                >
                                    {contract.title || <span className="italic text-muted-foreground">Tanpa Judul</span>}
                                </h1>
                                {isDraftTitle && (
                                    <span className="text-[10px] text-muted-foreground/60 font-normal select-none">(edit)</span>
                                )}
                            </div>
                        )}
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5 leading-tight truncate">
                            <span>{currentActiveTab?.label || 'Dokumen'}</span>
                            {currentActiveSubLabel && (
                                <>
                                    <span className="opacity-40">/</span>
                                    <span className="text-primary font-semibold">{currentActiveSubLabel}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Status & Save Buttons */}
                <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={contract.status} statusInfo={contract.status_info} />

                    {/* Save button in navbar when contract info has changes */}
                    {hasInfoChanges && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-3 duration-200">
                            <button
                                type="button"
                                onClick={() => onResetInfoChanges?.()}
                                disabled={infoSaving}
                                className="px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all cursor-pointer disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <Button
                                variant="primary"
                                onClick={() => onSaveInfoChanges?.()}
                                disabled={infoSaving}
                                className="h-8 px-4 text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                            >
                                {infoSaving ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        <span>Menyimpan...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check size={14} />
                                        <span>Simpan Perubahan</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden p-3 lg:p-4 h-[calc(100vh-48px)]">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_390px] h-full min-h-0 items-stretch">
                    {/* Left Column: Form / Document Detail */}
                    <div className="flex flex-col min-w-0 h-full min-h-0">
                        {contract.workflow_step?.meta?.show_document_detail !== false && (
                            <div className="bg-surface-base border-surface-border overflow-hidden rounded-xl border shadow-xs flex-1 flex flex-col min-h-0 h-full">
                                <div className="flex flex-1 flex-col min-h-0 h-full overflow-hidden">
                                    <Suspense fallback={<TabSkeleton />}>
                                {detailTab === 'documents' && (() => {
                                    const meta = contract.workflow_step?.meta || {};
                                    const hasF1 = meta.show_tab_f1 !== false && ((contract as any).f1_mode || 'upload') !== 'none';
                                    const hasF2 = meta.show_tab_f2 !== false && ((contract as any).f2_mode || 'upload') !== 'none';
                                    const hasAgreement = meta.show_tab_agreement !== false && ((contract as any).contract_mode || 'upload') !== 'none';

                                    const docSubTabs = [
                                        { id: 'f1', label: 'F1 (Permohonan)', icon: FileText, show: hasF1 },
                                        { id: 'f2', label: 'F2 (Ringkasan)', icon: FileCheck, show: hasF2 },
                                        { id: 'agreement', label: 'Perjanjian', icon: PenTool, show: hasAgreement },
                                    ].filter(t => t.show);

                                    const activeSub = docSubTabs.some(t => t.id === docSubTab) ? docSubTab : (docSubTabs[0]?.id || 'f1');

                                    return (
                                        <div className="flex flex-col flex-1">
                                            <div className="flex-1">
                                                {activeSub === 'f1' && (
                                                    <F1Tab
                                                        contract={contract}
                                                        formTemplates={formTemplates}
                                                        vendors={vendors}
                                                        meUser={meUser}
                                                        onUpdate={onUpdate}
                                                        onFormDirty={(dirty) => setHasInfoChanges(dirty)}
                                                        onFormSave={(fn) => {
                                                            saveInfoRef.current = fn;
                                                        }}
                                                    />
                                                )}
                                                {activeSub === 'f2' && (
                                                    <F2Tab
                                                        contract={contract}
                                                        formTemplates={formTemplates}
                                                        vendors={vendors}
                                                        meUser={meUser}
                                                        onUpdate={onUpdate}
                                                        onFormDirty={(dirty) => setHasInfoChanges(dirty)}
                                                        onFormSave={(fn) => {
                                                            saveInfoRef.current = fn;
                                                        }}
                                                    />
                                                )}
                                                {activeSub === 'agreement' && (
                                                    <AgreementTab
                                                        contract={contract}
                                                        formTemplates={formTemplates}
                                                        vendors={vendors}
                                                        meUser={meUser}
                                                        onUpdate={onUpdate}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}
                                {(detailTab === 'parties' || detailTab === 'requester' || detailTab === 'vendor') && (
                                    <div className="flex-1 min-h-0 flex flex-col">
                                        {(partySubTab === 'requester' || detailTab === 'requester') && (
                                            <RequesterInfoCard selected={contract} isTabView={true} />
                                        )}
                                        {(partySubTab === 'vendor' || detailTab === 'vendor') && (
                                            <VendorInfoCard selected={contract} isTabView={true} />
                                        )}
                                    </div>
                                )}
                                {detailTab === 'attachments' && (
                                    <AttachmentsTab contract={contract} canUpdate={canUpdate} onUpdate={onUpdate} showToast={showToast} meUser={meUser} />
                                )}

                                {detailTab === 'history' && (() => {
                                    const activeSub = ['timeline', 'audit'].includes(historySubTab) ? historySubTab : 'timeline';

                                    return (
                                        <div className="flex-1 min-h-0 flex flex-col">
                                            {activeSub === 'timeline' && (
                                                <TimelineTab
                                                    contract={contract}
                                                    meId={meId}
                                                    onApprove={(note, file) => handleApprove(note, file)}
                                                    showToast={showToast}
                                                />
                                            )}
                                            {activeSub === 'audit' && <AuditTrailTab contract={contract} />}
                                        </div>
                                    );
                                })()}
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

                                {detailTab === 'discussion' && (() => {
                                    const activeSub = ['chat', 'members'].includes(discSubTab) ? discSubTab : 'chat';

                                    return (
                                        <div className="flex-1 min-h-0 flex flex-col">
                                            {activeSub === 'chat' && <ChatTab contract={contract} meId={meId} users={vendors} onUpdate={onUpdate} />}
                                            {activeSub === 'members' && <MembersTab contract={contract} users={users} />}
                                        </div>
                                    );
                                })()}
                                {detailTab === 'empty' && (
                                    <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-slate-400">
                                        <FileText size={48} className="mb-4 text-slate-300 opacity-50" />
                                        <p className="text-sm font-semibold uppercase">Tidak Ada Tab Tersedia</p>
                                        <p className="mt-1 text-xs text-slate-500">Semua tab disembunyikan berdasarkan pengaturan alur kerja saat ini.</p>
                                    </div>
                                )}
                            </Suspense>
                        </div>
                    </div>
                    )}
                </div>
                {/* Right Column: Panel Informasi & Aksi */}
                <div className="flex flex-col gap-4 min-w-0 h-full min-h-0 overflow-y-auto custom-scrollbar pr-1">
                    {canApprove && contract.workflow_step?.meta?.show_action_panel !== false && (
                        <div className="bg-surface-base border-surface-border overflow-hidden rounded-xl border shadow-xs">
                            <div className="bg-primary rounded-t-xl flex h-9.5 min-h-[38px] max-h-[38px] items-center justify-between border-b border-primary/80 px-4">
                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-tight text-primary-foreground">
                                    <Zap size={15} className="text-primary-foreground/90" /> {isSigner ? 'Upload Tanda Tangan Dibutuhkan' : 'Approval Dibutuhkan'}
                                </div>
                                <span className="rounded bg-white/20 border border-white/30 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase">
                                    {isSigner ? activeSignerApproval?.role : 'Reviewer'}
                                </span>
                            </div>
                            <div className="p-3.5 flex flex-col gap-3">
                            <div className="flex flex-col gap-2 pt-1">
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
                                                            const hasSignersAssigned = (contract?.approvals || []).some(
                                                                (a: any) => String(a.workflow_step_id) === String(contract.workflow_step_id) && 
                                                                            (a.role === 'Penandatangan' || a.role === 'Pihak 1' || a.role === 'Pihak 2' || a.role === action.alias)
                                                            );
                                                            if (hasSignersAssigned) {
                                                                setApproveOpen(true);
                                                            } else {
                                                                setSignerOpen(true);
                                                            }
                                                        } else {
                                                            setApproveOpen(true);
                                                        }
                                                    }}
                                                     className={cn(
                                                        'w-full text-xs uppercase shadow-none transition-all',
                                                        isApproveType && 'font-semibold',
                                                        isRejectType && 'bg-rose-600 text-white hover:bg-rose-700 font-semibold',
                                                        isForwardType && 'bg-primary text-primary-foreground hover:bg-primary/90 font-semibold',
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
                                                    className="w-full text-xs uppercase shadow-none font-semibold"
                                                >
                                                    <CheckCircle2 size={16} />{' '}
                                                    {contract.workflow_step?.step === 1
                                                        ? 'Kirim Persetujuan'
                                                        : contract.requires_pic_assignment
                                                            ? 'Tugaskan PIC'
                                                            : 'Setujui Kontrak'}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setActiveActionCode('reject');
                                                        setRejectOpen(true);
                                                    }}
                                                    className="w-full text-xs uppercase bg-rose-600 text-white hover:bg-rose-700 font-semibold shadow-none transition-all"
                                                >
                                                    <AlertCircle size={16} /> Tolak Kontrak
                                                </Button>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                            </div>
                        </div>
                    )}

                    {contract.workflow_step?.meta?.show_info !== false && (
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
                            onStateChange={(hasChanges, isSaving) => {
                                setHasInfoChanges(hasChanges);
                                setInfoSaving(isSaving);
                            }}
                            saveRef={saveInfoRef}
                            resetRef={resetInfoRef}
                        />
                    )}

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
