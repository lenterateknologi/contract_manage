import { AppContent } from '@/components/layout/AppContent';
import { AppShell } from '@/components/layout/AppShell';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppSidebarHeader } from '@/components/layout/AppSidebarHeader';
import { type BreadcrumbItem } from '@/types';

export default function AppSidebarLayout({ children, breadcrumbs = [] }: { children: React.ReactNode; breadcrumbs?: BreadcrumbItem[] }) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
        </AppShell>
    );
}
