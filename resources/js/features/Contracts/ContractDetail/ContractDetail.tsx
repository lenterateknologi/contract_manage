import { Icons } from '@/components/ui';
import { parseApiErrorMessage } from '@/lib/utils';
import { ContractActionSection } from '@/features/Contracts/components/parts/ContractActionSection';
import { ContractDetailHeader } from '@/features/Contracts/components/parts/ContractDetailHeader';
import { DraftEditableInfoCard } from '@/features/Contracts/components/parts/DraftEditableInfoCard';
import { Contract, ContractType } from '@/features/Contracts/types';
import { contractApi } from '@/features/Contracts/utils';
import { resolveContractRequirements } from '@/features/Contracts/utils/requirements';
import { matchUserAgainstWorkflowPool } from '@/features/workflows';
import { detailSidebarStore, type DetailSidebarTabChild, type DetailSidebarTabItem } from '@/stores/useDetailSidebarStore';
import { usePage } from '@inertiajs/react';
import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';

const {
    Building2,
    Clock,
    FileCheck,
    FileText,
    GitCommit,
    History,
    Link2,
    MessageSquare,
    Paperclip,
    PenTool,
    ShieldCheck,
    ShoppingCart,
    User,
    UserCheck,
    Users,
    Workflow,
} = Icons;

import { usePermissions } from '@/hooks/use-permissions';

// Lazy load modals
const AdminChangeWorkflowModal = lazy(() =>
    import('@/features/Contracts/components/admin/AdminChangeWorkflowModal').then((m) => ({ default: m.AdminChangeWorkflowModal })),
);
const SharedAddhocModal = lazy(() =>
    import('@/features/Contracts/components/modals/shared/SharedAddhocModal').then((m) => ({ default: m.SharedAddhocModal })),
);
const SharedActionModal = lazy(() =>
    import('@/features/Contracts/components/modals/shared/SharedApproveModal').then((m) => ({ default: m.SharedActionModal })),
);
const SharedAssignModal = lazy(() =>
    import('@/features/Contracts/components/modals/shared/SharedAssignModal').then((m) => ({ default: m.SharedAssignModal })),
);

import { DetailSubTabs } from './components/DetailSubTabs';

// Lazy load Tab Components for performance
const DocumentsTab = lazy(() => import('./tabs/documents/DocumentsTab').then((m) => ({ default: m.DocumentsTab })));
const PartiesTab = lazy(() => import('./tabs/parties/PartiesTab').then((m) => ({ default: m.PartiesTab })));
const HistoryTab = lazy(() => import('./tabs/history/HistoryTab').then((m) => ({ default: m.HistoryTab })));
const DiscussionTab = lazy(() => import('./tabs/discussion/DiscussionTab').then((m) => ({ default: m.DiscussionTab })));
const ReferencesTab = lazy(() => import('./tabs/references/ReferencesTab').then((m) => ({ default: m.ReferencesTab })));
const ContractAttachments = lazy(() => import('../components/tabs/ContractAttachments'));

import LoadingLottie from '@/components/ui/feedback/LoadingLottie';

const TabSkeleton = () => (
    <div className="flex min-h-[400px] w-full flex-1 items-center justify-center p-6">
        <LoadingLottie width={120} height={120} />
    </div>
);

import { cleanupStorage, getClientPref, setClientPref } from '@/lib/clientStorage';

