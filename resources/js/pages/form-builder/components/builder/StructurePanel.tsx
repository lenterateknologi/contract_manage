import { Input } from '@/components/ui/inputs/Input';
import { cn } from '@/lib/utils';
import { ChevronDown, FileText, Layout, Search, Trash2, X, GripVertical } from 'lucide-react';
import React, { useState } from 'react';
import { FIELD_TYPES } from './constants';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface StructurePanelProps {
    fieldTree: any[];
    selectedFieldIds: string[];
    onSelectField: (id: string, e: React.MouseEvent) => void;
    fieldsCount: number;
    onRemoveField?: (id: string) => void;
    onRemoveAll?: () => void;
    onRemoveSelected?: () => void;
}

const SortableStructureNode = ({ item, selectedFieldIds, onSelectField, onRemoveField }: any) => {
    const isSelected = selectedFieldIds.includes(item.id);
    const Icon = FIELD_TYPES.flatMap((c) => c.items).find((t) => t.value === item.type)?.icon || FileText;

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `struct_${item.id}`,
        data: {
            type: 'StructureNode',
            field: item,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="animate-in fade-in slide-in-from-left-1 duration-200">
            <div
                className={cn(
                    'group flex items-center gap-1.5 rounded px-1.5 py-1 text-[10px] transition-all select-none',
                    isSelected
                        ? 'bg-primary/10 text-primary font-bold ring-primary/20 ring-1'
                        : 'hover:bg-muted/70 text-muted-foreground hover:text-foreground',
                )}
            >
                {/* Drag Handle */}
                <div 
                    {...attributes} 
                    {...listeners} 
                    className="flex cursor-grab active:cursor-grabbing items-center justify-center opacity-0 group-hover:opacity-60 transition-opacity"
                >
                    <GripVertical size={10} />
                </div>
                
                <div 
                    className="flex flex-1 items-center gap-1.5 cursor-pointer min-w-0"
                    onClick={(e) => onSelectField(item.id, e)}
                >
                    <Icon size={12} className={cn('shrink-0', isSelected ? 'text-primary' : 'text-muted-foreground/60')} />
                    <span className={cn('flex-1 truncate font-sans text-[10px] uppercase tracking-tight', isSelected && 'text-primary')}>
                        {item.label || item.type.replace('_', ' ')}
                    </span>
                    {onRemoveField && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemoveField(item.id);
                            }}
                            className="text-muted-foreground/40 hover:text-destructive rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100 z-10 shrink-0"
                        >
                            <Trash2 size={10} />
                        </button>
                    )}
                </div>
            </div>
            {item.children?.length > 0 && (
                <div className="border-border/40 ml-2.5 space-y-0.5 border-l pl-1.5 pt-0.5">
                    <SortableContext items={item.children.map((c: any) => `struct_${c.id}`)} strategy={verticalListSortingStrategy}>
                        {item.children.map((child: any) => (
                            <SortableStructureNode
                                key={child.id}
                                item={child}
                                selectedFieldIds={selectedFieldIds}
                                onSelectField={onSelectField}
                                onRemoveField={onRemoveField}
                            />
                        ))}
                    </SortableContext>
                </div>
            )}
        </div>
    );
};

export const StructurePanel: React.FC<StructurePanelProps> = ({
    fieldTree,
    selectedFieldIds,
    onSelectField,
    fieldsCount,
    onRemoveField,
    onRemoveAll,
    onRemoveSelected,
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filterTree = (nodes: any[]): any[] => {
        return nodes
            .map((node) => {
                const matches =
                    (node.label || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (node.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (node.type || '').toLowerCase().includes(searchQuery.toLowerCase());

                const filteredChildren = node.children ? filterTree(node.children) : [];

                if (matches || filteredChildren.length > 0) {
                    return { ...node, children: filteredChildren };
                }
                return null;
            })
            .filter(Boolean);
    };

    const filteredTree = searchQuery ? filterTree(fieldTree) : fieldTree;

    return (
        <div className="animate-in fade-in slide-in-from-left-4 space-y-2.5 duration-200">
            {/* Action Header */}
            <div className="flex items-center justify-between gap-1 pb-1 border-b border-border/50">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    Total: {fieldsCount}
                </span>
                <div className="flex items-center gap-1">
                    {onRemoveAll && fieldsCount > 0 && (
                        <button
                            type="button"
                            onClick={onRemoveAll}
                            className="px-1.5 py-0.5 text-[8px] font-bold uppercase rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                            Reset
                        </button>
                    )}
                    {onRemoveSelected && selectedFieldIds.length > 0 && (
                        <button
                            type="button"
                            onClick={onRemoveSelected}
                            className="px-1.5 py-0.5 text-[8px] font-bold uppercase rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                            Hapus ({selectedFieldIds.length})
                        </button>
                    )}
                </div>
            </div>

            {/* Search Input */}
            <div className="relative">
                <Search size={12} className="text-slate-400 absolute top-1/2 left-2.5 -translate-y-1/2" />
                <Input
                    type="text"
                    placeholder="Cari..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-7 pr-7 pl-8 font-sans text-[10px] rounded-lg border-slate-200 dark:border-zinc-800"
                />
                {searchQuery && (
                    <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="text-slate-400 hover:text-slate-600 absolute top-1/2 right-2 -translate-y-1/2"
                    >
                        <X size={10} />
                    </button>
                )}
            </div>

            <div className="space-y-0.5">
                {filteredTree.length === 0 ? (
                    <div className="border-border/60 flex flex-col items-center justify-center rounded-xl border border-dashed py-8 text-center">
                        <p className="text-muted-foreground font-sans text-[10px] font-semibold uppercase">
                            {searchQuery ? 'Tidak ditemukan' : 'Kosong'}
                        </p>
                    </div>
                ) : (
                    <SortableContext items={filteredTree.map((f: any) => `struct_${f.id}`)} strategy={verticalListSortingStrategy}>
                        {filteredTree.map((f: any) => (
                            <SortableStructureNode
                                key={f.id}
                                item={f}
                                selectedFieldIds={selectedFieldIds}
                                onSelectField={onSelectField}
                                onRemoveField={onRemoveField}
                            />
                        ))}
                    </SortableContext>
                )}
            </div>
        </div>
    );
};
