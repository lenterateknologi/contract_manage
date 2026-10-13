import { router } from '@inertiajs/react';
import { Briefcase } from 'lucide-react';
import React from 'react';
import { MasterDataTab } from './MasterDataTab';
import { OverviewTab } from './OverviewTab';
import { WorkloadTab } from './WorkloadTab';

export function DashboardMetrics({
    metrics,
    activeTab,
    meUser,
    onCreateContract,
}: {
    metrics: any;
    activeTab: 'overview' | 'workload' | 'master_data';
    meUser?: any;
    onCreateContract?: () => void;
}) {
    const config = metrics?.dashboardConfig;

    const hasAnyTab = config
        ? config.show_overview !== false ||
          config.show_workload ||
          config.show_master_data
        : true;

    if (!hasAnyTab) {
        return (
            <div className="border-surface-border bg-surface-base flex h-[320px] w-full flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
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
        <div className="space-y-6 select-none">
            {/* ponytail: synchronous direct render with zero loading spinners or chunk delays */}
            {activeTab === 'overview' && (config?.show_overview !== false) && (
                <div>
                    <OverviewTab data={metrics} scope="all" onNavigate={handleNavigate} meUser={meUser} onCreateContract={onCreateContract} />
                </div>
            )}

            {activeTab === 'workload' && (
                <div>
                    <WorkloadTab data={metrics} onNavigate={handleNavigate} />
                </div>
            )}

            {activeTab === 'master_data' && config?.show_master_data && (
                <div>
                    <MasterDataTab data={metrics} />
                </div>
            )}
        </div>
    );
}

export default DashboardMetrics;
