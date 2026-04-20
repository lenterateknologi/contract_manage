import React, { useMemo } from 'react';
import { FormElement, FormField } from './FormElement';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface FormTemplate {
    id: string;
    name: string;
    description: string | null;
    has_letterhead: boolean;
    letterhead_json: any | null;
    fields: FormField[];
}

interface InteractiveFormProps {
    template: FormTemplate;
    formData: Record<string, any>;
    onChange?: (name: string, value: any) => void;
    readOnly?: boolean;
    className?: string;
}

export const InteractiveForm: React.FC<InteractiveFormProps> = ({
    template,
    formData,
    onChange,
    readOnly = false,
    className,
}) => {
    const rootFields = useMemo(() => {
        return (template?.fields || [])
            .filter((f) => !f.parent_id)
            .sort((a, b) => a.order - b.order);
    }, [template.fields]);

    const updateValue = (name: string, value: any) => {
        if (onChange) {
            onChange(name, value);
        }
    };

    return (
        <div 
            className={cn(
                "flex flex-col border border-slate-200 bg-white text-slate-950 shadow-2xl ring-1 ring-slate-200 transition-all mx-auto w-full max-w-[210mm] min-h-[297mm]",
                className
            )}
            style={{
                paddingTop: `${template.letterhead_json?.margins?.top ?? 15}mm`,
                paddingBottom: `${template.letterhead_json?.margins?.bottom ?? 15}mm`,
                paddingLeft: `${template.letterhead_json?.margins?.left ?? 15}mm`,
                paddingRight: `${template.letterhead_json?.margins?.right ?? 15}mm`,
            }}
        >
            <div className="flex-1 relative">
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
                    />
                ))}
            </div>
            
            {/* Standardized Footer for Visual Consistency */}
            <div className="mt-16 pt-8 border-t border-slate-100 flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-300">
                <span>Lentera Teknologi Legal System</span>
                <span>{template.name} / {readOnly ? 'Verified Copy' : 'Interactive Form'}</span>
            </div>
        </div>
    );
};
