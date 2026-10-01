import * as React from 'react';
import { cn } from '@/lib/utils';
import { Calendar, Lock } from 'lucide-react';
import { inputVariants } from './Input';

export interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
    /** Optional custom styling variant passed to inputVariants */
    variant?: 'outline' | 'filled';
}

/**
 * A basic native date picker component wrapper.
 * For more complex calendars, consider using react-day-picker.
 */
const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
    ({ className, variant = 'outline', ...props }, ref) => {
        const isNonEditable = Boolean(props.disabled || props.readOnly);

        return (
            <div className="relative flex items-center">
                <input
                    type="date"
                    className={cn(
                        inputVariants({ variant }),
                        'pl-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer',
                        isNonEditable && 'pr-10',
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                <Calendar className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                {isNonEditable && (
                    <div className="absolute right-3 top-0 bottom-0 flex items-center text-slate-400 dark:text-zinc-500 pointer-events-none" title="Field tidak dapat diedit">
                        <Lock className="h-4 w-4 opacity-70" />
                    </div>
                )}
            </div>
        );
    }
);

DatePicker.displayName = 'DatePicker';

export { DatePicker };
