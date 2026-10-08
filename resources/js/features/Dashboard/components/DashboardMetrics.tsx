import { DashboardSkeleton } from '@/components/ui/feedback/DashboardSkeleton';
import { router } from '@inertiajs/react';
import { Briefcase } from 'lucide-react';
import React, { lazy, Suspense } from 'react';

// Lazy load heavy dashboard tabs
const OverviewTab = lazy(() => import('./OverviewTab').then((m) => ({ default: m.OverviewTab })));
const WorkloadTab = lazy(() => import('./WorkloadTab').then((m) => ({ default: m.WorkloadTab })));
const MasterDataTab = lazy(() => import('./MasterDataTab').then((m) => ({ default: m.MasterDataTab })));

const TabLoading = () => <DashboardSkeleton />;

export function DashboardMetrics({
    metrics,
    activeTab,
    meUser,
    onCreateContract,
}: {
    metrics: any;
    activeTab: 'overview' | 'overview_contract' | 'overview_non_contract' | 'overview_nda' | 'workload' | 'master_data';
    meUser?: any;
    onCreateContract?: () => void;
}) {
    if (!metrics) return null;

    const config = metrics.dashboardConfig;
    console.log('[DASHBOARD LOG] Dashboard Metrics received:', metrics);
    console.log('[DASHBOARD LOG] Resolved Dashboard Config:', config);

    const hasAnyTab = config
        ? config.show_overview ||
          config.show_overview_contract ||
          config.show_overview_non_contract ||
          config.show_overview_nda ||
          config.show_workload ||
          config.show_master_data
        : false;

    if (!hasAnyTab) {
        return (
            <div className="border-surface-border bg-surface-base animate-in fade-in flex h-[320px] w-full flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center duration-300">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                    <Briefcase size={24} />
                </div>
                <h3 className="text-text-main text-sm font-semibold">Tidak Ada Dashboard yang Dikonfigurasi</h3>
                <p className="text-text-desc mt-1 max-w-sm text-xs">
                    Role atau departemen Anda saat ini belum diatur untuk menampilkan tab dashboard manapun.
                </p>
            </div>
        );
    }

    const handleNavigate = (targetView: string, params?: any) => {
        if (targetView === 'pending') {
            router.get('/contracts/pending', params);
        } else if (targetView === 'expiry') {
            router.get('/contracts/expiry', params);
        } else if (targetView === 'mine') {
            router.get('/contracts/mine', params);
        } else if (targetView === 'archived') {
            router.get('/contracts/archived', params);
        } else if (targetView === 'in_progress') {
            router.get('/contracts/in-progress', params);
        } else {
            router.get('/contracts', params);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-top-4 space-y-6 duration-500 select-none">
            {/* Tab Contents with Premium Transitions */}
            <div className="transition-all duration-300">
                <Suspense fallback={<TabLoading />}>
                    {activeTab === 'overview' && config?.show_overview && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <OverviewTab data={metrics} scope="all" onNavigate={handleNavigate} meUser={meUser} onCreateContract={onCreateContract} />
                        </div>
                    )}

                    {activeTab === 'overview_contract' && config?.show_overview_contract && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <OverviewTab
                                data={metrics}
                                scope="contract"
                                onNavigate={handleNavigate}
                                meUser={meUser}
                                onCreateContract={onCreateContract}
                            />
                        </div>
                    )}

                    {activeTab === 'overview_non_contract' && config?.show_overview_non_contract && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <OverviewTab
                                data={metrics}
                                scope="non_contract"
                                onNavigate={handleNavigate}
                                meUser={meUser}
                                onCreateContract={onCreateContract}
                            />
                        </div>
                    )}

                    {activeTab === 'overview_nda' && config?.show_overview_nda && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <OverviewTab data={metrics} scope="nda" onNavigate={handleNavigate} meUser={meUser} onCreateContract={onCreateContract} />
                        </div>
                    )}

                    {activeTab === 'workload' && config?.show_workload && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <WorkloadTab data={metrics} onNavigate={handleNavigate} />
                        </div>
                    )}

                    {activeTab === 'master_data' && config?.show_master_data && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <MasterDataTab data={metrics} />
                        </div>
                    )}
                </Suspense>
            </div>
        </div>
    );
}
