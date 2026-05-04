import { ManagementForm, FormSection } from '@/components/admin/ManagementForm';
import { useToast } from '@/components/contracts/Toast';
import { Column, TableMasterData } from '@/components/ui/data/TableMasterData';
import { Button } from '@/components/ui/base/Button';
import { Checkbox } from '@/components/ui/base/Checkbox';
import { CompactInput } from '@/components/ui/forms/CompactInput';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import { 
    AlertCircle, 
    Palette, 
    Plus, 
    Tags, 
    Settings2, 
    LayoutTemplate, 
    FileText, 
    Lock, 
    Unlock, 
    Link2, 
    ShieldCheck,
    Search
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface StatusManagementProps {
    readonly statuses: any;
    readonly filters: any;
}

const StatusLabelCell = ({ row }: { readonly row: any }) => (
    <div className="flex flex-col group">
        <span className="text-[13px] leading-tight font-bold text-primary dark:text-white group-hover:translate-x-1 transition-transform inline-block">{row.label}</span>
        <span className="mt-1 font-mono text-[9px] font-semibold tracking-[0.2em] text-primary/30 uppercase dark:text-white/30">
            {row.code}
        </span>
    </div>
);

const VisualPreviewCell = ({ row }: { readonly row: any }) => (
    <div className="flex items-center">
        <div 
            className="px-3 py-1 rounded-lg border border-primary/5 text-[10px] font-bold tracking-widest uppercase shadow-sm"
            style={{ color: row.color, backgroundColor: row.bg_color || 'transparent' }}
        >
            {row.label}
        </div>
    </div>
);

const ConfigBadge = ({ active, label, activeIcon: ActiveIcon, inactiveIcon: InactiveIcon }: { active: boolean, label: string, activeIcon: any, inactiveIcon: any }) => (
    <div className={cn(
        "flex items-center gap-2 px-2 py-1 rounded-md border text-[9px] font-semibold tracking-widest uppercase transition-all",
        active 
            ? "bg-primary/5 border-primary/10 text-primary dark:bg-white/5 dark:border-white/10 dark:text-white" 
            : "bg-transparent border-transparent text-primary/20 dark:text-white/20"
    )}>
        {active ? <ActiveIcon size={10} /> : <InactiveIcon size={10} />}
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
                    <div className="flex items-center gap-3">
                        <ConfigBadge 
                            active={row.display_mode === 'pdf'} 
                            label="PDF" 
                            activeIcon={FileText} 
                            inactiveIcon={LayoutTemplate} 
                        />
                        <ConfigBadge 
                            active={row.allow_info_edit} 
                            label="Edit" 
                            activeIcon={Unlock} 
                            inactiveIcon={Lock} 
                        />
                        <ConfigBadge 
                            active={row.allow_reference} 
                            label="Ref" 
                            activeIcon={Link2} 
                            inactiveIcon={Link2} 
                        />
                    </div>
                ),
            },
            {
                header: 'Status',
                accessorKey: 'is_active',
                className: 'text-right',
                cell: (row) => (
                    <div className="flex items-center justify-end gap-2">
                        <div className={cn('h-1.5 w-1.5 rounded-full', row.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-primary/10 dark:bg-white/10')} />
                        <span className={cn('text-[9px] font-bold tracking-widest uppercase', row.is_active ? 'text-primary dark:text-white' : 'text-primary/20 dark:text-white/20')}>
                            {row.is_active ? 'Online' : 'Offline'}
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
                subtitle={isEdit ? `Mengelola perilaku sistem dan visualisasi audit untuk status ${form.data.label}` : 'Mendefinisikan entitas status baru dalam alur kerja manajemen kontrak'}
                onClose={() => {
                    setIsEditorOpen(false);
                    setEditingStatus(null);
                }}
                onSave={handleSubmit}
                processing={form.processing}
                isDirty={form.isDirty}
                isEdit={isEdit}
            >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 space-y-12">
                        {/* Section 1: Dasar */}
                        <FormSection 
                            title="Arsitektur Identitas" 
                            subtitle="Parameter dasar yang mendefinisikan status dalam database"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <CompactInput 
                                    label="Kode Sistem (Unique)"
                                    value={form.data.code}
                                    onChange={e => form.setData('code', e.target.value)}
                                    placeholder="CONTOH: DRAFT / APPROVED"
                                    icon={Tags}
                                />
                                <CompactInput 
                                    label="Label Visual"
                                    value={form.data.label}
                                    onChange={e => form.setData('label', e.target.value)}
                                    placeholder="NAMA STATUS YANG MUNCUL DI UI"
                                />
                                <div className="md:col-span-2">
                                    <CompactInput 
                                        label="Deskripsi Fungsional"
                                        value={form.data.description}
                                        onChange={e => form.setData('description', e.target.value)}
                                        placeholder="Jelaskan peran status ini dalam alur bisnis..."
                                    />
                                </div>
                            </div>
                        </FormSection>

                        {/* Section 2: Visuals */}
                        <FormSection 
                            title="Skema Warna & Tipografi" 
                            subtitle="Pengaturan visual untuk badge dan audit trail"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-primary/40 dark:text-white/40 ml-1">Warna Teks</label>
                                    <div className="flex items-center gap-3 p-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02]">
                                        <input 
                                            type="color" 
                                            value={form.data.color}
                                            onChange={e => form.setData('color', e.target.value)}
                                            className="h-8 w-12 rounded-lg bg-transparent border-none cursor-pointer"
                                        />
                                        <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-primary dark:text-white">{form.data.color}</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-primary/40 dark:text-white/40 ml-1">Warna Latar</label>
                                    <div className="flex items-center gap-3 p-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02]">
                                        <input 
                                            type="color" 
                                            value={form.data.bg_color}
                                            onChange={e => form.setData('bg_color', e.target.value)}
                                            className="h-8 w-12 rounded-lg bg-transparent border-none cursor-pointer"
                                        />
                                        <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-primary dark:text-white">{form.data.bg_color}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-primary/10 dark:border-white/10 bg-primary/[0.01] dark:bg-white/[0.01]">
                                    <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-primary/20 dark:text-white/20 mb-4">Live Badge Preview</span>
                                    <div 
                                        className="px-6 py-2 rounded-xl text-[11px] font-bold tracking-widest uppercase shadow-xl border border-white/10"
                                        style={{ color: form.data.color, backgroundColor: form.data.bg_color }}
                                    >
                                        {form.data.label || 'PREVIEW'}
                                    </div>
                                </div>
                            </div>
                        </FormSection>
                    </div>

                    <div className="lg:col-span-4 space-y-10">
                        <div className="sticky top-6 space-y-10">
                            {/* Mode Tampilan Widget */}
                            <div className="rounded-2xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] p-8">
                                <h3 className="text-[10px] font-bold tracking-[0.3em] text-primary dark:text-white uppercase mb-6 flex items-center gap-2">
                                    <LayoutTemplate size={14} /> Render Strategy
                                </h3>

                                <div className="space-y-4">
                                    {[
                                        { id: 'interactive', label: 'Interactive Form', desc: 'React component rendering for fast editing.', icon: LayoutTemplate },
                                        { id: 'pdf', label: 'PDF Preview', desc: 'Direct server-side PDF render for print accuracy.', icon: FileText }
                                    ].map(mode => (
                                        <button
                                            key={mode.id}
                                            type="button"
                                            onClick={() => form.setData('display_mode', mode.id as any)}
                                            className={cn(
                                                "w-full flex items-start gap-4 p-4 rounded-xl border transition-all text-left group",
                                                form.data.display_mode === mode.id
                                                    ? "bg-primary border-primary text-white dark:bg-white dark:border-white dark:text-black shadow-lg"
                                                    : "bg-white dark:bg-black/40 border-primary/10 dark:border-white/10 text-primary dark:text-white hover:border-primary dark:hover:border-white"
                                            )}
                                        >
                                            <div className={cn(
                                                "p-2 rounded-lg transition-colors",
                                                form.data.display_mode === mode.id ? "bg-white/20 dark:bg-black/10" : "bg-primary/5 dark:bg-white/5"
                                            )}>
                                                <mode.icon size={16} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-bold uppercase tracking-wider">{mode.label}</span>
                                                <span className={cn(
                                                    "text-[9px] font-bold leading-tight mt-1 opacity-60",
                                                )}>
                                                    {mode.desc}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Operational Controls */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-bold tracking-[0.3em] text-primary dark:text-white uppercase px-1">Behavior Control</h3>
                                <div className="space-y-3">
                                    {[
                                        { id: 'allow_info_edit', label: 'Allow Info Edit', desc: 'User can modify metadata in this status.', icon: Unlock },
                                        { id: 'allow_reference', label: 'Allow Reference', desc: 'Contracts can link to this status as parent.', icon: Link2 },
                                        { id: 'is_active', label: 'Status Is Online', desc: 'Make this status available for selection.', icon: ShieldCheck }
                                    ].map(ctrl => (
                                        <div 
                                            key={ctrl.id}
                                            onClick={() => form.setData(ctrl.id as any, !form.data[ctrl.id as keyof typeof form.data])}
                                            className="flex items-center gap-4 p-4 rounded-xl bg-primary/[0.03] dark:bg-white/[0.03] border border-primary/10 dark:border-white/10 cursor-pointer group hover:bg-primary/[0.05] dark:hover:bg-white/[0.05] transition-colors"
                                        >
                                            <Checkbox 
                                                id={ctrl.id}
                                                checked={!!form.data[ctrl.id as keyof typeof form.data]}
                                                onCheckedChange={() => {}} // Handled by div
                                                className="h-5 w-5"
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-primary dark:text-white">{ctrl.label}</span>
                                                <span className="text-[8px] font-bold text-primary/30 dark:text-white/30 uppercase mt-0.5">{ctrl.desc}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex gap-4">
                                <AlertCircle size={16} className="text-amber-500 shrink-0 mt-1" />
                                <p className="text-[9px] font-bold text-amber-600 dark:text-amber-400 leading-relaxed uppercase tracking-wider">
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
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <TableMasterData
                title="Manajemen Parameter Status"
                borderless={true}
                data={statuses?.data || []}
                columns={columns}
                onRowClick={openEdit}
                searchPlaceholder="Cari status, kode, atau deskripsi..."
                searchValue={filters?.search || ''}
                onSearchChange={(v: string) => router.get(globalThis.location.pathname, { ...filters, search: v, page: 1 }, { preserveState: true, replace: true })}
                headerActions={
                    <Button 
                        variant="white" 
                        onClick={openCreate} 
                        className="h-10 px-6 rounded-xl gap-2 text-xs font-bold transition-all duration-200 border border-border/40 bg-card text-foreground shadow-sm hover:bg-muted/60 hover:border-border/60 hover:shadow-md active:scale-95"
                    >
                        <Plus size={14} /> Registrasi Status Baru
                    </Button>
                }
                pagination={statuses?.meta ? {
                    currentPage: statuses.meta.current_page || 1,
                    lastPage: statuses.meta.last_page || 1,
                    total: statuses.meta.total || 0,
                    onPageChange: (page: number) => router.get(globalThis.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                } : undefined}
            />
        </div>
    );
}
