import { cn } from '@/lib/utils';
import { SectionTitle } from './SectionTitle';
import { STATUS_CONFIG, StatusItem } from './types';

interface StatusDistributionProps {
    items: StatusItem[];
}

export function StatusDistribution({ items }: StatusDistributionProps) {
    const total = items.reduce((sum, s) => sum + s.count, 0) || 1;

    return (
        <div className="rounded-2xl border border-sidebar-border/60 bg-white p-6 shadow-sm lg:col-span-4">
            <SectionTitle>Distribusi Status</SectionTitle>
            <div className="space-y-3">
                {items.length === 0 ? (
                    <p className="py-4 text-center text-[12px] text-sidebar-foreground/30">Belum ada data</p>
                ) : (
                    items.map((s) => {
                        const cfg = STATUS_CONFIG[s.status] ?? {
                            label: s.status,
                            color: 'text-slate-500',
                            bg: 'bg-slate-100',
                            dot: 'bg-slate-400',
                        };
                        const pct = Math.round((s.count / total) * 100);
                        return (
                            <div key={s.status}>
                                <div className="mb-1 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={cn('h-2 w-2 rounded-full', cfg.dot)} />
                                        <span className={cn('text-[12px] font-semibold', cfg.color)}>{cfg.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold text-sidebar-foreground">{s.count}</span>
                                        <span className="text-[10px] text-sidebar-foreground/30">{pct}%</span>
                                    </div>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-sidebar-accent/50">
                                    <div
                                        className={cn('h-full rounded-full transition-all duration-700', cfg.dot)}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
