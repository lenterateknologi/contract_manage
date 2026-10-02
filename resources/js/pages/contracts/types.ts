export const DOCUMENT_TYPES = ['f1', 'f2', 'agreement', 'contract'] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const TERMINAL_STATUSES = ['rejected', 'cancelled', 'completed', 'closed', 'archived'] as const;
export type TerminalStatus = (typeof TERMINAL_STATUSES)[number];

export const CLOSED_STATUSES = ['rejected', 'cancelled', 'completed'] as const;
export type ClosedStatus = (typeof CLOSED_STATUSES)[number];

export interface UserFilterSettings {
    categories?: string[];
    contract_type_ids?: (string | number)[];
    submission_type_ids?: (string | number)[];
    status?: string[];
    [key: string]: unknown;
}

export interface UserProfile {
    id: string;
    name: string;
    email?: string;
    initials: string;
    role?: string;
    is_admin?: boolean;
    filter_settings?: UserFilterSettings | Record<string, unknown> | null;
    phone?: string;
    position?: string;
    can_create_on_behalf?: boolean;
    department_id?: string | null;
    department_name?: string;
    division_name?: string;
    company_name?: string;
    company_group_name?: string;
    region_name?: string;
    department?: {
        id: string;
        name: string;
    };
    company?: {
        id?: string;
        name?: string;
        address?: string;
    } | string;
    manager?: UserProfile | null;
    reporting_to?: UserProfile | null;
    nip?: string;
    employee_id?: string;
    jobtitle_name?: string;
    job_position_name?: string;
    location_name?: string;
    role_name?: string;
    address?: string;
    bg_color?: string;
    text_color?: string;
    avatar?: string;
    avatar_url?: string;
    email_verified_at?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface ContractPurchaseOrder {
    id: string;
    contract_id: string;
    po_number: string;
    title?: string | null;
    po_date?: string | null;
    amount?: number | string | null;
    currency?: string;
    vendor_name?: string | null;
    status: 'active' | 'cancelled' | 'completed' | string;
    description?: string | null;
    file_path?: string | null;
    created_at?: string;
    creator?: UserProfile;
}

export interface ContractVersion {
    id: string;
    document_type: 'contract' | 'f1' | 'f2' | 'agreement';

