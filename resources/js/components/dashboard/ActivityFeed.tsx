import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import {
    BarChart3,
    CheckCircle2,
    FileEdit,
    FilePlus,
    FileText,
    FileX,
    History,
    Send,
    Upload,
} from 'lucide-react';
import React from 'react';
import { ActivityItem, relativeTime } from './types';
import { SectionTitle } from './SectionTitle';

const ACTION_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
    CONTRACT_CREATED:  { icon: <FilePlus className="h-3.5 w-3.5" />,    color: 'bg-blue-100 text-blue-600' },
    CONTRACT_APPROVED: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: 'bg-emerald-100 text-emerald-600' },
    APPROVAL_REJECTED: { icon: <FileX className="h-3.5 w-3.5" />,        color: 'bg-rose-100 text-rose-600' },
    CONTRACT_SENT:     { icon: <Send className="h-3.5 w-3.5" />,         color: 'bg-indigo-100 text-indigo-600' },
    FILE_UPLOADED:     { icon: <Upload className="h-3.5 w-3.5" />,       color: 'bg-slate-100 text-slate-600' },
    CONTRACT_UPDATED:  { icon: <FileEdit className="h-3.5 w-3.5" />,     color: 'bg-yellow-100 text-yellow-600' },
    form_f1_submitted: { icon: <FileText className="h-3.5 w-3.5" />,     color: 'bg-purple-100 text-purple-600' },
    form_f2_submitted: { icon: <FileText className="h-3.5 w-3.5" />,     color: 'bg-purple-100 text-purple-600' },
};

function getActionConfig(action: string) {
    return ACTION_CONFIG[action] ?? { icon: <History className="h-3.5 w-3.5" />, color: 'bg-slate-100 text-slate-500' };
}

interface ActivityFeedProps {
    items: ActivityItem[];
}

export function ActivityFeed({ items }: ActivityFeedProps) {
    return (
        <div className="rounded-2xl border border-sidebar-border/60 bg-white shadow-sm lg:col-span-5">
            <div className="flex items-center justify-between border-b border-sidebar-border/40 px-6 py-4">
                <SectionTitle>Aktivitas Terbaru</SectionTitle>
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="divide-y divide-sidebar-border/20 max-h-[340px] overflow-y-auto">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2">
                        <BarChart3 className="h-8 w-8 text-sidebar-foreground/10" />
                        <p className="text-[12px] text-sidebar-foreground/30">Belum ada aktivitas</p>
                    </div>
                ) : (
                    items.map((act) => {
                        const cfg = getActionConfig(act.action);
                        return (
                            <div
                                key={act.id}
                                className="flex items-start gap-3 px-6 py-3 hover:bg-sidebar-accent/30 transition-colors group"
                            >
                                <div className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full', cfg.color)}>
                                    {cfg.icon}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-[12px] font-semibold text-sidebar-foreground">
                                        {act.description}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                        {act.contract_no && (
                                            <span
                                                onClick={() => act.contract_id && router.get(`/contracts/${act.contract_id}`)}
                                                className="cursor-pointer text-[10px] font-bold text-sidebar-primary/70 hover:text-sidebar-primary transition-colors"
                                            >
                                                {act.contract_no}
                                            </span>
                                        )}
                                        <span className="text-[10px] text-sidebar-foreground/30">·</span>
                                        <span className="text-[10px] text-sidebar-foreground/40">{act.actor}</span>
                                    </div>
                                </div>
                                <span className="shrink-0 text-[10px] text-sidebar-foreground/30 whitespace-nowrap">
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
