import { Input } from '@/components/ui/inputs/Input';
import { cn } from '@/lib/utils';
import { useDraggable } from '@dnd-kit/core';
import { Layout, Search, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';
import { FIELD_TYPES } from './constants';

interface LibraryPanelProps {
    onAddField: (type: string) => void;
    customPresets?: { value: string; label: string; fields: any[] }[];
    onRemoveCustomPreset?: (value: string) => void;
}

const LibPreview = ({ type, cat }: { type: any, cat?: any }) => {
    return <type.icon size={16} className="text-muted-foreground" />;
};

const DraggableField = ({
    type,
    cat,
    onAddField,
    onRemoveCustomPreset,
}: {
    type: any;
    cat: any;
    onAddField: (type: string) => void;
    onRemoveCustomPreset?: (value: string) => void;
}) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `lib-${type.value}`,
        data: { type: type.value, fromLibrary: true },
    });

    const isCustom = type.value.startsWith('custom_preset_');

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            onDoubleClick={() => onAddField(type.value)}
            className={cn(
                'group flex cursor-grab items-center gap-2 rounded-lg border border-slate-200/80 dark:border-zinc-800 p-1.5 transition-all active:cursor-grabbing hover:shadow-xs hover:border-primary/50 select-none bg-white dark:bg-zinc-900',
                isDragging && 'opacity-50 grayscale',
            )}
        >
            <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white shadow-xs", cat.color)}>
                <type.icon size={13} />
            </div>
            <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 block truncate leading-tight">
                    {type.label}
                </span>
            </div>
            {isCustom && onRemoveCustomPreset && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemoveCustomPreset(type.value);
                    }}
                    className="text-slate-400 hover:text-rose-500 p-1 rounded transition-colors opacity-0 group-hover:opacity-100 z-10"
                    title="Hapus Preset Kustom"
                >
                    <Trash2 size={12} />
                </button>
            )}
        </div>
    );
};

export const LibraryPanel: React.FC<LibraryPanelProps> = ({ onAddField, customPresets = [], onRemoveCustomPreset }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const allCategories = React.useMemo(() => {
        const list = [...FIELD_TYPES];
        if (customPresets.length > 0) {
            list.push({
                category: 'Preset Kustom Anda (Saved Presets)',
                color: 'bg-amber-500',
                textColor: 'text-amber-600',
                borderColor: 'border-amber-200 hover:border-amber-400',
                bgColor: 'bg-amber-50/50 hover:bg-amber-50',
                items: customPresets.map((p) => ({
                    value: p.value,
                    label: p.label,
                    icon: Layout,
                    defaultLabel: p.label,
                })),
            });
        }
        return list;
    }, [customPresets]);

    const filteredCategories = allCategories.map((cat: any) => {
        const filteredItems = cat.items.filter(
            (item: any) =>
                item.label.toLowerCase().includes(searchQuery.toLowerCase()) || item.value.toLowerCase().includes(searchQuery.toLowerCase()),
        );
        return { ...cat, items: filteredItems };
    }).filter((cat: any) => cat.items.length > 0);

    return (
        <div className="animate-in fade-in slide-in-from-left-4 space-y-5 pb-12 duration-300">
            {/* Search Input */}
            <div className="relative">
                <Search size={14} className="text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" />
                <Input
                    type="text"
                    placeholder="Cari elemen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 pr-8 pl-9 font-sans text-xs rounded-xl border-slate-200 dark:border-zinc-800"
                />
                {searchQuery && (
                    <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="text-slate-400 hover:text-slate-600 absolute top-1/2 right-2.5 -translate-y-1/2"
                    >
                        <X size={12} />
                    </button>
                )}
            </div>

            {filteredCategories.length === 0 ? (
                <div className="text-slate-400 py-8 text-center font-sans text-xs font-semibold uppercase">Elemen tidak ditemukan</div>
            ) : (
                filteredCategories.map((cat: any) => (
                    <div key={cat.category} className="space-y-2.5">
                        <h3 className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-sans text-[10px] font-bold uppercase tracking-wider">
                            <div className={cn('h-1.5 w-1.5 rounded-full', cat.color || 'bg-primary')} />
                            {cat.category}
                        </h3>
                        <div className="grid grid-cols-1 gap-1.5">
                            {cat.items.map((type: any) => (
                                <DraggableField 
                                    key={type.value} 
                                    type={type} 
                                    cat={cat} 
                                    onAddField={onAddField} 
                                    onRemoveCustomPreset={onRemoveCustomPreset}
                                />
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};
