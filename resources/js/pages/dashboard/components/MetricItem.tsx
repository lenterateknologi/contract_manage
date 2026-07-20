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
        if (textColor.includes('primary')) return 'bg-blue-600 dark:bg-blue-800 text-white hover:bg-blue-700 dark:hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20';
        if (textColor.includes('amber')) return 'bg-amber-500 dark:bg-amber-700 text-white hover:bg-amber-600 dark:hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/20';
        if (textColor.includes('emerald')) return 'bg-emerald-600 dark:bg-emerald-800 text-white hover:bg-emerald-700 dark:hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/20';
        if (textColor.includes('rose')) return 'bg-rose-600 dark:bg-rose-800 text-white hover:bg-rose-700 dark:hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-500/20';
        if (textColor.includes('indigo')) return 'bg-indigo-600 dark:bg-indigo-800 text-white hover:bg-indigo-700 dark:hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/20';
        if (textColor.includes('cyan')) return 'bg-cyan-600 dark:bg-cyan-800 text-white hover:bg-cyan-700 dark:hover:bg-cyan-700 hover:shadow-lg hover:shadow-cyan-500/20';
        if (textColor.includes('purple')) return 'bg-purple-600 dark:bg-purple-800 text-white hover:bg-purple-700 dark:hover:bg-purple-700 hover:shadow-lg hover:shadow-purple-500/20';
        if (textColor.includes('success')) return 'bg-emerald-600 dark:bg-emerald-800 text-white hover:bg-emerald-700 dark:hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/20';
        if (textColor.includes('warning')) return 'bg-amber-500 dark:bg-amber-700 text-white hover:bg-amber-600 dark:hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/20';
        if (textColor.includes('danger')) return 'bg-rose-600 dark:bg-rose-800 text-white hover:bg-rose-700 dark:hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-500/20';
        return 'bg-slate-600 dark:bg-slate-800 text-white hover:bg-slate-700 dark:hover:bg-slate-700';
    };

    return (
        <div
            onClick={onClick}
            className={cn(
                'group relative flex min-h-[80px] items-center justify-between overflow-hidden rounded-xl p-4 transition-all duration-300 shadow-sm border-none',
                getCardBgColor(color),
                onClick ? 'cursor-pointer hover:-translate-y-1' : 'cursor-default',
            )}
        >
            {/* Large Background Icon */}
            <div className="pointer-events-none absolute -right-2 -bottom-2 text-white opacity-[0.12] transition-all duration-300 group-hover:scale-110 group-hover:opacity-20">
                <Icon size={72} strokeWidth={1.5} className="currentColor" />
            </div>
 
            <div className="z-10 space-y-1 w-full">
                <p className="text-white/80 text-[9px] leading-none font-bold tracking-widest uppercase">{label}</p>
                <p className="text-white text-2xl leading-none font-extrabold tracking-tight mt-1">{value}</p>
                {children && <div className="mt-2.5 pt-2.5 border-t border-white/20 text-white/90">{children}</div>}
            </div>
 
        </div>
    );
}
