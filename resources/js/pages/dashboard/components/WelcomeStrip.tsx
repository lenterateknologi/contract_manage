import { formatDate } from '@/lib/utils';
import { DashboardMetrics } from './types';

interface WelcomeStripProps {
    metrics: DashboardMetrics;
}

export function WelcomeStrip({ metrics: m }: WelcomeStripProps) {
    return (
        <div className="bg-white dark:bg-surface-base border border-surface-border/60 rounded-lg flex items-center justify-between px-6 py-4 select-none">
            <div>
                <h2 className="text-foreground text-base font-medium tracking-tight">Dashboard Kontrak</h2>
                <p className="text-muted-foreground mt-0.5 text-[11px] font-medium">
                    {formatDate(new Date(), {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    })}
                </p>
            </div>
            {m.avgCycleTime > 0 && (
                <div className="hidden flex-col items-end md:flex">
                    <span className="text-muted-foreground text-[9px] font-medium  uppercase">Rata-rata Siklus</span>
                    <span className="text-foreground mt-0.5 text-xl font-medium tracking-tight">
                        {m.avgCycleTime} <span className="text-muted-foreground text-xs font-normal">hari</span>
                    </span>
                </div>
            )}
        </div>
    );
}
