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

export const TextField: React.FC<FieldProps> = ({ field, value, onChange, readOnly, isBuilder }) => {
    const maxLines = field.options?.max_lines ? Number(field.options.max_lines) : 1;
    const isDashed = field.options?.field_style === 'dashed_bottom';
    const isSolid = field.options?.field_style === 'solid';

    if (readOnly) {
        return (
            <div className={cn("flex w-full gap-2 py-0.5", maxLines > 1 ? 'items-start' : 'items-baseline')}>
                {field.label && (
                    <span
                        className="text-muted-foreground min-w-[120px] shrink-0 text-[10px] font-semibold tracking-tight whitespace-nowrap pt-0.5"
                        style={getTypographyStyle(field, 0.8, true)}
                    >
                        {field.label} :
                    </span>
                )}
                <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                    {Array.from({ length: maxLines }).map((_, lineIdx) => {
                        const isFirst = lineIdx === 0;
                        return (
                            <span
                                key={lineIdx}
                                className={cn(
                                    'text-foreground min-h-[20px] leading-5 w-full block text-[11px] font-semibold',
                                    isDashed ? 'border-border border-b border-dotted' : isSolid ? 'border-border border-b border-solid' : 'border-border border-b border-dotted',
                                )}
                                style={getTypographyStyle(field)}
                            >
                                {isFirst ? (value || '—') : <span className="invisible">&nbsp;</span>}
                            </span>
                        );
                    })}
                </div>
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
                            : 'border-slate-300 bg-white text-slate-900 focus:ring-primary/20 focus:border-primary rounded-lg border px-3 focus:ring-1 shadow-2xs',
                    )}
                    style={getTypographyStyle(field)}
                />
            </div>
        </div>
    );
};
