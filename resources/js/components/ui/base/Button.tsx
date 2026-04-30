import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95',
    {
        variants: {
            variant: {
                default: 'bg-primary dark:bg-white text-white dark:text-black font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all',
                primary: 'bg-primary dark:bg-white text-white dark:text-black font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all',
                white: 'bg-white text-black font-black uppercase tracking-widest shadow-lg hover:bg-white/90 transition-all',
                outline: 'border border-black/20 dark:border-white/20 bg-transparent text-black dark:text-white font-black uppercase tracking-widest hover:bg-black/5 dark:hover:bg-white/10',
                destructive: 'bg-red-500 text-white font-black uppercase tracking-widest hover:bg-red-600 shadow-lg shadow-red-500/20',
                secondary: 'bg-primary/5 dark:bg-white/5 text-primary dark:text-white border border-primary/10 dark:border-white/10 font-black uppercase tracking-widest hover:bg-primary/10 dark:hover:bg-white/10',
                ghost: 'font-black uppercase tracking-widest hover:bg-black/[0.05] dark:hover:bg-white/[0.05] text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white',
                link: 'text-primary underline-offset-4 hover:underline',
            },
            size: {
                default: 'h-10 px-6 py-2 text-[11px]',
                sm: 'h-9 rounded-lg px-4 text-[10px]',
                lg: 'h-12 rounded-lg px-10 text-[12px]',
                icon: 'h-10 w-10',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = 'Button';

export { Button, buttonVariants };
