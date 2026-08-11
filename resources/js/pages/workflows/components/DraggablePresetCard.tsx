import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Bookmark, PlusCircle, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { APPROVER_TYPE_STYLES } from '../constants/workflowConstants';

interface DraggablePresetCardProps {
    preset: any;
    onApply: (preset: any) => void;
    onDelete: (preset: any) => void;
}

export function DraggablePresetCard({ preset, onApply, onDelete }: DraggablePresetCardProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `preset-${preset.id}`,
        data: {
            type: 'preset',
            preset,
        },
    });

    const style = transform
        ? {
              transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
          }
        : undefined;

    const stepData = preset.step_data || {};
    const approverType = stepData.approver_type || 'role';

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={cn(
                'group relative flex flex-col gap-3 transition-all duration-300 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 hover:border-primary/80 hover:bg-white dark:hover:bg-slate-900/60 rounded-lg p-3.5 cursor-grab active:cursor-grabbing select-none',
                isDragging && 'opacity-60 border-primary ring-2 ring-primary/40 z-50'
            )}
        >
            {/* Header Row */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 transition-colors">
                        <GripVertical size={14} />
                    </div>
                    <div className="border-primary/20 bg-primary/10 text-primary dark:text-primary-400 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border font-bold">
                        <Bookmark size={14} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {preset.name}
                        </span>
                        {stepData.name && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                {stepData.name}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onApply(preset);
                        }}
                        className="h-7 w-7 inline-flex items-center justify-center bg-primary hover:bg-primary/90 text-white rounded-lg transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
                        title="Gunakan Preset Ini"
                    >
                        <PlusCircle size={15} />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(preset);
                        }}
                        className="h-7 w-7 inline-flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-800 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Preset"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>

            {/* Step Actions Preview */}
            {stepData.actions && stepData.actions.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/60">
                    {stepData.actions.map((act: any, aIdx: number) => {
                        const label = act.label || act.master_action?.label || act.master_action?.code || 'Action';
                        return (
                            <span
                                key={aIdx}
                                className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 dark:text-slate-300 uppercase border border-slate-200/60 dark:border-slate-700/60"
                            >
                                {label}
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
