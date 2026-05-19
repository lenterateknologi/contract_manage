import * as React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/base/Label';

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
        <div className={cn("flex items-center justify-between gap-4 rounded-2xl border border-primary/5 dark:border-white/5 bg-primary/[0.02] dark:bg-white/[0.02] p-4 transition-all hover:bg-primary/[0.04] dark:hover:bg-white/[0.04]", containerClassName)}>
            <div className="space-y-0.5">
                <Label className="text-[11px] font-black uppercase  text-primary dark:text-white leading-none block">
                    {label}
                </Label>
                {description && (
                    <p className="text-[9px] font-bold text-primary/30 dark:text-white/30 uppercase  leading-none">
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
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-all duration-300 outline-none active:scale-95",
                    checked ? "bg-primary dark:bg-white" : "bg-primary/10 dark:bg-white/10"
                )}
            >
                <span
                    className={cn(
                        "pointer-events-none block h-4 w-4 rounded-full shadow-lg transition-transform duration-300 ring-0",
                        checked
                            ? "translate-x-6 bg-white dark:bg-primary"
                            : "translate-x-1 bg-white dark:bg-white/50"
                    )}
                />
            </button>
        </div>
    );
}
