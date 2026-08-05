import { Label } from '@/components/ui/forms/Label';
import { cn } from '@/lib/utils';
import React, { useState } from 'react';
import { getTypographyStyle, renderValue } from '../../utils';

interface FieldProps {
    field: any;
    value: any;
    onChange?: (val: any) => void;
    readOnly?: boolean;
    isBuilder?: boolean;
}

export const SelectField: React.FC<FieldProps> = ({ field, value, onChange, readOnly }) => {
    const selectOptions = field.options?.items || [];
    const [searchQuery, setSearchQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);

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
                    className="text-foreground border-border min-h-[32px] flex-1 border-b border-dotted pb-1.5 text-[11px] font-semibold"
                    style={getTypographyStyle(field)}
                >
                    {renderValue(selectOptions.find((o: any) => o.value === value)?.label || value, field)}
                </span>
            </div>
        );
    }

    if (field.type === 'searchable_select') {
        const filtered = searchQuery ? selectOptions.filter((o: any) => o.label.toLowerCase().includes(searchQuery.toLowerCase())) : selectOptions;
        const selectedLabel = selectOptions.find((o: any) => o.value === value)?.label || '';

        return (
            <div className="relative w-full">
                {field.label && (
                    <Label
                        className="text-slate-700 mb-1 block text-[10px] font-semibold tracking-tight"
                        style={getTypographyStyle(field, 0.8, true)}
                    >
                        {field.label}
                        {field.is_required && <span className="text-destructive ml-0.5 font-semibold">*</span>}
                    </Label>
                )}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className={cn(
                            'border-slate-300 bg-white hover:bg-slate-50 text-slate-900 focus:ring-primary/20 flex h-9 w-full items-center justify-between rounded-lg border px-3 transition-all focus:ring-1 focus:outline-none shadow-2xs',
                            !value && 'opacity-80',
                        )}
                        style={getTypographyStyle(field)}
                    >
                        <span className={cn('truncate text-left', selectedLabel ? 'text-slate-900 font-semibold' : 'text-slate-400 dark:text-zinc-500 font-normal')}>
                            {selectedLabel || field.placeholder || 'Pilih...'}
                        </span>
                        <i
                            className={cn(
                                'fa-solid fa-chevron-down text-slate-400 text-[10px] transition-transform',
                                isOpen && 'rotate-180',
                            )}
                        />
                    </button>
                    {isOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                            <div className="border-slate-200 bg-white text-slate-900 animate-in fade-in zoom-in-95 absolute top-full right-0 z-50 mt-1 flex max-h-60 w-full min-w-[240px] flex-col overflow-hidden rounded-xl border shadow-2xl duration-200">
                                <div className="bg-white border-slate-200 sticky top-0 z-10 border-b p-2">
                                    <div className="relative">
                                        <i className="fa-solid fa-magnifying-glass text-slate-400 absolute top-1/2 left-3 -translate-y-1/2 text-[10px]" />
                                        <input
                                            autoFocus
                                            placeholder="Cari..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="bg-slate-50 border-slate-200 text-slate-900 focus:border-primary w-full rounded-md border py-1.5 pr-3 pl-8 text-[11px] font-semibold outline-none"
                                            style={getTypographyStyle(field)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                </div>
                                <div className="overflow-y-auto py-1">
                                    {filtered.map((opt: any) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => {
                                                onChange?.(opt.value);
                                                setIsOpen(false);
                                                setSearchQuery('');
                                            }}
                                            className={cn(
                                                'flex w-full items-center justify-between px-3 py-1.5 text-left text-[11px] font-semibold transition-all cursor-pointer',
                                                value === opt.value ? 'bg-primary/10 text-primary font-bold' : 'text-slate-700 hover:bg-slate-100',
                                            )}
                                            style={getTypographyStyle(field)}
                                        >
                                            <span className="truncate">{opt.label}</span>
                                            {value === opt.value && <i className="fa-solid fa-check text-primary ml-2 shrink-0 text-[10px]" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full">
            {field.label && (
                <Label
                    className="text-slate-700 mb-1 block text-[10px] font-semibold tracking-tight"
                    style={getTypographyStyle(field, 0.8, true)}
                >
                    {field.label}
                    {field.is_required && <span className="text-destructive ml-0.5 font-semibold">*</span>}
                </Label>
            )}
            <select
                value={value || ''}
                onChange={(e) => onChange?.(e.target.value)}
                className="border-slate-300 bg-white text-slate-900 focus:border-primary focus:ring-primary/20 flex h-9 w-full rounded-lg border px-3 text-[11px] font-semibold transition-all focus:ring-1 shadow-2xs"
                style={getTypographyStyle(field)}
            >
                <option value="" className="bg-white text-slate-900">{field.placeholder || 'Select option...'}</option>
                {selectOptions.map((opt: any) => (
                    <option key={opt.value} value={opt.value} className="bg-white text-slate-900" style={getTypographyStyle(field)}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
};
