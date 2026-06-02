import { Label } from '@/components/ui/base/Label';
import { cn } from '@/lib/utils';
import React from 'react';
import { getTypographyStyle, renderValue } from '../utils';

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
                    {renderValue(value, field)}
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

                            export const TextAreaField: React.FC<FieldProps> = ({ field, value, onChange, readOnly, isBuilder }) => {
                            if (readOnly) {
                            return (
                            <div className="relative w-full">
                            {field.label && (
                            <div
                            className="text-muted-foreground mb-1 text-[10px] font-semibold tracking-tight"
                            style={getTypographyStyle(field, 0.8, true)}
                            >
                            {field.label} :
                            </div>
                            )}
                            <span
                            className="text-foreground border-border block min-h-[32px] flex-1 border-b border-dotted pb-1.5 text-[11px] leading-relaxed font-semibold"
                            style={getTypographyStyle(field)}
                            >
                            {renderValue(value, field)}
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

                            export const LabeledValueField: React.FC<FieldProps & { previewData?: any }> = ({
                            field,
                            value,
                            onChange,
                            readOnly,
                            isBuilder,
                            previewData,
                            }) => {
                            // Resolve label_width: support plain numbers ("90") and strings ("90px", "120px", "1fr")
                            const rawWidth = field.options?.label_width ?? '150';
                            const labelWidth = rawWidth !== '' && !isNaN(Number(rawWidth)) ? `${rawWidth}px` : rawWidth;

                            const showColon = field.options?.show_colon !== false;
                            const fieldStyle = field.options?.field_style || 'dashed_bottom';
                            const isNoBorder = fieldStyle === 'none';
                            const isDashed = !isNoBorder && fieldStyle !== 'box';

                            const typographyStyle = getTypographyStyle(field);

                            if (readOnly) {
                            return (
                            <div className="flex w-full items-baseline gap-1 py-0.5">
                            <span
                            className="shrink-0 whitespace-nowrap"
                            style={{ width: labelWidth, minWidth: labelWidth, ...getTypographyStyle(field, 0.9, true) }}
                            >
                            {field.label} {showColon && ':'}
                            </span>
                            <span
                            className={cn(
                            'flex-1 min-w-0 break-words',
                            isNoBorder ? '' : isDashed ? 'border-border border-b border-dotted pb-px' : 'border-border rounded border px-2 py-0.5',
                            )}
                            style={typographyStyle}
                            >
                            {renderValue(value, field)}
                            </span>
                            </div>
                            );
                            }

                            return (
                            <div className="flex w-full items-center gap-1 py-0.5 min-w-0">
                            <span
                            className="shrink-0 whitespace-nowrap"
                            style={{ width: labelWidth, minWidth: labelWidth, ...getTypographyStyle(field, 0.9, true) }}
                            >
                            {field.label} {showColon && ':'}
                            </span>
                            <div className="relative flex-1 min-w-0">
                            <input
                            type="text"
                            value={value || ''}
                            onChange={(e) => onChange?.(e.target.value)}
                            className={cn(
                            'w-full transition-all min-w-0',
                            isNoBorder
                            ? 'bg-transparent px-0 shadow-none outline-none border-none'
                            : isDashed
                            ? 'border-border focus:border-primary border-t-0 border-r-0 border-b border-l-0 border-dashed bg-transparent px-0 shadow-none outline-none'
                            : 'border-border bg-surface-base focus:border-primary rounded-lg border px-3 py-1',
                            )}
                            style={typographyStyle}
                            />
                            </div>
                            </div>
                            );
                            };

