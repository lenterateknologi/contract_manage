import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const alertVariants = cva(
    'relative w-full rounded-xl border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 transition-colors',
    {
        variants: {
            variant: {
                default: 'bg-surface-card border-surface-border text-text-main [&>svg]:text-text-main',
                destructive: 'bg-danger/10 border-danger/30 text-danger [&>svg]:text-danger dark:bg-danger/15 dark:border-danger/40',
                danger: 'bg-danger/10 border-danger/30 text-danger [&>svg]:text-danger dark:bg-danger/15 dark:border-danger/40',
                warning: 'bg-warning/10 border-warning/30 text-warning [&>svg]:text-warning dark:bg-warning/15 dark:border-warning/40',
                success: 'bg-success/10 border-success/30 text-success [&>svg]:text-success dark:bg-success/15 dark:border-success/40',
                info: 'bg-info/10 border-info/30 text-info [&>svg]:text-info dark:bg-info/15 dark:border-info/40',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

const Alert = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>>(
    ({ className, variant, ...props }, ref) => <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />,
);
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn('mb-1 font-semibold leading-none tracking-tight text-current', className)} {...props} />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-sm opacity-90 text-current [&_p]:leading-relaxed', className)} {...props} />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertDescription, AlertTitle };
