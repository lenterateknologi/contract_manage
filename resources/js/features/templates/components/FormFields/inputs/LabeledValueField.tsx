import { formatDate } from '@/lib/time-utils';
import { cn } from '@/lib/utils';
import { Calendar, ChevronDown, Lock, Pencil } from 'lucide-react';
import React from 'react';
import { getTypographyStyle } from '../../FormBuilder/utils';

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
    const activeBorderStyle =
        field.options?.border_style && field.options?.border_style !== 'none'
            ? field.options.border_style
            : fieldStyle === 'dashed_bottom'
              ? 'dotted'
              : fieldStyle === 'solid_bottom'
                ? 'solid'
                : fieldStyle === 'box' || fieldStyle === 'bordered'
                  ? 'solid'
                  : 'none';

    const isNoBorder = activeBorderStyle === 'none' || fieldStyle === 'none';
    const isBox = fieldStyle === 'box' || fieldStyle === 'bordered';

    const typographyStyle = getTypographyStyle(field);

    const borderColor = field.options?.border_color || '#e2e8f0';
    const borderWidthVal =
        field.options?.border_width !== undefined && field.options?.border_width !== '' ? `${field.options.border_width}px` : '1px';

    const lineStyle: React.CSSProperties = {
        ...typographyStyle,
        borderColor: isNoBorder ? 'transparent' : borderColor,
        borderStyle: isNoBorder ? 'none' : activeBorderStyle,
        borderBottomWidth: !isNoBorder && !isBox ? borderWidthVal : undefined,
        borderWidth: !isNoBorder && isBox ? borderWidthVal : undefined,
    };

    const getRepeatingBackground = () => {
        if (isNoBorder || isBox) return undefined;
        const bw =
            field.options?.border_width !== undefined && field.options?.border_width !== '' ? Math.max(1, Number(field.options.border_width)) : 1;
        const yOffset = Math.max(0, 24 - bw);

        if (activeBorderStyle === 'dotted') {
            return `radial-gradient(circle, ${borderColor} ${bw}px, transparent ${bw + 0.5}px) 0 ${yOffset}px / ${bw * 4 + 2}px 24px repeat-x, repeating-linear-gradient(transparent, transparent ${yOffset}px, transparent ${yOffset}px, transparent 24px)`;
        }
        if (activeBorderStyle === 'dashed') {
            return `repeating-linear-gradient(90deg, ${borderColor} 0 6px, transparent 6px 12px) 0 ${yOffset}px / 100% 24px repeat-x, repeating-linear-gradient(transparent, transparent ${yOffset}px, transparent ${yOffset}px, transparent 24px)`;
        }
        return `repeating-linear-gradient(transparent, transparent ${yOffset}px, ${borderColor} ${yOffset}px, ${borderColor} 24px)`;
    };

    const allowDirectEdit = field.options?.allow_direct_edit !== false;

    if (readOnly || !allowDirectEdit) {
        let displayValue = value;
        const valueType = field.options?.value_type || 'text';

        if (valueType === 'select' || valueType === 'searchable_select') {
            const items = field.options?.items || [];
            const isMulti = field.options?.is_multiselect === true;
            if (isMulti && Array.isArray(value)) {
                displayValue = value.map((val) => items.find((item: any) => String(item.value) === String(val))?.label || val).join(', ') || '';
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
        } else if (valueType === 'date') {
            if (value) {
                const str = String(value).trim();
                const formatted = formatDate(str);
                displayValue = formatted !== '-' ? formatted : str.split('T')[0].split(' ')[0];
            } else {
                displayValue = '';
            }
        } else {
            if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
                const isDateName = field.name?.includes('tgl') || field.name?.includes('tanggal') || field.name?.includes('date');
                if (isDateName) {
                    const formatted = formatDate(value);
                    displayValue = formatted !== '-' ? formatted : value.split('T')[0];
                } else {
                    displayValue = value.split('T')[0];
                }
            } else {
                displayValue = value || '';
            }
        }

        const maxLines = field.options?.max_lines ? Number(field.options.max_lines) : valueType === 'textarea' ? 3 : 1;

        const showLockIcon = !allowDirectEdit && !readOnly;

        if (maxLines > 1 || valueType === 'textarea') {
            const backgroundStyle = getRepeatingBackground();

            return (
                <div className="flex w-full items-start gap-1 py-0.5">
                    <span
                        className="flex shrink-0 justify-between pt-px pr-1"
                        style={{ width: labelWidth, minWidth: labelWidth, ...getTypographyStyle(field, 0.9, true) }}
                    >
                        <span className="min-w-0 leading-tight break-words whitespace-pre-wrap">{field.label}</span>
                        {showColon && <span className="ml-1 shrink-0">:</span>}
                    </span>
                    <div
                        className={cn(
                            'relative block w-full min-w-0 flex-1 leading-6 break-words whitespace-pre-wrap',
                            isNoBorder ? '' : !isBox ? 'border-none' : 'rounded border px-2 py-0.5',
                        )}
                        style={{
                            ...lineStyle,
                            minHeight: `${maxLines * 24}px`,
                            lineHeight: '24px',
                            background: backgroundStyle || '#ffffff',
                        }}
                    >
                        {displayValue || '\u00A0'}
                        {showLockIcon && (
                            <span className="absolute top-1 right-1 inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-medium text-slate-400 select-none" title="Tidak dapat diedit">
                                <Lock size={11} className="text-slate-400" />
                            </span>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div className="flex w-full items-baseline gap-1 py-0.5">
                <span
                    className="flex shrink-0 justify-between pt-px pr-1"
                    style={{ width: labelWidth, minWidth: labelWidth, ...getTypographyStyle(field, 0.9, true) }}
                >
                    <span className="min-w-0 leading-tight break-words whitespace-pre-wrap">{field.label}</span>
                    {showColon && <span className="ml-1 shrink-0">:</span>}
                </span>
                <span
                    className={cn(
                        'relative min-w-0 flex-1 break-words inline-flex items-center justify-between gap-1 bg-white h-[22px] min-h-[22px] leading-tight',
                        isNoBorder ? '' : !isBox ? 'border-b' : 'rounded border px-2 py-0.5'
                    )}
                    style={{
                        ...lineStyle,
                        height: '22px',
                        backgroundColor: '#ffffff',
                    }}
                >
                    <span>{displayValue || '\u00A0'}</span>
                    {showLockIcon && (
                        <span className="inline-flex shrink-0 items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-medium text-slate-400 select-none" title="Tidak dapat diedit">
                            <Lock size={11} className="text-slate-400" />
                        </span>
                    )}
                </span>
            </div>
        );
    }

    const valueType = field.options?.value_type || 'text';

    const renderInteractiveInput = () => {
        // Base styling 100% identical to PDF / readOnly display:
        // No extra gray background or focus rings that alter the document appearance
        const baseClass = cn(
            'w-full min-w-0 font-sans text-xs text-slate-900 bg-white transition-all h-[22px] min-h-[22px] leading-tight',
            isNoBorder
                ? 'border-none bg-white px-2 py-0.5 outline-none focus:outline-none'
                : !isBox
                  ? 'border-b bg-white px-0 py-0.5 text-slate-900 outline-none focus:outline-none'
                  : 'rounded border bg-white px-2 py-0.5 text-slate-900 outline-none focus:outline-none',
        );

        const allowDirectEdit = field.options?.allow_direct_edit !== false;
        const customPlaceholder = field.placeholder;

        const inputStyle: React.CSSProperties = {
            ...lineStyle,
            height: '22px',
            lineHeight: 'normal',
            backgroundColor: '#ffffff',
            borderColor: isNoBorder ? 'transparent' : borderColor,
        };

        const renderTrailingIcon = () => {
            if (readOnly) return null;
            if (allowDirectEdit) {
                return (
                    <span
                        className="pointer-events-none inline-flex shrink-0 items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-medium text-slate-400 select-none hover:text-slate-600"
                        title="Dapat diedit"
                    >
                        <Pencil size={11} className="text-slate-400" />
                    </span>
                );
            }
            return (
                <span
                    className="pointer-events-none inline-flex shrink-0 items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-medium text-slate-400 select-none hover:text-slate-600"
                    title="Tidak dapat diedit"
                >
                    <Lock size={11} className="text-slate-400" />
                </span>
            );
        };

        if (valueType === 'date') {
            const rawDateStr = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value) ? value.split('T')[0] : value || '';
            const isoDateOnly = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.substring(0, 10) : '';

            return (
                <div className="relative flex w-full min-w-0 items-center">
                    <input
                        type="text"
                        value={rawDateStr}
                        onChange={(e) => onChange?.(e.target.value)}
                        placeholder={customPlaceholder || (allowDirectEdit ? 'Ketik atau pilih tanggal...' : 'Pilih tanggal dari kalender...')}
                        readOnly={!allowDirectEdit}
                        className={cn(baseClass, !readOnly ? 'pr-14' : '')}
                        style={inputStyle}
                    />
                    <div className="absolute right-0 flex items-center gap-1 pr-1">
                        {renderTrailingIcon()}
                        {allowDirectEdit && (
                            <div className="relative flex shrink-0 items-center justify-center">
                                <button
                                    type="button"
                                    className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded border border-slate-200 bg-white p-0 text-slate-700 hover:bg-slate-50"
                                    title="Pilih Kalender"
                                >
                                    <Calendar className="h-3 w-3 text-slate-500" />
                                </button>
                                <input
                                    type="date"
                                    value={isoDateOnly}
                                    onChange={(e) => onChange?.(e.target.value)}
                                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                />
                            </div>
                        )}
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
                if (!allowDirectEdit) return;
                const rawValue = e.target.value.replace(/\D/g, '');
                onChange?.(rawValue !== '' ? Number(rawValue) : '');
            };

            const formattedVal = value !== undefined && value !== null && value !== '' ? formatNumber(String(value)) : '';

            return (
                <div className="relative flex w-full min-w-0 items-center">
                    <input
                        type="text"
                        value={formattedVal}
                        onChange={handleNumberChange}
                        placeholder={customPlaceholder || '0'}
                        readOnly={!allowDirectEdit}
                        className={cn(baseClass, !readOnly ? 'pr-8' : '')}
                        style={inputStyle}
                    />
                    <div className="absolute right-0 flex items-center pr-1">
                        {renderTrailingIcon()}
                    </div>
                </div>
            );
        }

        const maxLines = field.options?.max_lines ? Number(field.options.max_lines) : valueType === 'textarea' ? 3 : 1;

        if (valueType === 'textarea' || maxLines > 1) {
            const backgroundStyle = getRepeatingBackground();
            const textareaHeight = `${maxLines * 24}px`;

            return (
                <div className="relative w-full">
                    <textarea
                        rows={maxLines}
                        value={value || ''}
                        onChange={(e) => {
                            if (!allowDirectEdit) return;
                            onChange?.(e.target.value);
                        }}
                        placeholder={customPlaceholder || ''}
                        readOnly={!allowDirectEdit}
                        className={cn(
                            baseClass,
                            'block w-full resize-none leading-6 ring-0 outline-none focus:ring-0',
                            !isBox ? 'border' : '',
                            !readOnly ? 'pr-8' : '',
                            'h-auto min-h-0'
                        )}
                        style={{
                            ...inputStyle,
                            height: textareaHeight,
                            minHeight: textareaHeight,
                            lineHeight: '24px',
                            background: backgroundStyle || '#ffffff',
                        }}
                    />
                    <div className="absolute top-1 right-1 flex items-center">
                        {renderTrailingIcon()}
                    </div>
                </div>
            );
        }

        if (valueType === 'select' || valueType === 'searchable_select') {
            const items = field.options?.items || [];
            const isMulti = field.options?.is_multiselect === true;

            if (isMulti) {
                const currentVals: string[] = Array.isArray(value) ? value.map(String) : value ? [String(value)] : [];
                return (
                    <div className="flex w-full min-w-0 flex-wrap items-center gap-1.5">
                        {items.map((opt: any, idx: number) => {
                            const optVal = String(opt.value);
                            const isChecked = currentVals.includes(optVal);
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    disabled={!allowDirectEdit}
                                    onClick={() => {
                                        if (!allowDirectEdit) return;
                                        const next = isChecked ? currentVals.filter((v) => v !== optVal) : [...currentVals, optVal];
                                        onChange?.(next);
                                    }}
                                    className={cn(
                                        'rounded border px-2 py-0.5 text-[11px] font-medium transition-colors',
                                        allowDirectEdit ? 'cursor-pointer' : 'cursor-default opacity-80',
                                        isChecked
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-white text-foreground border-slate-300 hover:bg-slate-50',
                                    )}
                                    style={typographyStyle}
                                >
                                    {opt.label}
                                </button>
                            );
                        })}
                        {renderTrailingIcon()}
                    </div>
                );
            }

            return (
                <div className="relative flex w-full min-w-0 items-center">
                    <select
                        value={value !== undefined && value !== null ? String(value) : ''}
                        disabled={!allowDirectEdit}
                        onChange={(e) => {
                            if (!allowDirectEdit) return;
                            onChange?.(e.target.value);
                        }}
                        className={cn(
                            baseClass,
                            'appearance-none bg-white pr-12 text-slate-900 cursor-pointer shadow-none',
                        )}
                        style={{
                            ...inputStyle,
                            color: typographyStyle.color || '#0f172a',
                        }}
                    >
                        <option value="" disabled className="bg-white text-slate-500">
                            {customPlaceholder || 'Pilih...'}
                        </option>
                        {items.map((opt: any, idx: number) => (
                            <option key={idx} value={String(opt.value)} className="bg-white text-slate-900">
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-1 flex items-center gap-1 pointer-events-none">
                        {renderTrailingIcon()}
                        {allowDirectEdit && <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
                    </div>
                </div>
            );
        }

        if (valueType === 'checkbox') {
            const isChecked = !!value;
            return (
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={!allowDirectEdit}
                        onChange={(e) => {
                            if (!allowDirectEdit) return;
                            onChange?.(e.target.checked);
                        }}
                        className={cn(
                            'text-primary focus:ring-primary h-4 w-4 rounded border-slate-300 bg-white',
                            allowDirectEdit ? 'cursor-pointer' : 'cursor-default opacity-80',
                        )}
                    />
                    <span
                        className={cn('text-foreground text-xs select-none', allowDirectEdit ? 'cursor-pointer' : 'cursor-default opacity-80')}
                        onClick={() => {
                            if (allowDirectEdit) onChange?.(!isChecked);
                        }}
                    >
                        {isChecked ? 'Ya' : 'Tidak'}
                    </span>
                    {renderTrailingIcon()}
                </div>
            );
        }

        const cleanInputValue = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value) ? value.split('T')[0] : value || '';

        return (
            <div className="relative flex w-full min-w-0 items-center">
                <input
                    type="text"
                    value={cleanInputValue}
                    readOnly={!allowDirectEdit}
                    onChange={(e) => {
                        if (!allowDirectEdit) return;
                        onChange?.(e.target.value);
                    }}
                    placeholder={customPlaceholder || ''}
                    className={cn(baseClass, !readOnly ? 'pr-8' : '')}
                    style={inputStyle}
                />
                <div className="absolute right-0 flex items-center pr-1">
                    {renderTrailingIcon()}
                </div>
            </div>
        );
    };

    const effectiveMaxLines = field.options?.max_lines ? Number(field.options.max_lines) : valueType === 'textarea' ? 3 : 1;
    const isMultiLine = valueType === 'textarea' || effectiveMaxLines > 1;

    return (
        <div className={cn('flex w-full min-w-0 gap-1 py-0.5', isMultiLine ? 'items-start' : 'items-baseline')}>
            <span
                className="flex shrink-0 justify-between pt-px pr-1"
                style={{ width: labelWidth, minWidth: labelWidth, ...getTypographyStyle(field, 0.9, true) }}
            >
                <span className="min-w-0 leading-tight break-words whitespace-pre-wrap">{field.label}</span>
                {showColon && <span className="ml-1 shrink-0">:</span>}
            </span>
            <div className="relative min-w-0 flex-1 leading-tight">{renderInteractiveInput()}</div>
        </div>
    );
};
