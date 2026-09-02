import { AppContent } from '@/layouts/app/components/AppContent';
import { AppShell } from '@/layouts/app/components/AppShell';
import { AppSidebar } from '@/layouts/app/components/AppSidebar';
import { type BreadcrumbItem } from '@/types';

export default function AppSidebarLayout({ children }: { children: React.ReactNode; breadcrumbs?: BreadcrumbItem[] }) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar">
                {children}
            </AppContent>
        </AppShell>
    );
}
