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
        if (textColor.includes('primary')) return 'bg-white border-primary/20 text-primary';
        if (textColor.includes('amber')) return 'bg-white border-amber-500/20 text-amber-500';
        if (textColor.includes('emerald')) return 'bg-white border-emerald-500/20 text-emerald-500';
        if (textColor.includes('rose')) return 'bg-white border-rose-500/20 text-rose-500';
        if (textColor.includes('indigo')) return 'bg-white border-indigo-500/20 text-indigo-500';
        if (textColor.includes('cyan')) return 'bg-white border-cyan-500/20 text-cyan-500';
        if (textColor.includes('purple')) return 'bg-white border-purple-500/20 text-purple-500';
        if (textColor.includes('success')) return 'bg-white border-success/20 text-success';
        if (textColor.includes('warning')) return 'bg-white border-warning/20 text-warning';
        if (textColor.includes('danger')) return 'bg-white border-danger/20 text-danger';
        return 'bg-white border-surface-border/50 text-text-main';
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
                <Icon size={120} strokeWidth={1.5} className="currentColor" />
            </div>

            <div className="z-10 space-y-1.5">
                <p className="text-text-soft text-[10px] leading-none font-semibold uppercase">{label}</p>
                <p className="text-text-main text-3xl leading-none font-extrabold tracking-tight">{value}</p>
            </div>

        </div>
    );
}
