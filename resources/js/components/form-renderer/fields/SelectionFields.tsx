import { Label } from '@/components/ui/base/Label';
import { cn } from '@/lib/utils';
import React, { useState } from 'react';
import { getTypographyStyle, renderValue } from '../utils';

interface FieldProps {
    field: any;
    value: any;
    onChange?: (val: any) => void;
    readOnly?: boolean;
    isBuilder?: boolean;
}

export const CheckboxField: React.FC<FieldProps> = ({ field, value, onChange, readOnly }) => {
    if (readOnly) {
        return (
            <div className="flex items-center gap-2 py-1">
                <div
                    className={cn(
                        'flex h-4 w-4 items-center justify-center rounded border transition-colors',
                        value ? 'bg-foreground border-foreground text-background' : 'bg-card border-border',
                    )}
                >
                    {value && <i className="fa-solid fa-check text-[10px]" />}
                </div>
                <span className="text-foreground text-[11px] font-bold uppercase" style={getTypographyStyle(field, 1, true)}>
                    {field.label}
                </span>
            </div>
        );
    }

    return (
        <div className="group flex cursor-pointer items-center gap-2 py-1" onClick={() => onChange?.(!value)}>
            <div
                className={cn(
                    'flex h-4.5 w-4.5 items-center justify-center rounded border-2 transition-all duration-200',
                    value ? 'bg-primary border-primary shadow-sm' : 'bg-card border-border group-hover:border-primary/50',
                )}
            >
                {value && <i className="fa-solid fa-check text-primary-foreground scale-110 text-[10px]" />}
            </div>
            <Label
                className="text-foreground/70 cursor-pointer text-[11px] font-black tracking-tight uppercase select-none"
                style={getTypographyStyle(field, 1, true)}
            >
                {field.label}
                {field.is_required && <span className="text-destructive ml-0.5 font-bold">*</span>}
            </Label>
        </div>
    );
};

export const RadioField: React.FC<FieldProps> = ({ field, value, onChange, readOnly }) => {
    const options = field.options?.items || [];
    if (readOnly) {
        return (
            <div className="flex flex-col gap-1.5 py-1">
                {field.label && <div className="text-muted-foreground mb-0.5 text-[10px] font-black tracking-tight uppercase">{field.label}</div>}
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
                                className={cn(
                                    'text-[10px] font-bold uppercase',
                                    value === opt.value ? 'text-foreground' : 'text-muted-foreground/60',
                                )}
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
                <Label className="text-foreground/70 text-[10px] font-black tracking-tight uppercase">
                    {field.label}
                    {field.is_required && <span className="text-destructive ml-0.5 font-bold">*</span>}
                </Label>
            )}
            <div className="flex flex-wrap gap-4">
                {options.map((opt: any) => (
                    <div key={opt.value} className="group flex cursor-pointer items-center gap-2" onClick={() => onChange?.(opt.value)}>
                        <div
                            className={cn(
                                'flex h-4 w-4 items-center justify-center rounded-full border-2 transition-all',
                                value === opt.value ? 'border-primary bg-white' : 'border-border group-hover:border-primary bg-white',
                            )}
                        >
                            {value === opt.value && <div className="bg-primary animate-in zoom-in-50 h-2 w-2 rounded-full duration-200" />}
                        </div>
                        <span className="text-foreground/70 group-hover:text-primary text-[11px] font-bold uppercase transition-colors select-none">
                            {opt.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const SelectField: React.FC<FieldProps> = ({ field, value, onChange, readOnly }) => {
    const selectOptions = field.options?.items || [];
    const [searchQuery, setSearchQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    if (readOnly) {
        return (
            <div className="flex w-full items-baseline gap-2 py-0.5">
                {field.label && (
                    <span
                        className="text-muted-foreground min-w-[120px] shrink-0 text-[10px] font-black tracking-tight whitespace-nowrap uppercase"
                        style={getTypographyStyle(field, 0.8, true)}
                    >
                        {field.label} :
                    </span>
                )}
                <span
                    className="text-foreground border-border min-h-[32px] flex-1 border-b border-dotted pb-1.5 text-[11px] font-bold"
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
                        className="text-foreground/70 mb-1 block text-[10px] font-black tracking-tight uppercase"
                        style={getTypographyStyle(field, 0.8, true)}
                    >
                        {field.label}
                        {field.is_required && <span className="text-destructive ml-0.5 font-bold">*</span>}
                    </Label>
                )}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className={cn(
                            'border-border bg-muted/20 hover:bg-muted/30 focus:ring-primary/20 flex h-9 w-full items-center justify-between rounded-lg border px-3 transition-all focus:ring-1 focus:outline-none',
                            !value && 'opacity-80',
                        )}
                        style={getTypographyStyle(field)}
                    >
                        <span className={cn('truncate text-left', selectedLabel ? 'text-foreground' : 'text-muted-foreground/60 font-medium italic')}>
                            {selectedLabel || field.placeholder || 'Pilih...'}
                        </span>
                        <i
                            className={cn(
                                'fa-solid fa-chevron-down text-muted-foreground/40 text-[10px] transition-transform',
                                isOpen && 'rotate-180',
                            )}
                        />
                    </button>
                    {isOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                            <div className="border-border bg-popover animate-in fade-in zoom-in-95 absolute top-full right-0 z-50 mt-1 flex max-h-60 w-full min-w-[240px] flex-col overflow-hidden rounded-xl border shadow-2xl duration-200">
                                <div className="bg-popover border-border sticky top-0 z-10 border-b p-2">
                                    <div className="relative">
                                        <i className="fa-solid fa-magnifying-glass text-muted-foreground/50 absolute top-1/2 left-3 -translate-y-1/2 text-[10px]" />
                                        <input
                                            autoFocus
                                            placeholder="Cari..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="bg-muted/50 border-border focus:border-primary w-full rounded-md border py-1.5 pr-3 pl-8 text-[11px] font-bold outline-none"
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
                                                'flex w-full items-center justify-between px-3 py-1.5 text-left text-[11px] font-bold transition-all',
                                                value === opt.value ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:bg-muted',
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
                    className="text-foreground/80 mb-1 block text-[10px] font-black tracking-tight uppercase"
                    style={getTypographyStyle(field, 0.8, true)}
                >
                    {field.label}
                    {field.is_required && <span className="text-destructive ml-0.5 font-bold">*</span>}
                </Label>
            )}
            <select
                value={value || ''}
                onChange={(e) => onChange?.(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-slate-200 bg-slate-50/30 px-3 text-[11px] font-bold transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                style={getTypographyStyle(field)}
            >
                <option value="">{field.placeholder || 'Select option...'}</option>
                {selectOptions.map((opt: any) => (
                    <option key={opt.value} value={opt.value} style={getTypographyStyle(field)}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
};
