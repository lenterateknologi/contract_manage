import { cn } from '@/lib/utils';
import { FileText } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { FormElement, FormField } from '../fields/FormElement';
import { Button } from '@/components/ui/buttons/Button';

export interface FormTemplate {
    id?: string;
    name: string;
    description: string | null;
    has_letterhead: boolean;
    letterhead_json: any | null;
    fields: FormField[];
}

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Page } from './Page';

interface InteractiveFormProps {
    template: FormTemplate;
    formData: Record<string, any>;
    onChange?: (name: string, value: any) => void;
    readOnly?: boolean;
    isBuilder?: boolean;
    className?: string;
    onRemove?: (id: string) => void;
    onDuplicate?: (id: string) => void;
    onSelect?: (id: string, e?: React.MouseEvent) => void;
    onMove?: (id: string, direction: 'up' | 'down') => void;
    selectedFieldIds?: string[];
    diffData?: Record<string, 'added' | 'removed' | 'modified'>;
    comparisonData?: Record<string, any>;
}

export const InteractiveForm: React.FC<InteractiveFormProps> = ({
    template,
    formData,
    onChange,
    readOnly = false,
    isBuilder = false,
    className,
    onRemove,
    onDuplicate,
    onSelect,
    onMove,
    selectedFieldIds = [],
    diffData = {},
    comparisonData = {},
}) => {
    const { setNodeRef, isOver } = useDroppable({
        id: 'canvas-area',
        disabled: !isBuilder,
    });

    const { setNodeRef: setBottomDropRef, isOver: isBottomOver } = useDroppable({
        id: 'canvas-bottom',
        disabled: !isBuilder,
    });

    // --- PAGE SPLITTING LOGIC ---
    // ponytail: page splitting is only triggered by explicit page_break elements.
    const pages = useMemo(() => {
        const rootFields = (template?.fields || []).filter((f) => !f.parent_id).sort((a, b) => (a.order || 0) - (b.order || 0));

        const resultPages: FormField[][] = [[]];
        let currentPageIdx = 0;

        rootFields.forEach((field) => {
            if (resultPages[currentPageIdx].length > 0 && resultPages[currentPageIdx][resultPages[currentPageIdx].length - 1]?.type === 'page_break') {
                currentPageIdx++;
                resultPages[currentPageIdx] = [field];
            } else {
                resultPages[currentPageIdx].push(field);
            }
        });

        return resultPages;
    }, [template.fields]);

    const [activePageIdx, setActivePageIdx] = useState(0);

    // Filter fields to only render elements in parent group
    const rootFields = useMemo(() => {
        return (template?.fields || []).filter((f) => !f.parent_id).sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [template.fields]);

    const allFieldIds = useMemo(() => {
        return rootFields.map((f) => String(f.id));
    }, [rootFields]);

    const renderField = (field: FormField) => {
        return (
            <FormElement
                key={field.id}
                field={field}
                value={formData[field.name]}
                onChange={(val) => onChange?.(field.name, val)}
                readOnly={readOnly}
                isBuilder={isBuilder}
                onRemove={onRemove}
                onDuplicate={onDuplicate}
                onSelect={onSelect}
                onMove={onMove}
                isSelected={selectedFieldIds.includes(field.id)}
                allFields={template.fields}
                diffStatus={diffData[field.id]}
                comparisonValue={comparisonData[field.name]}
            />
        );
    };

    const margins = template.letterhead_json?.margins ?? { top: 15, bottom: 15, left: 15, right: 15 };

    return (
        <div
            ref={setNodeRef}
            className={cn('mx-auto w-full relative', isBuilder ? 'max-w-[210mm] min-h-[500px]' : 'max-w-none', className)}
            onClick={(e) => {
                if (isBuilder && e.target === e.currentTarget) {
                    onSelect?.('');
                }
            }}
        >
            <SortableContext items={allFieldIds} strategy={verticalListSortingStrategy}>
                {/* --- RENDER PAGES --- */}
                {pages.map((pageFields, idx) => {
                    if (!isBuilder && idx !== activePageIdx) return null;
                    return (
                        <Page
                            key={idx}
                            pageNumber={idx + 1}
                            margins={margins}
                            showMargins={isBuilder}
                            isBuilder={isBuilder}
                            className={cn(isBuilder ? 'hover:ring-primary/20 hover:ring-2' : '', 'relative overflow-hidden')}
                        >
                            {/* Page Content */}
                            {pageFields.map(renderField)}

                            {/* Drop Indicator for Canvas Area */}
                            {isBuilder && isOver && pageFields.length > 0 && idx === pages.length - 1 && (
                                <div className="absolute right-0 -bottom-1 left-0 z-40 h-1 animate-pulse rounded-full bg-primary" />
                            )}

                            {isBuilder && pages.length === 1 && pageFields.length === 0 && (
                                <div className={cn("border-border bg-muted/30 hover:border-primary/30 hover:bg-primary/5 flex h-[180mm] w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed p-12 text-center transition-all", isOver && "border-primary bg-primary/10")}>
                                    <div className="bg-primary/10 ring-primary/20 mb-6 flex h-20 w-20 items-center justify-center rounded-none ring-1">
                                        <FileText className="text-primary" size={32} />
                                    </div>
                                    <div className="max-w-[280px]">
                                        <h3 className="text-foreground/80 mb-2 text-sm font-semibold tracking-tight uppercase">Kanvas Kontrak Kosong</h3>
                                        <p className="text-muted-foreground text-[10px] leading-relaxed font-medium">
                                            Tarik elemen dari library di sebelah kiri untuk mulai menyusun isi kontrak utama Anda secara presisi.
                                        </p>
                                    </div>
                                </div>
                            )}

                        </Page>
                    );
                })}
            </SortableContext>

            {/* Permanent Canvas Drop Zone (OUTSIDE OF PAGE) */}
            {isBuilder && (
                <div 
                    ref={setBottomDropRef}
                    className={cn(
                        "mt-8 flex h-24 w-full items-center justify-center rounded-xl border-2 border-dashed transition-all",
                        isBottomOver 
                            ? "border-primary bg-primary/10 ring-2 ring-primary/20" 
                            : "border-border bg-muted/10 hover:border-primary/50 hover:bg-primary/5"
                    )}
                >
                    <span className="text-muted-foreground/30 font-sans text-xs font-semibold tracking-widest uppercase">
                        Lepas di sini untuk keluar dari grid
                    </span>
                </div>
            )}

            {/* --- PAGINATION FOOTER --- */}
            {!isBuilder && pages.length > 1 && (
                <div className="flex items-center justify-between mt-6 p-4 border-t border-surface-border bg-surface-base rounded-xl shadow-xs select-none">
                    <Button
                        variant="white"
                        size="sm"
                        disabled={activePageIdx === 0}
                        onClick={() => setActivePageIdx(prev => Math.max(0, prev - 1))}
                        className="h-9 px-4 rounded-xl border border-surface-border text-xs font-bold uppercase tracking-wider transition-all"
                    >
                        Sebelumnya
                    </Button>
                    <span className="text-xs font-bold text-text-soft uppercase tracking-wider">
                        Halaman <span className="text-primary font-extrabold">{activePageIdx + 1}</span> dari <span className="text-text-main font-extrabold">{pages.length}</span>
                    </span>
                    <Button
                        variant="primary"
                        size="sm"
                        disabled={activePageIdx === pages.length - 1}
                        onClick={() => setActivePageIdx(prev => Math.min(pages.length - 1, prev + 1))}
                        className="h-9 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                    >
                        Selanjutnya
                    </Button>
                </div>
            )}
        </div>
    );
};
