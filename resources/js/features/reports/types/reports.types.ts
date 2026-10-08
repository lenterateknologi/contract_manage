export interface ReportFilterParams {
    date_from?: string;
    date_to?: string;
    contract_type_ids?: string[];
    creator_ids?: string[];
    involved_ids?: string[];
    contract_ids?: string[];
    statuses?: string[];
    actions?: string[];
    search?: string;
    page?: number;
    per_page?: number;
    contracts_page?: number;
    audit_page?: number;
    [key: string]: any;
}

export interface AnalyticsReportResponse {
    metrics: {
        avgCycleTime: number;
        totalContracts: number;
        pendingApprovals: number;
        approvedThisMonth: number;
    };
    contracts: {
        data: any[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    bottlenecks: { role: string; count: number }[];
    statusDistribution: { status: string; count: number }[];
    monthlyTrend: any[];
    users: { id: string; name: string }[];
    types: { id: string; name: string }[];
    companies: any[];
}

export interface AuditLog {
    id: string;
    contract_id: string;
    form_no?: string;
    contract_no?: string;
    contract_title?: string;
    contract_status?: string;
    contract_type?: string;
    action: string;
    description: string;
    actor: string;
    actor_id?: string;
    actor_email?: string;
    actor_role?: string;
    actor_department?: string;
    actor_division?: string;
    step_name?: string;
    step_number?: number;
    created_at: string;
}

export interface AuditReportResponse {
    histories: {
        data: AuditLog[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    users: { id: string; name: string }[];
    types?: { id: string; name: string }[];
    contracts?: { id: string; name: string }[];
    actions?: string[];
}

export interface DivisionMatrixItem {
    division_id?: string;
    division_name?: string;
    division_code?: string;
    org_group_id?: string;
    org_group_name?: string;
    org_group_code?: string;
    months: Record<number, number>;
    total: number;
    average: number;
}

export interface DivisionReportSummary {
    totalSubmissions: number;
    avgPerMonth: number;
    activeDivisionsCount: number;
    totalDivisions: number;
    topDivision: { name: string; total: number; code?: string } | null;
    peakMonth: { month: number; name: string; total: number } | null;
}

export interface DivisionReportResponse {
    status: string;
    year: number;
    availableYears: number[];
    groupBy: 'division' | 'org_group';
    divisions: { id: string; name: string; code?: string }[];
    organizationGroups: { id: string; name: string; code?: string }[];
    types: { id: string; name: string }[];
    statuses: { code: string; label: string }[];
    matrix: DivisionMatrixItem[];
    monthlyTotals: Record<number, number>;
    summary: DivisionReportSummary;
    matrixDivision?: DivisionMatrixItem[];
    monthlyTotalsDivision?: Record<number, number>;
    summaryDivision?: DivisionReportSummary;
    matrixOrgGroup?: DivisionMatrixItem[];
    monthlyTotalsOrgGroup?: Record<number, number>;
    summaryOrgGroup?: DivisionReportSummary;
    submissions?: Array<{
        id: string;
        contract_no: string;
        title: string;
        status: string;
        created_at: string;
        creator_name: string;
        division_name: string;
        division_code: string;
        org_group_name?: string;
        org_group_code?: string;
        contract_type_name: string;
    }>;
}

export interface TeamMatrixItem {
    user_id: string;
    user_name: string;
    user_email?: string;
    user_nik?: string;
    department_name?: string;
    department_code?: string;
    division_name?: string;
    org_group_name?: string;
    months: Record<number, number>;
    total: number;
    average: number;
}

export interface TeamReportResponse {
    status: string;
    year: number;
    availableYears: number[];
    roleType: 'creator' | 'pic';
    currentOrgGroup?: { id: string; name: string; code?: string; user_count?: number } | null;
    organizationGroups: { id: string; name: string; code?: string; user_count?: number }[];
    matrix: TeamMatrixItem[];
    monthlyTotals: Record<number, number>;
    summary: {
        totalSubmissions: number;
        activeUsersCount: number;
        totalUsers: number;
        topUser: { name: string; total: number; email?: string; division?: string } | null;
        peakMonth: { month: number; name: string; total: number } | null;
    };
}
