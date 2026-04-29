import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                default: 'bg-[var(--primary)] text-[var(--white)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)] shadow-[var(--shadow-sm)]',
                destructive: 'bg-[var(--danger)] text-[var(--white)] hover:bg-red-700 active:bg-red-800',
                outline: 'border border-[var(--border)] bg-transparent text-[var(--text-dark)] hover:bg-[var(--secondary)] hover:text-[var(--primary)]',
                secondary: 'bg-[var(--secondary)] text-[var(--text-dark)] border border-[var(--border)] hover:bg-gray-200 active:bg-gray-300',
                ghost: 'hover:bg-[var(--secondary)] hover:text-[var(--primary)]',
                link: 'text-[var(--primary)] underline-offset-4 hover:underline',
            },
            size: {
                default: 'h-10 px-4 py-2',
                sm: 'h-9 rounded-md px-3',
                lg: 'h-11 rounded-md px-8',
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
