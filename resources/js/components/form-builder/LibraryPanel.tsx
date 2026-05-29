
import { cn } from '@/lib/utils';
import { useDraggable } from '@dnd-kit/core';
import React, { useState } from 'react';
import { FIELD_TYPES } from './constants';
import { Input } from '@/components/ui/base/Input';
import { Search, X } from 'lucide-react';

interface LibraryPanelProps {
    onAddField: (type: string) => void;
}

const LibPreview = ({ type }: { type: any }) => {
    const isPreset = type.value.startsWith('preset_');

    const renderPreview = () => {
        switch (type.value) {
            case 'static_text':
                return (
                    <div className="space-y-1">
                        <div className="h-1.5 w-full rounded-full bg-muted" />
                        <div className="h-1.5 w-3/4 rounded-full bg-muted" />
                    </div>
                );
            case 'image':
                return (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50 border border-border">
                        <type.icon size={16} className="text-muted-foreground" />
                    </div>
                );
            case 'group':
                return (
                    <div className="h-10 w-full rounded-lg border-2 border-dashed border-border bg-muted/20" />
                );
            case 'grid_x':
                return (
                    <div className="grid grid-cols-2 gap-1 w-full h-10">
                        <div className="rounded border-2 border-dashed border-border bg-muted/20" />
                        <div className="rounded border-2 border-dashed border-border bg-muted/20" />
                    </div>
                );
            case 'grid_y':
                return (
                    <div className="grid grid-rows-2 gap-1 w-full h-10">
                        <div className="rounded border-2 border-dashed border-border bg-muted/20" />
                        <div className="rounded border-2 border-dashed border-border bg-muted/20" />
                    </div>
                );
            case 'page_break':
                return (
                    <div className="flex items-center gap-1 w-full">
                        <div className="h-px flex-1 bg-border border-t border-dashed" />
                        <type.icon size={12} className="text-muted-foreground" />
                        <div className="h-px flex-1 bg-border border-t border-dashed" />
                    </div>
                );
            case 'labeled_value':
                return (
                    <div className="flex items-center gap-2 w-full">
                        <div className="h-1.5 w-8 rounded-full bg-muted" />
                        <div className="h-1.5 flex-1 rounded-full border-b border-dashed border-border" />
                    </div>
                );
            case 'textfield':
            case 'number':
            case 'date':
                return (
                    <div className="space-y-1 w-full">
                        <div className="h-1 w-12 rounded-full bg-muted" />
                        <div className="h-5 w-full rounded-md border border-border bg-muted/20" />
                    </div>
                );
            case 'textarea':
                return (
                    <div className="space-y-1 w-full">
                        <div className="h-1 w-16 rounded-full bg-muted" />
                        <div className="h-8 w-full rounded-md border border-border bg-muted/20" />
                    </div>
                );
            case 'searchable_select':
                return (
                    <div className="space-y-1 w-full">
                        <div className="h-1 w-14 rounded-full bg-muted" />
                        <div className="flex h-6 w-full items-center justify-between rounded-md border border-border bg-muted/20 px-1.5">
                            <div className="h-1 w-10 rounded-full bg-muted" />
                            <div className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                        </div>
                    </div>
                );
            case 'preset_header_Style_01':
                return (
                    <div className="space-y-1.5 w-full">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded bg-slate-200" />
                            <div className="space-y-1 flex-1">
                                <div className="h-1.5 w-full rounded-full bg-slate-300" />
                                <div className="h-1 w-2/3 rounded-full bg-slate-200" />
                            </div>
                        </div>
                        <div className="h-0.5 w-full bg-slate-300" />
                    </div>
                );
            case 'preset_header_Style_02':
                return (
                    <div className="space-y-1.5 w-full">
                        <div className="flex flex-col items-center gap-1">
                            <div className="h-1.5 w-2/3 rounded-full bg-slate-300" />
                            <div className="h-1 w-1/2 rounded-full bg-slate-200" />
                        </div>
                        <div className="h-0.5 w-full bg-slate-300" />
                    </div>
                );
            case 'preset_content_opening':
                return (
                    <div className="space-y-1 w-full">
                        <div className="h-1 w-full rounded-full bg-slate-300" />
                        <div className="h-1 w-full rounded-full bg-slate-200" />
                        <div className="h-1 w-2/3 rounded-full bg-slate-200" />
                    </div>
                );
            case 'preset_party_block':
                return (
                    <div className="space-y-1 w-full">
                        <div className="h-2 w-1/3 rounded-full bg-slate-300 mb-1" />
                        <div className="flex items-center gap-2">
                            <div className="h-1 w-8 rounded-full bg-slate-200" />
                            <div className="h-1 flex-1 rounded-full border-b border-dashed border-slate-300" />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-1 w-8 rounded-full bg-slate-200" />
                            <div className="h-1 flex-1 rounded-full border-b border-dashed border-slate-300" />
                        </div>
                    </div>
                );
            case 'preset_party_block_double':
                return (
                    <div className="grid grid-cols-2 gap-2 w-full">
                        <div className="space-y-1">
                            <div className="h-1.5 w-full rounded-full bg-slate-300" />
                            <div className="h-1 w-full rounded-full bg-slate-200" />
                        </div>
                        <div className="space-y-1">
                            <div className="h-1.5 w-full rounded-full bg-slate-300" />
                            <div className="h-1 w-full rounded-full bg-slate-200" />
                        </div>
                    </div>
                );
            case 'preset_content_commercial':
                return (
                    <div className="space-y-1.5 w-full">
                        <div className="h-2 w-3/4 rounded-full bg-slate-300 mb-1" />
                        <div className="space-y-1">
                            <div className="h-1 w-full rounded-full bg-slate-200" />
                            <div className="h-1 w-full rounded-full bg-slate-200" />
                            <div className="h-1 w-2/3 rounded-full bg-slate-200" />
                        </div>
                    </div>
                );
            default:
                return <type.icon size={16} className="text-muted-foreground" />;
        }
    };

    return (
        <div className={cn(
            'flex flex-col items-center justify-center p-3 h-20 w-full overflow-hidden bg-muted/20 rounded-lg group-hover:bg-primary/5 transition-colors',
            isPreset ? 'border border-primary/10 bg-primary/5' : ''
        )}>
            {renderPreview()}
        </div>
    );
};

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
                'group hover:border-primary/20 flex flex-col cursor-grab rounded-xl border border-transparent bg-card p-2 shadow-sm transition-all hover:shadow-md active:cursor-grabbing',
                isDragging && 'opacity-50 grayscale',
            )}
        >
            <LibPreview type={type} />
            <div className="mt-2 flex flex-col px-1">
                <span className="text-foreground group-hover:text-primary font-sans text-[9px] font-semibold tracking-tight leading-tight uppercase transition-colors">
                    {type.label}
                </span>
                <span className="text-muted-foreground/30 font-sans text-[7px] font-semibold uppercase">Element</span>
            </div>
        </div>
    );
};