export const ContractDetailView = ({
    contract,
    meId,
    types = [],
    submissionTypes = [],
    vendors = [],
    formTemplates = [],
    users = [],
    canUpdate = true,
    onClose,
    onUpdate,
    showToast,
    meUser,
    setPreviewTitle,
    setPreviewUrl,
    setPreviewHasFile,
    setPreviewOpen,
}: {
    contract: Contract;
    meId?: string;
    types?: ContractType[];
    submissionTypes?: any[];
    vendors?: any[];
    formTemplates?: any[];
    users?: any[];
    canUpdate?: boolean;
    onClose: () => void;
    onUpdate?: (updated: Contract, silent?: boolean) => void;
    showToast: (toast: { title?: string; message: string; type: 'success' | 'error' | 'info' | 'warning' } | string, type?: any) => void;
    setDeleteOpen: (open: boolean) => void;
    meUser?: any;
    setPreviewTitle: (title: string) => void;
    setPreviewUrl: (url: string) => void;
    setPreviewHasFile: (hasFile: boolean) => void;
    setPreviewOpen: (open: boolean) => void;
}) => {
    // Run lightweight periodic cleanup on mount
    useEffect(() => {
        cleanupStorage();
    }, []);

    const { masterContractStatuses } = usePage<any>().props;
    const params = new URLSearchParams(window.location.search);

    // Tab
    const rawTab = params.get('tab') || getClientPref<string>('detail_tab', 'documents');
    const initialTab = rawTab === 'reference' ? 'references' : rawTab === 'vendor' ? 'parties' : rawTab;
    const [detailTab, setDetailTabState] = useState(initialTab);

    const currentSub = params.get('subtab');

    // Document subtab (f1, f2, agreement)
    const rawDocSub =
        (initialTab === 'documents' && currentSub) || params.get('docsubtab') || getClientPref<'f1' | 'f2' | 'agreement'>('detail_doc_subtab', 'f1');
    const [docSubTab, setDocSubTabState] = useState<'f1' | 'f2' | 'agreement'>(
        ['f1', 'f2', 'agreement'].includes(rawDocSub) ? (rawDocSub as any) : 'f1',
    );

    // Parties subtab
    const rawPartySub =
        (initialTab === 'parties' && currentSub) || params.get('partysubtab') || getClientPref<string>('detail_party_subtab', 'requester');
    const initialPartySub =
        rawPartySub === 'vendor' ? 'second_party' : ['sla', 'advanced_info', 'timeline'].includes(rawPartySub) ? 'timeline' : rawPartySub;
    const [partySubTab, setPartySubTabState] = useState<'requester' | 'second_party' | 'pic' | 'timeline'>(
        (['requester', 'second_party', 'pic', 'timeline'].includes(initialPartySub) ? initialPartySub : 'requester') as any,
    );

    // Discussion subtab
    const rawDiscSub = (initialTab === 'discussion' && currentSub) || params.get('discsubtab') || getClientPref<string>('detail_disc_subtab', 'chat');
    const [discSubTab, setDiscSubTabState] = useState<'chat' | 'members'>((['chat', 'members'].includes(rawDiscSub) ? rawDiscSub : 'chat') as any);

    // History subtab
    const rawHistSub =
        (initialTab === 'history' && currentSub) || params.get('histsubtab') || getClientPref<string>('detail_hist_subtab', 'timeline');
    const [historySubTab, setHistorySubTabState] = useState<'timeline' | 'related_workflows' | 'audit'>(
        (['timeline', 'related_workflows', 'audit'].includes(rawHistSub) ? rawHistSub : 'timeline') as any,
    );

    // Ref subtab
    const rawRefSub = (initialTab === 'references' && currentSub) || params.get('refsubtab') || getClientPref<string>('detail_ref_subtab', 'parent');
    const [refSubTab, setRefSubTabState] = useState<'parent' | 'purchase_orders'>(
        (['parent', 'purchase_orders'].includes(rawRefSub) ? rawRefSub : 'parent') as any,
    );

    // Clean single URL param updater
    const updateUrlParams = (newTab: string, newSubtab?: string) => {
        const newParams = new URLSearchParams();
        newParams.set('tab', newTab);
        if (newSubtab) {
            newParams.set('subtab', newSubtab);
        }
        window.history.replaceState({}, '', `${window.location.pathname}?${newParams.toString()}`);
    };

    useEffect(() => {
        // Clean up legacy noisy query params on mount
        const search = window.location.search;
        if (search.includes('discsubtab=') || search.includes('histsubtab=') || search.includes('partysubtab=') || search.includes('refsubtab=')) {
            const activeSub =
                detailTab === 'documents'
                    ? docSubTab
                    : detailTab === 'parties'
                      ? partySubTab
                      : detailTab === 'discussion'
                        ? discSubTab
                        : detailTab === 'history'
                          ? historySubTab
                          : detailTab === 'references'
                            ? refSubTab
                            : undefined;
            updateUrlParams(detailTab, activeSub);
        }
    }, []);

    const setDetailTab = (tab: string) => {
        setDetailTabState(tab);
        setClientPref('detail_tab', tab);
        let activeSub: string | undefined;
        if (tab === 'documents') activeSub = docSubTab;
        else if (tab === 'parties') activeSub = partySubTab;
        else if (tab === 'discussion') activeSub = discSubTab;
        else if (tab === 'history') activeSub = historySubTab;
        else if (tab === 'references') activeSub = refSubTab;
        updateUrlParams(tab, activeSub);
    };

    const setPartySubTab = (sub: 'requester' | 'second_party' | 'pic' | 'timeline') => {
        setPartySubTabState(sub);
        setClientPref('detail_party_subtab', sub);
        updateUrlParams(detailTab, sub);
    };

    const setDocSubTab = (sub: 'f1' | 'f2' | 'agreement') => {
        setDocSubTabState(sub);
        setClientPref('detail_doc_subtab', sub);
        updateUrlParams(detailTab, sub);
    };

    const setDiscSubTab = (sub: 'chat' | 'members') => {
        setDiscSubTabState(sub);
        setClientPref('detail_disc_subtab', sub);
        updateUrlParams(detailTab, sub);
    };

    const setHistorySubTab = (sub: 'timeline' | 'related_workflows' | 'audit') => {
        setHistorySubTabState(sub);
        setClientPref('detail_hist_subtab', sub);
        updateUrlParams(detailTab, sub);
    };

    const setRefSubTab = (sub: 'parent' | 'purchase_orders') => {
        setRefSubTabState(sub);
        setClientPref('detail_ref_subtab', sub);
        updateUrlParams(detailTab, sub);
    };

    const { isAdmin } = usePermissions();
    const [processing, setProcessing] = useState(false);
    const [actionModalOpen, setActionModalOpen] = useState(false);
    const [assignOpen, setAssignOpen] = useState(false);
    const [addhocOpen, setAddhocOpen] = useState(false);
    const [adminWorkflowModalOpen, setAdminWorkflowModalOpen] = useState(false);
    const [showSpecialActions, setShowSpecialActions] = useState(false);
    const canEditTitle =
        contract?.workflow_step?.meta?.allow_info_edit !== false &&
        (contract?.workflow_step?.meta as any)?.allow_title_edit !== false &&
        contract?.allow?.title_edit !== false &&
        contract?.allow_title_edit !== false;

    if (!contract) {
        return null;
    }

    const [hasInfoChanges, setHasInfoChanges] = useState(false);
    const [infoSaving, setInfoSaving] = useState(false);
    const [hasFormChanges, setHasFormChanges] = useState(false);
    const saveInfoCardRef = React.useRef<(() => Promise<void>) | null>(null);
    const resetInfoCardRef = React.useRef<(() => void) | null>(null);
    const saveFormRef = React.useRef<(() => Promise<void>) | null>(null);

    const isAnyDirty = hasInfoChanges || hasFormChanges;

    const onSaveAllChanges = async () => {
        setInfoSaving(true);
        try {
            if (hasInfoChanges && saveInfoCardRef.current) {
                await saveInfoCardRef.current();
            }
            if (hasFormChanges && saveFormRef.current) {
                await saveFormRef.current();
            }
        } finally {
            setInfoSaving(false);
        }
    };

    const onResetAllChanges = () => {
        resetInfoCardRef.current?.();
    };

    const autoSaveDirtyDataBeforeAction = async () => {
        if (hasInfoChanges && saveInfoCardRef.current) {
            await saveInfoCardRef.current();
        }
        if (hasFormChanges && saveFormRef.current) {
            await saveFormRef.current();
        }
    };

    const handleContractUpdate = (updated: Contract, silent?: boolean) => {
        onUpdate?.(updated, silent);
    };

    const handleUpdate = async (data: any, silent = false) => {
        if (!silent) setProcessing(true);
        try {
            const c = await contractApi.update(contract.id, data);
            handleContractUpdate(c, silent);
            if (!silent) showToast('Informasi pengajuan diperbarui.', 'success');
            return c;
        } catch (error) {
            if (!silent) showToast(parseApiErrorMessage(error, 'Gagal memperbarui pengajuan.'), 'danger');
            throw error;
        } finally {
            if (!silent) setProcessing(false);
        }
    };

    const [activeActionCode, setActiveActionCode] = useState<string | undefined>(undefined);
    const [activeStepAction, setActiveStepAction] = useState<any>(null);

    const handleActionSubmit = async (
        note: string,
        attachment?: File | File[],
        assignedPicId?: string,
        executionOrder?: string,
        actionCode?: string,
        isFinal?: boolean,
        targetStepId?: string,
        actionId?: string,
    ) => {
        const resolvedCode = actionCode || activeActionCode;

        if (resolvedCode === 'reject') {
            try {
                await autoSaveDirtyDataBeforeAction();
                const updated = await contractApi.reject(contract.id, note, attachment, actionId || activeStepAction?.id);
                handleContractUpdate(updated);
                showToast('Pengajuan ditolak.', 'info');
                setActiveActionCode(undefined);
                setActiveStepAction(null);
            } catch (error) {
                showToast(parseApiErrorMessage(error, 'Gagal memproses penolakan.'), 'danger');
            }
            return;
        }

        try {
            await autoSaveDirtyDataBeforeAction();
            const c = await contractApi.approve(
                contract.id,
                note,
                attachment,
                assignedPicId,
                executionOrder,
                resolvedCode,
                isFinal,
                targetStepId,
                actionId || activeStepAction?.id,
            );
            handleContractUpdate(c);

            let msg =
                contract.status === 'draft' && contract.workflow_step?.step === 1
                    ? 'Pengajuan persetujuan berhasil dikirim.'
                    : 'Pengajuan disetujui.';
            if (assignedPicId) msg = 'PIC ditugaskan dan pengajuan disetujui.';
            if (isFinal) msg = 'Penandatanganan selesai dikonfigurasi sebagai final.';

            showToast(msg, 'success');
            setActiveActionCode(undefined);
            setActiveStepAction(null);
        } catch (error: any) {
            showToast(parseApiErrorMessage(error, 'Gagal memproses persetujuan.'), 'danger');
        }
    };

    const activePendingApproval = useMemo(() => {
        if (!contract.approvals) return null;
        if (contract.pending_approval_id) {
            const found = contract.approvals.find((a: any) => a.id === contract.pending_approval_id);
            if (found) return found;
        }
        return contract.approvals.find(
            (a: any) => (a.status === 'pending' || a.status === 'waiting') && (a.user_id === meId || (a.user && a.user.id === meId)),
        );
    }, [contract.approvals, contract.pending_approval_id, meId]);

    const isStepAuthorityMatched = useMemo(() => {
        if (!contract.workflow_step) return false;
        const currentUserObj = meUser || { id: meId };
        const authorities = (contract.workflow_step as any).approver_authorities || (contract.workflow_step as any).authorities;
        if (!authorities || authorities.length === 0) {
            if (contract.workflow_step.approver_type === 'initiator') {
                return (contract.initiator?.id || contract.initiated_by_id) === meId;
            }
            if (contract.workflow_step.approver_type === 'assigned_pic') {
                return (contract.assigned_pic?.id || contract.assigned_pic_id) === meId;
            }
            if (contract.workflow_step.role && meUser?.role) {
                const roles = Array.isArray(contract.workflow_step.role) ? contract.workflow_step.role : [contract.workflow_step.role];
                return roles.some((r: string) => String(r).toLowerCase() === String(meUser.role).toLowerCase());
            }
            return false;
        }
        return matchUserAgainstWorkflowPool(currentUserObj, { authorities }, contract);
    }, [contract.workflow_step, meUser, contract, meId]);

    const canApprove = useMemo(() => {
        return (
            !!contract.can_approve ||
            !!contract.is_current_actor ||
            !!activePendingApproval ||
            !!contract.pending_approval_id ||
            isStepAuthorityMatched ||
            (contract.status === 'in_review' && !!contract.workflow_step_id)
        );
    }, [
        contract.can_approve,
        contract.is_current_actor,
        activePendingApproval,
        contract.pending_approval_id,
        isStepAuthorityMatched,
        contract.status,
        contract.workflow_step_id,
    ]);

    const isSubStepReviewer = useMemo(() => {
        return !!activePendingApproval && (activePendingApproval.sub_step != null || activePendingApproval.role === 'Persetujuan Tambahan');
    }, [activePendingApproval]);

    const applicableStepActions = useMemo(() => {
        const rawActions = contract.workflow_step?.actions || [];
        return [...rawActions].sort((a: any, b: any) => {
            const orderA = a.transition_config?.order ?? 999;
            const orderB = b.transition_config?.order ?? 999;
            return orderA - orderB;
        });
    }, [contract.workflow_step?.actions]);

    // Custom / Default Actions Evaluation
    const availableCustomActions = useMemo(() => {
        if (isSubStepReviewer) return [];

        // ponytail: Gunakan custom action dari workflow aktif saat ini (sub atau origin)
        const customActions: any[] =
            contract.workflow?.meta?.custom_actions ||
            ((contract.workflow_step as any)?.workflow as any)?.meta?.custom_actions ||
            (!contract.is_in_sub_workflow ? contract.origin_workflow?.meta?.custom_actions : []) ||
            [];
        if (!customActions || !Array.isArray(customActions) || customActions.length === 0) return [];

        const hasAssignedPic = !!(contract.assigned_pic?.id || contract.assigned_pic_id);
        const hasSigners = (contract.approvals || []).some((a: any) => a.role === 'Pihak 1' || a.role === 'Pihak 2' || a.role === 'Penandatangan');

        return customActions.filter((act) => {
            if (act.is_active === false) return false;

            // Do not allow nested ad-hoc action on ad-hoc review steps
            if (
                act.action_code === 'add_adhoc' &&
                (contract.workflow_step?.step_category === 'adhoc_review' || (contract.workflow_step?.meta as any)?.is_adhoc_step)
            ) {
                return false;
            }

            // Step scope check
            if (act.scope === 'specific_steps' && Array.isArray(act.step_ids) && act.step_ids.length > 0) {
                const currentStepId = String(contract.workflow_step_id);
                const currentStepSeq = contract.workflow_step?.step;
                const matchStep = act.step_ids.some((sid: string) => String(sid) === currentStepId || String(sid) === String(currentStepSeq));
                if (!matchStep) return false;
            }

            // Smart Visibility Condition check
            if (act.visibility_condition === 'no_pic' && hasAssignedPic) return false;
            if (act.visibility_condition === 'require_pic' && !hasAssignedPic) return false;
            if (act.visibility_condition === 'no_signers' && hasSigners) return false;
            if (act.visibility_condition === 'has_signers' && !hasSigners) return false;

            // Authority check: jika otoritas tidak ditentukan/kosong, aksi muncul secara default
            const authorities = act.authorities || [];
            if (!authorities || authorities.length === 0) return true;

            // Use the unified matchUserAgainstWorkflowPool to evaluate the logged-in user
            const currentUserObj = meUser || { id: meId };
            return matchUserAgainstWorkflowPool(currentUserObj, { authorities }, contract);
        });
    }, [
        contract.workflow,
        contract.origin_workflow,
        contract.workflow_step,
        contract.workflow_step_id,
        contract.created_by,
        contract.initiated_by_id,
        contract.assigned_pic?.id,
        contract.assigned_pic_id,
        contract.approvals,
        contract.initiator,
        contract.creator,
        meId,
        meUser,
        isSubStepReviewer,
    ]);

    // Check if standard step action panel is blocked by any custom action that requires completion first
    const isStepActionLocked = useMemo(() => {
        return availableCustomActions.some((act) => act.unlocks_other_actions);
    }, [availableCustomActions]);

    const activeSignerApproval = useMemo(() => {
        return (contract.approvals || []).find(
            (a: any) => a.status === 'pending' && a.user_id === meId && (a.role === 'Pihak 1' || a.role === 'Pihak 2' || a.role === 'Penandatangan'),
        );
    }, [contract.approvals, meId]);

    const isSigner = !!activeSignerApproval;

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
                handleContractUpdate(res);
                showToast('Dokumen berhasil diunduh.', 'success');
            } catch (e) {
                console.error(e);
            }
        } else if (action === 'upload' && file) {
            setSigningUploading(true);
            try {
                const res = await contractApi.approve(contract.id, 'Pembaruan Dokumen TTD', file);
                handleContractUpdate(res);
                showToast('Pembaruan Dokumen TTD berhasil diunggah.', 'success');
            } catch (e: any) {
                showToast(e.response?.data?.message || 'Gagal mengunggah dokumen.', 'danger');
            } finally {
                setSigningUploading(false);
            }
        }
    };

    const tabs = useMemo(() => {
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
            { id: 'parties', label: 'Informasi Lanjutan', icon: Users, mode: 'always' },
        ].filter((tab) => tab.mode !== 'none');
    }, [contract]);

    // Tracking review status per step
    const currentStepKey = contract.workflow_step_id ? `step_${contract.workflow_step_id}` : 'general';
    const stepReviews = useMemo(() => {
        return ((contract as any).doc_reviews?.[currentStepKey] ||
            contract.metadata?.doc_reviews?.[currentStepKey] ||
            contract.metadata?.[`doc_reviews_${currentStepKey}`] ||
            {}) as Record<string, any>;
    }, [(contract as any).doc_reviews, contract.metadata, currentStepKey]);

    // Track viewed tabs to avoid duplicate review calls in same session
    const reviewedInSessionRef = React.useRef<Set<string>>(new Set());

    useEffect(() => {
        // Only trigger doc review if user is authorized to approve/review in this step
        if (contract.can_approve && detailTab === 'documents' && ['f1', 'f2', 'agreement'].includes(docSubTab)) {
            const isAlreadyReviewed = !!stepReviews[docSubTab]?.reviewed;
            const sessionKey = `${contract.id}_${currentStepKey}_${docSubTab}`;

            if (!isAlreadyReviewed && !reviewedInSessionRef.current.has(sessionKey)) {
                reviewedInSessionRef.current.add(sessionKey);
                contractApi
                    .reviewDoc(contract.id, docSubTab)
                    .then((res) => {
                        if (res?.contract) {
                            handleContractUpdate(res.contract, true);
                        }
                    })
                    .catch((err) => {
                        console.error('Failed to log doc review:', err);
                    });
            }
        }
    }, [detailTab, docSubTab, contract.id, contract.can_approve, currentStepKey, stepReviews]);

    // Build hierarchical tree tabs for sub-sidebar
    const detailSidebarTabs: DetailSidebarTabItem[] = useMemo(() => {
        const meta = contract.workflow_step?.meta || {};
        const result: DetailSidebarTabItem[] = [];

        // Check required fields for this step/action only if user is current actor
        const isCurrentActor = contract?.is_current_actor ?? contract?.can_approve ?? false;
        const reqResult = isCurrentActor
            ? resolveContractRequirements(contract)
            : { items: [], hasRequirements: false, allFilled: true, totalCount: 0, filledCount: 0 };
        const reqReviewF1 = isCurrentActor && reqResult.items.some((it) => it.id === 'review_f1' || it.id === 'f1');
        const reqReviewF2 = isCurrentActor && reqResult.items.some((it) => it.id === 'review_f2' || it.id === 'f2');
        const reqReviewAgreement = isCurrentActor && reqResult.items.some((it) => it.id === 'review_agreement' || it.id === 'agreement');

        // 1. Dokumen Tab (with subtabs f1, f2, agreement)
        const hasF1 = meta.show_tab_f1 !== false && ((contract as any).f1_mode || 'upload') !== 'none';
        const hasF2 = meta.show_tab_f2 !== false && ((contract as any).f2_mode || 'upload') !== 'none';
        const hasAgreement = meta.show_tab_agreement !== false && ((contract as any).contract_mode || 'upload') !== 'none';

        if (hasF1 || hasF2 || hasAgreement) {
            const children: DetailSidebarTabChild[] = [];
            if (hasF1) {
                const isRev = !!stepReviews.f1?.reviewed;
                children.push({
                    id: 'f1',
                    label: 'F1 (Permohonan)',
                    icon: FileText,
                    isReviewed: isRev,
                    badge: isRev ? 'Direview' : reqReviewF1 ? 'Perlu Review' : undefined,
                    badgeVariant: isRev ? 'success' : 'warning',
                });
            }
            if (hasF2) {
                const isRev = !!stepReviews.f2?.reviewed;
                children.push({
                    id: 'f2',
                    label: 'F2 (Ringkasan)',
                    icon: FileCheck,
                    isReviewed: isRev,
                    badge: isRev ? 'Direview' : reqReviewF2 ? 'Perlu Review' : undefined,
                    badgeVariant: isRev ? 'success' : 'warning',
                });
            }
            if (hasAgreement) {
                const isRev = !!stepReviews.agreement?.reviewed;
                children.push({
                    id: 'agreement',
                    label: 'Draft Perjanjian',
                    icon: PenTool,
                    isReviewed: isRev,
                    badge: isRev ? 'Direview' : reqReviewAgreement ? 'Perlu Review' : undefined,
                    badgeVariant: isRev ? 'success' : 'warning',
                });
            }

            result.push({
                id: 'documents',
                label: 'Dokumen',
                icon: FileText,
                children: children.length > 1 ? children : undefined,
            });
        }

        // 2. Informasi Lanjutan Tab (with subtabs Informasi Pengaju, Informasi Pihak Kedua, Informasi PIC, Timeline)
        result.push({
            id: 'parties',
            label: 'Informasi Lanjutan',
            icon: Users,
            children: [
                { id: 'requester', label: 'Informasi Pengaju', icon: User },
                { id: 'second_party', label: 'Informasi Pihak Kedua', icon: Building2 },
                { id: 'pic', label: 'Informasi PIC', icon: UserCheck },
                { id: 'timeline', label: 'Timeline', icon: Clock },
            ],
        });

        // 3. Riwayat & Alur Tab
        const hasTimeline = meta.show_tab_timeline !== false;
        const ENABLE_RELATED_WORKFLOWS_TAB = false; // Feature toggle: di-disable sementara tanpa menghapus file / logic

        result.push({
            id: 'history',
            label: 'Riwayat & Alur',
            icon: History,
            children: [
                ...(hasTimeline
                    ? [
                          { id: 'timeline', label: 'Alur Approval & Proses', icon: GitCommit },
                          ...(ENABLE_RELATED_WORKFLOWS_TAB ? [{ id: 'related_workflows', label: 'Workflow Terkait', icon: Workflow }] : []),
                      ]
                    : []),
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

        // 6. Referensi Tab (with subtabs Dokumen / Kontrak Induk & Purchase Order)
        if (meta.show_tab_references !== false) {
            result.push({
                id: 'references',
                label: 'Referensi',
                icon: Link2,
                children: [
                    { id: 'parent', label: 'Kontrak Induk / Terkait', icon: Link2 },
                    { id: 'purchase_orders', label: 'Purchase Order (PO)', icon: ShoppingCart },
                ],
            });
        }

        return result;
    }, [contract]);

    // Synchronize detail state with sub-side menu
    useEffect(() => {
        let currentSub: string | undefined = undefined;
        switch (detailTab) {
            case 'documents':
                currentSub = docSubTab;
                break;
            case 'parties':
                currentSub = partySubTab;
                break;
            case 'history':
                currentSub = historySubTab;
                break;
            case 'discussion':
                currentSub = discSubTab;
                break;
            case 'references':
                currentSub = refSubTab;
                break;
        }

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
                    switch (tabId) {
                        case 'documents':
                            setDocSubTab(subtabId as any);
                            break;
                        case 'parties':
                            setPartySubTab(subtabId as any);
                            break;
                        case 'history':
                            setHistorySubTab(subtabId as any);
                            break;
                        case 'discussion':
                            setDiscSubTab(subtabId as any);
                            break;
                        case 'references':
                            setRefSubTab(subtabId as any);
                            break;
                    }
                }
            },
            onClose: onClose,
        });

        return () => {
            detailSidebarStore.setState(null);
        };
    }, [detailTab, docSubTab, partySubTab, discSubTab, historySubTab, refSubTab, detailSidebarTabs, contract, onClose]);

    useEffect(() => {
        const meta = contract.workflow_step?.meta || {};
        const isAudit = detailTab === 'audit';
        const isMembers = detailTab === 'members' && meta.show_tab_members !== false;
        const isParty = detailTab === 'parties';
        const isExternalTab = isAudit || isMembers || isParty;

        if (tabs.length > 0 && !tabs.some((t) => t.id === detailTab) && !isExternalTab) {
            setDetailTab(tabs[0].id);
        } else if (tabs.length === 0 && !isExternalTab) {
            setDetailTab('empty');
        }
    }, [tabs, detailTab, contract.workflow_step?.meta]);

    const currentActiveTab = tabs.find((t) => t.id === detailTab) || detailSidebarTabs.find((t) => t.id === detailTab);
    const activeSidebarTab = detailSidebarTabs.find((t) => t.id === detailTab);
    const activeSubChildren = activeSidebarTab?.children || [];

    const activeSubId = useMemo(() => {
        switch (detailTab) {
            case 'documents':
                return docSubTab;
            case 'parties':
                return partySubTab;
            case 'history':
                return historySubTab;
            case 'discussion':
                return discSubTab;
            case 'references':
                return refSubTab;
            default:
                return undefined;
        }
    }, [detailTab, docSubTab, partySubTab, historySubTab, discSubTab, refSubTab]);

    const handleSubTabChange = (subId: string) => {
        switch (detailTab) {
            case 'documents':
                setDocSubTab(subId as any);
                break;
            case 'parties':
                setPartySubTab(subId as any);
                break;
            case 'history':
                setHistorySubTab(subId as any);
                break;
            case 'discussion':
                setDiscSubTab(subId as any);
                break;
            case 'references':
                setRefSubTab(subId as any);
                break;
        }
    };

    const currentActiveSubLabel = useMemo(() => {
        switch (detailTab) {
            case 'documents':
                switch (docSubTab) {
                    case 'f1':
                        return 'F1 (Permohonan)';
                    case 'f2':
                        return 'F2 (Ringkasan)';
                    case 'agreement':
                        return 'Draft Perjanjian';
                    default:
                        return undefined;
                }

            case 'parties':
                switch (partySubTab) {
                    case 'requester':
                        return 'Informasi Pengaju';
                    case 'second_party':
                        return 'Informasi Pihak Kedua';
                    case 'pic':
                        return 'Informasi PIC';
                    case 'timeline':
                        return 'Timeline';
                    default:
                        return undefined;
                }

            case 'history':
                switch (historySubTab) {
                    case 'timeline':
                        return 'Alur Approval & Proses';
                    case 'related_workflows':
                        return 'Workflow Terkait';
                    case 'audit':
                        return 'Audit Log & Activity';
                    default:
                        return undefined;
                }

            case 'discussion':
                switch (discSubTab) {
                    case 'chat':
                        return 'Chat & Diskusi';
                    case 'members':
                        return 'Member / Anggota Tim';
                    default:
                        return undefined;
                }

            case 'references':
                switch (refSubTab) {
                    case 'parent':
                        return 'Kontrak Induk / Terkait';
                    case 'purchase_orders':
                        return 'Purchase Order (PO)';
                    default:
                        return undefined;
                }

            default:
                return undefined;
        }
    }, [detailTab, docSubTab, partySubTab, historySubTab, discSubTab, refSubTab]);

    return (
        <div className="relative mx-auto flex h-full w-full max-w-full flex-1 flex-col overflow-hidden">
            {/* Action & Status Header Bar */}
            <ContractDetailHeader
                contract={contract}
                canEditTitle={canEditTitle}
                currentActiveTabLabel={currentActiveTab?.label || 'Dokumen'}
                currentActiveSubLabel={currentActiveSubLabel}
                isAnyDirty={isAnyDirty}
                infoSaving={infoSaving}
                isAdmin={isAdmin}
                onOpenAdminWorkflowModal={() => setAdminWorkflowModalOpen(true)}
                onUpdateTitle={(newTitle) => handleUpdate({ title: newTitle }, true)}
                onResetAllChanges={onResetAllChanges}
                onSaveAllChanges={onSaveAllChanges}
                onNavigateTab={(tab, subTab) => {
                    setDetailTab(tab);
                    if (subTab) {
                        switch (tab) {
                            case 'documents':
                                setDocSubTab(subTab as any);
                                break;
                            case 'parties':
                                setPartySubTab(subTab as any);
                                break;
                            case 'history':
                                setHistorySubTab(subTab as any);
                                break;
                            case 'discussion':
                                setDiscSubTab(subTab as any);
                                break;
                            case 'references':
                                setRefSubTab(subTab as any);
                                break;
                        }
                    }
                }}
            />

            <div className="h-[calc(100vh-64px)] min-h-0 flex-1 overflow-hidden p-3 lg:p-4">
                <div className="grid h-full min-h-0 grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_390px]">
                    {/* Left Column: Form / Document Detail */}
                    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
                        {contract.workflow_step?.meta?.show_document_detail !== false && (
                            <div className="bg-surface-base border-surface-border flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-xl border shadow-xs">
                                {/* Content Card Header: Sub-tabs from Sub-sidebar */}
                                <DetailSubTabs
                                    childrenTabs={activeSubChildren}
                                    activeSubId={activeSubId}
                                    onSubTabChange={handleSubTabChange}
                                />
                                <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
                                    <Suspense fallback={<TabSkeleton />}>
                                        {detailTab === 'documents' && (
                                            <DocumentsTab
                                                contract={contract}
                                                docSubTab={docSubTab}
                                                formTemplates={formTemplates}
                                                vendors={vendors}
                                                meUser={meUser}
                                                onUpdate={handleContractUpdate}
                                                onFormDirty={(dirty) => setHasFormChanges(dirty)}
                                                onFormSave={(fn) => {
                                                    saveFormRef.current = fn;
                                                }}
                                            />
                                        )}

                                        {detailTab === 'parties' && (
                                            <PartiesTab
                                                contract={contract}
                                                partySubTab={partySubTab}
                                            />
                                        )}

                                        {detailTab === 'attachments' && (
                                            <ContractAttachments
                                                contract={contract}
                                                canUpdate={canUpdate}
                                                onUpdated={handleContractUpdate}
                                                showToast={showToast}
                                                meId={meUser?.id}
                                            />
                                        )}

                                        {detailTab === 'history' && (
                                            <HistoryTab
                                                contract={contract}
                                                historySubTab={historySubTab}
                                                meId={meId}
                                                onApprove={(note, file) => handleApprove(note, file)}
                                                showToast={showToast}
                                            />
                                        )}

                                        {detailTab === 'references' && (
                                            <ReferencesTab
                                                contract={contract}
                                                refSubTab={refSubTab}
                                                canUpdate={canUpdate}
                                                onUpdate={handleUpdate}
                                                processing={processing}
                                                meId={meId}
                                                vendors={vendors}
                                            />
                                        )}

                                        {detailTab === 'discussion' && (
                                            <DiscussionTab
                                                contract={contract}
                                                discSubTab={discSubTab}
                                                meId={meId}
                                                users={users || []}
                                                onNewMessage={handleContractUpdate}
                                            />
                                        )}

                                        {detailTab === 'empty' && (
                                            <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-slate-400">
                                                <FileText size={48} className="mb-4 text-slate-300 opacity-50" />
                                                <p className="text-sm font-semibold uppercase">Tidak Ada Tab Tersedia</p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Semua tab disembunyikan berdasarkan pengaturan alur kerja saat ini.
                                                </p>
                                            </div>
                                        )}
                                    </Suspense>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Right Column: Panel Informasi & Aksi */}
                    <div className="custom-scrollbar flex h-full min-h-0 min-w-0 flex-col gap-3.5 overflow-y-auto pr-1 pb-6">
                        {/* SECTION: AKSI PERSYARATAN & APPROVAL (WRAPPED IN CARD) */}
                        <ContractActionSection
                            contract={contract}
                            canApprove={canApprove}
                            availableCustomActions={availableCustomActions}
                            applicableStepActions={applicableStepActions}
                            isStepActionLocked={isStepActionLocked}
                            isSubStepReviewer={isSubStepReviewer}
                            isSigner={isSigner}
                            stepDownloaded={stepDownloaded}
                            signingUploading={signingUploading}
                            showSpecialActions={showSpecialActions}
                            masterContractStatuses={masterContractStatuses}
                            onToggleSpecialActions={() => setShowSpecialActions(!showSpecialActions)}
                            onActionClick={(action, actionCode) => {
                                const code = (actionCode || action?.action_code)?.toLowerCase();
                                setActiveStepAction(action);
                                setActiveActionCode(actionCode || action?.action_code);

                                if (code === 'add_adhoc') {
                                    setAddhocOpen(true);
                                    return;
                                }
                                if (code === 'assign' || code === 'assign_pic') {
                                    setAssignOpen(true);
                                    return;
                                }

                                setActionModalOpen(true);
                            }}
                            onSigningAction={handleSigningAction}
                        />

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
                                saveRef={saveInfoCardRef}
                                resetRef={resetInfoCardRef}
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
                                    <span className={(contract.allow?.info_edit ?? contract.allow_info_edit) ? 'font-bold text-green-600' : 'font-bold text-rose-600'}>
                                        {(contract.allow?.info_edit ?? contract.allow_info_edit) ? 'T' : 'F'}
                                    </span>
                                    <span className="text-amber-600">
                                        {(contract.workflow_step as any)?.meta?.allow_info_edit !== false ? 'T' : 'F'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between border-b border-black/5 pb-1">
                                <span className="text-text-soft uppercase">F1 Edit</span>
                                <div className="flex gap-4">
                                    <span className={(contract.allow?.f1_edit ?? contract.allow_f1_edit) ? 'font-bold text-green-600' : 'font-bold text-rose-600'}>
                                        {(contract.allow?.f1_edit ?? contract.allow_f1_edit) ? 'T' : 'F'}
                                    </span>
                                    <span className="text-amber-600">
                                        {(contract.workflow_step as any)?.meta?.allow_f1_edit !== false ? 'T' : 'F'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between border-b border-black/5 pb-1">
                                <span className="text-text-soft uppercase">F2 Edit</span>
                                <div className="flex gap-4">
                                    <span className={(contract.allow?.f2_edit ?? contract.allow_f2_edit) ? 'font-bold text-green-600' : 'font-bold text-rose-600'}>
                                        {(contract.allow?.f2_edit ?? contract.allow_f2_edit) ? 'T' : 'F'}
                                    </span>
                                    <span className="text-amber-600">
                                        {(contract.workflow_step as any)?.meta?.allow_f2_edit !== false ? 'T' : 'F'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between border-b border-black/5 pb-1">
                                <span className="text-text-soft uppercase">Draft Edit</span>
                                <div className="flex gap-4">
                                    <span className={(contract.allow?.agreement_edit ?? contract.allow_agreement_edit) ? 'font-bold text-green-600' : 'font-bold text-rose-600'}>
                                        {(contract.allow?.agreement_edit ?? contract.allow_agreement_edit) ? 'T' : 'F'}
                                    </span>
                                    <span className="text-amber-600">
                                        {(contract.workflow_step as any)?.meta?.allow_agreement_edit !== false ? 'T' : 'F'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between border-b border-black/5 pb-1">
                                <span className="text-text-soft uppercase">Attachment</span>
                                <div className="flex gap-4">
                                    <span className={(contract.allow?.attachment_edit ?? contract.allow_attachment_edit) ? 'font-bold text-green-600' : 'font-bold text-rose-600'}>
                                        {(contract.allow?.attachment_edit ?? contract.allow_attachment_edit) ? 'T' : 'F'}
                                    </span>
                                    <span className="text-amber-600">
                                        {(contract.workflow_step as any)?.meta?.allow_attachment_edit !== false ? 'T' : 'F'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between border-b border-black/5 pb-1">
                                <span className="text-text-soft uppercase">Reference</span>
                                <div className="flex gap-4">
                                    <span className={(contract.allow?.reference ?? contract.allow_reference) ? 'font-bold text-green-600' : 'font-bold text-rose-600'}>
                                        {(contract.allow?.reference ?? contract.allow_reference) ? 'T' : 'F'}
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
                <SharedActionModal
                    open={actionModalOpen}
                    onClose={() => {
                        setActionModalOpen(false);
                        setActiveActionCode(undefined);
                        setActiveStepAction(null);
                    }}
                    onSubmit={handleActionSubmit}
                    contract={contract}
                    onUpdate={handleContractUpdate}
                    actionCode={activeActionCode}
                    actionId={activeStepAction?.id}
                    actionAlias={
                        activeStepAction?.alias ||
                        (applicableStepActions.find((a: any) => a.action_code === activeActionCode)?.alias ??
                            (isSubStepReviewer ? 'Setujui Penelaahan' : undefined))
                    }
                    isSubStep={isSubStepReviewer}
                />
            </Suspense>

            <Suspense fallback={null}>
                <SharedAssignModal
                    open={assignOpen}
                    onClose={() => {
                        setAssignOpen(false);
                        setActiveActionCode(undefined);
                        setActiveStepAction(null);
                    }}
                    contract={contract}
                    onUpdate={handleContractUpdate}
                    showToast={showToast}
                    actionCode={activeActionCode}
                    actionId={activeStepAction?.id}
                    actionAlias={
                        activeStepAction?.alias || (applicableStepActions.find((a: any) => a.action_code === activeActionCode)?.alias ?? undefined)
                    }
                />
            </Suspense>
            <Suspense fallback={null}>
                <SharedAddhocModal
                    open={addhocOpen}
                    onClose={() => {
                        setAddhocOpen(false);
                        setActiveActionCode(undefined);
                        setActiveStepAction(null);
                    }}
                    contract={contract}
                    onUpdate={handleContractUpdate}
                    showToast={showToast}
                    actionCode={activeActionCode}
                    actionId={activeStepAction?.id}
                    actionAlias={
                        activeStepAction?.alias || (applicableStepActions.find((a: any) => a.action_code === activeActionCode)?.alias ?? undefined)
                    }
                />
            </Suspense>
            <Suspense fallback={null}>
                <AdminChangeWorkflowModal
                    open={adminWorkflowModalOpen}
                    onClose={() => setAdminWorkflowModalOpen(false)}
                    contract={contract}
                    onSuccess={(updated) => handleContractUpdate(updated)}
                    showToast={showToast}
                />
            </Suspense>
        </div>
    );
};

export default ContractDetailView;
