import { useToast } from '@/components/contracts/Toast';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Column, DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePermissions } from '@/hooks/use-permissions';
import { router, useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import React, { useMemo } from 'react';
import { FormSection, ManagementForm } from './ManagementForm';

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
                className: 'font-bold text-black dark:text-white text-[13px] antialiased',
            },
            {
                header: 'F1 (Internal)',
                accessorKey: 'f1_input_mechanism',
                cell: (row) => (
                    <span className="text-[10px] font-black tracking-widest text-black/60 uppercase dark:text-white/60">
                        {row.f1_input_mechanism === 'digital'
                            ? 'Formulir Digital'
                            : row.f1_input_mechanism === 'folder'
                              ? 'Folder Kontrak'
                              : 'Manual'}
                    </span>
                ),
            },
            {
                header: 'F2 (Eksternal)',
                accessorKey: 'f2_input_mechanism',
                cell: (row) => (
                    <span className="text-[10px] font-black tracking-widest text-black/60 uppercase dark:text-white/60">
                        {row.f2_input_mechanism === 'digital'
                            ? 'Formulir Digital'
                            : row.f2_input_mechanism === 'folder'
                              ? 'Folder Kontrak'
                              : 'Manual'}
                    </span>
                ),
            },
            {
                header: 'Deskripsi',
                accessorKey: 'description',
                className: 'text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-tight truncate max-w-[200px]',
                cell: (row) => row.description || '—',
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
                            variant="outline"
                            onClick={handleDelete}
                            className="h-9 border-red-500/20 px-4 text-red-500 hover:bg-red-500 hover:text-white"
                        >
                            <Trash2 size={14} /> Hapus Klasifikasi
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
                            },
                        });
                    }}
                    title="Hapus Klasifikasi Kontrak"
                    description={`Apakah Anda yakin ingin menghapus tipe kontrak ${editingType?.name}? Seluruh data yang terkait dengan klasifikasi ini mungkin akan terdampak.`}
                    confirmText="Hapus Tipe"
                />
                <div className="font-inter grid grid-cols-1 gap-10 md:grid-cols-12">
                    <div className="space-y-12 md:col-span-12 lg:col-span-9">
                        <FormSection title="Metadata Klasifikasi Utama" subtitle="Identifikasi utama untuk kategori kontrak ini">
                            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                                <div className="space-y-1.5 md:col-span-1">
                                    <Label className="text-[10px] font-bold tracking-widest text-black/40 uppercase dark:text-white/40">
                                        Nama Klasifikasi
                                    </Label>
                                    <Input
                                        value={form.data.name}
                                        onChange={(e) => form.setData('name', e.target.value)}
                                        required
                                        placeholder="CONTOH: PERJANJIAN KERJASAMA JASA"
                                        className="h-10 rounded-xl border-black/[0.1] bg-black/[0.02] px-4 text-xs font-bold tracking-tight text-black uppercase transition-all placeholder:text-black/20 focus-visible:ring-0 dark:border-white/[0.1] dark:bg-white/[0.02] dark:text-white"
                                    />
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <Label className="text-[10px] font-bold tracking-widest text-black/40 uppercase dark:text-white/40">
                                        Deskripsi Konteks
                                    </Label>
                                    <Input
                                        value={form.data.description}
                                        onChange={(e) => form.setData('description', e.target.value)}
                                        placeholder="Ringkasan kapan menggunakan tipe ini..."
                                        className="h-10 rounded-xl border-black/[0.1] bg-black/[0.02] px-4 text-xs font-bold tracking-tight text-black uppercase transition-all placeholder:text-black/20 focus-visible:ring-0 dark:border-white/[0.1] dark:bg-white/[0.02] dark:text-white"
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
                                        <Label className="text-[10px] font-bold tracking-widest text-black/40 uppercase dark:text-white/40">
                                            Mekanisme Pengajuan (F1)
                                        </Label>
                                        <Select value={form.data.f1_input_mechanism} onValueChange={(v) => form.setData('f1_input_mechanism', v)}>
                                            <SelectTrigger className="h-10 rounded-xl border-black/[0.1] bg-black/[0.02] text-[10px] font-black tracking-widest text-black uppercase dark:border-white/[0.1] dark:bg-white/[0.02] dark:text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-black/[0.1] bg-white dark:border-white/[0.1] dark:bg-black">
                                                <SelectItem
                                                    value="digital"
                                                    className="py-3 text-[10px] font-black tracking-widest text-black uppercase dark:text-white"
                                                >
                                                    Pengajuan Formulir Digital
                                                </SelectItem>
                                                <SelectItem
                                                    value="folder"
                                                    className="py-3 text-[10px] font-black tracking-widest text-black uppercase dark:text-white"
                                                >
                                                    Templat Folder Kontrak
                                                </SelectItem>
                                                <SelectItem
                                                    value="manual"
                                                    className="py-3 text-[10px] font-black tracking-widest text-black uppercase dark:text-white"
                                                >
                                                    Unggah Dokumen Manual
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {form.data.f1_input_mechanism === 'digital' ? (
                                        <div className="animate-in fade-in slide-in-from-top-2 space-y-1.5">
                                            <Label className="text-[10px] font-bold tracking-widest text-black/40 uppercase dark:text-white/40">
                                                Tautan ke Templat Digital F1
                                            </Label>
                                            <Select
                                                value={form.data.f1_form_template_id}
                                                onValueChange={(v) => form.setData('f1_form_template_id', v)}
                                            >
                                                <SelectTrigger className="h-10 rounded-xl border-black/[0.1] bg-black/[0.02] text-[10px] font-black tracking-tight text-black uppercase dark:border-white/[0.1] dark:bg-white/[0.02] dark:text-white">
                                                    <SelectValue placeholder="PILIH ASET F1..." />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-[200px] rounded-xl border-black/[0.1] bg-white dark:border-white/[0.1] dark:bg-black">
                                                    <SelectItem
                                                        value="none"
                                                        className="text-[10px] font-black text-black/20 uppercase italic dark:text-white/20"
                                                    >
                                                        Tidak Terpaut / Tanpa Templat
                                                    </SelectItem>
                                                    {templates.map((t: any) => (
                                                        <SelectItem
                                                            key={t.id}
                                                            value={t.id}
                                                            className="py-3 text-[10px] font-black tracking-widest text-black uppercase dark:text-white"
                                                        >
                                                            {t.name}{' '}
                                                            <span className="ml-2 font-bold text-black/30 dark:text-white/30">
                                                                ({t.document_type || 'ADHOC'})
                                                            </span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ) : form.data.f1_input_mechanism === 'folder' ? (
                                        <div className="animate-in fade-in slide-in-from-top-2 space-y-1.5">
                                            <Label className="text-[10px] font-bold tracking-widest text-black/40 uppercase dark:text-white/40">
                                                Tautan ke Templat Folder (F1)
                                            </Label>
                                            <Select
                                                value={form.data.f1_contract_template_id}
                                                onValueChange={(v) => form.setData('f1_contract_template_id', v)}
                                            >
                                                <SelectTrigger className="h-10 rounded-xl border-black/[0.1] bg-black/[0.02] text-[10px] font-black tracking-tight text-black uppercase dark:border-white/[0.1] dark:bg-white/[0.02] dark:text-white">
                                                    <SelectValue placeholder="PILIH ASET FISIK..." />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-[200px] rounded-xl border-black/[0.1] bg-white dark:border-white/[0.1] dark:bg-black">
                                                    <SelectItem
                                                        value="none"
                                                        className="text-[10px] font-black text-black/20 uppercase italic dark:text-white/20"
                                                    >
                                                        Tidak Ada Templat Terpilih
                                                    </SelectItem>
                                                    {physTemplates.map((t: any) => (
                                                        <SelectItem
                                                            key={t.id}
                                                            value={t.id}
                                                            className="py-3 text-[10px] font-black tracking-widest text-black uppercase dark:text-white"
                                                        >
                                                            {t.name}{' '}
                                                            <span className="ml-2 font-bold text-black/30 dark:text-white/30">
                                                                ({t.file_type || 'PDF'})
                                                            </span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ) : (
                                        <div className="animate-in fade-in rounded-xl border border-dashed border-black/[0.1] bg-black/[0.02] p-6 text-center dark:border-white/[0.1] dark:bg-white/[0.02]">
                                            <p className="text-[10px] font-bold tracking-[0.2em] text-black/30 uppercase dark:text-white/30">
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
                                        <Label className="text-[10px] font-bold tracking-widest text-black/40 uppercase dark:text-white/40">
                                            Mekanisme Pengajuan (F2)
                                        </Label>
                                        <Select value={form.data.f2_input_mechanism} onValueChange={(v) => form.setData('f2_input_mechanism', v)}>
                                            <SelectTrigger className="h-10 rounded-xl border-black/[0.1] bg-black/[0.02] text-[10px] font-black tracking-widest text-black uppercase dark:border-white/[0.1] dark:bg-white/[0.02] dark:text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-black/[0.1] bg-white dark:border-white/[0.1] dark:bg-black">
                                                <SelectItem
                                                    value="digital"
                                                    className="py-3 text-[10px] font-black tracking-widest text-black uppercase dark:text-white"
                                                >
                                                    Pengajuan Formulir Digital
                                                </SelectItem>
                                                <SelectItem
                                                    value="folder"
                                                    className="py-3 text-[10px] font-black tracking-widest text-black uppercase dark:text-white"
                                                >
                                                    Templat Folder Kontrak
                                                </SelectItem>
                                                <SelectItem
                                                    value="manual"
                                                    className="py-3 text-[10px] font-black tracking-widest text-black uppercase dark:text-white"
                                                >
                                                    Unggah Dokumen Manual
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {form.data.f2_input_mechanism === 'digital' ? (
                                        <div className="animate-in fade-in slide-in-from-top-2 space-y-1.5">
                                            <Label className="text-[10px] font-bold tracking-widest text-black/40 uppercase dark:text-white/40">
                                                Tautan ke Templat Digital F2
                                            </Label>
                                            <Select
                                                value={form.data.f2_form_template_id}
                                                onValueChange={(v) => form.setData('f2_form_template_id', v)}
                                            >
                                                <SelectTrigger className="h-10 rounded-xl border-black/[0.1] bg-black/[0.02] text-[10px] font-black tracking-tight text-black uppercase dark:border-white/[0.1] dark:bg-white/[0.02] dark:text-white">
                                                    <SelectValue placeholder="PILIH ASET F2..." />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-[200px] rounded-xl border-black/[0.1] bg-white dark:border-white/[0.1] dark:bg-black">
                                                    <SelectItem
                                                        value="none"
                                                        className="text-[10px] font-black text-black/20 uppercase italic dark:text-white/20"
                                                    >
                                                        Tidak Terpaut / Tanpa Templat
                                                    </SelectItem>
                                                    {templates.map((t: any) => (
                                                        <SelectItem
                                                            key={t.id}
                                                            value={t.id}
                                                            className="py-3 text-[10px] font-black tracking-widest text-black uppercase dark:text-white"
                                                        >
                                                            {t.name}{' '}
                                                            <span className="ml-2 font-bold text-black/30 dark:text-white/30">
                                                                ({t.document_type || 'ADHOC'})
                                                            </span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ) : form.data.f2_input_mechanism === 'folder' ? (
                                        <div className="animate-in fade-in slide-in-from-top-2 space-y-1.5">
                                            <Label className="text-[10px] font-bold tracking-widest text-black/40 uppercase dark:text-white/40">
                                                Tautan ke Templat Folder (F2)
                                            </Label>
                                            <Select
                                                value={form.data.f2_contract_template_id}
                                                onValueChange={(v) => form.setData('f2_contract_template_id', v)}
                                            >
                                                <SelectTrigger className="h-10 rounded-xl border-black/[0.1] bg-black/[0.02] text-[10px] font-black tracking-tight text-black uppercase dark:border-white/[0.1] dark:bg-white/[0.02] dark:text-white">
                                                    <SelectValue placeholder="PILIH ASET FISIK..." />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-[200px] rounded-xl border-black/[0.1] bg-white dark:border-white/[0.1] dark:bg-black">
                                                    <SelectItem
                                                        value="none"
                                                        className="text-[10px] font-black text-black/20 uppercase italic dark:text-white/20"
                                                    >
                                                        Tidak Ada Templat Terpilih
                                                    </SelectItem>
                                                    {physTemplates.map((t: any) => (
                                                        <SelectItem
                                                            key={t.id}
                                                            value={t.id}
                                                            className="py-3 text-[10px] font-black tracking-widest text-black uppercase dark:text-white"
                                                        >
                                                            {t.name}{' '}
                                                            <span className="ml-2 font-bold text-black/30 dark:text-white/30">
                                                                ({t.file_type || 'PDF'})
                                                            </span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ) : (
                                        <div className="animate-in fade-in rounded-xl border border-dashed border-black/[0.1] bg-black/[0.02] p-6 text-center dark:border-white/[0.1] dark:bg-white/[0.02]">
                                            <p className="text-[10px] font-bold tracking-[0.2em] text-black/30 uppercase dark:text-white/30">
                                                VENDOR AKAN MENGUNGGAH PDF MANUAL UNTUK F2
                                            </p>
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
            filters={[
                {
                    label: 'Mekanisme F1',
                    key: 'f1_input_mechanism',
                    options: [
                        { label: 'Formulir Digital', value: 'digital' },
                        { label: 'Folder Kontrak', value: 'folder' },
                        { label: 'Manual', value: 'manual' },
                    ],
                },
                {
                    label: 'Mekanisme F2',
                    key: 'f2_input_mechanism',
                    options: [
                        { label: 'Formulir Digital', value: 'digital' },
                        { label: 'Folder Kontrak', value: 'folder' },
                        { label: 'Manual', value: 'manual' },
                    ],
                },
            ]}
            activeFilters={{
                f1_input_mechanism: filters.f1_input_mechanism ? [filters.f1_input_mechanism] : [],
                f2_input_mechanism: filters.f2_input_mechanism ? [filters.f2_input_mechanism] : [],
            }}
            onFilterChange={(updatedFilters) => {
                const newFilters: Record<string, any> = { ...filters, page: 1 };
                Object.keys(updatedFilters).forEach(key => {
                    newFilters[key] = updatedFilters[key].length > 0 ? updatedFilters[key][0] : null;
                });
                router.get(window.location.pathname, newFilters, { preserveState: true, replace: true });
            }}
            headerActions={
                canCreate && (
                    <Button variant="primary" onClick={openCreate} className="h-10 px-8 shadow-xl active:scale-95">
                        <Plus size={14} /> Tambah Klasifikasi Baru
                    </Button>
                )
            }
            onRowClick={openEdit}
            bulkActions={
                canUpdate
                    ? [
                          {
                              label: 'Hapus Terpilih',
                              icon: Trash2,
                              variant: 'destructive',
                              onClick: (ids) => {
                                  if (confirm(`Hapus ${ids.length} tipe kontrak terpilih?`)) {
                                      router.post(
                                          '/admin/contract-types/bulk-delete',
                                          { ids },
                                          {
                                              onSuccess: () => showToast(`${ids.length} tipe kontrak telah dihapus`, 'success'),
                                          },
                                      );
                                  }
                              },
                          },
                      ]
                    : undefined
            }
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
