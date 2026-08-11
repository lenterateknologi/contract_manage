import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

/* ponytail: solid filled button themes for dark mode instead of forced outline */
const buttonThemes = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary-hover dark:bg-white dark:text-black dark:hover:bg-zinc-200 dark:border-none',
    outline: 'border border-border bg-transparent text-foreground hover:bg-muted dark:bg-transparent dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800',
    ghost: 'hover:bg-surface-muted text-text-main dark:text-zinc-300 dark:hover:bg-zinc-800/80',
    link: 'text-primary underline-offset-4 hover:underline lowercase dark:text-white',
    destructive: 'bg-danger text-danger-foreground hover:bg-danger/90 dark:bg-rose-600 dark:text-white dark:hover:bg-rose-500 dark:border-none',
    secondary: 'bg-secondary text-secondary-foreground border border-surface-border hover:bg-secondary/80 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-700',
    white: 'bg-surface-base/80 backdrop-blur-md border border-surface-border text-text-main hover:bg-surface-muted hover:border-surface-border dark:bg-zinc-900/90 dark:border-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-800',
};

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-sans font-medium tracking-tight cursor-pointer ring-offset-background transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0 active:scale-95 select-none',
    {
        variants: {
            variant: {
                default: buttonThemes.primary,
                primary: buttonThemes.primary,
                white: buttonThemes.white,
                outline: buttonThemes.outline,
                destructive: buttonThemes.destructive,
                secondary: buttonThemes.secondary,
                ghost: buttonThemes.ghost,
                link: buttonThemes.link,
            },
            size: {
                default: 'h-10 px-5 py-2 text-xs',
                sm: 'h-8 px-4 text-[10px]',
                lg: 'h-12 px-8 text-sm',
                icon: 'h-10 w-10 text-xs',
            },
            fontSize: {
                default: '',
                '10px': 'text-[10px]',
                '11px': 'text-[11px]',
                '12px': 'text-[12px]',
                xs: 'text-xs',
                sm: 'text-sm',
                base: 'text-base',
                lg: 'text-lg',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
            fontSize: 'default',
        },
    },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, fontSize, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, fontSize, className }))} ref={ref} {...props} />;
});
Button.displayName = 'Button';

export { Button, buttonVariants };
