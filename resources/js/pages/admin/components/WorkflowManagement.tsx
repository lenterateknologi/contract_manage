import { Icons } from '@/components/ui';
import { Button } from '@/components/ui/buttons/Button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialogs/Dialog';
import { useToast } from '@/components/ui/feedback/Toast';
import { PageTable } from '@/components/ui/navigation/PageTable';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { workflowsApi } from '@/api';
import React, { useCallback, useMemo, useState } from 'react';

const { CheckCircle2, Copy, Eye, EyeOff, GitBranch, Layers, Plus, ShieldCheck, Star, Tag, Trash2, Users, XCircle, UserCheck, Shield, Loader2 } =
    Icons;

interface WorkflowManagementProps {
    readonly workflows: any;
    readonly contractTypes: any[];
    readonly filters: any;
}

function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
    return match ? decodeURIComponent(match[3]) : null;
}

export function WorkflowManagement({ workflows, contractTypes, filters }: Readonly<WorkflowManagementProps>) {
    const { showToast } = useToast();
    const { canDelete } = usePermissions('ADMIN_WORKFLOWS');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [workflowsData, setWorkflowsData] = useState<any>(workflows || { data: [], total: 0, current_page: 1, last_page: 1, per_page: 25 });
    const [currentFilters, setCurrentFilters] = useState<any>(filters || {});
    const [search, setSearch] = useState(filters.search || '');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const fetchWorkflows = useCallback(
        async (params: any) => {
            setIsLoading(true);
            try {
                const res: any = await workflowsApi.list(params);
                if (res) {
                    const dataList = res.data || (Array.isArray(res) ? res : []);
                    const pag = res.pagination || {};
                    setWorkflowsData({
                        data: dataList,
                        total: pag.total ?? (res.total || 0),
                        current_page: pag.current_page ?? (res.current_page || 1),
                        last_page: pag.last_page ?? (res.last_page || 1),
                        per_page: pag.per_page ?? (res.per_page || 25),
                        from: pag.from ?? res.from,
                        to: pag.to ?? res.to,
                    });
                }
            } catch (err: any) {
                console.error('Failed to fetch workflows:', err);
                showToast(err.response?.data?.message || 'Gagal memuat data alur kerja', 'error');
            } finally {
                setIsLoading(false);
            }
        },
        [showToast],
    );

    React.useEffect(() => {
        if (workflows) {
            setWorkflowsData(workflows);
        }
    }, [workflows]);

    React.useEffect(() => {
        // Auto-apply saved filter from cookie on initial visit if no custom filter query present in URL
        if (typeof window !== 'undefined') {
            const currentSearch = window.location.search;
            if (!currentSearch || currentSearch === '' || currentSearch === '?') {
                const storageKey = 'saved_filter_workflows';
                const raw = getCookie(storageKey) || localStorage.getItem(storageKey);
                if (raw) {
                    try {
                        const saved = JSON.parse(raw);
                        if (saved && typeof saved === 'object' && Object.keys(saved).length > 0) {
                            const newParams = { ...saved, page: 1 };
                            setCurrentFilters(newParams);
                            fetchWorkflows(newParams);
                        }
                    } catch (e) {
                        // Ignore parse errors
                    }
                }
            }
        }
    }, [fetchWorkflows]);

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
        if (currentFilters.contract_type_id)
            active.contract_type_id = Array.isArray(currentFilters.contract_type_id)
                ? currentFilters.contract_type_id
                : [currentFilters.contract_type_id];
        if (currentFilters.workflow_type)
            active.workflow_type = Array.isArray(currentFilters.workflow_type) ? currentFilters.workflow_type : [currentFilters.workflow_type];
        if (currentFilters.is_default !== undefined)
            active.is_default = Array.isArray(currentFilters.is_default) ? currentFilters.is_default : [String(currentFilters.is_default)];
        if (currentFilters.is_selectable !== undefined)
            active.is_selectable = Array.isArray(currentFilters.is_selectable)
                ? currentFilters.is_selectable
                : [String(currentFilters.is_selectable)];
        if (currentFilters.is_active !== undefined)
            active.is_active = Array.isArray(currentFilters.is_active) ? currentFilters.is_active : [String(currentFilters.is_active)];
        return active;
    }, [currentFilters]);

    const handleFilterChange = (keyOrObj: string | Record<string, any>, value?: any) => {
        const nextFilters = { ...currentFilters };
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
        setCurrentFilters(nextFilters);
        fetchWorkflows(nextFilters);
    };

    const handleResetFilters = () => {
        const resetParams = { per_page: currentFilters.per_page || 25, page: 1 };
        setCurrentFilters(resetParams);
        setSearch('');
        fetchWorkflows(resetParams);
    };

    const rows: any[] = workflowsData.data || [];

    // Group workflows by parent category (parent_contract_type_name)
    const grouped = useMemo(() => {
        const map = new Map<string, any[]>();
        rows.forEach((w) => {
            const rawKey = w.parent_contract_type_name || w.contract_type_name || 'Global / Semua Tipe';
            const key = rawKey.split(',')[0].trim();
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(w);
        });
        return map;
    }, [rows]);

    const openEdit = (w: any) => router.visit(route('admin.workflows.edit', w.id));
    const openCreate = () => router.visit(route('admin.workflows.create'));

    const [previewWorkflow, setPreviewWorkflow] = useState<any | null>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
    const [togglingKey, setTogglingKey] = useState<string | null>(null);

    const openPreview = async (w: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setPreviewWorkflow({ ...w, steps: w.steps || [] });
        setIsLoadingPreview(true);
        try {
            const res: any = await workflowsApi.preview(w.id);
            if (res) {
                setPreviewWorkflow(res?.data || res);
            }
        } catch (err) {
            console.error('Failed to load workflow preview:', err);
        } finally {
            setIsLoadingPreview(false);
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleToggle = async (id: string, field: 'is_default' | 'is_selectable' | 'is_active', currentValue: boolean, e: React.MouseEvent) => {
        e.stopPropagation();
        const nextVal = !currentValue;
        const key = `${id}-${field}`;
        setTogglingKey(key);

        try {
            const res: any = await workflowsApi.toggle(id, field, nextVal);

            if (res) {
                setWorkflowsData((prev: any) => {
                    if (!prev || !prev.data) return prev;
                    const updated = prev.data.map((item: any) => {
                        if (field === 'is_default' && nextVal) {
                            if (item.id === id) return { ...item, [field]: nextVal };
                            return { ...item, is_default: false };
                        }
                        if (item.id === id) return { ...item, [field]: nextVal };
                        return item;
                    });
                    return { ...prev, data: updated };
                });
                const label = field === 'is_default' ? 'Default' : field === 'is_selectable' ? 'Tampil' : 'Status Aktif';
                showToast(`Status ${label} berhasil diperbarui`, 'success');
            }
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Gagal memperbarui status', 'error');
        } finally {
            setTogglingKey(null);
        }
    };

    const handleBulkDelete = async () => {
        const ids = [...selectedIds];
        if (!ids.length) return;
        if (confirm(`Hapus ${ids.length} alur kerja terpilih?`)) {
            try {
                const res: any = await workflowsApi.bulkDelete(ids);
                if (res) {
                    showToast(res?.message || `${ids.length} alur kerja dihapus`, 'success');
                    setSelectedIds(new Set());
                    fetchWorkflows(currentFilters);
                }
            } catch (err: any) {
                showToast(err.response?.data?.message || 'Gagal menghapus alur kerja', 'error');
            }
        }
    };

    const handleDuplicate = async (row: any) => {
        if (confirm(`Duplikasi alur kerja "${row.name}"?`)) {
            try {
                const res: any = await workflowsApi.duplicate(row.id);
                if (res) {
                    showToast(res?.message || 'Alur kerja berhasil diduplikasi', 'success');
                    fetchWorkflows(currentFilters);
                }
            } catch (err: any) {
                showToast(err.response?.data?.message || 'Gagal menduplikasi alur kerja', 'error');
            }
        }
    };

    const handleDelete = async (row: any) => {
        if (confirm(`Hapus alur kerja "${row.name}"?`)) {
            try {
                const res: any = await workflowsApi.delete(row.id);
                if (res) {
                    showToast(res?.message || 'Alur kerja dihapus', 'success');
                    fetchWorkflows(currentFilters);
                }
            } catch (err: any) {
                showToast(err.response?.data?.message || 'Gagal menghapus alur kerja', 'error');
            }
        }
    };

    return (
        <PageTable
            title="Manajemen Alur Kerja"
            subtitle={`Konfigurasi tahapan persetujuan alur kerja (workflow) pengajuan kontrak (${workflowsData.total || 0} alur)`}
            icon={GitBranch}
            searchValue={search}
            onSearchChange={(v) => {
                setSearch(v);
                const nextParams = { ...currentFilters, search: v, page: 1 };
                setCurrentFilters(nextParams);
                fetchWorkflows(nextParams);
            }}
            searchPlaceholder="Cari alur kerja..."
            filters={filterCategories}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            totalResults={workflowsData.total || 0}
            resourceKey="workflows"
            actions={
                <div className="flex items-center gap-2">
                    {selectedIds.size > 0 && (
                        <Button onClick={handleBulkDelete} variant="destructive" className="gap-2">
                            <Trash2 size={14} />
                            Hapus {selectedIds.size} Terpilih
                        </Button>
                    )}
                    <Button onClick={openCreate} variant="primary" className="gap-2">
                        <Plus size={14} />
                        Tambah Alur
                    </Button>
                </div>
            }
            pagination={{
                currentPage: workflowsData.current_page || 1,
                lastPage: workflowsData.last_page || 1,
                total: workflowsData.total || 0,
                from: workflowsData.from,
                to: workflowsData.to,
                perPage: workflowsData.per_page,
                onPageChange: (page) => {
                    const nextParams = { ...currentFilters, page };
                    setCurrentFilters(nextParams);
                    fetchWorkflows(nextParams);
                },
                onPerPageChange: (perPage) => {
                    const nextParams = { ...currentFilters, page: 1, per_page: perPage };
                    setCurrentFilters(nextParams);
                    fetchWorkflows(nextParams);
                },
            }}
        >
            <div className="min-h-0 w-full flex-1 overflow-auto">
                <table className="w-full text-xs">
                    <thead className="bg-primary sticky top-0 z-10 text-white select-none dark:bg-zinc-800/90">
                        <tr className="border-primary/20 bg-primary border-b text-white select-none dark:border-zinc-700/80 dark:bg-zinc-800/90">
                            <th className="bg-primary w-10 px-4 py-3 text-white dark:bg-zinc-800/90">
                                <input
                                    type="checkbox"
                                    className="text-primary h-3.5 w-3.5 rounded border-white/50 focus:ring-0"
                                    checked={selectedIds.size === rows.length && rows.length > 0}
                                    onChange={(e) => {
                                        if (e.target.checked) setSelectedIds(new Set(rows.map((r) => r.id)));
                                        else setSelectedIds(new Set());
                                    }}
                                />
                            </th>
                            <th className="bg-primary px-4 py-3 text-left text-[11px] font-bold text-white uppercase dark:bg-zinc-800/90 dark:text-zinc-200">
                                <div className="flex items-center gap-1.5">
                                    <GitBranch size={13} /> Identitas Alur
                                </div>
                            </th>
                            <th className="bg-primary px-4 py-3 text-left text-[11px] font-bold text-white uppercase dark:bg-zinc-800/90 dark:text-zinc-200">
                                <div className="flex items-center gap-1.5">
                                    <Layers size={13} /> Tahapan
                                </div>
                            </th>
                            <th className="bg-primary px-4 py-3 text-left text-[11px] font-bold text-white uppercase dark:bg-zinc-800/90 dark:text-zinc-200">
                                <div className="flex items-center gap-1.5">
                                    <Tag size={13} /> Tipe Pengajuan
                                </div>
                            </th>
                            <th className="bg-primary px-4 py-3 text-left text-[11px] font-bold text-white uppercase dark:bg-zinc-800/90 dark:text-zinc-200">
                                <div className="flex items-center gap-1.5">
                                    <Users size={13} /> Target Inisiator
                                </div>
                            </th>
                            <th className="bg-primary px-4 py-3 text-center text-[11px] font-bold text-white uppercase dark:bg-zinc-800/90 dark:text-zinc-200">
                                <div className="flex items-center justify-center gap-1.5">
                                    <Star size={13} /> Default
                                </div>
                            </th>
                            <th className="bg-primary px-4 py-3 text-center text-[11px] font-bold text-white uppercase dark:bg-zinc-800/90 dark:text-zinc-200">
                                <div className="flex items-center justify-center gap-1.5">
                                    <Eye size={13} /> Tampil
                                </div>
                            </th>
                            <th className="bg-primary px-4 py-3 text-center text-[11px] font-bold text-white uppercase dark:bg-zinc-800/90 dark:text-zinc-200">
                                <div className="flex items-center justify-center gap-1.5">
                                    <ShieldCheck size={13} /> Status
                                </div>
                            </th>
                            <th className="bg-primary w-28 px-4 py-3 text-right text-[11px] font-bold text-white uppercase dark:bg-zinc-800/90 dark:text-zinc-200">
                                Aksi
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-border/40 divide-y">
                        {grouped.size === 0 ? (
                            <tr>
                                <td colSpan={9} className="text-muted-foreground py-16 text-center">
                                    <GitBranch size={24} className="mx-auto mb-2 opacity-30" />
                                    <p>Belum ada alur kerja terdaftar</p>
                                </td>
                            </tr>
                        ) : (
                            [...grouped.entries()].map(([typeName, items]) => (
                                <React.Fragment key={`group-${typeName}`}>
                                    {/* Category sub-header row */}
                                    <tr className="bg-muted/20 border-border/50 border-t">
                                        <td colSpan={9} className="px-4 py-2">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-primary/50 h-1.5 w-1.5 rounded-full" />
                                                <span className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
                                                    {typeName}
                                                </span>
                                                <span className="border-border bg-background text-muted-foreground ml-1 rounded-md border px-1.5 py-0.5 text-[9px] font-medium">
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
                                            className="bg-card hover:bg-muted/20 cursor-pointer transition-colors"
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
                                                    className="border-border h-3.5 w-3.5 rounded"
                                                    checked={selectedIds.has(row.id)}
                                                    onChange={() => toggleSelect(row.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </td>

                                            {/* Name */}
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-0.5 pl-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-foreground font-medium">{row.name}</span>
                                                        {row.workflow_type === 'main' && (
                                                            <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 uppercase dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                                                                MASTER
                                                            </span>
                                                        )}
                                                        {row.workflow_type === 'sub_workflow' && (
                                                            <span className="rounded border border-purple-200 bg-purple-50 px-1.5 py-0.5 text-[9px] font-bold text-purple-700 uppercase dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300">
                                                                SUB-WF
                                                            </span>
                                                        )}
                                                        {row.is_default && (
                                                            <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 uppercase">
                                                                DEFAULT
                                                            </span>
                                                        )}
                                                    </div>
                                                    {row.description && (
                                                        <span className="text-muted-foreground line-clamp-1 max-w-[280px] text-[10px]">
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
                                                    className="group hover:border-primary/30 hover:bg-primary/5 -m-1 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-transparent p-1 transition-all hover:shadow-2xs focus:outline-none"
                                                >
                                                    <div className="flex -space-x-1.5">
                                                        {[...Array(Math.min(row.steps_count || 0, 4))].map((_, i) => (
                                                            <div
                                                                key={i}
                                                                className="border-background bg-primary/10 group-hover:bg-primary/20 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors"
                                                            >
                                                                <CheckCircle2 size={9} className="text-primary" />
                                                            </div>
                                                        ))}
                                                        {(row.steps_count || 0) > 4 && (
                                                            <div className="border-background bg-muted text-muted-foreground group-hover:bg-muted/80 flex h-5 w-5 items-center justify-center rounded-full border-2 text-[8px] font-bold">
                                                                +{(row.steps_count || 0) - 4}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-foreground group-hover:text-primary flex items-center gap-1 text-[11px] font-medium group-hover:underline">
                                                        {row.steps_count || 0} Tahap
                                                        <Eye
                                                            size={11}
                                                            className="text-primary opacity-0 transition-opacity group-hover:opacity-100"
                                                        />
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
                                                            <span className="border-border bg-muted/30 text-muted-foreground inline-flex items-center rounded-md border px-2 py-0.5 text-[10px]">
                                                                —
                                                            </span>
                                                        );
                                                    }
                                                    const visibleTypes = types.slice(0, 1);
                                                    const hasMore = types.length > 1;
                                                    return (
                                                        <div className="flex flex-wrap items-center gap-1">
                                                            {visibleTypes.map((t: string, idx: number) => (
                                                                <span
                                                                    key={idx}
                                                                    className="border-border bg-muted/30 text-muted-foreground inline-flex items-center rounded-md border px-2 py-0.5 text-[10px]"
                                                                    title={types.join(', ')}
                                                                >
                                                                    {t}
                                                                </span>
                                                            ))}
                                                            {hasMore && (
                                                                <span
                                                                    className="border-primary/20 bg-primary/5 text-primary inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium"
                                                                    title={types.slice(1).join(', ')}
                                                                >
                                                                    +{types.length - 1}
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </td>

                                            {/* Target Inisiator (initiator_summary) */}
                                            <td className="px-4 py-3">
                                                {(() => {
                                                    const summary = row.initiator_summary || 'Seluruh Staff';
                                                    const items = summary
                                                        .split('|')
                                                        .map((s: string) => s.trim())
                                                        .filter(Boolean);
                                                    const firstItem = items[0] || 'Seluruh Staff';
                                                    const hasMore = items.length > 1;

                                                    return (
                                                        <div className="flex flex-wrap items-center gap-1">
                                                            <span
                                                                className="border-border bg-muted/30 text-foreground inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium"
                                                                title={summary}
                                                            >
                                                                <Users size={10} className="text-muted-foreground shrink-0" />
                                                                <span className="max-w-[150px] truncate">{firstItem}</span>
                                                            </span>
                                                            {hasMore && (
                                                                <span
                                                                    className="border-primary/20 bg-primary/5 text-primary inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9px] font-semibold"
                                                                    title={items.slice(1).join(' | ')}
                                                                >
                                                                    +{items.length - 1}
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </td>

                                            {/* Default */}
                                            <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleToggle(row.id, 'is_default', !!row.is_default, e)}
                                                    disabled={togglingKey === `${row.id}-is_default`}
                                                    title={
                                                        row.is_default
                                                            ? 'Klik untuk membatalkan status alur default'
                                                            : 'Klik untuk jadikan alur default'
                                                    }
                                                    className="group inline-flex cursor-pointer items-center transition-all hover:scale-105 focus:outline-none active:scale-95 disabled:opacity-50"
                                                >
                                                    {row.is_default ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 shadow-2xs group-hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:group-hover:bg-emerald-900/60">
                                                            <CheckCircle2 size={10} /> Ya
                                                        </span>
                                                    ) : (
                                                        <span className="border-border bg-muted/30 text-muted-foreground group-hover:border-primary/30 group-hover:bg-muted group-hover:text-foreground inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]">
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
                                                    title={
                                                        row.is_selectable
                                                            ? 'Klik untuk sembunyikan dari opsi pilihan'
                                                            : 'Klik untuk tampilkan pada opsi pilihan'
                                                    }
                                                    className="group inline-flex cursor-pointer items-center transition-all hover:scale-105 focus:outline-none active:scale-95 disabled:opacity-50"
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
                                                    title={
                                                        row.is_active !== false
                                                            ? 'Klik untuk nonaktifkan alur kerja'
                                                            : 'Klik untuk aktifkan alur kerja'
                                                    }
                                                    className="group inline-flex cursor-pointer items-center transition-all hover:scale-105 focus:outline-none active:scale-95 disabled:opacity-50"
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
                                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={(e) => openPreview(row, e)}
                                                        title="Pratinjau Tahapan (Preview Steps)"
                                                        className="text-primary hover:border-primary/30 hover:bg-primary/10 flex h-7 w-7 items-center justify-center rounded-md border border-transparent transition-all"
                                                    >
                                                        <Eye size={13} />
                                                    </button>
                                                    <button
                                                        onClick={() => openEdit(row)}
                                                        title="Konfigurasi"
                                                        className="text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground flex h-7 w-7 items-center justify-center rounded-md border border-transparent transition-all"
                                                    >
                                                        <GitBranch size={13} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDuplicate(row)}
                                                        title="Duplikat"
                                                        className="text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground flex h-7 w-7 items-center justify-center rounded-md border border-transparent transition-all"
                                                    >
                                                        <Copy size={13} />
                                                    </button>
                                                    {canDelete && (
                                                        <button
                                                            onClick={() => handleDelete(row)}
                                                            title="Hapus"
                                                            className="text-muted-foreground flex h-7 w-7 items-center justify-center rounded-md border border-transparent transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
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
                <DialogContent className="flex max-h-[85vh] max-w-3xl flex-col gap-0 overflow-hidden p-0">
                    {/* Header */}
                    <div className="border-border bg-muted/20 flex items-center justify-between border-b px-6 py-4 dark:bg-zinc-900">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 text-primary border-primary/20 flex h-10 w-10 items-center justify-center rounded-xl border">
                                <GitBranch size={20} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <DialogTitle className="text-foreground text-base font-bold">
                                        {previewWorkflow?.name || 'Pratinjau Alur Kerja'}
                                    </DialogTitle>
                                    {previewWorkflow?.workflow_type === 'main' && (
                                        <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 uppercase dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                                            MASTER
                                        </span>
                                    )}
                                    {previewWorkflow?.workflow_type === 'sub_workflow' && (
                                        <span className="rounded border border-purple-200 bg-purple-50 px-1.5 py-0.5 text-[9px] font-bold text-purple-700 uppercase dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300">
                                            SUB-WF
                                        </span>
                                    )}
                                </div>
                                <DialogDescription className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-2 text-xs">
                                    {/* Tipe Kontrak */}
                                    {(() => {
                                        const types = previewWorkflow?.contract_type_name
                                            ? previewWorkflow.contract_type_name
                                                  .split(',')
                                                  .map((s: string) => s.trim())
                                                  .filter(Boolean)
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
                                                        className="border-primary/20 bg-primary/10 py-0.2 text-primary cursor-help rounded-md border px-1 text-[9px] font-semibold"
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
                                        const items = summary
                                            .split('|')
                                            .map((s: string) => s.trim())
                                            .filter(Boolean);
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
                                                        className="border-primary/20 bg-primary/10 py-0.2 text-primary cursor-help rounded-md border px-1 text-[9px] font-semibold"
                                                        title={items.slice(1).join(' | ')}
                                                    >
                                                        +{remainingItems}
                                                    </span>
                                                )}
                                            </span>
                                        );
                                    })()}
                                    <span>•</span>
                                    <span>
                                        Total: <strong className="text-foreground">{(previewWorkflow?.steps || []).length} Tahapan</strong>
                                    </span>
                                </DialogDescription>
                            </div>
                        </div>
                    </div>

                    {/* Body: Step List Timeline */}
                    <div className="max-h-[60vh] flex-1 space-y-4 overflow-y-auto p-6">
                        {isLoadingPreview ? (
                            <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-16">
                                <Loader2 size={24} className="text-primary animate-spin" />
                                <span className="text-xs font-medium">Memuat konfigurasi tahapan alur kerja...</span>
                            </div>
                        ) : previewWorkflow && (!previewWorkflow.steps || previewWorkflow.steps.length === 0) ? (
                            <div className="text-muted-foreground py-12 text-center">
                                <Layers size={32} className="mx-auto mb-2 opacity-30" />
                                <p className="text-sm font-medium">Alur kerja ini belum memiliki konfigurasi tahapan.</p>
                                <p className="text-muted-foreground mt-1 text-xs">Buka halaman edit untuk menambahkan tahapan approval.</p>
                            </div>
                        ) : (
                            <div className="before:bg-border/60 relative space-y-4 pl-6 before:absolute before:top-3 before:bottom-3 before:left-3 before:w-0.5">
                                {(previewWorkflow?.steps || []).map((step: any, index: number) => {
                                    const stepAuthorities = step.approver_authorities || step.approverAuthorities || [];
                                    const actions = step.actions || [];

                                    return (
                                        <div key={step.id || index} className="group relative">
                                            {/* Step Circle Indicator */}
                                            <div className="border-background bg-primary absolute top-2 -left-6 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border-2 text-[10px] font-bold text-white shadow-xs">
                                                {step.step || index + 1}
                                            </div>

                                            {/* Step Card */}
                                            <div className="border-border/70 bg-card hover:border-primary/40 rounded-xl border p-4 shadow-2xs transition-colors">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="space-y-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h4 className="text-foreground text-sm font-semibold">
                                                                {step.label || step.description || `Tahap ${step.step || index + 1}`}
                                                            </h4>
                                                            {step.is_optional && (
                                                                <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                                                                    Opsional
                                                                </span>
                                                            )}
                                                            {step.approver_type && (
                                                                <span className="border-border bg-muted/40 text-muted-foreground rounded-md border px-1.5 py-0.5 text-[9px] font-medium capitalize">
                                                                    Tipe: {step.approver_type.replace('_', ' ')}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {step.description && step.description !== step.label && (
                                                            <p className="text-muted-foreground line-clamp-2 text-xs">{step.description}</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Authorities / Aktor yang berhak */}
                                                <div className="border-border/50 mt-3 flex flex-col gap-2 border-t pt-3">
                                                    <div className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium">
                                                        <UserCheck size={12} className="text-primary" />
                                                        <span>Aktor / Otoritas Persetujuan:</span>
                                                    </div>

                                                    {stepAuthorities.length === 0 ? (
                                                        <div className="text-muted-foreground pl-4 text-[11px] italic">
                                                            {step.approver_type === 'initiator'
                                                                ? 'Inisiator Pengajuan'
                                                                : step.approver_type === 'assigned_pic'
                                                                  ? 'PIC Legal yang Ditugaskan'
                                                                  : step.approver_type === 'atasan'
                                                                    ? 'Atasan Langsung Inisiator'
                                                                    : 'Mengikuti konfigurasi default sistem'}
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
                                                                if (
                                                                    auth.authority_type &&
                                                                    auth.authority_type !== 'group' &&
                                                                    auth.authority_type !== 'role'
                                                                ) {
                                                                    parts.push(auth.authority_type);
                                                                }

                                                                return (
                                                                    <span
                                                                        key={auth.id || aIdx}
                                                                        className="border-primary/20 bg-primary/5 text-foreground inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium"
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
                                                    <div className="border-border/40 mt-2.5 flex flex-wrap items-center gap-1.5 border-t pt-2.5">
                                                        <span className="text-muted-foreground mr-1 text-[10px]">Aksi Tersedia:</span>
                                                        {actions.map((act: any, actIdx: number) => {
                                                            const isApprove = act.action_code === 'approve';
                                                            const isReject = act.action_code === 'reject';
                                                            const label = act.alias || act.master_action_name || act.action_code || 'Aksi';

                                                            return (
                                                                <span
                                                                    key={act.id || actIdx}
                                                                    className={cn(
                                                                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold',
                                                                        isApprove &&
                                                                            'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
                                                                        isReject &&
                                                                            'border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
                                                                        !isApprove &&
                                                                            !isReject &&
                                                                            'border-border bg-muted text-muted-foreground border',
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
                    <div className="border-border bg-muted/10 flex items-center justify-between border-t px-6 py-3">
                        <span className="text-muted-foreground text-xs">
                            Klik <strong>Buka Editor</strong> untuk mengubah konfigurasi lengkap.
                        </span>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setPreviewWorkflow(null)}>
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
