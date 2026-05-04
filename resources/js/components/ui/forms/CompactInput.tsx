import * as React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/base/Label';

export interface CompactInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    containerClassName?: string;
    icon?: React.ElementType;
}

const CompactInput = React.forwardRef<HTMLInputElement, CompactInputProps>(
    ({ className, label, error, containerClassName, type, icon: Icon, ...props }, ref) => {
        return (
            <div className={cn("space-y-1.5 w-full group", containerClassName)}>
                <div className="flex items-center justify-between px-0.5">
                    <Label 
                        className={cn(
                            "text-xs font-bold uppercase tracking-widest transition-colors",
                            error ? "text-rose-500" : "text-primary/60 dark:text-white/60"
                        )}
                    >
                        {label}
                    </Label>
                    {error && (
                        <span className="text-xs font-semibold text-rose-500 uppercase animate-in fade-in slide-in-from-right-1">
                            {error}
                        </span>
                    )}
                </div>
                
                <div className="relative">
                    {Icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/10 dark:text-white/10 group-focus-within:text-primary dark:group-focus-within:text-white transition-colors">
                            <Icon size={12} strokeWidth={3} />
                        </div>
                    )}
                    <input
                        type={type}
                        className={cn(
                            "flex h-9 w-full rounded-lg border bg-white dark:bg-white/[0.02] px-3 text-sm font-medium transition-all outline-none",
                            "placeholder:text-primary/10 dark:placeholder:text-white/10",
                            Icon && "pl-9",
                            error 
                                ? "border-rose-500 text-rose-500 focus:ring-1 focus:ring-rose-500" 
                                : "border-primary/5 dark:border-white/5 text-black dark:text-white focus:border-primary/20 dark:focus:border-white/20 focus:bg-primary/[0.01] dark:focus:bg-white/[0.01] shadow-sm",
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                </div>
            </div>
        );
    }
);

CompactInput.displayName = 'CompactInput';

export { CompactInput };
