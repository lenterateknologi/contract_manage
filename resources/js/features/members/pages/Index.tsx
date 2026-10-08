import LoadingLottie from '@/components/ui/feedback/LoadingLottie';
import { ToastProvider } from '@/components/ui/feedback/Toast';
import { Head } from '@inertiajs/react';
import React, { lazy, Suspense, useState } from 'react';

const MembersViewOrchestrator = lazy(() =>
    import('../components/MembersViewOrchestrator/MembersViewOrchestrator').then((m) => ({ default: m.MembersViewOrchestrator })),
);

interface MembersPageProps {
    users?: any;
    roles?: any;
    divisions?: any;
    departments?: any;
    subdepartments?: any;
    sections?: any;
    companyGroups?: any;
    organizationGroups?: any;
    regions?: any;
    locations?: any;
    companies?: any;
    jobTitles?: any;
    jobLevels?: any;
    jobLevelGroups?: any;
    departmentTraffic?: any;
    breadcrumbs?: any[];
}

export default function MembersIndexPage({
    users = [],
    roles = [],
    divisions = [],
    departments = [],
    subdepartments = [],
    sections = [],
    companyGroups = [],
    organizationGroups = [],
    regions = [],
    locations = [],
    companies = [],
    jobTitles = [],
    jobLevels = [],
    jobLevelGroups = [],
    departmentTraffic = {},
}: Readonly<MembersPageProps>) {
    const [membersTab, setMembersTab] = useState<'org' | 'job'>(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const tabParam = urlParams.get('tab');
            if (tabParam === 'org' || tabParam === 'job') return tabParam;
            const savedTab = localStorage.getItem('admin_members_active_tab');
            if (savedTab === 'org' || savedTab === 'job') return savedTab;
        }
        return 'org';
    });

    const handleTabChange = (tab: 'org' | 'job') => {
        setMembersTab(tab);
        if (typeof window !== 'undefined') {
            localStorage.setItem('admin_members_active_tab', tab);
            const url = new URL(window.location.href);
            url.searchParams.set('tab', tab);
            window.history.replaceState({}, '', url.toString());
        }
    };

    const usersList = Array.isArray(users) ? users : users?.data || [];
    const rolesArray = Array.isArray(roles) ? roles : roles?.data || [];

    return (
        <ToastProvider>
            <Head title="Admin - Struktur & Anggota Organisasi" />
            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
                <Suspense
                    fallback={
                        <div className="flex min-h-[400px] w-full flex-1 items-center justify-center p-6">
                            <LoadingLottie width={120} height={120} />
                        </div>
                    }
                >
                    <MembersViewOrchestrator
                        membersTab={membersTab}
                        handleTabChange={handleTabChange}
                        usersList={usersList}
                        companyGroups={companyGroups}
                        organizationGroups={organizationGroups}
                        regions={regions}
                        locations={locations}
                        companies={companies}
                        divisions={divisions}
                        departments={departments}
                        subdepartments={subdepartments}
                        sections={sections}
                        jobTitles={jobTitles}
                        jobLevels={jobLevels}
                        jobLevelGroups={jobLevelGroups}
                        rolesArray={rolesArray}
                        departmentTraffic={departmentTraffic}
                    />
                </Suspense>
            </div>
        </ToastProvider>
    );
}
