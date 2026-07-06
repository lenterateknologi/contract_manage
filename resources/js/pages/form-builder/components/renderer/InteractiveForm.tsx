import { cn } from '@/lib/utils';
import { FileText } from 'lucide-react';
import React, { useMemo } from 'react';
import { FormElement, FormField } from '../fields/FormElement';

export interface FormTemplate {
    id?: string;
    name: string;
    description: string | null;
    has_letterhead: boolean;
    letterhead_json: any | null;
    fields: FormField[];
}

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

    const allFieldIds = useMemo(() => (template.fields || []).map((f) => f.id), [template.fields]);

    const updateValue = (name: string, value: any) => {
        if (onChange) {
            onChange(name, value);
        }
    };

    const margins = template.letterhead_json?.margins ?? { top: 15, bottom: 15, left: 15, right: 15 };

    const renderField = (field: FormField) => (
        <FormElement
            key={field.id}
            field={field}
            allFields={template.fields}
            value={formData[field.name]}
            onChange={(val: any) => updateValue(field.name, val)}
            previewData={formData}
            updateValue={updateValue}
            readOnly={readOnly}
            isBuilder={isBuilder}
            onRemove={onRemove}
            onDuplicate={onDuplicate}
            onSelect={onSelect}
            onMove={onMove}
            isSelected={selectedFieldIds.includes(field.id)}
            selectedFieldIds={selectedFieldIds}
            diffStatus={diffData[field.name]}
            comparisonValue={comparisonData[field.name]}
            diffData={diffData}
            comparisonData={comparisonData}
        />
    );

    return (
        <div
            className={cn('mx-auto w-full max-w-[210mm]', className)}
            onClick={(e) => {
                if (isBuilder && e.target === e.currentTarget) {
                    onSelect?.('');
                }
            }}
        >
            <SortableContext items={allFieldIds} strategy={verticalListSortingStrategy}>
                {/* --- RENDER PAGES --- */}
                {pages.map((pageFields, idx) => (
                    <Page
                        key={idx}
                        pageNumber={idx + 1}
                        margins={margins}
                        showMargins={isBuilder}
                        className={cn(isBuilder ? 'hover:ring-primary/20 hover:ring-2' : '', 'relative overflow-hidden')}
                    >
                        {/* Page Content */}
                        {pageFields.map(renderField)}

                        {isBuilder && pages.length === 1 && pageFields.length === 0 && (
                            <div className="border-border bg-muted/30 hover:border-primary/30 hover:bg-primary/5 flex h-[180mm] w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed p-12 text-center transition-all">
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
                ))}
            </SortableContext>
        </div>
    );
};
