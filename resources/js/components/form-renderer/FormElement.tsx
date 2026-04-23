import React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, GripVertical, Trash2, Copy, Plus, Move, ArrowUp, ArrowDown } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
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
        gridColumn: field.options?.grid_col_span ? `span ${field.options.grid_col_span}` : undefined,
        gridRow: field.options?.grid_row_span ? `span ${field.options.grid_row_span}` : undefined,
    };

    const getPaddingStyle = (defaults = { t: 0, b: 0, l: 0, r: 0 }) => ({
        paddingTop: `${field.options?.padding_top ?? field.options?.padding_y ?? defaults.t}px`,
        paddingBottom: `${field.options?.padding_bottom ?? field.options?.padding_y ?? defaults.b}px`,
        paddingLeft: `${field.options?.padding_left ?? field.options?.padding_x ?? defaults.l}px`,
        paddingRight: `${field.options?.padding_right ?? field.options?.padding_x ?? defaults.r}px`,
    });

    const renderChildren = (pid: string) => {
        const children = allFields
            .filter((f) => f.parent_id === pid)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

        if (isBuilder && children.length === 0) {
            return (
                <div className="flex w-full items-center justify-center rounded-lg border-2 border-dashed border-primary/20 bg-primary/5 py-8 text-[10px] font-black tracking-widest text-primary/40 uppercase transition-all hover:bg-primary/10">
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
    const commonTextStyles = "text-[11px] font-bold leading-relaxed";

    const getTypographyStyle = (scale = 1, isLabel = false) => {
        const options = field.options || {};
        return {
            fontSize: options.font_size ? `${options.font_size * scale}px` : undefined,
            fontWeight: isLabel ? (options.font_weight_label || options.font_weight || undefined) : (options.font_weight || undefined),
            fontFamily: options.font_family || undefined,
            fontStyle: options.font_style || undefined,
            textTransform: options.text_transform || undefined,
        };
    };

    const renderContent = () => {
        switch (field.type) {
            case 'group':
                return (
                    <div 
                        className={cn(
                            "min-h-0 transition-colors",
                            field.options?.group_style !== 'frameless' && "p-0.5",
                            field.options?.border_style === 'solid' ? "border-solid border-[#000]" : "border-none",
                        )}
                        style={{
                            borderStyle: (field.options?.border_style as any) || undefined,
                            borderWidth: field.options?.border_width ? `${field.options.border_width}px` : (field.options?.border_style === 'solid' ? '1px' : undefined),
                            borderColor: field.options?.border_color || undefined,
                            backgroundColor: field.options?.background_color || undefined,
                        }}
                    >
                        <div className="flex flex-wrap items-start content-start gap-0">{renderChildren(field.id)}</div>
                    </div>
                );

            case 'grid_x':
                return (
                    <div
                        className="grid w-full gap-0"
                        style={{
                            gridTemplateColumns: (field.options?.col_sizes || []).filter((s: string) => s).join(' ') || `repeat(${field.options?.grid_cols || 1}, 1fr)`,
                            borderStyle: (field.options?.border_style as any) || undefined,
                            borderWidth: field.options?.border_width ? `${field.options.border_width}px` : undefined,
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
                            'flex w-full',
                            field.options?.alignment === 'center' ? 'justify-center' : field.options?.alignment === 'right' ? 'justify-end' : 'justify-start'
                        )}
                    >
                        <img
                            src={field.options?.logo_url || field.options?.url || '/storage/app/public/fr_logo.png'}
                            style={{
                                width: field.options?.logo_size ? `${field.options.logo_size}px` : field.options?.size ? `${field.options.size}px` : '120px',
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

                return (
                    <div
                        className="w-full"
                        style={{
                            textAlign: (field.options?.alignment as any) || 'left',
                            color: field.options?.color || 'var(--foreground)',
                            whiteSpace: 'pre-wrap',
                            lineHeight: field.options?.line_height || '1.2',
                            letterSpacing: field.options?.letter_spacing || 'normal',
                            backgroundColor: field.options?.background_color || undefined,
                            borderStyle: (field.options?.border_style as any) || undefined,
                            borderWidth: field.options?.border_width ? `${field.options.border_width}px` : undefined,
                            borderColor: field.options?.border_color || undefined,
                            ...getTypographyStyle()
                        }}
                    >
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
                                    className="text-muted-foreground min-w-[120px] shrink-0 whitespace-nowrap text-[10px] font-black uppercase tracking-tight"
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
                                className={cn(commonTextStyles, "text-foreground border-b border-dotted border-border flex-1 min-h-[1.2rem]")}
                                style={{
                                    fontSize: field.options?.font_size ? `${field.options.font_size}px` : undefined,
                                    fontWeight: field.options?.font_weight || undefined,
                                    fontFamily: field.options?.font_family || undefined,
                                    fontStyle: field.options?.font_style || undefined,
                                }}
                            >
                                {value || '—'}
                            </span>
                        </div>
                    );
                }
                return (
                    <div className={cn(
                        "relative w-full",
                        isBuilder && "rounded bg-primary/5 ring-1 ring-primary/20 p-0.5"
                    )}>
                        {field.label && field.options?.field_style !== 'dashed_bottom' && (
                            <Label className="mb-1 block text-[10px] font-black tracking-tight text-foreground/70 uppercase">
                                {field.label}
                                {field.is_required && <span className="ml-0.5 text-destructive font-bold">*</span>}
                            </Label>
                        )}
                        <div className="relative group/input">
                            <input
                                type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                placeholder={field.placeholder}
                                value={value || ''}
                                onChange={(e) => onChange?.(e.target.value)}
                                className={cn(
                                    "flex min-h-[32px] w-full text-[11px] font-bold transition-all placeholder:italic placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-primary/20",
                                    field.options?.field_style === 'dashed_bottom' 
                                        ? "rounded-none border-t-0 border-l-0 border-r-0 border-b border-dashed border-border bg-transparent px-0 focus:border-primary font-bold" 
                                        : "rounded-lg border border-border bg-muted/20 px-3 focus:border-primary"
                                )}
                                style={getTypographyStyle()}
                            />
                            {isBuilder && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                                    <span className="bg-primary/10 text-primary text-[7px] font-black uppercase px-1 rounded border border-primary/20 shadow-sm">
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
                                    className="text-[10px] font-black uppercase tracking-tight text-muted-foreground mb-1"
                                    style={getTypographyStyle(0.8, true)}
                                >
                                    {field.label} :
                                </div>
                            )}
                            <span 
                                className={cn(commonTextStyles, "text-foreground border-b border-dotted border-border flex-1 min-h-[1.2rem] block")}
                                style={getTypographyStyle()}
                            >
                                {value || '—'}
                            </span>
                        </div>
                    );
                }
                return (
                    <div className={cn(
                        "relative w-full",
                        isBuilder && "rounded bg-primary/5 ring-1 ring-primary/20 p-0.5"
                    )}>
                        {field.label && field.options?.field_style !== 'dashed_bottom' && (
                            <Label 
                                className="mb-1 block text-[10px] font-black tracking-tight text-foreground/70 uppercase"
                                style={getTypographyStyle(0.8, true)}
                            >
                                {field.label}
                                {field.is_required && <span className="ml-0.5 text-destructive font-bold">*</span>}
                            </Label>
                        )}
                        <div className="relative group/input">
                            <textarea
                                placeholder={field.placeholder}
                                value={value || ''}
                                onChange={(e) => onChange?.(e.target.value)}
                                className={cn(
                                    "flex min-h-[80px] w-full resize-none text-[11px] font-bold transition-all placeholder:italic placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-primary/20",
                                    field.options?.border_style === 'solid' 
                                        ? "rounded-none border-solid border-foreground p-2" 
                                        : "rounded-lg border border-border bg-muted/20 px-3 py-2 focus:border-primary"
                                )}
                                style={{ 
                                    minHeight: field.options?.min_height ? `${field.options.min_height}px` : undefined,
                                    ...getTypographyStyle()
                                }}
                            />
                            {isBuilder && (
                                <div className="absolute right-2 top-2 flex items-center gap-1 pointer-events-none">
                                    <span className="bg-primary/10 text-primary text-[7px] font-black uppercase px-1 rounded border border-primary/20 shadow-sm">
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
                            <div className={cn(
                                "h-4 w-4 rounded border flex items-center justify-center transition-colors",
                                value ? "bg-foreground border-foreground text-background" : "bg-card border-border"
                            )}>
                                {value && <i className="fa-solid fa-check text-[10px]" />}
                            </div>
                            <span 
                                className="text-[11px] font-bold text-foreground uppercase"
                                style={getTypographyStyle(1, true)}
                            >
                                {field.label}
                            </span>
                        </div>
                    );
                }
                return (
                    <div 
                        className="flex items-center gap-2 py-1 cursor-pointer group"
                        onClick={() => onChange?.(!value)}
                    >
                        <div className={cn(
                            "h-4.5 w-4.5 rounded border-2 flex items-center justify-center transition-all duration-200",
                            value 
                                ? "bg-primary border-primary shadow-sm" 
                                : "bg-card border-border group-hover:border-primary/50"
                        )}>
                            {value && <i className="fa-solid fa-check text-primary-foreground text-[10px] scale-110" />}
                        </div>
                        <Label 
                            className="text-[11px] font-black tracking-tight text-foreground/70 uppercase cursor-pointer select-none"
                            style={getTypographyStyle(1, true)}
                        >
                            {field.label}
                            {field.is_required && <span className="ml-0.5 text-destructive font-bold">*</span>}
                        </Label>
                    </div>
                );

            case 'radio':
                const options = field.options?.items || [];
                if (readOnly) {
                    return (
                        <div className="flex flex-col gap-1.5 py-1">
                            {field.label && <div className="text-[10px] font-black uppercase tracking-tight text-muted-foreground mb-0.5">{field.label}</div>}
                            <div className="flex flex-wrap gap-4">
                                {options.map((opt: any) => (
                                    <div key={opt.value} className="flex items-center gap-1.5">
                                        <div className={cn(
                                            "h-3.5 w-3.5 rounded-full border flex items-center justify-center",
                                            value === opt.value ? "bg-foreground border-foreground" : "bg-card border-border"
                                        )}>
                                            {value === opt.value && <div className="h-1.5 w-1.5 rounded-full bg-background" />}
                                        </div>
                                        <span className={cn("text-[10px] font-bold uppercase", value === opt.value ? "text-foreground" : "text-muted-foreground/60")}>
                                            {opt.label}
                                        </span>
                                    </div>
                                ))}
                                {options.length === 0 && <span className={cn(commonTextStyles, "text-foreground")}>{value || '—'}</span>}
                            </div>
                        </div>
                    );
                }
                return (
                    <div className="flex flex-col gap-2 py-1">
                        {field.label && (
                            <Label className="text-[10px] font-black tracking-tight text-foreground/70 uppercase">
                                {field.label}
                                {field.is_required && <span className="ml-0.5 text-destructive font-bold">*</span>}
                            </Label>
                        )}
                        <div className="flex flex-wrap gap-4">
                            {options.map((opt: any) => (
                                <div 
                                    key={opt.value} 
                                    className="flex items-center gap-2 cursor-pointer group"
                                    onClick={() => onChange?.(opt.value)}
                                >
                                    <div className={cn(
                                        "h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all",
                                        value === opt.value 
                                            ? "border-primary bg-white" 
                                            : "border-border bg-white group-hover:border-primary"
                                    )}>
                                        {value === opt.value && <div className="h-2 w-2 rounded-full bg-primary animate-in zoom-in-50 duration-200" />}
                                    </div>
                                    <span className="text-[11px] font-bold text-foreground/70 uppercase select-none group-hover:text-primary transition-colors">
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
                                    className="text-[10px] font-black uppercase tracking-tight text-muted-foreground whitespace-nowrap min-w-[120px] shrink-0"
                                    style={getTypographyStyle(0.8, true)}
                                >
                                    {field.label} :
                                </span>
                            )}
                            <span 
                                className={cn(commonTextStyles, "text-foreground border-b border-dotted border-border flex-1 min-h-[1.2rem]")}
                                style={getTypographyStyle()}
                            >
                                {selectOptions.find((o: any) => o.value === value)?.label || value || '—'}
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
                                    className="mb-1 block text-[10px] font-black tracking-tight text-foreground/70 uppercase"
                                    style={getTypographyStyle(0.8, true)}
                                >
                                    {field.label}
                                    {field.is_required && <span className="ml-0.5 text-destructive font-bold">*</span>}
                                </Label>
                            )}
                            
                            <div className="relative">
                                <button 
                                    type="button"
                                    onClick={() => !readOnly && setIsDropdownOpen(!isDropdownOpen)}
                                    className={cn(
                                        "flex h-9 w-full items-center justify-between rounded-lg border border-border bg-muted/20 px-3 transition-all hover:bg-muted/30 focus:outline-none focus:ring-1 focus:ring-primary/20",
                                        !value && "opacity-80"
                                    )}
                                    style={getTypographyStyle()}
                                >
                                    <span className={cn(selectedLabel ? "text-foreground" : "text-muted-foreground/60 italic font-medium")}>
                                        {selectedLabel || field.placeholder || 'Pilih...'}
                                    </span>
                                    <i className={cn("fa-solid fa-chevron-down text-[10px] transition-transform text-muted-foreground/40", isDropdownOpen && "rotate-180")} />
                                </button>

                                {isDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                                        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 flex flex-col overflow-hidden rounded-xl border border-border bg-popover shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                                            <div className="sticky top-0 bg-popover z-10 p-2 border-b border-border">
                                                <div className="relative">
                                                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/50" />
                                                    <input 
                                                        autoFocus
                                                        placeholder="Cari..."
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        className="w-full bg-muted/50 border border-border rounded-md py-1.5 pl-8 pr-3 text-[11px] font-bold outline-none focus:border-primary"
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
                                                                "w-full px-3 py-2 text-left text-[11px] font-bold transition-all flex items-center justify-between",
                                                                value === opt.value 
                                                                    ? "bg-primary/10 text-primary" 
                                                                    : "text-foreground/70 hover:bg-muted"
                                                            )}
                                                            style={getTypographyStyle()}
                                                        >
                                                            {opt.label}
                                                            {value === opt.value && <i className="fa-solid fa-check text-[10px]" />}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-3 py-4 text-center text-[10px] font-bold text-muted-foreground/40 italic">
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
                                className="mb-1 block text-[10px] font-black tracking-tight text-foreground/80 uppercase"
                                style={getTypographyStyle(0.8, true)}
                            >
                                {field.label}
                                {field.is_required && <span className="ml-0.5 text-destructive font-bold">*</span>}
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
                                <option key={opt.value} value={opt.value} style={getTypographyStyle()}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                );

            case 'signature_box':
                return (
                    <div className="flex flex-col gap-1 w-full max-w-[180px] py-2">
                        <div className="border border-border rounded-lg overflow-hidden bg-card shadow-sm ring-1 ring-border/20">
                            <div className="bg-muted/50 border-b border-border px-3 py-1.5 text-center">
                                <span 
                                    className="text-foreground/60 shrink-0 text-[10px] font-black uppercase tracking-widest leading-none"
                                    style={getTypographyStyle(0.7, true)}
                                >
                                    {field.label || 'Tanda Tangan'}
                                </span>
                            </div>
                            <div className="h-24 flex flex-col items-center justify-end p-3 text-center">
                                {value ? (
                                    <div 
                                        className="text-foreground uppercase tracking-tight mb-2 text-[12px] font-black"
                                        style={getTypographyStyle()}
                                    >
                                        [{value}]
                                    </div>
                                ) : (
                                    <div className="w-full border-b-2 border-border/30 mb-2 h-4" />
                                )}
                            </div>
                            <div className="border-t border-border bg-muted/20 px-3 py-2 text-[8px] font-bold text-muted-foreground uppercase tracking-widest text-start flex justify-between">
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
                const isDashed = field.options?.field_style === 'dashed_bottom';

                if (readOnly) {
                    return (
                        <div className="flex w-full items-baseline gap-2 py-1">
                            <span 
                                className="text-muted-foreground shrink-0 text-[10px] font-black uppercase tracking-tight"
                                style={{ 
                                    width: labelWidth,
                                    ...getTypographyStyle(0.8, true)
                                }}
                            >
                                {field.label}{showColon ? ' :' : ''}
                            </span>
                            <span 
                                className={cn(commonTextStyles, "text-foreground border-b border-dotted border-border flex-1 min-h-[1.2rem]")}
                                style={getTypographyStyle()}
                            >
                                {value || '—'}
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
                                ...getTypographyStyle(0.8, true)
                            }}
                        >
                            {field.label}{showColon ? ' :' : ''}
                            {field.is_required && <span className="ml-0.5 text-destructive font-bold">*</span>}
                        </Label>
                        <div className={cn(
                            "flex-1 relative group/input",
                            isBuilder && "rounded bg-primary/5 ring-1 ring-primary/20"
                        )}>
                            {valueType === 'textarea' ? (
                                <textarea
                                    placeholder={field.placeholder}
                                    value={value || ''}
                                    onChange={(e) => onChange?.(e.target.value)}
                                    className={cn(
                                        "flex min-h-[32px] w-full resize-none text-[11px] font-bold transition-all placeholder:italic placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-primary/20",
                                        isDashed
                                            ? "rounded-none border-t-0 border-l-0 border-r-0 border-b border-dashed border-border bg-transparent px-0 focus:border-primary"
                                            : "rounded-lg border border-border bg-muted/20 px-3 py-1.5 focus:border-primary"
                                    )}
                                    style={{ 
                                        minHeight: field.options?.min_height ? `${field.options.min_height}px` : '32px',
                                        ...getTypographyStyle()
                                    }}
                                />
                            ) : valueType === 'select' || valueType === 'searchable_select' ? (
                                <div className={cn(
                                    "flex h-8 w-full items-center justify-between transition-all",
                                    isDashed
                                        ? "rounded-none border-t-0 border-l-0 border-r-0 border-b border-dashed border-border bg-transparent px-0 focus:border-primary"
                                        : "rounded-lg border border-border bg-muted/20 px-3 focus:border-primary"
                                )}>
                                    <span className="text-[11px] font-bold text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                                        {value || field.options?.placeholder || 'Pilih...'}
                                    </span>
                                    <ChevronDown size={12} className="text-muted-foreground shrink-0 ml-2" />
                                </div>
                            ) : valueType === 'checkbox' ? (
                                <div className="flex h-8 items-center">
                                    <Checkbox
                                        disabled={readOnly}
                                        checked={!!value}
                                        onCheckedChange={(val) => onChange?.(val)}
                                        className="h-4 w-4"
                                    />
                                </div>
                            ) : (
                                <input
                                    type={valueType === 'number' ? 'number' : valueType === 'date' ? 'date' : 'text'}
                                    placeholder={field.placeholder}
                                    value={value || ''}
                                    onChange={(e) => onChange?.(e.target.value)}
                                    className={cn(
                                        "flex h-8 w-full text-[11px] font-bold transition-all placeholder:italic placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-primary/20",
                                        isDashed
                                            ? "rounded-none border-t-0 border-l-0 border-r-0 border-b border-dashed border-border bg-transparent px-0 focus:border-primary"
                                            : "rounded-lg border border-border bg-muted/20 px-3 focus:border-primary"
                                    )}
                                    style={getTypographyStyle()}
                                />
                            )}

                            {isBuilder && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 pointer-events-none">
                                    <span className="bg-primary/10 text-primary text-[7px] font-black uppercase px-1 rounded border border-primary/20 shadow-sm tracking-tighter">
                                        {valueType === 'textfield' ? 'Text' : valueType}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="text-[10px] text-slate-400 italic">
                        Unknown field type: {field.type}
                    </div>
                );
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={{ ...style, ...dndStyle }}
            className={cn(
                'relative transition-all duration-200',
                isBuilder && 'group/element',
                isBuilder && isSelected && 'z-10'
            )}
            onClick={(e) => {
                if (isBuilder) {
                    e.stopPropagation();
                    onSelect?.(field.id, e);
                }
            }}
        >
            <div style={{ ...getPaddingStyle(), position: 'relative' }}>
                {/* Visual Block Wrapper for Builder Mode */}
                {isBuilder && (
                    <>
                        {/* Outline & Highlight */}
                        <div className={cn(
                            "absolute -inset-1 rounded-xl pointer-events-none transition-all border-2",
                            isSelected 
                                ? "border-primary bg-primary/[0.03] ring-4 ring-primary/10 z-20" 
                                : "border-transparent group-hover/element:border-primary/30 group-hover/element:bg-primary/[0.01]"
                        )} />

                        {/* Drag Handle & Toolbar */}
                        <div className={cn(
                            "absolute -top-3 left-2 z-30 flex items-center gap-1 opacity-0 transition-all scale-90 origin-left",
                            "group-hover/element:opacity-100 group-hover/element:scale-100",
                            isSelected && "opacity-100 scale-100"
                        )}>
                            <div 
                                {...attributes} 
                                {...listeners}
                                className="flex h-6 items-center gap-1.5 rounded-lg bg-primary px-2 text-[8px] font-black text-white shadow-lg cursor-grab active:cursor-grabbing"
                            >
                                <GripVertical size={10} />
                                <span className="uppercase tracking-widest">{field.type.replace('_', ' ')}</span>
                            </div>
                                               <div className="flex h-6 items-center rounded-lg bg-white border border-slate-200 px-1 shadow-md">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDuplicate?.(field.id);
                                    }}
                                    className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                                    title="Duplicate"
                                >
                                    <Copy size={10} />
                                </button>
                                <div className="w-px h-3 bg-slate-100 mx-0.5" />
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemove?.(field.id);
                                    }}
                                    className="p-1 text-slate-400 hover:text-red-600 transition-colors"
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
