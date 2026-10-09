import { DashboardLoading } from '@/components/ui/feedback/DashboardLoading';
import { Icons } from '@/components/ui/icons';
import { FloatingPanel } from '@/components/ui/navigation/FloatingPanel';
import { MasterPageLayout } from '@/components/ui/navigation/MasterPageLayout';
import { PageTable } from '@/components/ui/navigation/PageTable';
import { getClientPref, setClientPref } from '@/lib/clientStorage';
import { DashboardConfig, UserFilterSettings, UserProfile } from '@/features/Contracts/types';
import { usePov } from '@/stores/usePovStore';
import { usePage } from '@inertiajs/react';
import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardMetrics } from '../components/DashboardMetrics';

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
const CreateContractModal = lazy(() => import('@/features/Contracts/components/modals/CreateContractModal'));

export type DashboardActiveTab =
    | 'overview'
    | 'workload'
    | 'master_data';

const DASHBOARD_TAB_TO_SLUG: Record<DashboardActiveTab, string> = {
    overview: 'ringkasan',
    workload: 'beban-kerja',
    master_data: 'master-data',
};

const SLUG_TO_DASHBOARD_TAB: Record<string, DashboardActiveTab> = {
    ringkasan: 'overview',
    overview: 'overview',
    'ringkasan-kontrak': 'overview',
    kontrak: 'overview',
    overview_contract: 'overview',
    'ringkasan-non-kontrak': 'overview',
    'non-kontrak': 'overview',
    overview_non_contract: 'overview',
    'ringkasan-nda': 'overview',
    nda: 'overview',
    overview_nda: 'overview',
    'beban-kerja': 'workload',
    workload: 'workload',
    'master-data': 'master_data',
    masterdata: 'master_data',
    master_data: 'master_data',
};

export interface DashboardViewProps {
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

export type DashboardIndexProps = DashboardViewProps;

export function DashboardView({
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
        return 'overview';
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
                    setDashboardTab('overview');
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
            const pCfg = pov.activeDashboardPov.config;
            return {
                ...pCfg,
                show_overview: pCfg.show_overview !== false,
                show_workload: !!pCfg.show_workload,
                show_master_data: !!pCfg.show_master_data,
            };
        }

        // 2. Direct dashboard config or metrics
        const cfg = dashboardConfig || (metrics?.dashboardConfig as DashboardConfig | undefined);
        if (cfg) {
            return {
                ...cfg,
                show_overview: cfg.show_overview !== false,
                show_workload: !!cfg.show_workload,
                show_master_data: !!cfg.show_master_data,
            };
        }

        // 3. User filter settings
        if (userFilterSettings?.dashboard_config) {
            const uCfg = userFilterSettings.dashboard_config;
            return {
                ...uCfg,
                show_overview: uCfg.show_overview !== false,
                show_workload: !!uCfg.show_workload,
                show_master_data: !!uCfg.show_master_data,
            };
        }

        return {
            show_overview: true,
            show_workload: true,
            show_master_data: false,
        };
    }, [metrics?.dashboardConfig, dashboardConfig, userFilterSettings, pov.isSimulatingDashboard, pov.activeDashboardPov]);

    // Ensure active tab is allowed by configuration
    useEffect(() => {
        const config = effectiveDashboardConfig;
        if (config) {
            const isTabAllowed =
                (dashboardTab === 'overview' && config.show_overview) ||
                (dashboardTab === 'workload' && (config.show_workload ?? true)) ||
                (dashboardTab === 'master_data' && config.show_master_data);

            if (!isTabAllowed) {
                if (config.show_overview) setDashboardTab('overview');
                else if (config.show_workload) setDashboardTab('workload');
                else if (config.show_master_data) setDashboardTab('master_data');
            }
        }
    }, [effectiveDashboardConfig, dashboardTab]);

    const pageMeta = useMemo(() => {
        if (dashboardTab === 'workload') {
            return {
                title: 'Beban Kerja',
                subtitle: 'Statistik beban kerja dan distribusi penugasan tim.',
                icon: Briefcase,
            };
        }
        if (dashboardTab === 'master_data') {
            return {
                title: 'Master Data',
                subtitle: 'Ringkasan master data pendukung kontrak.',
                icon: Layers,
            };
        }
        return {
            title: 'Dashboard Kontrak',
            subtitle: 'Statistik dan ringkasan aktivitas kontrak.',
            icon: LayoutGrid,
        };
    }, [dashboardTab]);

    return (
        <MasterPageLayout>
            <FloatingPanel className="flex min-w-0 flex-1 flex-col">
                <PageTable
                    standalone={false}
                    title={pageMeta.title}
                    subtitle={pageMeta.subtitle}
                    icon={pageMeta.icon}
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
                                <DashboardLoading />
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

export default DashboardView;

