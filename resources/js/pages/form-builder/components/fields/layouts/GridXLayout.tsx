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
    // Unwrap children jika dibungkus SortableContext
    let actualChildren: React.ReactNode[] = [];
    React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && child.props && child.props.children) {
            actualChildren = actualChildren.concat(React.Children.toArray(child.props.children));
        } else if (child) {
            actualChildren.push(child);
        }
    });

    if (isBuilder) {
        const count = actualChildren.length;
        const remainder = count % cols;
        const emptyCount = count === 0 ? cols : (cols - remainder) % cols;

        let gridTemplate = `repeat(${cols}, 1fr)`;
        if (colSizes.length > 0) {
            gridTemplate = colSizes.map((size: string) => (size && size.trim() !== '' ? size : '1fr')).join(' ');
        }

        return (
            <div
                className="grid w-full min-w-0 overflow-hidden"
                style={{
                    gridTemplateColumns: gridTemplate,
                    justifyItems: field.options?.justify_content || undefined,
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
                {Array.from({ length: emptyCount }).map((_, index) => {
                    const colIndex = (actualChildren.length + index) % cols;
                    const sizeLabel = colSizes[colIndex] ? colSizes[colIndex] : '1fr';
                    return (
                        <PlaceholderZone
                            key={`placeholder-${field.id}-${index}`}
                            id={`placeholder:${field.id}:${colIndex}`}
                            icon={Columns}
                            label={`Kolom ${colIndex + 1} (${sizeLabel})`}
                            description="Tarik elemen ke sini"
                            className="min-h-[80px] py-6 border border-dashed border-primary/20 hover:border-primary/40"
                        />
                    );
                })}
            </div>
        );
    }

    const actualGridTemplate =
        actualChildren.length === 1 ? '1fr' : (field.options?.col_sizes || []).filter((s: string) => s).join(' ') || `repeat(${cols}, 1fr)`;

    return (
        <div
            className="grid w-full min-w-0 overflow-hidden"
            style={{
                gridTemplateColumns: actualGridTemplate,
                justifyItems: field.options?.justify_content || undefined,
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
