import { SectionTitle } from './SectionTitle';
import { TypeItem } from './types';

interface TypeDistributionProps {
    items: TypeItem[];
}

export function TypeDistribution({ items }: TypeDistributionProps) {
    const max = Math.max(...items.map((t) => t.count), 1);

    return (
        <div className="border-sidebar-border/60 bg-card text-card-foreground rounded-2xl border p-6 shadow-sm lg:col-span-3">
            <SectionTitle>Top Tipe Kontrak</SectionTitle>
            <div className="space-y-3">
                {items.length === 0 ? (
                    <p className="text-sidebar-foreground/30 py-4 text-center text-[12px]">Belum ada data</p>
                ) : (
                    items.map((t, i) => {
                        const pct = Math.round((t.count / max) * 100);
                        return (
                            <div key={t.name}>
                                <div className="mb-1 flex items-center justify-between gap-2">
                                    <span className="text-sidebar-foreground/70 truncate text-[11px] font-semibold" title={t.name}>
                                        {t.name.replace('Perjanjian ', '').replace(' (PKS)', '')}
                                    </span>
                                    <span className="text-sidebar-foreground shrink-0 text-[11px] font-bold">{t.count}</span>
                                </div>
                                <div className="bg-sidebar-accent/50 h-1 w-full overflow-hidden rounded-full">
                                    <div
                                        className="bg-sidebar-primary/60 h-full rounded-full transition-all duration-700"
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
