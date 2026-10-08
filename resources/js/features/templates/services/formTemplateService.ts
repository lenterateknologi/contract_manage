import { apiClient, unwrapResponse } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';

export const formTemplateService = {
    list: (params?: any): Promise<any[]> => unwrapResponse(apiClient.get(API_ENDPOINTS.FORM_TEMPLATES.BASE, { params })),

    detail: (id: string): Promise<any> => unwrapResponse(apiClient.get(API_ENDPOINTS.FORM_TEMPLATES.DETAIL(id))),

    getFields: (id: string): Promise<{ fields: any[] }> => unwrapResponse(apiClient.get(API_ENDPOINTS.FORM_TEMPLATES.FIELDS(id))),

    exportQueue: (data: any): Promise<{ job_id: string }> =>
        unwrapResponse(apiClient.post(API_ENDPOINTS.SUBRESOURCES.FORM_SUBMISSIONS.EXPORT_QUEUE, data)),

    pdfStatus: (jobId: string): Promise<any> =>
        unwrapResponse(apiClient.get(API_ENDPOINTS.SUBRESOURCES.FORM_SUBMISSIONS.PDF_STATUS(jobId))),
};

export const formTemplatesApi = formTemplateService;
export default formTemplateService;
