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
    const pages = useMemo(() => {
        const margins = template.letterhead_json?.margins ?? { top: 15, bottom: 15, left: 15, right: 15 };
        const SAFETY_BUFFER = 3;
        const USABLE_HEIGHT = 297 - (margins.top + margins.bottom) - SAFETY_BUFFER;

        const estimateHeight = (field: FormField): number => {
            let h = 0;
            const extraMargins =
                (Number(field.options?.margin_top) || 0) +
                (Number(field.options?.margin_bottom) || 2) + // 2mm default
                (Number(field.options?.spacing_before) || 0) +
                (Number(field.options?.spacing_after) || 0);

            const fontSize = Number(field.options?.font_size) || 12;
            const lineHeight = Number(field.options?.line_height) || 1.2;
            const pxToMm = 0.264583; // 1px = 0.264583mm

            switch (field.type) {
                case 'image':
                case 'f1_header':
                    const imgH = field.options?.height || field.options?.size || 100;
                    h = typeof imgH === 'number' ? imgH * pxToMm : 30;
                    break;
                case 'static_text':
                    const cleanLabel = (field.label || '').trim();
                    const lines = cleanLabel.split('\n').length;
                    // Approximation for word wrap (A4 usable width is ~180mm)
                    const charPerLine = 90;
                    const charLines = Math.ceil(cleanLabel.length / charPerLine);
                    const totalLines = Math.max(lines, charLines);
                    h = totalLines * (fontSize * lineHeight * pxToMm);
                    break;
                case 'textfield':
                case 'number':
                case 'date':
                case 'labeled_value':
                    h = fontSize * 1.5 * pxToMm + 4; // text height + padding
                    break;
                case 'textarea':
                    h = field.options?.min_height ? field.options.min_height * pxToMm : 25;
                    break;
                case 'signature_box':
                    h = 45;
                    break;
                case 'group':
                case 'grid_x':
                case 'grid_y':
                    const children = (template?.fields || []).filter((f) => f.parent_id === field.id);
                    if (field.type === 'grid_x') {
                        h = Math.max(...children.map(estimateHeight), 0) + 4;
                    } else {
                        h = children.reduce((acc, child) => acc + estimateHeight(child), 0) + 4;
                    }
                    break;
                case 'page_break':
                    h = 297;
                    break;
                default:
                    h = 10;
                    break;
            }
            return h + extraMargins;
        };

        const rootFields = (template?.fields || []).filter((f) => !f.parent_id).sort((a, b) => (a.order || 0) - (b.order || 0));

        const resultPages: FormField[][] = [[]];
        let currentHeight = 0;
        let currentPageIdx = 0;

        rootFields.forEach((field) => {
            const h = estimateHeight(field);
            if (currentHeight + h > USABLE_HEIGHT && resultPages[currentPageIdx].length > 0) {
                currentPageIdx++;
                resultPages[currentPageIdx] = [field];
                currentHeight = h;
            } else {
                resultPages[currentPageIdx].push(field);
                currentHeight += h;
            }
        });

        return resultPages;
    }, [template.fields, template.letterhead_json]);

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
