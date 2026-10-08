import { ToastProvider } from '@/components/ui/feedback/Toast';
import { DashboardSkeleton } from '@/components/ui/feedback/DashboardSkeleton';
import { Icons } from '@/components/ui/icons';
import { FloatingPanel } from '@/components/ui/navigation/FloatingPanel';
import { MasterPageLayout } from '@/components/ui/navigation/MasterPageLayout';
import { PageTable } from '@/components/ui/navigation/PageTable';
import { getClientPref, setClientPref } from '@/lib/clientStorage';
import { DashboardConfig, UserFilterSettings, UserProfile } from '@/pages/contracts/types';
import { usePov } from '@/stores/usePovStore';
import { Head, usePage } from '@inertiajs/react';
import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardMetrics } from './components/DashboardMetrics';
import { DashboardTab } from './ui/DashboardTab';

const {
    Briefcase,
    FileCheck,
    FileText,
    FileType,
    Layers,
    LayoutDashboard,
    LayoutGrid,
} = Icons;

// Lazy loaded modals
const CreateContractModal = lazy(() => import('@/pages/contracts/components/modals/CreateContractModal'));

export type DashboardActiveTab =
    | 'overview'
    | 'overview_contract'
    | 'overview_non_contract'
    | 'overview_nda'
    | 'workload'
    | 'master_data';

const DASHBOARD_TAB_TO_SLUG: Record<DashboardActiveTab, string> = {
    overview: 'ringkasan',
    overview_contract: 'ringkasan-kontrak',
    overview_non_contract: 'ringkasan-non-kontrak',
    overview_nda: 'ringkasan-nda',
    workload: 'beban-kerja',
    master_data: 'master-data',
};

const SLUG_TO_DASHBOARD_TAB: Record<string, DashboardActiveTab> = {
    ringkasan: 'overview',
    overview: 'overview',
    'ringkasan-kontrak': 'overview_contract',
    kontrak: 'overview_contract',
    overview_contract: 'overview_contract',
    'ringkasan-non-kontrak': 'overview_non_contract',
    'non-kontrak': 'overview_non_contract',
    overview_non_contract: 'overview_non_contract',
    'ringkasan-nda': 'overview_nda',
    nda: 'overview_nda',
    overview_nda: 'overview_nda',
    'beban-kerja': 'workload',
    workload: 'workload',
    'master-data': 'master_data',
    masterdata: 'master_data',
    master_data: 'master_data',
};

interface DashboardIndexProps {
    metrics?: Record<string, unknown>;
    dashboardConfig?: DashboardConfig;
    currentDashboardTab?: string;
    types?: Array<{ id: string; name: string }>;
    submissionTypes?: Array<{ id: string; name: string }>;
    formTemplates?: Array<{ id: string; name: string }>;
    users?: UserProfile[];
    vendors?: Array<{ id: string; name: string }>;
    departments?: Array<{ id: string; name: string; code?: string }>;
    divisions?: Array<{ id: string; name: string }>;
    roles?: Array<{ id: string; name: string }>;
    regions?: Array<{ id: string; name: string }>;
    locations?: Array<{ id: string; name: string }>;
    companyGroups?: Array<{ id: string; name: string }>;
    companies?: Array<{ id: string; name: string }>;
    organizationTree?: Array<Record<string, unknown>>;
    userFilterSettings?: UserFilterSettings;
}

