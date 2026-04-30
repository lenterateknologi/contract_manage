import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Copy, Trash2, GripVertical, Plus } from 'lucide-react';

// New modular imports
import { getTypographyStyle, getPaddingStyle } from './utils';
import { TextField, TextAreaField, LabeledValueField } from './fields/InputFields';
import { CheckboxField, RadioField, SelectField } from './fields/SelectionFields';
import { ImageField, StaticTextField, SignatureBoxField, PageBreakField } from './fields/VisualFields';
import { GroupLayout, GridXLayout, GridYLayout, EmptyDropZone } from './fields/LayoutFields';

export interface FormField {
    id: string;
    parent_id?: string | null;
    label: string;
    name: string;
    type: string;
    placeholder?: string;
    is_required: boolean;
    use_rich_text?: boolean;
    width: string | number;
    options?: any;
    order: number;
}

interface FormElementProps {
    field: FormField;
    allFields: FormField[];
    value: any;
    onChange?: (val: any) => void;
    previewData?: Record<string, any>;
    updateValue?: (name: string, value: any) => void;
    readOnly?: boolean;
    isBuilder?: boolean;
    onRemove?: (id: string) => void;
    onDuplicate?: (id: string) => void;
    onSelect?: (id: string, e?: React.MouseEvent) => void;
    onMove?: (id: string, direction: 'up' | 'down') => void;
    isSelected?: boolean;
    diffStatus?: 'added' | 'removed' | 'modified';
    comparisonValue?: any;
    diffData?: Record<string, 'added' | 'removed' | 'modified'>;
    comparisonData?: Record<string, any>;
}

export const FormElement: React.FC<FormElementProps> = (props) => {
    const {
        field,
        allFields,
        value,
        onChange,
        previewData = {},
        updateValue = () => {},
        readOnly = false,
        isBuilder = false,
        onRemove,
        onDuplicate,
        onSelect,
        isSelected = false,
        diffData = {},
        comparisonData = {},
    } = props;

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: field.id,
        disabled: !isBuilder,
    });

    const dndStyle = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 10 : 1,
    };

    const containerStyle = {
        display: 'inline-block',
        verticalAlign: 'top',
        [['group', 'grid_x', 'grid_y', 'grid_view'].includes(field.type) ? 'minWidth' : 'width']: `${field.width}%`,
        marginTop: `${field.options?.margin_top ?? field.options?.spacing_before ?? 0}mm`,
        marginBottom: `${field.options?.margin_bottom ?? field.options?.spacing_after ?? 0}mm`,
        marginLeft: `${field.options?.margin_left ?? 0}mm`,
        marginRight: `${field.options?.margin_right ?? 0}mm`,
        ...getPaddingStyle(field),
        textIndent: field.options?.first_line_indent ? `${field.options.first_line_indent}mm` : undefined,
        gridColumn: field.options?.grid_col_span ? `span ${field.options.grid_col_span}` : undefined,
        gridRow: field.options?.grid_row_span ? `span ${field.options.grid_row_span}` : undefined,
    };

    const renderChildren = (pid: string) => {
        const children = allFields.filter((f) => f.parent_id === pid).sort((a, b) => (a.order || 0) - (b.order || 0));

        if (isBuilder && children.length === 0) {
            return <EmptyDropZone />;
        }

        return children.map((child) => (
            <FormElement
                key={child.id}
                field={child}
                allFields={allFields}
                value={previewData[child.name]}
                comparisonValue={comparisonData[child.name]}
                diffStatus={diffData[child.name]}
                diffData={diffData}
                comparisonData={comparisonData}
                onChange={(val: any) => updateValue(child.name, val)}
                previewData={previewData}
                updateValue={updateValue}
                readOnly={readOnly}
                isBuilder={isBuilder}
                isSelected={isSelected}
                onRemove={onRemove}
                onDuplicate={onDuplicate}
                onSelect={onSelect}
            />
        ));
    };

    const fieldProps = { field, value, onChange, readOnly, isBuilder };

    const renderContent = () => {
        switch (field.type) {
            case 'group':
                return <GroupLayout field={field} isBuilder={isBuilder}>{renderChildren(field.id)}</GroupLayout>;
            case 'grid_x':
                return <GridXLayout field={field}>{renderChildren(field.id)}</GridXLayout>;
            case 'grid_y':
                return <GridYLayout field={field}>{renderChildren(field.id)}</GridYLayout>;
            case 'image':
            case 'f1_header':
                return <ImageField field={field} />;
            case 'static_text':
                return <StaticTextField field={field} previewData={previewData} />;
            case 'textfield':
            case 'number':
            case 'date':
                return <TextField {...fieldProps} />;
            case 'textarea':
                return <TextAreaField {...fieldProps} />;
            case 'checkbox':
                return <CheckboxField {...fieldProps} />;
            case 'radio':
                return <RadioField {...fieldProps} />;
            case 'select':
            case 'searchable_select':
                return <SelectField {...fieldProps} />;
            case 'signature_box':
                return <SignatureBoxField field={field} value={value} />;
            case 'labeled_value':
                return <LabeledValueField {...fieldProps} previewData={previewData} />;
            case 'page_break':
                return <PageBreakField isBuilder={isBuilder} />;
            default:
                return <div className="text-[10px] text-red-500">Unknown field type: {field.type}</div>;
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={{ ...dndStyle, ...containerStyle }}
            {...attributes}
            {...listeners}
            className={cn(
                'group/element form-element-container relative',
                isBuilder && 'hover:ring-primary/40 rounded-sm transition-all hover:ring-1',
                isBuilder && isSelected && 'ring-primary shadow-primary/20 ring-2 shadow-lg',
            )}
            onClick={(e) => {
                if (isBuilder) {
                    e.stopPropagation();
                    onSelect?.(field.id, e);
                }
            }}
        >
            {renderContent()}
            
            {isBuilder && isSelected && (
                <div className="bg-primary absolute -top-3 right-0 z-50 flex items-center gap-1 rounded-t-md px-1.5 py-0.5 text-white shadow-sm animate-in fade-in slide-in-from-bottom-1">
                    <button onClick={() => onDuplicate?.(field.id)} className="hover:bg-white/20 rounded p-0.5 transition-colors">
                        <Copy size={10} />
                    </button>
                    <button onClick={() => onRemove?.(field.id)} className="hover:bg-red-500 rounded p-0.5 transition-colors">
                        <Trash2 size={10} />
                    </button>
                    <div className="bg-white/30 mx-1 h-3 w-px" />
                    <div className="cursor-grab active:cursor-grabbing p-0.5">
                        <GripVertical size={10} />
                    </div>
                </div>
            )}
        </div>
    );
};
