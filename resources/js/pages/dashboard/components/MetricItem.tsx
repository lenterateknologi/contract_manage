import { cn } from '@/lib/utils';

interface MetricItemProps {
    label: string;
    value: string | number;
    icon: any;
    color: string;
    onClick?: () => void;
    isAlert?: boolean;
    children?: React.ReactNode;
}

export function MetricItem({ label, value, icon: Icon, color, onClick, isAlert, children }: MetricItemProps) {
    const getCardBgColor = (textColor: string) => {
        if (textColor.includes('primary')) return 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-200/80 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100/90 dark:hover:bg-blue-950/60';
        if (textColor.includes('amber')) return 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-900/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100/90 dark:hover:bg-amber-950/60';
        if (textColor.includes('emerald')) return 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/90 dark:hover:bg-emerald-950/60';
        if (textColor.includes('rose')) return 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100/90 dark:hover:bg-rose-950/60';
        if (textColor.includes('indigo')) return 'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-200/80 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/90 dark:hover:bg-indigo-950/60';
        if (textColor.includes('cyan')) return 'bg-cyan-50/90 dark:bg-cyan-950/40 border-cyan-200/80 dark:border-cyan-900/60 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100/90 dark:hover:bg-cyan-950/60';
        if (textColor.includes('purple')) return 'bg-purple-50/90 dark:bg-purple-950/40 border-purple-200/80 dark:border-purple-900/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100/90 dark:hover:bg-purple-950/60';
        if (textColor.includes('success')) return 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/90 dark:hover:bg-emerald-950/60';
        if (textColor.includes('warning')) return 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-900/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100/90 dark:hover:bg-amber-950/60';
        if (textColor.includes('danger')) return 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100/90 dark:hover:bg-rose-950/60';
        return 'bg-slate-50/90 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300';
    };

    const getHoverBorderColor = (textColor: string) => {
        if (textColor.includes('primary')) return 'hover:border-primary/40';
        if (textColor.includes('amber')) return 'hover:border-amber-500/40';
        if (textColor.includes('emerald')) return 'hover:border-emerald-500/40';
        if (textColor.includes('rose')) return 'hover:border-rose-500/40';
        if (textColor.includes('success')) return 'hover:border-success/40';
        if (textColor.includes('warning')) return 'hover:border-warning/40';
        if (textColor.includes('danger')) return 'hover:border-danger/40';
        return 'hover:border-surface-border';
    };

    const getGradientGlow = (textColor: string) => {
        if (textColor.includes('primary')) return 'from-primary to-transparent';
        if (textColor.includes('amber')) return 'from-amber-500 to-transparent';
        if (textColor.includes('emerald')) return 'from-emerald-500 to-transparent';
        if (textColor.includes('rose')) return 'from-rose-500 to-transparent';
        if (textColor.includes('success')) return 'from-success to-transparent';
        if (textColor.includes('warning')) return 'from-warning to-transparent';
        if (textColor.includes('danger')) return 'from-danger to-transparent';
        return 'from-gray-500 to-transparent';
    };

    const getBarColor = (textColor: string) => {
        if (textColor.includes('primary')) return 'bg-primary';
        if (textColor.includes('amber')) return 'bg-amber-500';
        if (textColor.includes('emerald')) return 'bg-emerald-500';
        if (textColor.includes('rose')) return 'bg-rose-500';
        if (textColor.includes('success')) return 'bg-success';
        if (textColor.includes('warning')) return 'bg-warning';
        if (textColor.includes('danger')) return 'bg-danger';
        return 'bg-surface-border';
    };

    return (
        <div
            onClick={onClick}
            className={cn(
                'group relative flex min-h-[80px] items-center justify-between overflow-hidden rounded-lg border p-4 transition-all duration-500',
                getCardBgColor(color),
                onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-md' : 'cursor-default',
            )}
        >
            {/* Large Background Icon */}
            <div className="pointer-events-none absolute -right-4 -bottom-4 opacity-10 transition-transform duration-500 group-hover:scale-110 group-hover:opacity-20">
                <Icon size={80} strokeWidth={1.5} className="currentColor" />
            </div>
 
            <div className="z-10 space-y-1 w-full">
                <p className="text-text-soft text-[9px] leading-none font-bold tracking-wider uppercase">{label}</p>
                <p className="text-text-main text-2xl leading-none font-extrabold tracking-tight mt-1">{value}</p>
                {children && <div className="mt-2.5 pt-2.5 border-t border-surface-border/50">{children}</div>}
            </div>
 
        </div>
    );
}
