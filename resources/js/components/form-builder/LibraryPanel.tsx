import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { FIELD_TYPES } from './constants';
import { ScrollArea } from '@/components/ui/base/ScrollArea';

interface LibraryPanelProps {
    onAddField: (type: string) => void;
}

const LibDraggable = ({ type, color, onClick }: { type: any; color: string; onClick: () => void }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `lib-${type.value}`,
        data: { type: type.value, isLibraryItem: true },
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            onClick={onClick}
            className={cn(
                'group flex cursor-grab items-center gap-2 rounded-xl border border-transparent bg-white p-2 shadow-sm transition-all active:cursor-grabbing hover:border-primary/20 hover:shadow-md',
                isDragging && 'opacity-50 grayscale',
            )}
        >
            <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-lg', color)}>
                <type.icon size={16} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] font-black tracking-tight text-slate-800 uppercase">{type.label}</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Element</span>
            </div>
        </div>
    );
};

export const LibraryPanel: React.FC<LibraryPanelProps> = ({ onAddField }) => {
    return (
        <div className="animate-in fade-in slide-in-from-left-4 space-y-8 pb-12 duration-300">
            {FIELD_TYPES.map((cat: any) => (
                <div key={cat.category} className="space-y-4">
                    <h3 className="text-muted-foreground/30 flex items-center gap-2 text-[9px] font-black tracking-[0.3em] uppercase">
                        <div className={cn('h-1 w-3 rounded-full', cat.color)} />
                        {cat.category}
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                        {cat.items.map((type: any) => (
                            <LibDraggable
                                key={type.value}
                                type={type}
                                color={cat.color}
                                onClick={() => onAddField(type.value)}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};
