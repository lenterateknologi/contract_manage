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
    const getCardBgColor = (textColor: string) => {
        if (textColor.includes('primary')) return 'bg-primary/80 text-white border-primary/20';
        if (textColor.includes('amber')) return 'bg-amber-500/80 text-white border-amber-500/20';
        if (textColor.includes('emerald')) return 'bg-emerald-500/80 text-white border-emerald-500/20';
        if (textColor.includes('rose')) return 'bg-rose-500/80 text-white border-rose-500/20';
        if (textColor.includes('indigo')) return 'bg-indigo-500/80 text-white border-indigo-500/20';
        if (textColor.includes('cyan')) return 'bg-cyan-500/80 text-white border-cyan-500/20';
        if (textColor.includes('purple')) return 'bg-purple-500/80 text-white border-purple-500/20';
        if (textColor.includes('success')) return 'bg-success/80 text-white border-success/20';
        if (textColor.includes('warning')) return 'bg-warning/80 text-white border-warning/20';
        if (textColor.includes('danger')) return 'bg-danger/80 text-white border-danger/20';
        return 'bg-surface-muted/80 text-white border-surface-border/50';
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
                'group relative flex min-h-[110px] items-center justify-between overflow-hidden rounded-lg border p-6 transition-all duration-500',
                getCardBgColor(color),
                onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-md' : 'cursor-default',
            )}
        >
            {/* Large Background Icon */}
            <div className="pointer-events-none absolute -right-6 -bottom-6 opacity-10 transition-transform duration-500 group-hover:scale-110 group-hover:opacity-20">
                <Icon size={120} strokeWidth={1.5} />
            </div>

            <div className="z-10 space-y-1.5">
                <p className="text-[10px] leading-none font-semibold uppercase opacity-80">{label}</p>
                <p className="text-3xl leading-none font-extrabold tracking-tight">{value}</p>
            </div>

        </div>
    );
}
