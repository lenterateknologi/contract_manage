import { cn } from '@/lib/utils';
import { useDroppable } from '@dnd-kit/core';
import { LucideIcon } from 'lucide-react';
import React from 'react';

interface PlaceholderZoneProps {
    id?: string;
    icon: LucideIcon;
    label: string;
    description?: string;
    className?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
}

export const PlaceholderZone: React.FC<PlaceholderZoneProps> = ({ id, icon: Icon, label, description, className, style, onClick }) => {
    const { setNodeRef, isOver } = id ? useDroppable({ id }) : { setNodeRef: undefined, isOver: false };

    return (
        <div
            ref={setNodeRef}
            onClick={onClick}
            style={{ width: '100%', ...style }}
            className={cn(
                'bg-primary/5 text-primary/40 flex cursor-pointer flex-col items-center justify-center rounded-lg p-4 text-center transition-all',
                isOver ? 'bg-primary/10 text-primary scale-[0.98]' : 'hover:bg-primary/10',
                className,
            )}
        >
            <Icon size={16} className={cn('mb-1', isOver ? 'text-primary' : 'text-primary/30')} />
            <span className="text-[9px] font-semibold  uppercase">{label}</span>
            {description && <span className="mt-0.5 text-[7px] opacity-60">{description}</span>}
        </div>
    );
};