function DashboardPageContent({
    metrics,
    dashboardConfig,
    currentDashboardTab,
    types = [],
    submissionTypes = [],
    formTemplates = [],
    users = [],
    vendors = [],
    departments = [],
    divisions = [],
    roles = [],
    regions = [],
    locations = [],
    companyGroups = [],
    companies = [],
    organizationTree = [],
    userFilterSettings = {},
}: Readonly<DashboardIndexProps>) {
    const { auth } = usePage<{ auth: { user: UserProfile | null } }>().props;
    const meUser = auth?.user ?? null;
    const meId = auth?.user?.id ?? '';
    const pov = usePov();

    const [isCreateOpen, setCreateOpen] = useState(false);

    const [dashboardTab, setDashboardTab] = useState<DashboardActiveTab>(() => {
        if (currentDashboardTab && SLUG_TO_DASHBOARD_TAB[currentDashboardTab]) {
            return SLUG_TO_DASHBOARD_TAB[currentDashboardTab];
        }
        if (typeof window !== 'undefined') {
            const pathParts = window.location.pathname.split('/').filter(Boolean);
            if (pathParts[0] === 'dashboard' && pathParts[1] && SLUG_TO_DASHBOARD_TAB[pathParts[1]]) {
                return SLUG_TO_DASHBOARD_TAB[pathParts[1]];
            }
            const urlParams = new URLSearchParams(window.location.search);
            const tabParam = urlParams.get('dashboard_tab') || urlParams.get('tab');
            if (tabParam && SLUG_TO_DASHBOARD_TAB[tabParam]) {
                return SLUG_TO_DASHBOARD_TAB[tabParam];
            }
            const saved = getClientPref<string>('dashboard_active_tab', '');
            if (saved && SLUG_TO_DASHBOARD_TAB[saved]) {
                return SLUG_TO_DASHBOARD_TAB[saved];
            }
        }
        return 'overview_contract';
    });

    const handleDashboardTabChange = useCallback((newTab: DashboardActiveTab) => {
        setDashboardTab(newTab);
        setClientPref('dashboard_active_tab', newTab);
        if (typeof window !== 'undefined' && (window.location.pathname.startsWith('/dashboard') || window.location.pathname === '/')) {
            const slug = DASHBOARD_TAB_TO_SLUG[newTab] || newTab;
            const targetUrl = `/dashboard/${slug}${window.location.search}`;
            if (window.location.pathname !== `/dashboard/${slug}`) {
                window.history.pushState({}, '', targetUrl);
            }
        }
    }, []);

    useEffect(() => {
        const handlePopState = () => {
            if (typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboard')) {
                const parts = window.location.pathname.split('/').filter(Boolean);
                const subSlug = parts[1];
                if (subSlug && SLUG_TO_DASHBOARD_TAB[subSlug]) {
                    setDashboardTab(SLUG_TO_DASHBOARD_TAB[subSlug]);
                } else if (!subSlug) {
                    setDashboardTab('overview_contract');
                }
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    useEffect(() => {
        if (currentDashboardTab && SLUG_TO_DASHBOARD_TAB[currentDashboardTab]) {
            setDashboardTab(SLUG_TO_DASHBOARD_TAB[currentDashboardTab]);
        }
    }, [currentDashboardTab]);

    const effectiveDashboardConfig = useMemo(() => {
        // 1. Simulation POV
        if (pov.isSimulatingDashboard && pov.activeDashboardPov?.config !== undefined) {
            return {
                show_overview: !!pov.activeDashboardPov.config.show_overview,
                show_overview_contract: pov.activeDashboardPov.config.show_overview_contract !== false,
                show_overview_non_contract: pov.activeDashboardPov.config.show_overview_non_contract !== false,
                show_overview_nda: pov.activeDashboardPov.config.show_overview_nda !== false,
                show_workload: !!pov.activeDashboardPov.config.show_workload,
                show_master_data: !!pov.activeDashboardPov.config.show_master_data,
            };
        }

        // 2. Direct dashboard config or metrics
        const cfg = dashboardConfig || metrics?.dashboardConfig;
        if (cfg) {
            return {
                show_overview: !!cfg.show_overview,
                show_overview_contract: cfg.show_overview_contract !== false,
                show_overview_non_contract: cfg.show_overview_non_contract !== false,
                show_overview_nda: cfg.show_overview_nda !== false,
                show_workload: !!cfg.show_workload,
                show_master_data: !!cfg.show_master_data,
            };
        }

        // 3. User filter settings
        if (userFilterSettings?.dashboard_config) {
            const uCfg = userFilterSettings.dashboard_config;
            return {
                show_overview: !!uCfg.show_overview,
                show_overview_contract: uCfg.show_overview_contract !== false,
                show_overview_non_contract: uCfg.show_overview_non_contract !== false,
                show_overview_nda: uCfg.show_overview_nda !== false,
                show_workload: !!uCfg.show_workload,
                show_master_data: !!uCfg.show_master_data,
            };
        }

        return {
            show_overview: false,
            show_overview_contract: true,
            show_overview_non_contract: true,
            show_overview_nda: true,
            show_workload: false,
            show_master_data: false,
        };
    }, [metrics?.dashboardConfig, dashboardConfig, userFilterSettings, pov.isSimulatingDashboard, pov.activeDashboardPov]);

    // Ensure active tab is allowed by configuration
    useEffect(() => {
        const config = effectiveDashboardConfig;
        if (config) {
            const isTabAllowed =
                (dashboardTab === 'overview' && config.show_overview) ||
                (dashboardTab === 'overview_contract' && config.show_overview_contract) ||
                (dashboardTab === 'overview_non_contract' && config.show_overview_non_contract) ||
                (dashboardTab === 'overview_nda' && config.show_overview_nda) ||
                (dashboardTab === 'workload' && config.show_workload) ||
                (dashboardTab === 'master_data' && config.show_master_data);

            if (!isTabAllowed) {
                if (config.show_overview_contract) setDashboardTab('overview_contract');
                else if (config.show_overview) setDashboardTab('overview');
                else if (config.show_overview_non_contract) setDashboardTab('overview_non_contract');
                else if (config.show_overview_nda) setDashboardTab('overview_nda');
                else if (config.show_workload) setDashboardTab('workload');
                else if (config.show_master_data) setDashboardTab('master_data');
            }
        }
    }, [effectiveDashboardConfig, dashboardTab]);

    const headerActions = useMemo(() => {
        const config = effectiveDashboardConfig;
        const showOverview = config ? !!config.show_overview : false;
        const showOverviewContract = config ? !!config.show_overview_contract : false;
        const showOverviewNonContract = config ? !!config.show_overview_non_contract : false;
        const showOverviewNda = config ? !!config.show_overview_nda : false;
        const showWorkload = config ? !!config.show_workload : false;
        const showMasterData = config ? !!config.show_master_data : false;

        if (
            !showOverview &&
            !showOverviewContract &&
            !showOverviewNonContract &&
            !showOverviewNda &&
            !showWorkload &&
            !showMasterData
        ) {
            return undefined;
        }

        return (
            <div className="custom-scrollbar flex items-center gap-2 overflow-x-auto pb-0.5">
                {showOverview && (
                    <DashboardTab
                        active={dashboardTab === 'overview'}
                        onClick={() => handleDashboardTabChange('overview')}
                        label="Ringkasan"
                        icon={LayoutDashboard}
                    />
                )}
                {showOverviewContract && (
                    <DashboardTab
                        active={dashboardTab === 'overview_contract'}
                        onClick={() => handleDashboardTabChange('overview_contract')}
                        label="Ringkasan Kontrak"
                        icon={FileText}
                    />
                )}
                {showOverviewNonContract && (
                    <DashboardTab
                        active={dashboardTab === 'overview_non_contract'}
                        onClick={() => handleDashboardTabChange('overview_non_contract')}
                        label="Ringkasan Non Kontrak"
                        icon={FileType}
                    />
                )}
                {showOverviewNda && (
                    <DashboardTab
                        active={dashboardTab === 'overview_nda'}
                        onClick={() => handleDashboardTabChange('overview_nda')}
                        label="Ringkasan NDA"
                        icon={FileCheck}
                    />
                )}
                {showWorkload && (
                    <DashboardTab
                        active={dashboardTab === 'workload'}
                        onClick={() => handleDashboardTabChange('workload')}
                        label="Beban Kerja"
                        icon={Briefcase}
                    />
                )}
                {showMasterData && (
                    <DashboardTab
                        active={dashboardTab === 'master_data'}
                        onClick={() => handleDashboardTabChange('master_data')}
                        label="Master Data"
                        icon={Layers}
                    />
                )}
            </div>
        );
    }, [effectiveDashboardConfig, dashboardTab, handleDashboardTabChange]);

    return (
        <MasterPageLayout>
            <FloatingPanel className="flex min-w-0 flex-1 flex-col">
                <PageTable
                    standalone={false}
                    title="Dashboard Kontrak"
                    subtitle="Statistik dan ringkasan aktivitas kontrak."
                    icon={LayoutGrid}
                    actions={headerActions}
                    showFooter={false}
                >
                    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
                        <div className="custom-scrollbar h-full min-h-0 flex-1 overflow-y-auto p-5">
                            {metrics ? (
                                <DashboardMetrics
                                    metrics={{ ...metrics, dashboardConfig: effectiveDashboardConfig }}
                                    activeTab={dashboardTab}
                                    meUser={meUser}
                                    onCreateContract={() => setCreateOpen(true)}
                                />
                            ) : (
                                <DashboardSkeleton />
                            )}
                        </div>
                    </div>
                </PageTable>
            </FloatingPanel>

            {/* Create Contract Modal */}
            {isCreateOpen && (
                <Suspense fallback={null}>
                    <CreateContractModal
                        isOpen={isCreateOpen}
                        onClose={() => setCreateOpen(false)}
                        types={types}
                        submissionTypes={submissionTypes}
                        users={users}
                        vendors={vendors}
                        departments={departments}
                        divisions={divisions}
                        roles={roles}
                        regions={regions}
                        locations={locations}
                        companyGroups={companyGroups}
                        companies={companies}
                        organizationTree={organizationTree}
                        formTemplates={formTemplates}
                        currentUserId={meId}
                        dashboardConfig={effectiveDashboardConfig}
                    />
                </Suspense>
            )}
        </MasterPageLayout>
    );
}

export default function DashboardIndex(props: Readonly<DashboardIndexProps>) {
    return (
        <>
            <Head title="Dashboard Kontrak" />
            <ToastProvider>
                <DashboardPageContent {...props} />
            </ToastProvider>
        </>
    );
}
