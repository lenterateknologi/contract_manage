import React from 'react';

interface LayoutProps {
    field: any;
    children: React.ReactNode;
    isBuilder?: boolean;
}

export const GridYLayout: React.FC<LayoutProps> = ({ field, children, isBuilder }) => {
    const opts = field.options || {};

    const hasPartialBorder =
        opts.border_left !== undefined || opts.border_top !== undefined || opts.border_right !== undefined || opts.border_bottom !== undefined;

    const borderVal =
        opts.border_width !== undefined
            ? `${opts.border_width}px ${opts.border_style || 'solid'} ${opts.border_color || '#000'}`
            : opts.border_style === 'solid'
              ? `1px solid ${opts.border_color || '#000'}`
              : undefined;

    const partialBorderStyle = hasPartialBorder
        ? {
              borderLeft: opts.border_left ? borderVal : undefined,
              borderRight: opts.border_right ? borderVal : undefined,
              borderTop: opts.border_top ? borderVal : undefined,
              borderBottom: opts.border_bottom ? borderVal : undefined,
          }
        : {
              borderStyle: (opts.border_style as any) || undefined,
              borderWidth: opts.border_width !== undefined ? `${opts.border_width}px` : undefined,
              borderColor: opts.border_color || undefined,
          };

    return (
        <div
            className="flex w-full min-w-0 flex-col overflow-hidden"
            style={{
                justifyContent: opts.justify_content || 'flex-start',
                alignItems: opts.align_items || 'stretch',
                gap: opts.gap !== undefined ? `${opts.gap}px` : '16px',
                backgroundColor: opts.background_color || undefined,
                minHeight: opts.height ? `${opts.height}px` : undefined,
                paddingTop: opts.padding_top !== undefined ? `${opts.padding_top}px` : undefined,
                paddingBottom: opts.padding_bottom !== undefined ? `${opts.padding_bottom}px` : undefined,
                paddingLeft: opts.padding_left !== undefined ? `${opts.padding_left}px` : undefined,
                paddingRight: opts.padding_right !== undefined ? `${opts.padding_right}px` : undefined,
                ...partialBorderStyle,
            }}
        >
            {children}
        </div>
    );
};
