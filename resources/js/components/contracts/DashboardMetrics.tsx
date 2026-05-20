import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { KpiStrip } from '@/components/dashboard/KpiStrip';
import { MonthlyTrend } from '@/components/dashboard/MonthlyTrend';
import { RecentContracts } from '@/components/dashboard/RecentContracts';
import { StatusDistribution } from '@/components/dashboard/StatusDistribution';
import { TypeDistribution } from '@/components/dashboard/TypeDistribution';
import { WelcomeStrip } from '@/components/dashboard/WelcomeStrip';
import { DashboardData } from '@/components/dashboard/types';
import { router } from '@inertiajs/react';

export function DashboardMetrics({ metrics }: { metrics: any }) {
    if (!metrics) return null;

    const data = metrics as DashboardData;
    const m = data.metrics ?? {
        totalContracts: 0,
        pendingApprovals: 0,
        approvedThisMonth: 0,
        attentionCount: 0,
        avgCycleTime: 0,
    };

    const goTo = (view: string) => router.get('/contracts', { view }, { preserveState: false });

    return (
        <div className="animate-in fade-in slide-in-from-top-4 space-y-6 duration-500">
            {/* 1. Welcome Strip */}
            <WelcomeStrip metrics={m} />

            {/* 2. KPI Strip */}
            <KpiStrip metrics={m} onNavigate={goTo} />

            {/* 3. Analytics Row */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <StatusDistribution items={data.statusDistribution ?? []} />
                <MonthlyTrend items={data.monthlyTrend ?? []} />
                <TypeDistribution items={data.typeDistribution ?? []} />
            </div>

            {/* 4. Bottom Row: Activity Feed + Recent Contracts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <ActivityFeed items={data.recentActivity ?? []} />
                <RecentContracts items={data.recentContracts ?? []} onViewAll={() => goTo('contracts')} />
            </div>
        </div>
    );
}
