import { FormSection, ManagementForm } from '@/pages/admin/components/ManagementForm';
import { Button } from '@/components/ui/base/Button';
import { Checkbox } from '@/components/ui/base/Checkbox';
import { Column, DataTable } from '@/components/ui/data/DataTable';
import { useToast } from '@/components/ui/feedback/Toast';
import { CompactInput } from '@/components/ui/forms/CompactInput';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import { AlertCircle, Plus, Tags, Trash2 } from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface StatusManagementProps {
    readonly statuses: any;
    readonly filters: any;
}

const StatusLabelCell = ({ row }: { readonly row: any }) => (
    <div className="group flex flex-col select-none">
        <span className="text-text-main inline-block text-sm font-semibold transition-transform duration-200 group-hover:translate-x-1">
            {row.label}
        </span>
        <span className="text-text-desc mt-0.5 font-mono text-xs font-medium">{row.code}</span>
    </div>
);

const VisualPreviewCell = ({ row }: { readonly row: any }) => (
    <div className="flex items-center">
        <div
            className="rounded-full border px-3 py-1 text-xs font-semibold shadow-sm transition-all duration-200 hover:scale-105"
            style={{ color: row.color, backgroundColor: row.bg_color || 'transparent', borderColor: row.color }}
        >
            {row.label}
        </div>
    </div>
);

