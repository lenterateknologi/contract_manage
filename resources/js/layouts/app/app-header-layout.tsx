import { AppContent } from '@/layouts/app/components/AppContent';
import { AppHeader } from '@/layouts/app/components/AppHeader';
import { AppShell } from '@/layouts/app/components/AppShell';
import { ImpersonationBanner } from '@/components/impersonation/ImpersonationBanner';
import { type BreadcrumbItem } from '@/types';

interface AppHeaderLayoutProps {
    children: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default function AppHeaderLayout({ children, breadcrumbs }: AppHeaderLayoutProps) {
    return (
        <AppShell>
            <ImpersonationBanner />
            <AppHeader breadcrumbs={breadcrumbs} />
            <AppContent>{children}</AppContent>
        </AppShell>
    );
}
