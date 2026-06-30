import { Label } from '@/components/ui/forms/Label';
import { cn } from '@/lib/utils';
import React from 'react';
import { getTypographyStyle } from '../../utils';

interface FieldProps {
    field: any;
    value: any;
    onChange?: (val: any) => void;
    readOnly?: boolean;
    isBuilder?: boolean;
}

export const CheckboxField: React.FC<FieldProps> = ({ field, value, onChange, readOnly }) => {
    if (readOnly) {
        return (
            <div className="flex items-center gap-2 py-1">
                <div
                    className={cn(
                        'flex h-4 w-4 items-center justify-center rounded border transition-colors',
                        value ? 'bg-foreground border-foreground text-background' : 'bg-card border-border',
                    )}
                >
                    {value && <i className="fa-solid fa-check text-[10px]" />}
                </div>
                <span className="text-foreground text-[11px] font-semibold" style={getTypographyStyle(field, 1, true)}>
                    {field.label}
                </span>
            </div>
        );
    }

    return (
        <div className="group flex cursor-pointer items-center gap-2 py-1" onClick={() => onChange?.(!value)}>
            <div
                className={cn(
                    'flex h-4.5 w-4.5 items-center justify-center rounded border-2 transition-all duration-200',
                    value ? 'bg-primary border-primary shadow-sm' : 'bg-card border-border group-hover:border-primary/50',
                )}
            >
                {value && <i className="fa-solid fa-check text-primary-foreground scale-110 text-[10px]" />}
            </div>
            <Label
                className="text-foreground/70 cursor-pointer text-[11px] font-semibold tracking-tight select-none"
                style={getTypographyStyle(field, 1, true)}
            >
                {field.label}
                {field.is_required && <span className="text-destructive ml-0.5 font-semibold">*</span>}
            </Label>
        </div>
    );
};
