import { ScrollArea } from '@/components/ui/utilities/ScrollArea';
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
    zoom?: number;
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
    zoom = 100,
}) => {
    return (
        <section className="bg-muted/10 relative flex flex-1 flex-col overflow-hidden">
            <ScrollArea className="bg-muted/30 flex-1">
                <div
                    className="flex min-h-full cursor-default items-start justify-center px-12 py-16 transition-transform duration-200 origin-top"
                    style={{
                        backgroundImage: 'radial-gradient(hsl(var(--border)) 1px, transparent 1px)',
                        backgroundSize: '30px 30px',
                        transform: `scale(${zoom / 100})`,
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
