import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

interface AppLayoutProps {
    children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    const { breadcrumbs } = usePage<SharedData>().props;

    return <AppLayoutTemplate breadcrumbs={breadcrumbs}>{children}</AppLayoutTemplate>;
}
