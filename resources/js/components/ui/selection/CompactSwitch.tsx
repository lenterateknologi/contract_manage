import * as React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/forms/Label';

export interface CompactSwitchProps {
    label: string;
    description?: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    containerClassName?: string;
}

export function CompactSwitch({
    label,
    description,
    checked,
    onCheckedChange,
    containerClassName,
}: CompactSwitchProps) {
    return (
        <div className={cn("flex items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-3.5 transition-all hover:border-slate-300 dark:hover:border-zinc-700", containerClassName)}>
            <div className="space-y-0.5">
                <Label className="text-xs font-semibold text-slate-800 dark:text-zinc-200 leading-none block">
                    {label}
                </Label>
                {description && (
                    <p className="text-[11px] text-muted-foreground leading-normal mt-0.5">
                        {description}
                    </p>
                )}
            </div>

            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onCheckedChange(!checked)}
                className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-95",
                    checked ? "bg-primary" : "bg-slate-200 dark:bg-zinc-700"
                )}
            >
                <span
                    className={cn(
                        "pointer-events-none block h-3.5 w-3.5 rounded-full bg-white dark:bg-zinc-100 shadow-sm transition-transform duration-200",
                        checked
                            ? "translate-x-4.5"
                            : "translate-x-1"
                    )}
                />
            </button>
        </div>
    );
}
