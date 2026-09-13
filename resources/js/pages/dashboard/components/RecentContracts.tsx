import { cn, formatDateShort } from '@/lib/utils';
import { getContractTypeBadgeConfig } from '@/pages/contracts/components/ContractTableCells';
import { StatusBadge } from '@/components/ui/feedback/StatusBadge';
import { usePage, router } from '@inertiajs/react';
import { SectionTitle } from './SectionTitle';
import { ContractItem } from './types';

interface RecentContractsProps {
    items: ContractItem[];
    onViewAll: () => void;
}

export function RecentContracts({ items, onViewAll }: RecentContractsProps) {
    const pageProps = usePage<any>()?.props;
    const masterStatuses = pageProps?.masterContractStatuses || [];

    return (
        <div className="bg-white dark:bg-surface-base border border-surface-border/60 rounded-lg text-foreground w-full overflow-hidden">
            <div className="border-border/60 flex items-center justify-between border-b px-6 py-4 dark:border-slate-800/60">
                <SectionTitle>Kontrak Terbaru</SectionTitle>
                <button
                    onClick={onViewAll}
                    className="text-primary/70 hover:text-primary cursor-pointer text-[11px] font-medium  uppercase transition-colors"
                >
                    Lihat Semua →
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                    <thead>
                        <tr className="border-border/40 bg-muted/20 border-b dark:border-slate-800/40 dark:bg-slate-900/35">
                            <th className="text-muted-foreground px-5 py-3 text-[9px] font-medium  uppercase">No. Pengajuan</th>
                            <th className="text-muted-foreground px-5 py-3 text-[9px] font-medium  uppercase">Judul & Pembuat</th>
                            <th className="text-muted-foreground hidden px-5 py-3 text-[9px] font-medium  uppercase md:table-cell">
                                Tipe
                            </th>
                            <th className="text-muted-foreground px-5 py-3 text-[9px] font-medium  uppercase">Status</th>
                            <th className="text-muted-foreground hidden px-5 py-3 text-right text-[9px] font-medium  uppercase lg:table-cell">
                                Tanggal
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-border/20 divide-y dark:divide-slate-800/40">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-muted-foreground py-10 text-center text-[12px] font-medium">
                                    Belum ada kontrak
                                </td>
                            </tr>
                        ) : (
                            items.map((c) => {
                                const masterStatus = masterStatuses.find((m: any) => m.code?.toLowerCase() === (c.status || '').toLowerCase());
                                const statusColor = masterStatus?.color || '#cbd5e1';
                                const cleanType = (c.type ?? '').replace('Perjanjian ', '').replace('Addendum / ', '').replace('Persetujuan ', '');
                                const typeBadge = cleanType ? getContractTypeBadgeConfig(cleanType) : null;

                                return (
                                    <tr
                                        key={c.id}
                                        onClick={() => router.get(`/contracts/${c.id}`)}
                                        className="group hover:bg-muted/40 text-foreground cursor-pointer transition-all duration-200 border-b"
                                        style={{ borderLeft: `3px solid ${statusColor}` }}
                                    >
                                        {/* No. Kontrak */}
                                        <td className="px-5 py-3.5">
                                            <span className="text-primary/80 group-hover:text-primary font-mono text-[10px] font-medium whitespace-nowrap transition-colors">
                                                {c.form_no || c.contract_no}
                                            </span>
                                        </td>

                                        {/* Judul + Pembuat */}
                                        <td className="px-5 py-3.5">
                                            <span className="text-foreground group-hover:text-primary block max-w-[240px] truncate text-[12px] font-medium transition-colors">
                                                {c.title}
                                            </span>
                                            <span className="text-muted-foreground mt-0.5 block text-[10px] font-medium">{c.creator}</span>
                                        </td>

                                        {/* Tipe — colorful badge */}
                                        <td className="hidden px-5 py-3.5 md:table-cell">
                                            {typeBadge ? (
                                                <span
                                                    className={cn(
                                                        'inline-block rounded-full border px-2.5 py-0.5 text-[9px] font-medium tracking-wide whitespace-nowrap uppercase',
                                                        typeBadge.bgClass,
                                                        typeBadge.textClass,
                                                        typeBadge.borderClass,
                                                    )}
                                                    title={c.type ?? ''}
                                                >
                                                    {cleanType}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground text-[10px]">—</span>
                                            )}
                                        </td>

                                        {/* Status — StatusBadge */}
                                        <td className="px-5 py-3.5">
                                            <StatusBadge status={c.status} />
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
