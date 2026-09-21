import { Contract, PaginatedData } from '@/pages/contracts/types';
import axios from 'axios';

// Helper: read a specific cookie value by name
function getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
}

// ── HTTP API Client ──────────────────────────────────────────────────
const api = axios.create({
    headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = getCookie('XSRF-TOKEN');
    if (token) {
        config.headers['X-XSRF-TOKEN'] = token;
    }
    return config;
});

// Helper for extracting data
const unwrap = <T>(promise: Promise<{ data: T }>): Promise<T> => promise.then((r) => r.data);

// ── Contract API Endpoints ───────────────────────────────────────────
export const contractApi = {
    // 1. Core CRUD & Lookup
    list: (params?: any): Promise<PaginatedData<Contract>> => unwrap(api.get('/api/contracts', { params })),
    get: (id: string): Promise<Contract> => unwrap(api.get(`/api/contracts/${id}`)),
    create: (data: FormData): Promise<Contract> => unwrap(api.post('/api/contracts', data)),
    update: (id: string, data: any): Promise<Contract> => unwrap(api.patch(`/api/contracts/${id}`, data)),
    reviewDoc: (id: string, doc: 'f1' | 'f2' | 'agreement'): Promise<{ message: string; metadata: any; contract: Contract }> =>
        unwrap(api.post(`/api/contracts/${id}/review-doc`, { doc })),
    delete: (id: string): Promise<any> => unwrap(api.delete(`/api/contracts/${id}`)),
    getTypes: (): Promise<any[]> => unwrap(api.get('/api/contracts/types')),
    getWorkflows: (contractType?: string, userId?: string): Promise<any[]> =>
        unwrap(api.get('/api/contracts/workflows', { params: { contract_type: contractType, user_id: userId } })),
    getUsers: (params?: any): Promise<any[]> => unwrap(api.get('/api/contracts/users', { params })),
    getRoles: (): Promise<any[]> => unwrap(api.get('/api/contracts/roles')),

    // 2. Approval & Workflow Actions
    send: (id: string, data?: { workflow_id?: string; custom_steps?: any[] }): Promise<Contract> =>
        unwrap(api.post(`/api/contracts/${id}/send`, data)),

    assignPic: (id: string, assignedPicId: string, note?: string, attachments?: File | File[], actionCode?: string, actionId?: string): Promise<Contract> => {
        const fd = new FormData();
        fd.append('assigned_pic_id', assignedPicId);
        if (note) fd.append('note', note);
        if (actionCode) fd.append('action_code', actionCode);
        if (actionId) fd.append('action_id', actionId);
        if (attachments) {
            if (Array.isArray(attachments)) {
                attachments.forEach((f) => fd.append('attachments[]', f));
            } else {
                fd.append('attachment', attachments);
            }
        }
        return unwrap(api.post(`/api/contracts/${id}/assign-pic`, fd));
    },

    approve: (
        id: string,
        note: string,
        attachment?: File | File[],
        assignedPicId?: string,
        executionOrder?: string,
        actionCode?: string,
        isFinal?: boolean,
        targetStepId?: string,
        actionId?: string,
    ): Promise<Contract> => {
        const fd = new FormData();
        fd.append('note', note);
        if (attachment) {
            if (Array.isArray(attachment)) {
                attachment.forEach((f) => fd.append('attachments[]', f));
            } else {
                fd.append('attachment', attachment);
            }
        }
        if (assignedPicId) fd.append('assigned_pic_id', assignedPicId);
        if (executionOrder) fd.append('execution_order', executionOrder);
        if (actionCode) fd.append('action_code', actionCode);
        if (actionId) fd.append('action_id', actionId);
        if (isFinal) fd.append('is_final', '1');
        if (targetStepId) fd.append('target_step_id', targetStepId);
        return unwrap(api.post(`/api/contracts/${id}/approve`, fd));
    },

    reject: (id: string, reason: string, attachment?: File | File[], actionId?: string): Promise<Contract> => {
        const fd = new FormData();
        fd.append('reason', reason);
        if (attachment) {
            if (Array.isArray(attachment)) {
                attachment.forEach((f) => fd.append('attachments[]', f));
            } else {
                fd.append('attachment', attachment);
            }
        }
        if (actionId) fd.append('action_id', actionId);
        return unwrap(api.post(`/api/contracts/${id}/reject`, fd));
    },

    addAdhocApprover: (
        id: string,
        userIds: string | string[],
        note?: string,
        isSequential: boolean = false,
        targetStepId?: string,
        role?: string,
        approvalRule: string = 'all',
        minApprovals?: number,
        attachments?: File | File[],
        actionId?: string,
        actionCode?: string,
    ): Promise<Contract> => {
        const uids = Array.isArray(userIds) ? userIds : [userIds];
        const fd = new FormData();
        uids.forEach((uid) => fd.append('user_ids[]', uid));
        if (note) fd.append('note', note);
        if (isSequential) fd.append('is_sequential', '1');
        if (targetStepId) fd.append('target_step_id', targetStepId);
        if (role) fd.append('role', role);
        if (approvalRule) fd.append('approval_rule', approvalRule);
        if (minApprovals) fd.append('min_approvals', String(minApprovals));
        if (actionId) fd.append('action_id', actionId);
        if (actionCode) fd.append('action_code', actionCode);
        if (attachments) {
            if (Array.isArray(attachments)) {
                attachments.forEach((f) => fd.append('attachments[]', f));
            } else {
                fd.append('attachment', attachments);
            }
        }
        return unwrap(api.post(`/api/contracts/${id}/add-approver`, fd));
    },

    removeAdhocApprover: (id: string, approvalId: string): Promise<Contract> =>
        unwrap(api.delete(`/api/contracts/${id}/approver/${approvalId}`)),

    submitAdhocApprovers: (id: string): Promise<Contract> => unwrap(api.post(`/api/contracts/${id}/submit-approvers`)),

    // 3. File & Attachment Management
    uploadRevision: (id: string, data: FormData): Promise<Contract> => unwrap(api.post(`/api/contracts/${id}/revision`, data)),
    changeVersion: (id: string, versionNo: number): Promise<Contract> =>
        unwrap(api.post(`/api/contracts/${id}/version`, { version_no: versionNo })),
    uploadAttachment: (id: string, data: FormData): Promise<Contract> => unwrap(api.post(`/api/contracts/${id}/attachments`, data)),
    deleteAttachment: (id: string, atId: string): Promise<Contract> => unwrap(api.delete(`/api/contracts/${id}/attachments/${atId}`)),

    // 4. Download & Preview URLs
    downloadUrl: (id: string, type: string = 'contract', versionNo?: number) =>
        versionNo ? `/api/contracts/${id}/file/${versionNo}?type=${type}` : `/api/contracts/${id}/download`,
    attachmentDownloadUrl: (id: string, atId: string) => `/api/contracts/${id}/attachment/${atId}`,
    pdfPreviewUrl: (id: string, versionNo: number, type: string = 'contract') => `/api/contracts/${id}/pdf/${versionNo}?type=${type}`,
    attachmentPdfPreviewUrl: (id: string, atId: string) => `/api/contracts/${id}/attachment-pdf/${atId}`,
    vendorDocumentDownloadUrl: (id: string, docId: string, fileName?: string) =>
        `/api/contracts/${id}/vendor-document/${encodeURIComponent(docId)}${fileName ? `?fileName=${encodeURIComponent(fileName)}` : ''}`,
    vendorDocumentPdfPreviewUrl: (id: string, docId: string, fileName?: string) =>
        `/api/contracts/${id}/vendor-document-pdf/${encodeURIComponent(docId)}${fileName ? `?fileName=${encodeURIComponent(fileName)}` : ''}`,

    // 5. Chat & Discussion Messages
    messages: {
        list: (contractId: string) => unwrap(api.get(`/api/contracts/${contractId}/messages`)),
        send: (contractId: string, message: string, file?: File) => {
            const fd = new FormData();
            fd.append('message', message);
            if (file) fd.append('attachment', file);
            return unwrap(api.post(`/api/contracts/${contractId}/messages`, fd));
        },
        markRead: (contractId: string) => unwrap(api.post(`/api/contracts/${contractId}/messages/read`)),
    },

    // 5.1 Contract Members & Personnel
    members: {
        list: (contractId: string) => unwrap(api.get(`/api/contracts/${contractId}/members`)),
    },

    // 5.2 Contract Parent & References
    references: {
        get: (contractId: string) => unwrap(api.get(`/api/contracts/${contractId}/reference`)),
        search: (contractId: string, query: string, limit: number = 10) =>
            unwrap(api.get(`/api/contracts/${contractId}/reference/search`, { params: { query, limit } })),
        update: (contractId: string, parentId: string | null) =>
            unwrap(api.patch(`/api/contracts/${contractId}/reference`, { parent_id: parentId })),
    },

    // 5.3 Contract Purchase Orders (PO)
    purchaseOrders: {
        list: (contractId: string) => unwrap(api.get(`/api/contracts/${contractId}/purchase-orders`)),
        create: (contractId: string, data: any) => unwrap(api.post(`/api/contracts/${contractId}/purchase-orders`, data)),
        update: (contractId: string, poId: string, data: any) =>
            unwrap(api.patch(`/api/contracts/${contractId}/purchase-orders/${poId}`, data)),
        delete: (contractId: string, poId: string) =>
            unwrap(api.delete(`/api/contracts/${contractId}/purchase-orders/${poId}`)),
    },

    // 6. Dynamic Form Submissions (F1 / F2)
    formSubmissions: {
        save: (
            contractId: string,
            data: {
                form_template_id: string;
                document_type: string;
                form_data: Record<string, any>;
                is_new_version?: boolean;
                change_summary?: string;
            },
        ): Promise<Contract> => unwrap(api.post(`/api/contracts/${contractId}/form-submissions`, data)),
        get: (contractId: string, type: string): Promise<any> => unwrap(api.get(`/api/contracts/${contractId}/form-submissions/${type}`)),
        pdfUrl: (contractId: string, type: string) => `/api/contracts/${contractId}/form-submissions/${type}/pdf`,
    },

    // 7. Audit Trail & Log Export
    auditTrail: {
        list: (id: string, params?: any): Promise<any[]> => unwrap(api.get(`/api/contracts/${id}/audit-trail`, { params })),
        exportPdfUrl: (id: string, params?: any) => {
            const qs = new URLSearchParams(params).toString();
            return `/api/contracts/${id}/audit-trail/pdf${qs ? '?' + qs : ''}`;
        },
    },
};

