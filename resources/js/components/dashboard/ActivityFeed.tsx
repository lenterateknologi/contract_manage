import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { BarChart3, CheckCircle2, FileEdit, FilePlus, FileText, FileX, History, Send, Upload } from 'lucide-react';
import React from 'react';
import { SectionTitle } from './SectionTitle';
import { ActivityItem, relativeTime } from './types';

const ACTION_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
    CONTRACT_CREATED: { icon: <FilePlus className="h-3.5 w-3.5" />, color: 'bg-primary/10 text-primary' },
    CONTRACT_APPROVED: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: 'bg-success/10 text-success' },
    APPROVAL_REJECTED: { icon: <FileX className="h-3.5 w-3.5" />, color: 'bg-danger/10 text-danger' },
    CONTRACT_SENT: { icon: <Send className="h-3.5 w-3.5" />, color: 'bg-primary/10 text-primary' },
    FILE_UPLOADED: { icon: <Upload className="h-3.5 w-3.5" />, color: 'bg-surface-muted text-text-main' },
    CONTRACT_UPDATED: { icon: <FileEdit className="h-3.5 w-3.5" />, color: 'bg-warning/10 text-warning' },
    form_f1_submitted: { icon: <FileText className="h-3.5 w-3.5" />, color: 'bg-primary/10 text-primary' },
    form_f2_submitted: { icon: <FileText className="h-3.5 w-3.5" />, color: 'bg-primary/10 text-primary' },
};

function getActionConfig(action: string) {
    return ACTION_CONFIG[action] ?? { icon: <History className="h-3.5 w-3.5" />, color: 'bg-surface-muted text-text-desc' };
}

interface ActivityFeedProps {
    items: ActivityItem[];
}

export function ActivityFeed({ items }: ActivityFeedProps) {
    return (
        <div className="border-surface-border/60 bg-surface-base/40 text-text-main rounded-2xl border shadow-sm backdrop-blur-sm w-full select-none animate-in fade-in duration-300">
            <div className="border-surface-border/60 flex items-center justify-between border-b px-6 py-4">
                <SectionTitle>Aktivitas Terbaru</SectionTitle>
                <span className="flex h-2 w-2 animate-pulse rounded-full bg-success" />
            </div>
            <div className="divide-y divide-surface-border/20 max-h-[500px] overflow-y-auto">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-12">
                        <BarChart3 className="text-text-desc/20 h-8 w-8" />
                        <p className="text-text-desc/40 text-[12px] font-semibold uppercase">Belum ada aktivitas</p>
                    </div>
                ) : (
                    items.map((act) => {
                        const cfg = getActionConfig(act.action);
                        return (
                            <div key={act.id} className="hover:bg-surface-muted/40 group flex items-start gap-4 px-6 py-4 transition-colors">
                                <div className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-surface-border/10 shadow-xs', cfg.color)}>
                                    {cfg.icon}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-text-main text-[12px] font-bold tracking-tight">{act.description}</p>
                                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                        {act.contract_no && (
                                            <span
                                                onClick={() => act.contract_id && router.get(`/contracts/${act.contract_id}`)}
                                                className="text-primary hover:text-primary/80 cursor-pointer font-mono text-[10px] font-bold transition-colors"
                                            >
                                                {act.contract_no}
                                            </span>
                                        )}
                                        <span className="text-text-desc/30 text-[10px]">·</span>
                                        <span className="text-text-desc/60 text-[10px] font-bold uppercase">{act.actor}</span>
                                    </div>
                                </div>
                                <span className="text-text-desc/40 shrink-0 text-[10px] font-black uppercase whitespace-nowrap">
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
