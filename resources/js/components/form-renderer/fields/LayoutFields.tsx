import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import React from 'react';

interface LayoutProps {
    field: any;
    children: React.ReactNode;
    isBuilder?: boolean;
}

export const GroupLayout: React.FC<LayoutProps> = ({ field, children, isBuilder }) => {
    return (
        <div
            className={cn(
                'min-h-0 transition-colors',
                field.options?.group_style !== 'frameless' && 'p-2',
                field.options?.border_style === 'solid' ? 'border-solid border-[#000]' : 'border-none',
            )}
            style={{
                borderStyle: (field.options?.border_style as any) || undefined,
                borderWidth:
                    field.options?.border_width !== undefined
                        ? `${field.options.border_width}px`
                        : field.options?.border_style === 'solid'
                          ? '1px'
                          : undefined,
                borderColor: field.options?.border_color || undefined,
                backgroundColor: field.options?.background_color || undefined,
            }}
        >
            <div
                className="flex flex-wrap gap-0"
                style={{
                    justifyContent: field.options?.justify_content || 'flex-start',
                    alignItems: field.options?.align_items || 'flex-start',
                }}
            >
                {children}
            </div>
        </div>
    );
};

export const GridXLayout: React.FC<LayoutProps> = ({ field, children }) => {
    return (
        <div
            className="grid w-full gap-4"
            style={{
                gridTemplateColumns:
                    (field.options?.col_sizes || []).filter((s: string) => s).join(' ') || `repeat(${field.options?.grid_cols || 1}, 1fr)`,
                justifyContent: field.options?.justify_content || undefined,
                alignItems: field.options?.align_items || undefined,
                borderStyle: (field.options?.border_style as any) || undefined,
                borderWidth: field.options?.border_width !== undefined ? `${field.options.border_width}px` : undefined,
                borderColor: field.options?.border_color || undefined,
                backgroundColor: field.options?.background_color || undefined,
            }}
        >
            {children}
        </div>
    );
};

export const GridYLayout: React.FC<LayoutProps> = ({ field, children }) => {
    return (
        <div
            className="flex w-full flex-col"
            style={{
                justifyContent: field.options?.justify_content || 'flex-start',
                alignItems: field.options?.align_items || 'stretch',
                borderStyle: (field.options?.border_style as any) || undefined,
                borderWidth: field.options?.border_width !== undefined ? `${field.options.border_width}px` : undefined,
                borderColor: field.options?.border_color || undefined,
                backgroundColor: field.options?.background_color || undefined,
            }}
        >
            {children}
        </div>
    );
};

export const EmptyDropZone: React.FC = () => (
    <div className="border-primary/20 bg-primary/5 text-primary/40 hover:bg-primary/10 flex w-full items-center justify-center rounded-lg border-2 border-dashed py-8 text-[10px] font-black uppercase transition-all">
        <Plus size={14} className="mr-2" /> Letakkan elemen di sini
    </div>
);
