import { cn } from '@/lib/utils';
import { SectionTitle } from './SectionTitle';
import { STATUS_CONFIG, StatusItem } from './types';

interface StatusDistributionProps {
    items: StatusItem[];
}

export function StatusDistribution({ items }: StatusDistributionProps) {
    const total = items.reduce((sum, s) => sum + s.count, 0) || 1;

    return (
        <div className="border-border/60 bg-card/40 text-card-foreground rounded-2xl border p-6 shadow-sm backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/20 lg:col-span-4 select-none">
            <SectionTitle>Distribusi Status</SectionTitle>
            <div className="space-y-3.5">
                {items.length === 0 ? (
                    <p className="text-muted-foreground/40 py-4 text-center text-[12px]">Belum ada data</p>
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
                                <div className="mb-1.5 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
                                        <span className={cn('text-[12px] font-bold', cfg.color)}>{cfg.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-foreground text-[11px] font-bold">{s.count}</span>
                                        <span className="text-muted-foreground/50 text-[10px]">{pct}%</span>
                                    </div>
                                </div>
                                <div className="bg-muted/40 h-1.5 w-full overflow-hidden rounded-full border border-border/10">
                                    <div className={cn('h-full rounded-full transition-all duration-700', cfg.dot)} style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
