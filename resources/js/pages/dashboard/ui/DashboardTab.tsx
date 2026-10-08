import { cn } from '@/lib/utils';
import React from 'react';

interface DashboardTabProps {
    active: boolean;
    onClick: () => void;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
}

export function DashboardTab({ active, onClick, label, icon: Icon }: Readonly<DashboardTabProps>) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'group relative flex cursor-pointer items-center gap-2 rounded-lg border px-3.5 py-1.5 text-[10px] font-bold tracking-[0.1em] whitespace-nowrap uppercase transition-all duration-300 outline-none',
                active
                    ? 'bg-primary text-primary-foreground border-primary dark:border-white dark:bg-white dark:text-zinc-950'
                    : 'text-primary border-primary/50 hover:bg-primary/10 hover:border-primary bg-transparent dark:border-white dark:bg-transparent dark:text-white dark:hover:border-white dark:hover:bg-white/10',
            )}
        >
            <Icon
                size={12}
                className={cn(
                    'transition-colors',
                    active
                        ? 'text-primary-foreground dark:text-zinc-950'
                        : 'text-primary opacity-70 group-hover:opacity-100 dark:text-white dark:opacity-100',
                )}
            />
            {label}
        </button>
    );
}
