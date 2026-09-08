import React from 'react';
import { cn, getStatusConfig, isLightColor, type StatusInfo } from '@/lib/utils';
import LucideIcons from '@/lib/lucide-dynamic';

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
    const s = getStatusConfig(status, statusInfo);

    const label = statusInfo?.label || s.label;
    const color = statusInfo?.color;
    const bgColor = statusInfo?.bg_color;
    const iconName = statusInfo?.icon || s.icon;

    const hasCustomColors = Boolean(color || bgColor);
    const lightBg = isLightColor(bgColor);

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

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full font-semibold tracking-tight uppercase whitespace-nowrap shadow-xs border',
                sizeClasses,
                !hasCustomColors && s.bg,
                !hasCustomColors && s.text,
                !hasCustomColors && (s.border || 'border-transparent'),
                hasCustomColors && lightBg && 'dark:!bg-slate-800 dark:!text-slate-200',
                className,
            )}
            style={
                hasCustomColors
                    ? {
                          backgroundColor: bgColor || undefined,
                          color: color || undefined,
                          borderColor: color ? `${color}30` : undefined,
                      }
                    : undefined
            }
        >
            {IconComp ? (
                <IconComp size={iconSize} className="shrink-0" />
            ) : (
                <span
                    className={cn('h-1.5 w-1.5 rounded-full shrink-0', !color && s.dot)}
                    style={color ? { backgroundColor: color } : undefined}
                />
            )}
            <span>{label}</span>
        </span>
    );
};

export default StatusBadge;
