import { Contract } from '@/types/contracts';
import axios from 'axios';

const api = axios.create({
    headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
    withCredentials: true,
});

export const contractApi = {
    list: (): Promise<Contract[]> => api.get('/api/contracts').then((r) => r.data),
    get: (id: string): Promise<Contract> => api.get(`/api/contracts/${id}`).then((r) => r.data),
    create: (data: FormData): Promise<Contract> => api.post('/api/contracts', data).then((r) => r.data),
    send: (id: string): Promise<Contract> =>
        api.post(`/api/contracts/${id}/send`).then((r) => r.data),
    approve: (id: string, note: string): Promise<Contract> =>
        api.post(`/api/contracts/${id}/approve`, { note }).then((r) => r.data),
    reject: (id: string, reason: string): Promise<Contract> =>
        api.post(`/api/contracts/${id}/reject`, { reason }).then((r) => r.data),
    uploadRevision: (id: string, data: FormData): Promise<Contract> =>
        api.post(`/api/contracts/${id}/revision`, data).then((r) => r.data),
    changeVersion: (id: string, versionNo: number): Promise<Contract> =>
        api.post(`/api/contracts/${id}/version`, { version_no: versionNo }).then((r) => r.data),
    downloadUrl: (id: string) => `/api/contracts/${id}/download`,
    messages: {
        list: (contractId: string) => api.get(`/api/contracts/${contractId}/messages`).then((r) => r.data),
        send: (contractId: string, message: string) =>
            api.post(`/api/contracts/${contractId}/messages`, { message }).then((r) => r.data),
        markRead: (contractId: string) =>
            api.post(`/api/contracts/${contractId}/messages/read`).then((r) => r.data),
    },
};
