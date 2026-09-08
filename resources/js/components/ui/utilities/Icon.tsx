import React from 'react';
import { cn } from '@/lib/utils';
import { getIcon, type IconName } from '@/components/ui/icons';
import { type LucideIcon, type LucideProps } from 'lucide-react';

interface IconProps extends Omit<LucideProps, 'ref'> {
    iconNode?: React.ComponentType<LucideProps>;
    name?: IconName | string;
    fallback?: LucideIcon;
}

export function Icon({ iconNode, name, fallback, className, ...props }: IconProps) {
    const Component = iconNode || (name ? getIcon(name, fallback) : null);
    if (!Component) return null;
    return <Component className={cn('h-4 w-4 shrink-0', className)} {...props} />;
}

