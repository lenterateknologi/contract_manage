import { Button } from '@/components/ui/buttons/Button';
import { useToast } from '@/components/ui/feedback/Toast';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import {
    CheckCircle2,
    Copy,
    Eye,
    EyeOff,
    GitBranch,
    Layers,
    Plus,
    ShieldCheck,
    Tag,
    Trash2,
    UserCircle,
    XCircle,
} from 'lucide-react';
import { PageTable } from '@/components/ui/navigation/PageTable';
import { useMemo, useState } from 'react';

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

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
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
            <table className="w-full text-xs">
                <thead>
                    <tr className="border-b border-border/60 bg-muted/30">
                        <th className="w-10 px-4 py-3">
                            <input
                                type="checkbox"
                                className="h-3.5 w-3.5 rounded border-border"
                                checked={selectedIds.size === rows.length && rows.length > 0}
                                onChange={(e) => {
                                    if (e.target.checked) setSelectedIds(new Set(rows.map((r) => r.id)));
                                    else setSelectedIds(new Set());
                                }}
                            />
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <GitBranch size={12} /> Identitas Alur
                            </div>
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <ShieldCheck size={12} /> Otoritas Inisiasi
                            </div>
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <Layers size={12} /> Tahapan
                            </div>
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <Tag size={12} /> Tipe Pengajuan
                            </div>
                        </th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                            <div className="flex items-center justify-center gap-1.5">
                                <Eye size={12} /> Tampil
                            </div>
                        </th>
                        <th className="w-28 px-4 py-3" />
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                    {grouped.size === 0 ? (
                        <tr>
                            <td colSpan={7} className="py-16 text-center text-muted-foreground">
                                <GitBranch size={24} className="mx-auto mb-2 opacity-30" />
                                <p>Belum ada alur kerja terdaftar</p>
                            </td>
                        </tr>
                    ) : (
                        [...grouped.entries()].map(([typeName, items]) => (
                            <>
                                {/* Category sub-header row */}
                                <tr key={`group-${typeName}`} className="bg-muted/20 border-t border-border/50">
                                    <td colSpan={7} className="px-4 py-2">
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

                                        {/* Initiator */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-muted/40">
                                                    <UserCircle size={12} className="text-muted-foreground" />
                                                </div>
                                                <span className="text-[11px] text-foreground">
                                                    {row.initiator_summary || INITIATOR_LABELS[row.initiator_type] || row.initiator_type || 'Seluruh Staff'}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Steps */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="flex -space-x-1.5">
                                                    {[...Array(Math.min(row.steps_count || 0, 4))].map((_, i) => (
                                                        <div
                                                            key={i}
                                                            className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-primary/10"
                                                        >
                                                            <CheckCircle2 size={9} className="text-primary" />
                                                        </div>
                                                    ))}
                                                    {(row.steps_count || 0) > 4 && (
                                                        <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-muted text-[8px] font-bold text-muted-foreground">
                                                            +{(row.steps_count || 0) - 4}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-[11px] font-medium text-foreground">
                                                    {row.steps_count || 0} Tahap
                                                </span>
                                            </div>
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
                                                const visibleTypes = types.slice(0, 2);
                                                const hasMore = types.length > 2;
                                                return (
                                                    <div className="flex flex-wrap gap-1 items-center">
                                                        {visibleTypes.map((t: string, idx: number) => (
                                                            <span key={idx} className="inline-flex items-center rounded-md border border-border bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground">
                                                                {t}
                                                            </span>
                                                        ))}
                                                        {hasMore && (
                                                            <span className="inline-flex items-center rounded-md border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary">
                                                                +{types.length - 2}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </td>

                                        {/* Tampil (is_active) */}
                                        <td className="px-4 py-3 text-center">
                                            {row.is_active !== false ? (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                                                    <Eye size={10} /> Ya
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700">
                                                    <EyeOff size={10} /> Tidak
                                                </span>
                                            )}
                                        </td>

                                        {/* Row Actions */}
                                        <td
                                            className="px-4 py-3"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="flex items-center justify-end gap-1">
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
                            </>
                        ))
                    )}
                </tbody>
            </table>
        </PageTable>
    );
}

declare let route: any;
