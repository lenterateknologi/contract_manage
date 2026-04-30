import * as React from "react";
import { LayoutGrid, LayoutList } from "lucide-react";
import { cn } from "@/lib/utils";

export type LayoutType = 'table' | 'grid';

export interface LayoutToggleProps {
    value: LayoutType;
    onChange: (value: LayoutType) => void;
    className?: string;
}

const LayoutToggle = ({ value, onChange, className }: LayoutToggleProps) => {
    return (
        <div className={cn("flex rounded-lg bg-black/[0.03] p-1 dark:bg-white/[0.03]", className)}>
            <button
                type="button"
                onClick={() => onChange('table')}
                className={cn(
                    'flex h-8 items-center gap-2 rounded-md px-3 text-[11px] font-black uppercase tracking-widest transition-all',
                    value === 'table'
                        ? 'bg-primary text-white dark:bg-white dark:text-black shadow-md active:scale-95'
                        : 'text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white',
                )}
            >
                <LayoutList size={14} strokeWidth={3} />
                Table
            </button>
            <button
                type="button"
                onClick={() => onChange('grid')}
                className={cn(
                    'flex h-8 items-center gap-2 rounded-md px-3 text-[11px] font-black uppercase tracking-widest transition-all',
                    value === 'grid'
                        ? 'bg-primary text-white dark:bg-white dark:text-black shadow-md active:scale-95'
                        : 'text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white',
                )}
            >
                <LayoutGrid size={14} strokeWidth={3} />
                Grid
            </button>
        </div>
    );
};

export { LayoutToggle };
