export interface MessageUser {
    id: string;
    name: string;
    email?: string;
    initials?: string;
    avatar?: string;
    avatar_url?: string;
    image_src?: string;
    role?: string;
}

export interface MessageReactionItem {
    emoji: string;
    user_id: string;
    is_me?: boolean;
    user?: {
        name: string;
    };
}

export interface ChatMessage {
    id: string;
    contract_id: string;
    user_id: string;
    message: string;
    attachment_path?: string;
    attachment_url?: string;
    attachment_name?: string;
    file_name?: string;
    reactions?: MessageReactionItem[] | Record<string, string[]>;
    created_at: string;
    updated_at?: string;
    user?: MessageUser;
}

export interface SendMessagePayload {
    contractId: string;
    message: string;
    file?: File | null;
}
