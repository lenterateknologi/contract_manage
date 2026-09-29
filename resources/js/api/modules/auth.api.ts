import { apiClient, unwrapResponse } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { UserProfile } from '@/pages/contracts/types';

export interface LoginCredentials {
    email?: string;
    password?: string;
    remember?: boolean;
}

export interface LoginResponseData {
    token: string;
    token_type: string;
    user: UserProfile;
}

export const authApi = {
    /**
     * Login user with credentials
     */
    login: (credentials: LoginCredentials): Promise<LoginResponseData> =>
        unwrapResponse(apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials)),

    /**
     * Logout authenticated user
     */
    logout: (): Promise<void> =>
        unwrapResponse(apiClient.post(API_ENDPOINTS.AUTH.LOGOUT)),

    /**
     * Get current user profile
     */
    getProfile: (): Promise<UserProfile> =>
        unwrapResponse(apiClient.get(API_ENDPOINTS.AUTH.PROFILE)),
};
