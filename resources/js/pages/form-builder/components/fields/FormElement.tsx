import { cn } from '@/lib/utils';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';

// New modular imports
import { getMarginStyle, getPaddingStyle } from '../utils';
import { LabeledValueField, TextAreaField, TextField } from './InputFields';
import { EmptyDropZone, GridXLayout, GridYLayout, GroupLayout } from './LayoutFields';
import { CheckboxField, RadioField, SelectField } from './SelectionFields';
import { ImageField, PageBreakField, SignatureBoxField, StaticTextField } from './VisualFields';
import { getFieldCategory } from '../builder/constants';

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
    selectedFieldIds?: string[];
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
        onMove,
        isSelected = false,
        selectedFieldIds = [],
        diffData = {},
        comparisonData = {},
    } = props;

    const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({
        id: field.id,
        disabled: !isBuilder,
    });

    const dndStyle = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 10 : 1,
    };

    const customWidth = field.options?.width;
    const customHeight = field.options?.height;
    const isContainer = ['group', 'grid_x', 'grid_y', 'grid_view'].includes(field.type);

    const containerStyle = {
        display: 'inline-block',
        verticalAlign: 'top',
        minWidth: 0,
        maxWidth: '100%',
        boxSizing: 'border-box' as const,
        overflow: isContainer ? undefined : 'hidden',
        ...(customWidth !== undefined && customWidth !== ''
            ? {
                  width: typeof customWidth === 'number' || !isNaN(Number(customWidth)) ? `${customWidth}px` : customWidth,
                  ...(isContainer
                      ? {
                            minWidth: typeof customWidth === 'number' || !isNaN(Number(customWidth)) ? `${customWidth}px` : customWidth,
                        }
                      : {}),
              }
            : {
                  width: `${field.width}%`,
                  ...(isContainer
                      ? {
                            minWidth: `${field.width}%`,
                        }
                      : {}),
              }),
        height:
            customHeight !== undefined && customHeight !== ''
                ? typeof customHeight === 'number' || !isNaN(Number(customHeight))
                    ? `${customHeight}px`
                    : customHeight
                : undefined,
        ...getMarginStyle(field),
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

        const renderedChildren = children.map((child) => (
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
                onRemove={onRemove}
                onDuplicate={onDuplicate}
                onSelect={onSelect}
                onMove={onMove}
                isSelected={selectedFieldIds?.includes(child.id)}
                selectedFieldIds={selectedFieldIds}
            />
        ));

        if (isBuilder) {
            return (
                <SortableContext items={children.map(c => String(c.id))} strategy={verticalListSortingStrategy}>
                    {renderedChildren}
                </SortableContext>
            );
        }
        return renderedChildren;
    };

    const fieldProps = { field, value, onChange, readOnly, isBuilder };

    const renderContent = () => {
        switch (field.type) {
            case 'group':
                return (
                    <GroupLayout field={field} isBuilder={isBuilder}>
                        {renderChildren(field.id)}
                    </GroupLayout>
                );
            case 'grid_x':
                return (
                    <GridXLayout field={field} isBuilder={isBuilder}>
                        {renderChildren(field.id)}
                    </GridXLayout>
                );
            case 'grid_y':
                return (
                    <GridYLayout field={field} isBuilder={isBuilder}>
                        {renderChildren(field.id)}
                    </GridYLayout>
                );
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

    const cat = getFieldCategory(field.type);
    const ringColor = cat ? cat.color.replace('bg-', 'ring-') : 'ring-primary';
    const bgDashed = cat ? cat.color.replace('bg-', 'bg-').replace('-500', '-50/50').replace('-600', '-50/50') : 'bg-primary/5';

    return (
        <div
            ref={setNodeRef}
            style={{ ...dndStyle, ...containerStyle }}
            {...attributes}
            {...listeners}
            className={cn(
                'group/element form-element-container relative',
                isBuilder && cn(
                    cat ? cat.borderColor : 'border-primary/20 hover:border-primary/40',
                    'border border-dashed rounded-md transition-all',
                    ['group', 'grid_x', 'grid_y'].includes(field.type) ? 'p-4' : 'p-2'
                ),
                isBuilder && isSelected && `ring-primary bg-primary/5 z-30 ring-2 ring-offset-1 border-transparent shadow-sm`,
                isBuilder &&
                    isOver &&
                    !isDragging &&
                    ['group', 'grid_x', 'grid_y', 'grid_view'].includes(field.type) &&
                    `${ringColor} ring-dashed ${bgDashed} ring-2`,
            )}
            onClick={(e) => {
                if (isBuilder) {
                    e.stopPropagation();
                    onSelect?.(field.id, e);
                }
            }}
        >
            {renderContent()}

            {isBuilder && isOver && !isDragging && !['group', 'grid_x', 'grid_y', 'grid_view'].includes(field.type) && (
                <div className={cn("absolute right-0 -bottom-1 left-0 z-40 h-1 animate-pulse rounded-full", cat?.color || 'bg-primary')} />
            )}
        </div>
    );
};
