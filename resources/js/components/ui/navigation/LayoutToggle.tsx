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
        <div className={cn("flex rounded-lg bg-sidebar-accent p-1 gap-0.5", className)}>
            <button
                type="button"
                onClick={() => onChange('table')}
                className={cn(
                    'flex h-7 items-center gap-1.5 rounded-md px-3 text-[10px] font-semibold uppercase tracking-widest transition-all font-sans',
                    value === 'table'
                        ? 'bg-sidebar-primary text-white shadow-sm'
                        : 'text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/80',
                )}
            >
                <LayoutList size={13} strokeWidth={2.5} />
                Tabel
            </button>
            <button
                type="button"
                onClick={() => onChange('grid')}
                className={cn(
                    'flex h-7 items-center gap-1.5 rounded-md px-3 text-[10px] font-semibold uppercase tracking-widest transition-all font-sans',
                    value === 'grid'
                        ? 'bg-sidebar-primary text-white shadow-sm'
                        : 'text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/80',
                )}
            >
                <LayoutGrid size={13} strokeWidth={2.5} />
                Kartu
            </button>
        </div>
    );
};

export { LayoutToggle };
