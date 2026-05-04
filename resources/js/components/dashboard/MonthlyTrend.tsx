import { SectionTitle } from './SectionTitle';
import { TrendItem } from './types';

interface MonthlyTrendProps {
    items: TrendItem[];
}

export function MonthlyTrend({ items }: MonthlyTrendProps) {
    const max = Math.max(...items.map((t) => t.total), 1);

    return (
        <div className="rounded-2xl border border-sidebar-border/60 bg-card text-card-foreground p-6 shadow-sm lg:col-span-5">
            <SectionTitle>Tren 6 Bulan Terakhir</SectionTitle>
            {items.length > 0 ? (
                <div className="flex h-[120px] items-end gap-2">
                    {items.map((t) => {
                        const h = Math.max((t.total / max) * 100, 4);
                        return (
                            <div key={t.month} className="group flex flex-1 flex-col items-center gap-1">
                                <span className="text-[9px] font-bold text-sidebar-foreground/0 group-hover:text-sidebar-foreground/60 transition-colors">
                                    {t.total}
                                </span>
                                <div
                                    className="w-full rounded-t-md bg-sidebar-primary/20 hover:bg-sidebar-primary/50 transition-colors duration-200"
                                    style={{ height: `${h}%` }}
                                    title={`${t.month}: ${t.total} kontrak`}
                                />
                                <span className="text-[10px] font-semibold text-sidebar-foreground/40">{t.month}</span>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex h-[120px] items-center justify-center">
                    <p className="text-[12px] text-sidebar-foreground/30">Belum ada data tren</p>
                </div>
            )}
        </div>
    );
}
