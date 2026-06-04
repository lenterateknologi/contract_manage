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

export const TextField: React.FC<FieldProps> = ({ field, value, onChange, readOnly, isBuilder }) => {
    if (readOnly) {
        return (
            <div className="flex w-full items-baseline gap-2 py-0.5">
                {field.label && (
                    <span
                        className="text-muted-foreground min-w-[120px] shrink-0 text-[10px] font-semibold tracking-tight whitespace-nowrap"
                        style={getTypographyStyle(field, 0.8, true)}
                    >
                        {field.label} :
                    </span>
                )}
                <span
                    className="text-foreground border-border min-h-[32px] flex-1 border-b border-dotted pb-1.5 text-[11px] leading-relaxed font-semibold"
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
                <input
                    type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                    placeholder={field.placeholder}
                    value={field.type === 'date' && typeof value === 'string' ? value.split('T')[0].split(' ')[0] : value || ''}
                    onChange={(e) => onChange?.(e.target.value)}
                    className={cn(
                        'placeholder:text-muted-foreground/50 flex min-h-[32px] w-full text-[11px] font-semibold transition-all placeholder:italic',
                        field.options?.field_style === 'dashed_bottom'
                            ? 'border-border focus:border-primary rounded-none border-t-0 border-r-0 border-b border-l-0 border-dashed bg-transparent px-0 font-semibold shadow-none ring-0 outline-none focus:ring-0'
                            : 'border-border bg-surface-base focus:ring-primary/20 focus:border-primary rounded-lg border px-3 focus:ring-1',
                    )}
                    style={getTypographyStyle(field)}
                />
            </div>
        </div>
    );
};
