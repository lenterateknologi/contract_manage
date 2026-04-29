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
    const rootFields = useMemo(() => {
        return (template?.fields || []).filter((f) => !f.parent_id).sort((a, b) => a.order - b.order);
    }, [template.fields]);

    const allFieldIds = useMemo(() => (template.fields || []).map((f) => f.id), [template.fields]);

    const updateValue = (name: string, value: any) => {
        if (onChange) {
            onChange(name, value);
        }
    };

    return (
        <div
            className={cn(
                'border-slate-200 bg-white text-black ring-slate-200 mx-auto flex min-h-[297mm] w-full max-w-[210mm] flex-col border shadow-2xl ring-1 transition-all',
                className,
            )}
            style={{
                paddingTop: `${template.letterhead_json?.margins?.top ?? 15}mm`,
                paddingBottom: `${template.letterhead_json?.margins?.bottom ?? 15}mm`,
                paddingLeft: `${template.letterhead_json?.margins?.left ?? 15}mm`,
                paddingRight: `${template.letterhead_json?.margins?.right ?? 15}mm`,
            }}
            onClick={(e) => {
                // If user clicks the background paper itself, clear selection
                if (isBuilder && e.target === e.currentTarget) {
                    onSelect?.('');
                }
            }}
        >
            <div className="relative flex-1">
                {isBuilder && rootFields.length === 0 && (
                    <div className="flex h-[200mm] w-full flex-col items-center justify-center gap-4 rounded-2xl border-4 border-dashed border-slate-100 bg-slate-50/50">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                            <Plus className="text-primary" size={32} />
                        </div>
                        <div className="text-center">
                            <h3 className="text-sm font-black tracking-widest text-slate-400 uppercase">Kanvas Kosong</h3>
                            <p className="text-[10px] font-medium text-slate-400">Tarik elemen dari kiri ke sini untuk mulai membangun</p>
                        </div>
                    </div>
                )}

                <SortableContext items={allFieldIds} strategy={verticalListSortingStrategy}>
                    {rootFields.map((field) => (
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
                </SortableContext>
            </div>
        </div>
    );
};
