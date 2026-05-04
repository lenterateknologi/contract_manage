import { FormSection, ManagementForm } from '@/components/admin/ManagementForm';
import { useToast } from '@/components/contracts/Toast';
import { Button } from '@/components/ui/base/Button';
import { Checkbox } from '@/components/ui/base/Checkbox';
import { Column, TableMasterData } from '@/components/ui/data/TableMasterData';
import { CompactInput } from '@/components/ui/forms/CompactInput';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import { AlertCircle, FileText, LayoutTemplate, Link2, Lock, Plus, ShieldCheck, Tags, Unlock } from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface StatusManagementProps {
    readonly statuses: any;
    readonly filters: any;
}

const StatusLabelCell = ({ row }: { readonly row: any }) => (
    <div className="group flex flex-col select-none">
        <span className="text-slate-900 dark:text-slate-200 inline-block text-sm font-semibold transition-transform group-hover:translate-x-1 duration-200">
            {row.label}
        </span>
        <span className="text-muted-foreground dark:text-slate-400 mt-0.5 font-mono text-xs font-medium">{row.code}</span>
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

const ConfigBadge = ({
    active,
    label,
    activeIcon: ActiveIcon,
    inactiveIcon: InactiveIcon,
}: {
    active: boolean;
    label: string;
    activeIcon: any;
    inactiveIcon: any;
}) => (
    <div
        className={cn(
            'flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all duration-200 select-none backdrop-blur-sm shadow-sm',
            active
                ? 'bg-primary/10 border-primary/30 text-primary dark:text-primary'
                : 'text-muted-foreground border-border/40 dark:border-slate-800/40 bg-muted/20 dark:bg-slate-800/20 opacity-70',
        )}
    >
        {active ? <ActiveIcon size={12} /> : <InactiveIcon size={12} />}
        {label}
    </div>
);

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
        allow_reference: false as boolean,
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
                header: 'Konfigurasi Sistem',
                accessorKey: 'display_mode',
                className: 'hidden md:table-cell',
                cell: (row) => (
                    <div className="flex items-center gap-3 select-none">
                        <ConfigBadge active={row.display_mode === 'pdf'} label="PDF" activeIcon={FileText} inactiveIcon={LayoutTemplate} />
                        <ConfigBadge active={row.allow_info_edit} label="Edit" activeIcon={Unlock} inactiveIcon={Lock} />
                        <ConfigBadge active={row.allow_reference} label="Ref" activeIcon={Link2} inactiveIcon={Link2} />
                    </div>
                ),
            },
            {
                header: 'Status',
                accessorKey: 'is_active',
                className: 'text-right',
                cell: (row) => (
                    <div className="flex items-center justify-end gap-2 select-none">
                        <div
                            className={cn(
                                'h-2 w-2 rounded-full',
                                row.is_active ? 'animate-pulse bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700',
                            )}
                        />
                        <span
                            className={cn(
                                'text-xs font-bold tracking-wide select-none transition-colors duration-200',
                                row.is_active ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-600',
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
            display_mode: s.display_mode || 'interactive',
            allow_info_edit: !!s.allow_info_edit,
            allow_reference: !!s.allow_reference,
        });
        setIsEditorOpen(true);
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const options = {
            onSuccess: () => {
                setIsEditorOpen(false);
                setEditingStatus(null);
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
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 animate-in fade-in duration-200 select-none">
                    <div className="space-y-12 lg:col-span-8">
                        {/* Section 1: Dasar */}
                        <FormSection title="Arsitektur Identitas" subtitle="Parameter dasar yang mendefinisikan status dalam database">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                                    placeholder="NAMA STATUS YANG MUNCUL DI UI"
                                />
                                <div className="md:col-span-2">
                                    <CompactInput
                                        label="Deskripsi Fungsional"
                                        value={form.data.description}
                                        onChange={(e) => form.setData('description', e.target.value)}
                                        placeholder="Jelaskan peran status ini dalam alur bisnis..."
                                    />
                                </div>
                            </div>
                        </FormSection>

                        {/* Section 2: Visuals */}
                        <FormSection title="Skema Warna & Tipografi" subtitle="Pengaturan visual untuk badge dan audit trail">
                            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                                <div className="space-y-3">
                                    <label className="text-muted-foreground ml-1 text-xs font-bold tracking-wide uppercase">
                                        Warna Teks
                                    </label>
                                    <div className="border-border/80 dark:border-slate-800/80 bg-muted/20 dark:bg-slate-900/40 backdrop-blur-sm flex items-center gap-3 rounded-2xl border p-3.5 transition-all duration-200">
                                        <input
                                            type="color"
                                            value={form.data.color}
                                            onChange={(e) => form.setData('color', e.target.value)}
                                            className="h-8 w-12 cursor-pointer rounded-lg border-none bg-transparent"
                                        />
                                        <span className="text-slate-900 dark:text-slate-100 font-mono text-sm font-bold tracking-wider uppercase">
                                            {form.data.color}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-muted-foreground ml-1 text-xs font-bold tracking-wide uppercase">
                                        Warna Latar
                                    </label>
                                    <div className="border-border/80 dark:border-slate-800/80 bg-muted/20 dark:bg-slate-900/40 backdrop-blur-sm flex items-center gap-3 rounded-2xl border p-3.5 transition-all duration-200">
                                        <input
                                            type="color"
                                            value={form.data.bg_color}
                                            onChange={(e) => form.setData('bg_color', e.target.value)}
                                            className="h-8 w-12 cursor-pointer rounded-lg border-none bg-transparent"
                                        />
                                        <span className="text-slate-900 dark:text-slate-100 font-mono text-sm font-bold tracking-wider uppercase">
                                            {form.data.bg_color}
                                        </span>
                                    </div>
                                </div>
                                <div className="border-border/80 dark:border-slate-800/80 bg-muted/10 dark:bg-slate-900/20 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl border border-dashed p-6 transition-all duration-200">
                                    <span className="text-muted-foreground mb-4 text-xs font-bold tracking-wider uppercase opacity-80 select-none">
                                        Live Badge Preview
                                    </span>
                                    <div
                                        className="rounded-xl border border-border px-6 py-2 text-xs font-semibold shadow-sm backdrop-blur-md transition-all duration-200 select-none hover:scale-105"
                                        style={{ color: form.data.color, backgroundColor: form.data.bg_color }}
                                    >
                                        {form.data.label || 'PREVIEW'}
                                    </div>
                                </div>
                            </div>
                        </FormSection>
                    </div>

                    <div className="space-y-10 lg:col-span-4">
                        <div className="sticky top-6 space-y-10">
                            {/* Mode Tampilan Widget */}
                            <div className="border-border/60 dark:border-slate-800/60 bg-muted/10 dark:bg-slate-900/20 backdrop-blur-sm rounded-2xl border p-6 select-none shadow-sm">
                                <h3 className="text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                                    <LayoutTemplate size={14} className="text-primary" /> Render Strategy
                                </h3>

                                <div className="space-y-3">
                                    {[
                                        {
                                            id: 'interactive',
                                            label: 'Interactive Form',
                                            desc: 'React component rendering for fast editing.',
                                            icon: LayoutTemplate,
                                        },
                                        {
                                            id: 'pdf',
                                            label: 'PDF Preview',
                                            desc: 'Direct server-side PDF render for print accuracy.',
                                            icon: FileText,
                                        },
                                    ].map((mode) => (
                                        <button
                                            key={mode.id}
                                            type="button"
                                            onClick={() => form.setData('display_mode', mode.id as any)}
                                            className={cn(
                                                'group flex w-full items-start gap-4 rounded-xl border p-3.5 text-left transition-all duration-200 select-none',
                                                form.data.display_mode === mode.id
                                                    ? 'bg-primary border-primary text-white shadow-md'
                                                    : 'border-border/60 dark:border-slate-800/60 text-slate-800 dark:text-slate-200 hover:border-primary/50 bg-card dark:bg-slate-900/40 hover:shadow-sm',
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    'rounded-lg p-2 transition-colors duration-200',
                                                    form.data.display_mode === mode.id
                                                        ? 'bg-white/20'
                                                        : 'bg-muted dark:bg-slate-800/60 group-hover:bg-primary/10',
                                                )}
                                            >
                                                <mode.icon size={16} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold tracking-wide">{mode.label}</span>
                                                <span className={cn('mt-0.5 text-[11px] leading-tight font-medium opacity-80')}>{mode.desc}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Operational Controls */}
                            <div className="space-y-4 select-none">
                                <h3 className="text-slate-900 dark:text-slate-100 px-1 text-xs font-bold uppercase tracking-wider">
                                    Behavior Control
                                </h3>
                                <div className="space-y-3">
                                    {[
                                        {
                                            id: 'allow_info_edit',
                                            label: 'Allow Info Edit',
                                            desc: 'User can modify metadata in this status.',
                                            icon: Unlock,
                                        },
                                        {
                                            id: 'allow_reference',
                                            label: 'Allow Reference',
                                            desc: 'Contracts can link to this status as parent.',
                                            icon: Link2,
                                        },
                                        {
                                            id: 'is_active',
                                            label: 'Status Is Online',
                                            desc: 'Make this status available for selection.',
                                            icon: ShieldCheck,
                                        },
                                    ].map((ctrl) => (
                                        <div
                                            key={ctrl.id}
                                            onClick={() => form.setData(ctrl.id as any, !form.data[ctrl.id as keyof typeof form.data])}
                                            className="bg-card dark:bg-slate-900/20 backdrop-blur-sm border-border/60 dark:border-slate-800/60 group hover:bg-muted/30 dark:hover:bg-slate-800/40 flex cursor-pointer items-center gap-4 rounded-xl border p-3.5 transition-all duration-200 select-none shadow-sm"
                                        >
                                            <Checkbox
                                                id={ctrl.id}
                                                checked={!!form.data[ctrl.id as keyof typeof form.data]}
                                                onCheckedChange={() => {}} // Handled by div
                                                className="h-5 w-5 border-border dark:border-slate-700 data-[state=checked]:bg-primary"
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-slate-900 dark:text-slate-100 text-xs font-bold tracking-wide">
                                                    {ctrl.label}
                                                </span>
                                                <span className="text-muted-foreground dark:text-slate-400 mt-0.5 text-xs font-medium">
                                                    {ctrl.desc}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10 p-4 backdrop-blur-sm animate-in fade-in duration-300">
                                <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-500" />
                                <p className="text-xs leading-relaxed font-semibold text-amber-600 dark:text-amber-400">
                                    Peringatan: Perubahan parameter visual akan berdampak langsung pada audit trail dan dashboard di seluruh sistem secara global.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </ManagementForm>
        );
    }

    return (
        <div className="bg-card/40 dark:bg-slate-900/20 backdrop-blur-sm border border-border/60 dark:border-slate-800/60 m-5 rounded-2xl p-6 shadow-sm animate-in fade-in duration-200 select-none">
            <TableMasterData
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
                    <Button
                        variant="white"
                        onClick={openCreate}
                        className="h-10 px-5 gap-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 border border-border bg-card dark:bg-slate-900/60 text-foreground shadow-sm hover:bg-muted/60 dark:hover:bg-slate-800/60 hover:border-border hover:shadow-md select-none"
                    >
                        <Plus size={14} className="text-primary" /> Registrasi Status Baru
                    </Button>
                }
                pagination={
                    statuses?.meta
                        ? {
                              currentPage: statuses.meta.current_page || 1,
                              lastPage: statuses.meta.last_page || 1,
                              total: statuses.meta.total || 0,
                              from: statuses.meta.from,
                              to: statuses.meta.to,
                              perPage: statuses.meta.per_page,
                              onPageChange: (page: number) =>
                                  router.get(globalThis.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                          }
                        : undefined
                }
            />
        </div>
    );
}