export const LibraryPanel: React.FC<LibraryPanelProps> = ({ onAddField }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCategories = FIELD_TYPES.map((cat: any) => {
        const filteredItems = cat.items.filter(
            (item: any) =>
                item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.value.toLowerCase().includes(searchQuery.toLowerCase()),
        );
        return { ...cat, items: filteredItems };
    }).filter((cat: any) => cat.items.length > 0);

    return (
        <div className="animate-in fade-in slide-in-from-left-4 space-y-6 pb-12 duration-300">
            {/* Search Input */}
            <div className="relative">
                <Search size={14} className="text-muted-foreground/40 absolute top-1/2 left-3 -translate-y-1/2" />
                <Input
                    type="text"
                    placeholder="Cari elemen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 pl-9 pr-8 text-[11px] font-sans bg-muted/20 border-border focus-visible:ring-primary/20"
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

            {filteredCategories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground/40 font-sans text-[10px] uppercase font-semibold">
                    Elemen tidak ditemukan
                </div>
            ) : (
                filteredCategories.map((cat: any) => (
                    <div key={cat.category} className="space-y-4">
                        <h3 className="text-muted-foreground/30 flex items-center gap-2 font-sans text-[9px] font-semibold tracking-[0.3em] uppercase">
                            <div className={cn('h-1 w-3 rounded-full', cat.color)} />
                            {cat.category}
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {cat.items.map((type: any) => (
                                <LibDraggable key={type.value} type={type} color={cat.color} onClick={() => onAddField(type.value)} />
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};
