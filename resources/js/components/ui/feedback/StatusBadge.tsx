import React from 'react';
import { cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';
import LucideIcons from '@/lib/lucide-dynamic';

export interface StatusInfo {
    label?: string;
    color?: string;
    bg_color?: string;
    icon?: string | null;
}

export interface StatusBadgeProps {
    status: string;
    statusInfo?: StatusInfo | null;
    className?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    showIcon?: boolean;
}

export const StatusBadge = ({
    status,
    statusInfo,
    className,
    size = 'md',
    showIcon = true,
}: StatusBadgeProps) => {
    const pageProps = usePage<any>()?.props;
    const masterStatuses = pageProps?.masterContractStatuses || [];
    const masterObj = masterStatuses.find((m: any) => m.code?.toLowerCase() === (status || '').toLowerCase());

    const label = statusInfo?.label || masterObj?.label || (status || '').toUpperCase();
    const resolvedColor = statusInfo?.color || masterObj?.color || '#64748b';
    const iconName = statusInfo?.icon || masterObj?.icon;

    const IconComp = showIcon && iconName && (LucideIcons as any)[iconName]
        ? (LucideIcons as any)[iconName]
        : null;

    const sizeClasses = {
        xs: 'px-1.5 py-0.2 text-[8.5px] gap-1',
        sm: 'px-2 py-0.5 text-[9px] gap-1',
        md: 'px-2.5 py-0.5 text-[10px] gap-1.5',
        lg: 'px-3 py-1 text-xs gap-1.5',
    }[size] || 'px-2.5 py-0.5 text-[10px] gap-1.5';

    const iconSize = {
        xs: 9,
        sm: 10,
        md: 11,
        lg: 13,
    }[size] || 11;

    const style: React.CSSProperties = React.useMemo(() => ({
        '--status-color': resolvedColor,
    } as React.CSSProperties), [resolvedColor]);

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full font-semibold tracking-tight uppercase whitespace-nowrap shadow-xs border transition-colors',
                'bg-[color-mix(in_srgb,var(--status-color)_12%,transparent)]',
                'dark:bg-[color-mix(in_srgb,var(--status-color)_18%,#18181b)]',
                'border-[color-mix(in_srgb,var(--status-color)_24%,transparent)]',
                'dark:border-[color-mix(in_srgb,var(--status-color)_32%,transparent)]',
                'text-[var(--status-color)]',
                'dark:text-[color-mix(in_srgb,var(--status-color)_85%,#ffffff)]',
                sizeClasses,
                className,
            )}
            style={style}
        >
            {IconComp ? (
                <IconComp size={iconSize} className="shrink-0" />
            ) : (
                <span className="h-1.5 w-1.5 rounded-full shrink-0 bg-current opacity-80" />
            )}
            <span>{label}</span>
        </span>
    );
};

export default StatusBadge;
