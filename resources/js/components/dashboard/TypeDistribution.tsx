import { SectionTitle } from './SectionTitle';
import { TypeItem } from './types';

interface TypeDistributionProps {
    items: TypeItem[];
}

export function TypeDistribution({ items }: TypeDistributionProps) {
    const max = Math.max(...items.map((t) => t.count), 1);

    return (
        <div className="border-surface-border/60 bg-surface-base/40 text-text-main rounded-2xl border p-6 shadow-sm backdrop-blur-sm dark:border-surface-border/60 dark:bg-surface-base/20 lg:col-span-3 select-none">
            <SectionTitle>Top Tipe Kontrak</SectionTitle>
            <div className="space-y-3.5">
                {items.length === 0 ? (
                    <p className="text-text-desc/40 py-4 text-center text-[12px] font-semibold">Belum ada data</p>
                ) : (
                    items.map((t, i) => {
                        const pct = Math.round((t.count / max) * 100);
                        return (
                            <div key={t.name}>
                                <div className="mb-1.5 flex items-center justify-between gap-2">
                                    <span className="text-text-main/80 truncate text-[11px] font-bold" title={t.name}>
                                        {t.name.replace('Perjanjian ', '').replace(' (PKS)', '')}
                                    </span>
                                    <span className="text-text-main shrink-0 text-[11px] font-black">{t.count}</span>
                                </div>
                                <div className="bg-surface-muted/40 h-1 w-full overflow-hidden rounded-full border border-surface-border/10">
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
