import { SectionTitle } from './SectionTitle';
import { TypeItem } from './types';

interface TypeDistributionProps {
    items: TypeItem[];
}

export function TypeDistribution({ items }: TypeDistributionProps) {
    const max = Math.max(...items.map((t) => t.count), 1);

    return (
        <div className="rounded-2xl border border-sidebar-border/60 bg-white p-6 shadow-sm lg:col-span-3">
            <SectionTitle>Top Tipe Kontrak</SectionTitle>
            <div className="space-y-3">
                {items.length === 0 ? (
                    <p className="py-4 text-center text-[12px] text-sidebar-foreground/30">Belum ada data</p>
                ) : (
                    items.map((t, i) => {
                        const pct = Math.round((t.count / max) * 100);
                        return (
                            <div key={t.name}>
                                <div className="mb-1 flex items-center justify-between gap-2">
                                    <span
                                        className="truncate text-[11px] font-semibold text-sidebar-foreground/70"
                                        title={t.name}
                                    >
                                        {t.name.replace('Perjanjian ', '').replace(' (PKS)', '')}
                                    </span>
                                    <span className="shrink-0 text-[11px] font-bold text-sidebar-foreground">
                                        {t.count}
                                    </span>
                                </div>
                                <div className="h-1 w-full overflow-hidden rounded-full bg-sidebar-accent/50">
                                    <div
                                        className="h-full rounded-full bg-sidebar-primary/60 transition-all duration-700"
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
