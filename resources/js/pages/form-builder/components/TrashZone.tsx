import { cn } from '@/lib/utils';
import { useDroppable } from '@dnd-kit/core';
import { Trash2 } from 'lucide-react';

export const TrashZone = () => {
    const { setNodeRef, isOver } = useDroppable({ id: 'trash-zone' });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                'fixed bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-2xl border-2 border-dashed px-8 py-4 transition-all duration-300',
                isOver
                    ? 'border-destructive bg-destructive/10 text-destructive shadow-destructive/20 scale-110 shadow-2xl'
                    : 'border-border bg-card text-muted-foreground translate-y-20 opacity-0',
            )}
        >
            <Trash2 size={24} className={cn(isOver && 'animate-bounce')} />
            <div>
                <p className="font-sans text-[10px] font-semibold tracking-[0.2em] uppercase">Lepas untuk menghapus</p>
                <p className="text-[8px] font-bold uppercase opacity-60">Elemen akan dihapus permanen</p>
            </div>
        </div>
    );
};
