import { Icons } from '@/components/ui';
import React from 'react';

const { Upload } = Icons;

interface DragDropOverlayProps {
    isDragging: boolean;
    folderName: string;
}

export function DragDropOverlay({ isDragging, folderName }: DragDropOverlayProps) {
    if (!isDragging) return null;

    return (
        <div className="bg-primary/15 animate-in fade-in fixed inset-0 z-[9999] flex flex-col items-center justify-center backdrop-blur-xs duration-150">
            <div className="border-primary bg-surface-card flex max-w-md flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed p-10 text-center shadow-2xl">
                <div className="bg-primary text-primary-foreground flex h-16 w-16 animate-bounce items-center justify-center rounded-2xl shadow-xl">
                    <Upload size={32} />
                </div>
                <div>
                    <h3 className="text-text-main text-lg font-bold">Lepaskan File untuk Upload</h3>
                    <p className="text-text-desc mt-1 text-xs">
                        File akan otomatis diunggah ke folder: <span className="text-primary font-bold">{folderName}</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
