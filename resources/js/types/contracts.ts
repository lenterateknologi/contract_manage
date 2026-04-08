// ─── Types ──────────────────────────────────────────────────────────
export interface UserProfile {
    id: string;
    name: string;
    initials: string;
    role: string;
    bg_color: string;
    text_color: string;
}

export interface ContractVersion {
    version_no: number;
    file_name: string;
    change_log: string;
    uploaded_by: string;
    is_final: boolean;
    file_hash: string;
    has_file: boolean;
    created_at: string;
    uploader: UserProfile;
}

export interface ContractApproval {
    id: string;
    approver_id: string;
    role: string;
    sequence: number;
    status: 'pending' | 'waiting' | 'approved' | 'rejected';
    note: string | null;
    approved_at: string | null;
    approver: UserProfile;
}

export interface ContractHistory {
    action: string;
    description: string;
    actor_id: string;
    created_at: string;
    actor: UserProfile;
}

export interface ContractMessage {
    id: string;
    user_id: string;
    message: string;
    read_by: string[];
    created_at: string;
    user: UserProfile;
}

export interface ContractProgress {
    done: number;
    total: number;
    pct: number;
}

export interface Contract {
    id: string;
    contract_no: string;
    title: string;
    description: string;
    created_by: string;
    status: 'draft' | 'in_review' | 'revision' | 'approved' | 'locked' | 'archived';
    current_version: number;
    created_at: string;
    creator: UserProfile;
    progress: ContractProgress;
    versions: ContractVersion[];
    approvals: ContractApproval[];
    histories: ContractHistory[];
    messages: ContractMessage[];
}

export type ContractStatus = Contract['status'];
