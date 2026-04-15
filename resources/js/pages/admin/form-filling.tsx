import React, { useState, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import { 
    Download, 
    ArrowLeft, 
    FileText,
    Image as ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from '@/components/ui/separator';

interface FormField {
    id: string; 
    parent_id?: string | null;
    label: string;
    name: string;
    type: string;
    placeholder: string;
    is_required: boolean;
    use_rich_text?: boolean;
    width: '1/1' | '1/2' | '1/3' | '1/4';
    options: string[] | null;
    order: number;
}

interface FormTemplate {
    id: string;
    name: string;
    description: string | null;
    fields: FormField[];
}

interface Props {
    template: FormTemplate;
}

const WIDTH_OPTIONS = [
    { value: '1/1', cols: 'col-span-12' },
    { value: '1/2', cols: 'col-span-6' },
    { value: '1/3', cols: 'col-span-4' },
    { value: '1/4', cols: 'col-span-3' },
];

export default function FormFilling({ template }: Props) {
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [isExporting, setIsExporting] = useState(false);

    const updateValue = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDownloadPdf = async () => {
        setIsExporting(true);
        try {
            const response = await axios.post(route('admin.form-templates.export-pdf', template.id), {
                data: JSON.stringify(formData)
            }, {
                responseType: 'blob',
                headers: {
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as any)?.content || '',
                }
            });

            const url = window.URL.createObjectURL(response.data);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${template.name}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error('Export failed', error);
            alert('Terjadi kesalahan saat mengekspor PDF.');
        } finally {
            setIsExporting(false);
        }
    };

    const fieldTree = useMemo(() => {
        const roots = template.fields.filter(f => !f.parent_id);
        return roots;
    }, [template.fields]);

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 text-foreground font-inter">
            <Head title={`Fill Form: ${template.name}`} />
            
            <header className="h-14 border-b flex items-center justify-between px-6 bg-white shrink-0 z-10 shadow-sm sticky top-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="h-9 w-9 rounded-full hover:bg-slate-100">
                        <Link href={route('admin.form-templates.index')}><ArrowLeft size={18} className="text-slate-600" /></Link>
                    </Button>
                    <div className="flex flex-col">
                        <h1 className="text-sm font-black tracking-tight uppercase text-slate-800">{template.name}</h1>
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest leading-none">Interactive Form Filling</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={handleDownloadPdf} disabled={isExporting} className="h-9 px-5 text-[11px] font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all active:scale-95">
                        <Download size={14} className="mr-2" /> {isExporting ? "Generating..." : "Download PDF"}
                    </Button>
                </div>
            </header>

            <ScrollArea className="flex-1">
                <div className="py-12 flex justify-center w-full">
                    <div className="w-[210mm] min-h-[297mm] bg-white shadow-[0_0_50px_-12px_rgba(0,0,0,0.15)] p-[20mm] flex flex-col border border-slate-200">
                        <div className="grid grid-cols-12 gap-x-8 gap-y-8">
                            {fieldTree.map((field) => (
                                <InputComponent 
                                    key={field.id} 
                                    field={field} 
                                    value={formData[field.name]} 
                                    onChange={(val: any) => updateValue(field.name, val)}
                                    template={template}
                                    formData={formData}
                                    updateValue={updateValue}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}

(FormFilling as any).layout = (page: React.ReactNode) => page;

function InputComponent({ field, value, onChange, template, formData, updateValue }: any) {
    const widthClass = WIDTH_OPTIONS.find(opt => opt.value === field.width)?.cols || 'col-span-12';
    const children = template.fields.filter((f: any) => f.parent_id === field.id);

    if (field.type === 'kop_surat') return (
        <div className={cn("col-span-12 pb-6 border-b-[3px] border-slate-900 flex items-center gap-8 mb-8", 
            field.options?.logo_position === 'right' && "flex-row-reverse")}>
            <div style={{ width: field.options?.logo_size || 96, height: field.options?.logo_size || 96 }}
                className="flex items-center justify-center shrink-0 overflow-hidden transition-all">
                {field.options?.logo_url ? (
                    <img src={field.options.logo_url} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                    <span className="text-slate-300 font-black italic" style={{ fontSize: (field.options?.logo_size || 96) / 2.5 }}>LT</span>
                )}
            </div>
            <div className={cn("text-left flex-1", field.options?.logo_position === 'right' && "text-right")}>
                <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 leading-tight">{field.label || 'Company Name'}</h1>
                <div className="mt-2 text-xs font-bold text-slate-600 uppercase tracking-wide whitespace-pre-line">
                    {field.options?.description || 'Address and Contact Details'}
                </div>
            </div>
        </div>
    );

    if (field.type === 'form_title') return (
        <div className="col-span-12 py-10 text-center">
            <h2 className="text-3xl font-black tracking-tight uppercase text-balance">{field.label}</h2>
        </div>
    );

    if (field.type === 'sub_content') return (
        <div className={cn("py-4 text-slate-600 font-medium leading-relaxed", widthClass)}>
            {field.label}
        </div>
    );

    if (field.type === 'image') return (
        <div className={cn("py-4 overflow-hidden flex justify-center", widthClass)}>
            <img src={field.label} alt="Content" 
                style={{ width: `${field.options?.image_scale || 100}%` }}
                className="h-auto rounded-xl shadow-md object-contain transition-all" />
        </div>
    );

    return (
        <div className={cn("space-y-2", widthClass)}>
            {field.label && <Label className="text-[11px] font-black uppercase tracking-wide">{field.label}{field.is_required && "*"}</Label>}
            {field.type === 'text' && <Input value={value || ''} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} className="h-9 text-xs" />}
            {field.type === 'number' && <Input type="number" value={value || ''} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} className="h-9 text-xs" />}
            {field.type === 'date' && <Input type="date" value={value || ''} onChange={(e) => onChange(e.target.value)} className="h-9 text-xs" />}
            {field.type === 'textarea' && <Textarea value={value || ''} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} className="min-h-[100px] text-xs" />}
            {field.type === 'select' && (
                <Select value={value} onValueChange={onChange}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={field.placeholder} /></SelectTrigger>
                    <SelectContent>
                        {field.options?.map((opt: string) => (
                            <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
            {field.type === 'checkbox' && (
                <div className="flex items-center gap-2 pt-1">
                    <Checkbox checked={!!value} onCheckedChange={(checked) => onChange(!!checked)} id={`cb-${field.id}`} />
                    <Label htmlFor={`cb-${field.id}`} className="text-[10px] font-bold uppercase cursor-pointer">Setuju / Ya</Label>
                </div>
            )}

            {children.length > 0 && (
                <div className="col-span-12 mt-4 ml-6 pl-6 border-l-2 border-slate-100 grid grid-cols-12 gap-8">
                    {children.map((child: any) => (
                        <InputComponent 
                            key={child.id} 
                            field={child} 
                            value={formData[child.name]} 
                            onChange={(val: any) => updateValue(child.name, val)}
                            template={template}
                            formData={formData}
                            updateValue={updateValue}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
