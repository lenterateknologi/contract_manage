import { cn } from '@/lib/utils';
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
                height: field.options?.height ? (typeof field.options.height === 'number' || !isNaN(Number(field.options.height)) ? `${field.options.height}px` : field.options.height) : undefined,
                minHeight: field.options?.height ? (typeof field.options.height === 'number' || !isNaN(Number(field.options.height)) ? `${field.options.height}px` : field.options.height) : undefined,
            }}
        >
            <div
                className="flex flex-wrap gap-0 h-full w-full"
                style={{
                    justifyContent: field.options?.justify_content || 'flex-start',
                    alignItems: field.options?.align_items || 'flex-start',
                    minHeight: field.options?.height ? 'inherit' : undefined,
                }}
            >
                {children}
            </div>
        </div>
    );
};
