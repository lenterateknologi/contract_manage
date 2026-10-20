import { Input } from '@/components/ui/inputs/Input';
import { Checkbox } from '@/components/ui/selection/Checkbox';
import { cn } from '@/lib/utils';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CheckSquare, FileText, GripVertical, Search, Square, Trash2, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { FIELD_TYPES } from './constants';

interface StructurePanelProps {
    fieldTree: any[];
    selectedFieldIds: string[];
    onSelectField: (id: string, e: React.MouseEvent) => void;
    onSetSelectedFieldIds?: React.Dispatch<React.SetStateAction<string[]>>;
    fieldsCount: number;
    onRemoveField?: (id: string) => void;
    onRemoveAll?: () => void;
    onRemoveSelected?: () => void;
}

const SortableStructureNode = ({
    item,
    selectedFieldIds,
    onSelectField,
    onToggleSelectField,
    onRemoveField,
}: any) => {
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
                        ? 'bg-primary/10 text-primary ring-primary/20 font-bold ring-1'
                        : 'hover:bg-muted/70 text-muted-foreground hover:text-foreground',
                )}
            >
                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="flex cursor-grab items-center justify-center opacity-0 transition-opacity group-hover:opacity-60 active:cursor-grabbing"
                >
                    <GripVertical size={10} />
                </div>

                {/* Checkbox for easy multi-selection */}
                {onToggleSelectField && (
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleSelectField(item.id);
                        }}
                        className="flex cursor-pointer items-center justify-center py-0.5"
                    >
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => onToggleSelectField(item.id)}
                            className="size-3 rounded-[3px] border-slate-300 dark:border-zinc-700"
                        />
                    </div>
                )}

                <div className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5" onClick={(e) => onSelectField(item.id, e)}>
                    <Icon size={12} className={cn('shrink-0', isSelected ? 'text-primary' : 'text-muted-foreground/60')} />
                    <span className={cn('flex-1 truncate font-sans text-[10px] tracking-tight uppercase', isSelected && 'text-primary')}>
                        {item.label || item.type.replace('_', ' ')}
                    </span>
                    {onRemoveField && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemoveField(item.id);
                            }}
                            className="text-muted-foreground/40 hover:text-destructive z-10 shrink-0 rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                            <Trash2 size={10} />
                        </button>
                    )}
                </div>
            </div>
            {item.children?.length > 0 && (
                <div className="border-border/40 ml-2.5 space-y-0.5 border-l pt-0.5 pl-1.5">
                    <SortableContext items={item.children.map((c: any) => `struct_${c.id}`)} strategy={verticalListSortingStrategy}>
                        {item.children.map((child: any) => (
                            <SortableStructureNode
                                key={child.id}
                                item={child}
                                selectedFieldIds={selectedFieldIds}
                                onSelectField={onSelectField}
                                onToggleSelectField={onToggleSelectField}
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
    onSetSelectedFieldIds,
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

    const filteredTree = useMemo(() => {
        return searchQuery ? filterTree(fieldTree) : fieldTree;
    }, [searchQuery, fieldTree]);

    // Flatten all visible/filtered node IDs
    const visibleFieldIds = useMemo(() => {
        const ids: string[] = [];
        const traverse = (nodes: any[]) => {
            nodes.forEach((node) => {
                if (node.id) ids.push(node.id);
                if (node.children?.length) traverse(node.children);
            });
        };
        traverse(filteredTree);
        return ids;
    }, [filteredTree]);

    // Check if all visible nodes are currently selected
    const areAllVisibleSelected =
        visibleFieldIds.length > 0 && visibleFieldIds.every((id) => selectedFieldIds.includes(id));
    const isSomeVisibleSelected =
        visibleFieldIds.some((id) => selectedFieldIds.includes(id)) && !areAllVisibleSelected;

    // Toggle select all visible nodes
    const handleToggleSelectAllVisible = () => {
        if (!onSetSelectedFieldIds) return;
        if (areAllVisibleSelected) {
            // Deselect all visible ones
            onSetSelectedFieldIds((prev) => prev.filter((id) => !visibleFieldIds.includes(id)));
        } else {
            // Select all visible ones without losing already selected outside visible (if any)
            onSetSelectedFieldIds((prev) => Array.from(new Set([...prev, ...visibleFieldIds])));
        }
    };

    // Toggle individual field selection
    const handleToggleSelectField = (id: string) => {
        if (onSetSelectedFieldIds) {
            onSetSelectedFieldIds((prev) =>
                prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
            );
        } else {
            // Fallback to onSelectField with ctrlKey simulation
            onSelectField(id, { ctrlKey: true } as any);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-left-4 space-y-2.5 duration-200">
            {/* Action Header */}
            <div className="border-border/50 flex items-center justify-between gap-1 border-b pb-1">
                <span className="text-[9px] font-bold tracking-wider text-slate-500 uppercase">Total: {fieldsCount}</span>
                <div className="flex items-center gap-1">
                    {onRemoveAll && fieldsCount > 0 && (
                        <button
                            type="button"
                            onClick={onRemoveAll}
                            className="rounded px-1.5 py-0.5 text-[8px] font-bold text-rose-500 uppercase transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                            Reset
                        </button>
                    )}
                    {onRemoveSelected && selectedFieldIds.length > 0 && (
                        <button
                            type="button"
                            onClick={onRemoveSelected}
                            className="bg-primary/10 text-primary hover:bg-primary/20 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase transition-colors"
                        >
                            Hapus ({selectedFieldIds.length})
                        </button>
                    )}
                </div>
            </div>

            {/* Search Input */}
            <div className="relative">
                <Search size={12} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-slate-400" />
                <Input
                    type="text"
                    placeholder="Cari elemen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-7 rounded-lg border-slate-200 pr-7 pl-8 font-sans text-[10px] dark:border-zinc-800"
                />
                {searchQuery && (
                    <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute top-1/2 right-2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                        <X size={10} />
                    </button>
                )}
            </div>

            {/* Select All Visible / Filtered Controller */}
            {visibleFieldIds.length > 0 && onSetSelectedFieldIds && (
                <div className="flex items-center justify-between rounded-lg border border-slate-200/70 bg-slate-50/80 px-2 py-1.5 dark:border-zinc-800 dark:bg-zinc-900/60">
                    <button
                        type="button"
                        onClick={handleToggleSelectAllVisible}
                        className="flex items-center gap-1.5 text-left text-[10px] font-semibold text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                    >
                        <Checkbox
                            checked={areAllVisibleSelected ? true : isSomeVisibleSelected ? 'indeterminate' : false}
                            onCheckedChange={handleToggleSelectAllVisible}
                            className="size-3.5 rounded-[3px] border-slate-300 dark:border-zinc-700"
                        />
                        <span className="font-sans text-[10px] tracking-tight">
                            {areAllVisibleSelected
                                ? 'Batalkan Pilih Semua'
                                : searchQuery
                                  ? `Pilih yang Tampil (${visibleFieldIds.length})`
                                  : `Pilih Semua (${visibleFieldIds.length})`}
                        </span>
                    </button>

                    {selectedFieldIds.length > 0 && (
                        <button
                            type="button"
                            onClick={() => onSetSelectedFieldIds([])}
                            className="text-[9px] font-medium text-slate-400 hover:text-rose-500"
                        >
                            Kosongkan ({selectedFieldIds.length})
                        </button>
                    )}
                </div>
            )}

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
                                onToggleSelectField={handleToggleSelectField}
                                onRemoveField={onRemoveField}
                            />
                        ))}
                    </SortableContext>
                )}
            </div>
        </div>
    );
};