export function StatusManagement({ statuses, filters }: StatusManagementProps) {
    const { showToast } = useToast();
    const { canDelete } = usePermissions('ADMIN_STATUS');
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
    });

    const columns = useMemo<Column<any>[]>(
        () => [
            {
                header: 'Identitas Status',
                accessorKey: 'label',
                cell: (row) => <StatusLabelCell row={row} />,
            },
            {
                header: 'Visual Audit',
                accessorKey: 'color',
                cell: (row) => <VisualPreviewCell row={row} />,
            },
            {
                header: 'Status',
                accessorKey: 'is_active',
                className: 'text-right',
                cell: (row) => (
                    <div className="flex items-center justify-end gap-2 select-none">
                        <div className={cn('h-2 w-2 rounded-full', row.is_active ? 'bg-success animate-pulse' : 'bg-surface-muted')} />
                        <span
                            className={cn(
                                'text-xs font-semibold tracking-wide transition-colors duration-200 select-none',
                                row.is_active ? 'text-text-main' : 'text-text-desc',
                            )}
                        >
                            {row.is_active ? 'Aktif' : 'Non-aktif'}
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
        });
        setIsEditorOpen(true);
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const options = {
            onSuccess: () => {
                setIsEditorOpen(false);
                setEditingStatus(null);
                form.reset();
                showToast(`Parameter status ${form.data.label} berhasil diperbarui`, 'success');
            },
        };
        if (editingStatus) form.put(route('admin.contract-statuses.update', editingStatus.id), options);
        else form.post(route('admin.contract-statuses.store'), options);
    };

    if (isEditorOpen) {
        const isEdit = !!editingStatus;
        return (
            <ManagementForm
                title={isEdit ? 'Parameter Status Kontrak' : 'Registrasi Status Baru'}
                subtitle={
                    isEdit
                        ? `Mengelola perilaku sistem dan visualisasi audit untuk status ${form.data.label}`
                        : 'Mendefinisikan entitas status baru dalam alur kerja manajemen kontrak'
                }
                onClose={() => {
                    setIsEditorOpen(false);
                    setEditingStatus(null);
                }}
                onSave={handleSubmit}
                processing={form.processing}
                isDirty={form.isDirty}
                isEdit={isEdit}
            >
                <div className="animate-in fade-in grid w-full grid-cols-1 gap-16 duration-300 select-none lg:grid-cols-2">
                    {/* Side 1: Primary Configuration */}
                    <div className="space-y-12">
                        <FormSection title="Arsitektur Identitas" subtitle="Parameter dasar yang mendefinisikan status dalam database">
                            <div className="grid grid-cols-1 gap-y-10">
                                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                    <CompactInput
                                        label="Kode Sistem (Unique)"
                                        value={form.data.code}
                                        onChange={(e) => form.setData('code', e.target.value)}
                                        placeholder="CONTOH: DRAFT / APPROVED"
                                        icon={Tags}
                                    />
                                    <CompactInput
                                        label="Label Visual"
                                        value={form.data.label}
                                        onChange={(e) => form.setData('label', e.target.value)}
                                        placeholder="NAMA STATUS"
                                    />
                                </div>
                                <CompactInput
                                    label="Deskripsi Fungsional"
                                    value={form.data.description}
                                    onChange={(e) => form.setData('description', e.target.value)}
                                    placeholder="Jelaskan peran status ini dalam alur bisnis secara mendalam..."
                                />
                            </div>
                        </FormSection>

                        <FormSection title="Skema Warna" subtitle="Konfigurasi palet visual untuk badge dan audit trail">
                            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                <div className="space-y-3">
                                    <label className="text-primary/60 ml-1 text-[10px] font-semibold tracking-widest uppercase dark:text-white/60">
                                        Warna Teks Utama
                                    </label>
                                    <div className="border-border/80 bg-muted/20 flex items-center gap-4 rounded-2xl border p-4 backdrop-blur-sm transition-all duration-200">
                                        <input
                                            type="color"
                                            value={form.data.color}
                                            onChange={(e) => form.setData('color', e.target.value)}
                                            className="h-10 w-16 cursor-pointer rounded-lg border-none bg-transparent"
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-text-main font-mono text-sm font-semibold  uppercase">
                                                {form.data.color}
                                            </span>
                                            <span className="text-[9px] font-semibold text-slate-400 uppercase">HEX Code</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-primary/60 ml-1 text-[10px] font-semibold tracking-widest uppercase dark:text-white/60">
                                        Warna Latar (Background)
                                    </label>
                                    <div className="border-border/80 bg-muted/20 flex items-center gap-4 rounded-2xl border p-4 backdrop-blur-sm transition-all duration-200">
                                        <input
                                            type="color"
                                            value={form.data.bg_color}
                                            onChange={(e) => form.setData('bg_color', e.target.value)}
                                            className="h-10 w-16 cursor-pointer rounded-lg border-none bg-transparent"
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-text-main font-mono text-sm font-semibold  uppercase">
                                                {form.data.bg_color}
                                            </span>
                                            <span className="text-[9px] font-semibold text-slate-400 uppercase">HEX Code</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </FormSection>
                    </div>

                    {/* Side 2: Controls */}
                    <div className="space-y-12">
                        <FormSection title="Kontrol Perilaku" subtitle="Pengaturan status aktifitas sistem">
                            <div className="grid grid-cols-1 items-start gap-8">
                                <div
                                    onClick={() => form.setData('is_active', !form.data.is_active)}
                                    className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-black/[0.03] p-6 transition-all duration-200 select-none hover:bg-black/[0.01] dark:border-white/[0.03] dark:hover:bg-white/[0.01]"
                                >
                                    <Checkbox
                                        id="is_active"
                                        checked={!!form.data.is_active}
                                        onCheckedChange={() => { }}
                                        className="border-border data-[state=checked]:bg-primary h-6 w-6 rounded-lg"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-text-main text-sm font-semibold tracking-wide">Status Aktif</span>
                                        <span className="text-text-desc mt-1 text-[11px] leading-tight font-medium">
                                            Tersedia dalam mesin alur kerja sistem.
                                        </span>
                                    </div>
                                </div>

                                <div className="animate-in fade-in flex gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 backdrop-blur-sm duration-300 dark:bg-amber-500/10">
                                    <AlertCircle size={20} className="mt-0.5 shrink-0 text-amber-500" />
                                    <p className="text-[11px] leading-relaxed font-semibold tracking-tight text-amber-700/80 uppercase">
                                        Perubahan parameter visual akan berdampak langsung pada seluruh elemen sistem secara global.
                                    </p>
                                </div>
                            </div>
                        </FormSection>
                    </div>
                </div>
            </ManagementForm>
        );
    }

    return (
        <DataTable
            title="Manajemen Parameter Status"
            borderless={true}
            data={statuses?.data || []}
            columns={columns}
            onRowClick={openEdit}
            searchPlaceholder="Cari status, kode, atau deskripsi..."
            searchValue={filters?.search || ''}
            onSearchChange={(v: string) =>
                router.get(globalThis.location.pathname, { ...filters, search: v, page: 1 }, { preserveState: true, replace: true })
            }
            headerActions={
                <Button variant="white" onClick={openCreate}>
                    <Plus size={14} className="text-primary" /> Registrasi Status Baru
                </Button>
            }
            bulkActions={
                canDelete
                    ? [
                        {
                            label: 'Hapus Terpilih',
                            icon: Trash2,
                            variant: 'destructive',
                            onClick: (ids: string[] | number[]) => {
                                if (confirm(`Apakah Anda yakin ingin menghapus ${ids.length} status terpilih?`)) {
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
            pagination={{
                currentPage: statuses.current_page || 1,
                lastPage: statuses.last_page || 1,
                total: statuses.total || 0,
                from: statuses.from || 1,
                to: statuses.to || 1,
                perPage: statuses.per_page || 10,
                onPageChange: (page: number) =>
                    router.get(globalThis.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                onPerPageChange: (pp: number) =>
                    router.get(globalThis.location.pathname, { ...filters, per_page: pp, page: 1 }, { preserveState: true, preserveScroll: true }),
            }}
        />
    );
}
