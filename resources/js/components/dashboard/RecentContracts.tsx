import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { SectionTitle } from './SectionTitle';
import { ContractItem, STATUS_CONFIG } from './types';

// Colorful accent per status used as left border
const STATUS_ACCENT: Record<string, { border: string }> = {
    draft: { border: 'border-l-slate-300' },
    in_review: { border: 'border-l-amber-400' },
    revision: { border: 'border-l-rose-400' },
    approved: { border: 'border-l-emerald-400' },
};

// Colorful palette for contract type badges (cycles through)
const TYPE_COLORS = [
    'bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
    'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
    'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400',
    'bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400',
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400',
];

interface RecentContractsProps {
    items: ContractItem[];
    onViewAll: () => void;
}

export function RecentContracts({ items, onViewAll }: RecentContractsProps) {
    return (
        <div className="border-sidebar-border/60 bg-card text-card-foreground overflow-hidden rounded-2xl border shadow-sm lg:col-span-7">
            <div className="border-sidebar-border/40 flex items-center justify-between border-b px-6 py-4">
                <SectionTitle>Kontrak Terbaru</SectionTitle>
                <button
                    onClick={onViewAll}
                    className="text-sidebar-primary/60 hover:text-sidebar-primary text-[11px] font-semibold transition-colors"
                >
                    Lihat Semua →
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-sidebar-border/20 bg-muted/60 border-b">
                            <th className="text-sidebar-foreground/30 px-5 py-3 text-[9px] font-black tracking-[0.18em] uppercase">No. Kontrak</th>
                            <th className="text-sidebar-foreground/30 px-5 py-3 text-[9px] font-black tracking-[0.18em] uppercase">
                                Judul & Pembuat
                            </th>
                            <th className="text-sidebar-foreground/30 hidden px-5 py-3 text-[9px] font-black tracking-[0.18em] uppercase md:table-cell">
                                Tipe
                            </th>
                            <th className="text-sidebar-foreground/30 px-5 py-3 text-[9px] font-black tracking-[0.18em] uppercase">Status</th>
                            <th className="text-sidebar-foreground/30 hidden px-5 py-3 text-right text-[9px] font-black tracking-[0.18em] uppercase lg:table-cell">
                                Tanggal
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-sidebar-border/10 divide-y">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-sidebar-foreground/30 py-10 text-center text-[12px]">
                                    Belum ada kontrak
                                </td>
                            </tr>
                        ) : (
                            items.map((c, idx) => {
                                const statusCfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.draft;
                                const accentCfg = STATUS_ACCENT[c.status] ?? STATUS_ACCENT.draft;
                                const typeColor = TYPE_COLORS[idx % TYPE_COLORS.length];

                                return (
                                    <tr
                                        key={c.id}
                                        onClick={() => router.get(`/contracts/${c.id}`)}
                                        className={cn(
                                            'group bg-card hover:bg-muted/30 text-card-foreground cursor-pointer border-l-[3px] transition-all duration-200',
                                            accentCfg.border,
                                        )}
                                    >
                                        {/* No. Kontrak */}
                                        <td className="px-5 py-3.5">
                                            <span className="text-sidebar-primary/80 group-hover:text-sidebar-primary font-mono text-[10px] font-bold whitespace-nowrap transition-colors">
                                                {c.contract_no}
                                            </span>
                                        </td>

                                        {/* Judul + Pembuat */}
                                        <td className="px-5 py-3.5">
                                            <span className="text-sidebar-foreground group-hover:text-sidebar-primary block max-w-[200px] truncate text-[12px] font-semibold transition-colors">
                                                {c.title}
                                            </span>
                                            <span className="text-sidebar-foreground/40 text-[10px]">{c.creator}</span>
                                        </td>

                                        {/* Tipe — colorful badge */}
                                        <td className="hidden px-5 py-3.5 md:table-cell">
                                            <span
                                                className={cn(
                                                    'inline-block rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-wide whitespace-nowrap uppercase',
                                                    typeColor,
                                                )}
                                                title={c.type ?? ''}
                                            >
                                                {(c.type ?? '—').replace('Perjanjian ', '').replace('Addendum / ', '').replace('Persetujuan ', '')}
                                            </span>
                                        </td>

                                        {/* Status — colored badge */}
                                        <td className="px-5 py-3.5">
                                            <span
                                                className={cn(
                                                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold',
                                                    statusCfg.bg,
                                                    statusCfg.color,
                                                )}
                                            >
                                                <span className={cn('h-1.5 w-1.5 rounded-full', statusCfg.dot)} />
                                                {statusCfg.label}
                                            </span>
                                        </td>

                                        {/* Tanggal */}
                                        <td className="text-sidebar-foreground/30 hidden px-5 py-3.5 text-right text-[10px] whitespace-nowrap lg:table-cell">
                                            {new Date(c.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
