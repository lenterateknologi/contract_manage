// ─── Types ──────────────────────────────────────────────────────────
export interface UserProfile {
    id: string;
    name: string;
    email: string;
    initials: string;
    role: string;
    department_id: string | null;
    department_name?: string;
    department?: {
        id: string;
        name: string;
    };
    bg_color: string;
    text_color: string;
}

export interface ContractVersion {
    id: string;
    document_type: 'contract' | 'f1' | 'f2' | 'agreement';

    version_no: number;
    file_name: string;
    change_log: string;
    uploaded_by: string;
    is_final: boolean;
    file_hash: string;
    has_file: boolean;
    created_at: string;
    uploader?: UserProfile;
}

export interface ContractApproval {
    id: string;
    approver_id: string; // compatibility with old code
    user_id: string | null;     // new system
    approver_name: string | null;
    role: string;
    department_name?: string;
    target_approvers?: string;
    target_emails?: string;
    sequence: number;
    status: 'pending' | 'waiting' | 'approved' | 'rejected';
    comment: string | null;
    decided_at: string | null;
    step_type?: string;
    step_name?: string;
    step_description?: string;
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

export interface ContractAttachment {
    id: string;
    label: string;
    category: string;
    file_name: string;
    file_type: string;
    created_at: string;
    uploader?: UserProfile;
}

export interface ContractType {
    id: string;
    name: string;
    description?: string;
}

export interface SubmissionType {
    id: string;
    code: string;
    name: string;
}

export interface ContractFormSubmissionInfo {
    id: string;
    document_type: 'f1' | 'f2';
    form_template_id: string;
    current_version: number;
    submitted_by: string;
    updated_at: string;
}

export interface Contract {
    id: string;
    contract_no: string;
    crown_no?: string | null;
    is_digital_signature?: boolean;
    title: string;
    description: string;
    contract_date: string | null;
    end_date: string | null;
    contract_type: string | null;
    contract_type_id?: string;
    submission_type?: string | null;
    submission_type_id?: string;
    transaction_type?: string;
    kop_sub_topik?: string;
    parent_id?: string | null;
    parent?: {
        id: string;
        contract_no: string;
        title: string;
        status: ContractStatus;
        created_at: string;
    } | null;
    p1_entity?: string;
    p1_signer?: string;
    p1_signer_position?: string;
    p1_address?: string;
    p2_entity?: string;
    p2_signer?: string;
    p2_signer_position?: string;
    p2_address?: string;
    created_by: string;
    status: ContractStatus;
    display_mode?: 'interactive' | 'pdf';
    allow_info_edit?: boolean;
    allow_reference?: boolean;
    current_version: number;
    requires_pic_assignment?: boolean;
    created_at: string;
    submitted_at: string | null;
    creator: UserProfile;
    metadata?: {
        tax_required?: boolean;
        [key: string]: any;
    };
    progress: {
        done: number;
        total: number;
        pct: number;
    };
    versions: ContractVersion[];
    approvals: ContractApproval[];
    histories: ContractHistory[];
    messages?: ContractMessage[];
    attachments?: ContractAttachment[];
    form_submissions?: ContractFormSubmissionInfo[];
    initiator?: UserProfile;
    workflow_phase?: string;
    sla_deadline?: string | null;
    sla_total_deadline?: string | null;
    sla_is_overdue?: boolean;
    sla_total_overdue?: boolean;
    vendor_id?: string;
    vendor?: {
        id: string;
        name: string;
        pic_name?: string;
        pic_position?: string;
        address?: string;
        documents?: Array<{
            id: string;
            name: string;
            type: string;
        }>;
    };
    workflow_step?: {
        id: string;
        step: number;
        role: string;
        description: string;
        step_type: string;
        step_category: string | null;
        target_approvers?: string | null;
    } | null;
    can_approve?: boolean;
    pending_approval_id?: string;
    assigned_pic?: UserProfile | null;
    assigned_by?: UserProfile | null;
}

export type ContractStatus = 'draft' | 'in_review' | 'revision' | 'approved' | 'locked' | 'archived';

export interface PaginatedData<T> {
    data: T[];
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
    current_page: number;
    last_page: number;
    total: number;
    first_page_url: string;
    last_page_url: string;
    prev_page_url: string | null;
    next_page_url: string | null;
    from: number;
    to: number;
    path: string;
    per_page: number;
}
