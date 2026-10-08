import { apiClient, unwrapResponse } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { router } from '@inertiajs/react';
import { ContractMemberEntry } from '../types';

export const membersService = {
    /**
     * Get involved members for a specific contract.
     */
    getContractMembers: async (contractId: string): Promise<ContractMemberEntry[]> => {
        return unwrapResponse(apiClient.get(API_ENDPOINTS.SUBRESOURCES.MEMBERS(contractId)));
    },

    /**
     * Trigger a server-side cache refresh for organization & job hierarchy members.
     */
    refreshAdminMembers: (tab: 'org' | 'job' = 'org', onFinish?: () => void): void => {
        router.get(
            '/admin/members',
            { refresh: 1, tab },
            {
                preserveState: false,
                preserveScroll: true,
                onFinish,
            },
        );
    },
};
