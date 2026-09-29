import { apiClient, unwrapResponse } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { Contract } from '@/pages/contracts/types';

export const subresourcesApi = {
    // 1. Requirements & Available Actions
    requirements: {
        get: (contractId: string, params?: { doc_type?: string; subtab?: string }): Promise<any> =>
            unwrapResponse(apiClient.get(API_ENDPOINTS.SUBRESOURCES.REQUIREMENTS(contractId), { params })),
    },

    actions: {
        get: (contractId: string): Promise<any> =>
            unwrapResponse(apiClient.get(API_ENDPOINTS.SUBRESOURCES.ACTIONS(contractId))),
    },

    // 2. Members & Personnel
    members: {
        list: (contractId: string): Promise<any[]> =>
            unwrapResponse(apiClient.get(API_ENDPOINTS.SUBRESOURCES.MEMBERS(contractId))),
    },

    // 3. Parent Contract References
    references: {
        get: (contractId: string): Promise<any> =>
            unwrapResponse(apiClient.get(API_ENDPOINTS.SUBRESOURCES.REFERENCES.BASE(contractId))),
        search: (contractId: string, query: string, limit: number = 10): Promise<any[]> =>
            unwrapResponse(apiClient.get(API_ENDPOINTS.SUBRESOURCES.REFERENCES.SEARCH(contractId), { params: { query, limit } })),
        update: (contractId: string, parentId: string | null): Promise<Contract> =>
            unwrapResponse(apiClient.patch(API_ENDPOINTS.SUBRESOURCES.REFERENCES.UPDATE(contractId), { parent_id: parentId })),
    },

    // 4. Purchase Orders
    purchaseOrders: {
        list: (contractId: string): Promise<any[]> =>
            unwrapResponse(apiClient.get(API_ENDPOINTS.SUBRESOURCES.PURCHASE_ORDERS.BASE(contractId))),
        create: (contractId: string, data: any): Promise<any> =>
            unwrapResponse(apiClient.post(API_ENDPOINTS.SUBRESOURCES.PURCHASE_ORDERS.CREATE(contractId), data)),
        update: (contractId: string, poId: string, data: any): Promise<any> =>
            unwrapResponse(apiClient.patch(API_ENDPOINTS.SUBRESOURCES.PURCHASE_ORDERS.UPDATE(contractId, poId), data)),
        delete: (contractId: string, poId: string): Promise<any> =>
            unwrapResponse(apiClient.delete(API_ENDPOINTS.SUBRESOURCES.PURCHASE_ORDERS.DELETE(contractId, poId))),
    },

    // 5. Dynamic Form Submissions (F1 & F2)
    formSubmissions: {
        get: (contractId: string, type: string, params?: { page?: number; per_page?: number }): Promise<any> =>
            unwrapResponse(apiClient.get(API_ENDPOINTS.SUBRESOURCES.FORM_SUBMISSIONS.BASE(contractId, type), { params })),
        save: (
            contractId: string,
            data: {
                form_template_id: string;
                document_type: string;
                form_data: Record<string, any>;
                is_new_version?: boolean;
                change_summary?: string;
            },
        ): Promise<Contract> =>
            unwrapResponse(apiClient.post(API_ENDPOINTS.SUBRESOURCES.FORM_SUBMISSIONS.SAVE(contractId), data)),
        pdfUrl: (contractId: string, type: string) =>
            API_ENDPOINTS.SUBRESOURCES.FORM_SUBMISSIONS.PDF(contractId, type),
        queuePdf: (contractId: string, type: string, data: { data: string; form_template_id: string }): Promise<{ job_id: string }> =>
            unwrapResponse(apiClient.post(API_ENDPOINTS.SUBRESOURCES.FORM_SUBMISSIONS.PDF_QUEUE(contractId, type), data)),
        exportQueue: (data: any): Promise<{ job_id: string }> =>
            unwrapResponse(apiClient.post(API_ENDPOINTS.SUBRESOURCES.FORM_SUBMISSIONS.EXPORT_QUEUE, data)),
        pdfStatus: (jobId: string): Promise<any> =>
            unwrapResponse(apiClient.get(API_ENDPOINTS.SUBRESOURCES.FORM_SUBMISSIONS.PDF_STATUS(jobId))),
    },

    // 6. File & Version Management
    files: {
        uploadRevision: (contractId: string, data: FormData): Promise<Contract> =>
            unwrapResponse(apiClient.post(API_ENDPOINTS.SUBRESOURCES.FILES.REVISION(contractId), data)),
        getRevisionVersions: (contractId: string, type: string = 'f1'): Promise<any[]> =>
            unwrapResponse(apiClient.get(API_ENDPOINTS.SUBRESOURCES.FILES.REVISION_VERSIONS(contractId), { params: { type } })),
        changeVersion: (contractId: string, versionNo: number): Promise<Contract> =>
            unwrapResponse(apiClient.post(API_ENDPOINTS.SUBRESOURCES.FILES.CHANGE_VERSION(contractId), { version_no: versionNo })),
        uploadAgreement: (contractId: string, data: FormData): Promise<Contract> =>
            unwrapResponse(apiClient.post(API_ENDPOINTS.SUBRESOURCES.FILES.AGREEMENT(contractId), data)),
        getAgreementVersions: (contractId: string, params?: { page?: number; per_page?: number }): Promise<any> =>
            unwrapResponse(apiClient.get(API_ENDPOINTS.SUBRESOURCES.FILES.AGREEMENT_VERSIONS(contractId), { params })),
        uploadAttachment: (contractId: string, data: FormData): Promise<Contract> =>
            unwrapResponse(apiClient.post(API_ENDPOINTS.SUBRESOURCES.FILES.ATTACHMENTS(contractId), data)),
        deleteAttachment: (contractId: string, atId: string): Promise<Contract> =>
            unwrapResponse(apiClient.delete(API_ENDPOINTS.SUBRESOURCES.FILES.ATTACHMENT_DETAIL(contractId, atId))),
        downloadUrl: (contractId: string, type: string = 'contract', versionNo?: number) =>
            API_ENDPOINTS.SUBRESOURCES.FILES.DOWNLOAD(contractId, versionNo, type),
        attachmentDownloadUrl: (contractId: string, atId: string) =>
            API_ENDPOINTS.SUBRESOURCES.FILES.ATTACHMENT_DOWNLOAD(contractId, atId),
        pdfPreviewUrl: (contractId: string, versionNo: number, type: string = 'contract') =>
            API_ENDPOINTS.SUBRESOURCES.FILES.PDF_PREVIEW(contractId, versionNo, type),
        attachmentPdfPreviewUrl: (contractId: string, atId: string) =>
            API_ENDPOINTS.SUBRESOURCES.FILES.ATTACHMENT_PDF_PREVIEW(contractId, atId),
        vendorDocumentDownloadUrl: (contractId: string, docId: string, fileName?: string) =>
            API_ENDPOINTS.SUBRESOURCES.FILES.VENDOR_DOCUMENT(contractId, docId, fileName),
        vendorDocumentPdfPreviewUrl: (contractId: string, docId: string, fileName?: string) =>
            API_ENDPOINTS.SUBRESOURCES.FILES.VENDOR_DOCUMENT_PDF(contractId, docId, fileName),
    },

    // 7. Audit Trail
    auditTrail: {
        list: (contractId: string, params?: any): Promise<any> =>
            unwrapResponse(apiClient.get(API_ENDPOINTS.SUBRESOURCES.AUDIT_TRAIL.BASE(contractId), { params })),
        exportPdfUrl: (contractId: string, params?: any) => {
            const qs = params ? new URLSearchParams(params).toString() : undefined;
            return API_ENDPOINTS.SUBRESOURCES.AUDIT_TRAIL.PDF(contractId, qs);
        },
    },
};
