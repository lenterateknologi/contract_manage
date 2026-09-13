import { ChipIcon } from '@/components/ui/feedback/ChipIcon';
import { cn, formatRelativeTime } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { BarChart3, CheckCircle2, FileEdit, FilePlus, FileText, FileX, History, Send, Upload } from 'lucide-react';
import React from 'react';
import { SectionTitle } from './SectionTitle';
import { ActivityItem } from './types';

const ACTION_CONFIG: Record<string, { icon: any; bg: string }> = {
    CONTRACT_CREATED: { icon: FilePlus, bg: 'bg-primary' },
    CONTRACT_APPROVED: { icon: CheckCircle2, bg: 'bg-emerald-600' },
    APPROVAL_REJECTED: { icon: FileX, bg: 'bg-rose-600' },
    CONTRACT_SENT: { icon: Send, bg: 'bg-primary' },
    FILE_UPLOADED: { icon: Upload, bg: 'bg-slate-700' },
    CONTRACT_UPDATED: { icon: FileEdit, bg: 'bg-amber-600' },
    form_f1_submitted: { icon: FileText, bg: 'bg-primary' },
    form_f2_submitted: { icon: FileText, bg: 'bg-primary' },
};

function getActionConfig(action: string) {
    return ACTION_CONFIG[action] ?? { icon: History, bg: 'bg-slate-700' };
}

interface ActivityFeedProps {
    items: ActivityItem[];
}

export function ActivityFeed({ items }: ActivityFeedProps) {
    return (
        <div className="bg-white dark:bg-surface-base border border-surface-border/60 rounded-lg animate-in fade-in w-full duration-300 select-none">
            <div className="border-surface-border/60 flex items-center justify-between border-b px-6 py-4">
                <SectionTitle>Aktivitas Terbaru</SectionTitle>
                <span className="bg-success flex h-2 w-2 animate-pulse rounded-full" />
            </div>
            <div className="divide-surface-border/20 max-h-[500px] divide-y overflow-y-auto">
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
                                <ChipIcon
                                    icon={cfg.icon}
                                    size="md"
                                    bg={cfg.bg}
                                    shape="circle"
                                    className="mt-0.5 border-transparent shadow-none"
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="text-text-main text-[12px] font-medium tracking-tight">{act.description}</p>
                                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                        {(act.form_no || act.contract_no) && (
                                            <span
                                                onClick={() => act.contract_id && router.get(`/contracts/${act.contract_id}`)}
                                                className="text-primary hover:text-primary/80 cursor-pointer font-mono text-[10px] font-medium transition-colors"
                                            >
                                                {act.form_no || act.contract_no}
                                            </span>
                                        )}
                                        <span className="text-text-desc/30 text-[10px]">·</span>
                                        <span className="text-text-desc/60 text-[10px] font-medium uppercase">{act.actor}</span>
                                    </div>
                                </div>
                                <span className="text-text-desc/40 shrink-0 text-[10px] font-semibold whitespace-nowrap uppercase">
                                    {formatRelativeTime(act.created_at)}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
