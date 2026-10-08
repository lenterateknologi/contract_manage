export interface ResourceFieldSchema {
    name: string;
    label: string;
    type?: string;
    icon?: string;
    required?: boolean;
    placeholder?: string;
    defaultValue?: any;
    helperText?: string;
    options?: any;
    isGroup?: boolean;
    schema?: ResourceFieldSchema[];
    columnSpan?: number | 'full';
    meta?: Record<string, any>;
}

export interface ResourceTableSchema {
    name: string;
    label: string;
    type?: string;
    sortable?: boolean;
    align?: 'left' | 'center' | 'right';
    is_boolean?: boolean;
    hidden?: boolean;
    badge?: boolean;
    options?: any;
}

export interface ResourceFilterSchema {
    name: string;
    label: string;
    type?: string;
    options?: any;
    placeholder?: string;
}

export interface ResourceIndexProps {
    resourceSlug: string;
    title: string;
    tableSchema: ResourceTableSchema[];
    formSchema: ResourceFieldSchema[];
    data: any;
    filters: ResourceFilterSchema[];
    activeFilters?: Record<string, any>;
    hasExport?: boolean;
    hasImport?: boolean;
    hasPortalSync?: boolean;
}

export interface ResourceFormProps {
    resourceSlug: string;
    title: string;
    formSchema: ResourceFieldSchema[];
    formColumns?: number;
    record: any | null;
    organizationTree?: any[] | null;
    returnUrl?: string | null;
    roles?: any[];
    departments?: any[];
    divisions?: any[];
    locations?: any[];
    users?: any[];
    companyGroups?: any[];
    organizationGroups?: any[];
    regions?: any[];
    companies?: any[];
}

export interface SlaStage {
    id?: string;
    contract_status?: string;
    status?: string;
    duration_hours: number;
    duration_days?: number | string;
    is_active?: boolean;
}
