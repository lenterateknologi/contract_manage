import * as React from 'react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/base/Textarea';
import { Label } from '@/components/ui/base/Label';
import InputError from '@/components/ui/base/InputError';

export interface FormTextareaProps extends React.ComponentProps<typeof Textarea> {
    label?: string;
    error?: string;
    containerClassName?: string;
    labelClassName?: string;
    inputSize?: 'default' | 'compact';
}

const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
    ({ label, error, containerClassName, labelClassName, className, inputSize = 'default', ...props }, ref) => {
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
                                'font-bold uppercase  transition-colors',
                                isCompact ? 'text-[10px]' : 'text-[11px]',
                                error ? 'text-rose-500' : 'text-muted-foreground group-focus-within:text-primary',
                                labelClassName
                            )}
                        >
                            {label}
                        </Label>
                    </div>
                )}
                <Textarea
                    id={inputId}
                    ref={ref}
                    className={cn(
                        isCompact && 'min-h-[60px] px-3 text-sm rounded-lg',
                        error && 'border-rose-500 focus-visible:ring-rose-500 focus-visible:border-rose-500',
                        className
                    )}
                    {...props}
                />
                <InputError message={error} className={isCompact ? 'text-[10px] font-bold uppercase' : ''} />
            </div>
        );
    }
);

FormTextarea.displayName = 'FormTextarea';

export { FormTextarea };
