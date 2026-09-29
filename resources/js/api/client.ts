import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Helper: read a specific cookie value by name
function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Standard API Response payload interface from backend
 */
export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data: T;
    errors: Record<string, string[]> | string[] | string | null;
}

/**
 * Global HTTP Client configured for Laravel REST API
 */
export const apiClient: AxiosInstance = axios.create({
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        Accept: 'application/json',
    },
    withCredentials: true,
});

// Request interceptor: attach CSRF token if present
apiClient.interceptors.request.use((config) => {
    const xsrfToken = getCookie('XSRF-TOKEN');
    if (xsrfToken) {
        config.headers['X-XSRF-TOKEN'] = xsrfToken;
    }

    const bearerToken = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (bearerToken && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${bearerToken}`;
    }

    return config;
});

/**
 * Helper to unwrap data from Axios response
 * Automatically unwraps ApiResponse structure `{ success, data, message, errors }`
 */
export const unwrapResponse = <T>(promise: Promise<AxiosResponse<any>>): Promise<T> =>
    promise.then((response) => {
        const payload = response.data;
        if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
            if (payload.pagination || payload.meta) {
                return {
                    data: payload.data,
                    pagination: payload.pagination,
                    meta: payload.meta,
                    contract_types: payload.contract_types,
                    filters: payload.filters,
                } as unknown as T;
            }
            return payload.data as T;
        }
        return payload as T;
    });

export default apiClient;
