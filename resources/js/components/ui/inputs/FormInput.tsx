import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/inputs/Input';
import { Label } from '@/components/ui/forms/Label';
import InputError from '@/components/ui/forms/InputError';
import { Lock } from 'lucide-react';

export interface FormInputProps extends React.ComponentProps<typeof Input> {
    label?: React.ReactNode;
    error?: string;
    helperText?: string;
    containerClassName?: string;
    labelClassName?: string;
    inputSize?: 'default' | 'compact';
    icon?: React.ElementType;
    rightAction?: React.ReactNode;
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
    ({ label, error, helperText, containerClassName, labelClassName, className, inputSize = 'default', icon: Icon, rightAction, ...props }, ref) => {
        const id = React.useId();
        const inputId = props.id || id;
        const isCompact = inputSize === 'compact';
        const isNonEditable = Boolean(props.disabled || props.readOnly);

        return (
            <div className={cn('space-y-1.5 w-full group', containerClassName)}>
                {label && (
                    <div className="flex items-center justify-between px-0.5">
                        <Label
                            htmlFor={inputId}
                            className={cn(
                                'font-bold uppercase tracking-wider transition-colors flex items-center gap-1',
                                isCompact ? 'text-[10px]' : 'text-[11px]',
                                error ? 'text-rose-500' : 'text-slate-700 dark:text-zinc-200 group-focus-within:text-primary',
                                labelClassName
                            )}
                        >
                            {typeof label === 'string' ? (
                                <>
                                    {label.replace(/\s*\*$/, '')}
                                    {(props.required || label.includes('*')) && <span className="text-rose-500 ml-0.5">*</span>}
                                </>
                            ) : (
                                label
                            )}
                        </Label>
                        {isNonEditable && (
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-normal">
                                <Lock size={10} className="opacity-70" />
                                <span>Terkunci</span>
                            </span>
                        )}
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
                            (rightAction || isNonEditable) && 'pr-10',
                            error && 'border-rose-500 focus-visible:ring-rose-500 focus-visible:border-rose-500',
                            className
                        )}
                        {...props}
                    />
                    {rightAction ? (
                        <div className="absolute right-0 top-0 bottom-0 flex items-center pr-3.5">
                            {rightAction}
                        </div>
                    ) : isNonEditable ? (
                        <div className="absolute right-0 top-0 bottom-0 flex items-center pr-3 text-slate-400 dark:text-zinc-500 pointer-events-none" title="Field tidak dapat diedit">
                            <Lock size={isCompact ? 12 : 14} className="opacity-70" />
                        </div>
                    ) : null}
                </div>
                {helperText && !error && (
                    <p className="text-[11px] text-muted-foreground px-0.5 mt-1 font-normal">
                        {helperText}
                    </p>
                )}
                <InputError message={error} className={isCompact ? 'text-[10px] font-bold uppercase' : ''} />
            </div>
        );
    }
);

FormInput.displayName = 'FormInput';

export { FormInput };
