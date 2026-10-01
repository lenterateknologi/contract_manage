import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const inputVariants = cva(
    'flex w-full transition-all focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:bg-slate-100/70 dark:disabled:bg-zinc-900/80 disabled:border-slate-200 dark:disabled:border-zinc-800 disabled:text-slate-500 dark:disabled:text-zinc-400 disabled:shadow-none read-only:cursor-default read-only:bg-slate-50/70 dark:read-only:bg-zinc-900/50 read-only:text-slate-700 dark:read-only:text-zinc-300',
    {
        variants: {
            variant: {
                outline: 'border border-border bg-surface-base text-foreground font-normal text-sm placeholder:text-muted-foreground placeholder:font-normal',
                filled: 'border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-card focus:bg-white dark:focus:bg-slate-900 text-foreground font-normal text-sm placeholder:text-muted-foreground',
            },
            size: {
                default: 'h-10 px-3.5 py-2 text-sm rounded-lg',
                sm: 'h-9 px-3 text-xs rounded-lg',
            },
        },
        defaultVariants: {
            variant: 'outline',
            size: 'default',
        },
    }
);

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>, VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, variant, size, ...props }, ref) => {
    return (
        <input
            type={type}
            className={cn(inputVariants({ variant, size, className }))}
            ref={ref}
            {...props}
        />
    );
});

Input.displayName = 'Input';

export { Input, inputVariants };
