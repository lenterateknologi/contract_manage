import React from 'react';
import { cn } from '@/lib/utils';

export interface StatusBadgeProps {
    status: string;
    statusInfo?: {
        label?: string;
        color?: string;
        bg_color?: string;
    } | null;
}

const config: Record<string, { bg: string; dot: string; text: string; label: string }> = {
    draft: { bg: 'bg-slate-100 dark:bg-slate-800', dot: 'bg-slate-400', text: 'text-slate-700 dark:text-slate-300', label: 'Draft' },
    queue: { bg: 'bg-slate-100 dark:bg-slate-800', dot: 'bg-slate-400', text: 'text-slate-700 dark:text-slate-300', label: 'Antrian' },
    in_review: { bg: 'bg-amber-50 dark:bg-amber-950/30', dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400', label: 'Review' },
    revision: { bg: 'bg-rose-50 dark:bg-rose-950/30', dot: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-400', label: 'Revisi' },
    pending: { bg: 'bg-amber-50 dark:bg-amber-950/30', dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400', label: 'Pending' },
    approved: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', label: 'Disetujui' },
    active: { bg: 'bg-indigo-50 dark:bg-indigo-950/30', dot: 'bg-indigo-500', text: 'text-indigo-700 dark:text-indigo-400', label: 'Aktif' },
    expired: { bg: 'bg-rose-50 dark:bg-rose-950/30', dot: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-400', label: 'Expired' },
    archived: { bg: 'bg-slate-100 dark:bg-slate-800', dot: 'bg-slate-400', text: 'text-slate-600 dark:text-slate-400', label: 'Arsip' },
    rejected: { bg: 'bg-rose-50 dark:bg-rose-950/30', dot: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-400', label: 'Ditolak' },
};

const fallback = { bg: 'bg-slate-100 dark:bg-slate-800', dot: 'bg-slate-400', text: 'text-slate-700 dark:text-slate-300', label: 'Unknown' };

export const StatusBadge = ({ status, statusInfo }: StatusBadgeProps) => {
    const s = config[status?.toLowerCase() as keyof typeof config] || fallback;

    const label = statusInfo?.label || s.label;
    const color = statusInfo?.color;
    const bgColor = statusInfo?.bg_color;

    // Check if bgColor is a light color (like #ffffff or #fff)
    const isLightBg = (bg?: string) => {
        if (!bg) return false;
        const clean = bg.replace('#', '').trim().toLowerCase();
        if (clean === 'fff' || clean === 'ffffff' || clean === 'white') return true;
        if (clean.length === 6) {
            const r = parseInt(clean.substring(0, 2), 16);
            const g = parseInt(clean.substring(2, 4), 16);
            const b = parseInt(clean.substring(4, 6), 16);
            return (r * 299 + g * 587 + b * 114) / 1000 > 200;
        }
        return false;
    };

    const hasCustomColors = !!(color || bgColor);
    const lightBg = isLightBg(bgColor);

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-tight uppercase',
                !hasCustomColors && s.bg,
                !hasCustomColors && s.text,
                hasCustomColors && lightBg && 'dark:!bg-slate-800 dark:!text-slate-200',
            )}
            style={hasCustomColors ? {
                backgroundColor: bgColor || undefined,
                color: color || undefined,
            } : undefined}
        >
            <span 
                className={cn('h-1.5 w-1.5 rounded-full', !color && s.dot)} 
                style={color ? { backgroundColor: color } : undefined}
            />
            {label}
        </span>
    );
};

export default StatusBadge;
