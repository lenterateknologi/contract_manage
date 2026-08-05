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
    /* ponytail: clean balanced fill for layout toggle buttons */
    return (
        <div className={cn("flex rounded-xl bg-surface-muted border border-surface-border p-1 gap-1", className)}>
            <button
                type="button"
                onClick={() => onChange('table')}
                className={cn(
                    'flex h-7 items-center gap-1.5 rounded-lg px-3 text-[10px] font-bold uppercase transition-all font-sans cursor-pointer',
                    value === 'table'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-text-desc hover:text-text-main hover:bg-surface-base/60',
                )}
            >
                <LayoutList size={13} strokeWidth={2.5} />
                Tabel
            </button>
            <button
                type="button"
                onClick={() => onChange('grid')}
                className={cn(
                    'flex h-7 items-center gap-1.5 rounded-lg px-3 text-[10px] font-bold uppercase transition-all font-sans cursor-pointer',
                    value === 'grid'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-text-desc hover:text-text-main hover:bg-surface-base/60',
                )}
            >
                <LayoutGrid size={13} strokeWidth={2.5} />
                Kartu
            </button>
        </div>
    );
};

export { LayoutToggle };
