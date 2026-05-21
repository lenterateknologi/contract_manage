import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { BarChart3, CheckCircle2, FileEdit, FilePlus, FileText, FileX, History, Send, Upload } from 'lucide-react';
import React from 'react';
import { SectionTitle } from './SectionTitle';
import { ActivityItem, relativeTime } from './types';

const ACTION_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
    CONTRACT_CREATED: { icon: <FilePlus className="h-3.5 w-3.5" />, color: 'bg-blue-100 text-blue-600' },
    CONTRACT_APPROVED: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: 'bg-emerald-100 text-emerald-600' },
    APPROVAL_REJECTED: { icon: <FileX className="h-3.5 w-3.5" />, color: 'bg-rose-100 text-rose-600' },
    CONTRACT_SENT: { icon: <Send className="h-3.5 w-3.5" />, color: 'bg-indigo-100 text-indigo-600' },
    FILE_UPLOADED: { icon: <Upload className="h-3.5 w-3.5" />, color: 'bg-slate-100 text-slate-600' },
    CONTRACT_UPDATED: { icon: <FileEdit className="h-3.5 w-3.5" />, color: 'bg-yellow-100 text-yellow-600' },
    form_f1_submitted: { icon: <FileText className="h-3.5 w-3.5" />, color: 'bg-purple-100 text-purple-600' },
    form_f2_submitted: { icon: <FileText className="h-3.5 w-3.5" />, color: 'bg-purple-100 text-purple-600' },
};

function getActionConfig(action: string) {
    return ACTION_CONFIG[action] ?? { icon: <History className="h-3.5 w-3.5" />, color: 'bg-slate-100 text-slate-500' };
}

interface ActivityFeedProps {
    items: ActivityItem[];
}

export function ActivityFeed({ items }: ActivityFeedProps) {
    return (
        <div className="border-border/60 bg-card/40 text-card-foreground rounded-2xl border shadow-sm backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/20 w-full select-none animate-in fade-in duration-300">
            <div className="border-border/60 flex items-center justify-between border-b px-6 py-4 dark:border-slate-800/60">
                <SectionTitle>Aktivitas Terbaru</SectionTitle>
                <span className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            </div>
            <div className="divide-y divide-border/20 dark:divide-slate-800/40 max-h-[500px] overflow-y-auto">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-12">
                        <BarChart3 className="text-muted-foreground/20 h-8 w-8" />
                        <p className="text-muted-foreground/40 text-[12px]">Belum ada aktivitas</p>
                    </div>
                ) : (
                    items.map((act) => {
                        const cfg = getActionConfig(act.action);
                        return (
                            <div key={act.id} className="hover:bg-muted/40 dark:hover:bg-slate-800/20 group flex items-start gap-4 px-6 py-4 transition-colors">
                                <div className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border/10 shadow-xs', cfg.color)}>
                                    {cfg.icon}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-foreground text-[12px] font-bold tracking-tight">{act.description}</p>
                                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                        {act.contract_no && (
                                            <span
                                                onClick={() => act.contract_id && router.get(`/contracts/${act.contract_id}`)}
                                                className="text-primary/80 hover:text-primary cursor-pointer font-mono text-[10px] font-bold transition-colors"
                                            >
                                                {act.contract_no}
                                            </span>
                                        )}
                                        <span className="text-muted-foreground/30 text-[10px]">·</span>
                                        <span className="text-muted-foreground/50 text-[10px] font-medium">{act.actor}</span>
                                    </div>
                                </div>
                                <span className="text-muted-foreground/40 shrink-0 text-[10px] font-semibold whitespace-nowrap">
                                    {relativeTime(act.created_at)}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
