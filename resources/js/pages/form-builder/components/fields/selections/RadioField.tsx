import { Label } from '@/components/ui/base/Label';
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

export const RadioField: React.FC<FieldProps> = ({ field, value, onChange, readOnly }) => {
    const options = field.options?.items || [];
    if (readOnly) {
        return (
            <div className="flex flex-col gap-1.5 py-1">
                {field.label && <div className="text-muted-foreground mb-0.5 text-[10px] font-semibold tracking-tight">{field.label}</div>}
                <div className="flex flex-wrap gap-4">
                    {options.map((opt: any) => (
                        <div key={opt.value} className="flex items-center gap-1.5">
                            <div
                                className={cn(
                                    'flex h-3.5 w-3.5 items-center justify-center rounded-full border',
                                    value === opt.value ? 'bg-foreground border-foreground' : 'bg-card border-border',
                                )}
                            >
                                {value === opt.value && <div className="bg-background h-1.5 w-1.5 rounded-full" />}
                            </div>
                            <span
                                className={cn('text-[10px] font-semibold', value === opt.value ? 'text-foreground' : 'text-muted-foreground/60')}
                                style={getTypographyStyle(field, 0.9, true)}
                            >
                                {opt.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 py-1">
            {field.label && (
                <Label className="text-foreground/70 text-[10px] font-semibold tracking-tight" style={getTypographyStyle(field, 0.8, true)}>
                    {field.label}
                    {field.is_required && <span className="text-destructive ml-0.5 font-semibold">*</span>}
                </Label>
            )}
            <div className="flex flex-wrap gap-4">
                {options.map((opt: any) => (
                    <div key={opt.value} className="group flex cursor-pointer items-center gap-2" onClick={() => onChange?.(opt.value)}>
                        <div
                            className={cn(
                                'flex h-4 w-4 items-center justify-center rounded-full border-2 transition-all',
                                value === opt.value ? 'border-primary bg-card' : 'border-border group-hover:border-primary bg-card',
                            )}
                        >
                            {value === opt.value && <div className="bg-primary animate-in zoom-in-50 h-2 w-2 rounded-full duration-200" />}
                        </div>
                        <span
                            className="text-foreground/70 group-hover:text-primary text-[11px] font-semibold transition-colors select-none"
                            style={getTypographyStyle(field, 0.9)}
                        >
                            {opt.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
