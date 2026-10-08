// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface DashboardMetrics {
    totalContracts: number;
    pendingApprovals: number;
    approvedThisMonth: number;
    attentionCount: number;
    avgCycleTime: number;
}

export interface StatusItem {
    status: string;
    count: number;
}

export interface TypeItem {
    name: string;
    count: number;
}

export interface TrendItem {
    month: string;
    total: number;
}

export interface ActivityItem {
    id: string;
    action: string;
    description: string;
    actor: string;
    contract_id: string;
    contract_title: string;
    form_no: string;
    contract_no: string;
    created_at: string;
}

export interface ContractItem {
    id: string;
    form_no: string;
    contract_no: string;
    title: string;
    status: string;
    creator: string;
    type: string;
    created_at: string;
}

export interface UserWorkload {
    id: string;
    name: string;
    email: string;
    initials?: string;
    role: string;
    position?: string;
    bg_color?: string;
    text_color?: string;
    department_name?: string;
    department_id?: string;
    active_contracts_count: number;
    initiated_contracts_count: number;
    load_status: 'Ready' | 'Sibuk';
}

export interface CategoryTraffic {
    category_name: string;
    incoming_count: number;
    outgoing_count: number;
}

export interface DashboardData {
    metrics: DashboardMetrics;
    statusDistribution: StatusItem[];
    typeDistribution: TypeItem[];
    monthlyTrend: TrendItem[];
    recentActivity: ActivityItem[];
    recentContracts: ContractItem[];
    userWorkloads: UserWorkload[];
    categoryTraffic: CategoryTraffic[];
}
