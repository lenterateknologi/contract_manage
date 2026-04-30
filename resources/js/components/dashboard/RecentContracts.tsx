import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { ContractItem, STATUS_CONFIG } from './types';
import { SectionTitle } from './SectionTitle';

// Colorful accent per status used as left border + row tint
const STATUS_ACCENT: Record<string, { border: string; row: string }> = {
    draft:     { border: 'border-l-slate-300',   row: '' },
    in_review: { border: 'border-l-amber-400',   row: 'bg-amber-50/30' },
    revision:  { border: 'border-l-rose-400',    row: 'bg-rose-50/30' },
    approved:  { border: 'border-l-emerald-400', row: 'bg-emerald-50/20' },
};

// Colorful palette for contract type badges (cycles through)
const TYPE_COLORS = [
    'bg-violet-100 text-violet-700',
    'bg-blue-100 text-blue-700',
    'bg-cyan-100 text-cyan-700',
    'bg-teal-100 text-teal-700',
    'bg-indigo-100 text-indigo-700',
];

interface RecentContractsProps {
    items: ContractItem[];
    onViewAll: () => void;
}

export function RecentContracts({ items, onViewAll }: RecentContractsProps) {
    return (
        <div className="rounded-2xl border border-sidebar-border/60 bg-white shadow-sm lg:col-span-7 overflow-hidden">
            <div className="flex items-center justify-between border-b border-sidebar-border/40 px-6 py-4">
                <SectionTitle>Kontrak Terbaru</SectionTitle>
                <button
                    onClick={onViewAll}
                    className="text-[11px] font-semibold text-sidebar-primary/60 hover:text-sidebar-primary transition-colors"
                >
                    Lihat Semua →
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-sidebar-border/20 bg-slate-50/60">
                            <th className="px-5 py-3 text-[9px] font-black uppercase tracking-[0.18em] text-sidebar-foreground/30">No. Kontrak</th>
                            <th className="px-5 py-3 text-[9px] font-black uppercase tracking-[0.18em] text-sidebar-foreground/30">Judul & Pembuat</th>
                            <th className="px-5 py-3 text-[9px] font-black uppercase tracking-[0.18em] text-sidebar-foreground/30 hidden md:table-cell">Tipe</th>
                            <th className="px-5 py-3 text-[9px] font-black uppercase tracking-[0.18em] text-sidebar-foreground/30">Status</th>
                            <th className="px-5 py-3 text-[9px] font-black uppercase tracking-[0.18em] text-sidebar-foreground/30 text-right hidden lg:table-cell">Tanggal</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-sidebar-border/10">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-10 text-center text-[12px] text-sidebar-foreground/30">
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
                                            'group cursor-pointer border-l-[3px] transition-all duration-200',
                                            'hover:brightness-95',
                                            accentCfg.border,
                                            accentCfg.row,
                                        )}
                                    >
                                        {/* No. Kontrak */}
                                        <td className="px-5 py-3.5">
                                            <span className="font-mono text-[10px] font-bold text-sidebar-primary/80 group-hover:text-sidebar-primary transition-colors whitespace-nowrap">
                                                {c.contract_no}
                                            </span>
                                        </td>

                                        {/* Judul + Pembuat */}
                                        <td className="px-5 py-3.5">
                                            <span className="block max-w-[200px] truncate text-[12px] font-semibold text-sidebar-foreground group-hover:text-sidebar-primary transition-colors">
                                                {c.title}
                                            </span>
                                            <span className="text-[10px] text-sidebar-foreground/40">{c.creator}</span>
                                        </td>

                                        {/* Tipe — colorful badge */}
                                        <td className="hidden px-5 py-3.5 md:table-cell">
                                            <span
                                                className={cn(
                                                    'inline-block rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide whitespace-nowrap',
                                                    typeColor,
                                                )}
                                                title={c.type ?? ''}
                                            >
                                                {(c.type ?? '—').replace('Perjanjian ', '').replace('Addendum / ', '').replace('Persetujuan ', '')}
                                            </span>
                                        </td>

                                        {/* Status — colored badge */}
                                        <td className="px-5 py-3.5">
                                            <span className={cn(
                                                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold',
                                                statusCfg.bg,
                                                statusCfg.color,
                                            )}>
                                                <span className={cn('h-1.5 w-1.5 rounded-full', statusCfg.dot)} />
                                                {statusCfg.label}
                                            </span>
                                        </td>

                                        {/* Tanggal */}
                                        <td className="hidden px-5 py-3.5 text-right text-[10px] text-sidebar-foreground/30 lg:table-cell whitespace-nowrap">
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
