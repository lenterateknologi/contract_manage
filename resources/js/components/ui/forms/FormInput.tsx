import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/base/Input';
import { Label } from '@/components/ui/base/Label';
import InputError from '@/components/ui/base/InputError';

export interface FormInputProps extends React.ComponentProps<typeof Input> {
    label?: React.ReactNode;
    error?: string;
    containerClassName?: string;
    labelClassName?: string;
    inputSize?: 'default' | 'compact';
    icon?: React.ElementType;
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
    ({ label, error, containerClassName, labelClassName, className, inputSize = 'default', icon: Icon, ...props }, ref) => {
        const id = React.useId();
        const inputId = props.id || id;
        const isCompact = inputSize === 'compact';

        return (
            <div className={cn('space-y-1.5 w-full group', containerClassName)}>
                {label && (
                    <div className="flex items-center justify-between px-0.5">
                        <Label
                            htmlFor={inputId}
                            className={cn(
                                'font-bold transition-colors flex items-center gap-1.5',
                                isCompact ? 'text-[10px]' : 'text-[11px]',
                                error ? 'text-rose-500' : 'text-muted-foreground group-focus-within:text-primary',
                                labelClassName
                            )}
                        >
                            {label}
                        </Label>
                    </div>
                )}
                <div className="relative">
                    {Icon && (
                        <div className={cn(
                            "absolute top-1/2 -translate-y-1/2 transition-colors",
                            isCompact ? "left-3 text-muted-foreground/40 group-focus-within:text-primary" : "left-4 text-muted-foreground/60"
                        )}>
                            <Icon size={isCompact ? 12 : 16} strokeWidth={isCompact ? 3 : 2} />
                        </div>
                    )}
                    <Input
                        id={inputId}
                        ref={ref}
                        className={cn(
                            isCompact && 'h-9 px-3 text-sm rounded-lg',
                            Icon && (isCompact ? 'pl-9' : 'pl-11'),
                            error && 'border-rose-500 focus-visible:ring-rose-500 focus-visible:border-rose-500',
                            className
                        )}
                        {...props}
                    />
                </div>
                <InputError message={error} className={isCompact ? 'text-[10px] font-bold uppercase' : ''} />
            </div>
        );
    }
);

FormInput.displayName = 'FormInput';

export { FormInput };
