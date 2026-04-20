import React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

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
}

export const FormElement: React.FC<FormElementProps> = ({
    field,
    allFields,
    value,
    onChange,
    previewData = {},
    updateValue = () => {},
    readOnly = false,
}) => {
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

    const renderChildren = (pid: string) =>
        allFields
            .filter((f) => f.parent_id === pid)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((child) => (
                <FormElement
                    key={child.id}
                    field={child}
                    allFields={allFields}
                    value={previewData[child.name]}
                    onChange={(val: any) => updateValue(child.name, val)}
                    previewData={previewData}
                    updateValue={updateValue}
                    readOnly={readOnly}
                />
            ));

    // Common styling shared between input and readonly text
    const commonTextStyles = "text-[11px] font-bold leading-relaxed";

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
                return (
                    <div
                        className="w-full"
                        style={{
                            fontSize: field.options?.font_size ? `${field.options.font_size}px` : '14px',
                            fontWeight: field.options?.font_weight || 'normal',
                            fontStyle: field.options?.font_style || 'normal',
                            textAlign: (field.options?.alignment as any) || 'left',
                            color: field.options?.color || '#000',
                            whiteSpace: 'pre-wrap',
                            lineHeight: field.options?.line_height || '1.2',
                            backgroundColor: field.options?.background_color || undefined,
                            borderStyle: (field.options?.border_style as any) || undefined,
                            borderWidth: field.options?.border_width ? `${field.options.border_width}px` : undefined,
                            borderColor: field.options?.border_color || undefined,
                        }}
                    >
                        {field.label || ''}
                    </div>
                );

            case 'textfield':
            case 'number':
            case 'date':
                if (readOnly) {
                    return (
                        <div className="flex w-full items-baseline gap-2 py-0.5">
                            {field.label && (
                                <span className="text-[10px] font-black uppercase tracking-tight text-slate-500 whitespace-nowrap min-w-[120px] shrink-0">
                                    {field.label} :
                                </span>
                            )}
                            <span className={cn(commonTextStyles, "text-slate-900 border-b border-dotted border-slate-200 flex-1 min-h-[1.2rem]")}>
                                {value || '—'}
                            </span>
                        </div>
                    );
                }
                return (
                    <div className="relative w-full">
                        {field.label && field.options?.field_style !== 'dashed_bottom' && (
                            <Label className="mb-1 block text-[10px] font-black tracking-tight text-slate-700 uppercase">
                                {field.label}
                                {field.is_required && <span className="ml-0.5 text-red-500 font-bold">*</span>}
                            </Label>
                        )}
                        <input
                            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                            placeholder={field.placeholder}
                            value={value || ''}
                            onChange={(e) => onChange?.(e.target.value)}
                            className={cn(
                                "flex min-h-[32px] w-full text-[11px] font-bold transition-all placeholder:italic placeholder:text-slate-300 focus:ring-1 focus:ring-indigo-500/20",
                                field.options?.field_style === 'dashed_bottom' 
                                    ? "rounded-none border-t-0 border-l-0 border-r-0 border-b border-dashed border-slate-400 bg-transparent px-0 focus:border-indigo-500" 
                                    : "rounded-lg border border-slate-200 bg-slate-50/30 px-3 focus:border-indigo-500"
                            )}
                        />
                    </div>
                );

            case 'textarea':
                if (readOnly) {
                    return (
                        <div className="w-full py-1">
                            {field.label && (
                                <div className="text-[10px] font-black uppercase tracking-tight text-slate-500 mb-1">
                                    {field.label}
                                </div>
                            )}
                            <div className={cn(commonTextStyles, "text-slate-900 bg-slate-50/30 border border-slate-100 p-2 rounded min-h-[40px] whitespace-pre-wrap")}>
                                {value || '—'}
                            </div>
                        </div>
                    );
                }
                return (
                    <div className="relative w-full">
                        {field.label && field.options?.field_style !== 'dashed_bottom' && (
                            <Label className="mb-1 block text-[10px] font-black tracking-tight text-slate-700 uppercase">
                                {field.label}
                                {field.is_required && <span className="ml-0.5 text-red-500 font-bold">*</span>}
                            </Label>
                        )}
                        <textarea
                            placeholder={field.placeholder}
                            value={value || ''}
                            onChange={(e) => onChange?.(e.target.value)}
                            className={cn(
                                "flex min-h-[80px] w-full resize-none text-[11px] font-bold transition-all placeholder:italic placeholder:text-slate-300 focus:ring-1 focus:ring-indigo-500/20",
                                field.options?.border_style === 'solid' 
                                    ? "rounded-none border-solid border-[#000] p-2" 
                                    : "rounded-lg border border-slate-200 bg-slate-50/30 px-3 py-2 focus:border-indigo-500"
                            )}
                            style={{ minHeight: field.options?.min_height ? `${field.options.min_height}px` : undefined }}
                        />
                    </div>
                );

            case 'checkbox':
                if (readOnly) {
                    return (
                        <div className="flex items-center gap-2 py-1">
                            <div className={cn(
                                "h-4 w-4 rounded border flex items-center justify-center transition-colors",
                                value ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-300"
                            )}>
                                {value && <i className="fa-solid fa-check text-[10px]" />}
                            </div>
                            <span className="text-[11px] font-bold text-slate-900 uppercase">
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
                                ? "bg-indigo-600 border-indigo-600 shadow-sm" 
                                : "bg-white border-slate-300 group-hover:border-indigo-400"
                        )}>
                            {value && <i className="fa-solid fa-check text-white text-[10px] scale-110" />}
                        </div>
                        <Label className="text-[11px] font-black tracking-tight text-slate-700 uppercase cursor-pointer select-none">
                            {field.label}
                            {field.is_required && <span className="ml-0.5 text-red-500 font-bold">*</span>}
                        </Label>
                    </div>
                );

            case 'radio':
                const options = field.options?.items || [];
                if (readOnly) {
                    return (
                        <div className="flex flex-col gap-1.5 py-1">
                            {field.label && <div className="text-[10px] font-black uppercase tracking-tight text-slate-500 mb-0.5">{field.label}</div>}
                            <div className="flex flex-wrap gap-4">
                                {options.map((opt: any) => (
                                    <div key={opt.value} className="flex items-center gap-1.5">
                                        <div className={cn(
                                            "h-3.5 w-3.5 rounded-full border flex items-center justify-center",
                                            value === opt.value ? "bg-slate-900 border-slate-900" : "bg-white border-slate-300"
                                        )}>
                                            {value === opt.value && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                        </div>
                                        <span className={cn("text-[10px] font-bold uppercase", value === opt.value ? "text-slate-900" : "text-slate-400")}>
                                            {opt.label}
                                        </span>
                                    </div>
                                ))}
                                {options.length === 0 && <span className={cn(commonTextStyles, "text-slate-900")}>{value || '—'}</span>}
                            </div>
                        </div>
                    );
                }
                return (
                    <div className="flex flex-col gap-2 py-1">
                        {field.label && (
                            <Label className="text-[10px] font-black tracking-tight text-slate-700 uppercase">
                                {field.label}
                                {field.is_required && <span className="ml-0.5 text-red-500 font-bold">*</span>}
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
                                            ? "border-indigo-600 bg-white" 
                                            : "border-slate-300 bg-white group-hover:border-indigo-400"
                                    )}>
                                        {value === opt.value && <div className="h-2 w-2 rounded-full bg-indigo-600 animate-in zoom-in-50 duration-200" />}
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-600 uppercase select-none group-hover:text-indigo-600 transition-colors">
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
                                <span className="text-[10px] font-black uppercase tracking-tight text-slate-500 whitespace-nowrap min-w-[120px] shrink-0">
                                    {field.label} :
                                </span>
                            )}
                            <span className={cn(commonTextStyles, "text-slate-900 border-b border-dotted border-slate-200 flex-1 min-h-[1.2rem]")}>
                                {selectOptions.find((o: any) => o.value === value)?.label || value || '—'}
                            </span>
                        </div>
                    );
                }

                // If searchable, we'll use a local state for filtering
                const [searchQuery, setSearchQuery] = React.useState('');
                const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
                
                const filteredOptions = searchQuery 
                    ? selectOptions.filter((o: any) => o.label.toLowerCase().includes(searchQuery.toLowerCase()))
                    : selectOptions;

                const selectedLabel = selectOptions.find((o: any) => o.value === value)?.label || '';

                if (isSearchable) {
                    return (
                        <div className="relative w-full">
                            {field.label && (
                                <Label className="mb-1 block text-[10px] font-black tracking-tight text-slate-700 uppercase">
                                    {field.label}
                                    {field.is_required && <span className="ml-0.5 text-red-500 font-bold">*</span>}
                                </Label>
                            )}
                            
                            <div className="relative">
                                <div 
                                    onClick={() => !readOnly && setIsDropdownOpen(!isDropdownOpen)}
                                    className={cn(
                                        "flex h-9 w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50/30 px-3 text-[11px] font-bold transition-all cursor-pointer",
                                        isDropdownOpen ? "border-indigo-500 ring-1 ring-indigo-500/20" : "hover:border-slate-300"
                                    )}
                                >
                                    <span className={cn(selectedLabel ? "text-slate-900" : "text-slate-400 italic font-medium")}>
                                        {selectedLabel || field.placeholder || 'Select or search...'}
                                    </span>
                                    <i className={cn("fa-solid fa-chevron-down text-[10px] transition-transform text-slate-400", isDropdownOpen && "rotate-180")} />
                                </div>

                                {isDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                                        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                                            <div className="sticky top-0 border-b border-slate-100 bg-slate-50 p-2">
                                                <div className="relative">
                                                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400" />
                                                    <input 
                                                        autoFocus
                                                        placeholder="Cari..."
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        className="h-8 w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 text-[11px] font-bold focus:border-indigo-500 focus:outline-hidden"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                            </div>
                                            <div className="overflow-y-auto py-1">
                                                {filteredOptions.length > 0 ? (
                                                    filteredOptions.map((opt: any) => (
                                                        <div 
                                                            key={opt.value}
                                                            onClick={() => {
                                                                onChange?.(opt.value);
                                                                setIsDropdownOpen(false);
                                                                setSearchQuery('');
                                                            }}
                                                            className={cn(
                                                                "flex cursor-pointer items-center justify-between px-3 py-2 text-[11px] font-bold transition-all",
                                                                value === opt.value 
                                                                    ? "bg-indigo-50 text-indigo-700" 
                                                                    : "text-slate-600 hover:bg-slate-50"
                                                            )}
                                                        >
                                                            <span>{opt.label}</span>
                                                            {value === opt.value && <i className="fa-solid fa-check text-[10px]" />}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="px-3 py-4 text-center text-[10px] font-bold text-slate-400 italic">
                                                        Tidak ada hasil
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
                            <Label className="mb-1 block text-[10px] font-black tracking-tight text-slate-700 uppercase">
                                {field.label}
                                {field.is_required && <span className="ml-0.5 text-red-500 font-bold">*</span>}
                            </Label>
                        )}
                        <select
                            value={value || ''}
                            onChange={(e) => onChange?.(e.target.value)}
                            className="flex h-9 w-full rounded-lg border border-slate-200 bg-slate-50/30 px-3 text-[11px] font-bold transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                        >
                            <option value="">{field.placeholder || 'Select option...'}</option>
                            {selectOptions.map((opt: any) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                );

            case 'signature_box':
                return (
                    <div className="flex flex-col gap-1 w-full max-w-[180px] py-2">
                        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white shadow-sm ring-1 ring-slate-100">
                            <div className="bg-slate-50/80 border-b border-slate-200 px-3 py-1.5 text-center">
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none">
                                    {field.label || 'Tanda Tangan'}
                                </span>
                            </div>
                            <div className="h-24 flex flex-col items-center justify-end p-3 text-center">
                                {value ? (
                                    <div className="text-slate-900 text-[12px] font-black uppercase tracking-tight mb-2">
                                        [{value}]
                                    </div>
                                ) : (
                                    <div className="w-full border-b-2 border-slate-100 mb-2 h-4" />
                                )}
                            </div>
                            <div className="border-t border-slate-100 bg-slate-50/30 px-3 py-2 text-[8px] font-bold text-slate-400 uppercase tracking-widest text-start flex justify-between">
                                <span>TGL:</span>
                                <span>................</span>
                            </div>
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
        <div style={style} className="relative transition-all duration-200">
            <div style={{ ...getPaddingStyle(), position: 'relative' }}>
                {renderContent()}
            </div>
        </div>
    );
};
