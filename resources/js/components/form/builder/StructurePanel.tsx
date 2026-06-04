import { Input } from '@/components/ui/base/Input';
import { cn } from '@/lib/utils';
import { ChevronDown, FileText, Layout, Search, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';
import { FIELD_TYPES } from './constants';

interface StructurePanelProps {
    fieldTree: any[];
    selectedFieldIds: string[];
    onSelectField: (id: string, e: React.MouseEvent) => void;
    fieldsCount: number;
    onRemoveField?: (id: string) => void;
    onRemoveAll?: () => void;
    onRemoveSelected?: () => void;
}

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

    const renderFieldTree = (item: any) => {
        const isSelected = selectedFieldIds.includes(item.id);
        const Icon = FIELD_TYPES.flatMap((c) => c.items).find((t) => t.value === item.type)?.icon || FileText;

        return (
            <div key={item.id} className="animate-in fade-in slide-in-from-left-1 duration-300">
                <div
                    className={cn(
                        'group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] transition-all',
                        isSelected
                            ? 'bg-primary/10 text-primary ring-primary/20 ring-1'
                            : 'hover:bg-muted text-muted-foreground/80 hover:text-foreground',
                    )}
                    onClick={(e) => onSelectField(item.id, e)}
                >
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center">
                        {item.children?.length > 0 ? (
                            <ChevronDown size={10} className="text-muted-foreground/40" />
                        ) : (
                            <div className="bg-muted-foreground/20 h-1 w-1 rounded-full" />
                        )}
                    </div>
                    <Icon size={12} className={cn('shrink-0', isSelected ? 'text-primary' : 'text-muted-foreground/40')} />
                    <span className={cn('flex-1 truncate font-sans font-semibold tracking-tight uppercase', isSelected && 'text-primary')}>
                        {item.label || item.type.replace('_', ' ')}
                    </span>
                    {onRemoveField && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemoveField(item.id);
                            }}
                            className="text-muted-foreground/40 hover:text-destructive rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                            <Trash2 size={10} />
                        </button>
                    )}
                    {isSelected && <div className="bg-primary h-1 w-1 rounded-full" />}
                </div>
                {item.children?.length > 0 && (
                    <div className="border-border/50 mt-0.5 ml-3.5 space-y-0.5 border-l pl-2">
                        {item.children.map((child: any) => renderFieldTree(child))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="animate-in fade-in slide-in-from-left-4 space-y-4 duration-300">
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <h3 className="text-muted-foreground/30 font-sans text-[9px] font-semibold tracking-[0.3em] uppercase">Hierarchical View</h3>
                    <span className="text-muted-foreground/20 font-sans text-[8px] font-medium uppercase">{fieldsCount} Elements</span>
                </div>

                <div className="flex items-center gap-2">
                    {onRemoveAll && fieldsCount > 0 && (
                        <button
                            type="button"
                            onClick={onRemoveAll}
                            className="bg-muted hover:bg-destructive/10 hover:text-destructive text-muted-foreground/60 flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[8px] font-black uppercase transition-all"
                        >
                            <Trash2 size={10} /> Clear All
                        </button>
                    )}
                    {onRemoveSelected && selectedFieldIds.length > 0 && (
                        <button
                            type="button"
                            onClick={onRemoveSelected}
                            className="bg-primary/5 hover:bg-primary/10 text-primary ring-primary/20 flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[8px] font-black uppercase ring-1 transition-all"
                        >
                            <X size={10} strokeWidth={3} /> Hapus Terpilih ({selectedFieldIds.length})
                        </button>
                    )}
                </div>
            </div>

            {/* Search Input */}
            <div className="relative">
                <Search size={14} className="text-muted-foreground/40 absolute top-1/2 left-3 -translate-y-1/2" />
                <Input
                    type="text"
                    placeholder="Cari struktur elemen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-muted/20 border-border focus-visible:ring-primary/20 h-9 pr-8 pl-9 font-sans text-[11px]"
                />
                {searchQuery && (
                    <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="text-muted-foreground/40 hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2"
                    >
                        <X size={12} />
                    </button>
                )}
            </div>

            <div className="space-y-1">
                {filteredTree.length === 0 ? (
                    <div className="border-muted flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-20 text-center">
                        <div className="bg-muted text-muted-foreground/20 mb-3 rounded-xl p-3">
                            <Layout size={20} />
                        </div>
                        <p className="text-muted-foreground/30 font-sans text-[10px] font-medium uppercase">
                            {searchQuery ? 'Tidak ditemukan' : 'Canvas Kosong'}
                        </p>
                    </div>
                ) : (
                    filteredTree.map((f: any) => renderFieldTree(f))
                )}
            </div>
        </div>
    );
};
