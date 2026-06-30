import * as React from 'react';
import { cn } from '@/lib/utils';
import { FolderSearch } from 'lucide-react';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    action?: React.ReactNode;
}

export function EmptyState({
    title,
    description,
    icon,
    action,
    className,
    ...props
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-base p-12 text-center animate-in fade-in-50',
                className
            )}
            {...props}
        >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted text-muted-foreground mb-4">
                {icon || <FolderSearch className="h-8 w-8 opacity-60" />}
            </div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            {description && (
                <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                    {description}
                </p>
            )}
            {action && <div className="mt-6">{action}</div>}
        </div>
    );
}
