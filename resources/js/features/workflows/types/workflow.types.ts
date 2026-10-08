export interface WorkflowAuthority {
    id?: string;
    authority_type: string;
    role?: { id: string; name: string } | null;
    department?: { id: string; name: string } | null;
    division?: { id: string; name: string } | null;
    user?: { id: string; name: string } | null;
    company?: { id: string; name: string } | null;
    company_group?: { id: string; name: string } | null;
    region?: { id: string; name: string } | null;
    job_level?: { id: string; name: string } | null;
    job_position?: { id: string; name: string } | null;
}

export interface WorkflowAction {
    id?: string;
    action_code: string;
    name?: string;
    alias?: string;
    transition_type?: string;
    target_step?: number | null;
    target_workflow_id?: string | null;
    is_active?: boolean;
    conditions?: any[];
    [key: string]: any;
}

export interface WorkflowStep {
    id?: string;
    step: number;
    label?: string;
    description?: string;
    approver_type: string;
    is_optional?: boolean;
    approver_authorities?: WorkflowAuthority[];
    actions?: WorkflowAction[];
    sla_hours?: number;
    meta?: Record<string, any>;
    [key: string]: any;
}

export interface WorkflowDetail {
    id: string;
    name: string;
    code?: string;
    description?: string;
    workflow_type: string;
    is_active?: boolean;
    is_default?: boolean;
    is_selectable?: boolean;
    contract_type_id?: string | null;
    contract_type_name?: string;
    contract_types?: any[];
    initiator_summary?: any;
    steps: WorkflowStep[];
    [key: string]: any;
}

export interface WorkflowListParams {
    search?: string;
    page?: number;
    per_page?: number;
    sort_field?: string;
    sort_direction?: 'asc' | 'desc';
    contract_type_id?: string;
    is_active?: boolean;
    [key: string]: any;
}