// ── Form Formatting Helpers ──────────────────────────────────────────
export { formatDateWithOptionalTime } from '@/lib/time-utils';

export const formatRuangLingkup = (contractNo?: string, signerName?: string): string => {
    const dateStr = new Date().toLocaleDateString('en-CA');
    return `${contractNo ?? ''}/${dateStr}/${signerName ?? ''}`;
};

export const formatLampiranList = (docs?: any[]): string => {
    if (!docs || !docs.length) return '';
    
    // Filter documents that actually have valid file paths/names or non-empty content
    const validDocs = docs.filter((d: any) => {
        if (!d) return false;
        if (typeof d === 'string') return d.trim() !== '' && d.trim() !== '-';
        const file = d.file || d.path || d.url || d.file_name || d.document_name || d.name;
        return Boolean(file) && String(file).trim() !== '-';
    });

    if (!validDocs.length) return '';

    const getDocLabel = (d: any) => {
        if (typeof d === 'string') return d;
        return d.label || d.document_name || d.name || d.type || d.document_type || 'Dokumen';
    };

    if (validDocs.length <= 2) {
        return validDocs.map((d: any) => getDocLabel(d)).join(', ');
    }

    const firstTwo = validDocs.slice(0, 2).map((d: any) => getDocLabel(d)).join(', ');
    const remaining = validDocs.length - 2;
    return `${firstTwo}, dan +${remaining} lampiran lainnya`;
};

