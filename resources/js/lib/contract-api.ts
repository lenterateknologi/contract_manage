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
    getWorkflows: (contractType?: string): Promise<any[]> => api.get('/api/contracts/workflows', { params: { contract_type: contractType } }).then((r) => r.data),
    getUsers: (): Promise<any[]> => api.get('/api/contracts/users').then((r) => r.data),
    getRoles: (): Promise<any[]> => api.get('/api/contracts/roles').then((r) => r.data),
    send: (id: string, data?: { workflow_id?: string; custom_steps?: any[] }): Promise<Contract> =>
        api.post(`/api/contracts/${id}/send`, data).then((r) => r.data),
    update: (id: string, data: any): Promise<Contract> =>
        api.patch(`/api/contracts/${id}`, data).then((r) => r.data),
    delete: (id: string): Promise<any> =>
        api.delete(`/api/contracts/${id}`).then((r) => r.data),
    approve: (id: string, note: string): Promise<Contract> =>
        api.post(`/api/contracts/${id}/approve`, { note }).then((r) => r.data),
    reject: (id: string, reason: string): Promise<Contract> =>
        api.post(`/api/contracts/${id}/reject`, { reason }).then((r) => r.data),
    uploadRevision: (id: string, data: FormData): Promise<Contract> =>
        api.post(`/api/contracts/${id}/revision`, data).then((r) => r.data),
    changeVersion: (id: string, versionNo: number): Promise<Contract> =>
        api.post(`/api/contracts/${id}/version`, { version_no: versionNo }).then((r) => r.data),
    uploadAttachment: (id: string, data: FormData): Promise<Contract> =>
        api.post(`/api/contracts/${id}/attachments`, data).then((r) => r.data),
    deleteAttachment: (id: string, atId: string): Promise<Contract> =>
        api.delete(`/api/contracts/${id}/attachments/${atId}`).then((r) => r.data),
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
        markRead: (contractId: string) =>
            api.post(`/api/contracts/${contractId}/messages/read`).then((r) => r.data),
    },
    formSubmissions: {
        save: (contractId: string, data: { form_template_id: string; document_type: string; form_data: Record<string, any> }): Promise<Contract> =>
            api.post(`/api/contracts/${contractId}/form-submissions`, data).then((r) => r.data),
        get: (contractId: string, type: string): Promise<any> =>
            api.get(`/api/contracts/${contractId}/form-submissions/${type}`).then((r) => r.data),
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
