import { SectionTitle } from './SectionTitle';
import { TypeItem } from './types';

interface TypeDistributionProps {
    items: TypeItem[];
}

export function TypeDistribution({ items }: TypeDistributionProps) {
    const max = Math.max(...items.map((t) => t.count), 1);

    return (
        <div className="bg-white dark:bg-surface-base border border-surface-border/60 rounded-lg text-text-main select-none lg:col-span-3">
            <div className="border-surface-border/60 flex items-center justify-between border-b px-6 py-4">
                <SectionTitle>Top Tipe Kontrak</SectionTitle>
            </div>
            <div className="space-y-3.5 p-6">
                {items.length === 0 ? (
                    <p className="text-text-desc/40 py-4 text-center text-[12px] font-semibold">Belum ada data</p>
                ) : (
                    items.map((t, i) => {
                        const pct = Math.round((t.count / max) * 100);
                        return (
                            <div key={t.name}>
                                <div className="mb-1.5 flex items-center justify-between gap-2">
                                    <span className="text-text-main/80 truncate text-[11px] font-medium" title={t.name}>
                                        {t.name.replace('Perjanjian ', '').replace(' (PKS)', '')}
                                    </span>
                                    <span className="text-text-main shrink-0 text-[11px] font-semibold">{t.count}</span>
                                </div>
                                <div className="bg-surface-muted/40 border-surface-border/10 h-1 w-full overflow-hidden rounded-full border">
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
