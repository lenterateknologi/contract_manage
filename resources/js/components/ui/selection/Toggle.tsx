'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

const toggleVariants = cva(
    'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 gap-2 cursor-pointer',
    {
        variants: {
            variant: {
                default: 'bg-transparent',
                outline: 'border border-input bg-transparent hover:bg-accent hover:text-accent-foreground',
            },
            size: {
                default: 'h-10 px-3 min-w-10',
                sm: 'h-9 px-2.5 min-w-9',
                lg: 'h-11 px-5 min-w-11',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

export interface ToggleProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof toggleVariants> {
    pressed?: boolean;
    defaultPressed?: boolean;
    onPressedChange?: (pressed: boolean) => void;
}

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
    ({ className, variant, size, pressed: controlledPressed, defaultPressed = false, onPressedChange, onClick, ...props }, ref) => {
        const [uncontrolledPressed, setUncontrolledPressed] = React.useState(defaultPressed);
        const isPressed = controlledPressed !== undefined ? controlledPressed : uncontrolledPressed;

        const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
            onClick?.(e);
            if (!e.defaultPrevented) {
                const next = !isPressed;
                if (controlledPressed === undefined) {
                    setUncontrolledPressed(next);
                }
                onPressedChange?.(next);
            }
        };

        return (
            <button
                ref={ref}
                type="button"
                aria-pressed={isPressed}
                data-state={isPressed ? 'on' : 'off'}
                onClick={handleClick}
                className={cn(toggleVariants({ variant, size, className }))}
                {...props}
            />
        );
    }
);

Toggle.displayName = 'Toggle';

export { Toggle, toggleVariants };
