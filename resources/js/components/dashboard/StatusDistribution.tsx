import { cn } from '@/lib/utils';
import { SectionTitle } from './SectionTitle';
import { STATUS_CONFIG, StatusItem } from './types';

interface StatusDistributionProps {
    items: StatusItem[];
}

export function StatusDistribution({ items }: StatusDistributionProps) {
    const total = items.reduce((sum, s) => sum + s.count, 0) || 1;

    return (
        <div className="border-surface-border/60 bg-surface-base/40 text-text-main dark:border-surface-border/60 dark:bg-surface-base/20 rounded-2xl border p-6 shadow-sm backdrop-blur-sm select-none lg:col-span-4">
            <SectionTitle>Distribusi Status</SectionTitle>
            <div className="space-y-3.5">
                {items.length === 0 ? (
                    <p className="text-text-desc/40 py-4 text-center text-[12px] font-semibold">Belum ada data</p>
                ) : (
                    items.map((s) => {
                        const cfg = STATUS_CONFIG[s.status] ?? {
                            label: s.status,
                            color: 'text-text-desc',
                            bg: 'bg-surface-muted',
                            dot: 'bg-text-desc/40',
                        };
                        const pct = Math.round((s.count / total) * 100);
                        return (
                            <div key={s.status}>
                                <div className="mb-1.5 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
                                        <span className={cn('text-[12px] font-medium uppercase', cfg.color)}>{cfg.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-text-main text-[11px] font-semibold">{s.count}</span>
                                        <span className="text-text-desc/50 text-[10px] font-semibold">{pct}%</span>
                                    </div>
                                </div>
                                <div className="bg-surface-muted/40 border-surface-border/10 h-1.5 w-full overflow-hidden rounded-full border">
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
