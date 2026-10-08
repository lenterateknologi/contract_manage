import { Label } from '@/components/ui/forms/Label';
import { cn } from '@/lib/utils';
import React from 'react';

interface WorkingDaysSelectorProps {
    label?: string;
    value?: string[];
    onChange: (days: string[]) => void;
    helperText?: string;
    error?: string;
}

const DAYS = [
    { key: '1', short: 'Sen', label: 'Senin' },
    { key: '2', short: 'Sel', label: 'Selasa' },
    { key: '3', short: 'Rab', label: 'Rabu' },
    { key: '4', short: 'Kam', label: 'Kamis' },
    { key: '5', short: 'Jum', label: 'Jumat' },
    { key: '6', short: 'Sab', label: 'Sabtu' },
    { key: '7', short: 'Min', label: 'Minggu' },
];

export function WorkingDaysSelector({
    label = 'Hari Kerja Aktif',
    value,
    onChange,
    helperText,
    error,
}: WorkingDaysSelectorProps) {
    const currentDays: string[] = Array.isArray(value) ? value.map(String) : ['1', '2', '3', '4', '5'];
    const activeDaysCount = currentDays.length;

    return (
        <div className="w-full space-y-1">
            <div className="flex items-center justify-between px-0.5">
                <Label className="text-[11px] font-bold text-slate-700 uppercase dark:text-zinc-200">{label}</Label>
                <span className="text-primary bg-primary/10 py-0.2 rounded px-1.5 font-mono text-[9.5px] font-bold">
                    {activeDaysCount} Hari Aktif / Minggu
                </span>
            </div>
            <div className="grid h-9 grid-cols-7 items-center gap-1">
                {DAYS.map((d) => {
                    const isSelected = currentDays.includes(d.key);
                    return (
                        <button
                            key={d.key}
                            type="button"
                            onClick={() => {
                                const next = isSelected
                                    ? currentDays.filter((k) => k !== d.key)
                                    : [...currentDays, d.key].sort();
                                onChange(next);
                            }}
                            className={cn(
                                'flex h-9 cursor-pointer flex-col items-center justify-center rounded-md border text-xs font-bold transition-all select-none',
                                isSelected
                                    ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-xs'
                                    : 'bg-surface-muted/40 text-muted-foreground border-border/80 hover:bg-surface-muted hover:text-foreground',
                            )}
                            title={`${d.label} (${isSelected ? 'Aktif dihitung SLA' : 'Libur / Tidak dihitung'})`}
                        >
                            <span className="text-[11px] leading-none">{d.short}</span>
                        </button>
                    );
                })}
            </div>
            {helperText && !error && <p className="text-muted-foreground px-0.5 text-[10px] font-normal">{helperText}</p>}
        </div>
    );
}
export default WorkingDaysSelector;
