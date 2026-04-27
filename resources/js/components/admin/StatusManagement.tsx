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
        sequence: 0,
        is_active: true as boolean,
    });

    const columns = useMemo<Column<any>[]>(() => [
        {
            header: 'Identitas Visual Status',
            accessorKey: 'label',
            sortable: true,
            cell: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" style={{ backgroundColor: row.bg_color }}>
                         <span className="text-[14px] font-black" style={{ color: row.color }}>●</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-slate-900 uppercase tracking-tight text-[11px] leading-none">{row.label}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">KODE: {row.code}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Pratinjau Badge',
            accessorKey: 'color',
            cell: (row) => (
                <Badge variant="outline" style={{ color: row.color, backgroundColor: row.bg_color, borderColor: `${row.color}30` }} className="px-4 py-1 text-[9px] font-black tracking-[0.2em] uppercase rounded-none border-2">
                    {row.label}
                </Badge>
            )
        },
        {
            header: 'Urutan Eksekusi',
            accessorKey: 'sequence',
            className: 'w-[150px]',
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <ListOrdered size={12} className="text-slate-300" />
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">SEQ-{(row.sequence ?? 0).toString().padStart(2, '0')}</span>
                </div>
            )
        },
        {
            header: 'Status Sistem',
            accessorKey: 'is_active',
            cell: (row) => (
                <div className="flex items-center gap-2">
                    {row.is_active ? (
                        <Badge className="bg-emerald-500 text-white rounded-none text-[8px] font-black tracking-widest uppercase">OPERASIONAL</Badge>
                    ) : (
                        <Badge className="bg-slate-200 text-slate-500 rounded-none text-[8px] font-black tracking-widest uppercase">NON-AKTIF</Badge>
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
            sequence: s.sequence || 0,
            is_active: !!s.is_active,
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
                                        <Label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Kode Sistem</Label>
                                        <Input 
                                            value={form.data.code} 
                                            onChange={e => form.setData('code', e.target.value)} 
                                            required 
                                            placeholder="ST-01" 
                                            className="h-9 rounded-none border-slate-200 bg-white font-mono font-bold uppercase text-[10px] focus:border-black transition-all" 
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Label Status</Label>
                                        <Input 
                                            value={form.data.label} 
                                            onChange={e => form.setData('label', e.target.value)} 
                                            required 
                                            placeholder="CONTOH: DALAM PROSES" 
                                            className="h-9 rounded-none border-slate-200 bg-white font-bold uppercase text-[10px] focus:border-black transition-all" 
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-1.5">
                                        <Label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Deskripsi Fungsional</Label>
                                        <Input 
                                            value={form.data.description} 
                                            onChange={e => form.setData('description', e.target.value)} 
                                            placeholder="Jelaskan peran status ini dalam alur kerja..." 
                                            className="h-9 rounded-none border-slate-200 bg-white font-bold uppercase text-[10px] focus:border-black transition-all" 
                                        />
                                    </div>
                                </div>
                            </FormSection>

                            <FormSection title="Visual & Skema Warna">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                    <div className="space-y-2">
                                        <Label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Palette size={10} /> Warna Tipografi</Label>
                                        <div className="flex gap-3 items-center p-2 bg-slate-50 border border-slate-200">
                                            <Input type="color" value={form.data.color} onChange={e => form.setData('color', e.target.value)} className="h-8 w-12 rounded-none p-0 border-none bg-transparent cursor-pointer" />
                                            <span className="text-[10px] font-mono font-bold uppercase">{form.data.color}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Palette size={10} /> Warna Latar (Badge)</Label>
                                        <div className="flex gap-3 items-center p-2 bg-slate-50 border border-slate-200">
                                            <Input type="color" value={form.data.bg_color} onChange={e => form.setData('bg_color', e.target.value)} className="h-8 w-12 rounded-none p-0 border-none bg-transparent cursor-pointer" />
                                            <span className="text-[10px] font-mono font-bold uppercase">{form.data.bg_color}</span>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 py-4 px-6 border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center gap-3">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Preview Badge</span>
                                        <Badge variant="outline" style={{ color: form.data.color, backgroundColor: form.data.bg_color, borderColor: `${form.data.color}40` }} className="px-6 py-2 text-[10px] font-black tracking-[0.3em] uppercase rounded-none border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                                            {form.data.label || 'PREVIEW STATUS'}
                                        </Badge>
                                    </div>
                                </div>
                            </FormSection>
                        </div>

                        {/* Order & Priority */}
                        <div className="lg:col-span-4 space-y-8">
                            <FormSection title="Urutan Eksekusi">
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Index Pengurutan</Label>
                                        <Input 
                                            type="number"
                                            value={form.data.sequence} 
                                            onChange={e => form.setData('sequence', parseInt(e.target.value))} 
                                            className="h-9 rounded-none border-slate-200 bg-white font-black text-[11px] focus:border-black transition-all" 
                                        />
                                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-2">Menentukan posisi status dalam filter dan daftar.</p>
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
                                        className="w-5 h-5 rounded-none border-slate-400 data-[state=checked]:bg-black data-[state=checked]:text-white data-[state=checked]:border-black transition-colors"
                                    />
                                    <div className="flex flex-col">
                                        <Label htmlFor="f-active" className="text-[11px] font-black uppercase cursor-pointer leading-tight">STATUS AKTIF</Label>
                                        <p className="text-[8px] font-bold text-slate-400 mt-0.5 uppercase tracking-tight">DAPAT DIGUNAKAN DALAM KONTRAK</p>
                                    </div>
                                </div>
                            </FormDangerZone>

                            <div className="p-4 bg-amber-50 border border-amber-200 flex gap-3">
                                <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-[8px] font-bold text-amber-700 uppercase leading-relaxed">
                                    Perubahan pada skema warna akan segera berdampak pada seluruh dashboard dan laporan audit kontrak yang aktif.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 py-8 opacity-20 grayscale">
                        <div className="h-px flex-1 bg-slate-400" />
                        <div className="flex items-center gap-2 text-black">
                            <CheckCircle2 size={20} />
                            <span className="text-[11px] font-black uppercase tracking-[0.4em]">KONFIGURASI TERSIMPAN</span>
                        </div>
                        <div className="h-px flex-1 bg-slate-400" />
                    </div>
                </div>
            </ManagementForm>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
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
                    <Button onClick={openCreate} className="h-9 gap-2 rounded-none px-6 text-[10px] font-black uppercase tracking-[0.1em] bg-black text-white hover:bg-slate-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5">
                        <Plus className="h-3.5 w-3.5" /> Registrasi Status
                    </Button>
                }
            />
        </div>
    );
}
