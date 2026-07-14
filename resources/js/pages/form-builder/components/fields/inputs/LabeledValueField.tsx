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
        const valueType = field.options?.value_type || 'text';

        if (valueType === 'select' || valueType === 'searchable_select') {
            const items = field.options?.items || [];
            const isMulti = field.options?.is_multiselect === true;
            if (isMulti && Array.isArray(value)) {
                displayValue = value
                    .map((val) => items.find((item: any) => String(item.value) === String(val))?.label || val)
                    .join(', ') || '—';
            } else {
                const selected = items.find((item: any) => String(item.value) === String(value));
                displayValue = selected ? selected.label : value || '—';
            }
        } else if (valueType === 'currency') {
            const currencyType = field.options?.currency_type || 'IDR';
            if (value !== undefined && value !== null && value !== '') {
                if (currencyType === 'SGD') {
                    displayValue = 'S$ ' + new Intl.NumberFormat('en-SG').format(Number(value));
                } else if (currencyType === 'USD') {
                    displayValue = '$ ' + new Intl.NumberFormat('en-US').format(Number(value));
                } else {
                    displayValue = 'Rp ' + new Intl.NumberFormat('id-ID').format(Number(value));
                }
            } else {
                displayValue = '—';
            }
        } else if (valueType === 'checkbox') {
            displayValue = value ? 'Ya' : 'Tidak';
        } else {
            displayValue = value || '—';
        }

        return (
            <div className={cn("flex w-full gap-1 py-0.5", valueType === 'textarea' ? 'items-start' : 'items-baseline')}>
                <span
                    className="shrink-0 whitespace-nowrap pt-px"
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

    const valueType = field.options?.value_type || 'text';

    const renderInteractiveInput = () => {
        const baseClass = cn(
            'w-full min-w-0 transition-all font-sans text-xs',
            isNoBorder
                ? 'border-none bg-transparent px-0 shadow-none outline-none'
                : isDashed
                  ? 'border-border focus:border-primary border-t-0 border-r-0 border-b border-l-0 border-dashed bg-transparent px-0 shadow-none outline-none'
                  : 'border-border bg-surface-base focus:border-primary rounded-lg border px-3 py-1',
        );

        if (valueType === 'date') {
            return (
                <input
                    type="date"
                    value={value || ''}
                    onChange={(e) => onChange?.(e.target.value)}
                    className={baseClass}
                    style={typographyStyle}
                />
            );
        }

        if (valueType === 'number') {
            return (
                <input
                    type="number"
                    value={value ?? ''}
                    onChange={(e) => onChange?.(e.target.value !== '' ? Number(e.target.value) : '')}
                    className={baseClass}
                    style={typographyStyle}
                />
            );
        }

        if (valueType === 'textarea') {
            const maxLines = field.options?.max_lines ? Number(field.options.max_lines) : 3;
            return (
                <textarea
                    rows={maxLines}
                    value={value || ''}
                    onChange={(e) => onChange?.(e.target.value)}
                    className={cn(baseClass, 'py-1.5 resize-none')}
                    style={typographyStyle}
                />
            );
        }

        if (valueType === 'select' || valueType === 'searchable_select') {
            const items = field.options?.items || [];
            const isMulti = field.options?.is_multiselect === true;

            const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
                if (isMulti) {
                    const options = e.target.options;
                    const selectedValues: string[] = [];
                    for (let i = 0; i < options.length; i++) {
                        if (options[i].selected) {
                            selectedValues.push(options[i].value);
                        }
                    }
                    onChange?.(selectedValues);
                } else {
                    onChange?.(e.target.value);
                }
            };

            const selectValue = isMulti 
                ? (Array.isArray(value) ? value : (value ? [String(value)] : []))
                : (value || '');

            return (
                <select
                    multiple={isMulti}
                    value={selectValue}
                    onChange={handleSelectChange}
                    className={cn(baseClass, 'cursor-pointer', isMulti ? 'h-auto py-1' : '')}
                    style={typographyStyle}
                >
                    {!isMulti && <option value="">Pilih...</option>}
                    {items.map((opt: any) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            );
        }

        if (valueType === 'checkbox') {
            return (
                <div className="flex h-7 items-center">
                    <input
                        type="checkbox"
                        checked={!!value}
                        onChange={(e) => onChange?.(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                </div>
            );
        }

        if (valueType === 'currency') {
            const currencyType = field.options?.currency_type || 'IDR';
            const symbol = currencyType === 'SGD' ? 'S$' : currencyType === 'USD' ? '$' : 'Rp';
            const plClass = currencyType === 'SGD' ? 'pl-6' : currencyType === 'USD' ? 'pl-4' : 'pl-6';

            const formatCurrency = (val: string) => {
                const numeric = val.replace(/\D/g, '');
                if (!numeric) return '';
                if (currencyType === 'SGD') {
                    return new Intl.NumberFormat('en-SG').format(Number(numeric));
                } else if (currencyType === 'USD') {
                    return new Intl.NumberFormat('en-US').format(Number(numeric));
                } else {
                    return new Intl.NumberFormat('id-ID').format(Number(numeric));
                }
            };

            const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                const rawValue = e.target.value.replace(/\D/g, '');
                onChange?.(rawValue !== '' ? Number(rawValue) : '');
            };

            const formattedVal = value !== undefined && value !== null && value !== '' ? formatCurrency(String(value)) : '';

            return (
                <div className="relative flex items-center">
                    <span className="text-muted-foreground absolute left-0 text-xs font-semibold">{symbol}</span>
                    <input
                        type="text"
                        value={formattedVal}
                        onChange={handleCurrencyChange}
                        placeholder="0"
                        className={cn(baseClass, plClass)}
                        style={typographyStyle}
                    />
                </div>
            );
        }

        return (
            <input
                type="text"
                value={value || ''}
                onChange={(e) => onChange?.(e.target.value)}
                className={baseClass}
                style={typographyStyle}
            />
        );
    };

    return (
        <div className={cn("flex w-full min-w-0 gap-1 py-0.5", valueType === 'textarea' ? 'items-start' : 'items-center')}>
            <span className="shrink-0 whitespace-nowrap pt-px" style={{ width: labelWidth, minWidth: labelWidth, ...getTypographyStyle(field, 0.9, true) }}>
                {field.label} {showColon && ':'}
            </span>
            <div className="relative min-w-0 flex-1">
                {renderInteractiveInput()}
            </div>
        </div>
    );
};
