import { Contract } from '@/features/Contracts/types';

export type ConversationCategory = 'all' | 'kontrak' | 'non_kontrak' | 'nda';

export interface CategoryCountItem {
    total: number;
    unread: number;
}

export interface ConversationCategoryCounts {
    all: CategoryCountItem;
    kontrak: CategoryCountItem;
    non_kontrak: CategoryCountItem;
    nda: CategoryCountItem;
}

export interface ConversationFilterParams {
    search?: string;
    category?: ConversationCategory;
    dateFrom?: string;
    dateTo?: string;
}

export interface Conversation extends Partial<Contract> {
    id: string;
    form_no?: string;
    contract_no?: string;
    title?: string;
    status?: string;
    parent_category?: string;
    unread_count?: number;
    last_message?: {
        message?: string;
        created_at?: string;
        user_name?: string;
    } | null;
    updated_at?: string;
    assigned_pic_name?: string;
}
