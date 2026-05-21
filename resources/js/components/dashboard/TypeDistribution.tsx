import { SectionTitle } from './SectionTitle';
import { TypeItem } from './types';

interface TypeDistributionProps {
    items: TypeItem[];
}

export function TypeDistribution({ items }: TypeDistributionProps) {
    const max = Math.max(...items.map((t) => t.count), 1);

    return (
        <div className="border-border/60 bg-card/40 text-card-foreground rounded-2xl border p-6 shadow-sm backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/20 lg:col-span-3 select-none">
            <SectionTitle>Top Tipe Kontrak</SectionTitle>
            <div className="space-y-3.5">
                {items.length === 0 ? (
                    <p className="text-muted-foreground/40 py-4 text-center text-[12px]">Belum ada data</p>
                ) : (
                    items.map((t, i) => {
                        const pct = Math.round((t.count / max) * 100);
                        return (
                            <div key={t.name}>
                                <div className="mb-1.5 flex items-center justify-between gap-2">
                                    <span className="text-foreground/80 truncate text-[11px] font-bold" title={t.name}>
                                        {t.name.replace('Perjanjian ', '').replace(' (PKS)', '')}
                                    </span>
                                    <span className="text-foreground shrink-0 text-[11px] font-bold">{t.count}</span>
                                </div>
                                <div className="bg-muted/40 h-1 w-full overflow-hidden rounded-full border border-border/10">
                                    <div
                                        className="bg-primary/60 h-full rounded-full transition-all duration-700"
                                        style={{ width: `${pct}%`, transitionDelay: `${i * 80}ms` }}
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
