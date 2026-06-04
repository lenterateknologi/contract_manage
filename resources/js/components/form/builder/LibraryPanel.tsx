import { Input } from '@/components/ui/base/Input';
import { cn } from '@/lib/utils';
import { useDraggable } from '@dnd-kit/core';
import { Search, X } from 'lucide-react';
import React, { useState } from 'react';
import { FIELD_TYPES } from './constants';

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
                        <div className="bg-muted h-1.5 w-full rounded-full" />
                        <div className="bg-muted h-1.5 w-3/4 rounded-full" />
                    </div>
                );
            case 'image':
                return (
                    <div className="bg-muted/50 border-border flex h-10 w-10 items-center justify-center rounded-lg border">
                        <type.icon size={16} className="text-muted-foreground" />
                    </div>
                );
            case 'group':
                return <div className="border-border bg-muted/20 h-10 w-full rounded-lg border-2 border-dashed" />;
            case 'grid_x':
                return (
                    <div className="grid h-10 w-full grid-cols-2 gap-1">
                        <div className="border-border bg-muted/20 rounded border-2 border-dashed" />
                        <div className="border-border bg-muted/20 rounded border-2 border-dashed" />
                    </div>
                );
            case 'grid_y':
                return (
                    <div className="grid h-10 w-full grid-rows-2 gap-1">
                        <div className="border-border bg-muted/20 rounded border-2 border-dashed" />
                        <div className="border-border bg-muted/20 rounded border-2 border-dashed" />
                    </div>
                );
            case 'page_break':
                return (
                    <div className="flex w-full items-center gap-1">
                        <div className="bg-border h-px flex-1 border-t border-dashed" />
                        <type.icon size={12} className="text-muted-foreground" />
                        <div className="bg-border h-px flex-1 border-t border-dashed" />
                    </div>
                );
            case 'labeled_value':
                return (
                    <div className="flex w-full items-center gap-2">
                        <div className="bg-muted h-1.5 w-8 rounded-full" />
                        <div className="border-border h-1.5 flex-1 rounded-full border-b border-dashed" />
                    </div>
                );
            case 'textfield':
            case 'number':
            case 'date':
                return (
                    <div className="w-full space-y-1">
                        <div className="bg-muted h-1 w-12 rounded-full" />
                        <div className="border-border bg-muted/20 h-5 w-full rounded-md border" />
                    </div>
                );
            case 'textarea':
                return (
                    <div className="w-full space-y-1">
                        <div className="bg-muted h-1 w-16 rounded-full" />
                        <div className="border-border bg-muted/20 h-8 w-full rounded-md border" />
                    </div>
                );
            case 'searchable_select':
                return (
                    <div className="w-full space-y-1">
                        <div className="bg-muted h-1 w-14 rounded-full" />
                        <div className="border-border bg-muted/20 flex h-6 w-full items-center justify-between rounded-md border px-1.5">
                            <div className="bg-muted h-1 w-10 rounded-full" />
                            <div className="bg-muted-foreground/40 h-1 w-1 rounded-full" />
                        </div>
                    </div>
                );
            case 'preset_header_Style_01':
                return (
                    <div className="w-full space-y-1.5">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded bg-slate-200" />
                            <div className="flex-1 space-y-1">
                                <div className="h-1.5 w-full rounded-full bg-slate-300" />
                                <div className="h-1 w-2/3 rounded-full bg-slate-200" />
                            </div>
                        </div>
                        <div className="h-0.5 w-full bg-slate-300" />
                    </div>
                );
            case 'preset_header_Style_02':
                return (
                    <div className="w-full space-y-1.5">
                        <div className="flex flex-col items-center gap-1">
                            <div className="h-1.5 w-2/3 rounded-full bg-slate-300" />
                            <div className="h-1 w-1/2 rounded-full bg-slate-200" />
                        </div>
                        <div className="h-0.5 w-full bg-slate-300" />
                    </div>
                );
            case 'preset_content_opening':
                return (
                    <div className="w-full space-y-1">
                        <div className="h-1 w-full rounded-full bg-slate-300" />
                        <div className="h-1 w-full rounded-full bg-slate-200" />
                        <div className="h-1 w-2/3 rounded-full bg-slate-200" />
                    </div>
                );
            case 'preset_party_block':
                return (
                    <div className="w-full space-y-1">
                        <div className="mb-1 h-2 w-1/3 rounded-full bg-slate-300" />
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
                    <div className="grid w-full grid-cols-2 gap-2">
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
                    <div className="w-full space-y-1.5">
                        <div className="mb-1 h-2 w-3/4 rounded-full bg-slate-300" />
                        <div className="space-y-1">
                            <div className="h-1 w-full rounded-full bg-slate-200" />
                            <div className="h-1 w-full rounded-full bg-slate-200" />
                            <div className="h-1 w-2/3 rounded-full bg-slate-200" />
                        </div>
                    </div>
                );
            case 'preset_header_logo_info':
                return (
                    <div className="w-full space-y-1.5">
                        <div className="flex overflow-hidden rounded border border-slate-300/50">
                            <div className="flex w-8 shrink-0 items-center justify-center bg-slate-200/50">
                                <div className="h-6 w-5 rounded-sm bg-slate-300" />
                            </div>
                            <div className="flex-1 space-y-0.5 border-l border-slate-300/50 p-1">
                                {['NOMOR', 'TOPIK', 'SUB TOPIK', 'LAMPIRAN'].map((l) => (
                                    <div key={l} className="flex items-center gap-1">
                                        <div className="h-1 w-7 rounded-full bg-slate-300" />
                                        <div className="h-px flex-1 border-b border-dashed border-slate-300" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'preset_header_info_only':
                return (
                    <div className="w-full space-y-1.5">
                        <div className="w-full space-y-0.5 overflow-hidden rounded border border-slate-300/50 p-1">
                            {['NOMOR', 'TOPIK', 'SUB TOPIK', 'LAMPIRAN'].map((l) => (
                                <div key={l} className="flex items-center gap-1">
                                    <div className="h-1 w-7 rounded-full bg-slate-300" />
                                    <div className="h-px flex-1 border-b border-dashed border-slate-300" />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            default:
                return <type.icon size={16} className="text-muted-foreground" />;
        }
    };

    return (
        <div
            className={cn(
                'bg-muted/20 group-hover:bg-primary/5 flex h-20 w-full flex-col items-center justify-center overflow-hidden rounded-lg p-3 transition-colors',
                isPreset ? 'border-primary/10 bg-primary/5 border' : '',
            )}
        >
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
                'group hover:border-primary/20 bg-card flex cursor-grab flex-col rounded-xl border border-transparent p-2 shadow-sm transition-all hover:shadow-md active:cursor-grabbing',
                isDragging && 'opacity-50 grayscale',
            )}
        >
            <LibPreview type={type} />
            <div className="mt-2 flex flex-col px-1">
                <span className="text-foreground group-hover:text-primary font-sans text-[9px] leading-tight font-semibold tracking-tight uppercase transition-colors">
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
                item.label.toLowerCase().includes(searchQuery.toLowerCase()) || item.value.toLowerCase().includes(searchQuery.toLowerCase()),
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

            {filteredCategories.length === 0 ? (
                <div className="text-muted-foreground/40 py-8 text-center font-sans text-[10px] font-semibold uppercase">Elemen tidak ditemukan</div>
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
