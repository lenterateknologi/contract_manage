import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TimelineProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Timeline = React.forwardRef<HTMLDivElement, TimelineProps>(
    ({ className, children, ...props }, ref) => (
        <div ref={ref} className={cn('relative', className)} {...props}>
            <div className="absolute top-3 bottom-3 left-[11px] w-px bg-border/60" />
            <div className="flex flex-col gap-3">
                {children}
            </div>
        </div>
    ),
);
Timeline.displayName = 'Timeline';

export interface TimelineItemProps extends React.HTMLAttributes<HTMLDivElement> {
    status?: 'completed' | 'active' | 'rejected' | 'waiting' | 'skipped';
}

export const TimelineItem = React.forwardRef<HTMLDivElement, TimelineItemProps>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn('relative flex gap-3 group/timeline-item', className)}
            {...props}
        />
    ),
);
TimelineItem.displayName = 'TimelineItem';

export interface TimelineIconProps extends React.HTMLAttributes<HTMLDivElement> {
    status?: 'completed' | 'active' | 'rejected' | 'waiting' | 'skipped';
}

function getTimelineStatusClass(status: string, hasCustomBg: boolean): string {
    if (hasCustomBg) {
        return status === 'active' ? 'text-white animate-pulse shadow-xs' : '';
    }

    switch (status) {
        case 'completed':
            return 'bg-emerald-500 text-white dark:bg-emerald-600';
        case 'rejected':
            return 'bg-rose-500 text-white dark:bg-rose-600';
        case 'active':
            return 'bg-primary text-primary-foreground animate-pulse shadow-xs';
        case 'skipped':
            return 'bg-muted text-muted-foreground opacity-60';
        case 'waiting':
        default:
            return 'bg-muted text-muted-foreground';
    }
}

export const TimelineIcon = React.forwardRef<HTMLDivElement, TimelineIconProps>(
    ({ className, status = 'waiting', children, style, ...props }, ref) => {
        return (
            <div
                className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border/80 shadow-2xs"
            >
                <div
                    ref={ref}
                    style={style}
                    className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-200',
                        getTimelineStatusClass(status, Boolean(style?.backgroundColor)),
                        className,
                    )}
                    {...props}
                >
                    {children}
                </div>
            </div>
        );
    },
);
TimelineIcon.displayName = 'TimelineIcon';

export interface TimelineContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const TimelineContent = React.forwardRef<HTMLDivElement, TimelineContentProps>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                'flex min-w-0 flex-1 flex-col',
                className,
            )}
            {...props}
        />
    ),
);
TimelineContent.displayName = 'TimelineContent';
