import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, Copy, GripVertical, Plus, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

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

export const FormElement: React.FC<FormElementProps> = ({
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
    diffStatus,
    comparisonValue,
    diffData = {},
    comparisonData = {},
}) => {
    // Basic word-level diff utility
    const renderDiff = (oldText: string = '', newText: string = '', type: 'removed' | 'added' | 'modified') => {
        // Clean up text - treat "—" as empty
        const cleanOld = oldText === '—' || !oldText ? '' : String(oldText);
        const cleanNew = newText === '—' || !newText ? '' : String(newText);

        if (type === 'removed') {
            return <span className="bg-rose-50/50 text-rose-900 italic line-through decoration-rose-400 decoration-2">{cleanOld || '—'}</span>;
        }
        if (type === 'added') {
            return (
                <span className="rounded bg-emerald-100/50 px-1 font-bold text-emerald-950 underline decoration-emerald-300 underline-offset-2">
                    {cleanNew}
                </span>
            );
        }

        // Modified: Show BOTH old (strikethrough) and new (highlight)
        return (
            <span className="inline-flex flex-wrap items-center gap-x-2">
                <span className="text-[0.85em] text-rose-950/40 line-through decoration-rose-300 decoration-1">{cleanOld || '—'}</span>
                <span className="rounded bg-emerald-100/50 px-1 font-bold text-emerald-950 underline decoration-emerald-300 underline-offset-2">
                    {cleanNew}
                </span>
            </span>
        );
    };

    const renderValue = (val: any) => {
        if (val === null || val === undefined || val === '') return '—';

        // Auto-format Date strings (ISO, YYYY-MM-DD, or YYYY-MM-DD HH:mm)
        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
            try {
                const date = new Date(val);
                if (!isNaN(date.getTime())) {
                    const hasTime = val.includes(':') || val.includes('T');
                    return date.toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        ...(hasTime ? { hour: '2-digit', minute: '2-digit' } : {}),
                    });
                }
            } catch (e) {
                // Fallback to original if parsing fails
            }
        }

        let displayVal = val;

        // Lookup label for select types in labeled_value or similar
        const vType = field.options?.value_type;
        if (vType === 'select' || vType === 'searchable_select') {
            const item = (field.options?.items || []).find((i: any) => i.value === val);
            if (item) displayVal = item.label;
        }

        if (diffStatus) {
            return renderDiff(comparisonValue, val, diffStatus);
        }

        if (field.type === 'signature') {
            return (
                <div className="rounded-xl border-2 border-dashed border-slate-200 p-4 text-center text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    Digital Signature Field
                </div>
            );
        }
        return displayVal;
    };
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: field.id,
        disabled: !isBuilder,
    });

    const [searchQuery, setSearchQuery] = React.useState('');
    const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

    const dndStyle = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 10 : 1,
    };

    // Standardized spacing system
    const style = {
        display: 'inline-block',
        verticalAlign: 'top',
        [['group', 'grid_x', 'grid_y', 'grid_view'].includes(field.type) ? 'minWidth' : 'width']: `${field.width}%`,
        marginTop: `${field.options?.margin_top ?? 0}px`,
        marginBottom: `${field.options?.margin_bottom ?? 0}px`,
        marginLeft: `${field.options?.margin_left ?? 0}px`,
        marginRight: `${field.options?.margin_right ?? 0}px`,

        // Paragraph Spacing
        paddingTop: `${field.options?.spacing_before ?? field.options?.padding_top ?? field.options?.padding_y ?? 0}px`,
        paddingBottom: `${field.options?.spacing_after ?? field.options?.padding_bottom ?? field.options?.padding_y ?? 0}px`,
        paddingLeft: `${field.options?.padding_left ?? field.options?.padding_x ?? 0}px`,
        paddingRight: `${field.options?.padding_right ?? field.options?.padding_x ?? 0}px`,

        textIndent: field.options?.first_line_indent ? `${field.options.first_line_indent}px` : undefined,
        gridColumn: field.options?.grid_col_span ? `span ${field.options.grid_col_span}` : undefined,
        gridRow: field.options?.grid_row_span ? `span ${field.options.grid_row_span}` : undefined,
    };

    const getPaddingStyle = (defaults = { t: 0, b: 0, l: 0, r: 0 }) => ({
        paddingTop: `${field.options?.spacing_before ?? field.options?.padding_top ?? field.options?.padding_y ?? defaults.t}px`,
        paddingBottom: `${field.options?.spacing_after ?? field.options?.padding_bottom ?? field.options?.padding_y ?? defaults.b}px`,
        paddingLeft: `${field.options?.padding_left ?? field.options?.padding_x ?? defaults.l}px`,
        paddingRight: `${field.options?.padding_right ?? field.options?.padding_x ?? defaults.r}px`,
    });

    const renderChildren = (pid: string) => {
        const children = allFields.filter((f) => f.parent_id === pid).sort((a, b) => (a.order || 0) - (b.order || 0));

        if (isBuilder && children.length === 0) {
            return (
                <div className="border-primary/20 bg-primary/5 text-primary/40 hover:bg-primary/10 flex w-full items-center justify-center rounded-lg border-2 border-dashed py-8 text-[10px] font-black tracking-widest uppercase transition-all">
                    <Plus size={14} className="mr-2" /> Drop components here
                </div>
            );
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

    // Common styling shared between input and readonly text
    const commonTextStyles = 'text-[11px] font-bold leading-relaxed';

    const getTypographyStyle = (scale = 1, isLabel = false) => {
        const options = field.options || {};
        return {
            fontSize: options.font_size ? `${options.font_size * scale}px` : `${11 * scale}px`,
            fontWeight: isLabel ? options.font_weight_label || options.font_weight || 'bold' : options.font_weight || 'bold',
            fontFamily: options.font_family || "'Inter', sans-serif",
            fontStyle: options.font_style || undefined,
            textTransform: options.text_transform || undefined,
            textDecoration: options.text_decoration || undefined,
            textAlign: (options.text_align || options.alignment || undefined) as any,
        };
    };

    const renderContent = () => {
        switch (field.type) {
            case 'group':
                return (
                    <div
                        className={cn(
                            'min-h-0 transition-colors',
                            field.options?.group_style !== 'frameless' && 'p-0.5',
                            field.options?.border_style === 'solid' ? 'border-solid border-[#000]' : 'border-none',
                        )}
                        style={{
                            borderStyle: (field.options?.border_style as any) || undefined,
                            borderWidth:
                                field.options?.border_width !== undefined && field.options?.border_width !== null
                                    ? `${field.options.border_width}px`
                                    : field.options?.border_style === 'solid'
                                      ? '1px'
                                      : undefined,
                            borderColor: field.options?.border_color || undefined,
                            backgroundColor: field.options?.background_color || undefined,
                        }}
                    >
                        <div
                            className="flex flex-wrap gap-0"
                            style={{
                                justifyContent: field.options?.justify_content || 'flex-start',
                                alignItems: field.options?.align_items || 'flex-start',
                                alignContent: field.options?.align_items || 'flex-start',
                            }}
                        >
                            {renderChildren(field.id)}
                        </div>
                    </div>
                );

            case 'grid_x':
                return (
                    <div
                        className="grid w-full gap-0"
                        style={{
                            gridTemplateColumns:
                                (field.options?.col_sizes || []).filter((s: string) => s).join(' ') ||
                                `repeat(${field.options?.grid_cols || 1}, 1fr)`,
                            justifyContent: field.options?.justify_content || undefined,
                            alignItems: field.options?.align_items || undefined,
                            borderStyle: (field.options?.border_style as any) || undefined,
                            borderWidth:
                                field.options?.border_width !== undefined && field.options?.border_width !== null
                                    ? `${field.options.border_width}px`
                                    : undefined,
                            borderColor: field.options?.border_color || undefined,
                            backgroundColor: field.options?.background_color || undefined,
                        }}
                    >
                        {renderChildren(field.id)}
                    </div>
                );

            case 'grid_y':
                return (
                    <div
                        className="flex w-full flex-col"
                        style={{
                            justifyContent: field.options?.justify_content || 'flex-start',
                            alignItems: field.options?.align_items || 'stretch',
                            borderStyle: (field.options?.border_style as any) || undefined,
                            borderWidth:
                                field.options?.border_width !== undefined && field.options?.border_width !== null
                                    ? `${field.options.border_width}px`
                                    : undefined,
                            borderColor: field.options?.border_color || undefined,
                            backgroundColor: field.options?.background_color || undefined,
                        }}
                    >
                        {renderChildren(field.id)}
                    </div>
                );

            case 'image':
            case 'f1_header':
                return (
                    <div
                        className={cn(
                            'flex h-full w-full',
                            field.options?.alignment === 'center'
                                ? 'justify-center'
                                : field.options?.alignment === 'right'
                                  ? 'justify-end'
                                  : 'justify-start',
                            field.options?.v_alignment === 'middle'
                                ? 'items-center'
                                : field.options?.v_alignment === 'bottom'
                                  ? 'items-end'
                                  : 'items-start',
                        )}
                    >
                        <img
                            src={field.options?.logo_url || field.options?.url || '/storage/app/public/fr_logo.png'}
                            style={{
                                width: field.options?.size
                                    ? `${field.options.size}px`
                                    : field.options?.logo_size
                                      ? `${field.options.logo_size}px`
                                      : '120px',
                                height: 'auto',
                            }}
                            alt="document logo"
                        />
                    </div>
                );

            case 'static_text':
                const replacedText = (field.label || '').replace(/\{\{(.*?)\}\}/g, (match, key) => {
                    const trimmedKey = key.trim();
                    const val = previewData?.[trimmedKey];
                    if (val !== undefined && val !== null && String(val).trim() !== '') {
                        return String(val);
                    }
                    return '..........';
                });

                // Implement legal numbering if active
                const showLegalPrefix =
                    field.options?.list_type === 'legal' || (field.options?.list_type === 'number' && field.options?.number_format);
                const prefixMatch = field.options?.number_format?.match(/\{(.*?)\}/);
                const counterPlaceholder = prefixMatch ? prefixMatch[0] : '{n}';

                // For now, if it's "Pasal {n}", we keep it simple since index is hard to track globally in this recursion without more refactoring.
                // But we can at least render the prefix if it's static.
                const prefix = showLegalPrefix ? field.options.number_format.replace(counterPlaceholder, '') : '';

                return (
                    <div
                        className="w-full"
                        style={{
                            color: field.options?.color || 'var(--foreground)',
                            whiteSpace: 'pre-wrap',
                            lineHeight: field.options?.line_height || '1.2',
                            letterSpacing: field.options?.letter_spacing || 'normal',
                            backgroundColor: field.options?.background_color || undefined,
                            borderStyle: (field.options?.border_style as any) || undefined,
                            borderWidth:
                                field.options?.border_width !== undefined && field.options?.border_width !== null
                                    ? `${field.options.border_width}px`
                                    : undefined,
                            borderColor: field.options?.border_color || undefined,
                            ...getTypographyStyle(),
                        }}
                    >
                        {prefix && <span className="mr-2 font-bold tracking-widest uppercase">{prefix}</span>}
                        {replacedText}
                    </div>
                );

            case 'textfield':
            case 'number':
            case 'date':
                if (readOnly) {
                    return (
                        <div className="flex w-full items-baseline gap-2 py-0.5">
                            {field.label && (
                                <span
                                    className="text-muted-foreground min-w-[120px] shrink-0 text-[10px] font-black tracking-tight whitespace-nowrap uppercase"
                                    style={{
                                        fontSize: field.options?.font_size ? `${field.options.font_size * 0.8}px` : undefined,
                                        fontWeight: field.options?.font_weight || undefined,
                                        fontFamily: field.options?.font_family || undefined,
                                        fontStyle: field.options?.font_style || undefined,
                                    }}
                                >
                                    {field.label} :
                                </span>
                            )}
                            <span
                                className={cn(commonTextStyles, 'text-foreground border-border min-h-[32px] flex-1 border-b border-dotted pb-1.5')}
                                style={{
                                    fontSize: field.options?.font_size ? `${field.options.font_size}px` : undefined,
                                    fontWeight: field.options?.font_weight || undefined,
                                    fontFamily: field.options?.font_family || undefined,
                                    fontStyle: field.options?.font_style || undefined,
                                }}
                            >
                                {renderValue(value)}
                            </span>
                        </div>
                    );
                }
                return (
                    <div className={cn('relative w-full', isBuilder && 'bg-primary/5 ring-primary/20 rounded p-0.5 ring-1')}>
                        {field.label && field.options?.field_style !== 'dashed_bottom' && (
                            <Label className="text-foreground/70 mb-1 block text-[10px] font-black tracking-tight uppercase">
                                {field.label}
                                {field.is_required && <span className="text-destructive ml-0.5 font-bold">*</span>}
                            </Label>
                        )}
                        <div className="group/input relative">
                            <input
                                type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                placeholder={field.placeholder}
                                value={field.type === 'date' && typeof value === 'string' ? value.split('T')[0].split(' ')[0] : (value || '')}
                                onChange={(e) => onChange?.(e.target.value)}
                                className={cn(
                                    'placeholder:text-muted-foreground/50 flex min-h-[32px] w-full text-[11px] font-bold transition-all placeholder:italic',
                                    field.options?.field_style === 'dashed_bottom'
                                        ? 'border-border focus:border-primary rounded-none border-t-0 border-r-0 border-b border-l-0 border-dashed bg-transparent px-0 font-bold shadow-none ring-0 outline-none focus:ring-0'
                                        : 'border-border bg-muted/20 focus:ring-primary/20 focus:border-primary rounded-lg border px-3 focus:ring-1',
                                )}
                                style={getTypographyStyle()}
                            />
                            {isBuilder && (
                                <div className="pointer-events-none absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
                                    <span className="bg-primary/10 text-primary border-primary/20 rounded border px-1 text-[7px] font-black uppercase shadow-sm">
                                        {field.type === 'textfield' ? 'Text' : field.type}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 'textarea':
                if (readOnly) {
                    return (
                        <div className="relative w-full">
                            {field.label && (
                                <div
                                    className="text-muted-foreground mb-1 text-[10px] font-black tracking-tight uppercase"
                                    style={getTypographyStyle(0.8, true)}
                                >
                                    {field.label} :
                                </div>
                            )}
                            <span
                                className={cn(commonTextStyles, 'text-foreground border-border block min-h-[32px] flex-1 border-b border-dotted pb-1.5')}
                                style={getTypographyStyle()}
                            >
                                {renderValue(value)}
                            </span>
                        </div>
                    );
                }
                return (
                    <div className={cn('relative w-full', isBuilder && 'bg-primary/5 ring-primary/20 rounded p-0.5 ring-1')}>
                        {field.label && field.options?.field_style !== 'dashed_bottom' && (
                            <Label
                                className="text-foreground/70 mb-1 block text-[10px] font-black tracking-tight uppercase"
                                style={getTypographyStyle(0.8, true)}
                            >
                                {field.label}
                                {field.is_required && <span className="text-destructive ml-0.5 font-bold">*</span>}
                            </Label>
                        )}
                        <div className="group/input relative">
                            <textarea
                                placeholder={field.placeholder}
                                value={value || ''}
                                onChange={(e) => onChange?.(e.target.value)}
                                className={cn(
                                    'placeholder:text-muted-foreground/50 focus:ring-primary/20 flex min-h-[80px] w-full resize-none text-[11px] font-bold transition-all placeholder:italic focus:ring-1',
                                    field.options?.border_style === 'solid'
                                        ? 'border-foreground rounded-none border-solid p-2'
                                        : 'border-border bg-muted/20 focus:border-primary rounded-lg border px-3 py-2',
                                )}
                                style={{
                                    minHeight: field.options?.min_height ? `${field.options.min_height}px` : undefined,
                                    ...getTypographyStyle(),
                                }}
                            />
                            {isBuilder && (
                                <div className="pointer-events-none absolute top-2 right-2 flex items-center gap-1">
                                    <span className="bg-primary/10 text-primary border-primary/20 rounded border px-1 text-[7px] font-black uppercase shadow-sm">
                                        Long Text
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 'checkbox':
                if (readOnly) {
                    return (
                        <div className="flex items-center gap-2 py-1">
                            <div
                                className={cn(
                                    'flex h-4 w-4 items-center justify-center rounded border transition-colors',
                                    value ? 'bg-foreground border-foreground text-background' : 'bg-card border-border',
                                )}
                            >
                                {value && <i className="fa-solid fa-check text-[10px]" />}
                            </div>
                            <span className="text-foreground text-[11px] font-bold uppercase" style={getTypographyStyle(1, true)}>
                                {field.label}
                            </span>
                        </div>
                    );
                }
                return (
                    <div className="group flex cursor-pointer items-center gap-2 py-1" onClick={() => onChange?.(!value)}>
                        <div
                            className={cn(
                                'flex h-4.5 w-4.5 items-center justify-center rounded border-2 transition-all duration-200',
                                value ? 'bg-primary border-primary shadow-sm' : 'bg-card border-border group-hover:border-primary/50',
                            )}
                        >
                            {value && <i className="fa-solid fa-check text-primary-foreground scale-110 text-[10px]" />}
                        </div>
                        <Label
                            className="text-foreground/70 cursor-pointer text-[11px] font-black tracking-tight uppercase select-none"
                            style={getTypographyStyle(1, true)}
                        >
                            {field.label}
                            {field.is_required && <span className="text-destructive ml-0.5 font-bold">*</span>}
                        </Label>
                    </div>
                );

            case 'radio':
                const options = field.options?.items || [];
                if (readOnly) {
                    return (
                        <div className="flex flex-col gap-1.5 py-1">
                            {field.label && (
                                <div className="text-muted-foreground mb-0.5 text-[10px] font-black tracking-tight uppercase">{field.label}</div>
                            )}
                            <div className="flex flex-wrap gap-4">
                                {options.map((opt: any) => (
                                    <div key={opt.value} className="flex items-center gap-1.5">
                                        <div
                                            className={cn(
                                                'flex h-3.5 w-3.5 items-center justify-center rounded-full border',
                                                value === opt.value ? 'bg-foreground border-foreground' : 'bg-card border-border',
                                            )}
                                        >
                                            {value === opt.value && <div className="bg-background h-1.5 w-1.5 rounded-full" />}
                                        </div>
                                        <span
                                            className={cn(
                                                'text-[10px] font-bold uppercase',
                                                value === opt.value ? 'text-foreground' : 'text-muted-foreground/60',
                                            )}
                                        >
                                            {opt.label}
                                        </span>
                                    </div>
                                ))}
                                {options.length === 0 && <span className={cn(commonTextStyles, 'text-foreground')}>{renderValue(value)}</span>}
                            </div>
                        </div>
                    );
                }
                return (
                    <div className="flex flex-col gap-2 py-1">
                        {field.label && (
                            <Label className="text-foreground/70 text-[10px] font-black tracking-tight uppercase">
                                {field.label}
                                {field.is_required && <span className="text-destructive ml-0.5 font-bold">*</span>}
                            </Label>
                        )}
                        <div className="flex flex-wrap gap-4">
                            {options.map((opt: any) => (
                                <div key={opt.value} className="group flex cursor-pointer items-center gap-2" onClick={() => onChange?.(opt.value)}>
                                    <div
                                        className={cn(
                                            'flex h-4 w-4 items-center justify-center rounded-full border-2 transition-all',
                                            value === opt.value ? 'border-primary bg-white' : 'border-border group-hover:border-primary bg-white',
                                        )}
                                    >
                                        {value === opt.value && (
                                            <div className="bg-primary animate-in zoom-in-50 h-2 w-2 rounded-full duration-200" />
                                        )}
                                    </div>
                                    <span className="text-foreground/70 group-hover:text-primary text-[11px] font-bold uppercase transition-colors select-none">
                                        {opt.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'select':
            case 'searchable_select':
                const selectOptions = field.options?.items || [];
                const isSearchable = field.type === 'searchable_select';

                if (readOnly) {
                    return (
                        <div className="flex w-full items-baseline gap-2 py-0.5">
                            {field.label && (
                                <span
                                    className="text-muted-foreground min-w-[120px] shrink-0 text-[10px] font-black tracking-tight whitespace-nowrap uppercase"
                                    style={getTypographyStyle(0.8, true)}
                                >
                                    {field.label} :
                                </span>
                            )}
                            <span
                                className={cn(commonTextStyles, 'text-foreground border-border min-h-[32px] flex-1 border-b border-dotted pb-1.5')}
                                style={getTypographyStyle()}
                            >
                                {renderValue(selectOptions.find((o: any) => o.value === value)?.label || value)}
                            </span>
                        </div>
                    );
                }

                const filteredOptions = searchQuery
                    ? selectOptions.filter((o: any) => o.label.toLowerCase().includes(searchQuery.toLowerCase()))
                    : selectOptions;

                const selectedLabel = selectOptions.find((o: any) => o.value === value)?.label || '';

                if (isSearchable) {
                    return (
                        <div className="relative w-full">
                            {field.label && (
                                <Label
                                    className="text-foreground/70 mb-1 block text-[10px] font-black tracking-tight uppercase"
                                    style={getTypographyStyle(0.8, true)}
                                >
                                    {field.label}
                                    {field.is_required && <span className="text-destructive ml-0.5 font-bold">*</span>}
                                </Label>
                            )}

                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => !readOnly && setIsDropdownOpen(!isDropdownOpen)}
                                    className={cn(
                                        'border-border bg-muted/20 hover:bg-muted/30 focus:ring-primary/20 flex h-9 w-full items-center justify-between rounded-lg border px-3 transition-all focus:ring-1 focus:outline-none',
                                        !value && 'opacity-80',
                                    )}
                                    style={getTypographyStyle()}
                                >
                                    <span className={cn('truncate text-left', selectedLabel ? 'text-foreground' : 'text-muted-foreground/60 font-medium italic')}>
                                        {selectedLabel || field.placeholder || 'Pilih...'}
                                    </span>
                                    <i
                                        className={cn(
                                            'fa-solid fa-chevron-down text-muted-foreground/40 text-[10px] transition-transform',
                                            isDropdownOpen && 'rotate-180',
                                        )}
                                    />
                                </button>

                                {isDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                                        <div className="border-border bg-popover animate-in fade-in zoom-in-95 absolute top-full right-0 z-50 mt-1 flex max-h-60 w-full min-w-[240px] flex-col overflow-hidden rounded-xl border shadow-2xl duration-200">
                                            <div className="bg-popover border-border sticky top-0 z-10 border-b p-2">
                                                <div className="relative">
                                                    <i className="fa-solid fa-magnifying-glass text-muted-foreground/50 absolute top-1/2 left-3 -translate-y-1/2 text-[10px]" />
                                                    <input
                                                        autoFocus
                                                        placeholder="Cari..."
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        className="bg-muted/50 border-border focus:border-primary w-full rounded-md border py-1.5 pr-3 pl-8 text-[11px] font-bold outline-none"
                                                        style={getTypographyStyle()}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                            </div>
                                            <div className="overflow-y-auto py-1">
                                                {filteredOptions.length > 0 ? (
                                                    filteredOptions.map((opt: any) => (
                                                        <button
                                                            key={opt.value}
                                                            type="button"
                                                            onClick={() => {
                                                                onChange?.(opt.value);
                                                                setIsDropdownOpen(false);
                                                                setSearchQuery('');
                                                            }}
                                                            className={cn(
                                                                'flex w-full items-center justify-between px-3 py-1.5 text-left text-[11px] font-bold transition-all',
                                                                value === opt.value
                                                                    ? 'bg-primary/10 text-primary'
                                                                    : 'text-foreground/70 hover:bg-muted',
                                                            )}
                                                            style={getTypographyStyle()}
                                                        >
                                                            <span className="truncate">{opt.label}</span>
                                                            {value === opt.value && <i className="fa-solid fa-check text-primary shrink-0 ml-2 text-[10px]" />}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="text-muted-foreground/40 px-3 py-4 text-center text-[10px] font-bold italic">
                                                        Tidak ada hasil.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                }

                return (
                    <div className="relative w-full">
                        {field.label && (
                            <Label
                                className="text-foreground/80 mb-1 block text-[10px] font-black tracking-tight uppercase"
                                style={getTypographyStyle(0.8, true)}
                            >
                                {field.label}
                                {field.is_required && <span className="text-destructive ml-0.5 font-bold">*</span>}
                            </Label>
                        )}
                        <select
                            value={value || ''}
                            onChange={(e) => onChange?.(e.target.value)}
                            className="flex h-9 w-full rounded-lg border border-slate-200 bg-slate-50/30 px-3 text-[11px] font-bold transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                            style={getTypographyStyle()}
                        >
                            <option value="">{field.placeholder || 'Select option...'}</option>
                            {selectOptions.map((opt: any) => (
                                <option key={opt.value} value={opt.value} style={getTypographyStyle()}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                );

            case 'signature_box':
                return (
                    <div className="flex w-full max-w-[180px] flex-col gap-1 py-2">
                        <div className="border-border bg-card ring-border/20 overflow-hidden rounded-lg border shadow-sm ring-1">
                            <div className="bg-muted/50 border-border border-b px-3 py-1.5 text-center">
                                <span
                                    className="text-foreground/60 shrink-0 text-[10px] leading-none font-black tracking-widest uppercase"
                                    style={getTypographyStyle(0.7, true)}
                                >
                                    {field.label || 'Tanda Tangan'}
                                </span>
                            </div>
                            <div className="flex h-24 flex-col items-center justify-end p-3 text-center">
                                {value ? (
                                    <div
                                        className="text-foreground mb-2 text-[12px] font-black tracking-tight uppercase"
                                        style={getTypographyStyle()}
                                    >
                                        [{value}]
                                    </div>
                                ) : (
                                    <div className="border-border/30 mb-2 h-4 w-full border-b-2" />
                                )}
                            </div>
                            <div className="border-border bg-muted/20 text-muted-foreground flex justify-between border-t px-3 py-2 text-start text-[8px] font-bold tracking-widest uppercase">
                                <span>TGL:</span>
                                <span>................</span>
                            </div>
                        </div>
                    </div>
                );

            case 'labeled_value':
                const labelWidth = field.options?.label_width || '150px';
                const valueType = field.options?.value_type || 'textfield';
                const showColon = field.options?.show_colon !== false;
                // Default to dashed_bottom for documents unless explicitly set to 'box'
                const isDashed = field.options?.field_style !== 'box';

                if (readOnly) {
                    return (
                        <div className="flex w-full items-baseline gap-2 py-1">
                            <span
                                className="text-muted-foreground shrink-0 text-[10px] font-black tracking-tight uppercase"
                                style={{
                                    width: labelWidth,
                                    ...getTypographyStyle(0.8, true),
                                }}
                            >
                                {field.label}
                                {showColon ? ' :' : ''}
                            </span>
                            <span
                                className={cn(commonTextStyles, 'text-foreground border-border min-h-[32px] flex-1 border-b border-dotted pb-1.5')}
                                style={getTypographyStyle()}
                            >
                                {renderValue(value)}
                            </span>
                        </div>
                    );
                }

                return (
                    <div className="flex w-full items-center gap-4 py-1">
                        <Label
                            className="text-foreground/70 shrink-0 text-[10px] font-black tracking-tight uppercase"
                            style={{
                                width: labelWidth,
                                ...getTypographyStyle(0.8, true),
                            }}
                        >
                            {field.label}
                            {showColon ? ' :' : ''}
                            {field.is_required && <span className="text-destructive ml-0.5 font-bold">*</span>}
                        </Label>
                        <div className={cn('group/input relative flex-1', isBuilder && 'bg-primary/5 ring-primary/20 rounded ring-1')}>
                            {valueType === 'textarea' ? (
                                <textarea
                                    placeholder={field.placeholder}
                                    value={value || ''}
                                    onChange={(e) => onChange?.(e.target.value)}
                                    className={cn(
                                        'placeholder:text-muted-foreground/50 flex min-h-[32px] w-full resize-none text-[11px] font-bold transition-all placeholder:italic',
                                        isDashed
                                            ? 'border-border focus:border-primary rounded-none border-t-0 border-r-0 border-b border-l-0 border-dashed bg-transparent px-0 shadow-none ring-0 outline-none focus:ring-0'
                                            : 'border-border bg-muted/20 focus:ring-primary/20 focus:border-primary rounded-lg border px-3 py-1.5 focus:ring-1',
                                    )}
                                    style={{
                                        minHeight: field.options?.min_height ? `${field.options.min_height}px` : '32px',
                                        ...getTypographyStyle(),
                                    }}
                                />
                            ) : valueType === 'select' ? (
                                <select
                                    value={value || ''}
                                    onChange={(e) => onChange?.(e.target.value)}
                                    className={cn(
                                        'flex h-8 w-full text-[11px] font-bold transition-all',
                                        isDashed
                                            ? 'border-border focus:border-primary rounded-none border-t-0 border-r-0 border-b border-l-0 border-dashed bg-transparent shadow-none ring-0 outline-none focus:ring-0'
                                            : 'border-border bg-muted/20 focus:ring-primary/20 focus:border-primary rounded-lg border px-3 focus:ring-1',
                                    )}
                                    style={getTypographyStyle()}
                                >
                                    <option value="">{field.placeholder || 'Pilih...'}</option>
                                    {(field.options?.items || []).map((opt: any) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            ) : valueType === 'searchable_select' ? (
                                <div className="relative flex-1">
                                    <button
                                        type="button"
                                        onClick={() => !readOnly && setIsDropdownOpen(!isDropdownOpen)}
                                        className={cn(
                                            'border-border flex h-8 w-full items-center justify-between transition-all focus:outline-none',
                                            isDashed
                                                ? 'rounded-none border-t-0 border-r-0 border-b border-l-0 border-dashed bg-transparent px-0'
                                                : 'bg-muted/20 focus:ring-primary/20 focus:border-primary rounded-lg border px-3 focus:ring-1',
                                            !value && 'opacity-80',
                                        )}
                                        style={getTypographyStyle()}
                                    >
                                        <span className="text-foreground truncate text-left text-[11px] font-bold">
                                            {(field.options?.items || []).find((o: any) => o.value === value)?.label || field.placeholder || 'Pilih...'}
                                        </span>
                                        <ChevronDown size={12} className={cn('text-muted-foreground ml-2 shrink-0 transition-transform', isDropdownOpen && 'rotate-180')} />
                                    </button>

                                    {isDropdownOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                                            <div className="border-border bg-popover animate-in fade-in zoom-in-95 absolute top-full right-0 left-0 z-50 mt-1 flex max-h-60 flex-col overflow-hidden rounded-xl border shadow-2xl duration-200">
                                                <div className="bg-popover border-border sticky top-0 z-10 border-b p-2">
                                                    <div className="relative">
                                                        <i className="fa-solid fa-magnifying-glass text-muted-foreground/50 absolute top-1/2 left-3 -translate-y-1/2 text-[10px]" />
                                                        <input
                                                            autoFocus
                                                            placeholder="Cari..."
                                                            value={searchQuery}
                                                            onChange={(e) => setSearchQuery(e.target.value)}
                                                            className="bg-muted/50 border-border focus:border-primary w-full rounded-md border py-1.5 pr-3 pl-8 text-[11px] font-bold outline-none"
                                                            style={getTypographyStyle()}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="overflow-y-auto py-1">
                                                    {(field.options?.items || [])
                                                        .filter((o: any) => o.label.toLowerCase().includes(searchQuery.toLowerCase()))
                                                        .map((opt: any) => (
                                                            <button
                                                                key={opt.value}
                                                                type="button"
                                                                onClick={() => {
                                                                    onChange?.(opt.value);
                                                                    setIsDropdownOpen(false);
                                                                    setSearchQuery('');
                                                                }}
                                                                className={cn(
                                                                    'flex w-full items-center justify-between px-3 py-1.5 text-left text-[11px] font-bold transition-all',
                                                                    value === opt.value ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:bg-muted',
                                                                )}
                                                                style={getTypographyStyle()}
                                                            >
                                                                <span className="truncate">{opt.label}</span>
                                                                {value === opt.value && <i className="fa-solid fa-check text-primary shrink-0 ml-2 text-[10px]" />}
                                                            </button>
                                                        ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : valueType === 'checkbox' ? (
                                <div className="flex h-8 items-center">
                                    <Checkbox disabled={readOnly} checked={!!value} onCheckedChange={(val) => onChange?.(val)} className="h-4 w-4" />
                                </div>
                            ) : (
                                <input
                                    type={valueType === 'number' ? 'number' : valueType === 'date' ? 'date' : 'text'}
                                    placeholder={field.placeholder}
                                    value={
                                        valueType === 'date' && typeof value === 'string'
                                            ? value.split('T')[0].split(' ')[0]
                                            : (value || '')
                                    }
                                    onChange={(e) => onChange?.(e.target.value)}
                                    className={cn(
                                        'placeholder:text-muted-foreground/50 flex h-8 w-full text-[11px] font-bold transition-all placeholder:italic',
                                        isDashed
                                            ? 'border-border focus:border-primary rounded-none border-t-0 border-r-0 border-b border-l-0 border-dashed bg-transparent px-0 shadow-none ring-0 outline-none focus:ring-0'
                                            : 'border-border bg-muted/20 focus:ring-primary/20 focus:border-primary rounded-lg border px-3 focus:ring-1',
                                    )}
                                    style={getTypographyStyle()}
                                />
                            )}

                            {isBuilder && (
                                <div className="pointer-events-none absolute top-1/2 right-2 flex -translate-y-1/2 gap-1">
                                    <span className="bg-primary/10 text-primary border-primary/20 rounded border px-1 text-[7px] font-black tracking-tighter uppercase shadow-sm">
                                        {valueType === 'textfield' ? 'Text' : valueType}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                );

            default:
                return <div className="text-[10px] text-slate-400 italic">Unknown field type: {field.type}</div>;
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={{ ...style, ...dndStyle }}
            className={cn(
                'group/element form-element-container relative transition-all duration-300',
                isBuilder && 'cursor-pointer',
                isBuilder && isSelected && 'z-10',
                diffStatus === 'added' && 'rounded-lg bg-emerald-50/70 ring-2 ring-emerald-200',
                diffStatus === 'removed' && 'rounded-lg bg-rose-50/70 ring-2 ring-rose-200',
                diffStatus === 'modified' && 'rounded-lg bg-amber-50/70 ring-2 ring-amber-200',
            )}
            onClick={(e) => {
                if (isBuilder) {
                    e.stopPropagation();
                    onSelect?.(field.id, e);
                }
            }}
        >
            {diffStatus && (
                <div
                    className={cn(
                        'absolute -top-2 -right-1 z-[60] rounded px-1.5 py-0.5 text-[7px] font-black tracking-tighter uppercase shadow-sm',
                        diffStatus === 'added' && 'bg-emerald-600 text-white',
                        diffStatus === 'removed' && 'bg-rose-600 text-white',
                        diffStatus === 'modified' && 'bg-amber-600 text-white',
                    )}
                >
                    {diffStatus}
                </div>
            )}
            <div style={{ ...getPaddingStyle(), position: 'relative' }}>
                {/* Visual Block Wrapper for Builder Mode */}
                {isBuilder && (
                    <>
                        {/* Outline & Highlight */}
                        <div
                            className={cn(
                                'pointer-events-none absolute -inset-1 rounded-xl border-2 transition-all',
                                isSelected
                                    ? 'border-primary bg-primary/[0.03] ring-primary/10 z-20 ring-4'
                                    : 'group-hover/element:border-primary/30 group-hover/element:bg-primary/[0.01] border-transparent',
                            )}
                        />

                        {/* Drag Handle & Toolbar */}
                        <div
                            className={cn(
                                'absolute -top-3 left-2 z-30 flex origin-left scale-90 items-center gap-1 opacity-0 transition-all',
                                'group-hover/element:scale-100 group-hover/element:opacity-100',
                                isSelected && 'scale-100 opacity-100',
                            )}
                        >
                            <div
                                {...attributes}
                                {...listeners}
                                className="bg-primary flex h-6 cursor-grab items-center gap-1.5 rounded-lg px-2 text-[8px] font-black text-white shadow-lg active:cursor-grabbing"
                            >
                                <GripVertical size={10} />
                                <span className="tracking-widest uppercase">{field.type.replace('_', ' ')}</span>
                            </div>
                            <div className="flex h-6 items-center rounded-lg border border-slate-200 bg-white px-1 shadow-md">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDuplicate?.(field.id);
                                    }}
                                    className="p-1 text-slate-400 transition-colors hover:text-indigo-600"
                                    title="Duplicate"
                                >
                                    <Copy size={10} />
                                </button>
                                <div className="mx-0.5 h-3 w-px bg-slate-100" />
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemove?.(field.id);
                                    }}
                                    className="p-1 text-slate-400 transition-colors hover:text-red-600"
                                    title="Delete"
                                >
                                    <Trash2 size={10} />
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {renderContent()}
            </div>
        </div>
    );
};
