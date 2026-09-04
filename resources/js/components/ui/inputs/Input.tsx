import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const inputVariants = cva(
    'flex w-full transition-all focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50 disabled:border-slate-200 disabled:shadow-none disabled:text-slate-500',
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
