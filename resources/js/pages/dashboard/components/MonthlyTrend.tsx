import { SectionTitle } from './SectionTitle';
import { TrendItem } from './types';

interface MonthlyTrendProps {
    items: TrendItem[];
}

export function MonthlyTrend({ items }: MonthlyTrendProps) {
    const max = Math.max(...items.map((t) => t.total), 1);

    return (
        <div className="bg-white dark:bg-surface-base border border-surface-border/60 rounded-lg text-text-main select-none lg:col-span-5">
            <div className="border-surface-border/60 flex items-center justify-between border-b px-6 py-4">
                <SectionTitle>Tren 6 Bulan Terakhir</SectionTitle>
            </div>
            <div className="p-6">
                {items.length > 0 ? (
                <div className="flex h-[120px] items-end gap-2.5 px-2">
                    {items.map((t) => {
                        const h = Math.max((t.total / max) * 100, 4);
                        return (
                            <div key={t.month} className="group flex flex-1 flex-col items-center gap-1.5">
                                <span className="text-text-desc/0 group-hover:text-text-desc/80 translate-y-1 text-[9px] font-medium transition-all duration-200 group-hover:translate-y-0">
                                    {t.total}
                                </span>
                                <div
                                    className="bg-primary/15 hover:bg-primary/35 border-primary/10 w-full rounded-t-md border shadow-xs transition-all duration-300 hover:shadow-sm"
                                    style={{ height: `${h}%` }}
                                    title={`${t.month}: ${t.total} kontrak`}
                                />
                                <span className="text-text-desc/50 mt-1 text-[10px] font-medium">{t.month}</span>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex h-[120px] items-center justify-center">
                    <p className="text-text-desc/40 text-[12px]">Belum ada data tren</p>
                </div>
            )}
            </div>
        </div>
    );
}
