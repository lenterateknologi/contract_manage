import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-sans font-semibold ring-offset-background transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95',
    {
        variants: {
            variant: {
                default:     'bg-sidebar-primary text-white uppercase tracking-widest shadow-md shadow-sidebar-primary/20 hover:opacity-90',
                primary:     'bg-sidebar-primary text-white uppercase tracking-widest shadow-md shadow-sidebar-primary/20 hover:opacity-90',
                white:       'bg-white text-sidebar-foreground uppercase tracking-widest shadow-md hover:bg-white/90',
                outline:     'border border-sidebar-border bg-transparent text-sidebar-foreground uppercase tracking-widest hover:bg-sidebar-accent',
                destructive: 'bg-rose-500 text-white uppercase tracking-widest hover:bg-rose-600 shadow-md shadow-rose-500/20',
                secondary:   'bg-sidebar-accent text-sidebar-foreground border border-sidebar-border uppercase tracking-widest hover:bg-sidebar-accent/80',
                ghost:       'uppercase tracking-widest hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-foreground',
                link:        'text-sidebar-primary underline-offset-4 hover:underline',
            },
            size: {
                default: 'h-9 px-5 py-2 text-[11px]',
                sm:      'h-8 rounded-lg px-3.5 text-[10px]',
                lg:      'h-11 rounded-lg px-8 text-[12px]',
                icon:    'h-9 w-9',
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
