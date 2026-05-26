import { cn, formatDateShort } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { SectionTitle } from './SectionTitle';
import { ContractItem } from './types';

// Accent status left border (refined border colors)
const STATUS_ACCENT: Record<string, { border: string }> = {
    draft: { border: 'border-l-slate-300 dark:border-l-slate-600' },
    in_review: { border: 'border-l-amber-500' },
    revision: { border: 'border-l-rose-500' },
    approved: { border: 'border-l-emerald-500' },
};

// Premium, soft badge config for statuses
const STATUS_BADGE_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    draft: { label: 'Draft', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20', dot: 'bg-slate-400' },
    in_review: { label: 'Review', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-500' },
    revision: { label: 'Revisi', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', dot: 'bg-rose-500' },
    approved: { label: 'Disetujui', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-500' },
};

// Sleek palette for contract type badges
const TYPE_COLORS = [
    'bg-violet-500/10 text-violet-600 border-violet-500/20 dark:text-violet-400',
    'bg-info/10 text-info border-info/20',
    'bg-cyan-500/10 text-cyan-600 border-cyan-500/20 dark:text-cyan-400',
    'bg-teal-500/10 text-teal-600 border-teal-500/20 dark:text-teal-400',
    'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400',
];

interface RecentContractsProps {
    items: ContractItem[];
    onViewAll: () => void;
}

export function RecentContracts({ items, onViewAll }: RecentContractsProps) {
    return (
        <div className="border-border/60 bg-card/40 text-foreground overflow-hidden rounded-2xl border shadow-sm backdrop-blur-sm w-full dark:border-slate-800/60 dark:bg-slate-900/20">
            <div className="border-border/60 flex items-center justify-between border-b px-6 py-4 dark:border-slate-800/60">
                <SectionTitle>Kontrak Terbaru</SectionTitle>
                <button
                    onClick={onViewAll}
                    className="text-primary/70 hover:text-primary text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                    Lihat Semua →
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-border/40 bg-muted/20 border-b dark:border-slate-800/40 dark:bg-slate-900/35">
                            <th className="text-muted-foreground px-5 py-3 text-[9px] font-bold tracking-wider uppercase">No. Kontrak</th>
                            <th className="text-muted-foreground px-5 py-3 text-[9px] font-bold tracking-wider uppercase">
                                Judul & Pembuat
                            </th>
                            <th className="text-muted-foreground hidden px-5 py-3 text-[9px] font-bold tracking-wider uppercase md:table-cell">
                                Tipe
                            </th>
                            <th className="text-muted-foreground px-5 py-3 text-[9px] font-bold tracking-wider uppercase">Status</th>
                            <th className="text-muted-foreground hidden px-5 py-3 text-right text-[9px] font-bold tracking-wider uppercase lg:table-cell">
                                Tanggal
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20 dark:divide-slate-800/40">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-muted-foreground py-10 text-center text-[12px] font-medium">
                                    Belum ada kontrak
                                </td>
                            </tr>
                        ) : (
                            items.map((c, idx) => {
                                const statusCfg = STATUS_BADGE_CONFIG[c.status] ?? STATUS_BADGE_CONFIG.draft;
                                const accentCfg = STATUS_ACCENT[c.status] ?? STATUS_ACCENT.draft;
                                const typeColor = TYPE_COLORS[idx % TYPE_COLORS.length];

                                return (
                                    <tr
                                        key={c.id}
                                        onClick={() => router.get(`/contracts/${c.id}`)}
                                        className={cn(
                                            'group bg-card/10 hover:bg-muted/40 text-foreground cursor-pointer border-l-3 transition-all duration-200 dark:bg-slate-900/10 dark:hover:bg-slate-800/20 border-b border-border/20 last:border-b-0 dark:border-slate-800/40',
                                            accentCfg.border,
                                        )}
                                    >
                                        {/* No. Kontrak */}
                                        <td className="px-5 py-3.5">
                                            <span className="text-primary/80 group-hover:text-primary font-mono text-[10px] font-bold whitespace-nowrap transition-colors">
                                                {c.contract_no}
                                            </span>
                                        </td>

                                        {/* Judul + Pembuat */}
                                        <td className="px-5 py-3.5">
                                            <span className="text-foreground group-hover:text-primary block max-w-[240px] truncate text-[12px] font-bold transition-colors">
                                                {c.title}
                                            </span>
                                            <span className="text-muted-foreground text-[10px] font-medium block mt-0.5">{c.creator}</span>
                                        </td>

                                        {/* Tipe — colorful badge */}
                                        <td className="hidden px-5 py-3.5 md:table-cell">
                                            <span
                                                className={cn(
                                                    'inline-block rounded-full border px-2.5 py-0.5 text-[9px] font-bold tracking-wide whitespace-nowrap uppercase',
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
                                                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold',
                                                    statusCfg.bg,
                                                    statusCfg.color,
                                                )}
                                            >
                                                <span className={cn('h-1.5 w-1.5 rounded-full animate-pulse', statusCfg.dot)} />
                                                {statusCfg.label}
                                            </span>
                                        </td>

                                        {/* Tanggal */}
                                        <td className="text-muted-foreground hidden px-5 py-3.5 text-right text-[10px] font-medium whitespace-nowrap lg:table-cell">
                                            {formatDateShort(c.created_at)}
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