    version_no: number;
    file_name: string;
    file_path?: string;
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
    user_id: string | null; // new system
    approver_name: string | null;
    role: string;
    department_name?: string;
    target_approvers?: string;
    target_emails?: string;
    sequence: number;
    sub_step?: number | null;
    sort_order?: number;
    batch_no?: number;
    is_adhoc?: boolean;
    status: 'pending' | 'waiting' | 'approved' | 'rejected';
    action_id?: string | null;
    action_code?: string | null;
    action_alias?: string | null;
    is_active?: boolean;
    comment: string | null;
    attachment_path?: string | null;
    attachment_name?: string | null;
    file_size?: number | null;
    has_attachment?: boolean;
    step_entry_at?: string | null;
    decided_at: string | null;
    created_at?: string;
    step_type?: string;
    step_name?: string;
    step_description?: string;
    workflow_step_id?: string;
    workflow_step?: {
        id: string;
        step: number;
        description: string;
        workflow_id: string;
        workflow?: {
            id: string;
            name: string;
        };
        meta?: any;
        action_configs?: any[];
        actions?: any[];
    };
    approver_authorities?: any[];
    debug_sql_queries?: string[];
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
    contract_id?: string;
    user_id: string;
    message: string;
    read_by: string[];
    created_at: string;
    reactions?: any[];
    attachments?: any[];
    parent_id?: string | null;
    parent?: any;
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
    file_size?: number | null;
    created_at: string;
    uploader?: UserProfile;
}

export interface ContractType {
    id: string | number;
    name: string;
    code?: string;
    parent_id?: string | number | null;
    description?: string;
}

export interface SubmissionType {
    id: string;
    code: string;
    name: string;
}

export interface FormSubmissionInfo {
    id: string;
    document_type: 'f1' | 'f2';
    form_template_id: string;
    current_version: number;
    submitted_by: string;
    updated_at: string;
}

export interface Contract {
    id: string;
    form_no: string;
    contract_no?: string | null;
    is_digital_signature?: boolean;
    title: string;
    description: string;
    contract_date: string | null;
    start_date?: string | null;
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
        form_no?: string;
        contract_no?: string | null;
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
    initiated_by_id?: string;
    assigned_pic_id?: string | null;
    assigned_by_id?: string | null;
    price?: number | string | null;
    tax_required?: boolean;
    is_in_sub_workflow?: boolean;
    sub_workflow?: {
        id?: string;
        name?: string;
        [key: string]: unknown;
    } | null;
    f1_file?: string | null;
    f2_file?: string | null;
    f1_items?: any[];
    agreement_file?: string | null;
    status: ContractStatus;
    meta?: Record<string, any>;
    allow?: {
        info_edit?: boolean;
        title_edit?: boolean;
        first_party_edit?: boolean;
        vendor_edit?: boolean;
        category_edit?: boolean;
        f2_contract_no_edit?: boolean;
        tax_toggle_edit?: boolean;
        price_edit?: boolean;
        period_edit?: boolean;
        f1_edit?: boolean;
        f2_edit?: boolean;
        agreement_edit?: boolean;
        attachment_edit?: boolean;
        reference?: boolean;
        [key: string]: boolean | undefined;
    };
    show?: {
        info?: boolean;
        title?: boolean;
        first_party?: boolean;
        vendor?: boolean;
        category?: boolean;
        f2_contract_no?: boolean;
        tax_toggle?: boolean;
        price?: boolean;
        period?: boolean;
        [key: string]: boolean | undefined;
    };
    required?: {
        f1?: boolean;
        f2?: boolean;
        agreement?: boolean;
        title?: boolean;
        first_party?: boolean;
        vendor?: boolean;
        category?: boolean;
        f2_contract_no?: boolean;
        tax_toggle?: boolean;
        price?: boolean;
        period?: boolean;
        [key: string]: boolean | undefined;
    };
    modes?: {
        display?: 'interactive' | 'pdf';
        f1?: 'interactive' | 'upload';
        f1_form_template_id?: string | null;
        f2?: 'interactive' | 'upload';
        f2_form_template_id?: string | null;
        contract?: 'interactive' | 'upload';
        contract_form_template_id?: string | null;
    };
    display_mode?: 'interactive' | 'pdf';
    allow_info_edit?: boolean;
    allow_title_edit?: boolean;
    allow_first_party_edit?: boolean;
    allow_vendor_edit?: boolean;
    allow_category_edit?: boolean;
    allow_f2_contract_no_edit?: boolean;
    allow_tax_toggle_edit?: boolean;
    allow_price_edit?: boolean;
    allow_period_edit?: boolean;
    allow_f1_edit?: boolean;
    allow_f2_edit?: boolean;
    allow_agreement_edit?: boolean;
    allow_attachment_edit?: boolean;
    allow_reference?: boolean;
    show_info?: boolean;
    show_title?: boolean;
    show_first_party?: boolean;
    show_vendor?: boolean;
    show_category?: boolean;
    show_f2_contract_no?: boolean;
    show_tax_toggle?: boolean;
    show_price?: boolean;
    show_period?: boolean;
    require_f1?: boolean;
    require_f2?: boolean;
    require_agreement?: boolean;
    require_title?: boolean;
    require_first_party?: boolean;
    require_vendor?: boolean;
    require_category?: boolean;
    require_f2_contract_no?: boolean;
    require_tax_toggle?: boolean;
    require_price?: boolean;
    require_period?: boolean;
    current_version: number;
    requires_pic_assignment?: boolean;
    created_at: string;
    updated_at: string;
    updated_at_formatted?: string;
    submitted_at: string | null;
    submitted_at_formatted?: string | null;
    assigned_at?: string | null;
    assigned_at_formatted?: string | null;
    pic_assigned_at?: string | null;
    finished_at?: string | null;
    finished_at_formatted?: string | null;
    closed_at?: string | null;
    closed_at_formatted?: string | null;
    submission_age?: string | null;
    pic_age?: string | null;
    creator: UserProfile;
    metadata?: {
        tax_required?: boolean;
        [key: string]: any;
    };
    meta?: Record<string, any>;
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
    purchase_orders?: ContractPurchaseOrder[];
    form_submissions?: FormSubmissionInfo[];
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
        code?: string;
        vendor_code?: string;
        pic_name?: string;
        pic_position?: string;
        address?: string;
        detail?: Record<string, any>;
        vendor_detail?: Record<string, any>;
        documents?: Array<{
            id: string;
            name: string;
            type: string;
        }>;
    };
    workflow_id?: string;
    origin_workflow_id?: string;
    origin_workflow_step_id?: string | null;
    origin_workflow?: {
        id: string;
        name: string;
        meta?: Record<string, any>;
    } | null;
    origin_workflow_step?: {
        id: string;
        step?: number;
        label?: string;
        name?: string;
    } | null;
    workflow?: {
        id: string;
        name: string;
        meta?: Record<string, any>;
        contract_type?: any;
        steps?: any[];
    } | null;
    workflow_step_id?: string;
    workflow_step?: {
        id: string;
        step: number;
        role: string;
        description: string;
        step_type: string;
        step_category: string | null;
        target_approvers?: string | null;
        meta?: {
            allow_info_edit?: boolean;
            allow_f1_edit?: boolean;
            allow_f2_edit?: boolean;
            allow_agreement_edit?: boolean;
            allow_attachment_edit?: boolean;
            allow_reference?: boolean;
            is_manager?: boolean;
            show_f2_contract_no?: boolean;
            show_tax_toggle?: boolean;
            show_tab_f1?: boolean;
            show_tab_f2?: boolean;
            show_tab_agreement?: boolean;
            show_tab_timeline?: boolean;
            show_tab_attachments?: boolean;
            show_tab_chat?: boolean;
            show_tab_references?: boolean;
            show_tab_members?: boolean;
            show_document_detail?: boolean;
            show_action_panel?: boolean;
            show_info?: boolean;
        } | null;
        actions?: Array<{
            id: string;
            action_code: string;
            alias?: string | null;
            next_workflow_id?: string | null;
            next_workflow_step_id?: string | null;
        }>;
    } | null;
    can_approve?: boolean;
    is_current_actor?: boolean;
    pending_approval_id?: string;
    assigned_pic?: UserProfile | null;
    assigned_by?: UserProfile | null;
    unread_count?: number;
    status_info?: {
        code?: string;
        label?: string;
        color?: string;
        bg_color?: string;
        icon?: string | null;
    } | null;
}

export type ContractStatus = 'draft' | 'in_review' | 'revision' | 'approved' | 'locked' | 'archived';

export interface PaginatedData<T> {
    data: T[];
    links?: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
    current_page: number;
    last_page: number;
    total: number;
    first_page_url?: string;
    last_page_url?: string;
    prev_page_url?: string | null;
    next_page_url?: string | null;
    from?: number | null;
    to?: number | null;
    path?: string;
    per_page: number;
}
