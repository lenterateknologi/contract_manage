import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import { ArrowLeft, Download, FileText, Layout as LayoutIcon, Eye } from 'lucide-react';
import React, { useMemo, useState, useEffect } from 'react';
import { InteractiveForm, FormTemplate } from '@/components/form-renderer/InteractiveForm';
import { useToast } from '@/components/contracts/Toast';

// FormTemplate interface is now imported from InteractiveForm

interface Props {
    template: FormTemplate;
}

const WIDTH_OPTIONS = Array.from({ length: 20 }, (_, i) => {
    const pct = (i + 1) * 5;
    return { 
        value: pct.toString(), 
        cols: `col-span-${i + 1}`, 
        wClass: `w-[${pct}%]` 
    };
});

export default function FormFilling({ template }: Props) {
    const { showToast } = useToast();
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [isExporting, setIsExporting] = useState(false);

    const updateValue = (name: string, value: any) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleDownloadPdf = async () => {
        setIsExporting(true);
        try {
            const response = await axios.post(
                route('admin.form-templates.export-pdf', template.id),
                {
                    data: JSON.stringify(formData),
                },
                {
                    responseType: 'blob',
                    headers: {
                        'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as any)?.content || '',
                    },
                },
            );

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
            showToast('Terjadi kesalahan saat mengekspor PDF.', 'danger');
        } finally {
            setIsExporting(false);
        }
    };

    const rootFields = useMemo(() => {
        return (template?.fields || []).filter((f) => !f.parent_id).sort((a, b) => a.order - b.order);
    }, [template.fields]);

    const [showPreview, setShowPreview] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);

    // Live PDF Preview logic (Throttled)
    useEffect(() => {
        if (!showPreview) return;

        const timer = setTimeout(async () => {
            setIsPreviewLoading(true);
            try {
                const response = await axios.post(
                    route('admin.form-templates.stream-pdf', template.id),
                    { data: JSON.stringify(formData) },
                    { 
                        responseType: 'blob',
                        headers: { 'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as any)?.content || '' }
                    }
                );
                
                if (previewUrl) window.URL.revokeObjectURL(previewUrl);
                const url = window.URL.createObjectURL(response.data);
                setPreviewUrl(url);
            } catch (error) {
                console.error('Preview failed', error);
            } finally {
                setIsPreviewLoading(false);
            }
        }, 1500); // 1.5s throttle

        return () => clearTimeout(timer);
    }, [formData, showPreview]);

    return (
         <div className="font-inter flex h-screen flex-col bg-muted/20 overflow-hidden">
            <Head title={`Fill Form: ${template.name}`} />

             <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/80 backdrop-blur-md px-6 shadow-sm">
                <div className="flex items-center gap-4">
                     <Button variant="ghost" size="icon" asChild className="h-9 w-9 rounded-full hover:bg-muted">
                         <Link href={route('admin.form-templates.index')}>
                             <ArrowLeft size={18} className="text-muted-foreground" />
                         </Link>
                     </Button>
                     <div className="flex flex-col">
                         <h1 className="text-xs font-black tracking-tighter text-foreground uppercase">{template.name}</h1>
                         <span className="text-[8px] leading-none font-black tracking-[0.2em] text-primary uppercase">Interactive Form Filling</span>
                     </div>
                </div>

                <div className="flex items-center gap-3">
                     <div className="hidden items-center gap-1 rounded-full border border-border bg-muted/50 p-1 md:flex">
                         <Button
                             variant={!showPreview ? "default" : "ghost"}
                             size="sm"
                             onClick={() => setShowPreview(false)}
                             className={cn(
                                 "h-7 px-3 text-[9px] font-black tracking-widest uppercase transition-all",
                                 !showPreview ? "bg-primary shadow-sm" : "text-muted-foreground hover:bg-muted"
                             )}
                         >
                             <LayoutIcon size={12} className="mr-1.5" /> Editor
                         </Button>
                         <Button
                             variant={showPreview ? "default" : "ghost"}
                             size="sm"
                             onClick={() => setShowPreview(true)}
                             className={cn(
                                 "h-7 px-3 text-[9px] font-black tracking-widest uppercase transition-all",
                                 showPreview ? "bg-primary shadow-sm" : "text-muted-foreground hover:bg-muted"
                             )}
                         >
                             <Eye size={12} className="mr-1.5" /> Preview PDF
                         </Button>
                     </div>

                     <div className="h-6 w-px bg-border mx-1 hidden md:block" />
 
                     <Button
                         onClick={handleDownloadPdf}
                         disabled={isExporting}
                         className="h-9 bg-primary px-6 text-[10px] font-black tracking-widest uppercase shadow-[0_4px_12px_rgba(var(--primary),0.2)] dark:shadow-none transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50"
                     >
                        {isExporting ? (
                            'Exporting...'
                        ) : (
                            <>
                                <Download size={14} className="mr-2" /> PDF Export
                            </>
                        )}
                    </Button>
                </div>
            </header>

            <main className="flex flex-1 overflow-hidden">
                <ScrollArea className={cn("flex-1 transition-all duration-500", showPreview ? "hidden lg:block lg:flex-1" : "flex-1")}>
                    <div className="flex w-full justify-center p-8 lg:p-12">
                        <InteractiveForm 
                            template={template}
                            formData={formData}
                            onChange={updateValue}
                        />
                    </div>
                </ScrollArea>

                 {showPreview && (
                     <div className="flex flex-1 flex-col border-l border-border bg-muted/50 transition-all duration-500 animate-in slide-in-from-right-10">
                         <div className="flex h-10 items-center justify-between border-b border-border bg-card px-4">
                             <span className="text-[9px] font-black tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                                 <FileText size={12} /> Live PDF Stream
                             </span>
                             <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase">
                                 <span>A4 Portrait</span>
                                 <span className="h-3 w-px bg-border" />
                                 <span>Scale: Fit</span>
                             </div>
                         </div>
                        <div className="flex flex-1 items-center justify-center p-4 lg:p-8">
                              {isPreviewLoading && !previewUrl && (
                                 <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/50 backdrop-blur-sm">
                                     <div className="flex flex-col items-center gap-3">
                                         <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                         <span className="text-[10px] font-black uppercase tracking-widest text-primary">Generating Preview...</span>
                                     </div>
                                 </div>
                              )}

                              {previewUrl ? (
                                 <iframe 
                                     src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
                                     className="h-full w-full max-w-[210mm] border-none shadow-2xl bg-white"
                                     title="PDF Preview"
                                 />
                              ) : (
                                 <div className="flex h-full w-full max-w-[180mm] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card/50">
                                     <div className="rounded-full bg-muted p-4 mb-4">
                                         <FileText size={40} className="text-muted-foreground/40" />
                                     </div>
                                     <h3 className="text-xs font-black text-foreground uppercase tracking-widest mb-1">Live PDF Preview</h3>
                                     <p className="text-[10px] text-muted-foreground font-bold max-w-[200px] text-center uppercase tracking-tight">Ketik di form samping untuk memicu preview...</p>
                                 </div>
                              )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}


(FormFilling as any).layout = (page: React.ReactNode) => page;
