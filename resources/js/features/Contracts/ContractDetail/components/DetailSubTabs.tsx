import { cn } from '@/lib/utils';
import { type DetailSidebarTabChild } from '@/stores/useDetailSidebarStore';
import React from 'react';

interface DetailSubTabsProps {
    childrenTabs: DetailSidebarTabChild[];
    activeSubId?: string;
    onSubTabChange: (subId: string) => void;
}

export function DetailSubTabs({
    childrenTabs,
    activeSubId,
    onSubTabChange,
}: DetailSubTabsProps) {
    if (!childrenTabs || childrenTabs.length <= 1) {
        return null;
    }

    return (
        <div className="border-surface-border bg-surface-muted/30 flex shrink-0 items-center justify-between gap-2 border-b px-4 py-2">
            <div className="flex items-center gap-1 overflow-x-auto">
                {childrenTabs.map((child) => {
                    const isActive = activeSubId === child.id;
                    const ChildIcon = child.icon;
                    return (
                        <button
                            key={child.id}
                            type="button"
                            onClick={() => onSubTabChange(child.id)}
                            className={cn(
                                'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all',
                                isActive
                                    ? 'bg-surface-base text-primary border-surface-border border font-bold shadow-xs'
                                    : 'text-text-desc hover:text-text-main hover:bg-surface-muted/60',
                            )}
                        >
                            {ChildIcon && (
                                <ChildIcon
                                    size={14}
                                    className={isActive ? 'text-primary shrink-0' : 'text-text-desc shrink-0'}
                                />
                            )}
                            <span>{child.label}</span>
                            {child.badge && (
                                <span
                                    className={cn(
                                        'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                                        child.badgeVariant === 'success' || child.isReviewed
                                            ? 'bg-emerald-500/15 font-bold text-emerald-600 dark:text-emerald-400'
                                            : child.badgeVariant === 'warning'
                                              ? 'bg-amber-500/15 font-bold text-amber-600 dark:text-amber-400'
                                              : 'bg-surface-muted text-text-desc',
                                    )}
                                >
                                    {child.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default DetailSubTabs;
