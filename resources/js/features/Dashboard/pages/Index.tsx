import { ToastProvider } from '@/components/ui/feedback/Toast';
import DashboardView, { type DashboardViewProps } from '@/features/Dashboard/DashboardView/DashboardView';
import { Head } from '@inertiajs/react';

export default function DashboardIndex(props: Readonly<DashboardViewProps>) {
    return (
        <>
            <Head title="Dashboard Kontrak" />
            <ToastProvider>
                <DashboardView {...props} />
            </ToastProvider>
        </>
    );
}
