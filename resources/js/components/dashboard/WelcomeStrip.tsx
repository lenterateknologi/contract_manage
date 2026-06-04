import { formatDate } from '@/lib/utils';
import { DashboardMetrics } from './types';

interface WelcomeStripProps {
    metrics: DashboardMetrics;
}

export function WelcomeStrip({ metrics: m }: WelcomeStripProps) {
    return (
        <div className="bg-card/40 border-border/60 flex items-center justify-between rounded-2xl border px-6 py-4 shadow-sm backdrop-blur-sm select-none dark:border-slate-800/60 dark:bg-slate-900/20">
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
                    <span className="text-muted-foreground text-[9px] font-medium tracking-wider uppercase">Rata-rata Siklus</span>
                    <span className="text-foreground mt-0.5 text-xl font-medium tracking-tight">
                        {m.avgCycleTime} <span className="text-muted-foreground text-xs font-normal">hari</span>
                    </span>
                </div>
            )}
        </div>
    );
}
