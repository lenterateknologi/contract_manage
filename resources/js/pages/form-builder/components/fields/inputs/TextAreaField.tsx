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

export const TextAreaField: React.FC<FieldProps> = ({ field, value, onChange, readOnly, isBuilder }) => {
    if (readOnly) {
        return (
            <div className="relative w-full">
                {field.label && (
                    <div className="text-muted-foreground mb-1 text-[10px] font-semibold tracking-tight" style={getTypographyStyle(field, 0.8, true)}>
                        {field.label} :
                    </div>
                )}
                <span
                    className="text-foreground border-border block min-h-[32px] flex-1 border-b border-dotted pb-1.5 text-[11px] leading-relaxed font-semibold"
                    style={getTypographyStyle(field)}
                >
                    {value || '—'}
                </span>
            </div>
        );
    }

    return (
        <div className={cn('relative w-full', isBuilder && 'bg-primary/5 ring-primary/20 rounded p-0.5 ring-1')}>
            {field.label && field.options?.field_style !== 'dashed_bottom' && (
                <Label
                    className="text-foreground/70 mb-1 block text-[10px] font-semibold tracking-tight"
                    style={getTypographyStyle(field, 0.8, true)}
                >
                    {field.label}
                    {field.is_required && <span className="text-destructive ml-0.5 font-semibold">*</span>}
                </Label>
            )}
            <div className="group/input relative">
                <textarea
                    placeholder={field.placeholder}
                    value={value || ''}
                    onChange={(e) => onChange?.(e.target.value)}
                    className={cn(
                        'placeholder:text-muted-foreground/50 focus:ring-primary/20 flex min-h-[80px] w-full resize-none text-[11px] font-semibold transition-all placeholder:italic focus:ring-1',
                        field.options?.border_style === 'solid'
                            ? 'border-foreground rounded-none border-solid p-2'
                            : 'border-border bg-surface-base focus:border-primary rounded-lg border px-3 py-2',
                    )}
                    style={{
                        minHeight: field.options?.min_height ? `${field.options.min_height}px` : undefined,
                        ...getTypographyStyle(field),
                    }}
                />
            </div>
        </div>
    );
};
