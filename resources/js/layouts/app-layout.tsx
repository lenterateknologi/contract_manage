import React, { useEffect } from 'react';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { cleanupStorage } from '@/lib/clientStorage';

interface AppLayoutProps {
    children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    const { breadcrumbs } = usePage<SharedData>().props;

    useEffect(() => {
        cleanupStorage();
    }, []);

    return <AppLayoutTemplate breadcrumbs={breadcrumbs}>{children}</AppLayoutTemplate>;
}
