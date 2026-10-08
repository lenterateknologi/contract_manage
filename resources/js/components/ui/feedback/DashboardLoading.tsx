import LoadingLottie from '@/components/ui/feedback/LoadingLottie';
import React from 'react';

interface DashboardLoadingProps {
    readonly message?: string;
    readonly description?: string;
}

export function DashboardLoading({
    message = 'Memuat Data Dashboard...',
    description = 'Menyiapkan metrik, statistik, dan ringkasan aktivitas kontrak',
}: Readonly<DashboardLoadingProps>) {
    return (
        <div className="flex min-h-[420px] w-full flex-1 flex-col items-center justify-center rounded-xl border border-surface-border bg-surface-base/60 p-8 text-center animate-in fade-in duration-300">
            <LoadingLottie width={120} height={120} />
            <div className="mt-4 space-y-1">
                <h4 className="text-sm font-semibold text-text-main">{message}</h4>
                {description && <p className="text-xs text-text-desc max-w-sm">{description}</p>}
            </div>
        </div>
    );
}

export default DashboardLoading;
