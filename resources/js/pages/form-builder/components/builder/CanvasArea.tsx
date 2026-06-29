import { ScrollArea } from '@/components/ui/base/ScrollArea';
import { cn } from '@/lib/utils';
import { Edit3, Eye, Play } from 'lucide-react';
import React from 'react';
import { UnifiedFormViewer } from '../renderer/UnifiedFormViewer';

interface CanvasAreaProps {
    viewMode: 'visual-editor' | 'interactive-form' | 'pdf-preview';
    setViewMode: (mode: 'visual-editor' | 'interactive-form' | 'pdf-preview') => void;
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
        <section className="bg-muted/10 relative flex flex-1 flex-col overflow-hidden">
            {/* STICKY VIEW TABS */}
            <div className="border-border bg-card/80 sticky top-0 z-30 flex h-[60px] w-full shrink-0 items-center justify-center border-b backdrop-blur-md">
                <div className="bg-muted/30 ring-border/20 flex gap-1.5 rounded-2xl p-1.5 ring-1">
                    {[
                        { id: 'visual-editor', label: 'Visual Editor', icon: Edit3 },
                        { id: 'interactive-form', label: 'Interactive Form', icon: Play },
                        { id: 'pdf-preview', label: 'PDF Preview', icon: Eye },
                    ].map((mode) => (
                        <button
                            key={mode.id}
                            type="button"
                            onClick={() => setViewMode(mode.id as any)}
                            className={cn(
                                'flex items-center gap-2.5 rounded-xl px-5 py-2 transition-all duration-300',
                                viewMode === mode.id
                                    ? 'bg-card ring-border/50 text-foreground z-10 scale-105 ring-1'
                                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                            )}
                        >
                            <mode.icon size={14} strokeWidth={2.5} />
                            <span className="font-sans text-[10px] font-semibold tracking-[0.1em] uppercase">{mode.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <ScrollArea className="bg-muted/30 flex-1">
                <div
                    className="flex min-h-full cursor-default items-start justify-center px-12 py-16"
                    style={{
                        backgroundImage: 'radial-gradient(hsl(var(--border)) 1px, transparent 1px)',
                        backgroundSize: '30px 30px',
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            handleSelectField('', e);
                        }
                    }}
                >
                    <UnifiedFormViewer
                        template={data as any}
                        formData={previewData}
                        onChange={updatePreviewData}
                        mode={viewMode}
                        selectedFieldIds={selectedFieldIds}
                        onSelect={(id, e) => handleSelectField(id, e)}
                        onMove={(id, dir) => moveField(id, dir)}
                        onRemove={(id) => removeField(id)}
                        onDuplicate={(id) => duplicateField(id)}
                    />
                </div>
            </ScrollArea>
        </section>
    );
};
