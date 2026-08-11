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
    /* ponytail: clean balanced fill for layout toggle buttons - icon only */
    return (
        <div className={cn("flex rounded-xl bg-surface-muted border border-surface-border p-1 gap-1", className)}>
            <button
                type="button"
                onClick={() => onChange('table')}
                title="Tampilan Tabel"
                className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-lg transition-all font-sans cursor-pointer',
                    value === 'table'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-text-desc hover:text-text-main hover:bg-surface-base/60',
                )}
            >
                <LayoutList size={14} strokeWidth={2.2} />
            </button>
            <button
                type="button"
                onClick={() => onChange('grid')}
                title="Tampilan Kartu"
                className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-lg transition-all font-sans cursor-pointer',
                    value === 'grid'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-text-desc hover:text-text-main hover:bg-surface-base/60',
                )}
            >
                <LayoutGrid size={14} strokeWidth={2.2} />
            </button>
        </div>
    );
};

export { LayoutToggle };
