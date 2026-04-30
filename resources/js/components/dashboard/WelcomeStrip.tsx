import { DashboardMetrics } from './types';

interface WelcomeStripProps {
    metrics: DashboardMetrics;
}

export function WelcomeStrip({ metrics: m }: WelcomeStripProps) {
    return (
        <div className="flex items-center justify-between rounded-2xl border border-sidebar-border/40 bg-gradient-to-r from-sidebar-accent/40 to-transparent px-6 py-4">
            <div>
                <h2 className="text-base font-semibold tracking-tight text-sidebar-foreground">
                    Dashboard Kontrak
                </h2>
                <p className="text-[12px] text-sidebar-foreground/50">
                    {new Date().toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    })}
                </p>
            </div>
            {m.avgCycleTime > 0 && (
                <div className="hidden md:flex flex-col items-end">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/30">
                        Rata-rata Siklus
                    </span>
                    <span className="text-xl font-bold text-sidebar-foreground">
                        {m.avgCycleTime}{' '}
                        <span className="text-sm font-normal text-sidebar-foreground/40">hari</span>
                    </span>
                </div>
            )}
        </div>
    );
}
