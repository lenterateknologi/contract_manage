import { Columns } from 'lucide-react';
import React from 'react';
import { PlaceholderZone } from './PlaceholderZone';

interface LayoutProps {
    field: any;
    children: React.ReactNode;
    isBuilder?: boolean;
}

export const GridXLayout: React.FC<LayoutProps> = ({ field, children, isBuilder }) => {
    const cols = Number(field.options?.grid_cols) || 1;
    const colSizes = field.options?.col_sizes || [];
    const childrenArray = React.Children.toArray(children);

    if (isBuilder) {
        const remainder = childrenArray.length % cols;
        const emptyCount = childrenArray.length === 0 ? cols : (cols - remainder) % cols;

        let gridTemplate = `repeat(${cols}, 1fr)`;
        if (colSizes.length > 0) {
            gridTemplate = colSizes.map((size: string) => (size && size.trim() !== '' ? size : '1fr')).join(' ');
        }

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
                    height: field.options?.height ? (typeof field.options.height === 'number' || !isNaN(Number(field.options.height)) ? `${field.options.height}px` : field.options.height) : undefined,
                    minHeight: field.options?.height ? (typeof field.options.height === 'number' || !isNaN(Number(field.options.height)) ? `${field.options.height}px` : field.options.height) : undefined,
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
                            className="min-h-[80px] py-6"
                        />
                    );
                })}
            </div>
        );
    }

    const actualGridTemplate =
        childrenArray.length === 1 ? '1fr' : (field.options?.col_sizes || []).filter((s: string) => s).join(' ') || `repeat(${cols}, 1fr)`;

    return (
        <div
            className="grid w-full min-w-0 overflow-hidden"
            style={{
                gridTemplateColumns: actualGridTemplate,
                justifyContent: field.options?.justify_content || undefined,
                alignItems: field.options?.align_items || undefined,
                gap: field.options?.gap !== undefined ? `${field.options.gap}px` : '16px',
                borderStyle: (field.options?.border_style as any) || undefined,
                borderWidth: field.options?.border_width !== undefined ? `${field.options.border_width}px` : undefined,
                borderColor: field.options?.border_color || undefined,
                backgroundColor: field.options?.background_color || undefined,
                height: field.options?.height ? (typeof field.options.height === 'number' || !isNaN(Number(field.options.height)) ? `${field.options.height}px` : field.options.height) : undefined,
                minHeight: field.options?.height ? (typeof field.options.height === 'number' || !isNaN(Number(field.options.height)) ? `${field.options.height}px` : field.options.height) : undefined,
            }}
        >
            {children}
        </div>
    );
};
