import React, { useMemo } from 'react';
import { Column, DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, router } from '@inertiajs/react';
import { Plus, Trash2, FileJson, Info } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { useToast } from '@/components/contracts/Toast';
import { cn } from '@/lib/utils';
import { ManagementForm, FormSection, FormDangerZone } from './ManagementForm';

interface ContractTypeManagementProps {
    contractTypes: any;
    filters: any;
}

export function ContractTypeManagement({ contractTypes, filters }: ContractTypeManagementProps) {
    const { showToast } = useToast();
    const { canCreate, canUpdate, canDelete } = usePermissions('ADMIN_TYPES');
    const [isFormView, setIsFormView] = React.useState(false);
    const [editingType, setEditingType] = React.useState<any>(null);

    const form = useForm({
        name: '',
        description: '',
        type: 'f1',
    });

    const columns = useMemo<Column<any>[]>(() => [
        {
            header: 'Jenis Kontrak',
            accessorKey: 'name',
            sortable: true,
            className: 'font-black text-slate-900 uppercase tracking-tight text-[12px]',
        },
        {
            header: 'Mekanisme / Workflow',
            accessorKey: 'type',
            cell: (row) => (
                <Badge variant="outline" className={cn("px-2.5 py-0.5 text-[9px] font-black tracking-[0.2em] uppercase border-none", row.type === 'f2' ? "bg-amber-50 text-amber-700" : "bg-sky-50 text-sky-700")}>
                    {row.type?.toUpperCase()} (Standard Form)
                </Badge>
            )
        },
        {
            header: 'Keterangan',
            accessorKey: 'description',
            className: 'text-[10px] font-medium text-slate-500 uppercase tracking-wide',
            cell: (row) => row.description || '-'
        },
    ], []);

    const openCreate = () => {
        setEditingType(null);
        form.reset();
        setIsFormView(true);
    };

    const openEdit = (type: any) => {
        setEditingType(type);
        form.setData({
            name: type.name,
            description: type.description || '',
            type: type.type || 'f1',
        });
        setIsFormView(true);
    };

    const closeForm = () => {
        setIsFormView(false);
        setEditingType(null);
        form.reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const options = {
            onSuccess: () => {
                closeForm();
                showToast(editingType ? 'Master tipe diperbarui' : 'Tipe kontrak baru ditambahkan', 'success');
            }
        };
        if (editingType) form.put(`/admin/contract-types/${editingType.id}`, options);
        else form.post('/admin/contract-types', options);
    };

    const handleDelete = () => {
        if (!editingType) return;
        if (confirm(`Hapus tipe kontrak ${editingType.name}?`)) {
            router.delete(`/admin/contract-types/${editingType.id}`, {
                onSuccess: () => {
                    closeForm();
                    showToast('Tipe kontrak telah dihapus', 'success');
                }
            });
        }
    };

    if (isFormView) {
        return (
            <ManagementForm
                title={editingType ? 'Konfigurasi Jenis Kontrak' : 'Jenis Kontrak Baru'}
                subtitle={editingType ? 'Pengaturan parameter dokumen kontrak' : 'Definisikan kategori dokumen baru'}
                onClose={closeForm}
                onSave={handleSubmit}
                processing={form.processing}
                isDirty={form.isDirty}
                isEdit={!!editingType}
                headerActions={
                    editingType && canDelete && (
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={handleDelete}
                            className="h-8 hover:bg-rose-50 text-rose-600 rounded-none px-4 text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            <Trash2 size={14} className="mr-2" /> Hapus Tipe
                        </Button>
                    )
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                    <div className="md:col-span-8 space-y-10">
                        <FormSection title="Data Klasifikasi" subtitle="Nama dan identifikasi tipe dokumen">
                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Jenis Kontrak</Label>
                                    <Input value={form.data.name} onChange={e => form.setData('name', e.target.value)} required placeholder="CONTOH: PERJANJIAN KERJASAMA JASA" className="h-10 rounded-none border-slate-200 bg-slate-50/20 text-sm font-black uppercase tracking-tight px-4" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Keterangan / Deskripsi</Label>
                                    <Input value={form.data.description} onChange={e => form.setData('description', e.target.value)} placeholder="Tuliskan kegunaan tipe kontrak ini..." className="h-10 rounded-none border-slate-200 text-sm font-medium px-4" />
                                </div>
                            </div>
                        </FormSection>

                        <FormSection title="Mekanisme Form" subtitle="Alur pengisian data dokumen">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Format Formulir</Label>
                                    <Select value={form.data.type} onValueChange={v => form.setData('type', v)}>
                                        <SelectTrigger className="h-10 rounded-none border-slate-200 text-[11px] font-black uppercase tracking-tight bg-slate-50/20">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-none">
                                            <SelectItem value="f1" className="text-[10px] uppercase font-black tracking-wider py-2.5">FORM F1 (INTERNAL)</SelectItem>
                                            <SelectItem value="f2" className="text-[10px] uppercase font-black tracking-wider py-2.5">FORM F2 (EXTERNAL/VENDOR)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-4">
                                    <div className="h-10 w-10 shrink-0 bg-black text-white flex items-center justify-center font-black">
                                        {form.data.type === 'f1' ? '1' : '2'}
                                    </div>
                                    <div className="space-y-0.5">
                                        <div className="text-[10px] font-black uppercase text-black">Workflow Type</div>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase leading-tight">
                                            {form.data.type === 'f1' ? 'Proses drafting dilakukan oleh tim internal.' : 'Proses pengisian data melibatkan portal vendor.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </FormSection>
                    </div>

                    <div className="md:col-span-4 space-y-10">
                        <div className="border border-slate-200 p-6 bg-slate-50/50">
                            <div className="flex items-center gap-2 mb-4">
                                <FileJson size={16} className="text-slate-400" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Metadata Preview</span>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Info size={14} className="mt-0.5 text-slate-400" />
                                    <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed">
                                        Tipe kontrak ini akan muncul di pilihan saat user membuat draft kontrak baru.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </ManagementForm>
        );
    }

    return (
        <DataTable
            title="Management Tipe Kontrak"
            columns={columns}
            data={contractTypes.data || []}
            searchKey="name"
            searchPlaceholder="Cari jenis kontrak..."
            searchValue={filters.search || ''}
            onSearchChange={(v) => router.get(window.location.pathname, { ...filters, search: v, page: 1 }, { preserveState: true, replace: true })}
            headerActions={
                canCreate && (
                    <Button onClick={openCreate} className="h-9 gap-2 rounded-xl px-5 text-[11px] font-black uppercase tracking-widest shadow-lg shadow-slate-200">
                        <Plus className="h-3.5 w-3.5" /> Tambah Tipe
                    </Button>
                )
            }
            onRowClick={openEdit}
            pagination={contractTypes && contractTypes.meta ? {
                currentPage: contractTypes.meta.current_page || 1,
                lastPage: contractTypes.meta.last_page || 1,
                total: contractTypes.meta.total || 0,
                from: contractTypes.meta.from || 1,
                to: contractTypes.meta.to || 1,
                perPage: contractTypes.meta.per_page || 10,
                onPageChange: (page) => router.get(window.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                onPerPageChange: (pp) => router.get(window.location.pathname, { ...filters, per_page: pp, page: 1 }, { preserveState: true, preserveScroll: true }),
            } : {
                currentPage: contractTypes.current_page || 1,
                lastPage: contractTypes.last_page || 1,
                total: contractTypes.total || 0,
                from: contractTypes.from || 1,
                to: contractTypes.to || 1,
                perPage: contractTypes.per_page || 10,
                onPageChange: (page) => router.get(window.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                onPerPageChange: (pp) => router.get(window.location.pathname, { ...filters, per_page: pp, page: 1 }, { preserveState: true, preserveScroll: true }),
            }}
        />
    );
}
