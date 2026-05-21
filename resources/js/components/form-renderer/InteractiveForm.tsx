import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import React, { useMemo } from 'react';
import { FormElement, FormField } from './FormElement';

export interface FormTemplate {
    id?: string;
    name: string;
    description: string | null;
    has_letterhead: boolean;
    letterhead_json: any | null;
    fields: FormField[];
}

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

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

import { Page } from './Page';

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
        const SAFETY_BUFFER = 3; // Slightly more buffer
        const USABLE_HEIGHT = 297 - (margins.top + margins.bottom) - SAFETY_BUFFER;
        const GAP_BETWEEN_FIELDS = 0; // Keep minimal gap

        const estimateHeight = (field: FormField): number => {
            let h = 0;
            const extraMargins =
                (Number(field.options?.margin_top) || 0) +
                (Number(field.options?.margin_bottom) || 0) +
                (Number(field.options?.spacing_before) || 0) +
                (Number(field.options?.spacing_after) || 0);

            switch (field.type) {
                case 'kop_surat':
                    h = (field.options?.height || 160) / 3.78;
                    break;
                case 'image':
                    h = (field.options?.height || field.options?.size || 100) / 3.78;
                    break;
                case 'static_text':
                    const cleanLabel = (field.label || '').trim();
                    const lines = cleanLabel.split('\n').length;
                    const charLines = Math.ceil(cleanLabel.length / 90);
                    h = Math.max(lines, charLines) * 4.6;
                    break;
                case 'textfield':
                case 'number':
                case 'date':
                case 'labeled_value':
                    h = 10.6;
                    break; // Balanced for 2-element jump
                case 'textarea':
                    h = 30;
                    break;
                case 'signature_box':
                    h = 40;
                    break;
                case 'group':
                case 'grid_x':
                case 'grid_y':
                    const children = (template?.fields || []).filter((f) => f.parent_id === field.id);
                    if (field.type === 'grid_x') {
                        h = Math.max(...children.map(estimateHeight), 0);
                    } else {
                        h = children.reduce((acc, child) => acc + estimateHeight(child), 0);
                    }
                    break;
                case 'page_break':
                    h = 297;
                    break;
                default:
                    h = 10;
                    break;
            }
            return h + extraMargins + GAP_BETWEEN_FIELDS;
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
                {pages.map((pageFields, idx) => (
                    <Page
                        key={idx}
                        pageNumber={idx + 1}
                        margins={margins}
                        showMargins={isBuilder}
                        className={isBuilder ? 'hover:ring-primary/20 hover:ring-2' : ''}
                    >
                        {isBuilder && pages.length === 1 && pageFields.length === 0 && (
                            <div className="flex h-[200mm] w-full flex-col items-center justify-center gap-4 rounded-2xl border-4 border-dashed border-slate-100 bg-slate-50/50">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                                    <Plus className="text-primary" size={32} />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-sm font-black text-slate-400 uppercase">Halaman Kosong</h3>
                                    <p className="text-[10px] font-medium text-slate-400">Tarik elemen dari kiri ke sini untuk mulai membangun</p>
                                </div>
                            </div>
                        )}

                        {pageFields.map((field) => (
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
                                diffStatus={diffData[field.name]}
                                comparisonValue={comparisonData[field.name]}
                                diffData={diffData}
                                comparisonData={comparisonData}
                            />
                        ))}
                    </Page>
                ))}
            </SortableContext>
        </div>
    );
};
