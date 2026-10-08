import { cn } from '@/lib/utils';
import { useDraggable } from '@dnd-kit/core';
import { Bookmark, GripVertical, Pencil, PlusCircle, Trash2 } from 'lucide-react';

interface DraggablePresetCardProps {
    preset: any;
    onApply: (preset: any) => void;
    onEdit?: (preset: any) => void;
    onDelete: (preset: any) => void;
}

export function DraggablePresetCard({ preset, onApply, onEdit, onDelete }: DraggablePresetCardProps) {
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
    const subtitle = stepData.description || stepData.name || stepData.label;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={cn(
                'group hover:border-primary/80 relative flex cursor-grab flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3.5 transition-all duration-300 select-none hover:bg-white active:cursor-grabbing dark:border-slate-800 dark:bg-slate-900/40 dark:hover:bg-slate-900/60',
                isDragging && 'border-primary ring-primary/40 z-50 opacity-60 ring-2',
            )}
        >
            {/* Header Row */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                    <div className="text-slate-300 transition-colors group-hover:text-slate-500 dark:text-slate-600">
                        <GripVertical size={14} />
                    </div>
                    <div className="border-primary/20 bg-primary/10 text-primary dark:text-primary-400 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border font-bold">
                        <Bookmark size={14} />
                    </div>
                    <div className="flex min-w-0 flex-col">
                        <span className="truncate text-xs font-bold text-slate-800 dark:text-slate-200">{preset.name}</span>
                        {subtitle && <span className="truncate text-[10px] text-slate-500 dark:text-slate-400">{subtitle}</span>}
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onApply(preset);
                        }}
                        className="bg-primary hover:bg-primary/90 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-white shadow-2xs transition-all hover:scale-105 active:scale-95"
                        title="Gunakan Preset Ini"
                    >
                        <PlusCircle size={15} />
                    </button>
                    {onEdit && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(preset);
                            }}
                            className="hover:text-primary hover:bg-primary/10 hover:border-primary/40 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-colors dark:border-slate-800"
                            title="Ubah Preset"
                        >
                            <Pencil size={12} />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(preset);
                        }}
                        className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-rose-800 dark:border-slate-800 dark:hover:bg-rose-950/40"
                        title="Hapus Preset"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>

            {/* Step Actions Preview */}
            {stepData.actions && stepData.actions.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-1.5 dark:border-slate-800/60">
                    {stepData.actions.map((act: any, aIdx: number) => {
                        const label = act.label || act.master_action?.label || act.master_action?.code || 'Action';
                        return (
                            <span
                                key={aIdx}
                                className="inline-flex items-center gap-1 rounded border border-slate-200/60 bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 uppercase dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-300"
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
