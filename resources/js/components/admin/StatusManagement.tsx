import { ManagementForm } from '@/components/admin/ManagementForm';
import { useToast } from '@/components/contracts/Toast';
import { Column, DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, Palette, Plus, Tags } from 'lucide-react';
import React, { useMemo, useState } from 'react';

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
        allow_info_edit: false as boolean,
    });

    const columns = useMemo<Column<any>[]>(
        () => [
            {
                header: 'Status Label',
                accessorKey: 'label',
                sortable: true,
                cell: (row) => (
                    <div className="flex flex-col">
                        <span className="text-[13px] leading-tight font-bold text-black dark:text-white">{row.label}</span>
                        <span className="mt-0.5 font-mono text-[10px] font-bold tracking-widest text-black/30 uppercase dark:text-white/30">
                            {row.code}
                        </span>
                    </div>
                ),
            },
            {
                header: 'Visual Preview',
                accessorKey: 'color',
                cell: (row) => (
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: row.color }}>
                            {row.label}
                        </span>
                    </div>
                ),
            },
            {
                header: 'Show Mode',
                accessorKey: 'display_mode',
                cell: (row) => (
                    <span className="text-[10px] font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                        {row.display_mode === 'pdf' ? 'DOCUMENT PDF' : 'INTERACTIVE FORM'}
                    </span>
                ),
            },
            {
                header: 'Edit Info',
                accessorKey: 'allow_info_edit',
                cell: (row) => (
                    <div className="flex items-center gap-2">
                        <div
                            className={cn(
                                'h-1.5 w-1.5 rounded-full',
                                row.allow_info_edit ? 'bg-black dark:bg-white' : 'bg-black/10 dark:bg-white/10',
                            )}
                        />
                        <span
                            className={cn(
                                'text-[10px] font-black tracking-widest uppercase',
                                row.allow_info_edit ? 'text-black dark:text-white' : 'text-black/30 dark:text-white/30',
                            )}
                        >
                            {row.allow_info_edit ? 'ALLOWED' : 'LOCKED'}
                        </span>
                    </div>
                ),
            },
            {
                header: 'Sistem',
                accessorKey: 'is_active',
                cell: (row) => (
                    <div className="flex items-center gap-2">
                        <div className={cn('h-1.5 w-1.5 rounded-full', row.is_active ? 'bg-black dark:bg-white' : 'bg-black/10 dark:bg-white/10')} />
                        <span
                            className={cn(
                                'text-[10px] font-black tracking-widest uppercase',
                                row.is_active ? 'text-black dark:text-white' : 'text-black/30 dark:text-white/30',
                            )}
                        >
                            {row.is_active ? 'AKTIF' : 'NON-AKTIF'}
                        </span>
                    </div>
                ),
            },
        ],
        [],
    );

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
            allow_info_edit: !!s.allow_info_edit,
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
            },
        };
        if (editingStatus) form.put(`/admin/contract-statuses/${editingStatus.id}`, options);
        else form.post('/admin/contract-statuses', options);
    };

    if (isEditorOpen) {
        const isEdit = !!editingStatus;
        return (
            <ManagementForm
                title={isEdit ? 'Profil Parameter Status' : 'Registrasi Status Baru'}
                subtitle={isEdit ? 'Konfigurasi visual dan perilaku sistem untuk status ini' : 'Definisikan kategori status baru dalam alur kerja'}
                onClose={() => {
                    setIsEditorOpen(false);
                    setEditingStatus(null);
                }}
                onSave={handleSubmit}
                processing={form.processing}
                isDirty={form.isDirty}
                isEdit={isEdit}
            >
                <div className="animate-in slide-in-from-bottom-2 w-full space-y-12 px-1 pb-16 duration-700">
                    <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
                        {/* Primary Configuration */}
                        <div className="space-y-12 lg:col-span-8">
                            <div className="space-y-6">
                                <h3 className="ml-1 border-b border-black/[0.05] pb-3 text-[11px] font-black tracking-[0.2em] text-black uppercase dark:border-white/[0.05] dark:text-white">
                                    Arsitektur Identitas Status
                                </h3>
                                <div className="grid grid-cols-1 gap-x-8 gap-y-6 p-1 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label className="ml-1 text-[10px] leading-none font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                                            Kode Sistem
                                        </Label>
                                        <Input
                                            value={form.data.code}
                                            onChange={(e) => form.setData('code', e.target.value)}
                                            required
                                            placeholder="ST-01"
                                            className="h-10 rounded-xl border-black/[0.08] bg-black/[0.03] font-mono text-[11px] font-black text-black uppercase shadow-sm transition-all placeholder:text-black/20 focus:border-black focus-visible:ring-0 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white dark:focus:border-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="ml-1 text-[10px] leading-none font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                                            Label Status
                                        </Label>
                                        <Input
                                            value={form.data.label}
                                            onChange={(e) => form.setData('label', e.target.value)}
                                            required
                                            placeholder="CONTOH: DALAM PROSES"
                                            className="h-10 rounded-xl border-black/[0.08] bg-black/[0.03] text-[11px] font-black text-black uppercase shadow-sm transition-all placeholder:text-black/20 focus:border-black focus-visible:ring-0 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white dark:focus:border-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="ml-1 text-[10px] leading-none font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                                            Deskripsi Fungsional
                                        </Label>
                                        <Input
                                            value={form.data.description}
                                            onChange={(e) => form.setData('description', e.target.value)}
                                            placeholder="Jelaskan peran status ini dalam alur kerja..."
                                            className="h-10 rounded-xl border-black/[0.08] bg-black/[0.03] text-[11px] font-bold text-black uppercase shadow-sm transition-all placeholder:text-black/20 focus:border-black focus-visible:ring-0 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white dark:focus:border-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="ml-1 border-b border-black/[0.05] pb-3 text-[11px] font-black tracking-[0.2em] text-black uppercase dark:border-white/[0.05] dark:text-white">
                                    Visual & Skema Warna
                                </h3>
                                <div className="grid grid-cols-1 gap-x-8 gap-y-6 p-1 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label className="ml-1 flex items-center gap-2 text-[10px] leading-none font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                                            <Palette size={12} className="opacity-40" /> Warna Tipografi
                                        </Label>
                                        <div className="flex items-center gap-4 rounded-xl border border-black/[0.08] bg-black/[0.03] p-3 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.03]">
                                            <Input
                                                type="color"
                                                value={form.data.color}
                                                onChange={(e) => form.setData('color', e.target.value)}
                                                className="h-10 w-16 cursor-pointer rounded-lg border-none bg-transparent p-0"
                                            />
                                            <span className="font-mono text-[11px] font-black tracking-widest text-black uppercase dark:text-white">
                                                {form.data.color}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="ml-1 flex items-center gap-2 text-[10px] leading-none font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                                            <Palette size={12} className="opacity-40" /> Warna Latar (Badge)
                                        </Label>
                                        <div className="flex items-center gap-4 rounded-xl border border-black/[0.08] bg-black/[0.03] p-3 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.03]">
                                            <Input
                                                type="color"
                                                value={form.data.bg_color}
                                                onChange={(e) => form.setData('bg_color', e.target.value)}
                                                className="h-10 w-16 cursor-pointer rounded-lg border-none bg-transparent p-0"
                                            />
                                            <span className="font-mono text-[11px] font-black tracking-widest text-black uppercase dark:text-white">
                                                {form.data.bg_color}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-dashed border-black/[0.1] bg-black/[0.02] px-8 py-10 dark:border-white/[0.1] dark:bg-white/[0.02]">
                                        <span className="text-[10px] font-black tracking-[0.3em] text-black/30 uppercase dark:text-white/30">
                                            Live Preview Badge
                                        </span>
                                        <div
                                            style={{ color: form.data.color, backgroundColor: form.data.bg_color }}
                                            className="transform rounded-xl border border-black/[0.05] px-8 py-3 text-[12px] font-black tracking-widest uppercase shadow-lg transition-all duration-300 hover:scale-105 dark:border-white/[0.05]"
                                        >
                                            {form.data.label || 'PREVIEW STATUS'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order & Priority */}
                        <div className="space-y-10 lg:col-span-4">
                            <div className="space-y-6">
                                <h3 className="ml-1 border-b border-black/[0.05] pb-3 text-[11px] font-black tracking-[0.2em] text-black uppercase dark:border-white/[0.05] dark:text-white">
                                    Konfigurasi Preview
                                </h3>
                                <div className="space-y-4 p-1">
                                    <Label className="ml-1 text-[10px] leading-none font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                                        Mode Tampilan Form (F1/F2)
                                    </Label>
                                    <div className="grid grid-cols-1 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => form.setData('display_mode', 'interactive')}
                                            className={cn(
                                                'group flex flex-col items-start gap-3 rounded-2xl border p-5 text-left shadow-sm transition-all',
                                                form.data.display_mode === 'interactive'
                                                    ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                                                    : 'border-black/[0.08] bg-white text-black hover:border-black dark:border-white/[0.08] dark:bg-black/40 dark:text-white dark:hover:border-white',
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={cn(
                                                        'h-4 w-4 rounded-full border-2 transition-all',
                                                        form.data.display_mode === 'interactive'
                                                            ? 'border-white bg-white dark:border-black dark:bg-black'
                                                            : 'border-black/20 group-hover:border-black dark:border-white/20 dark:group-hover:border-white',
                                                    )}
                                                />
                                                <span className="text-[12px] font-black tracking-tight uppercase">Interactive Form</span>
                                            </div>
                                            <p
                                                className={cn(
                                                    'text-[10px] leading-relaxed font-bold',
                                                    form.data.display_mode === 'interactive'
                                                        ? 'text-white/60 dark:text-black/60'
                                                        : 'text-black/40 dark:text-white/40',
                                                )}
                                            >
                                                Tampilan interaktif React yang dioptimalkan untuk pengisian data cepat dan responsif.
                                            </p>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => form.setData('display_mode', 'pdf')}
                                            className={cn(
                                                'group flex flex-col items-start gap-3 rounded-2xl border p-5 text-left shadow-sm transition-all',
                                                form.data.display_mode === 'pdf'
                                                    ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                                                    : 'border-black/[0.08] bg-white text-black hover:border-black dark:border-white/[0.08] dark:bg-black/40 dark:text-white dark:hover:border-white',
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={cn(
                                                        'h-4 w-4 rounded-full border-2 transition-all',
                                                        form.data.display_mode === 'pdf'
                                                            ? 'border-white bg-white dark:border-black dark:bg-black'
                                                            : 'border-black/20 group-hover:border-black dark:border-white/20 dark:group-hover:border-white',
                                                    )}
                                                />
                                                <span className="text-[12px] font-black tracking-tight uppercase">PDF Preview</span>
                                            </div>
                                            <p
                                                className={cn(
                                                    'text-[10px] leading-relaxed font-bold',
                                                    form.data.display_mode === 'pdf'
                                                        ? 'text-white/60 dark:text-black/60'
                                                        : 'text-black/40 dark:text-white/40',
                                                )}
                                            >
                                                Tampilan file PDF statis yang dirender langsung dari server untuk akurasi cetak maksimal.
                                            </p>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="ml-1 border-b border-black/[0.05] pb-3 text-[11px] font-black tracking-[0.2em] text-black uppercase dark:border-white/[0.05] dark:text-white">
                                    Kontrol Operasional
                                </h3>
                                <div className="space-y-5 p-1">
                                    <div
                                        className="group flex cursor-pointer items-center gap-4 rounded-xl border border-black/[0.05] bg-black/[0.01] p-4 shadow-sm transition-colors hover:bg-black/[0.03] dark:border-white/[0.05] dark:bg-white/[0.01] dark:hover:bg-white/[0.03]"
                                        onClick={() => form.setData('allow_info_edit', !form.data.allow_info_edit)}
                                    >
                                        <Checkbox
                                            id="f-edit-info"
                                            checked={form.data.allow_info_edit}
                                            onCheckedChange={(checked) => form.setData('allow_info_edit', checked as boolean)}
                                            className="h-5 w-5 rounded-lg border-black/[0.1] transition-all data-[state=checked]:bg-black data-[state=checked]:text-white dark:border-white/[0.1] dark:data-[state=checked]:bg-white dark:data-[state=checked]:text-black"
                                        />
                                        <div className="flex flex-col">
                                            <Label
                                                htmlFor="f-edit-info"
                                                className="cursor-pointer text-[11px] leading-tight font-black tracking-widest text-black uppercase dark:text-white"
                                            >
                                                IZINKAN EDIT INFO
                                            </Label>
                                            <p className="mt-1 text-[9px] font-bold tracking-tight text-black/30 uppercase dark:text-white/30">
                                                User dapat memodifikasi metadata kontrak
                                            </p>
                                        </div>
                                    </div>

                                    <div
                                        className="group flex cursor-pointer items-center gap-4 rounded-xl border border-black/[0.05] bg-black/[0.01] p-4 shadow-sm transition-colors hover:bg-black/[0.03] dark:border-white/[0.05] dark:bg-white/[0.01] dark:hover:bg-white/[0.03]"
                                        onClick={() => form.setData('is_active', !form.data.is_active)}
                                    >
                                        <Checkbox
                                            id="f-active"
                                            checked={form.data.is_active}
                                            onCheckedChange={(checked) => form.setData('is_active', checked as boolean)}
                                            className="h-5 w-5 rounded-lg border-black/[0.1] transition-all data-[state=checked]:bg-black data-[state=checked]:text-white dark:border-white/[0.1] dark:data-[state=checked]:bg-white dark:data-[state=checked]:text-black"
                                        />
                                        <div className="flex flex-col">
                                            <Label
                                                htmlFor="f-active"
                                                className="cursor-pointer text-[11px] leading-tight font-black tracking-widest text-black uppercase dark:text-white"
                                            >
                                                STATUS AKTIF
                                            </Label>
                                            <p className="mt-1 text-[9px] font-bold tracking-tight text-black/30 uppercase dark:text-white/30">
                                                Status tersedia untuk alur kerja operasional
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 rounded-2xl border border-black bg-black p-6 shadow-xl shadow-black/10 dark:border-white dark:bg-white dark:shadow-white/5">
                                <AlertCircle size={16} className="mt-0.5 shrink-0 text-white dark:text-black" />
                                <p className="text-[9px] leading-relaxed font-bold tracking-wider text-white uppercase dark:text-black">
                                    Perubahan pada skema warna akan segera berdampak pada seluruh dashboard, laporan, dan riwayat audit kontrak secara
                                    global.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 py-12 opacity-10 grayscale">
                        <div className="h-px flex-1 bg-black dark:bg-white" />
                        <div className="flex items-center gap-3 text-black dark:text-white">
                            <CheckCircle2 size={24} />
                            <span className="text-[12px] font-black tracking-[0.5em] uppercase">KONFIGURASI TERSIMPAN</span>
                        </div>
                        <div className="h-px flex-1 bg-black dark:bg-white" />
                    </div>
                </div>
            </ManagementForm>
        );
    }

    return (
        <div className="animate-in fade-in flex h-full flex-col bg-white duration-500 dark:bg-black">
            <DataTable
                title="Master Parameter Status"
                columns={columns}
                data={statuses?.data || []}
                searchKey="label"
                searchPlaceholder="Filter Master Status..."
                searchValue={filters.search || ''}
                onSearchChange={(v) =>
                    router.get(globalThis.location.pathname, { ...filters, search: v, page: 1 }, { preserveState: true, replace: true })
                }
                filters={[
                    {
                        label: 'Tampilan Formulir',
                        key: 'display_mode',
                        options: [
                            { label: 'Interactive Form', value: 'interactive' },
                            { label: 'Dokumen PDF', value: 'pdf' },
                        ],
                    },
                    {
                        label: 'Izin Edit Info',
                        key: 'allow_info_edit',
                        options: [
                            { label: 'Diizinkan', value: '1' },
                            { label: 'Dikunci', value: '0' },
                        ],
                    },
                    {
                        label: 'Status Sistem',
                        key: 'is_active',
                        options: [
                            { label: 'Aktif', value: '1' },
                            { label: 'Non-aktif', value: '0' },
                        ],
                    },
                ]}
                activeFilters={{
                    display_mode: filters.display_mode ? [filters.display_mode] : [],
                    allow_info_edit:
                        filters.allow_info_edit !== undefined && filters.allow_info_edit !== null ? [String(filters.allow_info_edit)] : [],
                    is_active: filters.is_active !== undefined && filters.is_active !== null ? [String(filters.is_active)] : [],
                }}
                onFilterChange={(updatedFilters) => {
                    const newFilters: Record<string, any> = { ...filters, page: 1 };
                    Object.keys(updatedFilters).forEach((key) => {
                        newFilters[key] = updatedFilters[key].length > 0 ? updatedFilters[key][0] : null;
                    });
                    router.get(globalThis.location.pathname, newFilters, { preserveState: true, replace: true });
                }}
                onRowClick={openEdit}
                pagination={
                    statuses && statuses.meta
                        ? {
                              currentPage: statuses.meta.current_page || 1,
                              lastPage: statuses.meta.last_page || 1,
                              total: statuses.meta.total || 0,
                              from: statuses.meta.from || 1,
                              to: statuses.meta.to || 1,
                              perPage: statuses.meta.per_page || 10,
                              onPageChange: (page) =>
                                  router.get(globalThis.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                              onPerPageChange: (pp) =>
                                  router.get(
                                      globalThis.location.pathname,
                                      { ...filters, per_page: pp, page: 1 },
                                      { preserveState: true, preserveScroll: true },
                                  ),
                          }
                        : undefined
                }
                headerActions={
                    <Button variant="primary" onClick={openCreate} className="h-10 px-8 shadow-xl active:scale-95">
                        <Plus size={14} /> Registrasi Status Baru
                    </Button>
                }
                bulkActions={
                    canUpdate
                        ? [
                              {
                                  label: 'Hapus Terpilih',
                                  icon: Tags,
                                  variant: 'destructive',
                                  onClick: (ids) => {
                                      if (confirm(`Hapus ${ids.length} status terpilih?`)) {
                                          router.post(
                                              '/admin/contract-statuses/bulk-delete',
                                              { ids },
                                              {
                                                  onSuccess: () => showToast(`${ids.length} status telah dihapus`, 'success'),
                                              },
                                          );
                                      }
                                  },
                              },
                          ]
                        : undefined
                }
            />
        </div>
    );
}
