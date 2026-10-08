import React from 'react';
import { Activity, ArrowUpRight, Clock } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { StatusBadge } from '@/components/ui/feedback/StatusBadge';
import { RecentContract } from '../../types/profile.types';

interface ActivityTabProps {
    recentContracts: RecentContract[];
}

export function ActivityTab({ recentContracts }: ActivityTabProps) {
    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-text-main text-lg font-semibold">Aktivitas Terakhir</h2>
                    <p className="text-text-soft text-sm">Kontrak yang baru saja Anda akses atau buat.</p>
                </div>
                <Link href="/contracts" className="text-primary flex items-center gap-1 text-sm hover:underline">
                    Lihat semua <ArrowUpRight size={14} />
                </Link>
            </div>

            {recentContracts.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {recentContracts.map((c) => (
                        <Link
                            key={c.id}
                            href={`/contracts/${c.id}`}
                            className="dark:bg-surface-base border-surface-border group flex flex-col gap-4 rounded-xl border bg-white p-5 transition-shadow hover:shadow-md"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-primary mb-1 truncate text-xs font-medium">
                                        {c.form_no || c.contract_no || '—'}
                                    </p>
                                    <p className="text-text-main line-clamp-2 text-sm leading-snug font-medium">{c.title}</p>
                                </div>
                                <div className="shrink-0">
                                    <StatusBadge status={c.status} statusInfo={c.status_info} />
                                </div>
                            </div>
                            <div className="mt-auto space-y-2">
                                <div className="text-text-soft flex justify-between text-xs">
                                    <span>Progress</span>
                                    <span className="font-medium">{c.progress.pct}%</span>
                                </div>
                                <div className="bg-surface-muted h-1.5 w-full overflow-hidden rounded-full">
                                    <div
                                        className="bg-primary h-full rounded-full transition-all"
                                        style={{ width: `${c.progress.pct}%` }}
                                    />
                                </div>
                                <div className="text-text-soft flex justify-between text-xs">
                                    <span>{c.type}</span>
                                    <span className="flex items-center gap-1">
                                        <Clock size={11} /> {c.time_ago}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="border-surface-border flex flex-col items-center gap-4 rounded-xl border border-dashed py-20 text-center">
                    <Activity size={36} strokeWidth={1.5} className="text-text-soft opacity-30" />
                    <div>
                        <p className="text-text-soft text-sm font-medium">Belum ada aktivitas</p>
                        <p className="text-text-soft mt-1 text-xs opacity-60">Aktivitas kontrak Anda akan muncul di sini.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
