import React from 'react';
import { cn } from '@/lib/utils';
import { FIELD_TYPES } from './constants';
import { ChevronDown, FileText, Layout } from 'lucide-react';

interface StructurePanelProps {
    fieldTree: any[];
    selectedFieldIds: string[];
    onSelectField: (id: string, e: React.MouseEvent) => void;
    fieldsCount: number;
}

export const StructurePanel: React.FC<StructurePanelProps> = ({ 
    fieldTree, 
    selectedFieldIds, 
    onSelectField,
    fieldsCount
}) => {
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
                    <span className={cn('flex-1 truncate font-semibold font-sans tracking-tight uppercase', isSelected && 'text-primary')}>
                        {item.label || item.type.replace('_', ' ')}
                    </span>
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
        <div className="animate-in fade-in slide-in-from-left-4 space-y-6 duration-300">
            <div className="flex items-center justify-between">
                <h3 className="text-muted-foreground/30 text-[9px] font-semibold font-sans tracking-[0.3em] uppercase">
                    Hierarchical View
                </h3>
                <span className="text-muted-foreground/20 text-[8px] font-medium font-sans uppercase">
                    {fieldsCount} Elements
                </span>
            </div>
            <div className="space-y-1">
                {fieldTree.length === 0 ? (
                    <div className="border-muted flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-20 text-center">
                        <div className="bg-muted text-muted-foreground/20 mb-3 rounded-xl p-3">
                            <Layout size={20} />
                        </div>
                        <p className="text-muted-foreground/30 text-[10px] font-medium font-sans tracking-widest uppercase">
                            Canvas Kosong
                        </p>
                    </div>
                ) : (
                    fieldTree.map((f: any) => renderFieldTree(f))
                )}
            </div>
        </div>
    );
};
