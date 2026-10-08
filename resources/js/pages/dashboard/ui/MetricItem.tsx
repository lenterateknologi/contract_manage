import { cn } from '@/lib/utils';
import React from 'react';

interface MetricItemProps {
    label: string;
    value: string | number;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    color: string;
    onClick?: () => void;
    children?: React.ReactNode;
}

export function MetricItem({ label, value, icon: Icon, color, onClick, children }: Readonly<MetricItemProps>) {
    const getCardBgColor = (textColor: string) => {
        if (textColor.includes('primary'))
            return 'bg-blue-600 dark:bg-blue-800 text-white hover:bg-blue-700 dark:hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20';
        if (textColor.includes('amber'))
            return 'bg-amber-500 dark:bg-amber-700 text-white hover:bg-amber-600 dark:hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/20';
        if (textColor.includes('emerald'))
            return 'bg-emerald-600 dark:bg-emerald-800 text-white hover:bg-emerald-700 dark:hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/20';
        if (textColor.includes('rose'))
            return 'bg-rose-600 dark:bg-rose-800 text-white hover:bg-rose-700 dark:hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-500/20';
        if (textColor.includes('indigo'))
            return 'bg-indigo-600 dark:bg-indigo-800 text-white hover:bg-indigo-700 dark:hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/20';
        if (textColor.includes('cyan'))
            return 'bg-cyan-600 dark:bg-cyan-800 text-white hover:bg-cyan-700 dark:hover:bg-cyan-700 hover:shadow-lg hover:shadow-cyan-500/20';
        if (textColor.includes('purple'))
            return 'bg-purple-600 dark:bg-purple-800 text-white hover:bg-purple-700 dark:hover:bg-purple-700 hover:shadow-lg hover:shadow-purple-500/20';
        if (textColor.includes('success'))
            return 'bg-emerald-600 dark:bg-emerald-800 text-white hover:bg-emerald-700 dark:hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/20';
        if (textColor.includes('warning'))
            return 'bg-amber-500 dark:bg-amber-700 text-white hover:bg-amber-600 dark:hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/20';
        if (textColor.includes('danger'))
            return 'bg-rose-600 dark:bg-rose-800 text-white hover:bg-rose-700 dark:hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-500/20';
        return 'bg-slate-600 dark:bg-slate-800 text-white hover:bg-slate-700 dark:hover:bg-slate-700';
    };

    return (
        <div
            onClick={onClick}
            className={cn(
                'group relative flex min-w-0 flex-1 flex-col justify-between overflow-hidden rounded-xl p-3.5 shadow-sm transition-all duration-300',
                onClick ? 'cursor-pointer active:scale-95' : 'cursor-default',
                getCardBgColor(color),
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[11px] font-bold tracking-wider text-white/80 uppercase select-none">{label}</span>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white backdrop-blur-md transition-transform duration-300 group-hover:scale-110">
                    <Icon size={14} className="stroke-[2.5]" />
                </div>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-black tracking-tight text-white">{value}</span>
                {children}
            </div>
        </div>
    );
}
