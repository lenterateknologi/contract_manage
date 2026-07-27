import { cn } from '@/lib/utils';
import React from 'react';
import { InteractiveForm } from './InteractiveForm';

export type FormViewMode = 'visual-editor' | 'interactive-form' | 'pdf-preview' | 'server-pdf';

interface UnifiedFormViewerProps {
    template: any;
    formData?: Record<string, any>;
    mode?: FormViewMode;
    onChange?: (name: string, value: any) => void;
    className?: string;

    // Server PDF Props
    serverPdfUrl?: string;

    // Builder Specific Props
    selectedFieldIds?: string[];
    onSelect?: (id: string, e?: React.MouseEvent) => void;
    onMove?: (id: string, dir: 'up' | 'down') => void;
    onRemove?: (id: string) => void;
    onDuplicate?: (id: string) => void;
}

/**
 * A shared, high-level component to render forms in any context:
 * - Visual Editor (Builder)
 * - Interactive Form (Filling)
 * - PDF Preview (Client-side simulation, read-only text)
 * - Server PDF (Real PDF iframe from server)
 */
export const UnifiedFormViewer: React.FC<UnifiedFormViewerProps> = ({
    template,
    formData = {},
    mode = 'interactive-form',
    onChange,
    className,
    serverPdfUrl,
    selectedFieldIds,
    onSelect,
    onMove,
    onRemove,
    onDuplicate,
}) => {
    // 1. Server-side PDF Mode (Iframe)
    if (mode === 'server-pdf' && serverPdfUrl) {
        return (
            <div
                className={cn(
                    'mx-auto w-full max-w-[210mm]', // Match InteractiveForm container
                    className,
                )}
            >
                <div
                    className={cn(
                        'bg-card text-foreground border-border relative mx-auto mb-20 flex flex-col border shadow-none transition-all',
                        'h-[297mm] w-[210mm] shrink-0 overflow-hidden rounded-sm',
                    )}
                >
                    <iframe src={`${serverPdfUrl}#toolbar=0&navpanes=0`} className="h-full w-full border-none bg-white" title="PDF Preview" />
                </div>
            </div>
        );
    }

    // 2. Client-side Modes (Interactive Form, Visual Editor, or PDF Preview)
    const isBuilder = mode === 'visual-editor';
    const isReadOnly = mode === 'pdf-preview';

    return (
        <div className={cn('mx-auto w-full max-w-[210mm]', className)}>
            <InteractiveForm
                template={template}
                formData={formData}
                onChange={onChange}
                selectedFieldIds={selectedFieldIds}
                onSelect={onSelect}
                onMove={onMove}
                onRemove={onRemove}
                onDuplicate={onDuplicate}
                isBuilder={isBuilder}
                readOnly={isReadOnly}
                mode={mode}
            />
        </div>
    );
};
