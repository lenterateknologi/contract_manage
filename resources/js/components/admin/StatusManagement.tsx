import React, { useMemo, useState } from 'react';
import { Column, DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm, router } from '@inertiajs/react';
import { Tags, Plus, Palette, ListOrdered, CheckCircle2, AlertCircle } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { useToast } from '@/components/contracts/Toast';
import { cn } from '@/lib/utils';
import { ManagementForm, FormSection, FormDangerZone } from '@/components/admin/ManagementForm';

interface StatusManagementProps {
    statuses: any;
    filters: any;
}

export function StatusManagement({ statuses, filters }: StatusManagementProps) {
    const { showToast } = useToast();
    const { canUpdate } = usePermissions('ADMIN_STATUS');
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingStatus, setEditingStatus] = useState<any>(null);

    const form = useForm({
        code: '',
        label: '',
        color: '#000000',
        bg_color: '#ffffff',
        icon: '',
        description: '',
        is_active: true as boolean,
        display_mode: 'interactive' as 'interactive' | 'pdf',
    });

    const columns = useMemo<Column<any>[]>(() => [
        {
            header: 'Status Label',
            accessorKey: 'label',
            sortable: true,
            cell: (row) => (
                <div className="flex flex-col">
                    <span className="font-black text-black dark:text-white text-[11px] uppercase tracking-tight">{row.label}</span>
                    <span className="text-[9px] text-black/40 dark:text-white/40 font-bold uppercase tracking-widest">{row.code}</span>
                </div>
            )
        },
        {
            header: 'Visual',
            accessorKey: 'color',
            cell: (row) => (
                <div 
                    className="h-5 px-3 flex items-center justify-center text-[9px] font-black uppercase tracking-widest border border-black dark:border-white"
                    style={{ color: row.color, backgroundColor: row.bg_color }}
                >
                    {row.label}
                </div>
            )
        },
        {
            header: 'Show Mode',
            accessorKey: 'display_mode',
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="rounded-none border-none bg-black dark:bg-white px-2 py-1 text-[9px] font-black tracking-widest text-white dark:text-black uppercase">
                        {row.display_mode === 'pdf' ? 'DOCUMENT PDF' : 'INTERACTIVE FORM'}
                    </Badge>
                </div>
            )
        },
        {
            header: 'Sistem',
            accessorKey: 'is_active',
            cell: (row) => (
                <div className="flex items-center gap-2">
                    {row.is_active ? (
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white" />
                            <span className="text-[10px] font-bold text-black dark:text-white">AKTIF</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-black/20 dark:bg-white/20" />
                            <span className="text-[10px] font-bold text-black/30 dark:text-white/30">NON-AKTIF</span>
                        </div>
                    )}
                </div>
            )
        }
    ], []);

    const openCreate = () => {
        setEditingStatus(null);
        form.reset();
        setIsEditorOpen(true);
    };

    const openEdit = (s: any) => {
        setEditingStatus(s);
        form.setData({
            code: s.code,
            label: s.label,
            color: s.color || '#000000',
            bg_color: s.bg_color || '#ffffff',
            icon: s.icon || '',
            description: s.description || '',
            is_active: !!s.is_active,
            display_mode: s.display_mode || 'interactive',
        });
        setIsEditorOpen(true);
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const options = { 
            onSuccess: () => {
                setIsEditorOpen(false);
                setEditingStatus(null);
                showToast('Parameter Status Diperbarui', 'success');
            } 
        };
        if (editingStatus) form.put(`/admin/contract-statuses/${editingStatus.id}`, options);
        else form.post('/admin/contract-statuses', options);
    };

    if (isEditorOpen) {
        const isEdit = !!editingStatus;
        return (
            <ManagementForm
                title={isEdit ? 'Profil Parameter Status' : 'Registrasi Status Baru'}
                onClose={() => { setIsEditorOpen(false); setEditingStatus(null); }}
                onSave={handleSubmit}
                processing={form.processing}
                isDirty={form.isDirty}
                isEdit={isEdit}
            >
                <div className="space-y-8 pb-16 animate-in slide-in-from-bottom-2 duration-500 w-full px-2">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Primary Configuration */}
                        <div className="lg:col-span-8">
                            <FormSection title="Arsitektur Identitas Status">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black text-black/50 dark:text-white/50 uppercase tracking-widest">Kode Sistem</Label>
                                        <Input 
                                            value={form.data.code} 
                                            onChange={e => form.setData('code', e.target.value)} 
                                            required 
                                            placeholder="ST-01" 
                                            className="h-9 rounded-none border-black dark:border-white bg-white dark:bg-black font-mono font-bold uppercase text-[10px] focus:ring-0 transition-all text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30" 
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black text-black/50 dark:text-white/50 uppercase tracking-widest">Label Status</Label>
                                        <Input 
                                            value={form.data.label} 
                                            onChange={e => form.setData('label', e.target.value)} 
                                            required 
                                            placeholder="CONTOH: DALAM PROSES" 
                                            className="h-9 rounded-none border-black dark:border-white bg-white dark:bg-black font-bold uppercase text-[10px] focus:ring-0 transition-all text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30" 
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-1.5">
                                        <Label className="text-[9px] font-black text-black/50 dark:text-white/50 uppercase tracking-widest">Deskripsi Fungsional</Label>
                                        <Input 
                                            value={form.data.description} 
                                            onChange={e => form.setData('description', e.target.value)} 
                                            placeholder="Jelaskan peran status ini dalam alur kerja..." 
                                            className="h-9 rounded-none border-black dark:border-white bg-white dark:bg-black font-bold uppercase text-[10px] focus:ring-0 transition-all text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30" 
                                        />
                                    </div>
                                </div>
                            </FormSection>

                            <FormSection title="Visual & Skema Warna">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                    <div className="space-y-2">
                                        <Label className="text-[9px] font-black text-black/50 dark:text-white/50 uppercase tracking-widest flex items-center gap-2"><Palette size={10} /> Warna Tipografi</Label>
                                        <div className="flex gap-3 items-center p-2 bg-black/5 dark:bg-white/5 border border-black dark:border-white">
                                            <Input type="color" value={form.data.color} onChange={e => form.setData('color', e.target.value)} className="h-8 w-12 rounded-none p-0 border-none bg-transparent cursor-pointer" />
                                            <span className="text-[10px] font-mono font-bold uppercase text-black dark:text-white">{form.data.color}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[9px] font-black text-black/50 dark:text-white/50 uppercase tracking-widest flex items-center gap-2"><Palette size={10} /> Warna Latar (Badge)</Label>
                                        <div className="flex gap-3 items-center p-2 bg-black/5 dark:bg-white/5 border border-black dark:border-white">
                                            <Input type="color" value={form.data.bg_color} onChange={e => form.setData('bg_color', e.target.value)} className="h-8 w-12 rounded-none p-0 border-none bg-transparent cursor-pointer" />
                                            <span className="text-[10px] font-mono font-bold uppercase text-black dark:text-white">{form.data.bg_color}</span>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 py-4 px-6 border border-dashed border-black dark:border-white bg-black/5 dark:bg-white/5 flex flex-col items-center justify-center gap-3">
                                        <span className="text-[9px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest">Live Preview Badge</span>
                                        <div style={{ color: form.data.color, backgroundColor: form.data.bg_color }} className="px-6 py-2 text-[11px] font-black uppercase tracking-widest border border-black dark:border-white">
                                            {form.data.label || 'PREVIEW STATUS'}
                                        </div>
                                    </div>
                                </div>
                            </FormSection>
                        </div>

                        {/* Order & Priority */}
                        <div className="lg:col-span-4 space-y-8">


                            <FormSection title="Konfigurasi Preview">
                                <div className="space-y-4">
                                    <Label className="text-[9px] font-black text-black/50 dark:text-white/50 uppercase tracking-widest">Mode Tampilan Form (F1/F2)</Label>
                                    <div className="grid grid-cols-1 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => form.setData('display_mode', 'interactive')}
                                            className={cn(
                                                "flex flex-col items-start gap-2 p-3 border-2 transition-all rounded-none",
                                                form.data.display_mode === 'interactive' 
                                                    ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black" 
                                                    : "border-black/10 dark:border-white/10 bg-white dark:bg-black text-black dark:text-white hover:border-black dark:hover:border-white"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={cn("w-3 h-3 rounded-full border-2", form.data.display_mode === 'interactive' ? "bg-white dark:bg-black border-white dark:border-black" : "border-black/30 dark:border-white/30")} />
                                                <span className="text-[11px] font-bold uppercase">Interactive Form</span>
                                            </div>
                                            <p className={cn("text-[10px] text-left font-medium", form.data.display_mode === 'interactive' ? "text-white/70 dark:text-black/70" : "text-black/50 dark:text-white/50")}>Tampilan interaktif React untuk pengisian cepat.</p>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => form.setData('display_mode', 'pdf')}
                                            className={cn(
                                                "flex flex-col items-start gap-2 p-3 border-2 transition-all rounded-none",
                                                form.data.display_mode === 'pdf' 
                                                    ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black" 
                                                    : "border-black/10 dark:border-white/10 bg-white dark:bg-black text-black dark:text-white hover:border-black dark:hover:border-white"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={cn("w-3 h-3 rounded-full border-2", form.data.display_mode === 'pdf' ? "bg-white dark:bg-black border-white dark:border-black" : "border-black/30 dark:border-white/30")} />
                                                <span className="text-[11px] font-bold uppercase">PDF Preview</span>
                                            </div>
                                            <p className={cn("text-[10px] text-left font-medium", form.data.display_mode === 'pdf' ? "text-white/70 dark:text-black/70" : "text-black/50 dark:text-white/50")}>Tampilan file PDF statis dari server.</p>
                                        </button>
                                    </div>
                                </div>
                            </FormSection>

                            <FormDangerZone 
                                title="Kontrol Operasional"
                                description="Konfigurasi visibilitas status dalam sistem."
                            >
                                <div className="flex items-center gap-3 p-1">
                                    <Checkbox 
                                        id="f-active"
                                        checked={form.data.is_active} 
                                        onCheckedChange={(checked) => form.setData('is_active', checked as boolean)} 
                                        className="w-5 h-5 rounded-none border-black dark:border-white data-[state=checked]:bg-black dark:data-[state=checked]:bg-white data-[state=checked]:text-white dark:data-[state=checked]:text-black transition-colors"
                                    />
                                    <div className="flex flex-col">
                                        <Label htmlFor="f-active" className="text-[12px] font-bold cursor-pointer leading-tight text-black dark:text-white">STATUS AKTIF</Label>
                                        <p className="text-[10px] text-black/50 dark:text-white/50 mt-0.5 uppercase font-bold">Dapat digunakan dalam kontrak</p>
                                    </div>
                                </div>
                            </FormDangerZone>

                            <div className="p-4 bg-black dark:bg-white border border-black dark:border-white flex gap-3">
                                <AlertCircle size={14} className="text-white dark:text-black shrink-0 mt-0.5" />
                                <p className="text-[8px] font-bold text-white dark:text-black uppercase leading-relaxed">
                                    Perubahan pada skema warna akan segera berdampak pada seluruh dashboard dan laporan audit kontrak yang aktif.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 py-8 opacity-20 grayscale">
                        <div className="h-px flex-1 bg-black dark:bg-white" />
                        <div className="flex items-center gap-2 text-black dark:text-white">
                            <CheckCircle2 size={20} />
                            <span className="text-[11px] font-black uppercase tracking-[0.4em]">KONFIGURASI TERSIMPAN</span>
                        </div>
                        <div className="h-px flex-1 bg-black dark:bg-white" />
                    </div>
                </div>
            </ManagementForm>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-black animate-in fade-in duration-500">
            <DataTable
                columns={columns}
                data={statuses?.data || []}
                searchKey="label"
                searchPlaceholder="Filter Master Status..."
                onRowClick={openEdit}
                pagination={statuses && statuses.meta ? {
                    currentPage: statuses.meta.current_page || 1,
                    lastPage: statuses.meta.last_page || 1,
                    total: statuses.meta.total || 0,
                    from: statuses.meta.from || 1,
                    to: statuses.meta.to || 1,
                    perPage: statuses.meta.per_page || 10,
                    onPageChange: (page) => router.get(window.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                    onPerPageChange: (pp) => router.get(window.location.pathname, { ...filters, per_page: pp, page: 1 }, { preserveState: true, preserveScroll: true }),
                } : undefined}
                headerActions={
                    <Button onClick={openCreate} className="h-10 gap-2 rounded-none px-8 text-[11px] font-black bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white hover:opacity-90 transition-all uppercase tracking-widest shadow-none">
                        <Plus className="h-4 w-4" /> Registrasi Status
                    </Button>
                }
            />
        </div>
    );
}
