import { DashboardMetrics } from './types';

interface WelcomeStripProps {
    metrics: DashboardMetrics;
}

export function WelcomeStrip({ metrics: m }: WelcomeStripProps) {
    return (
        <div className="border-sidebar-border/40 from-sidebar-accent/40 flex items-center justify-between rounded-2xl border bg-gradient-to-r to-transparent px-6 py-4">
            <div>
                <h2 className="text-sidebar-foreground text-base font-semibold tracking-tight">Dashboard Kontrak</h2>
                <p className="text-sidebar-foreground/50 text-[12px]">
                    {new Date().toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    })}
                </p>
            </div>
            {m.avgCycleTime > 0 && (
                <div className="hidden flex-col items-end md:flex">
                    <span className="text-sidebar-foreground/30 text-[10px] font-bold uppercase">Rata-rata Siklus</span>
                    <span className="text-sidebar-foreground text-xl font-bold">
                        {m.avgCycleTime} <span className="text-sidebar-foreground/40 text-sm font-normal">hari</span>
                    </span>
                </div>
            )}
        </div>
    );
}
