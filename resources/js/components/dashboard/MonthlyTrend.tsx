import { SectionTitle } from './SectionTitle';
import { TrendItem } from './types';

interface MonthlyTrendProps {
    items: TrendItem[];
}

export function MonthlyTrend({ items }: MonthlyTrendProps) {
    const max = Math.max(...items.map((t) => t.total), 1);

    return (
        <div className="border-surface-border/60 bg-surface-base/40 text-text-main rounded-2xl border p-6 shadow-sm backdrop-blur-sm lg:col-span-5 select-none">
            <SectionTitle>Tren 6 Bulan Terakhir</SectionTitle>
            {items.length > 0 ? (
                <div className="flex h-[120px] items-end gap-2.5 px-2">
                    {items.map((t) => {
                        const h = Math.max((t.total / max) * 100, 4);
                        return (
                            <div key={t.month} className="group flex flex-1 flex-col items-center gap-1.5">
                                <span className="text-text-desc/0 group-hover:text-text-desc/80 text-[9px] font-bold transition-all duration-200 translate-y-1 group-hover:translate-y-0">
                                    {t.total}
                                </span>
                                <div
                                    className="bg-primary/15 hover:bg-primary/35 w-full rounded-t-md transition-all duration-300 border border-primary/10 shadow-xs hover:shadow-sm"
                                    style={{ height: `${h}%` }}
                                    title={`${t.month}: ${t.total} kontrak`}
                                />
                                <span className="text-text-desc/50 text-[10px] font-bold mt-1">{t.month}</span>
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
    );
}
