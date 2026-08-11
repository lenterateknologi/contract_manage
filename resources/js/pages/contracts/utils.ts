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
    delete: (id: string): Promise<any> => unwrap(api.delete(`/api/contracts/${id}`)),
    getTypes: (): Promise<any[]> => unwrap(api.get('/api/contracts/types')),
    getWorkflows: (contractType?: string, userId?: string): Promise<any[]> =>
        unwrap(api.get('/api/contracts/workflows', { params: { contract_type: contractType, user_id: userId } })),
    getUsers: (params?: any): Promise<any[]> => unwrap(api.get('/api/contracts/users', { params })),
    getRoles: (): Promise<any[]> => unwrap(api.get('/api/contracts/roles')),

    // 2. Approval & Workflow Actions
    send: (id: string, data?: { workflow_id?: string; custom_steps?: any[] }): Promise<Contract> =>
        unwrap(api.post(`/api/contracts/${id}/send`, data)),

    approve: (
        id: string,
        note: string,
        attachment?: File,
        assignedPicId?: string,
        executionOrder?: string,
        signerUserIds?: string[],
        actionCode?: string,
        isFinal?: boolean,
        targetStepId?: string,
    ): Promise<Contract> => {
        const fd = new FormData();
        fd.append('note', note);
        if (attachment) fd.append('attachment', attachment);
        if (assignedPicId) fd.append('assigned_pic_id', assignedPicId);
        if (executionOrder) fd.append('execution_order', executionOrder);
        if (signerUserIds && Array.isArray(signerUserIds)) {
            signerUserIds.forEach((uid) => fd.append('signer_user_ids[]', uid));
        }
        if (actionCode) fd.append('action_code', actionCode);
        if (isFinal) fd.append('is_final', '1');
        if (targetStepId) fd.append('target_step_id', targetStepId);
        return unwrap(api.post(`/api/contracts/${id}/approve`, fd));
    },

    reject: (id: string, reason: string, attachment?: File): Promise<Contract> => {
        const fd = new FormData();
        fd.append('reason', reason);
        if (attachment) fd.append('attachment', attachment);
        return unwrap(api.post(`/api/contracts/${id}/reject`, fd));
    },

    addAdhocApprover: (
        id: string,
        userIds: string | string[],
        note?: string,
        isSequential: boolean = false,
        targetStepId?: string,
        role?: string,
    ): Promise<Contract> => {
        const uids = Array.isArray(userIds) ? userIds : [userIds];
        return unwrap(
            api.post(`/api/contracts/${id}/add-approver`, {
                user_ids: uids,
                note,
                is_sequential: isSequential,
                target_step_id: targetStepId,
                role,
            }),
        );
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
    vendorDocumentDownloadUrl: (id: string, docId: string) => `/api/contracts/${id}/vendor-document/${docId}`,
    vendorDocumentPdfPreviewUrl: (id: string, docId: string) => `/api/contracts/${id}/vendor-document-pdf/${docId}`,

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
