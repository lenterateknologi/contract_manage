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
    contract_no: string;
    created_at: string;
}

export interface ContractItem {
    id: string;
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

// ─── Shared Constants ─────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    draft: { label: 'Draft', color: 'text-slate-500', bg: 'bg-slate-100', dot: 'bg-slate-400' },
    in_review: { label: 'Review', color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500' },
    revision: { label: 'Revisi', color: 'text-rose-700', bg: 'bg-rose-50', dot: 'bg-rose-500' },
    approved: { label: 'Disetujui', color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
};

// ─── Shared Utilities ─────────────────────────────────────────────────────────

export function relativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 60) return 'Baru saja';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} menit lalu`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} jam lalu`;
    if (diffSec < 86400 * 30) return `${Math.floor(diffSec / 86400)} hari lalu`;
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
