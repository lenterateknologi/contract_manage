import { cn } from '@/lib/utils';

interface MetricItemProps {
    label: string;
    value: string | number;
    icon: any;
    color: string;
    onClick?: () => void;
    isAlert?: boolean;
}

export function MetricItem({ label, value, icon: Icon, color, onClick, isAlert }: MetricItemProps) {
    const getBgColor = (textColor: string) => {
        if (textColor.includes('primary')) return 'bg-primary/10';
        if (textColor.includes('amber')) return 'bg-amber-500/10';
        if (textColor.includes('emerald')) return 'bg-emerald-500/10';
        if (textColor.includes('rose')) return 'bg-rose-500/10';
        if (textColor.includes('success')) return 'bg-success/10';
        if (textColor.includes('warning')) return 'bg-warning/10';
        if (textColor.includes('danger')) return 'bg-danger/10';
        return 'bg-surface-muted/50';
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
                'group dark:bg-surface-base border-surface-border/60 relative flex min-h-[110px] items-center justify-between overflow-hidden rounded-2xl border bg-white p-6 pl-8 shadow-sm transition-all duration-500',
                onClick ? cn('cursor-pointer hover:-translate-y-0.5 hover:shadow-xl', getHoverBorderColor(color)) : 'cursor-default',
                isAlert && 'hover:border-rose-500/40',
            )}
        >
            {/* Background decorative glow */}
            <div
                className={cn(
                    'pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-[0.03] dark:group-hover:opacity-[0.05]',
                    getGradientGlow(color),
                )}
            />

            <div className="z-10 space-y-1.5 pr-4">
                <p className="text-text-soft text-[10px] leading-none font-semibold  uppercase">{label}</p>
                <p className="text-text-main text-3xl leading-none font-extrabold tracking-tight">{value}</p>
            </div>

            <div
                className={cn(
                    'z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm transition-all duration-500 group-hover:scale-110',
                    getBgColor(color),
                    color,
                )}
            >
                <Icon size={20} strokeWidth={2.2} className={cn(isAlert && 'animate-pulse')} />
            </div>

            {/* Left accent bar */}
            <div
                className={cn(
                    'absolute top-0 bottom-0 left-0 w-1 opacity-60 transition-all duration-500 group-hover:opacity-100',
                    getBarColor(color),
                )}
            />
        </div>
    );
}
