import React from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/base/ScrollArea';
import { InteractiveForm } from '@/components/form-renderer/InteractiveForm';
import { Edit3, Play, Eye } from 'lucide-react';

interface CanvasAreaProps {
    viewMode: 'editor' | 'filling' | 'pdf';
    setViewMode: (mode: 'editor' | 'filling' | 'pdf') => void;
    data: any;
    previewData: any;
    updatePreviewData: (name: string, value: any) => void;
    selectedFieldIds: string[];
    handleSelectField: (id: string, e?: React.MouseEvent) => void;
    moveField: (id: string, dir: 'up' | 'down') => void;
    removeField: (id: string) => void;
    duplicateField: (id: string) => void;
}

export const CanvasArea: React.FC<CanvasAreaProps> = ({
    viewMode,
    setViewMode,
    data,
    previewData,
    updatePreviewData,
    selectedFieldIds,
    handleSelectField,
    moveField,
    removeField,
    duplicateField,
}) => {
    return (
        <section className="relative flex flex-1 flex-col overflow-hidden bg-slate-50/30">
            {/* STICKY VIEW TABS */}
            <div className="border-border bg-card/80 sticky top-0 z-30 flex h-[60px] w-full shrink-0 items-center justify-center border-b shadow-sm backdrop-blur-md">
                <div className="bg-muted/30 ring-border/20 flex gap-1.5 rounded-2xl p-1.5 ring-1">
                    {[
                        { id: 'editor', label: 'Visual Editor', icon: Edit3 },
                        { id: 'filling', label: 'Interactive Form', icon: Play },
                        { id: 'pdf', label: 'PDF Preview', icon: Eye },
                    ].map((mode) => (
                        <button
                            key={mode.id}
                            type="button"
                            onClick={() => setViewMode(mode.id as any)}
                            className={cn(
                                'flex items-center gap-2.5 rounded-xl px-5 py-2 transition-all duration-300',
                                viewMode === mode.id
                                    ? 'bg-card ring-border/50 z-10 scale-105 shadow-lg ring-1 text-black'
                                    : 'text-muted-foreground/30 hover:text-foreground/60 hover:bg-muted/20',
                            )}
                        >
                            <mode.icon size={14} strokeWidth={2.5} />
                            <span className="text-[10px] font-semibold font-sans tracking-[0.1em] uppercase">{mode.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <ScrollArea className="flex-1 bg-slate-900/10">
                <div
                    className="flex min-h-full cursor-default items-start justify-center px-12 py-12"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            handleSelectField('', e);
                        }
                    }}
                >
                    <div
                        className={cn(
                            'animate-in fade-in zoom-in-95 relative w-full max-w-[210mm] transition-all duration-500',
                            viewMode === 'pdf' ? '' : 'drop-shadow-2xl',
                        )}
                    >
                        <InteractiveForm
                            template={data as any}
                            formData={previewData}
                            onChange={updatePreviewData}
                            selectedFieldIds={selectedFieldIds}
                            onSelect={(id, e) => handleSelectField(id, e)}
                            onMove={(id, dir) => moveField(id, dir)}
                            onRemove={(id) => removeField(id)}
                            onDuplicate={(id) => duplicateField(id)}
                            isBuilder={viewMode === 'editor'}
                            readOnly={viewMode === 'pdf'}
                        />
                    </div>
                </div>
            </ScrollArea>
        </section>
    );
};
