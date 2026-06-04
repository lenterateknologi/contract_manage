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

export const LabeledValueField: React.FC<FieldProps & { previewData?: any }> = ({ field, value, onChange, readOnly, isBuilder, previewData }) => {
    // Resolve label_width: support plain numbers ("90") and strings ("90px", "120px", "1fr")
    const rawWidth = field.options?.label_width ?? '150';
    const labelWidth = rawWidth !== '' && !isNaN(Number(rawWidth)) ? `${rawWidth}px` : rawWidth;

    const showColon = field.options?.show_colon !== false;
    const fieldStyle = field.options?.field_style || 'dashed_bottom';
    const isNoBorder = fieldStyle === 'none';
    const isDashed = !isNoBorder && fieldStyle !== 'box';

    const typographyStyle = getTypographyStyle(field);

    if (readOnly) {
        let displayValue = value;
        if (field.options?.value_type === 'select' || field.options?.value_type === 'searchable_select') {
            const selected = (field.options?.items || []).find((item: any) => item.value === value);
            displayValue = selected ? selected.label : value || '—';
        } else {
            displayValue = value || '—';
        }

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
                        'min-w-0 flex-1 break-words',
                        isNoBorder ? '' : isDashed ? 'border-border border-b border-dotted pb-px' : 'border-border rounded border px-2 py-0.5',
                    )}
                    style={typographyStyle}
                >
                    {displayValue}
                </span>
            </div>
        );
    }

    return (
        <div className="flex w-full min-w-0 items-center gap-1 py-0.5">
            <span className="shrink-0 whitespace-nowrap" style={{ width: labelWidth, minWidth: labelWidth, ...getTypographyStyle(field, 0.9, true) }}>
                {field.label} {showColon && ':'}
            </span>
            <div className="relative min-w-0 flex-1">
                <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange?.(e.target.value)}
                    className={cn(
                        'w-full min-w-0 transition-all',
                        isNoBorder
                            ? 'border-none bg-transparent px-0 shadow-none outline-none'
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
