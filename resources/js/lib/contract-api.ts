import { Contract, PaginatedData } from '@/types/contracts';
import axios from 'axios';

const api = axios.create({
    headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
    withCredentials: true,
});

export const contractApi = {
    list: (params?: any): Promise<PaginatedData<Contract>> => api.get('/api/contracts', { params }).then((r) => r.data),
    get: (id: string): Promise<Contract> => api.get(`/api/contracts/${id}`).then((r) => r.data),
    create: (data: FormData): Promise<Contract> => api.post('/api/contracts', data).then((r) => r.data),
    getWorkflows: (contractType?: string, userId?: string): Promise<any[]> =>
        api.get('/api/contracts/workflows', { params: { contract_type: contractType, user_id: userId } }).then((r) => r.data),
    getUsers: (params?: any): Promise<any[]> => api.get('/api/contracts/users', { params }).then((r) => r.data),
    getRoles: (): Promise<any[]> => api.get('/api/contracts/roles').then((r) => r.data),
    send: (id: string, data?: { workflow_id?: string; custom_steps?: any[] }): Promise<Contract> =>
        api.post(`/api/contracts/${id}/send`, data).then((r) => r.data),
    update: (id: string, data: any): Promise<Contract> => api.patch(`/api/contracts/${id}`, data).then((r) => r.data),
    delete: (id: string): Promise<any> => api.delete(`/api/contracts/${id}`).then((r) => r.data),
    approve: (
        id: string,
        note: string,
        attachment?: File,
        assignedPicId?: string,
        executionOrder?: string,
        p1UserId?: string | string[],
        p2UserId?: string | string[],
        actionCode?: string,
        isFinal?: boolean,
        targetStepId?: string,
    ): Promise<Contract> => {
        const fd = new FormData();
        fd.append('note', note);
        if (attachment) fd.append('attachment', attachment);
        if (assignedPicId) fd.append('assigned_pic_id', assignedPicId);
        if (executionOrder) fd.append('execution_order', executionOrder);
        if (p1UserId) {
            if (Array.isArray(p1UserId)) {
                p1UserId.forEach(id => fd.append('p1_user_id[]', id));
            } else {
                fd.append('p1_user_id', p1UserId);
            }
        }
        if (p2UserId) {
            if (Array.isArray(p2UserId)) {
                p2UserId.forEach(id => fd.append('p2_user_id[]', id));
            } else {
                fd.append('p2_user_id', p2UserId);
            }
        }
        if (actionCode) fd.append('action_code', actionCode);
        if (isFinal) fd.append('is_final', '1');
        if (targetStepId) fd.append('target_step_id', targetStepId);
        return api.post(`/api/contracts/${id}/approve`, fd).then((r) => r.data);
    },
    reject: (id: string, reason: string, attachment?: File): Promise<Contract> => {
        const fd = new FormData();
        fd.append('reason', reason);
        if (attachment) fd.append('attachment', attachment);
        return api.post(`/api/contracts/${id}/reject`, fd).then((r) => r.data);
    },
    addAdhocApprover: (
        id: string,
        userIds: string | string[],
        note?: string,
        isSequential: boolean = false,
        targetStepId?: string,
    ): Promise<Contract> => {
        const uids = Array.isArray(userIds) ? userIds : [userIds];
        return api
            .post(`/api/contracts/${id}/add-approver`, {
                user_ids: uids,
                note,
                is_sequential: isSequential,
                target_step_id: targetStepId,
            })
            .then((r) => r.data);
    },
    removeAdhocApprover: (id: string, approvalId: string): Promise<Contract> =>
        api.delete(`/api/contracts/${id}/approver/${approvalId}`).then((r) => r.data),
    submitAdhocApprovers: (id: string): Promise<Contract> =>
        api.post(`/api/contracts/${id}/submit-approvers`).then((r) => r.data),
    uploadRevision: (id: string, data: FormData): Promise<Contract> => api.post(`/api/contracts/${id}/revision`, data).then((r) => r.data),
    changeVersion: (id: string, versionNo: number): Promise<Contract> =>
        api.post(`/api/contracts/${id}/version`, { version_no: versionNo }).then((r) => r.data),
    uploadAttachment: (id: string, data: FormData): Promise<Contract> => api.post(`/api/contracts/${id}/attachments`, data).then((r) => r.data),
    deleteAttachment: (id: string, atId: string): Promise<Contract> => api.delete(`/api/contracts/${id}/attachments/${atId}`).then((r) => r.data),
    getTypes: (): Promise<any[]> => api.get('/api/contract-types').then((r) => r.data),
    downloadUrl: (id: string, type: string = 'contract', versionNo?: number) =>
        versionNo ? `/api/contracts/${id}/file/${versionNo}?type=${type}` : `/api/contracts/${id}/download`,
    attachmentDownloadUrl: (id: string, atId: string) => `/api/contracts/${id}/attachment/${atId}`,
    pdfPreviewUrl: (id: string, versionNo: number, type: string = 'contract') => `/api/contracts/${id}/pdf/${versionNo}?type=${type}`,
    attachmentPdfPreviewUrl: (id: string, atId: string) => `/api/contracts/${id}/attachment-pdf/${atId}`,
    vendorDocumentDownloadUrl: (id: string, docId: string) => `/api/contracts/${id}/vendor-document/${docId}`,
    vendorDocumentPdfPreviewUrl: (id: string, docId: string) => `/api/contracts/${id}/vendor-document-pdf/${docId}`,
    messages: {
        list: (contractId: string) => api.get(`/api/contracts/${contractId}/messages`).then((r) => r.data),
        send: (contractId: string, message: string, file?: File) => {
            const fd = new FormData();
            fd.append('message', message);
            if (file) fd.append('attachment', file);
            return api.post(`/api/contracts/${contractId}/messages`, fd).then((r) => r.data);
        },
        markRead: (contractId: string) => api.post(`/api/contracts/${contractId}/messages/read`).then((r) => r.data),
    },
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
        ): Promise<Contract> => api.post(`/api/contracts/${contractId}/form-submissions`, data).then((r) => r.data),
        get: (contractId: string, type: string): Promise<any> => api.get(`/api/contracts/${contractId}/form-submissions/${type}`).then((r) => r.data),
        pdfUrl: (contractId: string, type: string) => `/api/contracts/${contractId}/form-submissions/${type}/pdf`,
    },
    auditTrail: {
        list: (id: string, params?: any): Promise<any[]> => api.get(`/api/contracts/${id}/audit-trail`, { params }).then((r) => r.data),
        exportPdfUrl: (id: string, params?: any) => {
            const qs = new URLSearchParams(params).toString();
            return `/api/contracts/${id}/audit-trail/pdf${qs ? '?' + qs : ''}`;
        },
    },
};
