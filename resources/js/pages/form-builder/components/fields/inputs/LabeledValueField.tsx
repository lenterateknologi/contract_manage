import { cn } from '@/lib/utils';
import { Calendar, ChevronDown } from 'lucide-react';
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
    
    // Support both field_style and explicit border_style option
    const activeBorderStyle = field.options?.border_style && field.options?.border_style !== 'none'
        ? field.options.border_style
        : (fieldStyle === 'dashed_bottom' ? 'dotted' : fieldStyle === 'solid_bottom' ? 'solid' : fieldStyle === 'box' || fieldStyle === 'bordered' ? 'solid' : 'none');

    const isNoBorder = activeBorderStyle === 'none' || fieldStyle === 'none';
    const isBox = fieldStyle === 'box' || fieldStyle === 'bordered';

    const typographyStyle = getTypographyStyle(field);

    const borderColor = field.options?.border_color || '#e2e8f0';
    const borderWidthVal = field.options?.border_width !== undefined && field.options?.border_width !== '' ? `${field.options.border_width}px` : '1px';

    const lineStyle: React.CSSProperties = {
        ...typographyStyle,
        borderColor: isNoBorder ? 'transparent' : borderColor,
        borderStyle: isNoBorder ? 'none' : activeBorderStyle,
        borderBottomWidth: !isNoBorder && !isBox ? borderWidthVal : undefined,
        borderWidth: !isNoBorder && isBox ? borderWidthVal : undefined,
    };

    const getRepeatingBackground = () => {
        if (isNoBorder || isBox) return undefined;
        const bw = field.options?.border_width !== undefined && field.options?.border_width !== '' ? Math.max(1, Number(field.options.border_width)) : 1;
        const yOffset = Math.max(0, 24 - bw);

        if (activeBorderStyle === 'dotted') {
            return `radial-gradient(circle, ${borderColor} ${bw}px, transparent ${bw + 0.5}px) 0 ${yOffset}px / ${bw * 4 + 2}px 24px repeat-x, repeating-linear-gradient(transparent, transparent ${yOffset}px, transparent ${yOffset}px, transparent 24px)`;
        }
        if (activeBorderStyle === 'dashed') {
            return `repeating-linear-gradient(90deg, ${borderColor} 0 6px, transparent 6px 12px) 0 ${yOffset}px / 100% 24px repeat-x, repeating-linear-gradient(transparent, transparent ${yOffset}px, transparent ${yOffset}px, transparent 24px)`;
        }
        return `repeating-linear-gradient(transparent, transparent ${yOffset}px, ${borderColor} ${yOffset}px, ${borderColor} 24px)`;
    };

    if (readOnly) {
        let displayValue = value;
        const valueType = field.options?.value_type || 'text';

        if (valueType === 'select' || valueType === 'searchable_select') {
            const items = field.options?.items || [];
            const isMulti = field.options?.is_multiselect === true;
            if (isMulti && Array.isArray(value)) {
                displayValue = value
                    .map((val) => items.find((item: any) => String(item.value) === String(val))?.label || val)
                    .join(', ') || '';
            } else {
                const selected = items.find((item: any) => String(item.value) === String(value));
                displayValue = selected ? selected.label : value || '';
            }
        } else if (valueType === 'number') {
            if (value !== undefined && value !== null && value !== '') {
                const numeric = String(value).replace(/\D/g, '');
                displayValue = numeric ? new Intl.NumberFormat('id-ID').format(Number(numeric)) : '';
            } else {
                displayValue = '';
            }
        } else if (valueType === 'checkbox') {
            displayValue = value ? 'Ya' : 'Tidak';
        } else {
            displayValue = value || '';
        }

        const maxLines = field.options?.max_lines ? Number(field.options.max_lines) : (valueType === 'textarea' ? 3 : 1);

        if (maxLines > 1 || valueType === 'textarea') {
            const backgroundStyle = getRepeatingBackground();

            return (
                <div className="flex w-full gap-1 py-0.5 items-start">
                    <span
                        className="shrink-0 pt-px flex justify-between pr-1"
                        style={{ width: labelWidth, minWidth: labelWidth, ...getTypographyStyle(field, 0.9, true) }}
                    >
                        <span className="min-w-0 break-words whitespace-pre-wrap leading-tight">{field.label}</span>
                        {showColon && <span className="ml-1 shrink-0">:</span>}
                    </span>
                    <div
                        className={cn(
                            'min-w-0 flex-1 break-words leading-6 whitespace-pre-wrap block w-full',
                            isNoBorder ? '' : !isBox ? 'border-none' : 'rounded border px-2 py-0.5',
                        )}
                        style={{
                            ...lineStyle,
                            minHeight: `${maxLines * 24}px`,
                            lineHeight: '24px',
                            background: backgroundStyle,
                        }}
                    >
                        {displayValue || '\u00A0'}
                    </div>
                </div>
            );
        }

        return (
            <div className="flex w-full gap-1 py-0.5 items-baseline">
                <span
                    className="shrink-0 pt-px flex justify-between pr-1"
                    style={{ width: labelWidth, minWidth: labelWidth, ...getTypographyStyle(field, 0.9, true) }}
                >
                    <span className="min-w-0 break-words whitespace-pre-wrap leading-tight">{field.label}</span>
                    {showColon && <span className="ml-1 shrink-0">:</span>}
                </span>
                <span
                    className={cn(
                        'min-w-0 flex-1 break-words',
                        isNoBorder ? '' : !isBox ? 'border-b' : 'rounded border px-2 py-0.5',
                    )}
                    style={lineStyle}
                >
                    {displayValue || '\u00A0'}
                </span>
            </div>
        );
    }

    const valueType = field.options?.value_type || 'text';

    const renderInteractiveInput = () => {
        const baseClass = cn(
            'w-full min-w-0 transition-all font-sans text-xs text-slate-900',
            isNoBorder
                ? 'border-none bg-transparent px-0 shadow-none outline-none'
                : !isBox
                  ? 'focus:border-primary border-t-0 border-r-0 border-b border-l-0 border-slate-300 bg-transparent px-0 shadow-none outline-none'
                  : 'bg-white text-slate-900 border-slate-300 focus:border-primary rounded-lg border border-solid px-3 py-1 shadow-2xs',
        );

        const allowDirectEdit = field.options?.allow_direct_edit !== false;
        const customPlaceholder = field.placeholder;

        if (valueType === 'date') {
            return (
                <div className="flex w-full min-w-0 items-center gap-1.5">
                    <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => onChange?.(e.target.value)}
                        placeholder={customPlaceholder || (allowDirectEdit ? "Ketik atau pilih tanggal..." : "Pilih tanggal dari kalender...")}
                        readOnly={!allowDirectEdit}
                        className={cn(baseClass, !allowDirectEdit && 'cursor-default bg-transparent')}
                        style={lineStyle}
                    />
                    <div className="relative shrink-0 flex items-center justify-center">
                        <button
                            type="button"
                            className={cn(baseClass, 'w-7 h-7 p-0 flex items-center justify-center cursor-pointer shrink-0 bg-white text-slate-700 border-slate-300 hover:bg-slate-50 shadow-2xs rounded-lg')}
                            style={{
                                ...lineStyle,
                                width: '28px',
                                height: '28px',
                                padding: 0,
                            }}
                            title="Pilih Kalender"
                        >
                            <Calendar className="h-3.5 w-3.5 text-slate-600" />
                        </button>
                        <input
                            type="date"
                            value={typeof value === 'string' && value.includes('-') ? value : ''}
                            onChange={(e) => onChange?.(e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                    </div>
                </div>
            );
        }

        if (valueType === 'number') {
            const formatNumber = (val: string) => {
                const numeric = val.replace(/\D/g, '');
                if (!numeric) return '';
                return new Intl.NumberFormat('id-ID').format(Number(numeric));
            };

            const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                const rawValue = e.target.value.replace(/\D/g, '');
                onChange?.(rawValue !== '' ? Number(rawValue) : '');
            };

            const formattedVal = value !== undefined && value !== null && value !== '' ? formatNumber(String(value)) : '';

            return (
                <input
                    type="text"
                    value={formattedVal}
                    onChange={handleNumberChange}
                    placeholder={customPlaceholder || '0'}
                    className={baseClass}
                    style={lineStyle}
                />
            );
        }

        const maxLines = field.options?.max_lines ? Number(field.options.max_lines) : 1;

        if (valueType === 'textarea' || maxLines > 1) {
            const backgroundStyle = getRepeatingBackground();

            return (
                <div className="relative w-full">
                    <textarea
                        rows={maxLines > 1 ? maxLines : 3}
                        value={value || ''}
                        onChange={(e) => onChange?.(e.target.value)}
                        placeholder={customPlaceholder || ''}
                        className={cn(
                            baseClass,
                            'resize-none leading-6 py-0 bg-transparent block w-full outline-none ring-0 focus:ring-0',
                            !isBox ? 'border-none' : '',
                        )}
                        style={{
                            ...lineStyle,
                            lineHeight: '24px',
                            background: backgroundStyle,
                        }}
                    />
                </div>
            );
        }

        return (
            <input
                type="text"
                value={value || ''}
                onChange={(e) => onChange?.(e.target.value)}
                placeholder={customPlaceholder || ''}
                className={baseClass}
                style={lineStyle}
            />
        );
    };

    return (
        <div className={cn("flex w-full min-w-0 gap-1 py-0.5", valueType === 'textarea' ? 'items-start' : 'items-center')}>
            <span
                className="shrink-0 pt-px flex justify-between pr-1"
                style={{ width: labelWidth, minWidth: labelWidth, ...getTypographyStyle(field, 0.9, true) }}
            >
                <span className="min-w-0 break-words whitespace-pre-wrap leading-tight">{field.label}</span>
                {showColon && <span className="ml-1 shrink-0">:</span>}
            </span>
            <div className="relative min-w-0 flex-1">
                {renderInteractiveInput()}
            </div>
        </div>
    );
};
