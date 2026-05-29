import { cn } from '@/lib/utils';
import { Columns, Image as ImageIcon, LucideIcon, Plus } from 'lucide-react';
import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface LayoutProps {
    field: any;
    children: React.ReactNode;
    isBuilder?: boolean;
}

interface PlaceholderZoneProps {
    id?: string;
    icon: LucideIcon;
    label: string;
    description?: string;
    className?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
}

export const PlaceholderZone: React.FC<PlaceholderZoneProps> = ({
    id,
    icon: Icon,
    label,
    description,
    className,
    style,
    onClick,
}) => {
    const { setNodeRef, isOver } = id
        ? useDroppable({ id })
        : { setNodeRef: undefined, isOver: false };

    return (
        <div
            ref={setNodeRef}
            onClick={onClick}
            style={style}
            className={cn(
                'border-primary/20 bg-primary/5 text-primary/40 flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center transition-all cursor-pointer',
                isOver ? 'border-primary bg-primary/10 text-primary scale-[0.98]' : 'hover:bg-primary/10',
                className,
            )}
        >
            <Icon size={16} className={cn('mb-1', isOver ? 'text-primary' : 'text-primary/30')} />
            <span className="text-[9px] font-semibold uppercase tracking-wider">{label}</span>
            {description && <span className="text-[7px] opacity-60 mt-0.5">{description}</span>}
        </div>
    );
};

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

export const GridXLayout: React.FC<LayoutProps> = ({ field, children, isBuilder }) => {
    const cols = Number(field.options?.grid_cols) || 1;
    const colSizes = field.options?.col_sizes || [];
    const childrenArray = React.Children.toArray(children);

    // Build the grid template columns string
    let gridTemplate = `repeat(${cols}, 1fr)`;
    if (colSizes.length > 0) {
        gridTemplate = colSizes
            .map((size: string) => (size && size.trim() !== '' ? size : '1fr'))
            .join(' ');
    }

    if (isBuilder) {
        const remainder = childrenArray.length % cols;
        const emptyCount = childrenArray.length === 0 ? cols : (cols - remainder) % cols;

        return (
            <div
                className="grid w-full min-w-0 overflow-hidden"
                style={{
                    gridTemplateColumns: gridTemplate,
                    justifyContent: field.options?.justify_content || undefined,
                    alignItems: field.options?.align_items || undefined,
                    gap: field.options?.gap !== undefined ? `${field.options.gap}px` : '16px',
                    borderStyle: (field.options?.border_style as any) || undefined,
                    borderWidth: field.options?.border_width !== undefined ? `${field.options.border_width}px` : undefined,
                    borderColor: field.options?.border_color || undefined,
                    backgroundColor: field.options?.background_color || undefined,
                    minHeight: field.options?.height ? `${field.options.height}px` : undefined,
                }}
            >
                {childrenArray}
                {Array.from({ length: emptyCount }).map((_, index) => {
                    const colIndex = (childrenArray.length + index) % cols;
                    return (
                        <PlaceholderZone
                            key={`placeholder-${field.id}-${index}`}
                            id={`placeholder:${field.id}:${colIndex}`}
                            icon={Columns}
                            label={`Kolom ${colIndex + 1}`}
                            description="Tarik elemen ke sini"
                            className="py-6 min-h-[80px]"
                        />
                    );
                })}
            </div>
        );
    }

    // In normal filling/pdf view, render standard grid with auto-flow
    return (
        <div
            className="grid w-full min-w-0 overflow-hidden"
            style={{
                gridTemplateColumns:
                    (field.options?.col_sizes || []).filter((s: string) => s).join(' ') || `repeat(${cols}, 1fr)`,
                justifyContent: field.options?.justify_content || undefined,
                alignItems: field.options?.align_items || undefined,
                gap: field.options?.gap !== undefined ? `${field.options.gap}px` : '16px',
                borderStyle: (field.options?.border_style as any) || undefined,
                borderWidth: field.options?.border_width !== undefined ? `${field.options.border_width}px` : undefined,
                borderColor: field.options?.border_color || undefined,
                backgroundColor: field.options?.background_color || undefined,
                minHeight: field.options?.height ? `${field.options.height}px` : undefined,
            }}
        >
            {children}
        </div>
    );
};

export const GridYLayout: React.FC<LayoutProps> = ({ field, children, isBuilder }) => {
    return (
        <div
            className="flex w-full flex-col min-w-0 overflow-hidden"
            style={{
                justifyContent: field.options?.justify_content || 'flex-start',
                alignItems: field.options?.align_items || 'stretch',
                gap: field.options?.gap !== undefined ? `${field.options.gap}px` : '16px',
                borderStyle: (field.options?.border_style as any) || undefined,
                borderWidth: field.options?.border_width !== undefined ? `${field.options.border_width}px` : undefined,
                borderColor: field.options?.border_color || undefined,
                backgroundColor: field.options?.background_color || undefined,
                minHeight: field.options?.height ? `${field.options.height}px` : undefined,
            }}
        >
            {children}
        </div>
    );
};

export const EmptyDropZone: React.FC = () => (
    <PlaceholderZone
        icon={Plus}
        label="Letakkan elemen di sini"
        className="py-8"
    />
);
