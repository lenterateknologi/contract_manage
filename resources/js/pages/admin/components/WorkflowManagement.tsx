import { Button } from '@/components/ui/buttons/Button';
import { useToast } from '@/components/ui/feedback/Toast';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { AppIcon, Icons } from '@/components/ui';

const {
    CheckCircle2,
    Copy,
    Eye,
    EyeOff,
    GitBranch,
    Layers,
    Plus,
    ShieldCheck,
    Star,
    Tag,
    Trash2,
    UserCircle,
    Users,
    XCircle,
    Workflow: WorkflowIcon,
    ArrowRight,
    UserCheck,
    FileSignature,
    Sparkles,
    Shield,
    X,
} = Icons;
import { PageTable } from '@/components/ui/navigation/PageTable';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialogs/Dialog';
import React, { useMemo, useState } from 'react';

interface WorkflowManagementProps {
    readonly workflows: any;
    readonly contractTypes: any[];
    readonly filters: any;
}

const INITIATOR_LABELS: Record<string, string> = {
    all: 'Seluruh Staff',
    department: 'Per Departemen',
    role: 'Per Jabatan',
    user: 'Spesifik User',
};

export function WorkflowManagement({ workflows, contractTypes, filters }: Readonly<WorkflowManagementProps>) {
    const { showToast } = useToast();
    const { canCreate, canDelete } = usePermissions('ADMIN_WORKFLOWS');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState(filters.search || '');

    const filterCategories = useMemo(() => {
        return [
            {
                key: 'contract_type_id',
                label: 'Tipe Pengajuan',
                type: 'searchable' as const,
                options: (contractTypes || []).map((ct: any) => ({
                    label: ct.name,
                    value: String(ct.id),
                })),
                placeholder: 'Semua Tipe Pengajuan',
            },
            {
                key: 'workflow_type',
                label: 'Jenis Alur Kerja',
                type: 'multiselect' as const,
                options: [
                    { label: 'Master Workflow', value: 'main' },
                    { label: 'Sub-Workflow', value: 'sub_workflow' },
                    { label: 'Standalone', value: 'standalone' },
                ],
            },
            {
                key: 'is_default',
                label: 'Status Default',
                type: 'multiselect' as const,
                options: [
                    { label: 'Ya (Default)', value: 'true' },
                    { label: 'Tidak (Bukan Default)', value: 'false' },
                ],
            },
            {
                key: 'is_selectable',
                label: 'Tampil di Pilihan Opsi',
                type: 'multiselect' as const,
                options: [
                    { label: 'Tampil (Ya)', value: 'true' },
                    { label: 'Sembunyi (Tidak)', value: 'false' },
                ],
            },
            {
                key: 'is_active',
                label: 'Status Keaktifan',
                type: 'multiselect' as const,
                options: [
                    { label: 'Aktif', value: 'true' },
                    { label: 'Nonaktif', value: 'false' },
                ],
            },
        ];
    }, [contractTypes]);

    const activeFilters = useMemo(() => {
        const active: Record<string, any> = {};
        if (filters.contract_type_id) active.contract_type_id = Array.isArray(filters.contract_type_id) ? filters.contract_type_id : [filters.contract_type_id];
        if (filters.workflow_type) active.workflow_type = Array.isArray(filters.workflow_type) ? filters.workflow_type : [filters.workflow_type];
        if (filters.is_default !== undefined) active.is_default = Array.isArray(filters.is_default) ? filters.is_default : [String(filters.is_default)];
        if (filters.is_selectable !== undefined) active.is_selectable = Array.isArray(filters.is_selectable) ? filters.is_selectable : [String(filters.is_selectable)];
        if (filters.is_active !== undefined) active.is_active = Array.isArray(filters.is_active) ? filters.is_active : [String(filters.is_active)];
        return active;
    }, [filters]);

    const handleFilterChange = (keyOrObj: string | Record<string, any>, value?: any) => {
        const nextFilters = { ...filters };
        if (typeof keyOrObj === 'string') {
            if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
                delete nextFilters[keyOrObj];
            } else {
                nextFilters[keyOrObj] = value;
            }
        } else {
            Object.entries(keyOrObj).forEach(([k, v]) => {
                if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) {
                    delete nextFilters[k];
                } else {
                    nextFilters[k] = v;
                }
            });
        }
        nextFilters.page = 1;

        router.get(
            globalThis.location.pathname,
            nextFilters,
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleResetFilters = () => {
        router.get(
            globalThis.location.pathname,
            { per_page: filters.per_page || 15 },
            { preserveState: true, preserveScroll: true }
        );
    };

    const rows: any[] = workflows.data || [];

    // Group workflows by contract_type_name (parent/first item only)
    const grouped = useMemo(() => {
        const map = new Map<string, any[]>();
        rows.forEach((w) => {
            const key = w.contract_type_name
                ? w.contract_type_name.split(',')[0].trim()
                : 'Global / Semua Tipe';
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(w);
        });
        return map;
    }, [rows]);

    const openEdit = (w: any) => router.visit(route('admin.workflows.edit', w.id));
    const openCreate = () => router.visit(route('admin.workflows.create'));

    const [previewWorkflow, setPreviewWorkflow] = useState<any | null>(null);
    const [togglingKey, setTogglingKey] = useState<string | null>(null);

    const openPreview = (w: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setPreviewWorkflow(w);
    };

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleToggle = (
        id: string,
        field: 'is_default' | 'is_selectable' | 'is_active',
        currentValue: boolean,
        e: React.MouseEvent,
    ) => {
        e.stopPropagation();
        const nextVal = !currentValue;
        const key = `${id}-${field}`;
        setTogglingKey(key);

        router.patch(
            route('admin.workflows.toggle', id),
            { field, value: nextVal },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    const label = field === 'is_default' ? 'Default' : field === 'is_selectable' ? 'Tampil' : 'Status Aktif';
                    showToast(`Status ${label} berhasil diperbarui`, 'success');
                },
                onError: (errors: any) => {
                    showToast(errors?.error || 'Gagal memperbarui status', 'error');
                },
                onFinish: () => {
                    setTogglingKey(null);
                },
            },
        );
    };

    const handleBulkDelete = () => {
        const ids = [...selectedIds];
        if (!ids.length) return;
        if (confirm(`Hapus ${ids.length} alur kerja terpilih?`)) {
            router.post(
                route('admin.workflows.bulk-destroy'),
                { ids },
                {
                    onSuccess: () => {
                        showToast(`${ids.length} alur kerja dihapus`, 'success');
                        setSelectedIds(new Set());
                    },
                },
            );
        }
    };

    return (
        <PageTable
            title="Manajemen Alur Kerja"
            subtitle={`Konfigurasi tahapan persetujuan alur kerja (workflow) pengajuan kontrak (${workflows.total || 0} alur)`}
            icon={GitBranch}
            searchValue={search}
            onSearchChange={(v) => {
                setSearch(v);
                router.get(
                    globalThis.location.pathname,
                    { ...filters, search: v, page: 1 },
                    { preserveState: true, replace: true },
                );
            }}
            searchPlaceholder="Cari alur kerja..."
            filters={filterCategories}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            totalResults={workflows.total || 0}
            actions={
                <div className="flex items-center gap-2">
                    {selectedIds.size > 0 && (
                        <Button
                            onClick={handleBulkDelete}
                            variant="destructive"
                            className="gap-2"
                        >
                            <Trash2 size={14} />
                            Hapus {selectedIds.size} Terpilih
                        </Button>
                    )}
                    <Button
                        onClick={openCreate}
                        variant="primary"
                        className="gap-2"
                    >
                        <Plus size={14} />
                        Tambah Alur
                    </Button>
                </div>
            }
            pagination={{
                currentPage: workflows.current_page || 1,
                lastPage: workflows.last_page || 1,
                total: workflows.total || 0,
                from: workflows.from,
                to: workflows.to,
                perPage: workflows.per_page,
                onPageChange: (page) =>
                    router.get(
                        globalThis.location.pathname,
                        { ...filters, page },
                        { preserveState: true, preserveScroll: true }
                    ),
                onPerPageChange: (perPage) =>
                    router.get(
                        globalThis.location.pathname,
                        { ...filters, page: 1, per_page: perPage },
                        { preserveState: true, preserveScroll: true }
                    )
            }}
        >
            <div className="flex-1 min-h-0 w-full overflow-auto">
                <table className="w-full text-xs">
                    <thead className="bg-primary text-white dark:bg-zinc-800/90 select-none sticky top-0 z-10">
                    <tr className="border-b border-primary/20 dark:border-zinc-700/80 bg-primary text-white dark:bg-zinc-800/90 select-none">
                        <th className="w-10 px-4 py-3 bg-primary dark:bg-zinc-800/90 text-white">
                            <input
                                type="checkbox"
                                className="h-3.5 w-3.5 rounded border-white/50 text-primary focus:ring-0"
                                checked={selectedIds.size === rows.length && rows.length > 0}
                                onChange={(e) => {
                                    if (e.target.checked) setSelectedIds(new Set(rows.map((r) => r.id)));
                                    else setSelectedIds(new Set());
                                }}
                            />
                        </th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase text-white dark:text-zinc-200 bg-primary dark:bg-zinc-800/90">
                            <div className="flex items-center gap-1.5">
                                <GitBranch size={13} /> Identitas Alur
                            </div>
                        </th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase text-white dark:text-zinc-200 bg-primary dark:bg-zinc-800/90">
                            <div className="flex items-center gap-1.5">
                                <Layers size={13} /> Tahapan
                            </div>
                        </th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase text-white dark:text-zinc-200 bg-primary dark:bg-zinc-800/90">
                            <div className="flex items-center gap-1.5">
                                <Tag size={13} /> Tipe Pengajuan
                            </div>
                        </th>
                        <th className="px-4 py-3 text-right text-[11px] font-bold uppercase text-white dark:text-zinc-200 bg-primary dark:bg-zinc-800/90">
                            <div className="flex items-center justify-end gap-1.5">
                                <Users size={13} /> Akses Inisiator
                            </div>
                        </th>
                        <th className="px-4 py-3 text-center text-[11px] font-bold uppercase text-white dark:text-zinc-200 bg-primary dark:bg-zinc-800/90">
                            <div className="flex items-center justify-center gap-1.5">
                                <Star size={13} /> Default
                            </div>
                        </th>
                        <th className="px-4 py-3 text-center text-[11px] font-bold uppercase text-white dark:text-zinc-200 bg-primary dark:bg-zinc-800/90">
                            <div className="flex items-center justify-center gap-1.5">
                                <Eye size={13} /> Tampil
                            </div>
                        </th>
                        <th className="px-4 py-3 text-center text-[11px] font-bold uppercase text-white dark:text-zinc-200 bg-primary dark:bg-zinc-800/90">
                            <div className="flex items-center justify-center gap-1.5">
                                <ShieldCheck size={13} /> Status
                            </div>
                        </th>
                        <th className="w-28 px-4 py-3 text-right text-[11px] font-bold uppercase text-white dark:text-zinc-200 bg-primary dark:bg-zinc-800/90">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                    {grouped.size === 0 ? (
                        <tr>
                            <td colSpan={9} className="py-16 text-center text-muted-foreground">
                                <GitBranch size={24} className="mx-auto mb-2 opacity-30" />
                                <p>Belum ada alur kerja terdaftar</p>
                            </td>
                        </tr>
                    ) : (
                        [...grouped.entries()].map(([typeName, items]) => (
                            <React.Fragment key={`group-${typeName}`}>
                                {/* Category sub-header row */}
                                <tr className="bg-muted/20 border-t border-border/50">
                                    <td colSpan={9} className="px-4 py-2">
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                                            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                                {typeName}
                                            </span>
                                            <span className="ml-1 rounded-md border border-border bg-background px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                                                {items.length} alur
                                            </span>
                                        </div>
                                    </td>
                                </tr>

                                {/* Workflow rows */}
                                {items.map((row) => (
                                    <tr
                                        key={row.id}
                                        onClick={() => openEdit(row)}
                                        className="cursor-pointer bg-card transition-colors hover:bg-muted/20"
                                    >
                                        {/* Checkbox */}
                                        <td
                                            className="px-4 py-3"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleSelect(row.id);
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                className="h-3.5 w-3.5 rounded border-border"
                                                checked={selectedIds.has(row.id)}
                                                onChange={() => toggleSelect(row.id)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </td>

                                        {/* Name */}
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-0.5 pl-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-foreground">{row.name}</span>
                                                    {row.workflow_type === 'main' && (
                                                        <span className="rounded border border-blue-200 bg-blue-50 dark:bg-blue-950/40 dark:border-blue-800 px-1.5 py-0.5 text-[9px] font-bold uppercase text-blue-700 dark:text-blue-300">
                                                            MASTER
                                                        </span>
                                                    )}
                                                    {row.workflow_type === 'sub_workflow' && (
                                                        <span className="rounded border border-purple-200 bg-purple-50 dark:bg-purple-950/40 dark:border-purple-800 px-1.5 py-0.5 text-[9px] font-bold uppercase text-purple-700 dark:text-purple-300">
                                                            SUB-WF
                                                        </span>
                                                    )}
                                                    {row.is_default && (
                                                        <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-emerald-700">
                                                            DEFAULT
                                                        </span>
                                                    )}
                                                </div>
                                                {row.description && (
                                                    <span className="text-[10px] text-muted-foreground line-clamp-1 max-w-[280px]">
                                                        {row.description}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Steps */}
                                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                type="button"
                                                onClick={(e) => openPreview(row, e)}
                                                title="Klik untuk melihat pratinjau tahapan alur kerja"
                                                className="group inline-flex items-center gap-2 rounded-lg border border-transparent p-1 -m-1 transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-2xs cursor-pointer focus:outline-none"
                                            >
                                                <div className="flex -space-x-1.5">
                                                    {[...Array(Math.min(row.steps_count || 0, 4))].map((_, i) => (
                                                        <div
                                                            key={i}
                                                            className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-primary/10 group-hover:bg-primary/20 transition-colors"
                                                        >
                                                            <CheckCircle2 size={9} className="text-primary" />
                                                        </div>
                                                    ))}
                                                    {(row.steps_count || 0) > 4 && (
                                                        <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-muted text-[8px] font-bold text-muted-foreground group-hover:bg-muted/80">
                                                            +{(row.steps_count || 0) - 4}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-[11px] font-medium text-foreground group-hover:text-primary group-hover:underline flex items-center gap-1">
                                                    {row.steps_count || 0} Tahap
                                                    <Eye size={11} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                                </span>
                                            </button>
                                        </td>

                                        {/* Submission type */}
                                        <td className="px-4 py-3">
                                            {(() => {
                                                const types = row.contract_type_name
                                                    ? row.contract_type_name.split(',').map((s: string) => s.trim())
                                                    : [];
                                                if (types.length === 0) {
                                                    return (
                                                        <span className="inline-flex items-center rounded-md border border-border bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground">
                                                            —
                                                        </span>
                                                    );
                                                }
                                                const visibleTypes = types.slice(0, 1);
                                                const hasMore = types.length > 1;
                                                return (
                                                    <div className="flex flex-wrap gap-1 items-center">
                                                        {visibleTypes.map((t: string, idx: number) => (
                                                            <span key={idx} className="inline-flex items-center rounded-md border border-border bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground" title={types.join(', ')}>
                                                                {t}
                                                            </span>
                                                        ))}
                                                        {hasMore && (
                                                            <span className="inline-flex items-center rounded-md border border-primary/20 bg-primary/5 px-1.5 py-0.5 text-[10px] font-medium text-primary" title={types.slice(1).join(', ')}>
                                                                +{types.length - 1}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </td>

                                        {/* User Count (Akses Inisiator) */}
                                        <td className="px-4 py-3 text-right">
                                            <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground tabular-nums">
                                                <Users size={11} className="text-muted-foreground" />
                                                {(row.users_count ?? 0).toLocaleString()} User
                                            </span>
                                        </td>

                                        {/* Default */}
                                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                type="button"
                                                onClick={(e) => handleToggle(row.id, 'is_default', !!row.is_default, e)}
                                                disabled={togglingKey === `${row.id}-is_default`}
                                                title={row.is_default ? 'Klik untuk membatalkan status alur default' : 'Klik untuk jadikan alur default'}
                                                className="group inline-flex items-center cursor-pointer transition-all hover:scale-105 active:scale-95 focus:outline-none disabled:opacity-50"
                                            >
                                                {row.is_default ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 shadow-2xs group-hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:group-hover:bg-emerald-900/60">
                                                        <CheckCircle2 size={10} /> Ya
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground group-hover:border-primary/30 group-hover:bg-muted group-hover:text-foreground">
                                                        —
                                                    </span>
                                                )}
                                            </button>
                                        </td>

                                        {/* Tampil (is_selectable) */}
                                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                type="button"
                                                onClick={(e) => handleToggle(row.id, 'is_selectable', !!row.is_selectable, e)}
                                                disabled={togglingKey === `${row.id}-is_selectable`}
                                                title={row.is_selectable ? 'Klik untuk sembunyikan dari opsi pilihan' : 'Klik untuk tampilkan pada opsi pilihan'}
                                                className="group inline-flex items-center cursor-pointer transition-all hover:scale-105 active:scale-95 focus:outline-none disabled:opacity-50"
                                            >
                                                {row.is_selectable ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 shadow-2xs group-hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:group-hover:bg-emerald-900/60">
                                                        <Eye size={10} /> Ya
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 group-hover:bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400 dark:group-hover:bg-zinc-800">
                                                        <EyeOff size={10} /> Tidak
                                                    </span>
                                                )}
                                            </button>
                                        </td>

                                        {/* Status Aktif (is_active) */}
                                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                type="button"
                                                onClick={(e) => handleToggle(row.id, 'is_active', row.is_active !== false, e)}
                                                disabled={togglingKey === `${row.id}-is_active`}
                                                title={row.is_active !== false ? 'Klik untuk nonaktifkan alur kerja' : 'Klik untuk aktifkan alur kerja'}
                                                className="group inline-flex items-center cursor-pointer transition-all hover:scale-105 active:scale-95 focus:outline-none disabled:opacity-50"
                                            >
                                                {row.is_active !== false ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 shadow-2xs group-hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:group-hover:bg-emerald-900/60">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Aktif
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700 group-hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300 dark:group-hover:bg-rose-900/60">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Nonaktif
                                                    </span>
                                                )}
                                            </button>
                                        </td>

                                        {/* Row Actions */}
                                        <td
                                            className="px-4 py-3"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={(e) => openPreview(row, e)}
                                                    title="Pratinjau Tahapan (Preview Steps)"
                                                    className="flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-primary transition-all hover:border-primary/30 hover:bg-primary/10"
                                                >
                                                    <Eye size={13} />
                                                </button>
                                                <button
                                                    onClick={() => openEdit(row)}
                                                    title="Konfigurasi"
                                                    className="flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-all hover:border-border hover:bg-muted/50 hover:text-foreground"
                                                >
                                                    <GitBranch size={13} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (confirm('Duplikasi alur kerja ini?')) {
                                                            router.post(
                                                                route('admin.workflows.duplicate', row.id),
                                                                {},
                                                                { onSuccess: () => showToast('Alur kerja berhasil diduplikasi', 'success') },
                                                            );
                                                        }
                                                    }}
                                                    title="Duplikat"
                                                    className="flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-all hover:border-border hover:bg-muted/50 hover:text-foreground"
                                                >
                                                    <Copy size={13} />
                                                </button>
                                                {canDelete && (
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Hapus alur kerja ini?')) {
                                                                router.delete(route('admin.workflows.destroy', row.id), {
                                                                    onSuccess: () => showToast('Alur kerja dihapus', 'success'),
                                                                });
                                                            }
                                                        }}
                                                        title="Hapus"
                                                        className="flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))
                    )}
                </tbody>
                </table>
            </div>

            {/* Modal Dialog Preview Tahapan Alur Kerja */}
            <Dialog open={!!previewWorkflow} onOpenChange={(open) => !open && setPreviewWorkflow(null)}>
                <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-border bg-muted/20 dark:bg-zinc-900 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                                <GitBranch size={20} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <DialogTitle className="text-base font-bold text-foreground">
                                        {previewWorkflow?.name || 'Pratinjau Alur Kerja'}
                                    </DialogTitle>
                                    {previewWorkflow?.workflow_type === 'main' && (
                                        <span className="rounded border border-blue-200 bg-blue-50 dark:bg-blue-950/40 dark:border-blue-800 px-1.5 py-0.5 text-[9px] font-bold uppercase text-blue-700 dark:text-blue-300">
                                            MASTER
                                        </span>
                                    )}
                                    {previewWorkflow?.workflow_type === 'sub_workflow' && (
                                        <span className="rounded border border-purple-200 bg-purple-50 dark:bg-purple-950/40 dark:border-purple-800 px-1.5 py-0.5 text-[9px] font-bold uppercase text-purple-700 dark:text-purple-300">
                                            SUB-WF
                                        </span>
                                    )}
                                </div>
                                <DialogDescription className="text-xs text-muted-foreground mt-0.5 flex items-center flex-wrap gap-2">
                                    {/* Tipe Kontrak */}
                                    {(() => {
                                        const types = previewWorkflow?.contract_type_name
                                            ? previewWorkflow.contract_type_name.split(',').map((s: string) => s.trim()).filter(Boolean)
                                            : [];
                                        const firstType = types[0] || 'Global / Semua Tipe';
                                        const remainingTypes = types.length - 1;

                                        return (
                                            <span className="inline-flex items-center gap-1">
                                                Tipe:{' '}
                                                <strong className="text-foreground" title={types.join(', ')}>
                                                    {firstType}
                                                </strong>
                                                {remainingTypes > 0 && (
                                                    <span
                                                        className="rounded-md border border-primary/20 bg-primary/10 px-1 py-0.2 text-[9px] font-semibold text-primary cursor-help"
                                                        title={types.slice(1).join(', ')}
                                                    >
                                                        +{remainingTypes}
                                                    </span>
                                                )}
                                            </span>
                                        );
                                    })()}
                                    <span>•</span>
                                    {/* Inisiator / Otoritas */}
                                    {(() => {
                                        const summary = previewWorkflow?.initiator_summary || 'Semua Staff';
                                        const items = summary.split('|').map((s: string) => s.trim()).filter(Boolean);
                                        const firstItem = items[0] || 'Semua Staff';
                                        const remainingItems = items.length - 1;

                                        return (
                                            <span className="inline-flex items-center gap-1">
                                                Inisiator:{' '}
                                                <strong className="text-foreground" title={summary}>
                                                    {firstItem}
                                                </strong>
                                                {remainingItems > 0 && (
                                                    <span
                                                        className="rounded-md border border-primary/20 bg-primary/10 px-1 py-0.2 text-[9px] font-semibold text-primary cursor-help"
                                                        title={items.slice(1).join(' | ')}
                                                    >
                                                        +{remainingItems}
                                                    </span>
                                                )}
                                            </span>
                                        );
                                    })()}
                                    <span>•</span>
                                    <span>Total: <strong className="text-foreground">{(previewWorkflow?.steps || []).length} Tahapan</strong></span>
                                </DialogDescription>
                            </div>
                        </div>
                    </div>

                    {/* Body: Step List Timeline */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[60vh]">
                        {previewWorkflow && (!previewWorkflow.steps || previewWorkflow.steps.length === 0) ? (
                            <div className="py-12 text-center text-muted-foreground">
                                <Layers size={32} className="mx-auto mb-2 opacity-30" />
                                <p className="text-sm font-medium">Alur kerja ini belum memiliki konfigurasi tahapan.</p>
                                <p className="text-xs text-muted-foreground mt-1">Buka halaman edit untuk menambahkan tahapan approval.</p>
                            </div>
                        ) : (
                            <div className="relative pl-6 space-y-4 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-border/60">
                                {(previewWorkflow?.steps || []).map((step: any, index: number) => {
                                    const stepAuthorities = step.approver_authorities || step.approverAuthorities || [];
                                    const actions = step.actions || [];
                                    const isFirst = index === 0;
                                    const isLast = index === (previewWorkflow.steps.length - 1);

                                    return (
                                        <div key={step.id || index} className="relative group">
                                            {/* Step Circle Indicator */}
                                            <div className="absolute -left-6 top-2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border-2 border-background bg-primary text-[10px] font-bold text-white shadow-xs">
                                                {step.step || index + 1}
                                            </div>

                                            {/* Step Card */}
                                            <div className="rounded-xl border border-border/70 bg-card p-4 shadow-2xs hover:border-primary/40 transition-colors">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h4 className="text-sm font-semibold text-foreground">
                                                                {step.label || step.description || `Tahap ${step.step || index + 1}`}
                                                            </h4>
                                                            {step.is_optional && (
                                                                <span className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 text-[9px] font-medium text-amber-700 dark:text-amber-400">
                                                                    Opsional
                                                                </span>
                                                            )}
                                                            {step.approver_type && (
                                                                <span className="rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground capitalize">
                                                                    Tipe: {step.approver_type.replace('_', ' ')}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {step.description && step.description !== step.label && (
                                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                                {step.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Authorities / Aktor yang berhak */}
                                                <div className="mt-3 pt-3 border-t border-border/50 flex flex-col gap-2">
                                                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                                                        <UserCheck size={12} className="text-primary" />
                                                        <span>Aktor / Otoritas Persetujuan:</span>
                                                    </div>

                                                    {stepAuthorities.length === 0 ? (
                                                        <div className="text-[11px] text-muted-foreground italic pl-4">
                                                            {step.approver_type === 'initiator' ? 'Inisiator Pengajuan' :
                                                             step.approver_type === 'assigned_pic' ? 'PIC Legal yang Ditugaskan' :
                                                             step.approver_type === 'atasan' ? 'Atasan Langsung Inisiator' :
                                                             'Mengikuti konfigurasi default sistem'}
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-1.5 pl-4">
                                                            {stepAuthorities.map((auth: any, aIdx: number) => {
                                                                const roleName = auth.role?.name || auth.role_id;
                                                                const deptName = auth.department?.name || auth.department_id;
                                                                const divName = auth.division?.name || auth.division_id;
                                                                const userName = auth.user?.name || auth.user_id;

                                                                const parts = [];
                                                                if (roleName) parts.push(`Role: ${roleName}`);
                                                                if (deptName) parts.push(`Dept: ${deptName}`);
                                                                if (divName) parts.push(`Div: ${divName}`);
                                                                if (userName) parts.push(`User: ${userName}`);
                                                                if (auth.authority_type && auth.authority_type !== 'group' && auth.authority_type !== 'role') {
                                                                    parts.push(auth.authority_type);
                                                                }

                                                                return (
                                                                    <span
                                                                        key={auth.id || aIdx}
                                                                        className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-foreground"
                                                                    >
                                                                        <Shield size={10} className="text-primary" />
                                                                        {parts.join(' • ') || 'Otoritas Khusus'}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions / Tombol Aksi */}
                                                {actions.length > 0 && (
                                                    <div className="mt-2.5 pt-2.5 border-t border-border/40 flex items-center gap-1.5 flex-wrap">
                                                        <span className="text-[10px] text-muted-foreground mr-1">Aksi Tersedia:</span>
                                                        {actions.map((act: any, actIdx: number) => {
                                                            const isApprove = act.action_code === 'approve';
                                                            const isReject = act.action_code === 'reject';
                                                            const label = act.alias || act.master_action_name || act.action_code || 'Aksi';

                                                            return (
                                                                <span
                                                                    key={act.id || actIdx}
                                                                    className={cn(
                                                                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold",
                                                                        isApprove && "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
                                                                        isReject && "border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
                                                                        !isApprove && !isReject && "border border-border bg-muted text-muted-foreground"
                                                                    )}
                                                                >
                                                                    {isApprove && <CheckCircle2 size={9} />}
                                                                    {isReject && <XCircle size={9} />}
                                                                    {label}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-3 border-t border-border bg-muted/10 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                            Klik <strong>Buka Editor</strong> untuk mengubah konfigurasi lengkap.
                        </span>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPreviewWorkflow(null)}
                            >
                                Tutup
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                className="gap-1.5"
                                onClick={() => {
                                    if (previewWorkflow) {
                                        openEdit(previewWorkflow);
                                    }
                                }}
                            >
                                <GitBranch size={13} />
                                Buka Editor Alur
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </PageTable>
    );
}

declare let route: any;
