import * as React from 'react';
import { cn } from '@/lib/utils';
import { Calendar } from 'lucide-react';
import { inputVariants } from '../base/Input';

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
        return (
            <div className="relative flex items-center">
                <input
                    type="date"
                    className={cn(
                        inputVariants({ variant }),
                        'pl-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer',
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                <Calendar className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
        );
    }
);

DatePicker.displayName = 'DatePicker';

export { DatePicker };
