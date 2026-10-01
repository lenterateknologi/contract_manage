import React from 'react';
import { Calendar, ChevronDown, RotateCcw, X, Lock } from 'lucide-react';
import { cn, formatDateRange, getPresetDateRange, DATE_RANGE_PRESETS } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/dialogs/Popover';
import { Button } from '@/components/ui/buttons/Button';
import { DateRangeCalendar } from '@/components/ui/inputs/DateRangeCalendar';

export interface DateRangePickerProps {
    from: string;
    to: string;
    onChange: (from: string, to: string) => void;
    label?: string;
    placeholder?: string;
    variant?: 'dropdown-field' | 'action-button';
    align?: 'start' | 'end' | 'center';
    showPresets?: boolean;
    disabled?: boolean;
    className?: string;
    triggerClassName?: string;
}

export function DateRangePicker({
    from,
    to,
    onChange,
    label = 'Rentang Tanggal',
    placeholder,
    variant = 'dropdown-field',
    align = 'start',
    showPresets = true,
    disabled = false,
    className,
    triggerClassName,
}: DateRangePickerProps) {
    const fromVal = from ? from.split('T')[0] : '';
    const toVal = to ? to.split('T')[0] : '';
    const hasDate = Boolean(fromVal || toVal);

    const defaultPlaceholder = variant === 'dropdown-field' 
        ? `Semua ${label}` 
        : 'Semua Rentang Waktu';

    const displayPlaceholder = placeholder || defaultPlaceholder;

    return (
        <div className={cn(variant === 'dropdown-field' ? 'w-full' : 'inline-block', disabled && 'cursor-not-allowed', className)}>
            <Popover>
                <PopoverTrigger asChild disabled={disabled}>
                    {variant === 'action-button' ? (
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={disabled}
                            className={cn(
                                'h-9 px-3 rounded-lg text-xs font-medium border transition-all duration-150 gap-2 cursor-pointer shadow-none',
                                hasDate
                                    ? 'border-primary/50 bg-primary/10 text-primary hover:bg-primary/15 dark:border-primary/60 dark:bg-primary/20 dark:text-primary-foreground'
                                    : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 hover:border-slate-300 dark:hover:border-zinc-600 hover:bg-slate-50 dark:hover:bg-zinc-800',
                                disabled && 'cursor-not-allowed bg-slate-100/70 dark:bg-zinc-900/80 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 opacity-60 shadow-none',
                                triggerClassName
                            )}
                        >
                            <Calendar size={14} className={cn(hasDate ? 'text-primary' : 'text-slate-400 dark:text-zinc-400')} />
                            <span className="truncate max-w-[200px]">
                                {formatDateRange(fromVal, toVal, displayPlaceholder)}
                            </span>
                            {disabled ? (
                                <Lock size={12} className="text-slate-400 dark:text-zinc-400 opacity-70 ml-1 shrink-0" />
                            ) : hasDate ? (
                                <span
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onChange('', '');
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            onChange('', '');
                                        }
                                    }}
                                    className="ml-1 p-0.5 rounded-full hover:bg-primary/20 text-primary transition-colors cursor-pointer"
                                    title="Hapus filter tanggal"
                                >
                                    <X size={12} />
                                </span>
                            ) : (
                                <ChevronDown size={13} className="text-slate-400 dark:text-zinc-400 shrink-0" />
                            )}
                        </Button>
                    ) : (
                        <div
                            role="button"
                            tabIndex={disabled ? -1 : 0}
                            className={cn(
                                'flex min-h-[38px] w-full items-center justify-between rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-left text-xs font-medium text-slate-800 dark:text-zinc-100 transition-all outline-none cursor-pointer hover:border-slate-300 dark:hover:border-zinc-600 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary shadow-2xs select-none',
                                hasDate && 'border-primary ring-2 ring-primary/20 dark:border-primary',
                                disabled && 'cursor-not-allowed bg-slate-100/70 dark:bg-zinc-900/80 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 shadow-none hover:border-slate-200 dark:hover:border-zinc-800',
                                triggerClassName
                            )}
                        >
                            <div className="flex flex-wrap gap-1.5 pr-2 min-w-0 flex-1">
                                {hasDate ? (
                                    <span
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-1 rounded-md border border-slate-200/80 bg-slate-100 dark:border-zinc-700/80 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 px-2 py-0.5 text-[11px] font-medium transition-colors hover:bg-slate-200/70 dark:hover:bg-zinc-700/70 cursor-default"
                                    >
                                        <Calendar size={11} className="shrink-0 text-primary" />
                                        <span>{formatDateRange(fromVal, toVal, displayPlaceholder)}</span>
                                        {!disabled && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    onChange('', '');
                                                }}
                                                className="text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors focus:outline-none ml-0.5 cursor-pointer rounded-sm"
                                                title="Hapus filter tanggal"
                                            >
                                                <X size={11} />
                                            </button>
                                        )}
                                    </span>
                                ) : (
                                    <span className="text-slate-400 dark:text-zinc-500 py-0.5 text-xs font-normal truncate">
                                        {displayPlaceholder}
                                    </span>
                                )}
                            </div>
                            {disabled ? (
                                <Lock size={13} className="text-slate-400 dark:text-zinc-400 shrink-0 ml-2 opacity-70" />
                            ) : (
                                <ChevronDown size={13} className="text-slate-400 dark:text-zinc-400 shrink-0 ml-2" />
                            )}
                        </div>
                    )}
                </PopoverTrigger>
                <PopoverContent
                    align={align}
                    className="w-[320px] sm:w-[360px] p-3.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-xl z-[999999]"
                >
                    <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
                            <div className="flex items-center gap-1.5">
                                <Calendar size={14} className="text-primary" />
                                <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                                    {label || 'Pilih Rentang Tanggal'}
                                </span>
                            </div>
                            {hasDate && (
                                <button
                                    type="button"
                                    onClick={() => onChange('', '')}
                                    className="flex items-center gap-1 text-[11px] font-semibold text-rose-500 hover:text-rose-400 transition-colors cursor-pointer"
                                >
                                    <RotateCcw size={11} />
                                    <span>Reset</span>
                                </button>
                            )}
                        </div>

                        {/* Preset Quick Buttons */}
                        {showPresets && (
                            <div className="flex flex-wrap gap-1.5">
                                {DATE_RANGE_PRESETS.map((preset) => (
                                    <button
                                        key={preset.type}
                                        type="button"
                                        onClick={() => {
                                            const range = getPresetDateRange(preset.type);
                                            onChange(range.date_from, range.date_to);
                                        }}
                                        className="px-2.5 py-1 text-[11px] font-medium rounded-md border border-slate-200 dark:border-zinc-700 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 transition-colors cursor-pointer"
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Interactive Calendar */}
                        <div className="rounded-lg border border-slate-100 dark:border-zinc-800 p-2 bg-slate-50/50 dark:bg-zinc-950/50">
                            <DateRangeCalendar
                                from={fromVal}
                                to={toVal}
                                onChange={onChange}
                            />
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
