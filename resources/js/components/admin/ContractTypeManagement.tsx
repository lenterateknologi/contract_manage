import { useToast } from '@/components/contracts/Toast';
import { Column, DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePermissions } from '@/hooks/use-permissions';
import { router, useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import React, { useMemo } from 'react';
import { FormSection, ManagementForm } from './ManagementForm';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

interface ContractTypeManagementProps {
    contractTypes: any;
    formTemplates: any[] | null | undefined;
    contractTemplates: any[] | null | undefined;
    filters: any;
}

export function ContractTypeManagement({ contractTypes, formTemplates, contractTemplates, filters }: ContractTypeManagementProps) {
    const { showToast } = useToast();
    const { canCreate, canUpdate, canDelete } = usePermissions('ADMIN_TYPES');
    const [isFormView, setIsFormView] = React.useState(false);
    const [editingType, setEditingType] = React.useState<any>(null);
    const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

    // Defensive array handling
    const templates = Array.isArray(formTemplates) ? formTemplates : [];
    const physTemplates = Array.isArray(contractTemplates) ? contractTemplates : [];

    const form = useForm({
        name: '',
        description: '',
        f1_input_mechanism: 'digital',
        f1_form_template_id: 'none',
        f1_contract_template_id: 'none',
        f2_input_mechanism: 'digital',
        f2_form_template_id: 'none',
        f2_contract_template_id: 'none',
    });

    const columns = useMemo<Column<any>[]>(
        () => [
            {
                header: 'Jenis Kontrak',
                accessorKey: 'name',
                sortable: true,
                className: 'font-black text-slate-900 uppercase tracking-tight text-[11px] antialiased',
            },
            {
                header: 'F1 (Internal)',
                accessorKey: 'f1_input_mechanism',
                cell: (row) => (
                    <div className="flex items-center gap-2">
                        {row.f1_input_mechanism === 'digital' ? (
                            <Badge className="rounded-none border-none bg-black px-2 text-[8px] font-black tracking-widest text-white uppercase">
                                Formulir Digital
                            </Badge>
                        ) : row.f1_input_mechanism === 'folder' ? (
                            <Badge className="rounded-none border-none bg-blue-600 px-2 text-[8px] font-black tracking-widest text-white uppercase">
                                Folder Kontrak
                            </Badge>
                        ) : (
                            <Badge
                                variant="outline"
                                className="rounded-none border-slate-200 px-2 text-[8px] font-black tracking-widest text-slate-400 uppercase shadow-none"
                            >
                                Manual
                            </Badge>
                        )}
                    </div>
                ),
            },
            {
                header: 'F2 (Eksternal)',
                accessorKey: 'f2_input_mechanism',
                cell: (row) => (
                    <div className="flex items-center gap-2">
                        {row.f2_input_mechanism === 'digital' ? (
                            <Badge className="rounded-none border-none bg-slate-800 px-2 text-[8px] font-black tracking-widest text-white uppercase">
                                Formulir Digital
                            </Badge>
                        ) : row.f2_input_mechanism === 'folder' ? (
                            <Badge className="rounded-none border-none bg-indigo-600 px-2 text-[8px] font-black tracking-widest text-white uppercase">
                                Folder Kontrak
                            </Badge>
                        ) : (
                            <Badge
                                variant="outline"
                                className="rounded-none border-slate-200 px-2 text-[8px] font-black tracking-widest text-slate-400 uppercase shadow-none"
                            >
                                Manual
                            </Badge>
                        )}
                    </div>
                ),
            },
            {
                header: 'Deskripsi',
                accessorKey: 'description',
                className: 'text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate max-w-[200px]',
                cell: (row) => row.description || '-',
            },
        ],
        [],
    );

    const openCreate = () => {
        setEditingType(null);
        form.reset();
        setIsFormView(true);
    };

    const openEdit = (type: any) => {
        if (!type) return;
        setEditingType(type);
        form.setData({
            name: type.name || '',
            description: type.description || '',
            f1_input_mechanism: type.f1_input_mechanism || 'digital',
            f1_form_template_id: type.f1_form_template_id || 'none',
            f1_contract_template_id: type.f1_contract_template_id || 'none',
            f2_input_mechanism: type.f2_input_mechanism || 'digital',
            f2_form_template_id: type.f2_form_template_id || 'none',
            f2_contract_template_id: type.f2_contract_template_id || 'none',
        });
        setIsFormView(true);
    };

    const closeForm = () => {
        setIsFormView(false);
        setEditingType(null);
        form.reset();
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        // Prepare data - convert 'none' back to null for DB
        const payload = {
            ...form.data,
            f1_form_template_id: form.data.f1_form_template_id === 'none' ? null : form.data.f1_form_template_id,
            f1_contract_template_id: form.data.f1_contract_template_id === 'none' ? null : form.data.f1_contract_template_id,
            f2_form_template_id: form.data.f2_form_template_id === 'none' ? null : form.data.f2_form_template_id,
            f2_contract_template_id: form.data.f2_contract_template_id === 'none' ? null : form.data.f2_contract_template_id,
        };

        const options = {
            onSuccess: () => {
                closeForm();
                showToast(editingType ? 'Master tipe diperbarui' : 'Tipe kontrak baru ditambahkan', 'success');
            },
        };
        if (editingType) router.put(`/admin/contract-types/${editingType.id}`, payload, options);
        else router.post('/admin/contract-types', payload, options);
    };

    const handleDelete = () => {
        setIsConfirmOpen(true);
    };

    if (isFormView) {
        return (
            <ManagementForm
                title={editingType ? 'Konfigurasi Klasifikasi' : 'Klasifikasi Baru'}
                subtitle={editingType ? 'Penyempurnaan metadata dokumen dua tahap' : 'Definisikan kategori kontrak administratif baru'}
                onClose={closeForm}
                onSave={handleSubmit}
                processing={form.processing}
                isDirty={form.isDirty}
                isEdit={!!editingType}
                headerActions={
                    editingType &&
                    canDelete && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleDelete}
                            className="h-8 rounded-none px-4 text-[10px] font-black tracking-widest text-rose-600 uppercase transition-all hover:bg-rose-50"
                        >
                            <Trash2 size={14} className="mr-2" /> Hapus Klasifikasi
                        </Button>
                    )
                }
            >
                <ConfirmationModal 
                    open={isConfirmOpen}
                    onClose={() => setIsConfirmOpen(false)}
                    onConfirm={() => {
                        setIsConfirmOpen(false);
                        router.delete(`/admin/contract-types/${editingType.id}`, { 
                            onSuccess: () => {
                                closeForm();
                                showToast('Tipe kontrak telah dihapus', 'success');
                            }
                        });
                    }}
                    title="Hapus Klasifikasi Kontrak"
                    description={`Apakah Anda yakin ingin menghapus tipe kontrak ${editingType?.name}? Seluruh data yang terkait dengan klasifikasi ini mungkin akan terdampak.`}
                    confirmText="Hapus Tipe"
                />
                <div className="font-inter grid grid-cols-1 gap-10 md:grid-cols-12">
                    <div className="space-y-12 md:col-span-12 lg:col-span-9">
                        <FormSection title="Metadata Klasifikasi Utama" subtitle="Identifikasi utama untuk kategori kontrak ini">
                            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase">Nama Klasifikasi</Label>
                                    <Input
                                        value={form.data.name}
                                        onChange={(e) => form.setData('name', e.target.value)}
                                        required
                                        placeholder="CONTOH: PERJANJIAN KERJASAMA JASA"
                                        className="h-10 rounded-none border-slate-200 bg-slate-50/30 px-4 text-xs font-black tracking-tight uppercase transition-all focus:border-black"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase">Deskripsi Konteks</Label>
                                    <Input
                                        value={form.data.description}
                                        onChange={(e) => form.setData('description', e.target.value)}
                                        placeholder="Ringkasan kapan menggunakan tipe ini..."
                                        className="h-10 rounded-none border-slate-200 px-4 text-xs font-medium transition-all focus:border-black"
                                    />
                                </div>
                            </div>
                        </FormSection>

                        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                            {/* F1 Configuration */}
                            <FormSection
                                title="Konfigurasi Formulir F1"
                                subtitle="Alur kerja tahap Permohonan Internal"
                                className="border-l-4 border-l-black"
                            >
                                <div className="space-y-6">
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase">
                                            Mekanisme Pengajuan (F1)
                                        </Label>
                                        <Select value={form.data.f1_input_mechanism} onValueChange={(v) => form.setData('f1_input_mechanism', v)}>
                                            <SelectTrigger className="h-10 rounded-none border-slate-200 bg-slate-50/30 text-[10px] font-black tracking-widest uppercase">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-none border-black shadow-2xl">
                                                <SelectItem value="digital" className="py-3 text-[9px] font-black tracking-widest uppercase">
                                                    Pengajuan Formulir Digital
                                                </SelectItem>
                                                <SelectItem value="folder" className="py-3 text-[9px] font-black tracking-widest uppercase">
                                                    Templat Folder Kontrak
                                                </SelectItem>
                                                <SelectItem value="manual" className="py-3 text-[9px] font-black tracking-widest uppercase">
                                                    Unggah Dokumen Manual
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {form.data.f1_input_mechanism === 'digital' ? (
                                        <div className="animate-in fade-in slide-in-from-top-2 space-y-1.5">
                                            <Label className="text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase">
                                                Tautan ke Templat Digital F1
                                            </Label>
                                            <Select
                                                value={form.data.f1_form_template_id}
                                                onValueChange={(v) => form.setData('f1_form_template_id', v)}
                                            >
                                                <SelectTrigger className="h-10 rounded-none border-slate-200 bg-white text-[10px] font-black tracking-tight uppercase">
                                                    <SelectValue placeholder="PILIH ASET F1..." />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-[200px] rounded-none border-black shadow-2xl">
                                                    <SelectItem value="none" className="text-[9px] font-black text-slate-300 uppercase italic">
                                                        Tidak Terpaut / Tanpa Templat
                                                    </SelectItem>
                                                    {templates.map((t: any) => (
                                                        <SelectItem
                                                            key={t.id}
                                                            value={t.id}
                                                            className="py-3 text-[9px] font-black tracking-wider uppercase"
                                                        >
                                                            {t.name}{' '}
                                                            <span className="ml-2 font-bold text-slate-300">({t.document_type || 'ADHOC'})</span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ) : form.data.f1_input_mechanism === 'folder' ? (
                                        <div className="animate-in fade-in slide-in-from-top-2 space-y-1.5">
                                            <Label className="text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase">
                                                Tautan ke Templat Folder (F1)
                                            </Label>
                                            <Select
                                                value={form.data.f1_contract_template_id}
                                                onValueChange={(v) => form.setData('f1_contract_template_id', v)}
                                            >
                                                <SelectTrigger className="h-10 rounded-none border-slate-200 bg-white text-[10px] font-black tracking-tight uppercase">
                                                    <SelectValue placeholder="PILIH ASET FISIK..." />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-[200px] rounded-none border-black shadow-2xl">
                                                    <SelectItem value="none" className="text-[9px] font-black text-slate-300 uppercase italic">
                                                        Tidak Ada Templat Terpilih
                                                    </SelectItem>
                                                    {physTemplates.map((t: any) => (
                                                        <SelectItem
                                                            key={t.id}
                                                            value={t.id}
                                                            className="py-3 text-[9px] font-black tracking-wider uppercase"
                                                        >
                                                            {t.name} <span className="ml-2 font-bold text-slate-300">({t.file_type || 'PDF'})</span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ) : (
                                        <div className="animate-in fade-in border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">
                                                PENGGUNA INTERNAL AKAN MENGUNGGAH PDF MANUAL UNTUK F1
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </FormSection>

                            {/* F2 Configuration */}
                            <FormSection
                                title="Konfigurasi Formulir F2"
                                subtitle="Alur kerja tahap Resume Eksternal/Vendor"
                                className="border-l-4 border-l-slate-400"
                            >
                                <div className="space-y-6">
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase">
                                            Mekanisme Pengajuan (F2)
                                        </Label>
                                        <Select value={form.data.f2_input_mechanism} onValueChange={(v) => form.setData('f2_input_mechanism', v)}>
                                            <SelectTrigger className="h-10 rounded-none border-slate-200 bg-slate-50/30 text-[10px] font-black tracking-widest uppercase">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-none border-black shadow-2xl">
                                                <SelectItem value="digital" className="py-3 text-[9px] font-black tracking-widest uppercase">
                                                    Pengajuan Formulir Digital
                                                </SelectItem>
                                                <SelectItem value="folder" className="py-3 text-[9px] font-black tracking-widest uppercase">
                                                    Templat Folder Kontrak
                                                </SelectItem>
                                                <SelectItem value="manual" className="py-3 text-[9px] font-black tracking-widest uppercase">
                                                    Unggah Dokumen Manual
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {form.data.f2_input_mechanism === 'digital' ? (
                                        <div className="animate-in fade-in slide-in-from-top-2 space-y-1.5">
                                            <Label className="text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase">
                                                Tautan ke Templat Digital F2
                                            </Label>
                                            <Select
                                                value={form.data.f2_form_template_id}
                                                onValueChange={(v) => form.setData('f2_form_template_id', v)}
                                            >
                                                <SelectTrigger className="h-10 rounded-none border-slate-200 bg-white text-[10px] font-black tracking-tight uppercase">
                                                    <SelectValue placeholder="PILIH ASET F2..." />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-[200px] rounded-none border-black shadow-2xl">
                                                    <SelectItem value="none" className="text-[9px] font-black text-slate-300 uppercase italic">
                                                        Tidak Terpaut / Tanpa Templat
                                                    </SelectItem>
                                                    {templates.map((t: any) => (
                                                        <SelectItem
                                                            key={t.id}
                                                            value={t.id}
                                                            className="py-3 text-[9px] font-black tracking-wider uppercase"
                                                        >
                                                            {t.name}{' '}
                                                            <span className="ml-2 font-bold text-slate-300">({t.document_type || 'ADHOC'})</span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ) : form.data.f2_input_mechanism === 'folder' ? (
                                        <div className="animate-in fade-in slide-in-from-top-2 space-y-1.5">
                                            <Label className="text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase">
                                                Tautan ke Templat Folder (F2)
                                            </Label>
                                            <Select
                                                value={form.data.f2_contract_template_id}
                                                onValueChange={(v) => form.setData('f2_contract_template_id', v)}
                                            >
                                                <SelectTrigger className="h-10 rounded-none border-slate-200 bg-white text-[10px] font-black tracking-tight uppercase">
                                                    <SelectValue placeholder="PILIH ASET FISIK..." />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-[200px] rounded-none border-black shadow-2xl">
                                                    <SelectItem value="none" className="text-[9px] font-black text-slate-300 uppercase italic">
                                                        Tidak Ada Templat Terpilih
                                                    </SelectItem>
                                                    {physTemplates.map((t: any) => (
                                                        <SelectItem
                                                            key={t.id}
                                                            value={t.id}
                                                            className="py-3 text-[9px] font-black tracking-wider uppercase"
                                                        >
                                                            {t.name} <span className="ml-2 font-bold text-slate-300">({t.file_type || 'PDF'})</span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ) : (
                                        <div className="animate-in fade-in border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">VENDOR AKAN MENGUNGGAH PDF MANUAL UNTUK F2</p>
                                        </div>
                                    )}
                                </div>
                            </FormSection>
                        </div>
                    </div>
                </div>
            </ManagementForm>
        );
    }

    return (
        <DataTable
            title="Registri Klasifikasi Kontrak"
            columns={columns}
            data={contractTypes?.data || []}
            searchKey="name"
            searchPlaceholder="Filter jenis klasifikasi..."
            searchValue={filters.search || ''}
            onSearchChange={(v) => router.get(window.location.pathname, { ...filters, search: v, page: 1 }, { preserveState: true, replace: true })}
            headerActions={
                canCreate && (
                    <Button
                        onClick={openCreate}
                        className="h-10 gap-2 rounded-none bg-black px-6 text-[10px] font-black tracking-widest text-white uppercase shadow-xl transition-all hover:bg-slate-800"
                    >
                        <Plus className="h-4 w-4" /> Tambah Tipe
                    </Button>
                )
            }
            onRowClick={openEdit}
            pagination={
                contractTypes && contractTypes.meta
                    ? {
                          currentPage: contractTypes.meta.current_page || 1,
                          lastPage: contractTypes.meta.last_page || 1,
                          total: contractTypes.meta.total || 0,
                          from: contractTypes.meta.from || 1,
                          to: contractTypes.meta.to || 1,
                          perPage: contractTypes.meta.per_page || 10,
                          onPageChange: (page) =>
                              router.get(window.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                          onPerPageChange: (pp) =>
                              router.get(
                                  window.location.pathname,
                                  { ...filters, per_page: pp, page: 1 },
                                  { preserveState: true, preserveScroll: true },
                              ),
                      }
                    : contractTypes
                      ? {
                            currentPage: contractTypes.current_page || 1,
                            lastPage: contractTypes.last_page || 1,
                            total: contractTypes.total || 0,
                            from: contractTypes.from || 1,
                            to: contractTypes.to || 1,
                            perPage: contractTypes.per_page || 10,
                            onPageChange: (page) =>
                                router.get(window.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                            onPerPageChange: (pp) =>
                                router.get(
                                    window.location.pathname,
                                    { ...filters, per_page: pp, page: 1 },
                                    { preserveState: true, preserveScroll: true },
                                ),
                        }
                      : undefined
            }
        />
    );
}
