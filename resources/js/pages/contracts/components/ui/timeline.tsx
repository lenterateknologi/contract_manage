import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TimelineProps extends React.HTMLAttributes<HTMLOListElement> {}

export const Timeline = React.forwardRef<HTMLOListElement, TimelineProps>(
    ({ className, ...props }, ref) => (
        <ol
            ref={ref}
            className={cn('relative flex flex-col gap-0 border-l-2 border-surface-border/60 ml-3 pl-6 py-1', className)}
            {...props}
        />
    ),
);
Timeline.displayName = 'Timeline';

export interface TimelineItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
    status?: 'completed' | 'active' | 'rejected' | 'waiting' | 'skipped';
}

export const TimelineItem = React.forwardRef<HTMLLIElement, TimelineItemProps>(
    ({ className, status = 'waiting', ...props }, ref) => (
        <li
            ref={ref}
            className={cn('relative pb-6 last:pb-0 group/timeline-item', className)}
            {...props}
        />
    ),
);
TimelineItem.displayName = 'TimelineItem';

export interface TimelineIconProps extends React.HTMLAttributes<HTMLDivElement> {
    status?: 'completed' | 'active' | 'rejected' | 'waiting' | 'skipped';
}

export const TimelineIcon = React.forwardRef<HTMLDivElement, TimelineIconProps>(
    ({ className, status = 'waiting', children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'absolute -left-[37px] top-0 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold shadow-xs transition-all duration-200 ring-4 ring-surface-base',
                    status === 'completed' && 'bg-emerald-500 text-white dark:bg-emerald-600',
                    status === 'rejected' && 'bg-rose-500 text-white dark:bg-rose-600',
                    status === 'active' && 'bg-amber-500 text-white animate-pulse shadow-md ring-amber-500/20',
                    status === 'skipped' && 'bg-slate-300 text-slate-600 dark:bg-zinc-700 dark:text-zinc-400 opacity-60',
                    status === 'waiting' && 'bg-surface-muted text-text-soft border border-surface-border',
                    className,
                )}
                {...props}
            >
                {children}
            </div>
        );
    },
);
TimelineIcon.displayName = 'TimelineIcon';

export interface TimelineContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const TimelineContent = React.forwardRef<HTMLDivElement, TimelineContentProps>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn('flex flex-col gap-1.5 min-w-0', className)} {...props} />
    ),
);
TimelineContent.displayName = 'TimelineContent';
