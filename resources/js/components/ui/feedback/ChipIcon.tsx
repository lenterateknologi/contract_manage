import React from 'react';
import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

export type ChipIconSize = 'xs' | 'sm' | 'md' | 'lg';
export type ChipIconShape = 'rounded' | 'circle' | 'square';

export interface ChipIconProps extends React.HTMLAttributes<HTMLDivElement> {
    icon?: LucideIcon | React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
    children?: React.ReactNode;
    size?: ChipIconSize;
    shape?: ChipIconShape;
    bg?: string;
    iconSize?: number;
    strokeWidth?: number;
}

const SIZE_CONFIG: Record<ChipIconSize, { container: string; iconSize: number }> = {
    xs: { container: 'h-5 w-5', iconSize: 11 },
    sm: { container: 'h-6 w-6', iconSize: 13 },
    md: { container: 'h-7 w-7', iconSize: 14 },
    lg: { container: 'h-8 w-8', iconSize: 16 },
};

const SHAPE_CONFIG: Record<ChipIconShape, string> = {
    rounded: 'rounded-md',
    circle: 'rounded-full',
    square: 'rounded-none',
};

/**
 * Standardized ChipIcon component for uniform size, shape, and crisp white icon rendering across the app.
 */
export function ChipIcon({
    icon: IconComponent,
    children,
    size = 'md',
    shape = 'rounded',
    bg = 'bg-primary',
    iconSize,
    strokeWidth = 2.2,
    className,
    style,
    ...props
}: ChipIconProps) {
    const config = SIZE_CONFIG[size] || SIZE_CONFIG.md;
    const shapeClass = SHAPE_CONFIG[shape] || SHAPE_CONFIG.rounded;
    const finalIconSize = iconSize ?? config.iconSize;

    return (
        <div
            className={cn(
                'flex shrink-0 items-center justify-center font-bold text-white shadow-none transition-transform select-none',
                config.container,
                shapeClass,
                bg,
                className,
            )}
            style={style}
            {...props}
        >
            {IconComponent ? (
                <IconComponent size={finalIconSize} strokeWidth={strokeWidth} className="shrink-0 text-white" />
            ) : (
                children
            )}
        </div>
    );
}

export default ChipIcon;