export const cleanSingleLineText = (text?: string | null): string => {
    if (!text) return '';
    return text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
};

/**
 * Helper to determine if a vendor is taxable based on their PKP status.
 * - PKP -> tax required (true)
 * - Non-PKP, PTKP, '-', or empty -> not taxable (false)
 */
export const resolveVendorTaxPkp = (vendor: any): { isPkp: boolean; pkpStatus: string } => {
    if (!vendor) return { isPkp: false, pkpStatus: '-' };

    const detail = vendor.vendor_detail || vendor.detail || {};
    const tax = detail.tax || vendor.tax || {};
    const typePkp = String(tax.typePkp || tax.type_pkp || tax.pkp_type || tax.status_pkp || '').trim();

    if (!typePkp || typePkp === '-' || typePkp.toLowerCase() === 'non pkp' || typePkp.toLowerCase() === 'non-pkp' || typePkp.toLowerCase() === 'ptkp') {
        return { isPkp: false, pkpStatus: typePkp || '-' };
    }

    const isPkp = typePkp.toUpperCase() === 'PKP';
    return { isPkp, pkpStatus: typePkp };
};

export interface TransitionPreview {
    label: string;
    target: string;
}

/**
 * Computes transition preview label and target step for workflow approval/rejection actions.
 */
export function resolveTransitionPreview({
    contract,
    action,
    actionCode,
    allWorkflows = [],
}: {
    contract: any;
    action?: any;
    actionCode?: string;
    allWorkflows?: any[];
}): TransitionPreview | null {
    if (!contract) return null;

    let transition = action?.transition_config;
    if (!action && actionCode === 'reject') {
        const rejectAction = contract?.workflow_step?.actions?.find((a: any) => a.action_code === 'reject');
        if (rejectAction) {
            transition = rejectAction.transition_config;
        }
    }

    const currentStep = contract?.workflow_step;
    if (!currentStep) return null;

    const currentStepSeq = Number(currentStep.step || 1);
    const steps = contract?.workflow?.steps || [];

    const formatStepInfo = (stepObj: any) => {
        if (!stepObj) return 'Selesai / Disetujui (Langkah Terakhir)';
        return `Tahap ${stepObj.step} - ${stepObj.description || stepObj.label || 'Tanpa Keterangan'}`;
    };

    if (transition && typeof transition === 'object') {
        const { type, offset, sequence, workflow_id, return_mode } = transition;
        switch (type) {
            case 'relative': {
                const offNum = Number(offset ?? (actionCode === 'reject' ? -1 : 1));
                if (offNum === 0) {
                    return {
                        label: 'Tetap di Tahap Ini (Stay / Offset 0)',
                        target: formatStepInfo(currentStep),
                    };
                } else if (offNum < 0) {
                    const targetSeq = Math.max(1, currentStepSeq + offNum);
                    const prevStep = steps.find((s: any) => Number(s.step) === targetSeq) || steps.find((s: any) => Number(s.step) < currentStepSeq);
                    return {
                        label: `Mundur ${Math.abs(offNum)} Langkah (Offset ${offNum})`,
                        target: formatStepInfo(prevStep),
                    };
                } else {
                    const targetSeq = currentStepSeq + offNum;
                    const nextStep = steps.find((s: any) => Number(s.step) === targetSeq) || steps.find((s: any) => Number(s.step) > currentStepSeq);
                    return {
                        label: `Maju ${offNum} Langkah (Offset +${offNum})`,
                        target: formatStepInfo(nextStep),
                    };
                }
            }
            case 'absolute': {
                const targetSeq = Number(sequence ?? 1);
                const targetStep = steps.find((s: any) => Number(s.step) === targetSeq);
                return {
                    label: actionCode === 'reject' ? `Kembali ke Tahap Spesifik (Tahap ${targetSeq})` : `Lompat ke Tahap Spesifik (Tahap ${targetSeq})`,
                    target: formatStepInfo(targetStep),
                };
            }
            case 'cross_workflow': {
                const isOrigin = workflow_id === 'origin_workflow' || workflow_id === 'origin' || workflow_id === contract.origin_workflow_id;
                const targetWfId = isOrigin ? (contract.origin_workflow_id || contract.workflow_id) : workflow_id;
                const targetWf = allWorkflows.find((w: any) => String(w.id) === String(targetWfId));
                const wfName = targetWf?.name || (isOrigin ? 'Alur Kerja Utama' : 'Alur Kerja Target');

                let stepLabel = `Tahap ${sequence || 1}`;
                if (isOrigin) {
                    switch (return_mode) {
                        case 'branch_origin':
                        case 'origin_step':
                            stepLabel = 'Kembali ke Tahap Semula di Alur Utama';
                            break;
                        case 'branch_next':
                            stepLabel = 'Lanjut ke Tahap Berikutnya di Alur Utama';
                            break;
                        default:
                            stepLabel = sequence ? `Tahap ${sequence} di Alur Utama` : 'Kembali ke Alur Utama';
                            break;
                    }
                } else {
                    const targetStep = targetWf?.steps?.find((s: any) => Number(s.step) === Number(sequence));
                    if (targetStep) {
                        stepLabel = `Tahap ${targetStep.step} - ${targetStep.description || targetStep.label || 'Tanpa Keterangan'}`;
                    }
                }

                return {
                    label: isOrigin ? 'Kembali ke Alur Kerja Utama' : `Pindah ke Alur Kerja: ${wfName}`,
                    target: stepLabel,
                };
            }
            default:
                break;
        }
    }

    if (actionCode === 'reject') {
        const step1 = steps.find((s: any) => Number(s.step) === 1);
        return {
            label: 'Kembali untuk Revisi (Default Reject)',
            target: formatStepInfo(step1),
        };
    }

    const nextStep = steps.find((s: any) => Number(s.step) > currentStepSeq);
    return {
        label: 'Maju ke Langkah Berikutnya (Default Sequential)',
        target: formatStepInfo(nextStep),
    };
}

